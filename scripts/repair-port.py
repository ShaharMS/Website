"""Repair legacy path errors without changing the landing page's design."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import html
import posixpath
import re

root = Path(__file__).resolve().parents[1] / 'public'
docs = root / 'vision/docs/2.0.0-beta'
files = {path.relative_to(root).as_posix() for path in root.rglob('*') if path.is_file()}
for page in root.rglob('*.html'):
    text = page.read_text(encoding='utf-8')
    text = re.sub(r'<link\b[^>]*rel=[\"\'][^\"\']*icon[^\"\']*[\"\'][^>]*>', '', text, flags=re.I)
    if '<head>' in text:
        text = text.replace('<head>', '<head>\n<link rel="icon" href="data:,">', 1)
    if docs in page.parents:
        def repair(match):
            raw = match[1]
            url = urlsplit(html.unescape(raw))
            if url.scheme or url.netloc or not url.path:
                return match[0]
            resolved = posixpath.normpath(posixpath.join(page.relative_to(root).parent.as_posix(), unquote(url.path)))
            if resolved in files:
                return match[0]
            clean = re.sub(r'^(?:\.\./|\./)+', '', unquote(url.path))
            candidate = 'vision/docs/2.0.0-beta/' + clean
            if candidate in files:
                replacement = '/' + candidate
                if url.fragment:
                    replacement += '#' + url.fragment
                return 'href="' + replacement + '"'
            # These four private/stdlib declarations were omitted by the original generator.
            if clean.startswith('haxe/'):
                return 'href="https://api.haxe.org/' + clean + ('#' + url.fragment if url.fragment else '') + '"'
            return match[0]
        text = re.sub(r'href="([^"]+)"', repair, text)
    if page.parent == root / 'little/doc/pages':
        text = re.sub(r'(["\'])(?:\./|\.\./)?images/', r'\1/little/doc/images/', text)
    if page == root / 'vision/demo/index.html':
        text = text.replace('src="demo.png"', 'src="/vision/docs/valve-original.png"')
    page.write_text(text, encoding='utf-8')

# Do not ship any of the original favicons, including generated documentation icons.
for path in root.rglob('*'):
    if path.is_file() and path.name.lower() in {'favicon.ico', 'favicon.png'}:
        path.unlink()

# /new was the old homepage path. Preserve bookmarks while making / the entry point.
(root / '_redirects').write_text('/new / 301\n/new/ / 301\n/new/* /:splat 301\n', encoding='utf-8')
print('Repaired legacy links and removed favicons')
