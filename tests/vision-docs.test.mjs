import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../public/vision/docs/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('versions.json',root)));
const code=readFileSync(new URL('versions.js',root),'utf8');

test('release references have distinct APIs and pinned source revisions',()=>{
    assert.deepEqual(manifest.versions.map(x=>x.version),['1.3.1','2.0.0','2.1.0','2.2.0']);
    for(const release of manifest.versions) {
        assert.match(release.revision,/^[a-f0-9]{40}$/);
        const api=readFileSync(new URL(`${release.version}/vision/Vision.html`,root),'utf8');
        assert.equal(api.includes('name="carve"'),release.version==='2.2.0');
        assert.ok(api.includes(`/blob/${release.version}/src/`));
        for(const page of release.pages) assert.ok(existsSync(new URL(`${release.version}/${page}`,root)),page);
    }
});

async function switchVersion(pathname,target,hash='') {
    let onReady,onChange,destination;
    const select={value:target,addEventListener:(event,handler)=>{onChange=handler;}};
    vm.runInNewContext(code,{
        document:{addEventListener:(event,handler)=>{onReady=handler;},getElementById:()=>select},
        fetch:async()=>({ok:true,json:async()=>manifest}),
        location:{pathname,hash,assign:url=>{destination=url;}}
    });
    await onReady();await onChange();return destination;
}

test('switching clean URLs keeps the type and member',async()=>{
    assert.equal(await switchVersion('/vision/docs/2.2.0/vision/Vision','2.0.0','#gaussianBlur'),
        '/vision/docs/2.0.0/vision/Vision.html#gaussianBlur');
});
test('a type absent from an older release falls back to its index',async()=>{
    assert.equal(await switchVersion('/vision/docs/2.2.0/vision/algorithms/SeamCarving.html','1.3.1','#carve'),
        '/vision/docs/1.3.1/index.html');
});
test('package directory URLs remain on their package index',async()=>{
    assert.equal(await switchVersion('/vision/docs/2.2.0/vision/ds/','2.1.0'),
        '/vision/docs/2.1.0/vision/ds/index.html');
});
