export const TECHNOLOGY_COPY={
 c:'A compiled systems language with direct control over memory and hardware. Commonly used for operating systems, embedded software, libraries, and native interfaces.',
 kotlin:'A typed language created by JetBrains. It works with Java on the JVM and also supports shared code across platforms through Kotlin Multiplatform.',
 mongodb:'A document database that stores flexible, JSON-like records in BSON. Applications can query, index, and aggregate those documents without a fixed table layout.',
 haxeui:'A cross-platform UI toolkit for Haxe. It provides reusable interface components, layouts, styling, and multiple rendering backends.',
 wpf:'Windows Presentation Foundation is a .NET framework for Windows desktop interfaces. XAML, data binding, layout, and vector graphics help build rich applications.',
 flash:'Adobe Flash combined vector graphics, animation, audio, and ActionScript for interactive media and games. Its display-list model influenced frameworks such as OpenFL.',

 rust:'A systems language that combines native performance with memory safety, checked by the compiler. Its ownership model makes resource lifetimes explicit.',
 java:'A general-purpose language that runs on the Java Virtual Machine. Its libraries and tooling are used for servers, applications, and game plugins.',
 csharp:'A typed, general-purpose language in the .NET ecosystem. It is used for desktop applications, web services, tools, and games.',
 haxe:'A typed language and cross-compiler. One Haxe codebase can target platforms such as JavaScript, C++, Java, and C#, with platform-specific escape hatches.',
 python:'A general-purpose language with a readable syntax and a large library ecosystem. A useful companion for automation, experiments, data work, and tooling.',
 javascript:'The programming language of the web. It powers browser interactions and also runs outside the browser through runtimes such as Node.js.',
 typescript:'JavaScript with a static type system. The types help catch mistakes and describe interfaces; the output still runs as ordinary JavaScript.',
 html:'The structural language of web pages. Elements describe the meaning of content, from headings and links to forms, images, and interactive controls.',
 css:'The language that styles and lays out the web. It controls typography, color, responsive layouts, animation, and how a page adapts to different screens.',
 react:'A library for building interfaces from components. State and data determine what appears on screen, while components keep pieces of an interface reusable.',
 node:'A runtime for JavaScript outside the browser. It is widely used for servers, command-line tools, build systems, and network applications.',
 dotnet:'A development platform with a managed runtime, standard libraries, and tooling. Languages such as C# use it to build applications across platforms.',
 vite:'A frontend development server and build tool. It gives web projects a fast feedback loop during development and packages their assets for release.',
 sqlite:'An embedded SQL database that lives in a regular file. Applications can store and query structured data without running a separate database server.',
 tailwind:'A utility-first CSS framework. Small styling classes compose directly in markup to build custom layouts and visual systems.',
 flixel:'A 2D game framework built with Haxe and OpenFL. It provides practical game-building pieces such as sprites, animation, collision, input, and tilemaps.',
 avalonia:'A cross-platform UI framework for .NET. Interfaces are described with XAML and code, and can share a common application across desktop platforms.',
 lime:'A foundational layer for Haxe applications. It supplies platform access for windows, input, audio, graphics contexts, and other native capabilities.',
 openfl:'A Haxe framework for cross-platform graphics and applications. Its Flash-style APIs cover drawing, display objects, audio, input, and assets.',
 openshift:'An application platform built around Kubernetes. It brings together tools for deploying, operating, and managing containerized applications.'
};
export class ShelfExhibit{
 constructor(world){
  this.world=world;this.M=world.M;this.width=world.width<=700?Math.min(225,world.width*.55):Math.min(360,world.width*.29);this.height=Math.min(380,world.height*.51);
  this.offAngle=-1.65;this.angle=this.offAngle;this.state='hidden';this.shownId=null;this.occupantId=null;this.candidateId=null;this.candidateAge=0;this.phase=0;this.waitLeft=0;this.linearVelocity={x:0,y:0};this.angularVelocity=0;this.events=[];this.kickCount=0;this.awaitingLanding=false;this.landingDeadline=0;
  this.body=this.M.Bodies.rectangle(0,0,this.width,this.height,{isStatic:true,friction:.28,restitution:.12,label:'technology-exhibit',collisionFilter:{category:2,mask:0}});
  this.M.Composite.add(world.engine.world,this.body);this.pose(this.offAngle,0);
 }
 pose(angle,dt){
  const f=this.world.frame,pivot={x:f.left+this.world.width+42,y:f.top+this.world.height*.30},offset={x:-(this.width/2+58),y:this.world.height*.16+this.height/2};
  const rot=this.M.Vector.rotate(offset,angle),position={x:pivot.x+rot.x,y:pivot.y+rot.y},old={...this.body.position},oldAngle=this.angle;
  this.M.Body.setPosition(this.body,position);this.M.Body.setAngle(this.body,angle);this.angle=angle;
  const unit=dt/(1000/60);this.linearVelocity=unit?{x:(position.x-old.x)/unit,y:(position.y-old.y)/unit}:{x:0,y:0};this.angularVelocity=unit?(angle-oldAngle)/unit:0;
 }
 transition(state){this.state=state;this.phase=0;this.events.push({state,id:this.shownId,time:this.world.time});if(this.events.length>60)this.events.shift();}
 onShelf(item,retained=false,dragged=false){
  const s=this.world.shelf,f=this.world.frame,b=this.M.Bounds.create(item.body.vertices),x=item.body.position.x-f.left,y=item.body.position.y-f.top;
  const arriving=retained&&this.awaitingLanding&&this.world.time<this.landingDeadline;
  return x>=s.left+(retained?-12:8)&&x<=s.left+s.width+(retained?12:-8)&&b.min.y<f.top+s.y+6&&b.max.y>=f.top+s.y-(dragged||arriving?item.size*1.15:retained?26:18)&&y>=s.y-item.size*1.85&&y<=s.y+12;
 }
 detect(dt){
  const w=this.world,current=w.sprites.find(x=>x.meta.id===this.occupantId),dragged=w.sprites.find(x=>x.meta.id===w.draggedId);
  if(current&&this.M.Bounds.create(current.body.vertices).max.y>=w.frame.top+w.shelf.y-20)this.awaitingLanding=false;
  let candidate=dragged&&this.onShelf(dragged,dragged.meta.id===this.occupantId,!!this.occupantId&&dragged.meta.id!==this.occupantId)?dragged:current&&this.onShelf(current,true)?current:null;
  if(!candidate)candidate=w.sprites.filter(x=>this.onShelf(x)).sort((a,b)=>Math.abs(a.body.position.x-w.frame.left-w.shelf.left-w.shelf.width/2)-Math.abs(b.body.position.x-w.frame.left-w.shelf.left-w.shelf.width/2))[0];
  const id=candidate?.meta.id||null;
  if(id!==this.candidateId){this.candidateId=id;this.candidateAge=0;}else this.candidateAge+=dt/1000;
  if(this.candidateAge>=.075&&id!==this.occupantId){
   if(id&&current&&current!==candidate&&this.onShelf(current,true)){const direction=candidate.body.position.x<current.body.position.x?1:-1;w.gates[direction>0?'right':'left']=w.time+.42;this.M.Body.setVelocity(current.body,{x:direction*10.5,y:.5});this.M.Body.setAngularVelocity(current.body,0);}
   this.occupantId=id;this.awaitingLanding=!!candidate&&this.M.Bounds.create(candidate.body.vertices).max.y<w.frame.top+w.shelf.y-20;this.landingDeadline=w.time+.8;
  }
 }
 step(dt){
  this.detect(dt);const desired=this.occupantId,seconds=dt/1000;
  if(this.state==='hidden'&&desired){this.shownId=desired;this.body.collisionFilter.mask=1;this.transition('entering');}
  if((this.state==='entering'||this.state==='open')&&desired!==this.shownId){this.exitFrom=this.angle;this.transition('exiting');}
  this.phase+=seconds;let angle=this.angle;
  if(this.state==='entering'){
   const t=Math.min(1,this.phase/.34),s=1.45,e=1+(s+1)*(t-1)**3+s*(t-1)**2;angle=this.offAngle+(this.offAngle*-1+.025)*e;
   if(t===1){this.openedAt=this.world.time;this.transition('open');angle=.025;}
  }else if(this.state==='open'){const t=this.world.time-this.openedAt;angle=.025+Math.sin(t*12)*.045*Math.exp(-t*5);}
  else if(this.state==='exiting'){
   const t=Math.min(1,this.phase/.22);angle=this.exitFrom+(this.offAngle-this.exitFrom)*t*t;
   if(t===1){angle=this.offAngle;this.shownId=null;this.body.collisionFilter.mask=0;this.waitLeft=.15;this.transition(desired?'waiting':'hidden');}
  }else if(this.state==='waiting'){
   angle=this.offAngle;if(!desired)this.transition('hidden');else{this.waitLeft-=seconds;if(this.waitLeft<=0){this.shownId=desired;this.body.collisionFilter.mask=1;this.transition('entering');}}
  }
  this.pose(angle,dt);
  if(this.body.collisionFilter.mask&&Math.abs(this.angularVelocity)>.008){
   for(const item of this.world.sprites){
    const collision=this.M.Collision.collides(this.body,item.body);if(!collision)continue;this.kickCount++;
    let n={...collision.normal},d=this.M.Vector.sub(item.body.position,this.body.position);if(n.x*d.x+n.y*d.y<0)n=this.M.Vector.mult(n,-1);
    this.M.Body.translate(item.body,{x:n.x*(collision.depth+.35),y:n.y*(collision.depth+.35)});
    const local=this.M.Vector.sub(item.body.position,this.body.position),v={x:this.linearVelocity.x-this.angularVelocity*local.y,y:this.linearVelocity.y+this.angularVelocity*local.x};
    const speed=Math.min(20,Math.max(5,Math.abs(v.x*n.x+v.y*n.y)*.7));this.M.Body.setVelocity(item.body,{x:item.body.velocity.x*.3+n.x*speed+v.x*.08,y:item.body.velocity.y*.3+n.y*speed+v.y*.08});this.M.Body.setAngularVelocity(item.body,item.body.angularVelocity+this.angularVelocity*.3);
   }
  }
 }
 get visible(){return this.state==='entering'||this.state==='open'||this.state==='exiting';}
}

