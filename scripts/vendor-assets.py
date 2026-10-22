"""Keep the copied site's third-party runtime scripts, styles, fonts and image local."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
from html.parser import HTMLParser
import hashlib
import re

root = Path(__file__).resolve().parents[1] / 'public'
vendor = root / 'vendor'
vendor.mkdir(exist_ok=True)
mapping = {}
css_urls = re.compile(r'url\(\s*[\"\']?([^\)\"\']+)[\"\']?\s*\)')

def localize(url):
    url = 'https:' + url if url.startswith('//') else url
    if url in mapping:
        return mapping[url]
    parsed = urlsplit(url)
    name = Path(parsed.path).name or 'asset'
    if parsed.hostname == 'fonts.googleapis.com':
        name = 'fonts.css'
    target = vendor / (hashlib.sha256(url.encode()).hexdigest()[:12] + '-' + name)
    mapping[url] = '/vendor/' + target.name
    if target.is_file():
        return mapping[url]
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    if url == 'https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png':
        request = Request('https://upload.wikimedia.org/wiktionary/en/9/9a/Trollface_non-free.png', headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=40) as response:
        content = response.read()
        is_css = 'text/css' in response.headers.get('Content-Type', '') or target.suffix == '.css'
    if is_css:
        text = content.decode('utf-8')
        def css_replace(match):
            reference = match[1]
            if reference.startswith('data:'):
                return match[0]
            absolute = urljoin(url, reference)
            fragment = urlsplit(absolute).fragment
            absolute = absolute.split('#')[0]
            return 'url("' + localize(absolute) + ('#' + fragment if fragment else '') + '")'
        content = css_urls.sub(css_replace, text).encode('utf-8')
    target.write_bytes(content)
    print(url, '->', target.name, flush=True)
    return mapping[url]

urls = set()
class Assets(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get('src') if tag == 'script' else attrs.get('href') if tag == 'link' and attrs.get('rel') == 'stylesheet' else None
        if value and value.startswith(('https:', 'http:', '//')) and 'cloudflareinsights' not in value:
            urls.add(value)

pages = list(root.rglob('*.html'))
for page in pages:
    Assets().feed(page.read_text(encoding='utf-8'))
for css in root.rglob('*.css'):
    if vendor in css.parents:
        continue
    for match in css_urls.finditer(css.read_text(encoding='utf-8')):
        if match[1].startswith('https:'):
            urls.add(match[1])
urls.add('https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png')
for url in sorted(urls):
    replacement = localize(url)
    mapping[url] = replacement
for page in list(root.rglob('*.html')) + list(root.rglob('*.css')) + list((root / 'sources').glob('*.js')):
    if vendor in page.parents:
        continue
    original = page.read_text(encoding='utf-8')
    text = original
    for url, replacement in mapping.items():
        text = text.replace(url, replacement)
    if text != original:
        page.write_text(text, encoding='utf-8')
print(f'Localized {len(mapping)} runtime dependencies')
