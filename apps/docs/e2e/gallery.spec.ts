import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("photo-gallery")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
});

test("presents the photography-first landing gallery", async ({ page }) => {
  await expect(page.getByTestId("site-title")).toBeVisible();

  const firstPhotograph = page.getByTestId("gallery-card-0");
  await expect(firstPhotograph).toBeVisible();
  await expect(firstPhotograph.getByRole("img")).toBeVisible();
});

test("opens a photograph and closes the lightbox", async ({ page }) => {
  await page.getByTestId("gallery-card-0").click();

  const closeButton = page.getByRole("button", { name: /close/i });

  await expect(closeButton).toBeVisible();
  await expect(page.getByTestId("metadata-inspector")).toBeVisible();
  await expect(page.getByTestId("metadata-inspector")).toContainText(
    "Light Across the Ridge",
  );
  await expect(page.getByTestId("metadata-inspector")).toContainText("Leica");
  await page
    .getByTestId("photo-detail-level-select")
    .selectOption("information");
  await expect(page.getByTestId("demo-detail-level-select")).toHaveValue(
    "information",
  );

  await closeButton.click();

  await expect(closeButton).toBeHidden();
  await expect(page.getByTestId("metadata-inspector")).toBeHidden();
});

test("open lightbox has no serious or critical accessibility violations", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();
  await expect(page.getByTestId("metadata-inspector")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include(".yarl__portal")
    .analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );

  expect(
    violations,
    JSON.stringify(violations, null, 2),
  ).toEqual([]);
});

test("switches between minimum, information, detailed, and custom modes", async ({
  page,
}) => {
  const level = page.getByTestId("demo-detail-level-select");
  const photograph = page.getByTestId("gallery-card-0");
  const inspector = page.getByTestId("metadata-inspector");
  const closeButton = page.getByRole("button", { name: /close/i });

  await level.selectOption("detailed");
  await photograph.click();
  await expect(inspector).toBeVisible();
  await closeButton.click();

  await level.selectOption("minimum");
  await photograph.click();
  await expect(inspector).toBeHidden();
  await closeButton.click();

  await level.selectOption("information");
  await photograph.click();
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Light Across the Ridge");
  await closeButton.click();

  await level.selectOption("detailed");
  await photograph.click();
  await expect(inspector).toBeVisible();
  await closeButton.click();

  await level.selectOption("custom");
  await expect(level).toHaveValue("custom");
  await photograph.click();
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("From the field");
});

test("expands and collapses the mobile details sheet", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));

  await page.getByTestId("gallery-card-0").click();
  const inspector = page.getByTestId("metadata-inspector");
  await expect(inspector).toHaveClass(/rpdl__panel--expanded/);

  await page.getByRole("button", { name: "Collapse photo details" }).click();
  await expect(inspector).toHaveClass(/rpdl__panel--collapsed/);

  await page.getByRole("button", { name: "Expand photo details" }).click();
  await expect(inspector).toHaveClass(/rpdl__panel--expanded/);
});
