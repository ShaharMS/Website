export function fitPaneSizes(sizes, total, minimums) {
    const minimumTotal = minimums.reduce((sum, n) => sum + n, 0);
    if (total <= minimumTotal) return minimums.map(n => n * total / minimumTotal);
    const weights = sizes.map((size, i) => Math.max(0, size - minimums[i]));
    const sum = weights.reduce((a, b) => a + b, 0);
    return minimums.map((minimum, i) => minimum + (total - minimumTotal) * (sum ? weights[i] / sum : 1 / sizes.length));
}
export function resizePair(sizes, first, second, delta, minimums) {
    const next = sizes.slice();
    const shift = Math.max(minimums[first] - sizes[first], Math.min(delta, sizes[second] - minimums[second]));
    next[first] += shift;
    next[second] -= shift;
    return next;
}

export function initializePaneResizing(measureEditor) {
    const root = document.querySelector('.blended > .playground');
    if (!root) return;
    const code = root.querySelector('#editor'), ast = root.querySelector('.ast-panel'), output = root.querySelector('.result');
    const toolbar = root.querySelector('.toolbar'), summary = ast.querySelector('summary'), tree = ast.querySelector('#ast');
    let sizes = [code, ast, output].map(node => node.getBoundingClientRect().height);
    let expandedSizes = sizes.slice(), drag = null;
    const makeHandle = (id, label, after) => {
        const handle = document.createElement('div');
        handle.id = id; handle.className = 'pane-divider'; handle.tabIndex = 0;
        handle.setAttribute('role','separator'); handle.setAttribute('aria-orientation','horizontal');
        handle.setAttribute('aria-label',label); after.after(handle);
        return handle;
    };
    const first = makeHandle('code-divider', 'Resize code and AST panes', code);
    const second = makeHandle('ast-divider', 'Resize AST and output panes', ast);
    root.classList.add('resizable-panes');
    const minimums = () => [120, ast.open ? 80 : summary.getBoundingClientRect().height + 2, 80];
    const pair = handle => handle === first ? [0, ast.open ? 1 : 2] : [1, 2];
    function apply() {
        second.style.visibility = ast.open ? '' : 'hidden';
        second.style.height = ast.open ? '' : '0px';
        second.style.minHeight = ast.open ? '' : '0px';
        second.tabIndex = ast.open ? 0 : -1;
        second.setAttribute('aria-hidden',String(!ast.open));
        const handleHeight = first.getBoundingClientRect().height;
        const total = Math.max(0, root.clientHeight - toolbar.getBoundingClientRect().height - handleHeight * (ast.open ? 2 : 1));
        const mins = minimums();
        if (ast.open) sizes = fitPaneSizes(sizes, total, mins);
        else {
            const fitted = fitPaneSizes([sizes[0],sizes[2]], Math.max(0,total - mins[1]), [mins[0],mins[2]]);
            sizes = [fitted[0],mins[1],fitted[1]];
        }
        root.style.gridTemplateRows = `${sizes[0]}px ${handleHeight}px ${sizes[1]}px ${ast.open ? handleHeight : 0}px ${toolbar.getBoundingClientRect().height}px ${sizes[2]}px`;
        tree.style.height = Math.max(0,sizes[1] - summary.getBoundingClientRect().height - 2) + 'px';
        first.setAttribute('aria-label',ast.open ? 'Resize code and AST panes' : 'Resize code and output panes');
        first.setAttribute('aria-controls',ast.open ? 'editor ast' : 'editor output');
        second.setAttribute('aria-controls','ast output');
        for (const handle of [first,second]) {
            const [a,b] = pair(handle), sum = sizes[a] + sizes[b];
            handle.setAttribute('aria-valuemin',String(Math.round(mins[a] / sum * 100)));
            handle.setAttribute('aria-valuemax',String(Math.round((sum - mins[b]) / sum * 100)));
            handle.setAttribute('aria-valuenow',String(Math.round(sizes[a] / sum * 100)));
        }
        measureEditor();
    }
    function end(event) {
        if (!drag || event.pointerId !== drag.pointer) return;
        root.classList.remove('is-resizing');
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        drag = null;
    }
    for (const handle of [first,second]) {
        handle.addEventListener('pointerdown',event => {
            if (!event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            handle.focus({preventScroll:true});
            drag = {pointer:event.pointerId, y:event.clientY, sizes:sizes.slice(), pair:pair(handle)};
            handle.setPointerCapture(event.pointerId); root.classList.add('is-resizing');
        });
        handle.addEventListener('pointermove',event => {
            if (!drag || event.pointerId !== drag.pointer) return;
            sizes = resizePair(drag.sizes, ...drag.pair, event.clientY - drag.y, minimums()); apply();
        });
        handle.addEventListener('pointerup',end);
        handle.addEventListener('pointercancel',end);
        handle.addEventListener('lostpointercapture',() => {drag = null; root.classList.remove('is-resizing');});
        handle.addEventListener('keydown',event => {
            if (!['ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
            event.preventDefault();
            const [a,b] = pair(handle), mins = minimums();
            const delta = event.key === 'Home' ? mins[a] - sizes[a] : event.key === 'End' ? sizes[b] - mins[b] : (event.key === 'ArrowUp' ? -1 : 1) * (event.shiftKey ? 40 : 10);
            sizes = resizePair(sizes,a,b,delta,mins); apply();
        });
    }
    ast.addEventListener('toggle',() => {
        if (ast.open) sizes = expandedSizes.slice();
        else {expandedSizes = sizes.slice(); sizes[1] = minimums()[1];}
        apply();
    });
    new ResizeObserver(apply).observe(root);
    document.fonts?.ready.then(apply);
    apply();
}
