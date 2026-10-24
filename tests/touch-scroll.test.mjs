import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('the starfield responds to touch without cancelling native page scrolling', () => {
    const listeners = new Map();
    const drawing = Object.fromEntries(['clearRect', 'beginPath', 'moveTo', 'lineTo', 'stroke'].map(name => [name, () => {}]));
    const canvas = {
        clientWidth: 390, clientHeight: 828,
        getContext: () => drawing,
        addEventListener: (name, callback, options) => listeners.set(name, {callback, options}),
    };
    const context = vm.createContext({
        window: {innerWidth: 390, innerHeight: 844, devicePixelRatio: 1, addEventListener() {}},
        document: {getElementById: () => canvas},
        requestAnimationFrame() {},
    });
    vm.runInContext(readFileSync(new URL('../public/sources/starsBackground.js', import.meta.url), 'utf8'), context);
    const touchMove = listeners.get('touchmove');
    assert.equal(touchMove.options.passive, true);
    let cancelled = false;
    touchMove.callback({touches: [{clientX: 30, clientY: 80}], preventDefault() {cancelled = true;}});
    assert.equal(cancelled, false, 'a swipe over the starfield must remain a native scroll gesture');
    assert.doesNotThrow(() => touchMove.callback({touches: [], preventDefault() {cancelled = true;}}));
    assert.equal(cancelled, false);
    assert.equal(listeners.get('touchend').options.passive, true);
    assert.equal(listeners.get('touchcancel').options.passive, true);
});
