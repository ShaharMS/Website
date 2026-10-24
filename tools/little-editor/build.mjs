import {build} from 'esbuild';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {keywordDefinitions, normalizeKeywords, classicOperators, classicFieldNames} from '../../public/little/editor/keywords.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const editor = path.join(root, 'public/little/editor');
await build({entryPoints: [path.join(editor, 'editor-source.js')], outfile: path.join(editor, 'editor.js'), bundle: true, nodePaths: [path.join(root,'tools/little-editor/node_modules')], minify: true, format: 'esm', target: ['es2020'], legalComments: 'eof'});
let original = await readFile(path.join(root, 'public/little/demo/interp.js'), 'utf8');
for (const [sign,field] of Object.entries(classicOperators)) original = original.split('registerSign(' + JSON.stringify(sign) + ',').join('registerSign(little_Keywords.' + field + ',');
for (const [word,field] of Object.entries({while:'CONDITION__WHILE_LOOP', for:'CONDITION__FOR_LOOP', if:'CONDITION__IF', else:'CONDITION__ELSE', from:'FOR_LOOP_FROM', to:'FOR_LOOP_TO', jump:'FOR_LOOP_JUMP'})) original=original.split(JSON.stringify(word)).join('little_Keywords.'+field);
if (original.split('Main.main();').length !== 2) throw new Error('Interpreter entrypoint changed');
const bridge = `
// Replace only the old DOM demo entrypoint; retain the existing Little engine.
haxe_Log.trace = function() {};
little_interpreter_Runtime.onErrorThrown.push(function() {throw new Error('Execution stopped after a Little error.');});
little_interpreter_Runtime.print = function(item) {
    var text = String(item) + String.fromCharCode(10);
    var remaining = 100000 - little_interpreter_Runtime.stdout.length;
    little_interpreter_Runtime.stdout += text.slice(0, remaining);
    if (text.length > remaining) throw new Error('Output limit reached.');
};
var keywordDefinitions = ${JSON.stringify(keywordDefinitions)};
var classicEditorFields = ${JSON.stringify([...classicFieldNames])};
var normalizeEditorKeywords = ${normalizeKeywords.toString()};
$hx_exports.little.runEditor = function(code, keywords) {
    try {
        var config = normalizeEditorKeywords(keywords, keywordDefinitions.filter(function(row) {return classicEditorFields.indexOf(row[0]) !== -1;}));
        if (config.error) return {output: '', error: true, message: config.error};
        Object.keys(config.values).forEach(function(key) {little_Keywords[key] = config.values[key];});
        little_Keywords.FOR_LOOP_IDENTIFIERS = {FROM: config.values.FOR_LOOP_FROM, TO: config.values.FOR_LOOP_TO, JUMP: config.values.FOR_LOOP_JUMP};
        little_Keywords.SPECIAL_OR_MULTICHAR_SIGNS.push(config.values.PROPERTY_ACCESS_SIGN);
        little_interpreter_Runtime.exitCode = 0;
        little_Little.run(code, false);
        return {output: little_interpreter_Runtime.stdout, error: little_interpreter_Interpreter.errorThrown, ast: little_interpreter_Interpreter.errorThrown ? '' : little_tools_PrettyPrinter.printParserAst(little_parser_Parser.parse(little_lexer_Lexer.lex(code)))};
    } catch (error) {
        return {output: little_interpreter_Runtime.stdout, error: true, message: little_interpreter_Interpreter.errorThrown ? '' : String(error.message || error)};
    }
};`;
await writeFile(path.join(editor, 'runtime.js'), original.replace('Main.main();', bridge).replace('//# sourceMappingURL=interp.js.map','').trimEnd() + '\n');
// Retain third-party notices alongside the bundled runtime dependencies.
await mkdir(path.join(editor,'vendor'), {recursive:true});
const packages = ['@codemirror/state','@codemirror/view','@codemirror/commands','@codemirror/language','@codemirror/autocomplete','@lezer/highlight','@lezer/common','@lezer/lr','style-mod','w3c-keyname','crelt'];
let licenses = '';
for (const name of packages) {
    const folder = path.join(root,'tools/little-editor/node_modules',name);
    const metadata = JSON.parse(await readFile(path.join(folder,'package.json'),'utf8'));
    const license = await readFile(path.join(folder,'LICENSE'),'utf8');
    licenses += `\n${name}@${metadata.version}\n${license}\n`;
}
await writeFile(path.join(editor,'vendor/LICENSES.txt'), licenses.trimEnd() + '\n');
console.log('Built self-hosted Little editor and worker runtime.');
