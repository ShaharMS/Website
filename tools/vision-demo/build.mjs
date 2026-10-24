import {execFileSync} from 'node:child_process';
import {mkdir,access,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const ref='c02cd10ad15b1204248ff7c938989b8d8402edb9';
const source=path.join(root,'artifacts/runtime-sources/vision-'+ref.slice(0,8));
try{await access(path.join(source,'.git'));}catch{await mkdir(path.dirname(source),{recursive:true});execFileSync('git',['clone','--filter=blob:none','--no-checkout','https://github.com/ShaharMS/Vision.git',source],{stdio:'inherit'});execFileSync('git',['-C',source,'sparse-checkout','set','src'],{stdio:'inherit'});}
execFileSync('git',['-C',source,'fetch','--depth','1','origin',ref],{stdio:'inherit'});execFileSync('git',['-C',source,'checkout','--detach',ref],{stdio:'inherit'});
const output=path.join(root,'public/vision/demo');
execFileSync('haxe',['-cp',path.join(source,'src'),'-cp',path.join(root,'tools/vision-demo'),'-main','BrowserVision','-dce','full','-D','analyzer-optimize','-js',path.join(output,'runtime.js')],{stdio:'inherit'});
const api=await readFile(path.join(source,'src/vision/Vision.hx'),'utf8');
const methods=[...api.matchAll(/public static function (\w+)/g)].map(match=>match[1]);
await writeFile(path.join(output,'build-info.json'),JSON.stringify({version:'2.2.0',repository:'https://github.com/ShaharMS/Vision',commit:ref,compiler:execFileSync('haxe',['--version'],{encoding:'utf8'}).trim(),methods},null,2)+'\n');
let license;for(const file of ['LICENSE','LICENSE.md','License.md','LICENSE.txt'])try{license=await readFile(path.join(source,file),'utf8');break;}catch{}
if(!license)throw new Error('Vision license not found');await writeFile(path.join(output,'LICENSE.txt'),license.trimEnd()+'\n');
console.log('Built real Vision '+methods.length+'-method demo adapter.');
