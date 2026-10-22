"""Keep the original pattern geometry and styling; repair symbol clipping and motion."""
from pathlib import Path
import re
path = Path(__file__).resolve().parents[1] / 'public/sources/svgsBackground.js'
text = path.read_text(encoding='utf-8')
# DrawSVG is not loaded by the site; these dead calls produced warnings after a delay.
text = text.split('const planet2Draw =')[0]
text = '\n'.join(line for line in text.splitlines() if not re.search(r'(?:planet2|moonFull|moonCrescent|galaxy|constellation|comet)DrawTl\?\.', line))
for name in ('keyboard', 'headphones', 'frying-pan', 'dumbbell', 'moon-full', 'galaxy', 'planet-2', 'moon-crescent', 'comet'):
    text = text.replace(f'document.querySelector("symbol#{name}")', f'document.querySelector("symbol#{name} > g")')
text = text.replace('checkBox.addEventListener("change", checkStatus);', '''const extraIcons = ['monster-can', 'shirt', 'hanger', 'chocolate-milk', 'car', 'steering-wheel'];
extraIcons.forEach(name => images.push({id: '#' + name, name}));
document.querySelectorAll('#main symbol').forEach(symbol => symbol.setAttribute('overflow', 'visible'));
checkBox.addEventListener("change", checkStatus);''')
text = text.replace('function startAnimation() {', 'function startAnimation() {\n    extraMotion.forEach(timeline => timeline.play());')
text = text.replace('function stopAnimation() {', 'function stopAnimation() {\n    extraMotion.forEach(timeline => timeline.pause());')
text += '''
// Small gestures keep the sourced line art alive without changing the pattern's size or placement.
const extraMotion = [];
for (const [name, rotation, x, y, duration] of [
    ['monster-can', 5, 0, .4, 1.3], ['shirt', 3, 0, .2, 1.9],
    ['hanger', 9, 0, 0, 2.2], ['chocolate-milk', 6, 0, .3, 1.8],
    ['car', 0, 1.1, .15, .8], ['steering-wheel', 24, 0, 0, 2.1]
]) {
    const artwork = document.querySelector('symbol#' + name + ' > g');
    const motion = gsap.timeline({repeat: -1, yoyo: true});
    motion.fromTo(artwork, {rotation: -rotation, x: -x, y: -y},
        {rotation, x, y, duration, transformOrigin: '50% 50%', ease: 'sine.inOut'});
    extraMotion.push(motion);
}
'''
path.write_text(text, encoding='utf-8')
