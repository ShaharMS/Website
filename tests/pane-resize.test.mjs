import test from 'node:test';
import assert from 'node:assert/strict';
import {fitPaneSizes, resizePair} from '../public/little/editor/pane-resize.mjs';
test('divider movement redistributes only its adjacent panes and respects minimum heights', () => {
    assert.deepEqual(resizePair([300,150,180],0,1,60,[120,80,80]), [360,90,180]);
    assert.deepEqual(resizePair([300,150,180],1,2,500,[120,80,80]), [300,250,80]);
    assert.deepEqual(resizePair([300,150,180],0,1,-500,[120,80,80]), [120,330,180]);
});
test('pane heights fit phone and desktop space without overflow or inaccessible panes', () => {
    for (const height of [300,480,640,900]) {
        const sizes = fitPaneSizes([300,150,180],height,[120,80,80]);
        assert.ok(Math.abs(sizes.reduce((a,b)=>a+b,0)-height)<1e-8);
        sizes.forEach((n,i)=>assert.ok(n >= [120,80,80][i]));
    }
});
