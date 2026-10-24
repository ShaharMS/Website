// A fresh worker per run gives Stop and timeout a hard cancellation boundary.
importScripts('./runtime.js?v=1');
self.onmessage = event => self.postMessage(self.little.runEditor(String(event.data)));
