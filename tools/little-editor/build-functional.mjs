import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const pins={
 little:['https://github.com/ShaharMS/Little.git','91a66626119da16935fb5ef1fb05a2fc506b776a'],
 vision:['https://github.com/ShaharMS/Vision.git','c02cd10ad15b1204248ff7c938989b8d8402edb9'],
 hash:['https://github.com/flashultra/hash.git','bd127faf476c1bc63826f95e8f2fbb6e36b84304']
};
const sources={};
for(const [name,[repo,ref]] of Object.entries(pins)) {
 const folder=path.join(root,'artifacts/runtime-sources',name+'-'+ref.slice(0,8));
 try {await access(path.join(folder,'.git'));} catch {
  await mkdir(path.dirname(folder),{recursive:true});
  execFileSync('git',['clone','--filter=blob:none','--no-checkout',repo,folder],{stdio:'inherit'});
  execFileSync('git',['-C',folder,'sparse-checkout','set','src'],{stdio:'inherit'});
 }
 execFileSync('git',['-C',folder,'fetch','--depth','1','origin',ref],{stdio:'inherit'});
 execFileSync('git',['-C',folder,'checkout','--detach',ref],{stdio:'inherit'});
 sources[name]=folder;
}
const output=path.join(root,'public/little/editor/functional');await mkdir(output,{recursive:true});
execFileSync('haxe',['-cp',path.join(sources.little,'src'),'-cp',path.join(sources.vision,'src'),'-cp',path.join(sources.hash,'src'),'-cp',path.join(root,'tools/little-editor/functional'),'-main','BrowserRuntime','-js',path.join(output,'runtime.js')],{stdio:'inherit'});
const config=await readFile(path.join(sources.little,'src/little/KeywordConfig.hx'),'utf8');const fields=[];
for(const match of config.matchAll(/@:optional public var (\w+):String = ("[^"\n]*")/g)) {
 const key=match[1],value=JSON.parse(match[2]);
 const kind=key.endsWith('_SIGN')?'operator':key.startsWith('TYPE_')&&!['TYPE_DECL_OR_CAST','TYPE_CAST_FUNCTION_PREFIX'].includes(key)?'typeName':key.includes('FUNCTION_NAME')||key.startsWith('STDLIB__')||key.startsWith('OBJECT_')?'variableName.function':key.startsWith('CONDITION_')||key.startsWith('FOR_LOOP_')||['FUNCTION_RETURN','TYPE_DECL_OR_CAST','TYPE_CAST_FUNCTION_PREFIX'].includes(key)?'keyword':'definitionKeyword';
 const scope=key.startsWith('STDLIB__')||key.startsWith('OBJECT_')||key==='INSTANTIATE_FUNCTION_NAME'?'member':kind==='operator'?'operator':'global';
 fields.push([key,value,key.replace('STDLIB__','').replaceAll('__',': ').replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase()),kind,scope]);
}
await writeFile(path.join(output,'keywords.json'),JSON.stringify(fields,null,2)+'\n');
let notices='Functional runtime sources and build provenance\n'+JSON.stringify(pins,null,2)+'\n';
for(const [name,folder]of Object.entries(sources)) {
 let license;for(const filename of ['LICENSE','LICENSE.md','License.md','LICENSE.txt'])try{license=await readFile(path.join(folder,filename),'utf8');break;}catch{}
 if(!license) throw new Error('Missing '+name+' license');notices+='\n'+name+'\n'+license+'\n';
}
await writeFile(path.join(output,'LICENSES.txt'),notices.trimEnd()+'\n');
await writeFile(path.join(output,'build-info.json'),JSON.stringify({sources:pins,compiler:execFileSync('haxe',['--version'],{encoding:'utf8'}).trim(),settings:fields.length},null,2)+'\n');
console.log('Built functional preview with '+fields.length+' configurable fields.');
