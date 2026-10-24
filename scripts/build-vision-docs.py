"""Generate versioned Vision references from immutable Git tags using Dox 1.6.0.

Requires Haxe 4.3.7, format 3.8.0, and `haxelib install dox 1.6.0`.
Run: python scripts/build-vision-docs.py [path/to/Vision]
"""
import json
import posixpath
import re
import subprocess
import sys
import zipfile
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT.parent / 'Vision'
DOCS = ROOT / 'public/vision/docs'
WORK = ROOT / 'artifacts/vision-docs'
VERSIONS = [('1.3.1', 'Latest 1.x (1.3.1)'), ('2.0.0', '2.0.0'),
            ('2.1.0', 'Latest 2.1 (2.1.0)'), ('2.2.0', '2.2.0 (latest)')]

def run(*args):
    subprocess.run([str(a) for a in args], check=True, cwd=ROOT)

WORK.mkdir(parents=True, exist_ok=True)
manifest = []
for version, label in VERSIONS:
    archive = WORK / (version + '.zip')
    run('git', '-C', SOURCE, 'archive', version, '--output=' + str(archive))
    source = WORK / version
    with zipfile.ZipFile(archive) as bundle:
        bundle.extractall(source)
    xml = WORK / (version + '-xml')
    xml.mkdir(exist_ok=True)
    run('haxe', '-cp', source / 'src', '-lib', 'format:3.8.0', '--macro', "include('vision')",
        '-D', 'doc-gen', '--no-output', '-js', WORK / 'dummy.js', '-xml', xml / 'js.xml')
    output = DOCS / version
    run('haxelib', 'run', 'dox', '-i', xml, '-o', output, '--title', 'Vision API',
        '-D', 'version', version, '-D', 'source-path',
        f'https://github.com/ShaharMS/Vision/blob/{version}/src/')
    revision = subprocess.check_output(['git', '-C', str(SOURCE), 'rev-parse', version + '^{commit}'], text=True).strip()
    manifest.append(dict(version=version, label=label, revision=revision,
                         pages=sorted(p.relative_to(output).as_posix() for p in output.rglob('*.html'))))
    for page in output.rglob('*.html'):
        text = page.read_text(encoding='utf-8-sig')
        text = text.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">')
        text = re.sub(r'<link[^>]*rel="icon"[^>]*>', '<link rel="icon" href="data:,">', text)
        for remote, local in [
            ('https://fonts.googleapis.com/css?family=Open+Sans:400,700,700italic,400italic', '/vendor/7e4d462e03c9-fonts.css'),
            ('https://fonts.googleapis.com/css?family=Source+Sans+Pro:200,600,600italic,400', '/vendor/8c99c00f515d-fonts.css'),
            ('https://netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.css', '/vendor/664a30dc44c5-font-awesome.css')]:
            text = text.replace(remote, local)
        text = re.sub(r'https?://(?:spacebubble\.io|spacebubble-io\.pages\.dev)/vision/docs/', '/vision/docs/', text)
        text = re.sub(r'((?:src|href)="\.\.?/)/+', r'\1', text)
        text = text.replace('kernalRadius', 'kernelRadius').replace('sigma%20=%201%47%20fast', 'sigma%20=%201,%20fast')
        # Older comments link from Vision.html as if it were at the package root.
        def repair(match):
            attr, raw = match.groups()
            url = urlsplit(raw)
            if url.scheme or url.netloc or raw.startswith(('/', '#')):
                return match[0]
            target = output / posixpath.normpath(posixpath.join(page.relative_to(output).parent.as_posix(), unquote(url.path)))
            if target.exists():
                return match[0]
            clean = unquote(url.path).lstrip('./')
            if (output / clean).is_file():
                return f'{attr}="/vision/docs/{version}/{clean}' + ('#' + url.fragment if url.fragment else '') + '"'
            if clean.startswith('haxe/'):
                return f'{attr}="https://api.haxe.org/{clean}' + ('#' + url.fragment if url.fragment else '') + '"'
            return match[0]
        text = re.sub(r'(href|src)="([^"]+)"', repair, text)
        options = ''.join(f'<option value="{v}"' + (' selected' if v == version else '') + f'>{l}</option>' for v, l in VERSIONS)
        selector = f'<label class="vision-version">Version <select id="vision-version" aria-label="Documentation version">{options}</select></label>'
        text = text.replace('<a href="#" id="theme-toggle"', selector + '<a href="#" id="theme-toggle"')
        text = text.replace('</head>', '<link rel="stylesheet" href="/vision/docs/versions.css"><script defer src="/vision/docs/versions.js"></script></head>')
        page.write_text(text, encoding='utf-8')
    for icon in output.rglob('favicon.ico'):
        icon.unlink()
(DOCS / 'versions.json').write_text(json.dumps(dict(default='2.2.0', generator='dox 1.6.0', haxe='4.3.7', versions=manifest), indent=2) + '\n', encoding='utf-8')
run('haxe', '-cp', WORK / '2.0.0/src', '-cp', ROOT / 'tools/vision-docs', '-lib', 'format:3.8.0',
    '--run', 'DistortionExamples', DOCS / 'valve-original.png', DOCS)
run('haxe', '-cp', WORK / '2.2.0/src', '-cp', WORK / '2.2.0/tools/docs', '-lib', 'format:3.8.0',
    '--run', 'CarveExamples', DOCS / 'valve-original.png', DOCS)
print('Generated all four Vision versions; default 2.2.0')
