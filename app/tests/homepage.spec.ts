import { test, expect } from "@playwright/test";

test("homepage button click leads to auth", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await page.getByRole("button", { name: "Sign in with Strava" }).click();

  await expect(page).toHaveURL(/.*strava.com\/login.*/);
});
