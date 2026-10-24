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

def symbol(name, art, view_box='0 0 24 24'):
    return f'<symbol id="{name}" viewBox="{view_box}" overflow="visible"><g class="icon-art" fill="none" stroke="#000" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round">{art}</g></symbol>'

line_icons = ('shirt', 'hanger', 'steering-wheel', 'puzzle', 'puzzle-2',
              'chart-candle', 'chart-line', 'coins', 'wallet', 'cash')
symbols = [symbol(name, children(name)) for name in line_icons]
car = list(ET.parse(assets / 'car.svg').getroot())
wheels = ''
for index, wheel in enumerate(car[:2]):
    center = 7 if index == 0 else 17
    spokes = f'<circle cx="{center}" cy="17" r=".55" stroke-width=".5"/><path d="M{center - 1.8} 17h1.25m1.1 0h1.25M{center} 15.2v1.25m0 1.1v1.25" stroke-width=".5"/>'
    wheels += '<g class="car-wheel">' + ET.tostring(wheel, encoding='unicode') + spokes + '</g>'
chassis = '<g class="car-chassis">' + ''.join(ET.tostring(part, encoding='unicode') for part in car[2:]) + '</g>'
road = '<path d="M0 20h24M0 25h24" stroke-width=".55"/><path class="car-road" d="M0 22.5h24" stroke-width=".6" stroke-dasharray="3 3"/>'
symbols.append(symbol('car', road + chassis + wheels))
# Derived from the complete claw subpath, normalized with generous padding.
# It contains no lettering or clipping; inherit the same outline as the line icons.
symbols.append(symbol('monster', children('monster-claw')))

path = root / 'public/index.html'
text = path.read_text(encoding='utf-8')
for name in (*line_icons, 'car', 'monster', 'monster-can', 'chocolate-milk'):
    text = re.sub(r'<symbol id="' + name + r'".*?</symbol>', '', text, flags=re.S)
text = text.replace('\n\t\t<!-- Web-sourced artwork; see assets/icons/SOURCES.md. -->\n', '')
marker = '\n\t\t</svg>'
prefix, suffix = text.split(marker, 1)
text = prefix.rstrip() + '\n' + marker + suffix
text = text.replace(marker, '\n\t\t<!-- Web-sourced artwork; see assets/icons/SOURCES.md. -->\n' + '\n'.join(symbols) + marker, 1)
path.write_text(text, encoding='utf-8')

# Keep only the source SVGs actually used to build the symbols.
for unused in ('beer.svg', 'can.svg', 'monster-logo.svg', 'soda-can.svg', 'milk-carton.svg'):
    path = assets / unused
    if path.exists():
        path.unlink()
print('Updated sourced outline symbols: clothing, driving, Monster, finance and jigsaw puzzles')
