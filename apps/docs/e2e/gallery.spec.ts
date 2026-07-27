import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const histogramFixture = `
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <defs>
      <radialGradient id="tones" cx="38%" cy="32%" r="82%">
        <stop offset="0" stop-color="#fff0d0" />
        <stop offset="0.28" stop-color="#e74b57" />
        <stop offset="0.62" stop-color="#39ad73" />
        <stop offset="1" stop-color="#173b91" />
      </radialGradient>
    </defs>
    <rect width="256" height="256" fill="url(#tones)" />
  </svg>
`;

test.beforeEach(async ({ page }) => {
  await page.route("https://images.unsplash.com/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.searchParams.get("w") === "512") {
      await route.fulfill({
        body: histogramFixture,
        contentType: "image/svg+xml",
        headers: { "Access-Control-Allow-Origin": "*" },
        status: 200,
      });
      return;
    }

    await route.continue();
  });

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
  await expect(page.getByTestId("rgb-histogram-graph")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include(".yarl__portal")
    .analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test("shows an accessible RGB histogram only in detailed mode", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();

  await expect(
    page.getByRole("heading", { name: "RGB histogram" }),
  ).toBeVisible();
  await expect(page.getByTestId("rgb-histogram-graph")).toBeVisible();

  const channels = page.getByRole("group", { name: "Histogram channels" });
  const allChannels = channels.getByRole("button", { name: "All channels" });
  const redChannel = channels.getByRole("button", { name: "Red channel" });
  const greenChannel = channels.getByRole("button", {
    name: "Green channel",
  });
  const blueChannel = channels.getByRole("button", { name: "Blue channel" });

  await expect(channels.getByRole("button")).toHaveCount(4);
  await expect(allChannels).toHaveAttribute("aria-pressed", "true");
  await expect(greenChannel).toBeVisible();
  await expect(blueChannel).toBeVisible();
  await redChannel.click();
  await expect(redChannel).toHaveAttribute("aria-pressed", "true");
  await expect(allChannels).toHaveAttribute("aria-pressed", "false");

  const detailLevel = page.getByTestId("photo-detail-level-select");
  await detailLevel.selectOption("information");
  await expect(page.getByTestId("rgb-histogram-graph")).toBeHidden();

  await detailLevel.selectOption("minimum");
  await expect(page.getByTestId("rgb-histogram-graph")).toBeHidden();
  await expect(page.getByTestId("metadata-inspector")).toBeHidden();
});

test("renders stable dark, light, desktop, and mobile histograms", async ({
  page,
}, testInfo) => {
  await page.getByTestId("gallery-card-0").click();

  const inspector = page.getByTestId("metadata-inspector");
  const histogram = page.getByRole("figure", { name: "RGB histogram" });
  await expect(page.getByTestId("rgb-histogram-graph")).toBeVisible();
  await expect(histogram).toHaveScreenshot("rgb-histogram-dark.png", {
    animations: "disabled",
  });

  if (!testInfo.project.name.includes("mobile")) {
    await inspector.evaluate((element) => {
      element.setAttribute("data-rpdl-theme", "light");
    });
    await expect(histogram).toHaveScreenshot("rgb-histogram-light.png", {
      animations: "disabled",
    });
  }
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
  const body = inspector.locator(".rpdl__body");
  await expect(inspector).toHaveClass(/rpdl__panel--expanded/);

  await page.getByRole("button", { name: "Collapse photo details" }).click();
  await expect(inspector).toHaveClass(/rpdl__panel--collapsed/);
  await expect(body).toHaveAttribute("inert", "");
  await expect(body).toHaveAttribute("aria-hidden", "true");
  await expect(body).toHaveAttribute("tabindex", "-1");

  await page.getByRole("button", { name: "Expand photo details" }).click();
  await expect(inspector).toHaveClass(/rpdl__panel--expanded/);
  await expect(body).not.toHaveAttribute("inert");
  await expect(body).not.toHaveAttribute("aria-hidden");
  await expect(body).toHaveAttribute("tabindex", "0");
});
