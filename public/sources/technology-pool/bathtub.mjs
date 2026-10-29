import {fitCardText} from './card-layout.mjs';
import {PoolWorld} from './pool-core.mjs';
import {layoutAnnotationCopy} from './annotation-render.mjs';
import {paintRescue} from './exhibit-render.mjs';
import {paintBath} from './cartoon-render.mjs';
import {TECHNOLOGY_COPY} from './exhibit-core.mjs';
const scene=document.getElementById('technology-pool'),tub=document.querySelector('.pool-tub'),canvas=document.getElementById('technology-canvas');
// Keep physical drawing below fixed DOM fixtures and annotation overlays.
document.body.append(canvas);
const objectCanvas=document.createElement('canvas');objectCanvas.className='technology-object-layer';objectCanvas.setAttribute('aria-hidden','true');document.body.append(objectCanvas);const front=objectCanvas.getContext('2d');
const rescueCanvas=document.createElement('canvas');rescueCanvas.className='technology-rescue-layer';rescueCanvas.setAttribute('aria-hidden','true');document.body.append(rescueCanvas);const rescueInk=rescueCanvas.getContext('2d');
const ctx=canvas.getContext('2d'),M=window.Matter;
const data=await(await fetch(new URL('../../images/technologies/physics-data.json',import.meta.url))).json(),images=new Map();
await Promise.all(data.map(meta=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(meta.id,im);resolve();};im.onerror=()=>reject(Error('Logo failed: '+meta.id));im.src=new URL('../../images/technologies/'+meta.normalizedIcon,import.meta.url).href;})));
await Promise.all(['open','grab'].map(pose=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set('glove-'+pose,im);resolve();};im.onerror=reject;im.src=new URL('../../images/technologies/glove-'+pose+'.svg',import.meta.url).href;})));
const tap=document.getElementById('pool-faucet-handle'),drain=document.getElementById('pool-drain'),status=document.getElementById('pool-status');
for(const meta of data){const li=document.createElement('li');li.textContent=meta.name;document.getElementById('pool-technology-list').append(li);}
let dragTarget=null;
let world,activated=false,last=0,accumulator=0,grab=null,touchScroll=null,frame=0,viewW=0,viewH=0,running=!matchMedia('(prefers-reduced-motion: reduce)').matches,lastExhibitId=null;
const copyStore=document.getElementById('pool-technology-copy'),card=document.getElementById('pool-exhibit-card'),cardContent=document.getElementById('pool-exhibit-content'),cardIcon=document.getElementById('pool-exhibit-icon'),articles=new Map([...copyStore.querySelectorAll('[data-technology]')].map(el=>[el.dataset.technology,el]));
for(const meta of data){const article=articles.get(meta.id);Object.defineProperty(meta,'name',{get:()=>article.querySelector('h3').textContent});Object.defineProperty(TECHNOLOGY_COPY,meta.id,{get:()=>article.querySelector('p').textContent});}
let activeArticle=null,lastFitKey=null;
const waves=new Float32Array(65),velocities=new Float32Array(65),drops=[];let dropBudget=0;
function resize(){
 const r=tub.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight,chamberHeight=r.height-16;
 if(r.width<1||r.height<1)return;
 if(world&&Math.abs(r.width-world.width)<1&&Math.abs(chamberHeight-world.height)<1&&vw===viewW&&vh===viewH)return;
 if(world)world.destroy();world=new PoolWorld(M,data,r.width,chamberHeight);activated=false;viewW=vw;viewH=vh;grab=null;touchScroll=null;waves.fill(0);velocities.fill(0);drops.length=0;
 if(r.width>700){const note=tub.querySelector('.water-note-wide'),end=tub.querySelector('h2').getBoundingClientRect().left-r.left-10;note.setAttribute('viewBox',`0 0 ${r.width} 215`);note.querySelector('#water-writing').setAttribute('d',`M109 77C133 23 ${end-55} 22 ${end} 31`);note.querySelector(':scope > path').setAttribute('d',`M${end} 90C${end-45} 118 135 119 109 103`);}

 const noteWidth=Math.min(180,(r.width<=700?r.width*.45-16:r.width*.71-16)-26);tub.querySelector('.drain-note').style.width=noteWidth+'px';
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);objectCanvas.width=canvas.width;objectCanvas.height=canvas.height;front.setTransform(dpr,0,0,dpr,0,0);rescueCanvas.width=canvas.width;rescueCanvas.height=canvas.height;rescueInk.setTransform(dpr,0,0,dpr,0,0);layoutAnnotationCopy();sync();
}
function sync(){tap.setAttribute('aria-pressed',String(world.tap));drain.setAttribute('aria-pressed',String(world.draining));}
function setHeld(key,value){if(!world)return;world[key]=value;if(value)running=true;sync();status.dataset[key]=String(value);}
function hold(button,key){
 button.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();button.setPointerCapture(event.pointerId);setHeld(key,true);});
 for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(event,()=>setHeld(key,false));
 button.addEventListener('keydown',event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();setHeld(key,true);}});
 button.addEventListener('keyup',event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();setHeld(key,false);}});
 button.addEventListener('contextmenu',event=>event.preventDefault());
}
drain.setAttribute('aria-label','Hold the rubber duck to drain water');
hold(tap,'tap');hold(drain,'drain');
function releaseGrab(){if(grab){M.Composite.remove(world.engine.world,grab);grab=null;}if(world)world.draggedId=null;dragTarget=null;touchScroll=null;tub.style.cursor='';}
function releaseAll(){setHeld('tap',false);setHeld('drain',false);releaseGrab();}
window.addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
tub.addEventListener('pointerdown',event=>{
 if(event.target.closest('button,.pool-exhibit-card,[data-local-edit],[contenteditable=true]'))return;
 const p={x:event.clientX,y:event.clientY},body=M.Query.point(world.sprites.map(x=>x.body),p).at(-1);
 if(body){event.preventDefault();tub.setPointerCapture(event.pointerId);running=true;dragTarget={...p};world.draggedId=body.label;status.dataset.lastGrabbed=body.label;tub.style.cursor='grabbing';grab=M.Constraint.create({pointA:p,bodyB:body,pointB:{x:p.x-body.position.x,y:p.y-body.position.y},length:0,stiffness:.10,damping:.25});M.Composite.add(world.engine.world,grab);}
 else if(event.pointerType==='touch'){tub.setPointerCapture(event.pointerId);touchScroll=event.clientY;}
});
tub.addEventListener('pointermove',event=>{
 if(grab){dragTarget={x:event.clientX,y:event.clientY};}
 else if(touchScroll!==null){const dy=touchScroll-event.clientY;touchScroll=event.clientY;window.scrollBy({top:dy,behavior:'instant'});running=true;}
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])tub.addEventListener(event,releaseGrab);
function disturb(x,amount){const i=Math.max(1,Math.min(63,Math.round((x-world.frame.left)/world.width*64)));velocities[i]+=Math.max(-1,Math.min(1,amount));}
function stepWaves(scrollDelta=0){
 for(let i=1;i<64;i++){velocities[i]+=(waves[i-1]+waves[i+1]-2*waves[i])*.035-waves[i]*.009+Math.sin(i*.19)*Math.max(-.16,Math.min(.16,scrollDelta*.012));velocities[i]*=.963;}
 for(let i=1;i<64;i++)waves[i]=Math.max(-18,Math.min(18,waves[i]+velocities[i]));
 let average=0;for(let i=0;i<65;i++)average+=waves[i]*(i===0||i===64?.5:1)/64;for(let i=0;i<65;i++)waves[i]-=average;
 if(world.tap)disturb(world.frame.left+world.jet.x,Math.sin(world.time*13)*.19);
 if(world.draining&&world.fill>.001)disturb(world.frame.left+70,-.1);
 if(world.rescue.visible&&world.rescue.state!=='holding')disturb(world.rescue.tip.x,(world.rescue.tip.y-world.rescue.previousTip.y)*.12);
 if(world.exhibit.visible&&(Math.abs(world.exhibit.angularVelocity)>.008||Math.abs(world.panelWaterDelta)>.05)){disturb(world.exhibit.body.position.x,world.exhibit.angularVelocity*2+world.panelWaterDelta*.12);disturb(world.exhibit.body.position.x-world.exhibit.width*.35,-world.exhibit.angularVelocity*1.1);}
}
function stepDrops(dt,waterRemoved){
 if(waterRemoved>0){
  dropBudget+=dt/1000*65;
  while(dropBudget>=1){const t=world.time*35+drops.length;drops.push({x:world.frame.left+70+Math.sin(t)*2.5,y:world.frame.top+world.height-7,vx:Math.sin(t*1.7)*15,vy:135,r:2+(Math.sin(t)+1)*.8});dropBudget--;}
 }
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.vy+=dt/1000*920;d.x+=d.vx*dt/1000;d.y+=d.vy*dt/1000;if(d.y>viewH+35||d.x<0||d.x>viewW)drops.splice(i,1);}
}
function waterPath(){const f=world.frame;ctx.beginPath();ctx.moveTo(f.left,world.waterY+waves[0]);for(let i=1;i<65;i++)ctx.lineTo(f.left+i*world.width/64,world.waterY+waves[i]);}
function tubClip(){const f=world.frame;ctx.beginPath();ctx.roundRect(f.left+4,f.top,world.width-8,world.height-4,[0,0,31,31]);ctx.clip();}
function draw(active){
 sync();tub.dataset.rescueGrip=String(world.rescue.visible&&world.rescue.grip>.35);
 paintBath(ctx,{world,images,waves,drops,viewW,viewH,activated,active,front});
 updateCard(active);
 rescueInk.clearRect(0,0,viewW,viewH);if(activated&&active){rescueInk.save();rescueInk.beginPath();rescueInk.rect(world.frame.left+4,world.frame.top,world.width-8,world.height-4);rescueInk.clip();paintRescue(rescueInk,world,images);rescueInk.restore();}
 if(frame%12===0){status.textContent=`${data.length} technology objects. Faucet ${world.tap?'open':'closed'}. Drain ${world.draining?'open':'closed'}.`;status.dataset.objectCount=String(world.sprites.length);status.dataset.water=world.fill.toFixed(4);status.dataset.simTicks=String(frame);status.dataset.drained=world.drained.toFixed(2);status.dataset.frameTop=world.frame.top.toFixed(1);status.dataset.runoffDrops=String(drops.length);status.dataset.shelf=world.exhibit.occupantId||'';status.dataset.exhibitState=world.exhibit.state;status.dataset.exhibitShown=world.exhibit.shownId||'';status.dataset.waterVolume=world.waterVolume.toFixed(2);status.dataset.fluidArea=world.actualFluidArea.toFixed(2);status.dataset.cardWetArea=world.cardWetArea.toFixed(2);status.dataset.rescue=world.rescue.state;status.dataset.grip=String(world.rescue.grip||0);status.dataset.rescueCount=String(world.rescue.interventions);status.dataset.obstacleWetArea=String(world.obstacleWetArea||0);status.dataset.leftGate=String(world.gateOpen.left);status.dataset.rightGate=String(world.gateOpen.right);}
 if(lastExhibitId!==world.exhibit.shownId){lastExhibitId=world.exhibit.shownId;const meta=data.find(x=>x.id===lastExhibitId);document.getElementById('pool-exhibit-copy').textContent=meta?meta.name+'. '+TECHNOLOGY_COPY[meta.id]:'';}
}
function updateCard(active){
 const p=world.exhibit,shown=activated&&active&&p.visible&&p.shownId;
 card.hidden=!shown;if(!shown)return;
 if(activeArticle?.dataset.technology!==p.shownId){if(activeArticle)copyStore.append(activeArticle);activeArticle=articles.get(p.shownId);cardContent.append(activeArticle);cardIcon.src=images.get(p.shownId).src;}
 card.classList.toggle('is-small',p.width<270);card.style.width=p.width+'px';card.style.height=p.height+'px';card.style.left=(p.body.position.x-world.frame.left)+'px';card.style.top=(p.body.position.y-world.frame.top)+'px';card.style.transform=`translate(-50%,-50%) rotate(${p.angle}rad)`;
 const key=p.width+':'+p.height+':'+p.shownId+':'+activeArticle.textContent;if(key!==lastFitKey&&!activeArticle.contains(document.activeElement)){fitCardText(card);lastFitKey=key;}
}
function tick(time){
 const dt=last?Math.min(50,time-last):16.67;last=time;
 const r=tub.getBoundingClientRect(),sceneBounds=scene.getBoundingClientRect(),active=sceneBounds.top<viewH&&sceneBounds.bottom>0;
 if(active&&!activated){world.setFrame(r.left,r.top,{initial:true});activated=true;}

 if(activated&&(active||drops.length)&&running&&!document.hidden&&!document.activeElement?.closest('[data-local-edit],[data-local-copy]')){
  accumulator+=dt;let count=0;const oldTop=world.frame.top,oldLeft=world.frame.left,steps=Math.min(6,Math.floor(accumulator/(1000/120)));
  while(accumulator>=1000/120&&count<6){
   const fraction=(count+1)/Math.max(1,steps);world.setFrame(oldLeft+(r.left-oldLeft)*fraction,oldTop+(r.top-oldTop)*fraction);
   for(const item of world.sprites)if(Math.abs(item.body.position.y-world.waterY)<item.size*.6&&Math.abs(item.body.velocity.y)>1.4)disturb(item.body.position.x,item.body.velocity.y*.008);
   if(grab&&dragTarget){const target={x:Math.max(world.frame.left+12,Math.min(world.frame.left+world.width-12,dragTarget.x)),y:Math.max(world.frame.top+world.ceiling+8,Math.min(world.frame.top+world.height-16,dragTarget.y))},dx=target.x-grab.pointA.x,dy=target.y-grab.pointA.y,distance=Math.hypot(dx,dy),scale=distance?Math.min(.28,24/distance):0;grab.pointA={x:grab.pointA.x+dx*scale,y:grab.pointA.y+dy*scale};}
   const before=world.drained;stepWaves((r.top-oldTop)/Math.max(1,steps));world.setSurfaceWaves(waves);world.step(1000/120);stepDrops(1000/120,world.drained-before);accumulator-=1000/120;count++;
  }
  frame++;
 }else{accumulator=0;if(activated){world.setFrame(r.left,r.top);world.solveWaterSurface();}}
 draw(active);requestAnimationFrame(tick);
}
new ResizeObserver(resize).observe(tub);window.addEventListener('resize',resize);resize();requestAnimationFrame(tick);

document.fonts.ready.then(layoutAnnotationCopy);
