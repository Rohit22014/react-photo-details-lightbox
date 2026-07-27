# Security Policy

## Supported versions

Until the first stable release, security updates are applied to the latest
published `0.x` version only. After `1.0.0`, the latest major version will be
supported unless a release note says otherwise.

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue, pull
request, discussion, or screenshot. Use GitHub's private
[Report a vulnerability](https://github.com/Rohit22014/react-photo-details-lightbox/security/advisories/new)
flow instead.

Include the affected version, impact, reproduction steps, and any suggested
mitigation. Remove unrelated personal data from sample photographs, especially
GPS coordinates, creator email addresses, and camera or lens serial numbers.

The maintainer will acknowledge a report as soon as practical, investigate it,
and coordinate disclosure and a fix when warranted. Please allow time for a
patch to be prepared before publishing details.

## Scope

Reports about this package or its demo belong here. Vulnerabilities in Yet
Another React Lightbox, React, Next.js, Unsplash, Cloudflare, or another
dependency should also be reported to that project's security channel.

## Known workspace advisories

As of 2026-07-27, `npm audit` reports upstream advisories in the latest
compatible Next.js, OpenNext, and ESLint build-tool chains. The production
workspace findings are Next.js's pinned PostCSS release and its optional Sharp
release. These packages are not included in the published library tarball; the
demo builds only repository-controlled CSS and uses unoptimized Next.js images,
so Sharp is not used by the deployed site.

The dependency tree intentionally remains within each upstream package's
declared version ranges instead of forcing unsupported transitive overrides.
Dependabot monitors compatible fixes, and this note should be removed when the
upstream releases resolve the findings.
