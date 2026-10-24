import test from 'node:test';
import assert from 'node:assert/strict';
import {regions, validateEdit, createServer} from '../scripts/dev-server.mjs';
import {mkdtemp, readFile, writeFile, rm, mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('editable regions preserve mixed inline markup and exclude scripts and dynamic banners', () => {
    const html = '<h1>Hello</h1><li>And <a href="/">link</a></li><div class="body-copy">Copy <code>code</code><br>end</div><script>oops</script><div class="airplane"><h1>Dynamic</h1></div>';
    assert.deepEqual(regions(html).map(r => r.original), ['Hello','And <a href="/">link</a>', 'Copy <code>code</code><br>end']);
});
test('stamp controls stay interactive while dates and hidden project descriptions remain editable', () => {
    const html = '<article><button data-edit-skip><img src="seal.svg"></button><span>EST. 2022</span><div hidden><h3>Little</h3><p>Project description</p></div></article>';
    assert.deepEqual(regions(html).map(r => r.original), ['EST. 2022', 'Little', 'Project description']);
});

test('save accepts copy and line breaks but refuses new markup or changed link destinations', () => {
    validateEdit('Hi <a href="/">there</a>', 'Hello<br><a href="/">friend</a>');
    for (const html of ['<script>alert(1)</script>', '<img src=x onerror=x>', '<a href="https://evil.test">there</a>', '<br onclick="x">']) {
        assert.throws(() => validateEdit('Hi <a href="/">there</a>', html));
    }
});
test('preview is unchanged, editing is injected locally, and foreign-origin saves fail', async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
        const plain = await (await fetch(origin + '/?preview')).text();
        const edit = await (await fetch(origin)).text();
        assert.ok(!plain.includes('data-local-edit'));
        assert.ok(edit.includes('data-local-edit'));
        assert.ok(edit.includes('/__edit/client.js'));
        const iframe = await (await fetch(origin, {headers:{'sec-fetch-dest':'iframe'}})).text();
        assert.ok(!iframe.includes('data-local-edit'), 'embedded playground keeps its own controls');
        const bad = await fetch(origin + '/__edit/save', {method:'POST',headers:{Origin:'https://foreign.test','Content-Type':'application/json'},body:'{}'});
        assert.equal(bad.status, 403);
    } finally {await new Promise(resolve => server.close(resolve));}
});

test('saves patch only the chosen source region, track offsets, and reject stale tabs', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'website-editor-'));
    const file = path.join(directory, 'index.html');
    const original = '<!DOCTYPE html>\r\n<html><head></head><body><h1>Hello</h1><p>Second <em>text</em></p></body></html>';
    await writeFile(file, original);
    const server = createServer({directory});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const session = async () => (await (await fetch(origin + '/?edit')).text()).match(/window.__localEditSession="([^"]+)"/)[1];
    const save = (key,id,html) => fetch(origin + '/__edit/save', {method:'POST', headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({session:key,id,html})});
    try {
        const first = await session(), stale = await session();
        assert.equal((await save(first,0,'Longer &amp; better<br>heading')).status, 200);
        assert.equal((await save(first,1,'Revised <em>copy</em>')).status, 200);
        const expected = original.replace('Hello','Longer &amp; better<br>heading').replace('Second <em>text</em>','Revised <em>copy</em>');
        assert.equal(await readFile(file,'utf8'),expected);
        assert.equal((await save(stale,0,'Overwrite')).status,409);
        assert.equal(await readFile(file,'utf8'),expected);
    } finally {
        await new Promise(resolve => server.close(resolve));
        await rm(directory, {recursive:true});
    }
});

test('animated messages save independently and reject stale editors and injected markup', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'website-copy-'));
    await mkdir(path.join(directory,'sources'));
    const file = path.join(directory,'sources','page-copy.js');
    await writeFile(path.join(directory,'index.html'),'<html><head></head><body><p>Copy</p></body></html>');
    const copy = {airplane:{left:'Welcome',right:'Enjoy'},clouds:['Cloud'],sun:{waiting:'Secret'}};
    await writeFile(file,'window.websiteCopy = '+JSON.stringify(copy)+';\n');
    const server = createServer({directory});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const session = async () => (await (await fetch(origin+'/?edit')).text()).match(/window.__localEditSession="([^"]+)"/)[1];
    const save = (session,key,html) => fetch(origin+'/__edit/save',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({session,key,html})});
    try {
        const first = await session(), stale = await session();
        assert.equal((await save(first,'airplane.left','Hello<br>world')).status,200);
        assert.equal((await save(first,'clouds.0','New cloud')).status,200);
        assert.equal((await save(first,'sun.waiting','Wait')).status,200);
        const result = JSON.parse((await readFile(file,'utf8')).slice('window.websiteCopy = '.length).trim().replace(/;$/,''));
        assert.equal(result.airplane.left,'Hello<br>world');
        assert.equal(result.airplane.right,'Enjoy');
        assert.equal(result.clouds[0],'New cloud');
        assert.equal(result.sun.waiting,'Wait');
        assert.equal((await save(stale,'airplane.right','Stale')).status,409);
        assert.equal((await save(first,'airplane.right','<img src=x onerror=x>')).status,409);
        assert.equal((await save(first,'__proto__.bad','No')).status,409);
    } finally {
        await new Promise(resolve=>server.close(resolve));
        await rm(directory,{recursive:true});
    }
});
