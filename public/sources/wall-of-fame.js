(() => {
    const wall = document.getElementById('wall-of-fame');
    if (!wall) return;
    const entries = [...wall.querySelectorAll('.wall-entry')];
    const board = wall.querySelector('.wall-board');
    const backdrop = wall.querySelector('.wall-backdrop');
    const homes = new Map();
    let current = null, queued = null, closing = false, closingEntry = null, pointer = null, restoringFocus = false;
    const gap = 64; // Comfortable clearance around both endpoints and the route between them.
    function distanceToRect(point, rect) {
        return Math.hypot(Math.max(rect.left - point.x, 0, point.x - rect.right), Math.max(rect.top - point.y, 0, point.y - rect.bottom));
    }
    function distanceToRoute(point, from, to) {
        const a = {x:(from.left + from.right)/2, y:(from.top + from.bottom)/2};
        const b = {x:(to.left + to.right)/2, y:(to.top + to.bottom)/2};
        const dx = b.x-a.x, dy = b.y-a.y;
        const t = Math.max(0, Math.min(1, ((point.x-a.x)*dx + (point.y-a.y)*dy)/(dx*dx+dy*dy || 1)));
        return Math.hypot(point.x-a.x-t*dx, point.y-a.y-t*dy);
    }
    function nearHome(entry, point) { return distanceToRect(point, homes.get(entry).getBoundingClientRect()) <= 12; }
    function safe(entry, point) {
        const origin = homes.get(entry).getBoundingClientRect();
        const bounds = board.getBoundingClientRect();
        const width = Math.min(540, bounds.width), height = entry.scrollHeight;
        const display = {left:bounds.left+(bounds.width-width)/2, right:bounds.left+(bounds.width+width)/2,
            top:bounds.top+(bounds.height-height)/2, bottom:bounds.top+(bounds.height+height)/2};
        return distanceToRect(point, origin) <= gap || distanceToRect(point, display) <= gap || distanceToRoute(point, origin, display) <= gap;
    }
    const motion = new Map(), flights = new Map();
    function matrix(transform) {
        const values = transform.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number);
        return values ? {angle:Math.atan2(values[1],values[0]), scale:Math.hypot(values[0],values[1])} : {angle:0,scale:1};
    }
    function capture(entry) {
        const trigger = entry.querySelector('.wall-trigger');
        const rect = trigger.getBoundingClientRect();
        const local = matrix(getComputedStyle(motion.get(entry)).transform);
        const outer = matrix(getComputedStyle(entry).transform);
        return {x:(rect.left+rect.right)/2,y:(rect.top+rect.bottom)/2,width:trigger.offsetWidth*local.scale,angle:outer.angle+local.angle};
    }
    function fly(entry, from, opening) {
        const layer = motion.get(entry);
        flights.get(entry)?.cancel();
        const trigger = entry.querySelector('.wall-trigger');
        const rect = trigger.getBoundingClientRect();
        const angle = matrix(getComputedStyle(entry).transform).angle;
        const dx = from.x-(rect.left+rect.right)/2, dy = from.y-(rect.top+rect.bottom)/2;
        // Express the flight in the destination seal's coordinates. The pivot is
        // the seal's center, so the wax never stretches as the description appears.
        layer.style.transformOrigin = `50% ${trigger.offsetHeight/2}px`;
        const x = dx*Math.cos(angle)+dy*Math.sin(angle), y = -dx*Math.sin(angle)+dy*Math.cos(angle);
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const animation = layer.animate([
            {transform:`translate(${x}px, ${y}px) rotate(${from.angle-angle}rad) scale(${from.width/trigger.offsetWidth})`},
            {transform:'translate(0, 0) rotate(0rad) scale(1)'}
        ], {duration:reduced ? 0 : opening ? 288 : 224,easing:'cubic-bezier(.4, 0, .2, 1)'});
        flights.set(entry,animation);
        if (opening) entry.querySelector('.wall-details').animate([{opacity:0,filter:'blur(6px)'},{opacity:1,filter:'blur(0px)'}],{duration:reduced ? 0 : 104,delay:reduced ? 0 : 136,fill:'backwards'});
        return animation.finished.catch(() => {});
    }
    function blurOutDetails(entry) {
        const details = entry.querySelector('.wall-details');
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = details.getBoundingClientRect(), bounds = board.getBoundingClientRect();
        const appearance = getComputedStyle(details);
        // Let the copy dissolve in place while the seal returns independently.
        // This temporary visual copy never affects layout, focus or the editor.
        const ghost = details.cloneNode(true);
        ghost.removeAttribute('id'); ghost.setAttribute('aria-hidden','true'); ghost.inert = true;
        ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        ghost.style.cssText = `position:absolute;box-sizing:border-box;pointer-events:none;z-index:3;margin:0;left:${rect.left-bounds.left}px;top:${rect.top-bounds.top}px;width:${rect.width}px`;
        board.append(ghost);
        const animation = ghost.animate([
            {opacity:appearance.opacity,filter:appearance.filter},
            {opacity:0,filter:'blur(6px)'}
        ], {duration:104,easing:'ease-in',fill:'forwards'});
        animation.finished.catch(() => {}).then(() => ghost.remove());
    }
    function fitDetails() {
        // Reserve the largest panel before interaction, including its hidden copy.
        // Opening and closing must never resize the board or move its center.
        let height = 0;
        for (const entry of entries) {
            const probe = entry.cloneNode(true);
            probe.classList.remove('is-closing'); probe.classList.add('is-open');
            probe.setAttribute('aria-hidden','true'); probe.inert = true;
            probe.style.cssText = 'visibility:hidden;pointer-events:none;left:50%;top:0;transform:none';
            probe.querySelector('.wall-details').hidden = false;
            probe.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
            board.append(probe);
            height = Math.max(height, probe.scrollHeight + 64);
            probe.remove();
        }
        wall.style.setProperty('--wall-panel-height', height + 'px');
    }
    function reveal(entry) {
        const from = capture(entry);
        current = entry;
        entry.querySelector('.wall-details').hidden = false;
        entry.querySelector('.wall-trigger').setAttribute('aria-expanded','true');
        entry.classList.add('is-open'); backdrop.hidden = false;
        fly(entry, from, true);
    }
    function close(restoreFocus = false) {
        if (!current) return;
        const previous = current;
        const from = capture(previous);
        blurOutDetails(previous);
        flights.get(previous)?.cancel();
        current = null; closing = true; closingEntry = previous;
        previous.classList.add('is-closing');
        previous.classList.remove('is-open');
        previous.querySelector('.wall-details').hidden = true;
        previous.querySelector('.wall-trigger').setAttribute('aria-expanded','false');
        backdrop.hidden = true;
        // The board keeps its reserved height throughout both flights.
        fly(previous, from, false).then(() => {
            previous.classList.remove('is-closing'); closingEntry = null;
            if (!queued) {closing = false; return;}
            const next = queued;
            queued = null; closing = false;
            if (next) reveal(next);
        });
        if (restoreFocus) {
            restoringFocus = true;
            previous.querySelector('.wall-trigger').focus({preventScroll:true});
            restoringFocus = false;
        }
    }
    function request(entry) {
        if (entry === current) return;
        if (closing) {queued = entry; return;}
        if (current) {queued = entry; close();}
        else reveal(entry);
    }
    const observer = new ResizeObserver(fitDetails);
    entries.forEach(entry => {
        const layer = document.createElement('div');
        layer.className = 'wall-motion';
        layer.append(...entry.childNodes);
        entry.append(layer); motion.set(entry,layer);
        observer.observe(entry);
        for (const axis of ['x','y']) {
            const property = '--stamp-' + axis;
            const anchor = parseFloat(entry.style.getPropertyValue(property));
            entry.style.setProperty(property, (anchor + (Math.random() - .5) * 5) + '%');
        }
        // A noninteractive marker keeps the original footprint available after the seal moves.
        const home = document.createElement('span');
        home.className = 'wall-home'; home.dataset.project = entry.dataset.project;
        home.style.cssText = entry.style.cssText; home.setAttribute('aria-hidden','true');
        board.append(home); homes.set(entry, home);
        const trigger = entry.querySelector('.wall-trigger');
        trigger.addEventListener('click', () => request(entry));
        trigger.addEventListener('focus', () => {if (!restoringFocus && trigger.matches(':focus-visible')) request(entry);});
        trigger.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown') {event.preventDefault(); request(entry); if (current === entry) entry.querySelector('.wall-details a')?.focus();}
        });
    });
    fitDetails();
    observer.observe(board);
    document.fonts?.ready.then(fitDetails);
    wall.addEventListener('input', fitDetails);
    document.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        pointer = {x:event.clientX, y:event.clientY};
        // Original footprints remain selectable even while another seal is centered.
        const target = entries.find(entry => entry !== current && entry !== closingEntry && nearHome(entry, pointer));
        if (target) {request(target); return;}
        if (closing) {if (queued && !nearHome(queued, pointer)) queued = null; return;}
        if (current && !safe(current, pointer) && !(document.activeElement?.closest('[contenteditable=true]') && current.contains(document.activeElement))) close();
    });
    // Touch has no hover corridor: tap another seal or the empty board to dismiss.
    wall.addEventListener('click', event => {
        if (!event.target.closest('.wall-entry') && !event.target.closest('[contenteditable=true]')) {queued = null; close();}
    });
    wall.addEventListener('keydown', event => {
        if (event.key === 'Escape') {queued = null; if (current) {event.preventDefault(); event.stopPropagation(); close(true);}}
    });
    wall.addEventListener('focusout', () => {requestAnimationFrame(() => {
        if (current && !wall.contains(document.activeElement) && (!pointer || !safe(current, pointer))) {queued = null; close();}
    });});
})();
