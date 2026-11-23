import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/play');
});

/** Ionic's iOS scroll assist briefly clones a focused input; always target the real one. */
function field(page: Page, label: string) {
  return page.locator(`input[aria-label="${label}"]:not(.cloned-input)`);
}

async function name(page: Page, index: number, value: string) {
  const input = field(page, `Player ${index}`);
  await input.click();
  await input.fill(value);
}

async function startTrip(page: Page, length: 'short' | 'standard' | 'open' = 'standard') {
  for (const [index, value] of ['Ana', 'Ben', 'Cy', 'Di'].entries()) await name(page, index + 1, value);
  // Ionic segments render their button in shadow DOM; click the host element.
  await page.locator(`ion-segment-button[value="${length}"]`).click();
  await page.getByRole('button', { name: 'Start the trip' }).click();
}

/** Plays whatever stop is showing through to the next one. */
async function playStop(page: Page) {
  const start = page.getByRole('button', { name: /^Start the (warm-up|scene|arrival)$/ });
  await start.click();
  const land = page.getByRole('button', { name: 'Land it' });
  if (await land.isVisible()) await land.click();
  await page.getByRole('button', { name: /^(Bank the mile|Finish the trip)$/ }).click();
}

test('keeps every player name in its own seat', async ({ page }) => {
  for (const [index, value] of ['Ana', 'Ben', 'Cy', 'Di'].entries()) await name(page, index + 1, value);
  for (const [index, value] of ['Ana', 'Ben', 'Cy', 'Di'].entries()) {
    await expect(field(page, `Player ${index + 1}`)).toHaveValue(value);
  }
});

test('opens a trip with a warm-up, then casts a scene', async ({ page }) => {
  await startTrip(page);
  await expect(page.getByRole('article', { name: /^Warm-up:/ })).toBeVisible();
  await expect(page.getByText(/^Stop 1 of 6/)).toBeVisible();
  await playStop(page);

  await expect(page.getByText('Opens', { exact: true })).toBeVisible();
  await expect(page.getByText('Partner', { exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: /^Where:/ })).toBeVisible();
  await expect(page.getByRole('article', { name: /^Who:/ })).toBeVisible();
  await expect(page.getByRole('article', { name: /^How:/ })).toHaveCount(0);
});

test('plays a scene through the last line and keeps a souvenir', async ({ page }) => {
  await startTrip(page);
  await playStop(page);
  await page.getByRole('button', { name: 'Start the scene' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await page.getByRole('button', { name: 'Land it' }).click();
  await expect(page.getByText(/, last line\.$/)).toBeVisible();
  await field(page, 'Souvenir').fill('the waffle ticket');
  await page.getByRole('button', { name: 'Bank the mile' }).click();
  await expect(page.getByText(/^Stop 3 of 6/)).toBeVisible();
});

test('a short trip ends at the destination with a postcard', async ({ page }) => {
  await startTrip(page, 'short');
  for (let stop = 0; stop < 3; stop++) await playStop(page);
  await expect(page.getByRole('article', { name: /^Destination:/ })).toBeVisible();
  await playStop(page);
  await expect(page.getByRole('article', { name: 'Postcard' })).toBeVisible();
  await expect(page.getByText('Greetings from')).toBeVisible();
  await page.getByRole('button', { name: 'New trip' }).click();
  await expect(page.getByRole('button', { name: /^(Start the trip|Add \d)/ })).toBeVisible();
});

test('swaps a card before the scene starts', async ({ page }) => {
  await startTrip(page);
  await playStop(page);
  const where = page.getByRole('article', { name: /^Where:/ });
  const before = await where.getAttribute('aria-label');
  await page.getByRole('button', { name: 'Swap the where card' }).click();
  await expect(where).not.toHaveAttribute('aria-label', before ?? '');
});

test('keeps the trip across a reload and lists it in Trips', async ({ page }) => {
  await startTrip(page);
  await playStop(page);
  await page.reload();
  await expect(page.getByText(/^Stop 2 of 6/)).toBeVisible();
  await page.goto('/trips');
  await expect(page.getByRole('heading', { name: 'Sunday drive' })).toBeVisible();
});

test('shows the whole deck', async ({ page }) => {
  await page.goto('/cards');
  await expect(page.getByText(/^\d+ cards\./)).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();
});
