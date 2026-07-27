# Demo Privacy

The public demo is a documentation site. It does not intentionally set cookies,
run first-party analytics, collect form submissions, or automatically inspect
visitor photographs.

Demo images are loaded from `images.unsplash.com`. Loading them sends standard
web-request information, such as an IP address and browser headers, to
Unsplash. The hosting provider may also process ordinary request logs for
security and operations under its own policies.

The optional EXIF helper runs only when an integrating application explicitly
passes it a file, binary value, or URL. The library itself does not upload
metadata. Applications using the library are responsible for disclosing their
own storage, analytics, upload, and sharing behavior.

Photographic metadata can contain precise GPS coordinates, creator contact
details, camera and lens serial numbers, and other identifying information.
Review and remove sensitive fields before publishing a photograph or sharing a
bug reproduction.
