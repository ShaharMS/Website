const design='porcelain',black='#171717';
function line(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
export function paintSpotlights(c,w){
 const s=w.shelf,f=w.frame,cx=f.left+s.left+s.width/2,base=f.top+(w.width<=700?66:0),target=f.top+s.y-3;
 c.save();c.strokeStyle=black;c.lineWidth=2.5;c.lineCap='round';c.lineJoin='round';
 const twin=design==='coral'||design==='ink',positions=twin?[cx-s.width*.29,cx+s.width*.29]:[cx];
 for(const x of positions){const y=base+25,r=design==='club'?18:design==='porcelain'?24:17;
  c.fillStyle=w.exhibit.occupantId?'rgba(255,227,147,.24)':'rgba(255,227,147,.12)';c.beginPath();c.moveTo(x-r*.65,y+9);c.lineTo(cx-s.width*.46,target);c.quadraticCurveTo(cx,target+9,cx+s.width*.46,target);c.lineTo(x+r*.65,y+9);c.closePath();c.fill();
  line(c,[[x,base],[x,y-12]]);c.fillStyle=design==='club'?'#e6ba71':design==='ink'?'#fffdf3':design==='porcelain'?'#f8dc66':'#fff5dd';
  c.beginPath();if(design==='club'){c.moveTo(x-9,y-11);c.quadraticCurveTo(x+17,y-17,x+23,y+7);c.lineTo(x-22,y+7);c.quadraticCurveTo(x-19,y-3,x-9,y-11);}
  else {c.moveTo(x-r,y+6);c.bezierCurveTo(x-r,y-18,x+r,y-18,x+r,y+6);}
  c.closePath();c.fill();c.stroke();c.fillStyle='#fff4c2';c.beginPath();c.ellipse(x,y+6,r,4,0,0,Math.PI*2);c.fill();c.stroke();
 }
 c.restore();
}
export function paintShelf(c,w){
 const s=w.shelf,f=w.frame,x=f.left+s.left,y=f.top+s.y,color=design==='club'?'#d4aa76':design==='ink'?'#fffdf3':design==='porcelain'?'#e99987':'#b7ccdf';
 c.save();c.strokeStyle=black;c.lineWidth=2.6;c.lineJoin='round';c.fillStyle=color;
 // A plain ledge with soft ends; every visible raised/folded end has the same solid body.
 c.beginPath();c.roundRect(x,y,s.width,10,4);c.fill();c.stroke();
 for(const side of ['left','right']){const hinge={x:x+(side==='left'?3:s.width-3),y:y+5},open=w.gateOpen[side];c.save();c.translate(hinge.x,hinge.y);c.rotate(open?(side==='left'?-Math.PI/2:Math.PI/2):0);c.fillStyle=color;c.beginPath();c.roundRect(-3,-24,6,24,3);c.fill();c.stroke();c.restore();}
 if(design==='club'){c.strokeStyle='#9b754c';c.lineWidth=1.4;line(c,[[x+17,y+6],[x+s.width*.58,y+6]]);line(c,[[x+s.width*.7,y+5],[x+s.width-12,y+5]]);}
 if(design==='ink'){c.strokeStyle='#9db5a7';c.lineWidth=1.5;line(c,[[x+9,y+7],[x+s.width-9,y+7]]);}
 c.restore();
}
export function paintRescue(c,w,images){
 const h=w.rescue;if(!h.visible)return;const image=images.get(h.grip>.45?'glove-grab':'glove-open');if(!image)return;
 c.save();c.translate(h.tip.x,h.tip.y);c.rotate(h.angle);const scale=h.scale,len=Math.hypot(h.tip.x-h.start.x,h.tip.y-h.start.y),r=w.width<700?9:12;
 c.lineJoin='round';c.lineCap='round';c.strokeStyle=black;c.lineWidth=4;c.fillStyle='#edc4a5';c.beginPath();c.moveTo(-len,-r);c.lineTo(-39*scale,-r);c.lineTo(-39*scale,r);c.lineTo(-len,r);c.closePath();c.fill();c.stroke();
 // The handle sits behind the closed fingers; one complete pose is drawn over it.
 if(h.grip>.45){c.fillStyle='#f1c75b';c.strokeStyle=black;c.lineWidth=3;c.beginPath();c.ellipse(40*scale,10*scale,10*scale,19*scale,0,0,Math.PI*2);c.fill();c.stroke();}
 c.drawImage(image,-65*scale,-65*scale,130*scale,130*scale);c.restore();
}
