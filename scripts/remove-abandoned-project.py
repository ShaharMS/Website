"""Remove the abandoned homepage section and its task-owned static dependencies."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
public = root / 'public'
page = public / 'index.html'
text = page.read_text(encoding='utf-8')
text = re.sub(r'\s*<section class="section" id="section-5".*?</section>', '', text, flags=re.S)
text = re.sub(r'\s*<link[^>]*href="css/section-5.css"[^>]*>', '', text)
text = re.sub(r'\s*<script[^>]*src="\./sources/crtScanlineBackdrop.js"[^>]*></script>', '', text)
text = re.sub(r'\s*<script[^>]*src="/vendor/[^"/]*three.min.js"[^>]*></script>', '', text)
page.write_text(text, encoding='utf-8')
for path in (public / 'css/section-5.css', public / 'sources/crtScanlineBackdrop.js', public / 'assets/EZWorksheet.mov'):
    if path.exists():
        path.unlink()
for path in (public / 'vendor').glob('*three.min.js'):
    path.unlink()
for path in (public / 'vendor').iterdir():
    if path.name.startswith(('6190c7751993-', '56a4d5ff10de-', '76a11ec91405-', '96c4eb9a3598-', 'c691cba30ce1-', '342cc85702c0-', 'b2f2079208d0-')):
        path.unlink()
print('Removed abandoned section, video, shader script, and Three.js')
