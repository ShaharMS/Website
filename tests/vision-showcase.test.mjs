import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {parse} from 'parse5';
import {regions} from '../scripts/dev-server.mjs';
const script=readFileSync(new URL('../public/sources/vision-showcase.js',import.meta.url),'utf8');
async function fixture(viewport=1200,editing=false){
 const values={},classes=new Set(),original={getBoundingClientRect:()=>({width:1800}),cloneNode:()=>({setAttribute(name,value){this[name]=value}})};
 const track={children:[original],get firstElementChild(){return this.children[0]},get lastElementChild(){return this.children.at(-1)},append(clone){clone.remove=()=>this.children.pop();this.children.push(clone)},style:{setProperty:(k,v)=>values[k]=v},classList:{add:c=>classes.add(c)}};
 const ticker={clientWidth:viewport,querySelector:()=>track,classList:{add:c=>classes.add(c)}};
 const prints={clientHeight:400,style:{setProperty(){}}};
 const section={querySelector:s=>s==='.feature-marquee'?ticker:prints};
 vm.runInNewContext(script,{document:{getElementById:()=>section,fonts:{ready:Promise.resolve()}},window:{__localTextEditor:editing?{}:undefined},ResizeObserver:class{observe(){}}});
 await Promise.resolve();return {values,classes,track};
}
test('marquee tiles enough identical periods for ultrawide screens and moves one full group',async()=>{
 for(const width of [390,1200,6000]){
  const f=await fixture(width);
  assert.ok(f.track.children.length*1800>=width+1800);
  assert.equal(f.values['--marquee-distance'],'1800px');
  assert.equal(f.values['--marquee-duration'],1800/55+'s');
  assert.ok(f.track.children.slice(1).every(c=>c['aria-hidden']==='true'&&c.inert));
 }
});
test('local editing keeps a single stationary source group',async()=>{
 const f=await fixture(1200,true);
 assert.equal(f.track.children.length,1);assert.ok(f.classes.has('is-editing'));assert.ok(!f.classes.has('running'));
});
test('Vision heading, marquee, captions, copy and links remain editable without storing clones',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const editable=regions(html);let section;const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
 function find(n){if(attr(n,'id')==='section-6')section=n;for(const c of n.childNodes||[])find(c)}find(parse(html,{sourceCodeLocationInfo:true}));
 const targets=[];let groups=0;
 function walk(n){const cls=(attr(n,'class')||'').split(/\s+/);if(cls.includes('marquee-group'))groups++;
  if(['h2','figcaption','p','a'].includes(n.tagName)||cls.includes('marquee-group'))targets.push(n);
  for(const c of n.childNodes||[])walk(c);
 }walk(section);
 assert.equal(groups,1);
 for(const n of targets){const loc=n.sourceCodeLocation;assert.ok(editable.some(r=>r.start<=loc.startTag.endOffset&&r.end>=loc.endTag.startOffset),n.tagName);}
});
