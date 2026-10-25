/* Continuous one-way loop. Only the original feature group is source/editable text. */
(() => {
    const section = document.getElementById('section-6');
    const ticker = section?.querySelector('.feature-marquee');
    if (!ticker) return;
    const track = ticker.querySelector('.marquee-track');
    const group = track.firstElementChild;
    const prints = section.querySelector('.prints');
    const fitPrints = () => {
        prints.style.setProperty('--print-area-height', prints.clientHeight + 'px');
        // Keep the spread and its small hover expansion clear of the copy/links.
        prints.querySelectorAll('.print').forEach(print => {
            if (!print.offsetWidth) return;
            const rect = print.getBoundingClientRect();
            const extraX = Math.max(0, rect.width - print.offsetWidth) / 2;
            const extraY = Math.max(0, rect.height - print.offsetHeight) / 2;
            const hoverRoom = Math.max(rect.width, rect.height) * .03 + 4;
            print.style.setProperty('--print-max-left', Math.max(0, prints.clientWidth - print.offsetWidth - extraX - hoverRoom) + 'px');
            print.style.setProperty('--print-max-top', Math.max(0, prints.clientHeight - print.offsetHeight - extraY - hoverRoom) + 'px');
        });
    };
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
