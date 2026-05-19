import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/",
  "/trips",
  "/discover",
  "/itinerary",
  "/map",
  "/stays",
  "/currency",
  "/budget",
  "/bookings",
  "/documents",
  "/today",
];

test.describe.configure({ mode: "serial" });

test("core routes load without framework overlays or browser errors", async ({ page }) => {
  for (const route of routes) {
    const errors = await visitAndCollectErrors(page, route);
    await expect(page.locator("body")).not.toContainText(/Build Error|Runtime Error|Application error/i);
    expect(errors, `${route} console errors`).toEqual([]);
  }
});

test("active trip context stays consistent across route navigation", async ({ page }) => {
  for (const route of ["/trips", "/discover", "/itinerary"]) {
    await page.goto(route);
    await expect(page.getByText(/Byblos/i).first()).toBeVisible();
    await expect(page.getByText(/Lebanon/i).first()).toBeVisible();
  }
});

test("discover saved places persist across a real refresh and removal", async ({ page }) => {
  await page.goto("/discover");
  await page.getByRole("button", { name: /^All/i }).click();
  await page.getByRole("button", { name: /Byblos Old Souk/i }).click();
  await page.getByRole("button", { name: /Stack/i }).click();
  await expect(page.getByText(/Place saved for itinerary planning/i)).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /^Saved/i }).click();
  await expect(page.getByRole("button", { name: /Byblos Old Souk/i })).toBeVisible();

  await page.getByRole("button", { name: /Byblos Old Souk/i }).click();
  await page.getByRole("button", { name: /Drop/i }).click();
  await expect(page.getByText(/Place removed from saved places/i)).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /^Saved/i }).click();
  await expect(page.getByRole("button", { name: /Byblos Old Souk/i })).toHaveCount(0);
});

test("map and stays show honest mapped or unavailable states", async ({ page }) => {
  await page.goto("/map");
  await expect(
    page.getByText(/Incomplete Mapping/i).or(page.getByRole("region", { name: /Map/i })),
  ).toBeVisible();
  await expect(page.getByText(/Unmapped Cafe/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open in Google Maps/i })).toBeVisible();

  await page.goto("/stays");
  await expect(page.getByText(/Stay Strategy/i)).toBeVisible();
  await expect(page.getByText(/No live inventory|Live provider stays/i)).toBeVisible();
  await expect(page.getByText(/Live Accommodation Hub/i)).toBeVisible();
  await expect(page.getByText(/Inventory Protocol Note/i)).toBeVisible();
});

test("currency page stays honest when the pair is unsupported", async ({ page }) => {
  await page.goto("/currency");
  await expect(page.getByText(/Destination currency/i)).toBeVisible();
  await expect(
    page.getByText(/Destination conversion unavailable|Exchange rate unavailable|Frankfurter did not return|FX MISSING/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/No conversion is shown until a valid provider rate is available/i)).toBeVisible();
});

test("booking creation survives a browser refresh", async ({ page }) => {
  await page.goto("/bookings");
  await page.getByRole("button", { name: /New Record|Add/i }).first().click();
  await page.locator('input[name="title"]').fill("E2E Harbor Dinner");
  await page.locator('input[name="provider"]').fill("Manual");
  await page.locator('input[name="confirmationNumber"]').fill("E2E-BOOKING");
  await page.locator('input[name="startAt"]').fill("2026-05-19");
  await page.getByRole("button", { name: /Save Record|Save Booking/i }).click();
  await expect(page.getByText("E2E Harbor Dinner").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("E2E Harbor Dinner").first()).toBeVisible();
});

test("document upload renders an inline preview after refresh", async ({ page }) => {
  await page.goto("/documents");
  await page.locator("aside button:visible").first().click();
  await page.locator('input[name="title"]').fill("E2E passport");
  await page.locator('input[name="file"]').setInputFiles({
    name: "passport.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aV0AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: /Create/i }).click();
  await expect(page.getByText(/Uploaded attachment/i)).toBeVisible();
  await expect(page.locator('img[alt$="passport.png"]')).toBeVisible();

  await page.reload();
  await expect(page.getByText(/Uploaded attachment/i)).toBeVisible();
  await expect(page.locator('img[alt$="passport.png"]')).toBeVisible();
});

async function visitAndCollectErrors(page: Page, route: string) {
  const errors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") errors.push(message.text());
  };
  page.on("console", onConsole);
  await page.goto(route);
  await expect(page.locator("body")).toBeVisible();
  page.off("console", onConsole);
  return errors.filter((message) => !message.includes("favicon.ico"));
}
