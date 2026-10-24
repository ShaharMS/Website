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

symbols = [symbol(name, children(name)) for name in ('shirt', 'hanger', 'steering-wheel')]
car = list(ET.parse(assets / 'car.svg').getroot())
wheels = ''
for index, wheel in enumerate(car[:2]):
    center = 7 if index == 0 else 17
    spokes = f'<path d="M{center - 1.25} 17h2.5M{center} 15.75v2.5" stroke-width=".5"/>'
    wheels += '<g class="car-wheel">' + ET.tostring(wheel, encoding='unicode') + spokes + '</g>'
chassis = '<g class="car-chassis">' + ''.join(ET.tostring(part, encoding='unicode') for part in car[2:]) + '</g>'
road = '<path class="car-road" d="M1 22h22" stroke-dasharray="3 3"/>'
symbols.append(symbol('car', road + chassis + wheels))
logo = ET.parse(assets / 'monster-logo-alt.svg').getroot()
claw = next(item for item in logo if item.get('fill') == '#0f0')
claw.set('fill', '#000')
claw.set('stroke', 'none')
# The downloaded green compound path also contains lettering to the right of the
# claw. Isolate the original mark without redrawing or importing the wordmark.
claw_art = '<defs><clipPath id="monster-claw-only"><rect x="60" y="70" width="3500" height="5700" fill="#fff" stroke="none"/></clipPath></defs><g clip-path="url(#monster-claw-only)">' + ET.tostring(claw, encoding='unicode') + '</g>'
symbols.append(symbol('monster', claw_art, '60 70 3500 5700'))
milk = ET.parse(assets / 'milk.svg').getroot()
body = ''.join(ET.tostring(item, encoding='unicode') for item in list(milk)[:2])
chocolate = '<g class="chocolate-label" transform="translate(8.4 10.5) scale(.3)" stroke-width="2.2">' + children('chocolate') + '</g>'
symbols.append(symbol('chocolate-milk', body + chocolate))

path = root / 'public/index.html'
text = path.read_text(encoding='utf-8')
for name in ('shirt', 'hanger', 'car', 'steering-wheel', 'monster', 'monster-can', 'chocolate-milk'):
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
print('Updated six sourced symbols: Monster logo, shirt, hanger, chocolate milk, driving car, steering wheel')
