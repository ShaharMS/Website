import fs from 'node:fs';import {createRequire} from 'node:module';import {PoolWorld} from '../public/sources/technology-pool/pool-core.mjs';
const M=createRequire(import.meta.url)('../public/vendor/4047a043ad8e-matter.min.js'),data=JSON.parse(fs.readFileSync(new URL('../public/images/technologies/physics-data.json',import.meta.url),'utf8'));
const assert=(x,m)=>{if(!x)throw Error(m);};assert(data.length===26&&!data.some(x=>['express','bash','docker','cpp'].includes(x.id)),'Express must be removed');
function containment(p){for(const x of p.sprites){const b=M.Bounds.create(x.body.vertices),f=p.frame;assert(b.min.x>=f.left+7.99&&b.max.x<=f.left+p.width-7.99&&b.min.y>=f.top+p.ceiling-.01&&b.max.y<=f.top+p.height-11.99,'Escaped chamber: '+JSON.stringify({id:x.meta.id,b,vertices:{minX:Math.min(...x.body.vertices.map(v=>v.x)),maxX:Math.max(...x.body.vertices.map(v=>v.x)),minY:Math.min(...x.body.vertices.map(v=>v.y)),maxY:Math.max(...x.body.vertices.map(v=>v.y))},f,width:p.width,height:p.height,ceiling:p.ceiling}));}}
const result=[];
for(const [W,H] of [[1250,700],[390,650]]){
 const p=new PoolWorld(M,data,W,H);p.tap=true;
 for(let i=0;i<600;i++){p.step(1000/120);containment(p);}p.tap=false;
 M.Body.setVelocity(p.sprites[0].body,{x:30,y:-100});
 for(const top of [-140,-310,70,0]){p.setFrame(0,top);for(let i=0;i<90;i++){p.step(1000/120);containment(p);}}
 for(let i=0;i<900;i++)p.step(1000/120);
 let overlap=0,worst=null;
 for(let i=0;i<p.sprites.length;i++)for(let j=i+1;j<p.sprites.length;j++){
  const a=p.sprites[i],b=p.sprites[j],collision=M.Collision.collides(a.body,b.body);
  if(collision&&collision.depth>overlap){overlap=collision.depth;worst=[a.meta.id,b.meta.id];}
 }
 assert(overlap<1,'Visible overlap after settling: '+JSON.stringify({W,overlap,worst}));
 const before=p.fill;p.drain=true;for(let i=0;i<180;i++){p.step(1000/120);containment(p);}assert(p.fill<before,'Drain must remove water');assert(p.sprites.length===26,'All logos must remain');
 result.push({viewport:[W,H],retained:p.sprites.length,maximumSettledPenetrationPx:overlap,throwAndScroll:'Fully contained',drain:'Water removed without losing objects'});p.destroy();
}
console.log(JSON.stringify(result));


