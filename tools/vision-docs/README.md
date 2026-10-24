# Versioned Vision API documentation

The four references are generated with [Haxe Dox](https://github.com/HaxeFoundation/dox)
1.6.0 from the Vision release tags 1.3.1, 2.0.0, 2.1.0 and 2.2.0.
The default is 2.2.0; `public/vision/docs/versions.json` records source revisions.

With Haxe 4.3.7 installed:

```powershell
haxelib install format 3.8.0
haxelib install dox 1.6.0
python scripts/build-vision-docs.py ../Vision
python scripts/check-links.py
node --test tests/vision-docs.test.mjs
```

Generation uses Git archives under ignored `artifacts/vision-docs/`, without
checking out or editing the Vision repository. Commit generated output with
the generator. Change the version list in the generator for future releases;
update the two default entry pages and article links at the same time.

The generator repairs historical comment links and two image-name typos,
uses existing vendored fonts, adds a native version selector to every page,
and generates missing distortion and seam-carving images through the public
Vision API from their respective release tags. Compiler XML and archives
remain in the ignored artifacts directory for inspection.
