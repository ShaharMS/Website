import {EditorState, Compartment} from '@codemirror/state';
import {EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, keymap} from '@codemirror/view';
import {defaultKeymap, history, historyKeymap, indentWithTab} from '@codemirror/commands';
import {syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput} from '@codemirror/language';
import {closeBrackets, closeBracketsKeymap} from '@codemirror/autocomplete';
import {tags, highlightTree} from '@lezer/highlight';
import {createLanguage} from './language-source.js';
import {keywordChanges, applyKeywordChanges} from './keyword-rewrite.mjs';
import {keywordDefinitions, defaultKeywords, normalizeKeywords, exampleForKeyword, makeExample} from './keywords.mjs';

let keywords = {...defaultKeywords};
let language = createLanguage(keywords);
const languageSlot = new Compartment();
const directionSlot = new Compartment();
const dedicated = document.body.classList.contains('dedicated');
let direction = 'ltr';
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
const initialCode = document.getElementById('initial-code')?.textContent.trim() || makeExample(defaultKeywords);
const output = document.getElementById('output');
const write = (element, text) => {if ('value' in element) element.value = text; else element.textContent = text;};
const read = element => 'value' in element ? element.value : element.textContent;
const ast = document.getElementById('ast');
const status = document.getElementById('status');
const runButton = document.getElementById('run');
const stopButton = document.getElementById('stop');
const keywordInputs = new Map(), exampleNodes = new Map();
const guideExamples = new Map([...document.querySelectorAll('#guide pre code')].map(node => [node, node.textContent]));
let worker = null, timer = null, typingTimer = null;
function finish(label) {
    clearTimeout(timer);
    worker?.terminate(); worker = null;
    runButton.disabled = false; stopButton.disabled = true;
    status.textContent = label;
}
function configuration() {
    return normalizeKeywords(Object.fromEntries([...keywordInputs].map(([key, input]) => [key, input.value])));
}
function run() {
    clearTimeout(typingTimer);
    finish('Running…');
    const config = configuration();
    write(output, '');
    output.classList.remove('error');
    if (config.error) {write(output, config.error); output.classList.add('error'); finish('Check keywords'); return;}
    runButton.disabled = true; stopButton.disabled = false;
    const executing = worker = new Worker(new URL('./runtime-worker.js?v=2', import.meta.url));
    executing.onmessage = event => {
        if (worker !== executing) return;
        const result = event.data;
        write(output, [result.output, result.message].filter(Boolean).join('\n') || '(No output)');
        output.classList.toggle('error', result.error);
        if (ast) write(ast, result.ast || '(No syntax tree)');
        finish(result.error ? 'Error' : 'Finished');
    };
    executing.onerror = () => {if (worker !== executing) return; write(output, 'The interpreter could not start. Try Run again.'); output.classList.add('error'); finish('Error');};
    executing.postMessage({code: view.state.doc.toString(), keywords: config.values});
    timer = setTimeout(() => {write(output, 'Stopped after 3 seconds. Check for an infinite loop.'); finish('Timed out');}, 3000);
}
function scheduleRun() {
    clearTimeout(typingTimer);
    finish('Waiting for typing…');
    stopButton.disabled = false;
    // A short pause avoids executing every intermediate character or IME fragment.
    typingTimer = setTimeout(() => view.composing ? scheduleRun() : run(), 400);
}
const view = new EditorView({
    parent: document.getElementById('editor'),
    state: EditorState.create({doc: initialCode, extensions: [lineNumbers(), history(), drawSelection(), highlightActiveLine(), highlightActiveLineGutter(),
        languageSlot.of(language), directionSlot.of(EditorView.editorAttributes.of({dir: direction})), syntaxHighlighting(highlight), bracketMatching(), indentOnInput(), closeBrackets(), EditorView.lineWrapping, theme,
        EditorView.contentAttributes.of({'aria-label': 'Little code editor', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off'}),
        keymap.of([{key: 'Mod-Enter', run: () => {run(); return true;}}, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of(update => {if (update.docChanged) scheduleRun();})
    ]})
});
function renderExample(node, code) {
    const tree = language.parser.parse(code);
    node.replaceChildren();
    let position = 0;
    highlightTree(tree, highlight, (from, to, classes) => {
        if (from > position) node.append(document.createTextNode(code.slice(position, from)));
        const span = document.createElement('span'); span.className = classes; span.textContent = code.slice(from, to); node.append(span);
        position = to;
    });
    if (position < code.length) node.append(document.createTextNode(code.slice(position)));
}
function updateKeywords() {
    const config = configuration();
    keywordInputs.forEach((input, key) => input.setAttribute('aria-invalid', String(config.field === key)));
    if (!config.error) {
        const changes = keywordChanges(view.state.doc.toString(), keywords, config.values, keywordDefinitions);
        keywords = config.values;
        language = createLanguage(keywords);
        view.dispatch({changes, effects: languageSlot.reconfigure(language)});
        exampleNodes.forEach((node, key) => renderExample(node, exampleForKeyword(key, keywords)));
        guideExamples.forEach((code, node) => renderExample(node, applyKeywordChanges(code, keywordChanges(code, defaultKeywords, keywords, keywordDefinitions))));
        document.querySelectorAll('#guide code[data-keyword]').forEach(node => {node.textContent = keywords[node.dataset.keyword];});
    }
    scheduleRun();
}
const table = document.getElementById('k-table-body');
if (table) {
    for (const [key, fallback, label] of keywordDefinitions) {
        const row = document.createElement('tr');
        const nameCell = document.createElement('th'); nameCell.scope = 'row';
        const name = document.createElement('label'); name.htmlFor = key;
        name.textContent = label;
        nameCell.append(name);
        const inputCell = document.createElement('td'); const input = document.createElement('input');
        input.id = key; input.placeholder = fallback; input.autocomplete = 'off'; input.spellcheck = false;
        input.setAttribute('autocapitalize','off'); input.setAttribute('autocorrect','off'); input.addEventListener('input', updateKeywords);
        inputCell.append(input); keywordInputs.set(key, input);
        const sampleCell = document.createElement('td'); const sample = document.createElement('code'); sampleCell.append(sample); exampleNodes.set(key, sample);
        row.append(nameCell, inputCell, sampleCell); table.append(row);
    }
    updateKeywords();
    document.getElementById('reset-keywords')?.addEventListener('click', () => {keywordInputs.forEach(input => {input.value = '';}); updateKeywords();});
}
runButton.addEventListener('click', run);
stopButton.addEventListener('click', () => {clearTimeout(typingTimer); finish('Stopped'); if (!read(output)) write(output, '(Stopped)');});
document.getElementById('reset').addEventListener('click', () => {
    finish('Ready');
    const config = configuration();
    view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: applyKeywordChanges(initialCode, keywordChanges(initialCode, defaultKeywords, config.error ? defaultKeywords : config.values, keywordDefinitions))}});
    run();
});
const directionButton = dedicated ? document.getElementById('direction-toggle') : null;
if (directionButton) directionButton.addEventListener('click', () => {
    direction = direction === 'ltr' ? 'rtl' : 'ltr';
    view.dispatch({effects: directionSlot.reconfigure(EditorView.editorAttributes.of({dir: direction}))});
    output.dir = direction;
    output.style.textAlign = 'start';
    if (ast) ast.dir = 'ltr';
    directionButton.textContent = direction.toUpperCase();
    directionButton.title = 'Switch code and output to ' + (direction === 'ltr' ? 'RTL' : 'LTR');
});
window.addEventListener('pagehide' , () => {clearTimeout(typingTimer); finish('Ready');});
run();
