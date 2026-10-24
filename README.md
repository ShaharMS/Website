# shahar.ms

Personal homepage, hosted on Cloudflare Pages. GoDaddy remains the registrar;
Cloudflare will manage DNS, HTTPS, hosting, and analytics.

## Local development and deployment

Requires Node.js and a Cloudflare account with access to the `shahar-ms` project.

```powershell
npm ci
npx wrangler login
npm run dev
npm run deploy
```

Static files live in `public/`. There is no build step. Wrangler is pinned in
`package-lock.json`. Deployment uses the production branch `main`.
This is a Direct Upload project; GitHub pushes do not automatically deploy it.
Cloudflare does not support converting a Direct Upload project to native Git
integration; a future GitHub Actions workflow can run `npm run deploy` instead.

## Cloudflare resources

- Project: `shahar-ms`
- Public deployment: https://shahar-ms.pages.dev
- Intended primary domain: https://shahar.ms
- Additional custom domain: https://www.shahar.ms
- Dashboard: https://dash.cloudflare.com/d9d30d05a2e3f642100363d90a1f9974/pages/view/shahar-ms

## Finish DNS setup

1. In the existing Cloudflare account, add `shahar.ms` as a domain on the Free
   plan. This adds a DNS zone; it does not transfer the registration.
2. Review imported records, preserving any existing mail or verification records.
3. Copy the two nameservers assigned specifically to this zone.
4. In GoDaddy, open `shahar.ms` > DNS > Nameservers > Change Nameservers >
   use your own nameservers. Enter the two assigned Cloudflare nameservers.
5. Once Cloudflare shows the zone as active, ensure these proxied DNS records
   exist (replace conflicting parking records for these hostnames only):
   - CNAME `@` -> `shahar-ms.pages.dev`
   - CNAME `www` -> `shahar-ms.pages.dev`
6. Check Pages > Custom domains until both hostnames and HTTPS are active.

Both hostnames were submitted to Pages on 2026-10-22. Their validation remains
pending until registrar delegation becomes public. GoDaddy remains responsible for registration
and renewal; its website hosting or domain forwarding is not required.

## Analytics

Web Analytics was created for `shahar.ms` on 2026-10-22. Its public beacon
snippet is installed explicitly in `public/index.html` and deployed with:

```powershell
npm run deploy
```

Do not also enable automatic beacon injection without removing the explicit
snippet first. Visitor and page-view reports are available at:
https://dash.cloudflare.com/d9d30d05a2e3f642100363d90a1f9974/web-analytics/overview?siteTag~in=2bcb6bc308f1469ba565ebb2d467119f&excludeBots=Yes

The domain's Analytics & Logs view provides network traffic and security data
once the zone is active and traffic uses Cloudflare.

The current Wrangler OAuth token can deploy Pages but lacks DNS write and
Account Settings permissions. Zone creation, DNS changes, and Web Analytics
enablement therefore need the dashboard or a separately scoped API token.
Never commit credentials.

GoDaddy's nameserver dashboard was checked on 2026-10-22 and shows exactly
`noel.ns.cloudflare.com` and `nola.ns.cloudflare.com`. It reports domain
configuration changes underway. Cloudflare still reports pending activation;
a fresh nameserver check was requested in the dashboard.

## Homepage migration

The homepage is copied from `spacebubble.io/new/`, using
`ShaharMS/spacebubble.io` at commit `2ae52df0395feccc9a2ce8c131fd888ca91620fa`.
The original site's hosting, subdomains, and redirects are unchanged.

The root now contains the animated landing page, its local scripts and assets,
the embedded Little interpreter, the standalone Little playground, documentation,
and the generated Vision API reference. `/new/*` redirects to the equivalent root
path to preserve old-style bookmarks. All favicons are excluded, and HTML uses
an empty data favicon to avoid automatic requests for the original icon.

Runtime libraries, Google Fonts styles/font files, and the decorative Trollface
image are vendored locally in `public/vendor/`. Preserve their embedded third-party
license notices. The original Wikipedia image URL returned 404; the same image
was retrieved from https://en.wiktionary.org/wiki/File:Trollface_non-free.png.
Analytics continues to use Cloudflare's external beacon.

Migration repairs:

- Same-origin framing is allowed so the Little iframe can render.
- The Little playground now runs its initial example on load.
- The invented separate Little guide page and mixed documentation hub were
  removed. Quickstart stays inline in the playground; the homepage Documentation
  button points to the actual Little repository reference.
- The Haxe articles and their images live at /haxe/, without Little branding or
  cross-links. Legacy /little/doc entry points redirect there for old bookmarks.
- Broken generated Vision relative links are repaired. References to four omitted
  Haxe standard-library declarations link to the official Haxe API instead.
- Unknown paths return a real 404 page, avoiding false success via SPA fallback.

GitHub and Twitter remain external links. The abandoned Dynamically/EZWorksheet
section, its video effect, and its Three.js dependency were removed at the user's
request. No EZWorksheet runtime or downloads are part of this deployment.

## Focused visual fixes

The original palette, typefaces, and brutalistic styling are preserved.
The earlier visual redesign was reverted. Base CSS for sections 1, 3, 4, and 6 is
copied unchanged from the original source. The section 2 CSS only removes accidental
inherited transforms and allows animated symbols to overflow their own viewports.

- Existing icon animations target artwork groups rather than SVG symbol viewports.
- Web-sourced icons include Monster claw, shirt, hanger, car, steering wheel,
  two jigsaw designs, candlesticks, a line chart, coins, wallet, and banknotes.
  Chocolate milk was removed. Source artwork and attribution
  are in `public/assets/icons/SOURCES.md`.
- Clouds replenish every 2.5 seconds while below capacity, keeping the original
  cloud size, shape, opacity, and hover behavior.
- The existing airplane banner uses an animated displacement filter. Flight uses
  numeric positions instead of accumulating nested CSS `calc()` expressions.
- Vision's original spotlights use their actual local fixture bounds, pointer
  coordinates, and a correctly scaled canvas. Fixture styling and the original
  0.7 overlay opacity are preserved.

### Page sizing and final-copy fit

The subsequently requested geometry adjustments are in `public/css/page-layout.css`:

- Each section includes its 16px black border in a full dynamic viewport height.
  The duplicate standalone border after the landscape is removed.
- Background graphics use their own section as the positioning/clipping boundary;
  the icon pattern fills the whole page instead of ending at an inner wrapper edge.
- Little budgets space for the original links and iframe first. `littleLayout.js`
  measures a hidden copy containing the complete typewriter text, waits for fonts,
  and responds to resizes. It retains 16px body text when possible and reduces only
  Little's copy when needed. The typewriter paragraph reserves its final height.
- Vision fixture content dimensions increase from 60x40 to 90x60. The light pool
  now scales with the highlighted text and heading: at least 12 text em or 2.75
  heading em in radius. Its colors, shapes, and darkness are unchanged.
- Narrow layouts wrap the existing sign/Vision content without adding new content.

Before this adjustment, the touched sources were copied to the ignored
`artifacts/before-page-fit/` folder for local recovery.

Run `npm run check` to validate local HTML/CSS references against actual files.
The check does not mistake a homepage fallback for a successful asset response.
Browser verification also covers interpreter output, the embedded canvas, article
image loading, and Vision navigation/search.

### Responsive layouts

Wide desktop styling remains unchanged. At widths up to 1000px or viewport heights
up to 600px, intro panels still fill a page and the landscape has enough height for
its sign. Little and Vision fill at least a viewport and can grow with their text.
They use normal scrolling rather than shrinking body text to fit a fixed frame.
Little stays at 16px, uses a stacked tablet layout, and keeps its embedded editor
on tablets while linking to the standalone playground on small phones.

The existing spotlight effect sits behind readable copy in compact/touch layouts.
Documentation navigation can collapse on narrow screens; search opens it, and
wide code signatures/tables scroll inside their own panels. The standalone
playground keeps all controls available, initially collapses the AST on phones,
and reacts to input events for virtual keyboards and pasting.

Browser viewport checks: 320x568, 390x844, 768x1024, 844x390, 900x700, 1024x768,
and 1280x720. Checks cover heading/copy/button bounds, horizontal overflow, phone
documentation search/navigation, article images, and interpreter output. The
playground was also checked at phone, tablet, and desktop widths.

`.gitattributes` preserves downloaded vendor bytes so Windows line-ending settings
cannot invalidate script integrity hashes on checkout.

### Input and icon refinements

- The SVG wrapper has no inset clipping boundary; the section's black border is
  the clipping edge. The pattern fits rows to its container, overscans every edge,
  and rebuilds on container resize. Icon viewports are 56 by 42 (70% of 80 by 60).
  Placement uses randomized Poisson-disc sampling with equal clearance in every
  direction, balanced icon types and no fixed rows. The seeded layout remains
  stable across repeated layout updates. Tests check clearance and section coverage.
- The Monster can is replaced by the complete sourced claw outline, without lettering
  or a cropping mask, with padding and a gentle wiggle.
  New line-art strokes increase from 0.65 to 0.85 SVG units.
- The sourced car has an endless passing road with edges and left-moving lane marks,
  rolling tires with hubs and spokes, and suspension motion.
- Starfield touch listeners are passive and do not call `preventDefault`; the canvas
  explicitly permits vertical panning and pinch zoom.
- `npm test` runs the touch-scroll regression against the actual starfield script.

### Section, light and scenery geometry

- Sections occupy 100dvh, with the existing 16px black separator painted outside
  and spaced between sections. On phones/tablets, Little and Vision grow naturally
  beyond that minimum height so all copy and links use normal document scrolling.
  Neither section creates a separate scroll container.
- Vision beams widen from the actual lens edges and continue beyond their target;
  fixture rotation and canvas geometry share coordinates. Pointer and keyboard
  focus aim the lamps, with passive scroll tracking and readable touch layouts.
- The sign has a compact, content-sized board (up to 440px wide) with readable
  text and aligned posts on the raised hill. Additional original tree shapes,
  a picnic pair, a small bench, footpath, flowers and occasional sourced Tabler
  butterflies use the existing scenery palette. Decorations are noninteractive
  and hidden from AT.
- The airplane starts right-to-left with Welcome / to my / Website!, then returns
  left-to-right with Enjoy / your / Stay :D. Only the aircraft mirrors, keeping its
  trailing banner readable. The original aircraft SVG now has a spinning propeller
  projected along its nose axis, ahead of the front engine block. `npm test` verifies both complete flight cycles.

The ignored `.migration-source/` folder is the shallow source checkout. Scripts in
`scripts/` record the one-time import and repairs; the deployable source of truth
is `public/`. Deployment needs only `npm ci` and `npm run deploy`.

The activation monitor completed successfully and was deleted after public DNS,
valid HTTPS on apex/www, and actual Web Analytics collection were verified.

References:
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/how-to/web-analytics/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://www.godaddy.com/en-uk/help/change-my-domain-nameservers-664
