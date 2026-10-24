import test from 'node:test';
import assert from 'node:assert/strict';
import {keywordChanges, applyKeywordChanges} from '../public/little/editor/keyword-rewrite.mjs';
import {defaultKeywords, keywordDefinitions} from '../public/little/editor/keywords.mjs';
const rewrite = (source, after, before = defaultKeywords) => applyKeywordChanges(source, keywordChanges(source, before, {...before, ...after}, keywordDefinitions));

test('keyword renaming edits complete code tokens, leaving strings and comments unchanged', () => {
    const code = 'define count = 6\nprint("define print \\\"print\\\"")\n"""define print documentation"""\n// define print\n/* print define */\nprint(count)\ndefine printer = 1';
    assert.equal(rewrite(code, {VARIABLE_DECLARATION: 'let', PRINT_FUNCTION_NAME: 'say'}),
        'let count = 6\nsay("define print \\\"print\\\"")\n"""define print documentation"""\n// define print\n/* print define */\nsay(count)\nlet printer = 1');
});

test('renaming preserves member names and user-defined names', () => {
    assert.equal(rewrite('print(1)\nobj.print(2)\nobj.define\ndefine printer = 3', {PRINT_FUNCTION_NAME:'say',VARIABLE_DECLARATION:'let'}),
        'say(1)\nobj.print(2)\nobj.define\nlet printer = 3');
    assert.equal(rewrite('define Number = 5\nprint(Number)', {TYPE_INT:'Integer'}), 'define Number = 5\nprint(Number)');
    assert.equal(rewrite('action print() = { return 1 }\nprint()', {PRINT_FUNCTION_NAME:'say'}), 'action print() = { return 1 }\nprint()');
});

test('keyword replacements are simultaneous and survive repeated customization', () => {
    const first = {...defaultKeywords, VARIABLE_DECLARATION:'let', PRINT_FUNCTION_NAME:'say'};
    const source = 'define x = 8\nprint("define")\nprint(x)';
    const renamed = rewrite(source, first);
    assert.equal(renamed, 'let x = 8\nsay("define")\nsay(x)');
    assert.equal(rewrite(renamed, defaultKeywords, first), source);
});

test('property delimiter renaming preserves decimal numbers and quoted text', () => {
    assert.equal(rewrite('print(8.type)\ndefine pi = 3.14\nprint("8.type")', {PROPERTY_ACCESS_SIGN:'::'}),
        'print(8::type)\ndefine pi = 3.14\nprint("8.type")');
});

test('standard-library member renaming distinguishes string and array receivers', () => {
    const code='define text = "abc"\ndefine items = Array.create(Number, 3)\nprint(text.length)\nprint(items.length)';
    const after={...defaultKeywords,STDLIB__STRING_length:'characters'};
    const result=rewrite(code,after);
    assert.match(result,/text\.characters/);assert.match(result,/items\.length/);
});

test('type cast method prefixes and type names are rewritten together', () => {
    assert.equal(rewrite('print(8.toCharacters())',{TYPE_CAST_FUNCTION_PREFIX:'convert',TYPE_STRING:'Text'}),'print(8.convertText())');
});
