/* Continuous one-way loop. Only the original feature group is source/editable text. */
(() => {
    const section = document.getElementById('section-6');
    const ticker = section?.querySelector('.feature-marquee');
    if (!ticker) return;
    const track = ticker.querySelector('.marquee-track');
    const group = track.firstElementChild;
    const prints = section.querySelector('.prints');
    const layouts = new Map();
    function scatter(count, width, height) {
        if (layouts.has(count)) return layouts.get(count);
        // Anchor the outer edges, then distribute irregular interior positions.
        // Positions are generated once per layout, never again on hover.
        const points = [{x:0,y:.08},{x:.91,y:0},{x:1,y:.92},{x:.06,y:1}];
        while (points.length < count) {
            const candidates = Array.from({length:12}, () => ({x:.04+Math.random()*.92,y:.06+Math.random()*.88}));
            const score = point => Math.min(...points.map(p => ((p.x-point.x)*width)**2 + ((p.y-point.y)*height)**2));
            candidates.sort((a,b) => score(b)-score(a));
            points.push(candidates[Math.floor(Math.random()*3)]);
        }
        points.forEach(point => point.angle = (Math.random()<.5?-1:1)*(5+Math.random()*12));
        layouts.set(count,points);
        return points;
    }
    const fitPrints = () => {
        prints.style.setProperty('--print-area-height', prints.clientHeight + 'px');
        const visible = [...prints.querySelectorAll('.print')].filter(print => print.offsetWidth);
        const wide = section.clientWidth > 900;
        const points = wide ? scatter(visible.length, prints.clientWidth, prints.clientHeight) : [];
        visible.forEach((print,index) => {
            print.style.transition = 'none';
            if (wide) print.style.setProperty('--tilt', points[index].angle+'deg');
            else print.style.removeProperty('--tilt');
            const angle = Math.abs(parseFloat(getComputedStyle(print).getPropertyValue('--tilt')) || 0)*Math.PI/180;
            const rotatedWidth = print.offsetWidth*Math.cos(angle)+print.offsetHeight*Math.sin(angle);
            const rotatedHeight = print.offsetHeight*Math.cos(angle)+print.offsetWidth*Math.sin(angle);
            const extraX = Math.max(0, rotatedWidth - print.offsetWidth) / 2;
            const extraY = Math.max(0, rotatedHeight - print.offsetHeight) / 2;
            const maxLeft = Math.max(0, prints.clientWidth - print.offsetWidth - extraX);
            const maxTop = Math.max(0, prints.clientHeight - print.offsetHeight - extraY);
            print.style.setProperty('--print-max-left', maxLeft+'px');
            print.style.setProperty('--print-max-top', maxTop+'px');
            if (wide) {
                print.style.left = (extraX + points[index].x*Math.max(0,maxLeft-extraX))+'px';
                print.style.top = (extraY + points[index].y*Math.max(0,maxTop-extraY))+'px';
            } else {
                print.style.removeProperty('left');
                print.style.removeProperty('top');
            }
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
