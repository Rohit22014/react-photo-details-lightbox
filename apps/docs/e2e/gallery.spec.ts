import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

interface RecordedShareData {
  text?: string;
  title?: string;
  url?: string;
}

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

async function openPhotoDetails(page: Page, level = "Detailed") {
  await page.getByTestId("photo-details-menu-button").click();
  const menu = page.getByRole("menu", {
    name: "Choose photo detail level",
  });
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitemradio", { name: level }).click();
  const inspector = page.getByTestId("metadata-inspector");
  await expect(inspector).toBeVisible();
  return inspector;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const testWindow = window as typeof window & {
      __rpdlShareCalls: Array<{
        text?: string;
        title?: string;
        url?: string;
      }>;
    };

    testWindow.__rpdlShareCalls = [];
    Object.defineProperties(window.navigator, {
      canShare: {
        configurable: true,
        value: () => true,
      },
      share: {
        configurable: true,
        value: async (data: ShareData) => {
          testWindow.__rpdlShareCalls.push({
            ...(data.text ? { text: data.text } : {}),
            ...(data.title ? { title: data.title } : {}),
            ...(data.url ? { url: data.url } : {}),
          });
        },
      },
    });
  });

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
  const toolbar = page.locator(".yarl__toolbar");

  await expect(closeButton).toBeVisible();
  await expect(toolbar.getByRole("button")).toHaveCount(5);
  await expect
    .poll(() =>
      toolbar
        .getByRole("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getAttribute("aria-label")),
        ),
    )
    .toEqual([
      "Share photo",
      "Zoom in",
      "Zoom out",
      "Choose photo detail level",
      "Close",
    ]);
  await expect(page.getByTestId("metadata-inspector")).toBeHidden();
  const inspector = await openPhotoDetails(page);
  await expect(inspector).toContainText("Light Across the Ridge");
  await expect(inspector).toContainText("Leica");
  await page
    .getByTestId("photo-detail-level-select")
    .selectOption("information");
  await expect(page.getByTestId("demo-detail-level-select")).toHaveValue(
    "information",
  );
  await page.getByRole("button", { name: "Close photo details" }).click();
  await expect(inspector).toBeHidden();

  await closeButton.click();

  await expect(closeButton).toBeHidden();
  await expect(page.getByTestId("metadata-inspector")).toBeHidden();
});

test("open lightbox has no serious or critical accessibility violations", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();
  await page.getByTestId("photo-details-menu-button").click();
  const menu = page.getByRole("menu", {
    name: "Choose photo detail level",
  });
  await expect(menu).toBeVisible();

  const menuResults = await new AxeBuilder({ page })
    .include(".yarl__portal")
    .analyze();
  const menuViolations = menuResults.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  expect(menuViolations, JSON.stringify(menuViolations, null, 2)).toEqual([]);

  await menu.getByRole("menuitemradio", { name: "Detailed" }).click();
  await expect(page.getByTestId("metadata-inspector")).toBeVisible();
  await expect(page.getByTestId("rgb-histogram-graph")).toBeVisible();

  const panelResults = await new AxeBuilder({ page })
    .include(".yarl__portal")
    .analyze();
  const panelViolations = panelResults.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  expect(panelViolations, JSON.stringify(panelViolations, null, 2)).toEqual([]);
});

test("shares the active photograph through the Web Share API", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();
  await page.getByTestId("photo-share-button").click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __rpdlShareCalls: RecordedShareData[];
            }
          ).__rpdlShareCalls,
      ),
    )
    .toEqual([
      {
        text: "A lone walker pauses as the last light moves across the folded mountain valley.",
        title: "Light Across the Ridge",
        url: "http://localhost:3000/",
      },
    ]);
  await expect(
    page.getByRole("status").filter({ hasText: "Photo shared." }),
  ).toBeVisible();
});

test("supports keyboard interaction in the photo detail menu", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();

  const trigger = page.getByTestId("photo-details-menu-button");
  await expect(trigger).toHaveAccessibleName("Choose photo detail level");
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const menu = page.getByRole("menu", {
    name: "Choose photo detail level",
  });
  const detailed = menu.getByRole("menuitemradio", { name: "Detailed" });
  const custom = menu.getByRole("menuitemradio", { name: "Custom" });
  await expect(menu.getByRole("menuitemradio")).toHaveCount(4);
  await expect(detailed).toHaveAttribute("aria-checked", "true");
  await expect(detailed).toBeFocused();

  await detailed.press("ArrowDown");
  await expect(custom).toBeFocused();
  await custom.press("Enter");
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Close photo details" }),
  ).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("metadata-inspector")).toContainText(
    "From the field",
  );
  await expect(page.getByTestId("demo-detail-level-select")).toHaveValue(
    "custom",
  );

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("metadata-inspector")).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Choose photo detail level");
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

  await trigger.press("Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Close" })).toBeHidden();
});

test("zooms the active photograph with the toolbar controls", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();

  const image = page.locator(".yarl__slide_current .yarl__slide_image");
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  const zoomOut = page.getByRole("button", { name: "Zoom out" });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(zoomIn).toBeEnabled();
  await expect(zoomOut).toBeDisabled();

  const initialBox = await image.boundingBox();
  expect(initialBox).not.toBeNull();
  await zoomIn.click();
  await expect(zoomOut).toBeEnabled();
  await expect
    .poll(async () => (await image.boundingBox())?.width ?? 0)
    .toBeGreaterThan((initialBox?.width ?? 0) * 1.2);
});

test("renders a stable photo detail menu", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"));

  await page.getByTestId("gallery-card-0").click();
  await page.getByTestId("photo-details-menu-button").click();

  await expect(
    page.getByRole("menu", { name: "Choose photo detail level" }),
  ).toHaveScreenshot("photo-detail-menu-dark.png", {
    animations: "disabled",
  });
});

test("shows an accessible RGB histogram only in detailed mode", async ({
  page,
}) => {
  await page.getByTestId("gallery-card-0").click();
  await openPhotoDetails(page);

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
  await openPhotoDetails(page);

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
  await expect(inspector).toBeHidden();
  await openPhotoDetails(page);
  await expect(inspector).toBeVisible();
  await page.getByRole("button", { name: "Close photo details" }).click();
  await closeButton.click();

  await level.selectOption("minimum");
  await photograph.click();
  await expect(inspector).toBeHidden();
  await closeButton.click();

  await level.selectOption("information");
  await photograph.click();
  await openPhotoDetails(page, "Information");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Light Across the Ridge");
  await page.getByRole("button", { name: "Close photo details" }).click();
  await closeButton.click();

  await level.selectOption("detailed");
  await photograph.click();
  await openPhotoDetails(page);
  await expect(inspector).toBeVisible();
  await page.getByRole("button", { name: "Close photo details" }).click();
  await closeButton.click();

  await level.selectOption("custom");
  await expect(level).toHaveValue("custom");
  await photograph.click();
  await openPhotoDetails(page, "Custom");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("From the field");
});

test("uses a full-screen photo details view on mobile", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));

  await page.getByTestId("gallery-card-0").click();
  await expect(page.getByTestId("metadata-inspector")).toBeHidden();
  const inspector = await openPhotoDetails(page);
  await expect(inspector).toHaveAttribute("aria-modal", "true");
  await expect(inspector).toHaveCSS("position", "fixed");

  const viewport = page.viewportSize();
  const panelBox = await inspector.boundingBox();
  expect(viewport).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(panelBox?.x ?? -1).toBeCloseTo(0, 0);
  expect(panelBox?.y ?? -1).toBeCloseTo(0, 0);
  expect(panelBox?.width ?? 0).toBeCloseTo(viewport?.width ?? 0, 0);
  expect(panelBox?.height ?? 0).toBeCloseTo(viewport?.height ?? 0, 0);
  const panelClose = page.getByRole("button", {
    name: "Close photo details",
  });
  await expect(panelClose).toBeVisible();

  const toolbar = page.locator(".yarl__toolbar");
  const carousel = page.locator(".yarl__carousel");
  await expect(toolbar).toHaveAttribute("inert", "");
  await expect(toolbar).toHaveAttribute("aria-hidden", "true");
  await expect(carousel).toHaveAttribute("inert", "");
  await expect(carousel).toHaveAttribute("aria-hidden", "true");

  const backgroundAcceptedFocus = await page
    .getByRole("button", {
      name: "Close",
      exact: true,
      includeHidden: true,
    })
    .evaluate((element) => {
      (element as HTMLButtonElement).focus();
      return element.ownerDocument.activeElement === element;
    });
  expect(backgroundAcceptedFocus).toBe(false);

  const detailLevel = page.getByTestId("photo-detail-level-select");
  const blueChannel = page.getByRole("button", { name: "Blue channel" });
  await blueChannel.focus();
  await blueChannel.press("Tab");
  await expect(detailLevel).toBeFocused();
  await detailLevel.press("Shift+Tab");
  await expect(blueChannel).toBeFocused();

  await panelClose.click();
  await expect(inspector).toBeHidden();
  await expect(toolbar).not.toHaveAttribute("inert", "");
  await expect(toolbar).not.toHaveAttribute("aria-hidden", "true");
  await expect(carousel).not.toHaveAttribute("inert", "");
  await expect(carousel).not.toHaveAttribute("aria-hidden", "true");
});

test("opens the desktop photo details drawer against the right edge", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"));

  await page.getByTestId("gallery-card-0").click();
  const inspector = await openPhotoDetails(page);
  const viewport = page.viewportSize();
  const panelBox = await inspector.boundingBox();
  expect(viewport).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(panelBox?.x ?? 0).toBeGreaterThan(0);
  expect((panelBox?.x ?? 0) + (panelBox?.width ?? 0)).toBeCloseTo(
    viewport?.width ?? 0,
    0,
  );
});

test("keeps the three-dot menu inside an RTL desktop viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"));

  await page.getByTestId("gallery-card-0").click();
  await page.locator(".yarl__portal").evaluate((element) => {
    element.setAttribute("dir", "rtl");
  });
  await page.getByTestId("photo-details-menu-button").click();

  const menu = page.getByRole("menu", {
    name: "Choose photo detail level",
  });
  await expect(menu).toBeVisible();
  const viewport = page.viewportSize();
  const menuBox = await menu.boundingBox();
  expect(viewport).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  );
});

test("keeps mobile toolbar actions and the detail menu within reach", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));

  await page.getByTestId("gallery-card-0").click();
  const trigger = page.getByTestId("photo-details-menu-button");
  const triggerBox = await trigger.boundingBox();
  expect(triggerBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await trigger.click();
  const menu = page.getByRole("menu", {
    name: "Choose photo detail level",
  });
  await expect(menu).toBeVisible();

  const viewport = page.viewportSize();
  const menuBox = await menu.boundingBox();
  expect(viewport).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect(menuBox?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  );
  expect((menuBox?.y ?? 0) + (menuBox?.height ?? 0)).toBeLessThanOrEqual(
    viewport?.height ?? 0,
  );

  for (const option of await menu.getByRole("menuitemradio").all()) {
    const optionBox = await option.boundingBox();
    expect(optionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
