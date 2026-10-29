import http from 'node:http';
import {readFile, writeFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {parse, parseFragment} from 'parse5';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const sessions = new Map();
const inline = new Set(['a','span','strong','em','b','i','code','br','small','sophisticated','italic','img','sup','sub','s','u','mark']);
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
function allowedTree(node) {
    return (node.childNodes || []).every(n => n.nodeName === '#text' ||
        (inline.has(n.tagName) && allowedTree(n)));
}
export function regions(source) {
    const found = [];
    function visit(node, excluded = false) {
        excluded ||= attr(node, 'data-edit-skip') !== undefined || ['head','script','style','svg','textarea','template'].includes(node.tagName) ||
            (attr(node, 'class') || '').split(/\s+/).includes('airplane');
        const loc = node.sourceCodeLocation;
        if (!excluded && loc?.endTag && !['html','body'].includes(node.tagName) && allowedTree(node) &&
            source.slice(loc.startTag.endOffset,loc.endTag.startOffset).trim()) {
            found.push({start: loc.startTag.endOffset, end: loc.endTag.startOffset,
                insertion: loc.startTag.endOffset - 1, original: source.slice(loc.startTag.endOffset, loc.endTag.startOffset)});
            return;
        }
        if (!excluded) for (const child of node.childNodes || []) visit(child);
    }
    visit(parse(source, {sourceCodeLocationInfo: true}));
    return found;
}
export function validateEdit(original, html) {
    const permitted = new Set();
    function signatures(node, collect) {
        for (const child of node.childNodes || []) {
            if (child.nodeName === '#text') continue;
            if (child.tagName !== 'br') {
                const key = JSON.stringify([child.tagName, child.attrs]);
                if (collect) permitted.add(key);
                else if (!permitted.has(key)) throw new Error('Only text and line breaks can be changed.');
            } else if (child.attrs.length) throw new Error('Invalid line break.');
            signatures(child, collect);
        }
    }
    signatures(parseFragment(original), true);
    signatures(parseFragment(html), false);
}
const types = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml',
    '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.json':'application/json'};
export function createServer({directory = root} = {}) {
    const servingRoot = path.resolve(directory) + path.sep;
    let queue = Promise.resolve();
    return http.createServer(async (req, res) => {
        const fail = (code, message) => {res.writeHead(code, {'Content-Type':'text/plain'}); res.end(message);};
        try {
            const host = req.headers.host;
            if (!/^localhost:\d+$|^127\.0\.0\.1:\d+$/.test(host || '')) return fail(403, 'Loopback only');
            const url = new URL(req.url, `http://${host}`);
            res.setHeader('Cache-Control', 'no-store');
            if (url.pathname === '/__edit/save') {
                if (req.method !== 'POST' || req.headers.origin !== url.origin ||
                    req.headers['content-type'] !== 'application/json') return fail(403, 'Invalid save request');
                let body = '';
                for await (const chunk of req) { body += chunk; if (body.length > 200000) return fail(413, 'Text too large'); }
                const data = JSON.parse(body);
                const job = queue.then(async () => {
                    const session = sessions.get(data.session);
                    if (session && typeof data.key === 'string') {
                        const segments = data.key.split('.');
                        const originalCopy = session.copy;
                        if (!originalCopy || segments.length !== 2 || !['airplane','clouds','sun'].includes(segments[0]) ||
                            !Object.hasOwn(originalCopy[segments[0]], segments[1]) || typeof data.html !== 'string') throw new Error('Unknown copy region');
                        const copyFile = path.join(servingRoot, 'sources', 'page-copy.js');
                        const current = await readFile(copyFile, 'utf8');
                        if (current !== session.copySource) throw new Error('Copy changed outside this editor. Copy your edit, then reload.');
                        validateEdit(originalCopy[segments[0]][segments[1]], data.html);
                        originalCopy[segments[0]][segments[1]] = data.html;
                        const next = 'window.websiteCopy = ' + JSON.stringify(originalCopy, null, 2) + ';\n';
                        await writeFile(copyFile, next, 'utf8');
                        session.copySource = next;
                        return;
                    }
                    const region = session?.regions[data.id];
                    if (!region || typeof data.html !== 'string') throw new Error('Reload the editor before saving.');
                    const source = await readFile(session.file, 'utf8');
                    if (source !== session.source) throw new Error('Source changed outside this editor. Copy your edit, then reload.');
                    validateEdit(region.original, data.html);
                    const next = source.slice(0, region.start) + data.html + source.slice(region.end);
                    await writeFile(session.file, next, 'utf8');
                    const delta = data.html.length - (region.end - region.start);
                    for (const other of session.regions) if (other.start > region.start) {other.start += delta; other.end += delta;}
                    region.end += delta; region.original = data.html; session.source = next;
                });
                queue = job.catch(() => {});
                await job;
                res.end('Saved'); return;
            }
            if (!['GET','HEAD'].includes(req.method)) return fail(405, 'Method not allowed');
            if (url.pathname === '/__edit/client.js') {
                res.setHeader('Content-Type', 'text/javascript');
                res.end(await readFile(new URL('./local-editor.js', import.meta.url))); return;
            }
            let file = path.resolve(servingRoot, '.' + decodeURIComponent(url.pathname));
            if (file !== path.resolve(servingRoot) && !file.startsWith(servingRoot)) return fail(403, 'Invalid path');
            try {file = await realpath(file);} catch {return fail(404, 'Not found');}
            if (file !== path.resolve(servingRoot) && !file.startsWith(servingRoot)) return fail(403, 'Invalid path');
            if (!path.extname(file)) file = path.join(file, 'index.html');
            file = await realpath(file);
            if (!file.startsWith(servingRoot)) return fail(403, 'Invalid path');
            let content = await readFile(file);
            const ext = path.extname(file);
            if (ext === '.html' && !url.searchParams.has('preview') && req.headers['sec-fetch-dest'] !== 'iframe') {
                const source = content.toString();
                const editable = regions(source);
                const session = randomUUID();
                if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
                let copySource, copy;
                try {
                    copySource = await readFile(path.join(servingRoot, 'sources', 'page-copy.js'), 'utf8');
                    copy = JSON.parse(copySource.slice('window.websiteCopy = '.length).trim().replace(/;$/, ''));
                } catch (error) {if (error.code !== 'ENOENT') throw error;}
                sessions.set(session, {file, source, regions: editable, copySource, copy});
                let html = source;
                for (let i = editable.length - 1; i >= 0; i--) {
                    const at = editable[i].insertion;
                    html = html.slice(0, at) + ` data-local-edit="${i}"` + html.slice(at);
                }
                html = html.replace(/<head[^>]*>/i, '$&<script>window.__localTextEditor={pending:[],bind(el,key){this.pending.push([el,key]);}};</script>');
                content = html.replace(/<\/body>/i, `<script>window.__localEditSession=${JSON.stringify(session)};</script><script src="/__edit/client.js"></script></body>`);
            }
            // Keep the full copy editable instead of letting the typewriter replace it.
            if (file === path.join(servingRoot, 'sources', 'typewriter.js')) {
                content = `if (!window.__localTextEditor) {\n${content}\n}`;
            }
            res.setHeader('Content-Type', (types[ext] || 'application/octet-stream') + (['.html','.js','.css'].includes(ext) ? '; charset=utf-8' : ''));
            res.end(req.method === 'HEAD' ? undefined : content);
        } catch (error) { fail(error.code === 'ENOENT' ? 404 : 409, error.message); }
    });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const initialPort = Number(process.env.PORT || 8788);
    function start(port) {
        const server = createServer();
        server.once('error', error => {
            if (error.code === 'EADDRINUSE' && !process.env.PORT && port < initialPort + 10) start(port + 1);
            else {console.error(error.message); process.exitCode = 1;}
        });
        server.listen(port, '127.0.0.1', () => console.log(`Edit text: http://localhost:${port}/\nPreview: http://localhost:${port}/?preview`));
    }
    start(initialPort);
}
