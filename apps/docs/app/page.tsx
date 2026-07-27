import { PhotoGallery } from "@/components/photo-gallery";
import Image from "next/image";

export const runtime = "nodejs";

const installCommand =
  "npm install react-photo-details-lightbox yet-another-react-lightbox";
const repositoryUrl =
  "https://github.com/Rohit22014/react-photo-details-lightbox";

const codeSample = `import { PhotoDetailsLightbox } from "react-photo-details-lightbox";
import "yet-another-react-lightbox/styles.css";
import "react-photo-details-lightbox/styles.css";

<PhotoDetailsLightbox
  open={open}
  close={() => setOpen(false)}
  slides={photos}
  detailLevel="detailed"
/>`;

const features = [
  {
    number: "01",
    title: "The story stays with the frame",
    body: "Titles, captions and field notes sit beside the image—not over it—so the photograph keeps its visual weight.",
  },
  {
    number: "02",
    title: "Capture data, clearly composed",
    body: "Camera, lens, aperture, shutter, ISO and location are grouped into a readable inspector for curious viewers.",
  },
  {
    number: "03",
    title: "From quiet to comprehensive",
    body: "Move between minimum, information, detailed and custom views without leaving the photograph.",
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Photo Details home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>Photo Details</span>
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#demo">Demo</a>
          <a href="#features">Why it exists</a>
          <a href="#api">API</a>
          <a
            className="nav-github"
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">
            <span>React component</span>
            <span>Next.js ready</span>
          </p>
          <h1 data-testid="site-title">
            A lightbox for
            <br />
            the <em>whole</em> photograph.
          </h1>
          <p className="hero-intro">
            Give the image room. Keep the story close. Photo Details adds the
            context photographers care about to a beautifully restrained viewer.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">
              Explore the live demo
              <span aria-hidden="true">↓</span>
            </a>
            <code>npm i react-photo-details-lightbox</code>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-photo">
            <Image
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=88"
              alt=""
              width={1800}
              height={1200}
              preload
              sizes="(max-width: 760px) 100vw, 45vw"
            />
            <span className="crop-mark crop-mark-top" />
            <span className="crop-mark crop-mark-bottom" />
          </div>
          <div className="hero-note">
            <span>Frame 01 / 06</span>
            <span>51.1789° N</span>
            <span>1.8262° W</span>
          </div>
        </div>

        <div className="hero-index" aria-hidden="true">
          <span>PD—01</span>
          <span>Image / information / intent</span>
        </div>
      </section>

      <section className="intro-section" id="features">
        <p className="section-label">Why it exists</p>
        <div className="intro-heading">
          <h2>
            Most lightboxes show a file.
            <br />
            This one presents a <em>photograph.</em>
          </h2>
          <p>
            Built for portfolios, editorial archives and client galleries where
            the details are part of the work—not an afterthought.
          </p>
        </div>
        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature-row" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <span className="feature-glyph" aria-hidden="true">
                {feature.number === "01"
                  ? "⌁"
                  : feature.number === "02"
                    ? "⌖"
                    : "◫"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="demo-heading">
          <div>
            <p className="section-label light">Live field test</p>
            <h2>Look closer.</h2>
          </div>
          <p>
            Select a detail level, then open any frame. Navigate, zoom and
            inspect exactly as your audience would.
          </p>
        </div>
        <PhotoGallery />
      </section>

      <section className="api-section" id="api">
        <div className="api-copy">
          <p className="section-label">A considered API</p>
          <h2>
            Familiar React.
            <br />
            Photographic defaults.
          </h2>
          <p>
            Use the ready-made component or add the Photo Details plugin to your
            existing Yet Another React Lightbox setup. Typed metadata, render
            slots and CSS variables make it yours.
          </p>
          <ul className="api-points">
            <li>
              <span>01</span>Works with the App Router
            </li>
            <li>
              <span>02</span>SSR-safe package imports
            </li>
            <li>
              <span>03</span>No backend required
            </li>
            <li>
              <span>04</span>Accessible by default
            </li>
          </ul>
        </div>
        <div className="code-window">
          <div className="code-header">
            <span>gallery.tsx</span>
            <span className="code-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <pre>
            <code>{codeSample}</code>
          </pre>
          <div className="install-row">
            <span>$</span>
            <code>{installCommand}</code>
          </div>
        </div>
      </section>

      <section className="closing-section">
        <p>For image-makers and the people who look closely.</p>
        <h2>
          Let the work
          <br />
          <em>speak in full.</em>
        </h2>
        <a className="primary-button light-button" href="#demo">
          Open the gallery
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>Photo Details</span>
        </a>
        <div className="footer-links">
          <a href={repositoryUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="/privacy">Privacy</a>
          <a
            href={`${repositoryUrl}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
          >
            MIT License
          </a>
        </div>
        <p>© 2026 Photo Details</p>
      </footer>
    </main>
  );
}
