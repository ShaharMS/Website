# Little embedded editor

The homepage uses this DOM-based CodeMirror 6 editor instead of the old OpenFL
canvas demo. It includes highlighted Little source, output, Run, Stop, Reset,
Ctrl/Cmd+Enter and undo/redo. The editor stays visible on phones, stacks below
the description on narrow layouts, and uses 16px code text on small screens.

The same bundled Little interpreter used by /little/demo is retained. The build
replaces only its DOM-demo entrypoint with a worker API and plain output formatter.
Each execution gets a fresh worker; Stop and the three-second timeout terminate
that worker. Output is capped at 100,000 characters. This does not upgrade the language
runtime to the newer functional-programming branch.

Syntax highlighting adapts the grammar from ShaharMS/Little:
- Branch: branch/functional-programming
- Commit: 91a66626119da16935fb5ef1fb05a2fc506b776a
- Path: syntax-highlighting-vscode/Little.syntax/syntaxes/little.tmLanguage.json
- Source: https://github.com/ShaharMS/Little/blob/91a66626119da16935fb5ef1fb05a2fc506b776a/syntax-highlighting-vscode/Little.syntax/syntaxes/little.tmLanguage.json

The original grammar is retained in source/. Keyword, type, number and documentation
rules are reused; the tokenizer is adapted to CodeMirror's stream parser. The
highlight palette follows Little's existing browser demo and VS Code theme.
Third-party dependency notices are in vendor/LICENSES.txt.

Rebuild from the repository root:

    npm ci --prefix tools/little-editor
    npm run build --prefix tools/little-editor

The pinned dependency lock and build source live in tools/little-editor. The
bundled editor.js and runtime.js are checked in, so normal Pages deployment
requires no additional build step or external CDN. No legacy playground or docs
are removed by this change.
