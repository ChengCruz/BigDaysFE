/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

function getReportFolder(): string {
  const specArgs = process.argv.filter((a: string) => a.endsWith('.spec.ts'));
  let module = 'all';
  if (specArgs.length === 1) {
    const match = specArgs[0].match(/([^/\\]+)\.spec\.ts$/);
    if (match) module = match[1];
  }
  const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
  return `playwright-reports/${module}_${ts}`;
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['html', { open: 'never', outputFolder: getReportFolder() }]],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'msedge', viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: 'npx vite --port 5199 --mode test',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BASE: process.env.VITE_API_BASE ?? 'http://localhost:5199/__mock_api__',
      VITE_API_KEY: process.env.VITE_API_KEY ?? 'test',
      VITE_API_AUTHOR: process.env.VITE_API_AUTHOR ?? 'test',
    },
  },
});
