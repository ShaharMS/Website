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
that worker. Output is capped at 100,000 characters. Classic remains the default; an explicitly selected functional-branch preview
is also bundled. See tools/little-editor/functional/README.md for pins and limits.

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
right-side content, with Quickstart below the keyword form, matching its desktop ordering. There is no horizontal document overflow.

The AST remains LTR. The dedicated-page LTR/RTL button switches code and output
together, never the AST. The homepage preview has no direction button and retains
its existing controls. Quickstart code examples and inline keyword names follow
the configured aliases using the same token-aware rewrite and highlighter.

All applicable keyword customization fields (45 classic, 87 functional preview) drive execution, highlighting and highlighted
usage examples. Changing a keyword also rewrites complete code tokens using the
previous keyword set. Quoted strings, documentation/comments, longer identifiers,
member names and declarations of user-defined names are protected. Changes are
applied simultaneously through a CodeMirror transaction, retaining editor selection
mapping and undo history. Blank fields return to defaults and rewrite aliases back.
Reset restores the initial example using the current keyword names. Invalid or
conflicting names are flagged before execution.

On the dedicated page, horizontal dividers resize Code/AST and AST/Output using
pointer capture for both mouse and touch. Each pane retains a minimum usable
height. Divider keyboard controls support arrows (Shift for larger steps) and
Home/End. Dragging affects only the adjacent panes, respects AST collapse, and
preserves the expanded layout when toggling it. Proportions adapt to viewport
changes; CodeMirror is remeasured after layout. Only divider handles block touch
scroll gestures, so the surrounding mobile page continues to scroll normally.

The playground has no Home/Guides/Documentation navigation strip. Its Quickstart
manual remains inline below the keyword table on every screen size. The invented
separate /little/guides page has been removed. Haxe articles live at /haxe/,
with old /little/doc entry points redirected for existing bookmarks; the Haxe area
contains no Little landing page or playground cross-links. Little's homepage
Documentation button points to the actual repository reference.

Runtime selection filters the table to supported fields. The settings filter
searches names and default values. New controls include condition/loop names,
operator symbols, internal type/module names, and—in the functional preview—the
array/object/memory types, standard-library member names and cast/constructor
names. Highlighting, usage examples, Quickstart and safe rewriting follow the
active profile. Member rewriting distinguishes inferable string/array receivers;
ambiguous member names remain unchanged instead of altering unrelated fields.
Site deployment automatically versions this editor, both workers/runtimes and all
CSS dependencies through scripts/build-site.mjs; manual ?v= bumps are unnecessary.
