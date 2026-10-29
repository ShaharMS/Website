import {gloveShape} from './glove-shape.mjs';
// A deliberately late intervention; driven by repeated real shelf/card transitions.
export class DrainRescue{
 constructor(world){this.world=world;this.state='idle';this.age=0;this.progress=0;this.trouble=0;this.lastFloatAt=-99;this.cooldown=0;this.interventions=0;this.kickCount=0;this.tip={x:0,y:0};this.previousTip={x:0,y:0};this.body=world.M.Bodies.rectangle(-100,-100,10,10,{isStatic:true,label:'long-helpful-hand',collisionFilter:{category:2,mask:0}});world.M.Composite.add(world.engine.world,this.body);}
 get visible(){return ['arriving','holding','leaving'].includes(this.state);}
 pose(){
  if(!this.visible)return;
  const w=this.world,f=w.frame,start={x:f.left+w.width*.91,y:f.top-65},gripTarget={x:f.left+79,y:f.top+w.height-75},aim={x:gripTarget.x-start.x,y:gripTarget.y-start.y},aimLength=Math.hypot(aim.x,aim.y),target={x:gripTarget.x-aim.x/aimLength*24,y:gripTarget.y-aim.y/aimLength*24},t=this.progress;
  this.previousTip={...this.tip};const fullX=target.x-start.x,fullY=target.y-start.y,fullLength=Math.hypot(fullX,fullY),length=Math.max(48,fullLength*t);
  this.tip={x:start.x+fullX/fullLength*length,y:start.y+fullY/fullLength*length};
  const dx=this.tip.x-start.x,dy=this.tip.y-start.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,r=w.width<700?13:19;
  const scale=w.width<700?.82:1,angle=Math.atan2(dy,dx),cos=Math.cos(angle),sin=Math.sin(angle),toWorld=p=>({x:this.tip.x+p.x*cos-p.y*sin,y:this.tip.y+p.x*sin+p.y*cos});
  this.grip=this.state==='holding'?Math.min(1,.7+this.age*3):this.state==='leaving'?Math.max(0,1-this.age*5):Math.max(0,Math.min(1,(this.progress-.90)/.10));
  this.glove=gloveShape(this.grip,scale);this.scale=scale;this.angle=angle;
  const edge=this.glove.filter(p=>p.x>-35*scale),armR=w.width<700?9:12;
  const local=[{x:-len,y:-armR},{x:-55*scale,y:-armR},{x:-55*scale,y:-26*scale},{x:-35*scale,y:-26*scale},...edge,{x:-35*scale,y:26*scale},{x:-55*scale,y:26*scale},{x:-55*scale,y:armR},{x:-len,y:armR}];
  this.outline=local.map(toWorld);const pts=w.M.Vertices.hull(this.outline);w.M.Vertices.clockwiseSort(pts);
  w.M.Body.setVertices(this.body,pts);w.M.Body.setPosition(this.body,w.M.Vertices.centre(pts));this.start=start;
 }
 step(dt){
  const w=this.world,sec=dt/1000,p=w.exhibit;this.age+=sec;this.cooldown=Math.max(0,this.cooldown-sec);
  const selected=w.sprites.find(x=>x.meta.id===p.occupantId);
  if(selected&&selected.meta.density<1&&w.fill>.48)this.lastFloatAt=w.time;
  const changes=p.events.filter(x=>x.time>w.time-6&&['entering','exiting'].includes(x.state)).length;
  const trouble=w.fill>.48&&w.time-this.lastFloatAt<6&&changes>=3;
  this.trouble=trouble?this.trouble+sec:Math.max(0,this.trouble-sec*.35);
  if(this.state==='idle'&&!this.cooldown&&this.trouble>3.2){this.state='arriving';this.age=0;this.interventions++;this.body.collisionFilter.mask=1;}
  if(this.state==='arriving'){const t=Math.min(1,this.age/.52);this.progress=1-(1-t)**3;if(t===1){this.state='holding';this.age=0;}}
  else if(this.state==='holding'){this.progress=1;if(this.age>1.2&&w.fill<.34&&w.waterY>w.frame.top+w.shelf.y+65){this.state='leaving';this.age=0;}}
  else if(this.state==='leaving'){const t=Math.min(1,this.age/.65);this.progress=1-t*t;if(t===1){this.state='idle';this.progress=0;this.body.collisionFilter.mask=0;this.cooldown=12;this.trouble=0;}}
  this.pose();
  if(this.visible&&this.state!=='holding')for(const item of w.sprites){const hit=w.M.Collision.collides(this.body,item.body);if(!hit)continue;let n={...hit.normal};const d=w.M.Vector.sub(item.body.position,this.body.position);if(n.x*d.x+n.y*d.y<0)n=w.M.Vector.mult(n,-1);w.M.Body.translate(item.body,{x:n.x*(hit.depth+.5),y:n.y*(hit.depth+.5)});w.M.Body.setVelocity(item.body,{x:n.x*13,y:n.y*13});this.kickCount++;}
 }
}

