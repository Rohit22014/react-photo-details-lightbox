import type { PhotoMetadata } from "react-photo-details-lightbox";

interface DemoPhoto {
  src: string;
  photoHistogramSrc: string;
  width: number;
  height: number;
  alt: string;
  attribution: {
    photographer: string;
    url: string;
  };
  photoMetadata: PhotoMetadata;
}

const unsplashLicenseUrl = "https://unsplash.com/license";

export const photos = [
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=88",
    photoHistogramSrc:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=max&w=512&q=80",
    width: 2400,
    height: 1600,
    alt: "A lone hiker standing on a sunlit mountain ridge",
    attribution: {
      photographer: "Urban Vintage",
      url: "https://unsplash.com/photos/landscape-photography-of-mountain-hit-by-sun-rays-78A265wPiO4",
    },
    photoMetadata: {
      title: "Light Across the Ridge",
      caption:
        "A lone walker pauses as the last light moves across the folded mountain valley.",
      story:
        "The ridge was empty for most of the afternoon. One figure reached the high rock just as the sunlight found a way through the haze.",
      captureDate: "2025-10-18T14:37:00.000Z",
      location: {
        name: "Carpathian Mountains, Romania",
        latitude: 46.9691,
        longitude: 25.9508,
      },
      camera: {
        make: "Leica",
        model: "SL2-S",
      },
      lens: {
        model: "Vario-Elmarit-SL 24–90mm f/2.8–4",
      },
      exposure: {
        focalLength: 48,
        aperture: 5.6,
        shutterSpeed: "1/500",
        iso: 320,
        exposureCompensation: "-0.3 EV",
      },
      file: {
        name: "weather-moving-in.dng",
        type: "image/dng",
        width: 6000,
        height: 4000,
        size: 74448896,
      },
      creator: {
        name: "Urban Vintage",
        website:
          "https://unsplash.com/photos/landscape-photography-of-mountain-hit-by-sun-rays-78A265wPiO4",
      },
      copyright: "Photo by Urban Vintage · Unsplash",
      license: {
        name: "Unsplash License",
        url: unsplashLicenseUrl,
      },
      credit: "Photo by Urban Vintage on Unsplash",
      keywords: ["ridge", "weather", "scale", "Scotland"],
    },
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=88",
    photoHistogramSrc:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=max&w=512&q=80",
    width: 2400,
    height: 1600,
    alt: "Clear turquoise water meeting a pale beach beneath open sky",
    attribution: {
      photographer: "Sean Oulashin",
      url: "https://unsplash.com/photos/seashore-during-golden-hour-KMn4VEeEPR8",
    },
    photoMetadata: {
      title: "After the Trade Winds",
      caption:
        "The sea settles into bands of turquoise and blue at the edge of an empty cay.",
      story:
        "By late morning the wind dropped completely, leaving one quiet hour before the tide crossed the sandbar.",
      captureDate: "2025-06-03T06:12:00.000Z",
      location: {
        name: "Exuma Cays, The Bahamas",
        latitude: 23.6193,
        longitude: -75.9695,
      },
      camera: {
        make: "Sony",
        model: "α1 II",
      },
      lens: {
        model: "FE 24–70mm F2.8 GM II",
      },
      exposure: {
        focalLength: 35,
        aperture: 8,
        shutterSpeed: "1/800",
        iso: 100,
      },
      file: {
        name: "after-the-trade-winds.arw",
        type: "image/x-sony-arw",
        width: 8640,
        height: 5760,
        size: 102760448,
      },
      creator: {
        name: "Sean Oulashin",
        website:
          "https://unsplash.com/photos/seashore-during-golden-hour-KMn4VEeEPR8",
      },
      copyright: "Photo by Sean Oulashin · Unsplash",
      license: {
        name: "Unsplash License",
        url: unsplashLicenseUrl,
      },
      credit: "Photo by Sean Oulashin on Unsplash",
      keywords: ["ocean", "sandbar", "blue", "Bahamas"],
    },
  },
  {
    src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&h=2400&q=88",
    photoHistogramSrc:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=max&w=512&q=80",
    width: 1600,
    height: 2400,
    alt: "Sandstone buttes rising from a vast ochre desert",
    attribution: {
      photographer: "Ganapathy Kumar",
      url: "https://unsplash.com/photos/landscape-photography-of-rock-formation-L75D18aVal8",
    },
    photoMetadata: {
      title: "The Long Measure",
      caption:
        "Sandstone monuments hold the horizon above miles of open desert scrub.",
      story:
        "Distance is difficult to read in this country. I waited for the last high cloud to clear, letting the sparse foreground show the true scale of the buttes.",
      captureDate: "2025-02-11T17:06:00.000Z",
      location: {
        name: "Monument Valley, Arizona",
        latitude: 36.9989,
        longitude: -110.0986,
      },
      camera: {
        make: "Fujifilm",
        model: "GFX100 II",
      },
      lens: {
        model: "GF 100–200mm F5.6 R LM OIS WR",
      },
      exposure: {
        focalLength: 148,
        aperture: 8,
        shutterSpeed: "1/640",
        iso: 200,
      },
      file: {
        name: "the-long-measure.raf",
        type: "image/x-fuji-raf",
        width: 7728,
        height: 11648,
        size: 207618048,
      },
      creator: {
        name: "Ganapathy Kumar",
        website:
          "https://unsplash.com/photos/landscape-photography-of-rock-formation-L75D18aVal8",
      },
      copyright: "Photo by Ganapathy Kumar · Unsplash",
      license: {
        name: "Unsplash License",
        url: unsplashLicenseUrl,
      },
      credit: "Photo by Ganapathy Kumar on Unsplash",
      keywords: ["desert", "scale", "Arizona", "sandstone"],
    },
  },
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=88",
    photoHistogramSrc:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=max&w=512&q=80",
    width: 2400,
    height: 1600,
    alt: "Sunbeams passing between tall trees in a green forest",
    attribution: {
      photographer: "Lukasz Szmigiel",
      url: "https://unsplash.com/photos/forest-trees-jFCViYFYcus",
    },
    photoMetadata: {
      title: "Understory, 07:42",
      caption:
        "Early light reaches the forest floor for a few seconds between moving branches.",
      story:
        "The clearing never fully brightened. A break in the canopy made a narrow stage, then closed again before the mist had lifted.",
      captureDate: "2024-09-22T07:42:00.000Z",
      location: {
        name: "Black Forest, Germany",
        latitude: 48.1917,
        longitude: 8.2147,
      },
      camera: {
        make: "Nikon",
        model: "Z8",
      },
      lens: {
        model: "NIKKOR Z 24–120mm f/4 S",
      },
      exposure: {
        focalLength: 67,
        aperture: 11,
        shutterSpeed: "1/6",
        iso: 64,
      },
      file: {
        name: "understory-0742.nef",
        type: "image/x-nikon-nef",
        width: 8256,
        height: 5504,
        size: 85327872,
      },
      creator: {
        name: "Lukasz Szmigiel",
        website: "https://unsplash.com/photos/forest-trees-jFCViYFYcus",
      },
      copyright: "Photo by Lukasz Szmigiel · Unsplash",
      license: {
        name: "Unsplash License",
        url: unsplashLicenseUrl,
      },
      credit: "Photo by Lukasz Szmigiel on Unsplash",
      keywords: ["forest", "trail", "Germany", "morning"],
    },
  },
  {
    src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2400&q=88",
    photoHistogramSrc:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=max&w=512&q=80",
    width: 2400,
    height: 1600,
    alt: "A misty hillside meadow glowing at sunrise",
    attribution: {
      photographer: "Dawid Zawiła",
      url: "https://unsplash.com/photos/trees-under-cloudy-sky-during-sunset--G3rw6Y02D0",
    },
    photoMetadata: {
      title: "First Light, Upper Meadow",
      caption:
        "Mist holds along the hillside while the first sun traces the line of the meadow.",
      story:
        "I returned to this rise on four mornings. On the fifth, frost, haze and a break in the cloud finally arrived together.",
      captureDate: "2024-11-09T06:51:00.000Z",
      location: {
        name: "Beskid Mountains, Poland",
        latitude: 49.4717,
        longitude: 20.3928,
      },
      camera: {
        make: "Canon",
        model: "EOS R5 Mark II",
      },
      lens: {
        model: "RF 15–35mm F2.8 L IS USM",
      },
      exposure: {
        focalLength: 31,
        aperture: 9,
        shutterSpeed: "1/15",
        iso: 100,
      },
      file: {
        name: "first-light-east-shore.cr3",
        type: "image/x-canon-cr3",
        width: 8192,
        height: 5464,
        size: 91357184,
      },
      creator: {
        name: "Dawid Zawiła",
        website:
          "https://unsplash.com/photos/trees-under-cloudy-sky-during-sunset--G3rw6Y02D0",
      },
      copyright: "Photo by Dawid Zawiła · Unsplash",
      license: {
        name: "Unsplash License",
        url: unsplashLicenseUrl,
      },
      credit: "Photo by Dawid Zawiła on Unsplash",
      keywords: ["sunrise", "meadow", "Poland", "mist"],
    },
  },
  {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=88",
    photoHistogramSrc:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=max&w=512&q=80",
    width: 2400,
    height: 1600,
    alt: "Wooden rowboats crossing a turquoise lake below steep peaks",
    attribution: {
      photographer: "Pietro De Grandi",
      url: "https://unsplash.com/photos/three-brown-wooden-boat-on-blue-lake-water-taken-at-daytime-T7K4aEPoGGk",
    },
    photoMetadata: {
      title: "Crossing Lago di Braies",
      caption:
        "Wooden boats cross clear turquoise water beneath the pale Dolomite walls.",
      story:
        "The first boats left the jetty as the sun reached the western shore. From above, each wake briefly drew its own line through the lake.",
      captureDate: "2025-07-26T09:19:00.000Z",
      location: {
        name: "Lago di Braies, Italy",
        latitude: 46.6947,
        longitude: 12.0859,
      },
      camera: {
        make: "Hasselblad",
        model: "X2D 100C",
      },
      lens: {
        model: "XCD 38V",
      },
      exposure: {
        focalLength: 38,
        aperture: 7.1,
        shutterSpeed: "1/4",
        iso: 64,
      },
      file: {
        name: "still-water-tre-cime.3fr",
        type: "image/x-hasselblad-3fr",
        width: 11656,
        height: 8742,
        size: 218103808,
      },
      creator: {
        name: "Pietro De Grandi",
        website:
          "https://unsplash.com/photos/three-brown-wooden-boat-on-blue-lake-water-taken-at-daytime-T7K4aEPoGGk",
      },
      copyright: "Photo by Pietro De Grandi · Unsplash",
      license: {
        name: "Unsplash License",
        url: unsplashLicenseUrl,
      },
      credit: "Photo by Pietro De Grandi on Unsplash",
      keywords: ["Dolomites", "mountain", "lake", "evening"],
    },
  },
] satisfies DemoPhoto[];
