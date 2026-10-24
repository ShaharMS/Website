import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,readdir,cp,stat,rm,utimes} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildSite} from './build-site.mjs';
let source=path.resolve('public');
const committed=process.argv.includes('--committed');
if(committed) {
    const temp=await mkdtemp(path.join(os.tmpdir(),'shahar-committed-release-'));
    const archive=path.join(temp,'source.tar'), checkout=path.join(temp,'source');await mkdir(checkout);
    execFileSync('git',['archive','--format=tar','--output='+archive,'HEAD']);
    execFileSync('tar',['-xf',archive,'-C',checkout]);source=path.join(checkout,'public');
}
const build=await buildSite(source);
const history=path.resolve('.wrangler/site-asset-history');await mkdir(history,{recursive:true});
const previous=[];
for(const entry of await readdir(history,{withFileTypes:true})) if(entry.isDirectory()&&/^[a-f0-9]{16}$/.test(entry.name)) previous.push({name:entry.name,time:(await stat(path.join(history,entry.name))).mtimeMs});
previous.sort((a,b)=>b.time-a.time);
for(const entry of previous.filter(entry=>entry.name!==build.version).slice(0,3)) await cp(path.join(history,entry.name),path.join(build.directory,'_assets',entry.name),{recursive:true});
console.log(`Versioned ${build.assets} scripts/styles as release ${build.version}`);
execFileSync(process.execPath,[path.resolve('node_modules/wrangler/bin/wrangler.js'),'pages','deploy',build.directory,
    '--project-name','shahar-ms','--branch','main','--commit-hash',execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()],{stdio:'inherit'});

await cp(path.join(build.directory,'_assets',build.version),path.join(history,build.version),{recursive:true});
await utimes(path.join(history,build.version),new Date(),new Date());
const retained=new Set([build.version,...previous.filter(entry=>entry.name!==build.version).slice(0,3).map(entry=>entry.name)]);
for(const entry of previous) if(!retained.has(entry.name)) {
    const target=path.resolve(history,entry.name);
    if(!target.startsWith(history+path.sep)||!/^[a-f0-9]{16}$/.test(path.basename(target))) throw new Error('Invalid asset-history cleanup path');
    await rm(target,{recursive:true});
}
