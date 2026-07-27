import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "yet-another-react-lightbox/styles.css";
import "react-photo-details-lightbox/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Photo Details — A lightbox for the whole photograph",
    template: "%s · Photo Details",
  },
  description:
    "A metadata-rich React lightbox for photographers, built on Yet Another React Lightbox and ready for Next.js.",
  keywords: [
    "React lightbox",
    "photography",
    "EXIF",
    "Next.js",
    "image metadata",
  ],
  openGraph: {
    title: "Photo Details",
    description:
      "A better lightbox for photographers — image, story and capture details in one considered frame.",
    type: "website",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#11110f",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
