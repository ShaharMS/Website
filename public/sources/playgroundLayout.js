(() => {
    for (const box of document.querySelectorAll('#code-row .collapsible')) {
        const pane = document.createElement('div');
        pane.className = 'editor-pane';
        pane.dataset.field = box.id;
        box.before(pane);
        pane.append(box);
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'pane-toggle';
        toggle.setAttribute('aria-controls', box.id);
        const label = box.title || box.id;
        let collapsed = false;
        function render() {
            box.classList.toggle('collapsed', collapsed);
            pane.classList.toggle('is-collapsed', collapsed);
            toggle.setAttribute('aria-expanded', String(!collapsed));
            toggle.textContent = (collapsed ? 'Expand ' : 'Collapse ') + label;
        }
        toggle.addEventListener('click', () => { collapsed = !collapsed; render(); });
        pane.append(toggle);
        render();
    }
})();
