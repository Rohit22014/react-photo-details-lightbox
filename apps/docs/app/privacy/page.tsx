import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for the Photo Details interactive demo.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <Link className="policy-back" href="/">
        ← Back to Photo Details
      </Link>

      <article>
        <p className="section-label">Demo privacy</p>
        <h1>Privacy, kept in the frame.</h1>

        <p>
          This documentation demo does not intentionally set cookies, run
          first-party analytics, or collect form submissions.
        </p>

        <h2>External photographs</h2>
        <p>
          Demo images are loaded from <code>images.unsplash.com</code>. Loading
          them sends ordinary web-request information, including an IP address
          and browser headers, to Unsplash. The hosting provider may also
          process standard request logs for security and operations.
        </p>

        <p>
          When the detailed viewer is open, the demo fetches a low-resolution
          image derivative and computes its RGB histogram locally in your
          browser. Histogram data is not uploaded, persisted, or used for
          analytics by this demo.
        </p>

        <h2>EXIF metadata</h2>
        <p>
          The optional EXIF helper runs only when an integrating application
          explicitly gives it a file, binary value, or URL. This demo does not
          accept uploads, and the library does not upload metadata by itself.
        </p>

        <p>
          EXIF data can include precise GPS coordinates, creator contact
          details, and camera or lens serial numbers. Review those fields before
          publishing a photograph or sharing a bug reproduction.
        </p>

        <h2>Applications using the library</h2>
        <p>
          Each application is responsible for explaining its own storage,
          analytics, upload, and sharing behavior. This notice applies only to
          the public Photo Details demo.
        </p>
      </article>
    </main>
  );
}
