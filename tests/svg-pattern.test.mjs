import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/sources/svgsBackground.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('function scatterPositions('), source.indexOf('function init()')), context);

test('randomized icon positions use equal clearance in every direction and cover the section', () => {
    for (const [width, height, pitch] of [[390, 844, 105], [768, 1024, 125], [1280, 720, 140]]) {
        for (let seed = 1; seed <= 8; seed++) {
            let state = seed;
            const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
            const points = context.scatterPositions(width, height, pitch, random);
            assert.ok(points.length > 20);
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    assert.ok(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) >= pitch * .8 - 1e-8,
                        'icons retain the same clearance on both axes and diagonals');
                }
            }
            for (let y = 0; y <= height; y += 40) for (let x = 0; x <= width; x += 40) {
                assert.ok(Math.min(...points.map(p => Math.hypot(p.x - x, p.y - y))) < pitch * 1.2,
                    'no empty strip or large hole across the section');
            }
        }
    }
});
