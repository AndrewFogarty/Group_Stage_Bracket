const { test, expect } = require("@playwright/test");

test("loads, and a scoreline updates the standings", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/World Cup 2026/);

  // first group's first match: enter 3-0
  const group = page.locator(".group-card").first();
  const goals = group.locator(".goal");
  await goals.nth(0).fill("3");
  await goals.nth(1).fill("0");

  // top of the standings table should now show a team on 3 points
  await expect(group.locator("table.standings td.pts").first()).toHaveText("3");
});

test("submitting adds an entry to the leaderboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("#username").fill("e2e-bot");
  await page.locator("#submit-bracket").click();
  await expect(page.locator("#leaderboard-table")).toContainText("e2e-bot");
});
