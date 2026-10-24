# Little embedded editor

The homepage uses this DOM-based CodeMirror 6 editor instead of the old OpenFL
canvas demo. Try Online at /little/demo/ uses the same editor. It includes
highlighted Little source, output, Run, Stop, Reset,
Ctrl/Cmd+Enter and undo/redo. There is no preview title bar: execution controls
sit at the bottom right of the code pane, immediately above output. Source edits
automatically run after a 400ms pause, including keyword edits on Try Online.
Manual Run is re-enabled after completion; Stop cancels both execution and pending
automatic runs. A new edit terminates the previous worker, preventing stale output. The editor stays visible on phones, stacks below
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

Try Online blends the newer editor/table styling with the original information
layout. Code, a visible collapsible AST, bottom execution controls and Output share
the left working pane. The modern keyword table stays at the upper right in a
bounded scrolling region; the Quickstart manual stays below it, with the existing
getting-started examples available directly in the page. The editor remains sticky
while reading the manual on desktop. On phones, editor/AST/output stack above the
right-side content, with Quickstart ahead of the keyword form as in the old mobile
layout. There is no horizontal document overflow.

The AST remains LTR. The dedicated-page LTR/RTL button switches code and output
together, never the AST. The homepage preview has no direction button and retains
its existing controls. Quickstart code examples and inline keyword names follow
the configured aliases using the same token-aware rewrite and highlighter.

All 19 keyword customization fields drive execution, highlighting and highlighted
usage examples. Changing a keyword also rewrites complete code tokens using the
previous keyword set. Quoted strings, documentation/comments, longer identifiers,
member names and declarations of user-defined names are protected. Changes are
applied simultaneously through a CodeMirror transaction, retaining editor selection
mapping and undo history. Blank fields return to defaults and rewrite aliases back.
Reset restores the initial example using the current keyword names. Invalid or
conflicting names are flagged before execution.
