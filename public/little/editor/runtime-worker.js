// A fresh worker per run gives Stop and timeout a hard cancellation boundary.
importScripts('./runtime.js?v=2');
self.onmessage = event => {
    const {code, keywords} = event.data;
    self.postMessage(self.little.runEditor(String(code), keywords));
};
