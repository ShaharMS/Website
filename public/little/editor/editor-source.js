import {EditorState} from '@codemirror/state';
import {EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, keymap} from '@codemirror/view';
import {defaultKeymap, history, historyKeymap, indentWithTab} from '@codemirror/commands';
import {StreamLanguage, syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput} from '@codemirror/language';
import {closeBrackets, closeBracketsKeymap} from '@codemirror/autocomplete';
import {tags} from '@lezer/highlight';
import grammar from './source/little.tmLanguage.json';

// Use the actual keyword/type rules from Little's functional-programming branch.
const rules = grammar.repository;
const matcher = name => new RegExp('^(?:' + rules[name].patterns[0].match + ')');
const keyword = matcher('keywords'), storage = matcher('keywords2'), type = matcher('types');
const number = matcher('numbers');
const language = StreamLanguage.define({
    startState: () => ({quote: false, documentation: false}),
    token(stream, state) {
        if (state.documentation) { while (!stream.eol()) {if (stream.match('"""')) {state.documentation = false; break;} stream.next();} return 'comment'; }
        if (state.quote) { while (!stream.eol()) {const ch = stream.next(); if (ch === '\\') stream.next(); else if (ch === '"') {state.quote = false; break;}} return 'string'; }
        if (stream.eatSpace()) return null;
        if (stream.match('"""')) {state.documentation = true; return 'comment';}
        if (stream.eat('"')) {state.quote = true; return 'string';}
        if (stream.match(keyword)) return 'keyword';
        if (stream.match(storage)) return 'definitionKeyword';
        if (stream.match(type)) return 'typeName';
        if (stream.match(number)) return 'number';
        if (stream.match(/[\p{L}_][\p{L}\p{N}_]*/u)) return /^\s*\(/.test(stream.string.slice(stream.pos)) ? 'variableName.function' : 'variableName';
        if (stream.match(/[+*=<>!&|%\/-]+/)) return 'operator';
        stream.next(); return null;
    }
});
const highlight = HighlightStyle.define([
    {tag: tags.keyword, color: '#c586c0'}, {tag: tags.definitionKeyword, color: '#569cd6'},
    {tag: tags.typeName, color: '#44c9b0'}, {tag: tags.number, color: '#b5cea8'},
    {tag: tags.variableName, color: '#9cdcfe'}, {tag: tags.function(tags.variableName), color: '#dcdcaa'},
    {tag: tags.string, color: '#ff5e00'}, {tag: tags.comment, color: '#858585', fontStyle: 'italic'}
]);
const theme = EditorView.theme({
    '&': {backgroundColor: '#1e1e1e', color: '#ddd', height: '100%', fontSize: '14px'},
    '.cm-content': {fontFamily: 'Consolas, monospace', padding: '12px 0', caretColor: '#fff'},
    '.cm-line': {padding: '0 12px'}, '.cm-scroller': {fontFamily: 'Consolas, monospace', overflow: 'auto'},
    '.cm-gutters': {backgroundColor: '#1e1e1e', color: '#858585', border: 'none'},
    '.cm-activeLine, .cm-activeLineGutter': {backgroundColor: '#ffffff08'},
    '&.cm-focused .cm-cursor': {borderLeftColor: '#fff'},
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {backgroundColor: '#ffffff28'},
    '&.cm-focused': {outline: 'none'},
    '@media(max-width:600px)': {'&': {fontSize: '16px'}}
}, {dark: true});
const example = '"""Edit the greeting or the number"""\nprint("Hello from Little!")\n\ndefine answer = 6 * 7\nprint(answer)';
const output = document.getElementById('output');
const status = document.getElementById('status');
const runButton = document.getElementById('run');
const stopButton = document.getElementById('stop');
let worker = null, timer = null;
function finish(label) {
    clearTimeout(timer);
    worker?.terminate(); worker = null;
    runButton.disabled = false; stopButton.disabled = true;
    status.textContent = label;
}
function run() {
    finish('Running…');
    output.textContent = '';
    output.classList.remove('error');
    runButton.disabled = true; stopButton.disabled = false;
    worker = new Worker(new URL('./runtime-worker.js?v=1', import.meta.url));
    worker.onmessage = event => {
        const result = event.data;
        output.textContent = [result.output, result.message].filter(Boolean).join('\n') || '(No output)';
        output.classList.toggle('error', result.error);
        finish(result.error ? 'Error' : 'Finished');
    };
    worker.onerror = () => {output.textContent = 'The interpreter could not start. Try Run again.'; output.classList.add('error'); finish('Error');};
    worker.postMessage(view.state.doc.toString());
    timer = setTimeout(() => {output.textContent = 'Stopped after 3 seconds. Check for an infinite loop.'; finish('Timed out');}, 3000);
}
const view = new EditorView({
    parent: document.getElementById('editor'),
    state: EditorState.create({doc: example, extensions: [lineNumbers(), history(), drawSelection(), highlightActiveLine(), highlightActiveLineGutter(),
        language, syntaxHighlighting(highlight), bracketMatching(), indentOnInput(), closeBrackets(), EditorView.lineWrapping, theme,
        EditorView.contentAttributes.of({'aria-label': 'Little code editor', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off'}),
        keymap.of([{key: 'Mod-Enter', run: () => {run(); return true;}}, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of(update => {if (update.docChanged && !worker) status.textContent = 'Edited — Run to update output';})
    ]})
});
runButton.addEventListener('click', run);
stopButton.addEventListener('click', () => {finish('Stopped'); output.textContent ||= '(Stopped)';});
document.getElementById('reset').addEventListener('click', () => {finish('Ready'); view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: example}}); run();});
window.addEventListener('pagehide', () => finish('Ready'));
run();
