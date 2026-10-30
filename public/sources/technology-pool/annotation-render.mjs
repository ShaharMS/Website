const notes=[...document.querySelectorAll('.pool-annotation')],measure=document.createElement('canvas').getContext('2d');
const arrowPaths=new WeakMap();
function arrow(node,path){
 const d=path.getAttribute('d'),start=node.hasAttribute('marker-start'),cached=arrowPaths.get(node);
 if(cached&&cached.d===d&&cached.start===start)return cached;
 const len=path.getTotalLength(),a=path.getPointAtLength(start?0:len),b=path.getPointAtLength(start?1:len-1);
 const result={d,start,path:new Path2D(d),x:a.x,y:a.y,angle:Math.atan2(a.y-b.y,a.x-b.x)};arrowPaths.set(node,result);return result;
}
function geometry(svg){const r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal,scale=Math.min(r.width/v.width,r.height/v.height);return {r,v,scale,ox:r.left+(r.width-v.width*scale)/2,oy:r.top+(r.height-v.height*scale)/2};}
export function paintAnnotations(c){
 for(const svg of notes){if(getComputedStyle(svg).display==='none')continue;const {r,scale,ox,oy}=geometry(svg);if(!r.width||!r.height)continue;
  c.save();c.translate(ox,oy);c.scale(scale,scale);c.strokeStyle='#171717';c.globalAlpha=.82;c.lineWidth=1.8;c.lineCap='round';c.lineJoin='round';
  const use=svg.querySelector('use'),writing=svg.querySelector(use.getAttribute('href')),other=svg.querySelector(':scope>path');
  for(const [node,path] of [[use,writing],[other,other]]){if(!path)continue;const shape=arrow(node,path);c.stroke(shape.path);c.save();c.translate(shape.x,shape.y);c.rotate(shape.angle);c.beginPath();c.moveTo(-8,-4);c.lineTo(0,0);c.lineTo(-8,4);c.stroke();c.restore();}
  c.restore();
 }
}
export function layoutAnnotationCopy(){
 for(const svg of notes){if(getComputedStyle(svg).display==='none')continue;const el=document.getElementById(svg.dataset.copy);if(!el||el.dataset.editing==='true')continue;
  const text=el.dataset.copyText??el.textContent;el.dataset.copyText=text;const {scale,ox,oy}=geometry(svg),tub=svg.closest('.pool-tub').getBoundingClientRect(),path=svg.querySelector('defs path'),len=path.getTotalLength(),style=getComputedStyle(el);measure.font=`500 ${parseFloat(style.fontSize)/scale}px Montserrat,sans-serif`;let cursor=len*(svg.classList.contains('water-note-wide')?.09:svg.classList.contains('water-note-small')?.05:.08);
  el.style.left='0px';el.style.top='0px';el.replaceChildren();
  for(const char of text){const advance=measure.measureText(char).width,p=path.getPointAtLength(cursor+advance/2),q=path.getPointAtLength(Math.min(len,cursor+advance/2+1)),angle=Math.atan2(q.y-p.y,q.x-p.x),span=document.createElement('span');span.textContent=char;span.style.left=(ox-tub.left+(p.x+Math.sin(angle)*8)*scale)+'px';span.style.top=(oy-tub.top+(p.y-Math.cos(angle)*8)*scale)+'px';span.style.transform=`translate(-50%,-85%) rotate(${angle}rad)`;el.append(span);cursor+=advance;}
 }
}
for(const el of document.querySelectorAll('.pool-annotation-copy')){
 el.addEventListener('focus',()=>{if(!el.isContentEditable)return;const ranges=[...el.children].map(x=>x.getBoundingClientRect()),tub=el.closest('.pool-tub').getBoundingClientRect(),x=ranges.length?Math.min(...ranges.map(r=>r.left)):0,y=ranges.length?Math.min(...ranges.map(r=>r.top)):0;el.dataset.editing='true';el.textContent=el.dataset.copyText||el.textContent;el.style.left=x-tub.left+'px';el.style.top=y-tub.top+'px';});
 el.addEventListener('input',()=>{el.dataset.copyText=el.textContent;});
 el.addEventListener('blur',()=>{delete el.dataset.editing;el.dataset.copyText=el.textContent;layoutAnnotationCopy();});
}
window.addEventListener('resize',layoutAnnotationCopy);
