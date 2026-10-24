import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {operations} from '../public/vision/demo/operations.mjs';
const runtime=readFileSync(new URL('../public/vision/demo/runtime.js',import.meta.url),'utf8');
const context=vm.createContext({Uint8Array,ArrayBuffer});vm.runInContext(runtime,context);
function run(operation,params={},width=1,height=1,data=[255,0,0,255]){return context.BrowserVision.run({width,height,buffer:new Uint8Array(data).buffer,operation,params,secondary:{width,height,buffer:new Uint8Array(data).buffer}});}
test('real Vision inversion and Image drawing return exact RGBA pixels',()=>{
 assert.deepEqual([...new Uint8Array(run('invert').buffer)],[0,255,255,255]);
 const drawing=run('setPixel',{x:0,y:0,color:'#123456'});assert.deepEqual([...new Uint8Array(drawing.buffer)],[18,52,86,255]);
 const transparent=run('setPixel',{x:0,y:0,color:'0'});assert.equal(new Uint8Array(transparent.buffer)[3],0);
});
test('the catalog covers the full Vision facade and all operations execute on an image',()=>{
 const methods=JSON.parse(readFileSync(new URL('../public/vision/demo/build-info.json',import.meta.url),'utf8')).methods;
 assert.deepEqual(methods.filter(method=>!operations.some(op=>op.id===method)),[]);
 const bytes=new Uint8Array(32*24*4);for(let y=0;y<24;y++)for(let x=0;x<32;x++){const n=(y*32+x)*4;bytes[n]=x*8;bytes[n+1]=y*10;bytes[n+2]=(x+y)%2?255:0;bytes[n+3]=255;}
 for(const op of operations){const params=Object.fromEntries(op.params.map(p=>[p.key,p.type==='select'&&/^-?\d+$/.test(String(p.value))?Number(p.value):p.value]));Object.assign(params,{width:24,height:18,x:3,y:3,x2:20,y2:17,cx:15,cy:3,cx2:22,cy2:15,rx:7,ry:5,radius:3});if(op.id==='drawEllipse'){params.x=16;params.y=12;}if(params.options)params.options={...params.options,maximumRadius:8,minimumRadius:2,maxCorners:10};const r=run(op.id,params,32,24,bytes);assert.ok(r.width>0&&r.height>0,op.id);assert.equal(r.buffer.byteLength,r.width*r.height*4,op.id);}
});
