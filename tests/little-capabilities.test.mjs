import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const classic=readFileSync(new URL('../public/little/editor/runtime.js',import.meta.url),'utf8');
const modern=readFileSync(new URL('../public/little/editor/functional/runtime.js',import.meta.url),'utf8');
function run(source,profile,code,keywords={}) {const c=vm.createContext({});vm.runInContext(source,c);return profile==='classic'?c.little.runEditor(code,keywords):c.LittleBrowser.run(code,keywords);}
test('classic runtime supports custom loop and arithmetic operator aliases',()=>{
 assert.equal(run(classic,'classic','print(6⊕7)',{ADD_SIGN:'⊕'}).output,'13\n');
 assert.equal(run(classic,'classic','define i = 0\nrepeat(i < 3) {print(i)\ni = i + 1}',{CONDITION__WHILE_LOOP:'repeat'}).output,'0\n1\n2\n');
});
test('functional runtime executes arrays, string methods and renamed standard library members',()=>{
 assert.equal(run(modern,'functional','define xs = Array.create(Number, 3)\nxs.set(0,7)\nprint(xs.get(0))').output,'7\n');
 assert.equal(run(modern,'functional','print("hello".upper())',{STDLIB__STRING_toUpperCase:'upper'}).output,'HELLO\n');
 assert.equal(run(modern,'functional','let x=42\nsay(x)',{VARIABLE_DECLARATION:'let',PRINT_FUNCTION_NAME:'say'}).output,'42\n');
});

test('functional default supports loops, branches, returns and dense classic-compatible expressions',()=>{
 for(const [code,expected] of [
  ['define i=0\nwhile(i<3){print(i)\ni=i+1}','0\n1\n2\n'],
  ['for (define i from 0 to 3) {print(i)}','0\n1\n2\n'],
  ['if (false) {print(1)} else {print(2)}','2\n'],
  ['action twice(define x) = {return x * 2}\nprint(twice(4))','8\n'],
  ['print(2 + 3 * 4)','14\n']
 ]){const result=run(modern,'functional',code);assert.equal(result.error,false,result.message);assert.equal(result.output,expected);assert.match(result.ast,/Ast/);}
 const renamed=run(modern,'functional','let i=0\nrepeat(i<3){say(i)\ni=i+1}',{VARIABLE_DECLARATION:'let',CONDITION__WHILE_LOOP:'repeat',PRINT_FUNCTION_NAME:'say'});
 assert.equal(renamed.error,false,renamed.message);assert.equal(renamed.output,'0\n1\n2\n');
});

test('functional runtime supports object fields and reactive conditions',()=>{
 assert.equal(run(modern,'functional','define object = Object.create()\ndefine object.name = "hello"\nprint(object.name)').output,'hello\n');
 assert.equal(run(modern,'functional','define x = 0\nafter (x > 1) {print(x)}\nx = 1\nx = 2\nx = 3').output,'2\n');
 assert.equal(run(modern,'functional','define x = 0\nwhenever (x > 1) {print(x)}\nx = 1\nx = 2\nx = 3').output,'2\n3\n');
});
test('functional raw memory allocates zeroed bytes and writes numeric arrays correctly',()=>{
 assert.equal(run(modern,'functional','define p = Memory.allocate(4)\nprint(Memory.read(p, Number))\nMemory.free(p, 4)').output,'0\n');
 const code='define bytes = Array.create(Number, 4)\nbytes.set(0,65)\nbytes.set(1,66)\nbytes.set(2,67)\nbytes.set(3,68)\ndefine p = Memory.allocate(4)\nMemory.write(p, bytes)\nprint(Memory.read(p, Number))\nMemory.free(p, 4)';
 const result=run(modern,'functional',code);assert.equal(result.error,false,result.message);assert.equal(result.output,'1145258561\n');
});

test('functional runtime accepts renamed keywords with combining Unicode marks',()=>{
 const declaration='\u0918\u094b\u0937\u093f\u0924';
 const result=run(modern,'functional',declaration+' x = 3\nprint(x)',{VARIABLE_DECLARATION:declaration});
 assert.equal(result.error,false,result.message);assert.equal(result.output,'3\n');
});

import {exampleForKeyword,defaultKeywords} from '../public/little/editor/keywords.mjs';
test('usage examples describe real string, array and memory APIs',()=>{
 assert.equal(exampleForKeyword('STDLIB__STRING_toUpperCase',defaultKeywords),'"hello".toUpperCase()');
 assert.equal(exampleForKeyword('STDLIB__ARRAY_get',defaultKeywords),'items.get(0)');
 assert.equal(exampleForKeyword('STDLIB__MEMORY_read',defaultKeywords),'Memory.read(address, Number)');
});
