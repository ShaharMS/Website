# Functional browser runtime

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

Functional is the default in both the homepage preview and Try Online, exposing
all 87 String-valued configuration fields. Classic remains an optional compatibility
profile. The JS-target condition bug is fixed by the reproducible patch in
patch-runtime.mjs: null wildcard keys in Haxe ObjectMap become empty-array wildcard
keys, and condition matching recognizes that representation. This repairs loops,
for, if/else, and return propagation without replacing the language with a shim.
Additional compatibility patches zero-fill raw allocations, repair numeric
byte-array writes and preserve object field names during conversion. Regression
tests execute compact expressions, while/for, if/else, function returns, after/
whenever watchers, object fields, arrays, methods, memory round-trips, aliases and
parser failures. The timeout/output cap
remain active for runaway programs.

The adapter keeps the upstream engine intact except for a plain output formatter
and a preparation compatibility shim: upstream standard-library signature strings
still spell define/as literally, so those words are temporarily defaulted during
stdlib registration, then the user's configured aliases are restored for code.
