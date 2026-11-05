import { expect, test } from '@playwright/test';

async function enterLocalPreview(page: import('@playwright/test').Page) {
  // Local tests do not need to contact third-party image/video hosts with the
  // original family album URLs.
  await page.route(/https:\/\/(?:[^/]+\.)?googleusercontent\.com\//, (route) => route.abort());
  await page.route('https://photos.app.goo.gl/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: /Explore local preview/ }).click();
  await expect(page.getByRole('heading', { name: 'Keep the good close.' })).toBeVisible();
}

async function scrollThroughLazyMedia(page: import('@playwright/test').Page) {
  const { height, step } = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    step: Math.max(220, window.innerHeight * 0.75),
  }));
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(120);
}

test('navigation and local-only states are clear', async ({ page }, testInfo) => {
  await enterLocalPreview(page);
  await expect(page.getByText(/account and shared data services are not configured/i)).toBeVisible();
  const featuredImage = page.locator('main img[alt^="Family memory from"]').first();
  await expect(featuredImage).toHaveAttribute('src', /\/photos\//);
  await expect.poll(() => featuredImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });

  const nav = page.locator('nav[aria-label="Main navigation"] a');
  for (let index = 0; index < 5; index += 1) {
    await expect(nav.nth(index)).toBeInViewport();
  }
  await nav.nth(4).click();
  await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
  await expect(page.getByText(/Shared chat needs an authenticated account/i)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('chat.png'), fullPage: true });

  await nav.nth(2).click();
  await expect(page.getByRole('heading', { name: 'Our Circle Arcade' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('play.png'), fullPage: true });
  await page.getByRole('button', { name: 'Scores' }).click();
  await expect(page.getByText(/No scores saved on this device yet/i)).toBeVisible();
  await expect(page.getByText(/not shared with other players/i)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('scores.png'), fullPage: true });
});

test('calendar event can be created, edited, and deleted in local preview', async ({ page }, testInfo) => {
  await enterLocalPreview(page);
  await page.locator('nav[aria-label="Main navigation"] a').nth(3).click();
  await expect(page.getByRole('heading', { name: 'Family Calendar' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('calendar.png'), fullPage: true });
  await page.getByRole('button', { name: 'Add Event' }).click();

  await page.getByPlaceholder(/Diwali Reunion/).fill('E2E Family Gathering');
  await page.locator('input[type="date"]').fill('2030-06-15');
  await page.getByRole('button', { name: 'Save Event' }).click();
  await expect(page.getByText('E2E Family Gathering')).toBeVisible();

  await page.getByRole('button', { name: 'Edit E2E Family Gathering' }).click();
  await page.getByPlaceholder(/Diwali Reunion/).fill('E2E Family Gathering Updated');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('E2E Family Gathering Updated')).toBeVisible();

  await page.getByRole('button', { name: 'Delete E2E Family Gathering Updated' }).click();
  await expect(page.getByText('E2E Family Gathering Updated')).toHaveCount(0);
});

test('memories and mobile pages fit the viewport', async ({ page }, testInfo) => {
  await enterLocalPreview(page);
  const viewportWidth = page.viewportSize()?.width ?? 999;
  const homeDimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(homeDimensions.content).toBeLessThanOrEqual(homeDimensions.viewport + 1);
  if (viewportWidth < 600) await page.screenshot({ path: testInfo.outputPath('mobile-home.png'), fullPage: true });

  await page.locator('nav[aria-label="Main navigation"] a').nth(1).click();
  await expect(page.locator('[aria-label="Family video archive"]')).toBeVisible();
  await scrollThroughLazyMedia(page);
  await page.screenshot({ path: testInfo.outputPath('memories.png'), fullPage: true });
  const memoryDimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(memoryDimensions.content).toBeLessThanOrEqual(memoryDimensions.viewport + 1);
});

test('external video providers load only after an explicit user action', async ({ page }, testInfo) => {
  let youtubeRequests = 0;
  await page.route('https://www.youtube-nocookie.com/**', async (route) => {
    youtubeRequests += 1;
    await route.abort();
  });
  await enterLocalPreview(page);
  await page.locator('nav[aria-label="Main navigation"] a').nth(1).click();
  await expect(page.locator('[aria-label="Family video archive"]')).toBeVisible();
  await page.getByRole('button', { name: 'Add a video link' }).click();
  await page.getByPlaceholder(/video-host\.example/).fill('https://youtu.be/abcdefghijk');
  await page.getByRole('button', { name: 'Add to Randomization' }).click();
  await expect(page.getByRole('button', { name: 'Load YouTube player' })).toBeVisible();
  expect(youtubeRequests).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('video-provider-consent.png') });

  await page.getByRole('button', { name: 'Load YouTube player' }).click();
  await expect.poll(() => youtubeRequests).toBeGreaterThan(0);
});

test('settings and trip plan do not invent profile, destination, or payments', async ({ page }, testInfo) => {
  await enterLocalPreview(page);
  await page.getByRole('link', { name: 'Profile and settings' }).click();
  await expect(page.getByRole('heading', { name: 'Profile & settings' })).toBeVisible();
  await expect(page.getByText('Local preview has no signed-in profile.')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('settings.png'), fullPage: true });

  await page.getByRole('button', { name: /Trip fund/ }).click();
  await expect(page.getByRole('heading', { name: 'Trip fund' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No trip planned yet' })).toBeVisible();
  await expect(page.getByText(/Payments are disabled/i)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('trip-fund.png'), fullPage: true });
});
