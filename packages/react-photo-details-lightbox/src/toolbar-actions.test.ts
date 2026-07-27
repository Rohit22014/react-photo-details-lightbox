import { describe, expect, it, vi } from "vitest";
import { performPhotoShare, resolvePhotoShareData } from "./toolbar-actions";
import type { PhotoSlide } from "./types";

const slide: PhotoSlide = {
  src: "/images/ridge.jpg",
  photoMetadata: {
    title: "Ridge light",
    caption: "Weather moving over the summit.",
  },
};

function navigatorWith(
  values: Partial<Pick<Navigator, "canShare" | "clipboard" | "share">> = {},
) {
  return values as Navigator;
}

describe("photo sharing", () => {
  it("uses the current page without private query or fragment state", () => {
    expect(
      resolvePhotoShareData(
        slide,
        "https://portfolio.example/gallery?access_token=private#frame-4",
      ),
    ).toEqual({
      title: "Ridge light",
      text: "Weather moving over the summit.",
      url: "https://portfolio.example/gallery",
    });
  });

  it("rejects invalid, credential-bearing, and non-web share targets", () => {
    for (const share of [
      "javascript:alert('x')",
      "data:text/plain,private",
      "https://user:password@portfolio.example/work/ridge",
      "http://[invalid",
    ]) {
      expect(
        resolvePhotoShareData(
          { ...slide, share },
          "https://portfolio.example/gallery",
        ),
      ).toBeUndefined();
    }

    expect(resolvePhotoShareData(slide, "not a page URL")).toBeUndefined();
    expect(
      resolvePhotoShareData(
        { ...slide, share: "https://portfolio.example/work/ridge" },
        "file:///local-preview.html",
      ),
    ).toMatchObject({ url: "https://portfolio.example/work/ridge" });
  });

  it("resolves explicit relative permalinks and preserves custom copy", () => {
    expect(
      resolvePhotoShareData(
        {
          ...slide,
          share: {
            text: "A public portfolio frame.",
            url: "/work/ridge-light",
          },
        },
        "https://portfolio.example/gallery",
      ),
    ).toEqual({
      title: "Ridge light",
      text: "A public portfolio frame.",
      url: "https://portfolio.example/work/ridge-light",
    });
  });

  it("disables sharing for slides marked share false", () => {
    expect(
      resolvePhotoShareData(
        { ...slide, share: false },
        "https://portfolio.example/gallery",
      ),
    ).toBeUndefined();
  });

  it("uses the native share sheet when it accepts the payload", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    const data = { url: "https://portfolio.example/work/ridge" };

    await expect(
      performPhotoShare(data, navigatorWith({ canShare, share })),
    ).resolves.toBe("shared");
    expect(canShare).toHaveBeenCalledWith(data);
    expect(share).toHaveBeenCalledWith(data);
  });

  it("treats a dismissed native share sheet as cancellation", async () => {
    const cancellation = new Error("Dismissed");
    cancellation.name = "AbortError";
    const share = vi.fn().mockRejectedValue(cancellation);

    await expect(
      performPhotoShare(
        { url: "https://portfolio.example/work/ridge" },
        navigatorWith({ share }),
      ),
    ).resolves.toBe("cancelled");
  });

  it("copies the URL when native sharing is missing or fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const clipboard = { writeText } as unknown as Clipboard;
    const data = { url: "https://portfolio.example/work/ridge" };

    await expect(
      performPhotoShare(data, navigatorWith({ clipboard })),
    ).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(data.url);

    const share = vi.fn().mockRejectedValue(new Error("Native failure"));
    await expect(
      performPhotoShare(data, navigatorWith({ clipboard, share })),
    ).resolves.toBe("copied");

    const canShare = vi.fn().mockReturnValue(false);
    await expect(
      performPhotoShare(data, navigatorWith({ canShare, clipboard, share })),
    ).resolves.toBe("copied");
    expect(share).toHaveBeenCalledTimes(1);

    canShare.mockImplementation(() => {
      throw new Error("Unsupported payload");
    });
    await expect(
      performPhotoShare(data, navigatorWith({ canShare, clipboard, share })),
    ).resolves.toBe("copied");
    expect(share).toHaveBeenCalledTimes(1);
  });

  it("reports unavailable when neither sharing nor copying succeeds", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));

    await expect(
      performPhotoShare(
        { url: "https://portfolio.example/work/ridge" },
        navigatorWith({
          clipboard: { writeText } as unknown as Clipboard,
        }),
      ),
    ).resolves.toBe("unavailable");
  });
});
