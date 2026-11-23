import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/play');
});

async function startTrip(page: import('@playwright/test').Page) {
  for (const [index, name] of ['Ana', 'Ben', 'Cy', 'Di'].entries()) {
    await page.getByLabel(`Player ${index + 1}`, { exact: true }).fill(name);
  }
  await page.getByRole('button', { name: 'Car' }).click();
  await page.getByRole('button', { name: 'Deal the first scene' }).click();
}

test('plays a scene from deal to banked mile', async ({ page }) => {
  await startTrip(page);
  await expect(page.getByText('Ana opens.')).toBeVisible();
  await expect(page.getByRole('article', { name: /^Where:/ })).toBeVisible();
  await expect(page.getByRole('article', { name: /^Who:/ })).toBeVisible();

  await page.getByRole('button', { name: 'Start the scene' }).click();
  await expect(page.getByRole('timer')).toBeVisible();

  await page.getByRole('button', { name: 'Land it' }).click();
  await expect(page.getByText('Whoever has the turn says one last line')).toBeVisible();

  await page.getByPlaceholder('Dad was the GPS').fill('Ben was a very polite pirate');
  await page.getByRole('button', { name: 'Bank the mile' }).click();
  await expect(page.getByText('Ben opens.')).toBeVisible();
  await expect(page.getByLabel('1 mile together')).toBeVisible();
});

test('keeps the trip across a reload', async ({ page }) => {
  await startTrip(page);
  await page.getByRole('button', { name: 'Start the scene' }).click();
  await page.getByRole('button', { name: 'Land it' }).click();
  await page.getByRole('button', { name: 'Bank the mile' }).click();
  await page.reload();
  await expect(page.getByLabel('1 mile together')).toBeVisible();
  await page.getByRole('tab', { name: 'Trips' }).or(page.getByText('Trips', { exact: true })).first().click();
  await expect(page.getByRole('heading', { name: 'Sunday drive' })).toBeVisible();
});

test('swaps a card before the scene starts', async ({ page }) => {
  await startTrip(page);
  const where = page.getByRole('article', { name: /^Where:/ });
  const before = await where.getAttribute('aria-label');
  await page.getByRole('button', { name: 'Swap the where card' }).click();
  await expect(where).not.toHaveAttribute('aria-label', before ?? '');
});

test('plays a warm-up instead of a scene', async ({ page }) => {
  await startTrip(page);
  await page.getByRole('button', { name: 'Warm-up instead' }).click();
  await expect(page.getByRole('article', { name: /^Warm-up:/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start the warm-up' }).click();
  await page.getByRole('button', { name: 'Bank the mile' }).click();
  await expect(page.getByLabel('1 mile together')).toBeVisible();
});

test('shows the whole deck', async ({ page }) => {
  await page.goto('/cards');
  await expect(page.getByRole('heading', { name: 'The deck' })).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();
});
