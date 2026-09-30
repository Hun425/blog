/**
 * 글 속 캔버스 애니메이션 공용 러너.
 * - 화면에 보일 때만 requestAnimationFrame 루프를 돈다.
 * - prefers-reduced-motion 이면 마지막 장면(progress=1)만 그린다.
 * - 단계별 데모는 now·reduced 로 직접 진행하고, 버튼 조작 뒤 redraw() 를 부른다.
 * - 테마 전환(themechange)·리사이즈 때 다시 그린다.
 */

export type Palette = {
  bg: string; surface: string; surface2: string; line: string;
  ink: string; ink2: string; ink3: string;
  accent: string; accentSoft: string;
  /** 색 블록 위 글자색 */
  onFill: string;
  orange: string; teal: string; pink: string; purple: string;
};

export type Frame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  /** 0~1 재생 진행률 (정지 구간에서는 1) */
  p: number;
  /** performance.now() 기준 현재 시각 */
  now: number;
  reduced: boolean;
  colors: Palette;
  font: string;
  mono: string;
};

type Options = {
  /** 한 번 재생에 걸리는 시간(ms) */
  duration: number;
  /** 재생이 끝난 뒤 마지막 장면을 보여 주는 시간(ms) */
  hold?: number;
  /** 폭에 따라 캔버스 높이를 정한다 */
  height: (width: number) => number;
  draw: (f: Frame) => void;
  /** 화면에 들어올 때마다 불린다 (처음부터 다시 재생할 때 사용) */
  onEnter?: (now: number) => void;
};

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    bg: v('--bg'), surface: v('--surface'), surface2: v('--surface-2'), line: v('--line'),
    ink: v('--ink'), ink2: v('--ink-2'), ink3: v('--ink-3'),
    accent: v('--accent'), accentSoft: v('--accent-soft'), onFill: v('--accent-ink'),
    orange: v('--c-algorithm'), teal: v('--c-infra'), pink: v('--c-career'), purple: v('--c-cs'),
  };
}

export function mountDemo(canvas: HTMLCanvasElement, opts: Options) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = opts.hold ?? 2200;
  const cycle = opts.duration + hold;
  const font = getComputedStyle(document.body).fontFamily;
  const mono = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  let colors = readPalette();
  let raf = 0;
  let visible = false;
  let start = performance.now();

  const render = (now: number) => {
    const width = canvas.parentElement!.clientWidth;
    const height = opts.height(width);
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`;
    }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const p = reduced ? 1 : Math.min(1, ((now - start) % cycle) / opts.duration);
    opts.draw({ ctx, width, p, now, reduced, colors, font, mono });
  };

  const loop = (now: number) => {
    render(now);
    if (visible && !reduced) raf = requestAnimationFrame(loop);
  };

  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was) {
      start = performance.now(); // 보이기 시작할 때 처음부터 재생
      opts.onEnter?.(start);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    } else if (!visible) {
      cancelAnimationFrame(raf);
    }
  }, { threshold: 0.25 }).observe(canvas);

  const redraw = () => { if (!visible || reduced) requestAnimationFrame(render); };
  window.addEventListener('themechange', () => { colors = readPalette(); redraw(); });
  new ResizeObserver(redraw).observe(canvas.parentElement!);
  requestAnimationFrame(render);
  return { redraw: () => requestAnimationFrame(render) };
}

/* ---------- 그리기 도우미 ---------- */

export const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
/** p 가 [a, b] 구간을 지나는 동안 0→1 */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const ww = Math.max(0, w);
  const rr = Math.max(0, Math.min(r, ww / 2, h / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, ww, h, rr);
}

/** 사선 무늬 채우기 (대기 구간 표시용) */
export function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  if (w <= 0) return;
  ctx.save();
  roundRect(ctx, x, y, w, h, 3);
  ctx.clip();
  ctx.fillStyle = mix(color, 0.12);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = mix(color, 0.55);
  ctx.lineWidth = 1.2;
  for (let i = -h; i < w; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** '#RRGGBB' 색에 투명도를 준다 */
export function mix(hex: string, alpha: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** 폭에 맞으면 그리고, 넘치면 그리지 않는다 */
export function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) ctx.fillText(text, x, y);
}

/** 레인 위 작업 블록. 폭이 모자라면 short 라벨, 그래도 모자라면 라벨 없이 그린다 */
export function taskBlock(
  f: Frame, x: number, y: number, w: number, h: number,
  color: string, label: string, short = label, fullWidth = w,
) {
  const { ctx, colors, font } = f;
  if (w <= 0) return;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = colors.onFill;
  ctx.font = `600 ${f.width < 520 ? 10.5 : 11.5}px ${font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const room = Math.min(w - 8, fullWidth - 10);
  const text = ctx.measureText(label).width <= room ? label : short;
  fitText(ctx, text, x + 5, y + h / 2 + 0.5, room);
}

/** 화살표 */
export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * 5, y2 - Math.sin(a) * 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.45) * 8, y2 - Math.sin(a - 0.45) * 8);
  ctx.lineTo(x2 - Math.cos(a + 0.45) * 8, y2 - Math.sin(a + 0.45) * 8);
  ctx.fill();
  ctx.lineWidth = 1;
}
