// Share viewport/visibility state so hidden scenes do no animation work.
window.sceneMotion = (() => {
    const records = new Map();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function notify(record) {
        const active = record.visible && !document.hidden;
        record.listeners.forEach(listener => listener(active, reduced.matches));
        record.element.classList.toggle('scene-paused', !active || reduced.matches);
        record.element.querySelectorAll('svg').forEach(svg => {
            if (typeof svg.pauseAnimations === 'function') {
                if (active && !reduced.matches) svg.unpauseAnimations();
                else svg.pauseAnimations();
            }
        });
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const record = records.get(entry.target);
            record.visible = entry.isIntersecting;
            notify(record);
        });
    });
    function watch(element, listener) {
        let record = records.get(element);
        if (!record) {
            record = {element, visible: false, listeners: new Set()};
            records.set(element, record);
            observer.observe(element);
        }
        record.listeners.add(listener);
        notify(record);
    }
    function animate(element, draw) {
        let frame = 0, previous = 0;
        watch(element, (active, reduce) => {
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
            if (!active) return;
            if (reduce) { draw(performance.now(), 0); return; }
            function tick(now) {
                const elapsed = previous ? Math.min(now - previous, 50) : 1000 / 60;
                previous = now;
                draw(now, elapsed);
                frame = requestAnimationFrame(tick);
            }
            frame = requestAnimationFrame(tick);
        });
    }
    document.addEventListener('visibilitychange', () => records.forEach(notify));
    reduced.addEventListener('change', () => records.forEach(notify));
    return {watch, animate};
})();
document.querySelectorAll('section.section').forEach(section => window.sceneMotion.watch(section, () => {}));
