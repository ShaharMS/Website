import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
const source = readFileSync(new URL('../public/little/editor/runtime.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const run = code => context.little.runEditor(code);

test('the embedded Little runtime produces output and reports real parser errors', () => {
    assert.equal(run('print("Hello from Little!")\ndefine answer = 6 * 7\nprint(answer)').output, 'Hello from Little!\n42\n');
    const bad = run('define x =');
    assert.equal(bad.error, true);
    assert.match(bad.output, /Missing value/);
    assert.equal(run('print(9)').error, false);
    assert.equal(run('print("  spaced  ")').output, '  spaced  \n');
    assert.equal(run('print(9)').output, '9\n', 'previous output does not leak between runs');
});

test('nonterminating Little code runs off-thread and can be cancelled', async () => {
    const worker = new Worker(`const {parentPort} = require('node:worker_threads'); const vm = require('node:vm');
        const context = vm.createContext({}); vm.runInContext(${JSON.stringify(source)}, context);
        parentPort.postMessage('running'); context.little.runEditor('define i = 0\\nwhile (i < 10000) {define j = 0\\nwhile (j < 10000) {j = j + 1}\\ni = i + 1}'); parentPort.postMessage('ended');`, {eval: true});
    try {
        await new Promise((resolve, reject) => {worker.once('message', resolve);worker.once('error', reject);});
        const exit = await worker.terminate();
        assert.equal(exit, 1);
    } finally {await worker.terminate();}
});
import {normalizeKeywords, defaultKeywords} from '../public/little/editor/keywords.mjs';

test('custom Little keyword names change real execution and preserve syntax-tree output', () => {
    const configured = vm.createContext({});
    vm.runInContext(source, configured);
    const result = configured.little.runEditor('let answer as Integer = 6 * 7\nsay(answer)', {
        VARIABLE_DECLARATION: 'let', TYPE_INT: 'Integer', PRINT_FUNCTION_NAME: 'say'
    });
    assert.equal(result.output, '42\n');
    assert.equal(result.error, false);
    assert.match(result.ast, /Variable Creation/);
    assert.match(result.ast, /say/);
});

test('keyword customization preserves blank defaults and validates conflicts', () => {
    assert.deepEqual(normalizeKeywords({PRINT_FUNCTION_NAME: ''}).values, defaultKeywords);
    assert.equal(normalizeKeywords({VARIABLE_DECLARATION: 'let value'}).field, 'VARIABLE_DECLARATION');
    assert.equal(normalizeKeywords({PRINT_FUNCTION_NAME: 'define'}).field, 'PRINT_FUNCTION_NAME');
    assert.equal(normalizeKeywords({VARIABLE_DECLARATION: '\u05d4\u05d2\u05d3\u05e8'}).error, null);
    assert.equal(normalizeKeywords({PROPERTY_ACCESS_SIGN: '::'}).values.PROPERTY_ACCESS_SIGN, '::');
    const bad = run('define x =');
    assert.equal(bad.error, true);
    assert.doesNotMatch(bad.output, /Cannot read properties/);
});

test('custom multicharacter property access reaches the interpreter lexer', () => {
    const configured = vm.createContext({});
    vm.runInContext(source, configured);
    const result = configured.little.runEditor('print(8::type)', {PROPERTY_ACCESS_SIGN: '::'});
    assert.equal(result.error, false);
    assert.equal(result.output, 'Number\n');
    assert.match(result.ast, /Property Access/);
});
