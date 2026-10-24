importScripts('./runtime.js');
self.onmessage=event=>{
 const started=performance.now();
 try{const result=self.BrowserVision.run(event.data);result.elapsed=performance.now()-started;self.postMessage(result,[result.buffer]);}
 catch(error){self.postMessage({error:String(error.message||error),elapsed:performance.now()-started});}
};
