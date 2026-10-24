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
test('functional preview executes arrays, string methods and renamed standard library members',()=>{
 assert.equal(run(modern,'functional','define xs = Array.create(Number, 3)\nxs.set(0,7)\nprint(xs.get(0))').output,'7\n');
 assert.equal(run(modern,'functional','print("hello".upper())',{STDLIB__STRING_toUpperCase:'upper'}).output,'HELLO\n');
 assert.equal(run(modern,'functional','let x=42\nsay(x)',{VARIABLE_DECLARATION:'let',PRINT_FUNCTION_NAME:'say'}).output,'42\n');
});
