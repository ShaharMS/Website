(() => {
    if (!['localhost','127.0.0.1'].includes(location.hostname) || !window.__localEditSession) return;
    const states = new WeakMap(), dirty = new Set();
    let pending = Promise.resolve(), timer, error = '';
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#111c;color:white;padding:6px 10px;font:12px/1.5 monospace;border-radius:6px;max-width:420px;pointer-events:none';
    badge.setAttribute('role', 'status');
    document.body.append(badge);
    const status = text => {badge.textContent = text || 'Website editable';};
    status();
    const style = document.createElement('style');
    style.textContent = '[data-local-edit],[data-local-copy],[data-local-edit] *:not(img),[data-local-copy] *:not(img){cursor:text!important} [data-local-edit]:focus,[data-local-copy]:focus{outline:none!important} .cloud:focus-within{opacity:1;z-index:1} .cloud:focus-within>*{opacity:1}';
    document.head.append(style);
    const getCopy = key => {const [group,index] = key.split('.'); return window.websiteCopy[group][index];};
    function cleanHTML(state) {
        const copy = state.el.cloneNode(true);
        let html = copy.innerHTML;
        if (state.key && getCopy(state.key).includes('{years}')) {
            const years = new Date(new Date() - new Date(2021, 2, 15)).getFullYear() - 1970;
            html = html.replace(String(years), '{years}');
        }
        return html;
    }
    function save() {
        clearTimeout(timer);
        pending = pending.then(async () => {
            for (const state of [...dirty]) {
                const html = state.html;
                if (html === state.saved) {dirty.delete(state); continue;}
                try {
                    const response = await fetch('/__edit/save', {method:'POST', headers:{'Content-Type':'application/json'},
                        body:JSON.stringify({session:window.__localEditSession, id:state.id, key:state.key, html})});
                    if (!response.ok) throw new Error(await response.text());
                    state.saved = html;
                    if (state.key) {const [group,index] = state.key.split('.'); window.websiteCopy[group][index] = html;}
                    if (state.html === html) dirty.delete(state);
                    error = ''; status();
                } catch (e) {error = e.message; status('Not saved: ' + error); return;}
            }
        });
        return pending;
    }
    function bind(el, key) {
        if (!el) return;
        const existing = states.get(el);
        if (existing && existing.key === key) return;
        const state = {el, key, id: key ? undefined : Number(el.dataset.localEdit)};
        state.saved = state.html = cleanHTML(state);
        states.set(el, state);
        if (key) el.dataset.localCopy = key;
        el.contentEditable = 'true';
        if (existing) return;
        el.addEventListener('paste', event => {
            event.preventDefault();
            document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
        });
        el.addEventListener('beforeinput', event => {
            if (event.inputType.startsWith('format') || ['insertOrderedList','insertUnorderedList','insertLink'].includes(event.inputType)) event.preventDefault();
        });
        el.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault(); document.execCommand('insertLineBreak');
            }
        });
        el.addEventListener('input', () => {
            const state = states.get(el);
            state.html = cleanHTML(state);
            dirty.add(state);
            if (el.classList.contains('highlight')) el.dataset.fullText = el.innerText;
            window.dispatchEvent(new Event('resize'));
            clearTimeout(timer); timer = setTimeout(save, 450);
        });
        el.addEventListener('blur', save);
    }
    document.querySelectorAll('[data-local-edit]').forEach(el => bind(el));
    const waiting = window.__localTextEditor.pending;
    window.__localTextEditor.bind = bind;
    for (const [el,key] of waiting) bind(el,key);
    delete window.__localTextEditor.pending;
    document.addEventListener('click', event => {
        if (event.target.closest('[data-local-edit],[data-local-copy]')) {event.preventDefault(); event.stopImmediatePropagation();}
    }, true);
    document.addEventListener('keydown', async event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {event.preventDefault(); save();}
        if (event.key === 'Escape') {
            await save();
            if (!dirty.size && !error) {const url = new URL(location.href); url.searchParams.delete('edit'); url.searchParams.set('preview', ''); location.href = url;}
        }
    });
    window.addEventListener('beforeunload', event => {if (dirty.size) {event.preventDefault(); event.returnValue = '';}});
})();
