"""Adapt downloaded SVG artwork to the existing monochrome symbol pattern."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
assets = root / 'public/assets/icons'
ns = '{http://www.w3.org/2000/svg}'
ET.register_namespace('', ns[1:-1])

def children(name):
    svg = ET.parse(assets / (name + '.svg')).getroot()
    return ''.join(ET.tostring(item, encoding='unicode') for item in svg)

def symbol(name, art):
    return f'<symbol id="{name}" viewBox="0 0 24 24" overflow="visible"><g class="icon-art" fill="none" stroke="#000" stroke-width=".65" stroke-linecap="round" stroke-linejoin="round">{art}</g></symbol>'

symbols = [symbol(name, children(name)) for name in ('shirt', 'hanger', 'car', 'steering-wheel')]
logo = ET.parse(assets / 'monster-logo-alt.svg').getroot()
claw = next(item for item in logo if item.get('fill') == '#0f0')
claw.set('fill', '#000')
claw.set('stroke', 'none')
monster = '<g transform="translate(2.4 -1.5) scale(.8 1.08)">' + children('cylinder') + '</g><svg class="can-label" x="8" y="8" width="8" height="11" viewBox="60 70 3500 5700">' + ET.tostring(claw, encoding='unicode') + '</svg>'
symbols.append(symbol('monster-can', monster))
milk = ET.parse(assets / 'milk.svg').getroot()
body = ''.join(ET.tostring(item, encoding='unicode') for item in list(milk)[:2])
chocolate = '<g class="chocolate-label" transform="translate(8.4 10.5) scale(.3)" stroke-width="1.6">' + children('chocolate') + '</g>'
symbols.append(symbol('chocolate-milk', body + chocolate))

path = root / 'public/index.html'
text = path.read_text(encoding='utf-8')
for name in ('shirt', 'hanger', 'car', 'steering-wheel', 'monster-can', 'chocolate-milk'):
    text = re.sub(r'<symbol id="' + name + r'".*?</symbol>', '', text, flags=re.S)
text = text.replace('\n\t\t<!-- Web-sourced artwork; see assets/icons/SOURCES.md. -->\n', '')
marker = '\n\t\t</svg>'
text = text.replace(marker, '\n\t\t<!-- Web-sourced artwork; see assets/icons/SOURCES.md. -->\n' + '\n'.join(symbols) + marker, 1)
path.write_text(text, encoding='utf-8')

# Keep only the source SVGs actually used to build the symbols.
for unused in ('beer.svg', 'can.svg', 'monster-logo.svg', 'soda-can.svg', 'milk-carton.svg'):
    path = assets / unused
    if path.exists():
        path.unlink()
print('Added six sourced symbols: Monster can, shirt, hanger, chocolate milk, car, steering wheel')
