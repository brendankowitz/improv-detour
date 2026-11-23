import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/quick');
});

test('deals a stand-alone scene with a rule, plays it and deals the next', async ({ page }) => {
  await page.getByRole('button', { name: /^Scene/ }).click();
  await expect(page.getByText('Opens', { exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: /^Where:/ })).toBeVisible();
  await expect(page.getByRole('article', { name: /^Who:/ })).toBeVisible();
  await expect(page.getByRole('article', { name: /^How:/ })).toBeVisible();

  await page.getByRole('button', { name: 'Start the scene' }).click();
  await page.getByRole('button', { name: 'Land it' }).click();
  await expect(page.getByText(/last line\.$/)).toBeVisible();
  await expect(page.getByText('Keep a souvenir?')).toHaveCount(0);

  await page.getByRole('button', { name: 'Next scene' }).click();
  await expect(page.getByRole('button', { name: 'Start the scene' })).toBeVisible();
});

test('deals a warm-up and saves nothing to Trips', async ({ page }) => {
  await page.getByRole('button', { name: /^Warm-up/ }).click();
  await expect(page.getByRole('article', { name: /^Warm-up:/ })).toBeVisible();
  await expect(page.getByText(/^Start with:/)).toBeVisible();
  await page.getByRole('button', { name: 'Start the warm-up' }).click();
  await page.getByRole('button', { name: 'Next warm-up' }).click();
  await expect(page.getByRole('button', { name: 'Start the warm-up' })).toBeVisible();

  expect(await page.evaluate(() => localStorage.getItem('detour.v1'))).toBeNull();
});

test('draws single cards one after another, then goes back to the list', async ({ page }) => {
  await page.getByRole('button', { name: /^Character/ }).click();
  const card = page.getByRole('article', { name: /^Who:/ });
  const first = await card.getAttribute('aria-label');
  await page.getByRole('button', { name: 'Draw another' }).click();
  await expect(card).not.toHaveAttribute('aria-label', first ?? '');

  await page.getByRole('button', { name: 'Quick play' }).click();
  await expect(page.getByRole('button', { name: /^Twist/ })).toBeVisible();
});
