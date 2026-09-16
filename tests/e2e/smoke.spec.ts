import { test, expect } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('홈: 카드가 렌더되고 첫 카드가 featured', async ({ page }) => {
  await page.goto('./');
  const cards = page.locator('a.card');
  expect(await cards.count()).toBeGreaterThan(10);
  await expect(cards.first()).toHaveClass(/featured/);
});

test('카테고리 탭: algorithm 탭은 algorithm 칩만 보여준다', async ({ page }) => {
  await page.goto('./');
  await page.locator('nav.tabs').getByRole('link', { name: /Algorithm/ }).click();
  await expect(page).toHaveURL(/category\/algorithm\/$/);
  const chips = page.locator('a.card .chip');
  const texts = await chips.allTextContents();
  expect(texts.every((t) => t.trim() === 'Algorithm')).toBe(true);
});

test('본문(terraform-도입기): TOC 링크가 앵커로 이동하고 velog 원문 링크가 있다', async ({ page }) => {
  await page.goto(encodeURI('./posts/terraform-도입기/'));
  const toc = page.locator('nav.toc a').first();
  expect(await toc.count()).toBeGreaterThan(0);
  const href = await toc.getAttribute('href');
  await toc.click();
  // href is the raw attribute value (e.g. "#들어가며"); the browser reports the URL
  // with the fragment percent-encoded, so encode before matching.
  const encodedHref = '#' + encodeURIComponent(href!.slice(1));
  await expect(page).toHaveURL(new RegExp(escapeRegExp(encodedHref) + '$'));
  await expect(page.locator('a[data-outbound="velog"]')).toBeVisible();
});

test('테마 토글이 data-theme 를 바꾸고 새로고침 후 유지된다', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: '테마 전환' }).click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  expect(await html.getAttribute('data-theme')).toBe(after);
});
