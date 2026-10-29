import {DrainRescue} from './rescue-core.mjs';
import {ShelfExhibit} from './exhibit-core.mjs';
export function polygonAreaCentroid(vertices){
 let twice=0,x=0,y=0;
 for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],c=a.x*b.y-b.x*a.y;twice+=c;x+=(a.x+b.x)*c;y+=(a.y+b.y)*c;}
 return Math.abs(twice)<1e-8?{area:0,x:0,y:0}:{area:Math.abs(twice)/2,x:x/(3*twice),y:y/(3*twice)};
}
export function submergedPolygon(vertices,line){
 const out=[];
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length],aIn=a.y>=line,bIn=b.y>=line;
  if(aIn)out.push(a);
  if(aIn!==bIn){const t=(line-a.y)/(b.y-a.y);out.push({x:a.x+t*(b.x-a.x),y:line});}
 }return out;
}
export function clipToConvex(subject,clip){
 let out=subject;
 for(let i=0;i<clip.length&&out.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],inside=p=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)>=-1e-7,input=out;out=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],pi=inside(p),qi=inside(q);
   if(pi)out.push(p);
   if(pi!==qi){const dx=q.x-p.x,dy=q.y-p.y,ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;if(Math.abs(den)>1e-10){const t=((a.x-p.x)*ey-(a.y-p.y)*ex)/den;out.push({x:p.x+dx*t,y:p.y+dy*t});}}
  }
 }return out;
}
export class PoolWorld{
 constructor(M,data,width,height){this.M=M;this.data=data;this.width=width;this.height=height;this.reset();}
 get draining(){return this.drain||this.rescue?.state==='holding';}
 get fill(){return this.waterVolume/this.waterCapacity;}
 set fill(fraction){this.waterVolume=Math.max(0,fraction*this.waterCapacity);}
 reset(){
  const {Engine,Bodies,Body,Composite,Vertices}=this.M,W=this.width,H=this.height;
  this.engine=Engine.create({positionIterations:14,velocityIterations:10,constraintIterations:4});
  this.engine.gravity.y=1;this.engine.gravity.scale=.001;this.time=0;this.waterCapacity=(W-8)*(H-4);this.waterVolume=this.waterCapacity*.23;this.tap=false;this.drain=false;this.waterY=H*(1-this.fill);this.surfaceWaves=new Float32Array(65);this.waterSurface=[];this.actualFluidArea=this.waterVolume;this.cardWetArea=0;this.sprites=[];this.frame={left:0,top:0};this.drained=0;this.filled=0;
  this.ceiling=24;this.draggedId=null;this.panelDisplacement=0;this.panelWaterDelta=0;
  const faucetWidth=W<=700?150:180,faucetScale=faucetWidth/200,faucetTop=W<=700?100:65;
  this.faucetBase=0;
  this.jet={x:128*faucetScale,y:faucetTop+112*faucetScale};
  const shelfWidth=W<=700?108:Math.min(176,W*.18);
  this.shelf={left:W-(W<=700?20:Math.max(42,W*.105))-shelfWidth,width:shelfWidth,y:Math.min(245,H*.30)};
  this.wallOffsets=[{x:W/2,y:H+12},{x:-18,y:H/2},{x:W+18,y:H/2},{x:W/2,y:this.ceiling-24},{x:this.faucetBase+52*faucetScale,y:faucetTop+73*faucetScale},{x:this.faucetBase+128*faucetScale,y:faucetTop+97*faucetScale},{x:70,y:H-52}];
  this.walls=[Bodies.rectangle(W/2,H+12,W+100,48,{isStatic:true}),Bodies.rectangle(-18,H/2,48,H*3,{isStatic:true}),Bodies.rectangle(W+18,H/2,48,H*3,{isStatic:true}),Bodies.rectangle(W/2,this.ceiling-24,W+100,48,{isStatic:true}),Bodies.rectangle(this.wallOffsets[4].x,this.wallOffsets[4].y,122*faucetScale,30*faucetScale,{isStatic:true}),Bodies.rectangle(this.wallOffsets[5].x,this.wallOffsets[5].y,32*faucetScale,36*faucetScale,{isStatic:true}),Bodies.circle(70,H-52,43,{isStatic:true})];
  const shelf=this.shelf;this.shelfWallStart=this.walls.length;this.shelfGateUntil=0;
  // Wall-mounted fittings sit behind the flat technology pieces.
  this.walls[4].isSensor=false;this.walls[5].isSensor=false;this.walls[6].isSensor=true;this.walls[6].collisionFilter.mask=0;
  this.gates={left:0,right:0};this.gateOpen={left:false,right:false};
  for(const [x,y,w,h] of [[shelf.left+shelf.width/2,shelf.y+5,shelf.width,10],[shelf.left+3,shelf.y-7,6,24],[shelf.left+shelf.width-3,shelf.y-7,6,24],[this.faucetBase+7,faucetTop*.5+40,14,faucetTop+80]]){this.wallOffsets.push({x,y});this.walls.push(Bodies.rectangle(x,y,w,h,{isStatic:true,isSensor:w===14}));}
  this.wallOffsets.push({x:74*faucetScale,y:faucetTop+24*faucetScale});this.walls.push(Bodies.circle(74*faucetScale,faucetTop+24*faucetScale,23*faucetScale,{isStatic:true}));
  Composite.add(this.engine.world,this.walls);
  this.exhibit=new ShelfExhibit(this);this.rescue=new DrainRescue(this);
  const cols=W<=700?5:8,rows=Math.ceil(this.data.length/cols),startY=Math.max(shelf.y+55,H*.44);
  this.data.forEach((meta,i)=>{
   const size=W<=700?Math.min(40,W/10):66+(i*7%15),scale=size/192;
   const pieces=meta.parts.map(poly=>{
    const vertices=poly.map(p=>({x:p[0]*scale,y:p[1]*scale}));
    return Body.create({position:Vertices.centre(vertices),vertices,friction:.4,restitution:.04,slop:.025});
   });
   const body=Body.create({parts:pieces,friction:.4,frictionAir:.02,restitution:.04,slop:.025,label:meta.id});
   const offset={...body.position};Body.scale(body,(size+3)/size,(size+3)/size);Body.setDensity(body,.0015*meta.density);
   const col=(i*(cols===5?3:5))%cols,row=Math.floor(i/cols),pad=W<=700?36:75;
   const rowGap=Math.min(W<=700?70:99,Math.max(24,(H-startY-50)/Math.max(1,rows-1)));
   const x=pad+(W-pad*2)*(col/(cols-1)),y=startY+row*rowGap+(i%3)*4;
   Body.setPosition(body,{x,y});Body.setAngle(body,((i*17%23)-11)*Math.PI/180);
   Composite.add(this.engine.world,body);this.sprites.push({meta,body,size,offset});
  });
 }
 setFrame(left,top,{initial=false}={}){
  const {Body}=this.M,dy=top-this.frame.top,dx=left-this.frame.left;
  if(initial){
   for(const item of this.sprites)Body.translate(item.body,{x:dx,y:dy});
   this.waterY+=dy;
  }else if(dy<0){
   // Sweep the rising floor: only actual contact lifts objects, not page scrolling.
   const oldFloor=this.frame.top+this.height-10,newFloor=top+this.height-10;
   for(const item of this.sprites){const b=item.body;if(b.bounds.max.y>newFloor&&b.bounds.min.y<oldFloor){Body.translate(b,{x:0,y:newFloor-b.bounds.max.y-.3});Body.setVelocity(b,{x:b.velocity.x,y:Math.min(b.velocity.y,Math.max(-18,dy*.35))});}}
  }
  this.frame={left,top};
  this.walls.forEach((body,i)=>Body.setPosition(body,{x:left+this.wallOffsets[i].x,y:top+this.wallOffsets[i].y}));
  this.updateShelfGates();
  this.exhibit.pose(this.exhibit.angle,0);this.rescue.pose();
 }
 updateShelfGates(){
  const {Body,Bounds}=this.M,s=this.shelf,f=this.frame;
  for(const [side,index] of [['left',1],['right',2]]){
   const hinge={x:f.left+s.left+(side==='left'?3:s.width-3),y:f.top+s.y+5},wall=this.walls[this.shelfWallStart+index];
   let open=this.time<this.gates[side];
   // Never close through an icon. Once clear, the raised side becomes solid again.
   if(!open&&this.gateOpen[side])open=this.sprites.some(item=>{const b=Bounds.create(item.body.vertices);return b.max.x>hinge.x-4&&b.min.x<hinge.x+4&&b.max.y>hinge.y-25&&b.min.y<hinge.y+1;});
   this.gateOpen[side]=open;const angle=open?(side==='left'?-Math.PI/2:Math.PI/2):0;
   wall.isSensor=false;wall.collisionFilter.mask=1;Body.setAngle(wall,angle);Body.setPosition(wall,{x:hinge.x+Math.sin(angle)*12,y:hinge.y-Math.cos(angle)*12});
  }
 }
 setSurfaceWaves(waves){this.surfaceWaves=waves;}
 prepareFluidSlices(){
  const f=this.frame,left=f.left+4,right=f.left+this.width-4,bottom=f.top+this.height-4,top=f.top,dx=(right-left)/64,card=this.exhibit.visible?this.exhibit.body.vertices:null,hand=this.rescue.visible?this.rescue.outline:null,shapes=[];
  if(card)shapes.push({poly:card,sign:1});if(hand)shapes.push({poly:hand,sign:1});if(card&&hand){const common=clipToConvex(hand,card);if(common.length>2)shapes.push({poly:common,sign:-1});}
  // Shape motion changes once per substep; binary volume solving reuses these cuts.
  this.fluidSlices=Array.from({length:64},(_,i)=>{const x0=left+i*dx,x1=x0+dx,strip=[{x:x0,y:top},{x:x1,y:top},{x:x1,y:bottom},{x:x0,y:bottom}];return shapes.map(({poly,sign})=>({poly:clipToConvex(poly,strip),sign})).filter(x=>x.poly.length>2);});
 }
 fluidAt(level,details=false){
  const f=this.frame,left=f.left+4,right=f.left+this.width-4,bottom=f.top+this.height-4,top=f.top,dx=(right-left)/64;
  let area=0,blocked=0;const points=details?[]:null;
  for(let i=0;i<64;i++){
   const x0=left+i*dx,x1=x0+dx,y0=Math.max(top,Math.min(bottom,level+this.surfaceWaves[i])),y1=Math.max(top,Math.min(bottom,level+this.surfaceWaves[i+1]));
   area+=dx*(bottom-(y0+y1)/2);
   if(points){if(i===0)points.push({x:x0,y:y0});points.push({x:x1,y:y1});}
   const strip=[{x:x0,y:y0},{x:x1,y:y1},{x:x1,y:bottom},{x:x0,y:bottom}];
   for(const shape of this.fluidSlices[i]){const wet=clipToConvex(shape.poly,strip);if(wet.length>2)blocked+=polygonAreaCentroid(wet).area*shape.sign;}
  }
  return {area:area-blocked,blocked,points};
 }
 solveWaterSurface(){
  this.prepareFluidSlices();
  if(!this.exhibit.visible&&!this.rescue.visible){let mean=0,min=Infinity,max=-Infinity;for(let i=0;i<65;i++){const w=this.surfaceWaves[i];mean+=w*(i===0||i===64?.5:1)/64;min=Math.min(min,w);max=Math.max(max,w);}const level=this.frame.top+this.height-4-this.waterVolume/(this.width-8)-mean;if(level+min>=this.frame.top&&level+max<=this.frame.top+this.height-4){this.waterY=level;const v=this.fluidAt(level,true);this.waterSurface=v.points;this.actualFluidArea=v.area;this.cardWetArea=0;return;}}
  let low=this.frame.top-24,high=this.frame.top+this.height+24;
  for(let i=0;i<22;i++){const mid=(low+high)/2;if(this.fluidAt(mid).area>this.waterVolume)low=mid;else high=mid;}
  this.waterY=(low+high)/2;const actual=this.fluidAt(this.waterY,true);this.waterSurface=actual.points;this.actualFluidArea=actual.area;this.obstacleWetArea=actual.blocked;const wetCard=this.exhibit.visible?clipToConvex(this.exhibit.body.vertices,[{x:this.frame.left+4,y:this.waterY},{x:this.frame.left+this.width-4,y:this.waterY},{x:this.frame.left+this.width-4,y:this.frame.top+this.height-4},{x:this.frame.left+4,y:this.frame.top+this.height-4}]):[];this.cardWetArea=this.rescue.visible?(wetCard.length>2?polygonAreaCentroid(wetCard).area:0):actual.blocked;
 }
 step(dt=1000/120){
  const {Body,Engine}=this.M,H=this.height;
  this.time+=dt/1000;
  this.exhibit.step(dt);
  this.rescue.step(dt);
  const dragged=this.sprites.find(x=>x.meta.id===this.draggedId);if(dragged&&Math.abs(dragged.body.position.y-this.frame.top-this.shelf.y)<dragged.size*1.8){const x=dragged.body.position.x-this.frame.left;if(x<this.shelf.left+dragged.size)this.gates.left=this.time+.25;if(x>this.shelf.left+this.shelf.width-dragged.size)this.gates.right=this.time+.25;}
  this.updateShelfGates();
  const maximum=Math.max(.23,Math.min(.70,(this.waterCapacity-this.exhibit.width*this.exhibit.height-this.waterCapacity*.12)/this.waterCapacity));
  const added=this.tap?Math.max(0,Math.min(maximum-this.fill,dt/1000*.075)):0;
  this.fill+=added;this.filled+=added*H;
  const removed=this.draining?Math.min(this.fill,dt/1000*.085):0;
  this.fill-=removed;this.drained+=removed*H;
  this.solveWaterSurface();
  const displacement=this.cardWetArea/this.width;
  this.panelWaterDelta=displacement-this.panelDisplacement;this.panelDisplacement=displacement;
  for(const item of this.sprites){
   const b=item.body;if(!Number.isFinite(b.position.x)||!Number.isFinite(b.position.y))throw Error('Invalid physics position');
   const sample=Math.max(0,Math.min(63.999,(b.position.x-this.frame.left-4)/(this.width-8)*64)),index=Math.floor(sample),surfaceY=this.waterSurface[index].y+(this.waterSurface[index+1].y-this.waterSurface[index].y)*(sample-index);
   let area=0,x=0,y=0;
   for(const p of b.parts.slice(b.parts.length>1?1:0)){
    const polygon=submergedPolygon(p.vertices,surfaceY);if(polygon.length<3)continue;
    const s=polygonAreaCentroid(polygon);area+=s.area;x+=s.x*s.area;y+=s.y*s.area;
   }
   if(area>0){
    Body.applyForce(b,{x:x/area,y:y/area},{x:0,y:-area*.0015*this.engine.gravity.scale});
    const immersed=Math.min(1,area/b.area);
    Body.setVelocity(b,{x:b.velocity.x*(1-.018*immersed),y:b.velocity.y*(1-.04*immersed)});
    Body.setAngularVelocity(b,b.angularVelocity*(1-.09*immersed));
   }
   // A narrow stream pushes any logo directly beneath the open faucet.
   if(this.tap&&Math.abs(b.position.x-(this.frame.left+this.jet.x))<item.size*.4&&b.position.y>this.frame.top+this.jet.y&&b.position.y<this.waterY){
    Body.applyForce(b,{x:b.position.x-3,y:b.position.y},{x:0,y:b.mass*.00022});
   }
   const speed=Math.hypot(b.velocity.x,b.velocity.y);if(speed>18)Body.setVelocity(b,{x:b.velocity.x*18/speed,y:b.velocity.y*18/speed});
  }
  Engine.update(this.engine,dt);
  for(const item of this.sprites){const b=item.body,speed=Math.hypot(b.velocity.x,b.velocity.y);if(speed>18)Body.setVelocity(b,{x:b.velocity.x*18/speed,y:b.velocity.y*18/speed});if(Math.abs(b.angularVelocity)>.16)Body.setAngularVelocity(b,Math.sign(b.angularVelocity)*.16);}

  // Separate any residual penetration after a hard impact, without changing velocity.
  for(let pass=0;pass<10;pass++){let corrected=0;for(let i=0;i<this.sprites.length;i++)for(let j=i+1;j<this.sprites.length;j++){
   const a=this.sprites[i].body,b=this.sprites[j].body;if(a.isStatic||b.isStatic||!a.collisionFilter.mask||!b.collisionFilter.mask||!this.M.Bounds.overlaps(a.bounds,b.bounds))continue;
   const hit=this.M.Collision.collides(a,b);if(!hit||hit.depth<.65)continue;let n={...hit.normal};const d=this.M.Vector.sub(b.position,a.position);if(n.x*d.x+n.y*d.y<0)n=this.M.Vector.mult(n,-1);
   const f=this.frame,free=(body,dir)=>{const q=this.M.Bounds.create(body.vertices);return !(dir.y>.15&&q.max.y>f.top+H-13||dir.y<-.15&&q.min.y<f.top+this.ceiling+1||dir.x>.15&&q.max.x>f.left+this.width-9||dir.x<-.15&&q.min.x<f.left+9);};
   const invA=this.draggedId===a.label||!free(a,{x:-n.x,y:-n.y})?0:a.inverseMass,invB=this.draggedId===b.label||!free(b,n)?0:b.inverseMass,sum=invA+invB;if(!sum)continue;corrected++;const correction=hit.depth-.06;
   Body.translate(a,{x:-n.x*correction*invA/sum,y:-n.y*correction*invA/sum});Body.translate(b,{x:n.x*correction*invB/sum,y:n.y*correction*invB/sum});
  }
  if(!corrected)break;}
  // A closed chamber: bodies cannot cross its ceiling, floor, or side walls.
  for(const item of this.sprites){
   const b=item.body,f=this.frame,bounds=this.M.Bounds.create(b.vertices);let dx=0,dy=0,vx=b.velocity.x,vy=b.velocity.y;
   if(bounds.min.x<f.left+8){dx=f.left+8-bounds.min.x;vx=Math.abs(vx)*.18;}
   if(bounds.max.x>f.left+this.width-8){dx=f.left+this.width-8-bounds.max.x;vx=-Math.abs(vx)*.18;}
   if(bounds.min.y<f.top+this.ceiling){dy=f.top+this.ceiling-bounds.min.y;vy=Math.abs(vy)*.12;}
   if(bounds.max.y>f.top+H-12){dy=f.top+H-12-bounds.max.y;vy=-Math.abs(vy)*.06;}
   if(dx||dy){Body.translate(b,{x:dx,y:dy});Body.setVelocity(b,{x:vx,y:vy});}
  }
 }
 destroy(){this.M.Composite.clear(this.engine.world,false);this.M.Engine.clear(this.engine);}
}


