/* Continuous one-way loop. Only the original feature group is source/editable text. */
(() => {
    const section = document.getElementById('section-6');
    const ticker = section?.querySelector('.feature-marquee');
    if (!ticker) return;
    const track = ticker.querySelector('.marquee-track');
    const group = track.firstElementChild;
    const prints = section.querySelector('.prints');
    const fitPrints = () => prints.style.setProperty('--print-area-height', prints.clientHeight + 'px');
    new ResizeObserver(fitPrints).observe(prints);
    fitPrints();
    if (window.__localTextEditor) {
        ticker.classList.add('is-editing');
        return;
    }
    function fitMarquee() {
        const distance = group.getBoundingClientRect().width;
        if (!distance) return;
        const copies = Math.ceil(ticker.clientWidth / distance) + 2;
        while (track.children.length < copies) {
            const clone = group.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            clone.inert = true;
            track.append(clone);
        }
        while (track.children.length > copies) track.lastElementChild.remove();
        track.style.setProperty('--marquee-distance', distance + 'px');
        track.style.setProperty('--marquee-duration', distance / 55 + 's');
        track.classList.add('running');
    }
    (document.fonts?.ready || Promise.resolve()).then(() => {
        fitMarquee();
        const observer = new ResizeObserver(fitMarquee);
        observer.observe(ticker);
        observer.observe(group);
    });
})();
