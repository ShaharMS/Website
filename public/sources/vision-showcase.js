/* Continuous one-way loop. Only the original feature group is source/editable text. */
(() => {
    const section = document.getElementById('section-6');
    const ticker = section?.querySelector('.feature-marquee');
    if (!ticker) return;
    const track = ticker.querySelector('.marquee-track');
    const group = track.firstElementChild;
    const prints = section.querySelector('.prints');
    // Art-directed compositions, not random placement. Fractions span the full
    // usable area after accounting for each rotated print's dimensions.
    const compositions = {
        3: [[0,0,-8],[1,.5,7],[.14,1,-6]],
        6: [[0,0,-10],[1,.08,8],[.08,.48,5],[.93,.56,-11],[0,1,-7],[1,1,9]],
        9: [[0,0,-11],[.48,.07,8],[1,0,-7],[.07,.48,6],[.49,.56,-12],[.94,.43,10],[0,1,-6],[.53,.94,9],[1,1,-8]],
        12: [[0,0,-12],[.3,.08,7],[.65,0,-8],[1,.07,11],
             [.07,.48,5],[.4,.56,-13],[.72,.43,9],[.98,.53,-6],
             [0,.97,8],[.32,1,-10],[.66,.94,12],[1,1,-5]]
    };
    const fitPrints = () => {
        prints.style.setProperty('--print-area-height', prints.clientHeight + 'px');
        const visible = [...prints.querySelectorAll('.print')].filter(print => print.offsetWidth);
        const points = compositions[visible.length] || compositions[12];
        visible.forEach((print,index) => {
            print.style.transition = 'none';
            print.style.setProperty('--tilt', points[index][2]+'deg');
            const angle = Math.abs(parseFloat(getComputedStyle(print).getPropertyValue('--tilt')) || 0)*Math.PI/180;
            const rotatedWidth = print.offsetWidth*Math.cos(angle)+print.offsetHeight*Math.sin(angle);
            const rotatedHeight = print.offsetHeight*Math.cos(angle)+print.offsetWidth*Math.sin(angle);
            const extraX = Math.max(0, rotatedWidth - print.offsetWidth) / 2;
            const extraY = Math.max(0, rotatedHeight - print.offsetHeight) / 2;
            const maxLeft = Math.max(0, prints.clientWidth - print.offsetWidth - extraX);
            const maxTop = Math.max(0, prints.clientHeight - print.offsetHeight - extraY);
            print.style.setProperty('--print-max-left', maxLeft+'px');
            print.style.setProperty('--print-max-top', maxTop+'px');
            print.style.left = (extraX + points[index][0]*Math.max(0,maxLeft-extraX))+'px';
            print.style.top = (extraY + points[index][1]*Math.max(0,maxTop-extraY))+'px';
            void print.offsetWidth;
            print.style.removeProperty('transition');
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
