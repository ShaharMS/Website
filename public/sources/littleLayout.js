// Fit against the finished copy, including while the typewriter is still running.
(() => {
    const section = document.getElementById('section-4');
    const container = section.querySelector(':scope > .container');
    const copy = container.querySelector('.content');
    const highlight = copy.querySelector('.highlight');
    let pending = false;

    function fit() {
        pending = false;
        const available = container.clientHeight;
        if (!available) return;
        const probe = copy.cloneNode(true);
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;width:${copy.getBoundingClientRect().width}px;max-width:none;height:auto;min-height:0;font-size:16px;`;
        const fullHighlight = probe.querySelector('.highlight');
        fullHighlight.style.minHeight = '0';
        fullHighlight.textContent = (highlight.dataset.fullText || highlight.innerText) + ' |';
        container.append(probe);

        let low = 10, high = 16;
        for (let i = 0; i < 9; i++) {
            const size = (low + high) / 2;
            probe.style.fontSize = size + 'px';
            if (probe.getBoundingClientRect().height <= available - 2) low = size;
            else high = size;
        }
        // Preserve the original 16px size whenever the complete copy already fits.
        probe.style.fontSize = '16px';
        const size = probe.getBoundingClientRect().height <= available - 2 ? 16 : Math.floor(low * 100) / 100;
        probe.style.fontSize = size + 'px';
        section.style.setProperty('--little-copy-size', size + 'px');
        highlight.style.minHeight = Math.ceil(fullHighlight.getBoundingClientRect().height) + 'px';
        probe.remove();
    }
    function schedule() {
        if (!pending) { pending = true; requestAnimationFrame(fit); }
    }
    new ResizeObserver(schedule).observe(container);
    if (document.fonts) {
        document.fonts.ready.then(schedule);
        document.fonts.addEventListener('loadingdone', schedule);
    }
    schedule();
})();
