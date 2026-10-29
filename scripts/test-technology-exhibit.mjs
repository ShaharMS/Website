import fs from 'node:fs';import {createRequire} from 'node:module';import {PoolWorld} from '../public/sources/technology-pool/pool-core.mjs';
const M=createRequire(import.meta.url)('../public/vendor/4047a043ad8e-matter.min.js'),data=JSON.parse(fs.readFileSync(new URL('../public/images/technologies/physics-data.json',import.meta.url),'utf8'));
function assert(value,message){if(!value)throw Error(message);}
const results=[];
for(const [W,H] of [[1250,700],[390,650]]){
 const w=new PoolWorld(M,data,W,H),p=w.exhibit,s=w.shelf;let probeDisarmed=false;
 // State-machine fixture: keep unrelated logos out of the swing path; the chamber test covers all 26 dynamic bodies.
 for(const item of w.sprites)if(!['rust','javascript','python','c'].includes(item.meta.id)){M.Body.setStatic(item.body,true);item.body.collisionFilter.mask=0;M.Body.setPosition(item.body,{x:W*.15,y:H*.8});}
 for(const [i,id] of ['javascript','python'].entries())M.Body.setPosition(w.sprites.find(x=>x.meta.id===id).body,{x:W*.13+i*80,y:H*.75});
 function place(id,lift=0){const item=w.sprites.find(x=>x.meta.id===id);M.Body.setAngle(item.body,0);M.Body.setPosition(item.body,{x:s.left+s.width/2,y:0});const b=M.Bounds.create(item.body.vertices);M.Body.translate(item.body,{x:0,y:s.y-.6-b.max.y-lift});M.Body.setVelocity(item.body,{x:0,y:0});M.Body.setAngularVelocity(item.body,0);return item;}
 function step(seconds){for(let i=0;i<Math.round(seconds*120);i++){w.step(1000/120);if(p.kickCount>0&&!probeDisarmed){probeDisarmed=true;const probe=w.sprites.find(x=>x.meta.id==='c').body;M.Body.setStatic(probe,true);probe.collisionFilter.mask=0;M.Body.setPosition(probe,{x:W*.15,y:H*.85});}}}
 const obstacle=w.sprites.find(x=>x.meta.id==='c');M.Body.setPosition(obstacle.body,{x:W-p.width/2-20,y:H*.60});M.Body.setVelocity(obstacle.body,{x:0,y:0});
 place('rust');step(.75);assert(p.state==='open'&&p.shownId==='rust','Shelf must open the Rust card: '+JSON.stringify({W,state:p.state,occupant:p.occupantId,shown:p.shownId}));
 const displaced=w.panelDisplacement;assert(displaced>0,'Card must displace water');
 // Isolate the state-machine cases from unrelated logos thrown onto the shelf.
 // The separate chamber regression keeps all 26 bodies dynamic throughout.
 for(const item of w.sprites)if(!['rust','javascript','python'].includes(item.meta.id)){M.Body.setStatic(item.body,true);item.body.collisionFilter.mask=0;M.Body.setPosition(item.body,{x:W*.8,y:H*.85});}
 const rust=w.sprites.find(x=>x.meta.id==='rust');M.Body.setPosition(rust.body,{x:s.left+s.width+180,y:s.y+90});step(.5);assert(p.state==='hidden'&&!p.shownId,'Removing a logo must retract the card: '+JSON.stringify({W,state:p.state,occupant:p.occupantId,shown:p.shownId,events:p.events}));
 place('javascript');step(.7);assert(p.state==='open'&&p.shownId==='javascript','Second selection should open');
 const js=w.sprites.find(x=>x.meta.id==='javascript'),jsHeight=js.body.bounds.max.y-js.body.bounds.min.y;
 const incoming=place('python',Math.min(50,jsHeight*.7));w.draggedId='python';const hand=M.Constraint.create({pointA:{...incoming.body.position},bodyB:incoming.body,pointB:{x:0,y:0},stiffness:.16,damping:.12,length:0});M.Composite.add(w.engine.world,hand);step(.32);M.Composite.remove(w.engine.world,hand);w.draggedId=null;step(.65);
 assert(p.state==='open'&&p.shownId==='python','Replacement must show new contents: '+JSON.stringify({W,state:p.state,occupant:p.occupantId,shown:p.shownId}));
 const waitEvent=p.events.findLast(x=>x.state==='waiting'),enterAfter=waitEvent&&p.events.find(x=>x.state==='entering'&&x.time>waitEvent.time);
 assert(waitEvent&&enterAfter,'Replacement must retract and wait');const delay=enterAfter.time-waitEvent.time;assert(delay>=.14&&delay<=.18,'Replacement pause should be 0.15 seconds');
 assert(p.kickCount>0,'The moving card must physically hit logos');assert(w.sprites.length===26,'No technologies may be lost');
 results.push({viewport:[W,H],openAndRemove:'passed',replacement:'JavaScript to Python',pauseSeconds:delay,collisionsDuringSwing:p.kickCount,waterDisplacementPixels:displaced,retained:w.sprites.length});w.destroy();
}
console.log(JSON.stringify(results));
