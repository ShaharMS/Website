"""Make archived documentation images independent of the previous hosting domain."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1] / 'public'
references = set()
for page in root.rglob('*'):
    if page.suffix not in {'.html', '.css', '.js', '.json', '.md'}:
        continue
    text = page.read_text(encoding='utf-8-sig')
    urls = re.findall(r'https?://[^\s"\'<>]*spacebubble[^\s"\'<>]*', text)
    references.update(urls)
    updated = text.replace('https://spacebubble.io/vision/docs/', '/vision/docs/')
    updated = updated.replace('https://spacebubble-io.pages.dev/vision/docs/', '/vision/docs/')
    updated = updated.replace('valve-affineTransformShear', 'valve-affineWarpShear')
    updated = updated.replace('valve-affineTransformRotate', 'valve-affineWarpRotate')
    updated = updated.replace('sigma%20=%201%47%20fast', 'sigma%20=%201%2C%20fast')
    if updated != text:
        page.write_text(updated, encoding='utf-8')
for url in sorted(references):
    print(url[:180])
