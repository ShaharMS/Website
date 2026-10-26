"""Check local HTML/CSS links against real files, avoiding SPA fallback false positives."""
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys
import posixpath

root = Path(__file__).resolve().parents[1] / 'public'
missing = defaultdict(set)
checked = 0
files = {item.relative_to(root).as_posix() for item in root.rglob('*') if item.is_file()}

def check(raw, page):
    global checked
    raw = raw.strip()
    url = urlsplit(raw)
    # The Wall of Fame intentionally links to the previous homepage as a project.
    # Keep rejecting legacy asset and subdomain dependencies below.
    if raw == 'https://spacebubble.io/' and page == root / 'index.html':
        return
    if url.hostname and (url.hostname == 'spacebubble.io' or url.hostname.endswith('.spacebubble.io') or url.hostname == 'spacebubble-io.pages.dev'):
        missing['Legacy host dependency: ' + raw].add(str(page.relative_to(root)))
        return
    if not raw or raw.startswith('#') or url.scheme or url.netloc:
        return
    path = unquote(url.path)
    target = posixpath.normpath(path.lstrip('/') if path.startswith('/') else posixpath.join(page.relative_to(root).parent.as_posix(), path))
    if target == '.':
        target = ''
    checked += 1
    if target in files or target + '.html' in files or (target.rstrip('/') + '/index.html').lstrip('/') in files:
        return
    missing[target].add(str(page.relative_to(root)))

class Links(HTMLParser):
    def __init__(self, page):
        super().__init__()
        self.page = page
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'href', 'poster', 'include-html'):
            if key in attrs and attrs[key]:
                check(attrs[key], self.page)
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh':
            match = re.search(r'url=(.*)', attrs.get('content', ''), re.I)
            if match:
                check(match[1], self.page)

for page in root.rglob('*'):
    if page.suffix not in {'.html', '.css'}:
        continue
    text = page.read_text(encoding='utf-8-sig')
    if page.suffix == '.html':
        Links(page).feed(text)
    for match in re.finditer(r'url\(\s*[\"\']?([^\)\"\']+)', text):
        check(match[1], page)

print(f'Checked {checked} local references; {len(missing)} missing targets')
for target, origins in list(missing.items())[:60]:
    print(f'{target}: {", ".join(sorted(origins)[:2])}')
sys.exit(bool(missing))
