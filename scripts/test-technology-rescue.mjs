import fs from 'node:fs';import {createRequire} from 'node:module';import {PoolWorld,clipToConvex,polygonAreaCentroid} from '../public/sources/technology-pool/pool-core.mjs';
const M=createRequire(import.meta.url)('../public/vendor/4047a043ad8e-matter.min.js'),data=JSON.parse(fs.readFileSync(new URL('../public/images/technologies/physics-data.json',import.meta.url),'utf8')),assert=(x,m)=>{if(!x)throw Error(m);};let results=[];
for(const [W,H] of [[1250,700],[760,600],[390,650]]){
 const w=new PoolWorld(M,data,W,H),s=w.shelf,logo=w.sprites.find(x=>x.meta.id==='javascript');
 assert(w.walls[6].isSensor&&w.walls[6].collisionFilter.mask===0,'The drain must have no collision');assert(!w.walls[4].isSensor&&!w.walls[5].isSensor,'The faucet must collide');
 for(const side of ['left','right']){M.Body.setPosition(logo.body,{x:side==='left'?s.left-10:s.left+s.width+10,y:s.y-15});w.draggedId=logo.meta.id;w.step();assert(w.gateOpen[side],'Dragged logo must open '+side+' gate');}w.draggedId=null;
 w.fill=W<=700?.59:.69;const initial=w.waterVolume;M.Body.setAngle(logo.body,0);M.Body.setPosition(logo.body,{x:s.left+s.width/2,y:0});let b=M.Bounds.create(logo.body.vertices);M.Body.translate(logo.body,{x:0,y:s.y-.6-b.max.y});M.Body.setVelocity(logo.body,{x:0,y:0});M.Body.setAngularVelocity(logo.body,0);
 let arrived=null,held=false,left=false,maxError=0,displacement=0,kicks=0;
 for(let i=0;i<2400;i++){const before=w.waterVolume;w.step();maxError=Math.max(maxError,Math.abs(w.actualFluidArea-w.waterVolume));assert(Math.abs(w.actualFluidArea-w.waterVolume)<2,'Hand and card union must conserve fluid area');
  if(w.time<3)assert(!w.rescue.visible,'The gag must not trigger immediately');
  if(w.rescue.visible&&arrived===null)arrived=w.time;
  if(w.rescue.visible){displacement=Math.max(displacement,w.obstacleWetArea-w.cardWetArea);kicks=w.rescue.kickCount;}
  if(w.rescue.state==='arriving')assert(Math.abs(w.waterVolume-before)<1e-6,'Arm entry must displace, not delete water');
  if(w.rescue.state==='holding'){held=true;assert(w.draining,'Hand must hold the drain open');}
  if(held&&w.rescue.state==='idle'){left=true;break;}
 }
 assert(arrived>3&&held&&left,'Delayed arrival, draining and retraction must finish');assert(w.waterVolume<initial,'The hand must lower water');assert(displacement>100,'Hand must displace actual water area');assert(kicks>0,'Hand must physically kick logos');
 results.push({viewport:[W,H],arrivalSeconds:arrived,handWaterDisplacementPx2:displacement,handCollisions:kicks,areaErrorPx2:maxError,finalFill:w.fill,bothGatesOpenOnApproach:true,drainHasNoCollision:true});w.destroy();
}
console.log(JSON.stringify(results));
