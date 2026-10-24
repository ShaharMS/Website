# Functional-runtime preview

The compiled runtime and its 87 String-valued KeywordConfig fields come from
ShaharMS/Little branch/functional-programming at
91a66626119da16935fb5ef1fb05a2fc506b776a. Dependency pins and compiler information
are in public/little/editor/functional/build-info.json; complete license notices
are in LICENSES.txt beside it. Little is GPL-3.0; Vision and hash retain their
respective upstream notices. This adapter and the upstream source pins provide
the rebuild inputs; no external code is fetched when running the playground.

Rebuild with Haxe 4.3.7 and Git on PATH:

    node tools/little-editor/build-functional.mjs
    npm run build --prefix tools/little-editor

The first command checks out pinned source trees under ignored artifacts/.
It does not install or change global haxelib libraries. The second command
bundles the editor and rebuilds the classic adapter. Both runtime files are
checked in, so normal site deployment needs neither Haxe nor source downloads.

The default profile remains Classic (45 supported controls). The optional
functional profile exposes 87 settings including arrays, objects, memory APIs,
conditions, operators, casts and standard-library names. It is explicitly a
preview: upstream behavior is not entirely compatible with the bundled classic
engine, including some loop behavior. It is not silently substituted for classic.
Verified preview examples include Array.create/get/set, string methods, renamed
standard-library methods, custom type/constructor names and basic arithmetic.
The worker timeout and output cap apply to both engines.

The adapter keeps the upstream engine intact except for a plain output formatter
and a preparation compatibility shim: upstream standard-library signature strings
still spell define/as literally, so those words are temporarily defaulted during
stdlib registration, then the user's configured aliases are restored for code.
