// Use the fixtures' actual section-local bounds for both their rotation and beams.
// The beam grows with the requested larger fixture; colors and opacity stay unchanged.
(() => {
    const section = document.getElementById('section-6');
    const overlay = section.querySelector('canvas.overlay');
    const context = overlay.getContext('2d');
    const fixtures = [...section.querySelectorAll('.searchlight')];
    let width = 0, height = 0, pointer = null, pending = false;

    function draw() {
        pending = false;
        const bounds = section.getBoundingClientRect();
        const visibleTop = Math.max(0, -bounds.top) + section.scrollTop;
        const visibleBottom = Math.min(height, innerHeight - bounds.top + section.scrollTop);
        const restingY = visibleBottom > visibleTop ? (visibleTop + visibleBottom) / 2 : height / 2;
        const x = pointer ? Math.max(0, Math.min(width, pointer.x - bounds.left)) : width / 2;
        const y = pointer ? Math.max(0, Math.min(height, pointer.y - bounds.top + section.scrollTop)) : restingY;
        // A reading-sized light pool, rather than a small cursor-sized cutout.
        const textSize = parseFloat(getComputedStyle(section.querySelector('.highlight')).fontSize);
        const headingSize = parseFloat(getComputedStyle(section.querySelector('h1')).fontSize);
        const radius = Math.max(textSize * 12, headingSize * 2.75, Math.min(width, innerHeight) * .32);
        context.globalCompositeOperation = 'source-over';
        context.clearRect(0, 0, width, height);
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, width, height);
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = '#fff';

        fixtures.forEach(fixture => {
            const centerX = fixture.offsetLeft + fixture.offsetWidth / 2;
            const centerY = fixture.offsetTop + fixture.offsetHeight / 2;
            // Keep the lamps aimed into the room, never backwards into their mounts.
            const targetY = Math.max(centerY + fixture.offsetHeight + 24, y);
            const angle = Math.atan2(targetY - centerY, x - centerX);
            // Both fixture shapes point down before rotation, including the mirrored one.
            fixture.style.rotate = (angle - Math.PI / 2) + 'rad';
            const dx = Math.cos(angle), dy = Math.sin(angle);
            const sideX = -dy, sideY = dx;
            const lensX = centerX + dx * fixture.offsetHeight / 2;
            const lensY = centerY + dy * fixture.offsetHeight / 2;
            const halfLens = fixture.clientWidth / 2;
            const distance = Math.hypot(x - lensX, targetY - lensY);
            const spread = Math.min(.48, Math.atan2(radius, Math.max(1, distance)));
            const reach = Math.hypot(width, height) * 1.5;
            // A lamp emits a widening cone from its lens, continuing past the
            // pointer instead of ending in an unrelated circular cursor hole.
            for (let edge = 0; edge < 5; edge++) {
                const halfAngle = spread * (1 - edge * .045);
                context.globalAlpha = edge === 4 ? 1 : .22;
                context.beginPath();
                context.moveTo(lensX + sideX * halfLens, lensY + sideY * halfLens);
                context.lineTo(lensX + Math.cos(angle + halfAngle) * reach,
                    lensY + Math.sin(angle + halfAngle) * reach);
                context.lineTo(lensX + Math.cos(angle - halfAngle) * reach,
                    lensY + Math.sin(angle - halfAngle) * reach);
                context.lineTo(lensX - sideX * halfLens, lensY - sideY * halfLens);
                context.closePath();
                context.fill();
            }
        });
        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
    }
    function schedule() {
        if (!pending) { pending = true; requestAnimationFrame(draw); }
    }
    function resize() {
        width = section.clientWidth;
        // Exclude the previous canvas size from the scrollable content measurement.
        overlay.style.height = '0px';
        height = Math.max(section.clientHeight, section.scrollHeight);
        const dpr = Math.min(devicePixelRatio || 1, 2);
        overlay.width = Math.round(width * dpr);
        overlay.height = Math.round(height * dpr);
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        schedule();
    }
    const trackPointer = event => {
        pointer = {x: event.clientX, y: event.clientY};
        schedule();
    };
    section.addEventListener('pointermove', trackPointer);
    section.addEventListener('pointerdown', trackPointer);
    section.addEventListener('click', trackPointer);
    section.addEventListener('pointerleave', () => { pointer = null; schedule(); });
    section.addEventListener('pointercancel', () => { pointer = null; schedule(); });
    window.addEventListener('scroll', schedule, {passive: true});
    section.addEventListener('scroll', schedule, {passive: true});
    section.addEventListener('focusin', event => {
        const rect = event.target.getBoundingClientRect();
        pointer = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
        schedule();
    });
    section.addEventListener('focusout', () => { pointer = null; schedule(); });
    document.fonts?.ready.then(resize);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(section);
    section.querySelectorAll(':scope > h1, :scope > .highlight, :scope > .container').forEach(element => sizeObserver.observe(element));
    resize();
})();
