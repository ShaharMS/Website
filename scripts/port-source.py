"""Copy the original static site from the ignored, pinned source checkout."""
from pathlib import Path
import re
import shutil

root = Path(__file__).resolve().parents[1]
source = root / '.migration-source'
public = root / 'public'
excluded = {'node_modules', '.vscode', 'obj', 'Source', 'Assets'}
for item in (source / 'new').rglob('*'):
    relative = item.relative_to(source / 'new')
    if not item.is_file() or any(part in excluded for part in relative.parts) or ('Export' in relative.parts and 'haxe' in relative.parts):
        continue
    if item.suffix in {'.hx', '.hxproj', '.hxml', '.map', '.ico'} or item.name in {'favicon.png', 'package.json', 'package-lock.json', 'project.xml', '.gitignore'}:
        continue
    target = public / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(item, target)

# The original documentation also loads these shared scripts and image examples.
for name in ('ballsBackground.js', 'htmlIncluder.js'):
    shutil.copy2(source / 'sources' / name, public / 'sources' / name)
shutil.copytree(source / 'vision' / 'docs', public / 'vision' / 'docs', dirs_exist_ok=True)

beacon = '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token":"3d9e2f7ead2a4e07ad8644dfcd7ce66f"}\'></script>'
for target in public.rglob('*.html'):
    text = target.read_text(encoding='utf-8-sig')
    text = text.replace('https://spacebubble-io.pages.dev/vision/docs/', '/vision/docs/')
    text = text.replace('https://spacebubble.io/new/', '/')
    text = text.replace('Home | Spacebubble.io', 'Home | Shahar')
    text = text.replace('Little Documentation | Spacebubble.io', 'Little Documentation | Shahar')
    if '<body' in text and '</body>' in text:
        text = text.replace('</body>', beacon + '\n</body>')
    target.write_text(text, encoding='utf-8')

# Preserve the original production-only decoration on the new hostnames too.
target = public / 'sources' / 'underConstruction.js'
target.write_text(target.read_text(encoding='utf-8').replace('if (location.href.includes("spacebubble")) markSections();', 'markSections();'), encoding='utf-8')

# Paths in Little's original docs pointed to a nonexistent parent directory.
target = public / 'little' / 'doc' / 'index.html'
text = target.read_text(encoding='utf-8')
text = text.replace('<link href="../htmlIncluder.js" type="text/javascript"></script>', '')
text = text.replace('src="../sources/', 'src="/sources/')
target.write_text(text, encoding='utf-8')
print(f'Copied {sum(1 for item in public.rglob("*") if item.is_file())} static files')
