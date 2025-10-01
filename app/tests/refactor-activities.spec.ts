import { test, expect } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "strava_access_token",
      value: "test-token-123",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);
});

test("refactor activites  - fill input, pick select, click button", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/refactor-activities");

  await page.getByTestId("activity-name-input").fill("Florbal");

  await page.getByTestId("new-type-select").selectOption("Workout");

  await page.getByRole("button", { name: "Run" }).click();

  await expect(page).toHaveURL(
    /.*refactor-activities\?q=Florbal&target=Workout.*/,
  );
});
