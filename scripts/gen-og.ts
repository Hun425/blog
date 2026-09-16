// scripts/gen-og.ts   (실행: npm run gen:og)
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const COLORS: Record<string, string> = {
  default: '#1F4FD8', backend: '#1F4FD8', cs: '#7C3AED', infra: '#0F766E', algorithm: '#B45309', career: '#BE185D',
};
const LABEL: Record<string, string> = { default: 'hun425.log', backend: 'Backend', cs: 'CS', infra: 'Infra', algorithm: 'Algorithm', career: 'Career' };

mkdirSync('public/og', { recursive: true });
for (const [key, color] of Object.entries(COLORS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E1217"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="72" y="72" width="14" height="14" rx="3" fill="${color}"/>
    <text x="100" y="86" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#E6EAF0">hun425.log</text>
    <text x="72" y="560" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">${LABEL[key]}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/og/${key}.png`);
  console.log('wrote public/og/' + key + '.png');
}
