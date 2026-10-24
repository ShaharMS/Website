import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('the airplane alternates complete passes with a readable trailing banner', () => {
    const source = readFileSync(new URL('../public/sources/airplane.js', import.meta.url), 'utf8');
    const frames = [];
    const graphic = {style: {}};
    const parts = [{}, {}, {}];
    const attributes = new Map();
    const plane = {
        style: {}, dataset: {},
        getAttribute: key => attributes.get(key),
        setAttribute: (key, value) => attributes.set(key, value),
        closest: () => ({clientWidth: 800}),
        querySelector: () => graphic,
        querySelectorAll: () => parts,
        getBoundingClientRect: () => ({width: 300})
    };
    const context = vm.createContext({performance: {now: () => 0},
        requestAnimationFrame: frame => frames.push(frame), plane});
    vm.runInContext(source.slice(0, source.indexOf('let planes')) + '\nrunPlane(plane, 30);', context);
    assert.equal(plane.dataset.direction, 'right');
    assert.equal(plane.style.flexDirection, 'row-reverse');
    assert.equal(graphic.style.transform, 'scaleX(-1)');
    assert.match(parts.map(p => p.textContent).join(' '), /Welcome to my Website!/);
    let now = 0;
    const until = direction => {
        for (let i = 0; i < 300; i++) {
            now += 1000 / 60;
            frames.shift()(now);
            if (plane.dataset.direction === direction) return;
        }
        assert.fail('Plane did not complete its pass');
    };
    until('left');
    assert.equal(plane.style.flexDirection, 'row');
    assert.equal(graphic.style.transform, 'none');
    assert.ok(Number.parseFloat(plane.style.left) >= 800, 'return starts offscreen');
    assert.match(parts.map(p => p.textContent).join(' '), /Enjoy your Stay :D/);
    until('right');
    assert.ok(Number.parseFloat(plane.style.left) <= -300, 'next pass starts offscreen');
    assert.match(parts.map(p => p.textContent).join(' '), /Welcome to my Website!/);
});
