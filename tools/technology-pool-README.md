# Technology bathtub

The approved introduction and Rubber / Duck Tray section are part of `public/index.html`, immediately after the Wall of Fame. Section dividers are 16px black, matching the rest of the homepage.

## Text editing

Run `npm run dev` and open its local URL. All headings, the introduction link, the two curved instruction labels, and every technology title/description are HTML source regions handled by the existing inline editor. Place a logo on the shelf to edit that technology's card. The curved labels flatten into ordinary editable text on focus and return to their curves on blur. Physics pauses while an editable region has focus. Changes save to `public/index.html`; production has no editing UI or write endpoint.

Card articles are stored in `#pool-technology-copy` and moved into the visible card as the selection changes. Keep those source nodes intact so native editing continues to save the correct region.

## Runtime and assets

`public/sources/technology-pool/` contains the fixed-step simulation, impermeable card/hand water exclusion, shelf gates, drawing and interaction code. Water volume is conserved by integrating its visible area around moving obstacles. Both user-held and automatic draining run at 0.085 chamber volumes/second; the faucet adds 0.075. The delayed hand responds to repeated high-water shelf/card cycling.

`public/images/technologies/physics-data.json` pairs 26 normalized 192px icons with solid exterior colliders and abstraction-level buoyancy. `sources.json` records original asset URLs and hashes, including the two reference-based glove poses. WPF uses the XAML mark. Keep image/collider geometry synchronized when changing an icon.

Runtime resource URLs resolve relative to the module, so versioned builds use the matching immutable icons and JSON. No development demo selectors, local asset URLs or alternative designs are loaded by the website.

## Checks

- `npm run test:technology`: containment, collisions, aggressive dragging, shelf walls, card replacement and removal, conserved water area, and delayed rescue on desktop and phone dimensions.
- `npm run check`: local link validation.
- `npm run build`: production packaging and immutable asset references.

Browser checks should also cover the duck-only hit target, valve/stem connection, section dividers, native label/card source edits, mobile layout, and normal production editor isolation.
