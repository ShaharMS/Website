# Vision browser demo

/vision/demo runs the actual Vision 2.2.0 library compiled from the pinned public
release source c02cd10ad15b1204248ff7c938989b8d8402edb9. It does not substitute
CSS/canvas approximations for Vision effects. BrowserVision.hx transfers RGBA
pixels into vision.ds.Image, calls the library, and returns the output pixels.
The catalog covers all 52 public Vision methods and 17 Image operations; freehand
brush/erase additionally uses Image.fillCircle along the stroke. Detection results
are overlaid through Image drawing and returned as structured operation data.

Features: grouped/filterable API selection; typed parameters, kernels/matrices and
advanced detector JSON options; original/current processing; optional reference
image; source/result comparison; zoom; bounded undo/reset; drawing tools; local
image import; blank transparent images; PNG/JPEG/WebP download; stop and a worker
execution timeout. The test chart is deterministic browser-drawn test material;
the optional Valve sample is the existing local library image. User images remain
inside the browser and are never uploaded. Working-size limits are selectable;
downsampling is identified alongside the source filename. Full-size import/output
is capped at 16 megapixels to keep the browser workspace usable.

The UI deliberately uses the existing dark editor palette, simple controls,
borders and native API names, without a marketing hero or decorative dashboards.
The layout stacks on phones; View mode permits normal scrolling, while explicitly
selected drawing tools capture pointer/touch gestures on the result canvas.

Rebuild with Haxe 4.3.7 and Git:

    node tools/vision-demo/build.mjs

The builder fetches pinned source into ignored artifacts/, never modifies the
actual Vision repository or global haxelib settings, and writes checked-in runtime,
license and provenance files. The ordinary site deploy needs no Haxe installation.
Use npm run deploy to retain automatic release asset versioning.

Verification: exact invert/drawing/alpha pixels; execution smoke tests for every
catalog operation; direct browser drawing; device PNG import; real Image.resize;
and a downloaded PNG checked for its actual output dimensions. Drawing shapes
outside native Image bounds may produce the library's normal bounds error; the
workspace preserves the previous image and allows correcting parameters.
