import {paintAnnotations} from './annotation-render.mjs';
import {paintSpotlights,paintShelf} from './exhibit-render.mjs';
const design=document.body.dataset.poolDesign||'porcelain';
const water='#99d1eb';
const buffer=document.createElement('canvas'),ink=buffer.getContext('2d');
function tubClip(ctx,w){const f=w.frame;ctx.beginPath();ctx.rect(f.left+4,f.top,w.width-8,w.height-4);ctx.clip();}
function surface(ctx,w){const points=w.waterSurface;ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);}
function fluidPath(ctx,w){ctx.beginPath();surface(ctx,w);ctx.lineTo(w.frame.left+w.width-4,w.frame.top+w.height-4);ctx.lineTo(w.frame.left+4,w.frame.top+w.height-4);ctx.closePath();}
function excludeCard(ctx,w,W,H){
 // Sequential clips subtract the union, including any overlap of hand and panel.
 for(const poly of [w.exhibit.visible?w.exhibit.body.vertices:null,w.rescue.visible?w.rescue.outline:null]){if(!poly)continue;ctx.beginPath();ctx.rect(0,0,W,H);poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip('evenodd');}
}
export function paintBath(ctx,{world,images,waves,drops,viewW,viewH,activated,active,front}){
 ctx.clearRect(0,0,viewW,viewH);front.clearRect(0,0,viewW,viewH);if(!activated||!active&&!drops.length||!world.waterSurface.length)return;
 const f=world.frame,W=world.width,H=world.height,wet=world.waterVolume>.1,dpr=ctx.getTransform().a;
 if(buffer.width!==Math.round(viewW*dpr)||buffer.height!==Math.round(viewH*dpr)){buffer.width=Math.round(viewW*dpr);buffer.height=Math.round(viewH*dpr);}
 ink.setTransform(dpr,0,0,dpr,0,0);ink.clearRect(0,0,viewW,viewH);ink.save();tubClip(ink,world);
 paintShelf(ink,world);
 for(const item of world.sprites){const b=item.body;ink.save();ink.translate(b.position.x,b.position.y);ink.rotate(b.angle);ink.drawImage(images.get(item.meta.id),-item.offset.x,-item.offset.y,item.size,item.size);ink.restore();}
 ink.restore();
 ctx.save();tubClip(ctx,world);paintSpotlights(ctx,world);excludeCard(ctx,world,viewW,viewH);
 if(wet){fluidPath(ctx,world);ctx.fillStyle=water;ctx.fill();}
 if(world.tap){
  const x=f.left+world.jet.x,top=f.top+world.jet.y,bottom=Math.max(top,world.waterY),bend=y=>Math.sin(y*.035-world.time*13)*.65;
  ctx.beginPath();ctx.moveTo(x-4.5,top);for(let y=top;y<bottom;y+=10)ctx.lineTo(x-4+bend(y),y);ctx.lineTo(x+4,bottom);for(let y=bottom;y>top;y-=10)ctx.lineTo(x+4+bend(y),y);ctx.closePath();ctx.fillStyle=water;ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1.4;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-.7,top+3);ctx.lineTo(x-.7,bottom-3);ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.stroke();
 }
 ctx.restore();ctx.save();tubClip(ctx,world);paintAnnotations(ctx);ctx.restore();front.drawImage(buffer,0,0,viewW,viewH);
 if(wet){front.save();tubClip(front,world);excludeCard(front,world,viewW,viewH);fluidPath(front,world);front.clip();front.fillStyle='rgba(40,126,170,.035)';front.fillRect(f.left,world.waterY-24,W,H+24);front.restore();
  ctx.save();tubClip(ctx,world);excludeCard(ctx,world,viewW,viewH);ctx.beginPath();surface(ctx,world);ctx.strokeStyle='#111';ctx.lineWidth=2.4;ctx.stroke();ctx.restore();
 }
 if(world.draining&&wet){ctx.save();tubClip(ctx,world);excludeCard(ctx,world,viewW,viewH);ctx.strokeStyle='rgba(17,17,17,.35)';ctx.lineWidth=1.5;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(f.left+70,f.top+H-52,18+i*9,6+i*3,world.time*.6,Math.PI*.12,Math.PI*1.65);ctx.stroke();}ctx.restore();}
 ctx.fillStyle=water;ctx.strokeStyle='#111';ctx.lineWidth=1.2;
 for(const d of drops){ctx.beginPath();ctx.ellipse(d.x,d.y,d.r*.8,d.r*1.7,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 // The card is impermeable and stays entirely dry, including its border and copy.

}
