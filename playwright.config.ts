import { defineConfig, devices } from '@playwright/test';

const isCi = process.env['CI'] !== undefined;

/** Runs against the production bundle (`vite preview`), on a phone viewport. */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 2 : 4,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  projects: [{ name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
