import fs from 'node:fs';import {createRequire} from 'node:module';import {PoolWorld,clipToConvex,polygonAreaCentroid} from '../public/sources/technology-pool/pool-core.mjs';
const M=createRequire(import.meta.url)('../public/vendor/4047a043ad8e-matter.min.js'),data=JSON.parse(fs.readFileSync(new URL('../public/images/technologies/physics-data.json',import.meta.url),'utf8'));
const assert=(v,message)=>{if(!v)throw Error(message);},results=[];
for(const [W,H] of [[1250,700],[390,650]]){
 const w=new PoolWorld(M,data,W,H),initial=w.waterVolume,waves=new Float32Array(65);let worst=0;
 function check(){const e=Math.abs(w.actualFluidArea-w.waterVolume);worst=Math.max(worst,e);assert(e<2,'Fluid area must equal conserved volume: '+e);assert(Math.abs(w.waterVolume-initial)<1e-6,'Waves and card motion must not create or destroy water');}
 const item=w.sprites.find(x=>x.meta.id==='rust');M.Body.setAngle(item.body,0);M.Body.setPosition(item.body,{x:w.shelf.left+w.shelf.width/2,y:0});const b=M.Bounds.create(item.body.vertices);M.Body.translate(item.body,{x:0,y:w.shelf.y-.5-b.max.y});M.Body.setVelocity(item.body,{x:0,y:0});
 for(let t=0;t<150;t++){
  for(let i=0;i<65;i++)waves[i]=Math.sin(i*.23+t*.1)*9+Math.sin(i*.47-t*.08)*3;
  w.setSurfaceWaves(waves);w.step(1000/120);check();
 }
 assert(w.exhibit.visible,'The card must be present during the conservation test');
 for(const top of [-110,-260,30,0]){w.setFrame(0,top);w.solveWaterSurface();check();}
 w.setSurfaceWaves(new Float32Array(65));w.solveWaterSurface();
 const f=w.frame,rect=[{x:f.left+4,y:w.waterY},{x:f.left+W-4,y:w.waterY},{x:f.left+W-4,y:f.top+H-4},{x:f.left+4,y:f.top+H-4}],clipped=clipToConvex(w.exhibit.body.vertices,rect),expected=clipped.length>2?polygonAreaCentroid(clipped).area:0;
 assert(Math.abs(w.cardWetArea-expected)<.01,'The card must displace its full submerged area');
 const displacement=w.cardWetArea;w.exhibit.state='hidden';w.exhibit.body.collisionFilter.mask=0;w.solveWaterSurface();check();assert(w.cardWetArea===0,'Water must return to the vacated space');
 w.tap=true;for(let i=0;i<24;i++)w.step(1000/120);assert(w.waterVolume>initial,'Only filling should add water');const afterFill=w.waterVolume;w.tap=false;for(let i=0;i<24;i++)w.step(1000/120);assert(Math.abs(w.waterVolume-afterFill)<1e-6,'Released tap must not add water');
 w.drain=true;for(let i=0;i<24;i++)w.step(1000/120);assert(w.waterVolume<afterFill,'Drain must remove water');
 results.push({viewport:[W,H],worstAreaErrorPx2:worst,cardAreaFullyDisplacedPx2:displacement,volumeConservedThroughWavesScrollingAndCard:true});w.destroy();
}
console.log(JSON.stringify(results));
