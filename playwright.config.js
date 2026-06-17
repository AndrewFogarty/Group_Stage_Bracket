const { defineConfig } = require("@playwright/test");

// E2E config. Serves the static site, then drives a real browser.
// Run locally: npm i -D @playwright/test && npx playwright install && npm run test:e2e
module.exports = defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "python3 -m http.server 4173",
    port: 4173,
    reuseExistingServer: true,
  },
});
