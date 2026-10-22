(() => {
    function setup() {
        const explorer = document.getElementById('explorer');
        if (!explorer) return;
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn docs-explorer-toggle';
        toggle.setAttribute('aria-controls', 'explorer');
        function setOpen(open) {
            explorer.classList.toggle('docs-nav-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? 'Hide navigation' : 'Browse navigation';
        }
        toggle.addEventListener('click', () => setOpen(!explorer.classList.contains('docs-nav-open')));
        explorer.before(toggle);
        const search = document.getElementById('search');
        if (search) search.addEventListener('input', () => setOpen(Boolean(search.value.trim())));
        setOpen(false);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
})();
