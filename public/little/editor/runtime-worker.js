// Fresh interpreter per run; Stop and timeout terminate this worker.
let loadedProfile;
self.onmessage = event => {
    const {code, keywords, profile='functional'} = event.data;
    if(!loadedProfile) {
        importScripts(profile==='functional' ? './functional/runtime.js' : './runtime.js');
        loadedProfile=profile;
    }
    self.postMessage(profile==='functional' ? self.LittleBrowser.run(String(code),keywords) : self.little.runEditor(String(code), keywords));
};
