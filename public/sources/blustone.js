/* Keep horizontal chapters independent of the homepage's vertical scrolling. */
(() => {
    const root = document.getElementById('blustone');
    if (!root) return;
    const track = root.querySelector('.slides');
    const slides = [...track.children];
    const steps = [...root.querySelectorAll('[data-slide]')];
    const previous = root.querySelector('#blustone-prev');
    const next = root.querySelector('#blustone-next');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const nextLabels = ['The story', 'Under the hood', 'Back to Blustone'];
    let current = 0;

    function sync(index) {
        current = Math.max(0, Math.min(slides.length - 1, index));
        steps.forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
        slides.forEach((slide, i) => {
            slide.inert = i !== current;
            slide.setAttribute('aria-hidden', String(i !== current));
        });
        previous.disabled = current === 0;
        root.querySelector('#blustone-nextlabel').textContent = nextLabels[current];
        next.setAttribute('aria-label', current === 2
            ? 'Back to first chapter: Blustone'
            : `Next chapter: ${nextLabels[current]}`);
        next.querySelector('.arrow').textContent = current === 2 ? '↶' : '→';
    }

    function go(index) {
        sync(index);
        track.scrollTo({left: current * track.clientWidth,
            behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    }
    steps.forEach(button => button.addEventListener('click', () => go(Number(button.dataset.slide))));
    previous.addEventListener('click', () => go(current - 1));
    next.addEventListener('click', () => go((current + 1) % slides.length));

    // Settle native touch/trackpad gestures without intercepting wheel or touch events.
    let settleTimer;
    const settle = () => sync(Math.round(track.scrollLeft / track.clientWidth));
    track.addEventListener('scroll', () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 160);
    }, {passive: true});
    track.addEventListener('scrollend', settle);
    track.addEventListener('keydown', event => {
        if (event.target.closest('a,button,input,textarea,[contenteditable=true]')) return;
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        go(current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    let trackWidth = track.clientWidth;
    new ResizeObserver(() => {
        if (trackWidth === track.clientWidth) return;
        trackWidth = track.clientWidth;
        track.scrollTo({left: current * trackWidth, behavior: 'instant'});
    }).observe(track);

    const images = [
        ['mirage-combat', 'Mirage combat'],
        ['mirage-floor', 'Mirage floor'],
        ['team-preparation', 'Team preparation'],
        ['bright-training', 'Hunter training'],
        ['guild-bar', 'Guild Bar introduction'],
        ['village', 'The village']
    ];
    let shot = 0;
    const image = root.querySelector('#blustone-gameimage');
    const caption = root.querySelector('#blustone-gamename');
    caption.textContent = `${images[0][1]} (1/${images.length})`;
    root.querySelector('#blustone-gallerynext').addEventListener('click', () => {
        shot = (shot + 1) % images.length;
        const [file, title] = images[shot];
        image.src = `images/blustone/${file}.png`;
        image.alt = `${title} in the original Blustone client`;
        caption.textContent = `${title} (${shot + 1}/${images.length})`;
    });
    // Fit the frame to the capture itself, leaving only the existing 5px border.
    // Different screenshots have slightly different portrait proportions.
    const frame = root.querySelector('.gameframe');
    const footer = root.querySelector('.gamebottom');
    function fitCapture() {
        if (!image.naturalWidth || !image.naturalHeight) return;
        const style = getComputedStyle(frame);
        const border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
        const pictureHeight = frame.clientHeight - footer.offsetHeight;
        if (pictureHeight > 0) frame.style.width = (pictureHeight * image.naturalWidth / image.naturalHeight + border) + 'px';
    }
    image.addEventListener('load', fitCapture);
    const gallerySize = new ResizeObserver(fitCapture);
    gallerySize.observe(frame);
    gallerySize.observe(footer);
    fitCapture();
    sync(0);
})();
