import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/sources/wall-of-fame.js',import.meta.url),'utf8');
function fixture(height=700){
 const sizing={};let now=0,id=0;const timers=new Map(),events={},homes=[];
 const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 const homeBoxes=[box(100,100,160,160),box(800,450,160,120)];
 const schedule=(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id};
 const animate=(_,options)=>{let resolve;const finished=new Promise(r=>resolve=r);const task=schedule(resolve,options.duration);return {finished,cancel(){timers.delete(task);resolve();}}};
 const style=()=>({cssText:'',getPropertyValue:()=> '30%',setProperty(){},removeProperty(){}});
 const entries=homeBoxes.map((b,i)=>{
  const classes=new Set(); const trigger={setAttribute(){},addEventListener(){},matches:()=>false,focus(){}};
  trigger.getBoundingClientRect=()=>classes.has('is-open')?box(360,150,280,280):b;Object.defineProperty(trigger,'offsetWidth',{get:()=>classes.has('is-open')?280:160});Object.defineProperty(trigger,'offsetHeight',{get:()=>classes.has('is-open')?280:160});
  const details={hidden:true,animate,getBoundingClientRect:()=>box(230,450,540,180),cloneNode:()=>({style:style(),removeAttribute(){},setAttribute(){},querySelectorAll:()=>[],animate,remove(){}})};return {cloneNode(){return {classList:{remove(){},add(){}},style:style(),setAttribute(){},querySelector:()=>({hidden:true}),querySelectorAll:()=>[],scrollHeight:400,remove(){}}},childNodes:[],append(){},dataset:{project:i?'vision':'little'},style:style(),scrollHeight:400,
   classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},classes,contains:()=>false,
   querySelector:s=>s==='.wall-trigger'?trigger:details};
 });
 const board={getBoundingClientRect:()=>box(0,0,1000,height),append(el){if(el.className!=='wall-home')return;const index=homes.length;el.getBoundingClientRect=()=>homeBoxes[index];homes.push(el);}};
 const wall={querySelectorAll:()=>entries,querySelector:s=>s==='.wall-board'?board:{hidden:true},style:{...style(),setProperty:(key,value)=>sizing[key]=value},addEventListener(){},contains:()=>false};
 const document={activeElement:null,getElementById:()=>wall,createElement:()=>({dataset:{},style:style(),setAttribute(){},append(){},animate}),addEventListener:(n,fn)=>events[n]=fn};
 vm.runInNewContext(source,{document,Math,ResizeObserver:class{observe(){}},getComputedStyle:()=>({transform:'none'}),matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>fn(),setTimeout:schedule,clearTimeout:i=>timers.delete(i)});
 return {entries,sizing,move(x,y){events.pointermove({pointerType:'mouse',clientX:x,clientY:y})},async advance(ms){const end=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await Promise.resolve();await Promise.resolve();}now=end;await Promise.resolve();}};
}
test('hover remains open across the origin-to-center corridor, then closes at a distance',()=>{
 const f=fixture();f.move(180,180);assert.ok(f.entries[0].classes.has('is-open'));
 f.move(250,213);assert.ok(f.entries[0].classes.has('is-open'));
 f.move(500,350);assert.ok(f.entries[0].classes.has('is-open'));
 f.move(990,20);assert.ok(!f.entries[0].classes.has('is-open'));
});
test('switch opens immediately after the quicker 224ms return animation',async()=>{
 const f=fixture();f.move(180,180);f.move(880,500);
 assert.ok(!f.entries[0].classes.has('is-open'));assert.ok(!f.entries[1].classes.has('is-open'));
 await f.advance(223);assert.ok(f.entries[0].classes.has('is-closing'));
 await f.advance(1);assert.ok(!f.entries[0].classes.has('is-closing'));
 assert.ok(f.entries[1].classes.has('is-open'));
});
test('leaving the queued stamp cancels its opening',async()=>{
 const f=fixture();f.move(180,180);f.move(880,500);f.move(990,20);await f.advance(1000);
 assert.ok(f.entries.every(e=>!e.classes.has('is-open')));
});

test('short viewports fit panels by scaling rather than growing the wall',()=>{
 const f=fixture(180);
 const scale=Number(f.sizing['--wall-panel-scale']);
 assert.ok(scale>0&&scale<1);
 assert.ok(400*scale<=164);
 assert.ok(parseFloat(f.sizing['--wall-rest-size'])<=180*.27);
 assert.ok(!('--wall-panel-height' in f.sizing));
});
