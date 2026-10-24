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
        const visibleTop = Math.max(0, -bounds.top);
        const visibleBottom = Math.min(height, innerHeight - bounds.top);
        const restingY = visibleBottom > visibleTop ? (visibleTop + visibleBottom) / 2 : height / 2;
        const x = pointer ? Math.max(0, Math.min(width, pointer.x - bounds.left)) : width / 2;
        const y = pointer ? Math.max(0, Math.min(height, pointer.y - bounds.top)) : restingY;
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
            const angle = Math.atan2(y - centerY, x - centerX);
            // Both fixture shapes point down before rotation, including the mirrored one.
            fixture.style.rotate = (angle - Math.PI / 2) + 'rad';
            const dx = Math.cos(angle), dy = Math.sin(angle);
            const sideX = -dy, sideY = dx;
            const lensX = centerX + dx * fixture.offsetHeight / 2;
            const lensY = centerY + dy * fixture.offsetHeight / 2;
            const halfLens = fixture.clientWidth / 2;
            context.beginPath();
            context.moveTo(lensX + sideX * halfLens, lensY + sideY * halfLens);
            context.lineTo(x + sideX * radius, y + sideY * radius);
            context.lineTo(x - sideX * radius, y - sideY * radius);
            context.lineTo(lensX - sideX * halfLens, lensY - sideY * halfLens);
            context.closePath();
            context.fill();
        });
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
    function schedule() {
        if (!pending) { pending = true; requestAnimationFrame(draw); }
    }
    function resize() {
        width = section.clientWidth;
        height = section.clientHeight;
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
    new ResizeObserver(resize).observe(section);
    resize();
})();
