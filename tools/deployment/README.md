# Automatic release assets

`npm run build` builds the current public/ tree into a fresh temporary directory
and prints its directory and release ID. It does not modify source files.

`npm run deploy` builds that output and deploys it to shahar-ms Pages.
`npm run deploy -- --committed` first exports HEAD, avoiding unrelated local drafts.
Never deploy raw public/ directly: that bypasses automatic asset versioning.

The release ID is a deterministic SHA-256 digest of public paths and bytes.
All local JS/MJS and CSS references, including inline HTML, module imports,
workers and importScripts, point into /_assets/<release-id>/. CSS font/image
references are rewritten to the corresponding versioned resources. Files retain
their directory structure for runtime-relative resources. External resources such
as Cloudflare Analytics stay external. SRI attributes are recalculated when local
script/style transformations change their bytes.

HTML entry points and original source routes revalidate on ordinary reloads.
Versioned assets use one-year immutable caching. Cache rules do not overlap,
because Cloudflare Pages joins duplicate response header values. The site retains
the three preceding asset releases alongside the current one, so already-open
pages can finish loading their matching workers during deployment. This history
lives only in .wrangler/site-asset-history, and is updated after successful deploys.
The build manifest is /_asset-manifest.json.

Tests exercise deterministic versions, changed child scripts, duplicate path
slashes, CSS imports/resources, worker imports, SRI rewriting and cache headers.
