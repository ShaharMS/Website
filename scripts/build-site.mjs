import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile,mkdir,mkdtemp,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
const assetPattern = /\.(?:m?js|css)$/i;
async function filesUnder(root,relative='') {
    const files=[];
    for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})) {
        const name=path.posix.join(relative,entry.name);
        if(entry.isDirectory()) files.push(...await filesUnder(root,name)); else files.push(name);
    }
    return files.sort();
}
export async function buildSite(source, destination) {
    source=path.resolve(source);
    const files=(await filesUnder(source)).filter(name=>!name.startsWith('_assets/'));
    const contents=new Map(await Promise.all(files.map(async name=>[name,await readFile(path.join(source,name))])));
    const digest=createHash('sha256');
    for(const [name,bytes] of contents) digest.update(name).update('\0').update(bytes).update('\0');
    const version=digest.digest('hex').slice(0,16);
    destination=destination||await mkdtemp(path.join(os.tmpdir(),'shahar-site-build-'));
    const assets=new Map(files.filter(name=>assetPattern.test(name)).map(name=>[name,`/_assets/${version}/${name}`]));
    const resources=new Set(files.filter(name=>/\.(?:woff2?|ttf|otf|eot|svg|png|jpe?g|webp|gif|ico|wasm|json)$/i.test(name)));
    function resolve(raw, from) {
        if(!raw||/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(raw)) return null;
        const parsed=new URL(raw,'https://site.invalid/'+from);
        const name=path.posix.normalize(decodeURIComponent(parsed.pathname).replace(/\/+/g,'/')).slice(1);
        return {name,url:parsed};
    }
    function versionURL(raw,from,absoluteResource=false) {
        const item=resolve(raw,from); if(!item) return raw;
        if(assets.has(item.name)) {
            item.url.searchParams.delete('v');
            return assets.get(item.name)+item.url.search+item.url.hash;
        }
        return absoluteResource&&resources.has(item.name)?'/_assets/'+version+'/'+item.name+item.url.search+item.url.hash:raw;
    }
    function rewrite(text,from) {
        // Local static script/module/worker/import references, including inline HTML.
        text=text.replace(/(["'])([^"'\\\r\n]*?\.(?:m?js|css)(?:[?#][^"'\\\r\n]*)?)\1/gi,
            (match,quote,url)=>quote+versionURL(url,from)+quote);
        // CSS resources keep their original resolution after moving into _assets.
        if(/\.css$/i.test(from)) text=text.replace(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi,
            (match,quote,url)=>`url(${quote}${versionURL(url,from,true)}${quote})`);
        return text;
    }
    const outputs=new Map();
    for(const [name,bytes] of contents) {
        const text=/\.(?:html|m?js|css)$/i.test(name)?rewrite(bytes.toString('utf8'),name):null;
        outputs.set(name,text===null?bytes:Buffer.from(text));
        if(assets.has(name)) outputs.set(assets.get(name).slice(1),outputs.get(name));
        else if(resources.has(name)) outputs.set('_assets/'+version+'/'+name,outputs.get(name));
    }
    // Update SRI when a vendored asset was transformed by the build.
    for(const [name,bytes] of outputs) if(/\.html$/i.test(name)) outputs.set(name,Buffer.from(bytes.toString('utf8').replace(/<(?:script|link)\b[^>]*>/gi,tag=>{
        const url=tag.match(/(?:src|href)=["'](\/\_assets\/[^"']+)["']/i);
        if(!url||!tag.includes('integrity=')) return tag;
        const target=outputs.get(new URL(url[1],'https://site.invalid').pathname.slice(1));
        if(!target) throw new Error('Missing integrity target '+url[1]);
        return tag.replace(/integrity=["'][^"']*["']/i,`integrity="sha512-${createHash('sha512').update(target).digest('base64')}"`);
    })));
    const headers=(contents.get('_headers')||Buffer.from('')).toString('utf8');
    const directories=[...new Set(files.filter(name=>name.includes('/')).map(name=>name.split('/')[0]))];
    const paths=['/','/*.html',...directories.map(name=>'/'+name+'/*'),...files.filter(name=>!name.includes('/')&&assetPattern.test(name)).map(name=>'/'+name)];
    const cacheHeaders=paths.map(url=>url+'\n  Cache-Control: no-cache, must-revalidate').join('\n');
    outputs.set('_headers',Buffer.from(headers+'\n'+cacheHeaders+'\n/_assets/*\n  Cache-Control: public, max-age=31536000, immutable\n'));
    outputs.set('_asset-manifest.json',Buffer.from(JSON.stringify({version,assets:Object.fromEntries(assets)},null,2)));
    for(const [name,bytes] of outputs) {const file=path.join(destination,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);}
    return {directory:destination,version,assets:assets.size};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
    const result=await buildSite(process.argv[2]||'public',process.argv[3]);console.log(JSON.stringify(result));
}
