// Small landscape details use the existing scenery's shapes and palette.
(() => {
    const section = document.getElementById('section-3');
    const tree = section.querySelector('.tree');
    ['tree5', 'tree6', 'tree7'].forEach(name => {
        const copy = tree.cloneNode(true);
        copy.className = 'tree distant-tree ' + name;
        copy.setAttribute('aria-hidden', 'true');
        section.appendChild(copy);
    });
    const sign = section.querySelector('.content');
    const foregroundTrees = [...section.querySelectorAll('.tree1, .tree2, .tree5')];
    let placementPending = false;
    function placeTrees() {
        placementPending = false;
        // Measure their original foreground positions, then relocate only trees
        // whose crowns would intersect the readable sign board at this size.
        foregroundTrees.forEach(tree => tree.classList.remove('behind-sign'));
        const board = sign.getBoundingClientRect();
        foregroundTrees.forEach(tree => {
            const crown = tree.getBoundingClientRect();
            if (crown.left < board.right && crown.right > board.left &&
                crown.top < board.bottom && crown.bottom > board.top) {
                tree.classList.add('behind-sign');
            }
        });
    }
    const scheduleTrees = () => {
        if (!placementPending) { placementPending = true; requestAnimationFrame(placeTrees); }
    };
    const treeLayout = new ResizeObserver(scheduleTrees);
    treeLayout.observe(section);
    treeLayout.observe(sign);
    document.fonts?.ready.then(scheduleTrees);
    scheduleTrees();
    const picnic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    picnic.setAttribute('viewBox', '0 0 120 75');
    picnic.setAttribute('class', 'distant-picnic');
    picnic.setAttribute('aria-hidden', 'true');
    picnic.innerHTML = `<path d="M24 55l62-4 27 16-76 5z" fill="#fff" stroke="#374544" stroke-width="2"/>
        <path d="M35 59l64-3M43 65l63-3M46 54l15 16M69 53l16 16" fill="none" stroke="#638864" stroke-width="2"/>
        <g fill="#374544" stroke="#374544" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="28" cy="31" r="6"/><path d="M28 40l6 13 14 5M31 43l15 4" fill="none"/>
        <circle cx="92" cy="28" r="6"/><path d="M91 37l-5 14-12 7M88 41l-12 5" fill="none"/></g>
        <path d="M54 52v-7q7-10 14 0v7z" fill="saddlebrown" stroke="#374544" stroke-width="2"/>
        <path d="M58 43q3-10 7 0" fill="none" stroke="#374544" stroke-width="2"/>`;
    section.appendChild(picnic);
    const details = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    details.setAttribute('viewBox', '0 0 320 120');
    details.setAttribute('class', 'hill-details');
    details.setAttribute('aria-hidden', 'true');
    details.innerHTML = `<path d="M260 8q-40 26-18 43t-45 66" fill="none" stroke="saddlebrown" stroke-width="10" opacity=".3"/>
        <g stroke="#374544" stroke-width="2" stroke-linejoin="round">
        <path d="M28 64v22m49-22v22M25 48v20m55-20v20"/>
        <path d="M22 47h61v8H22zM20 62h66l-5 7H25z" fill="saddlebrown"/>
        </g>
        <g stroke="#374544" stroke-width="1.4" fill="#ffee00">
        <path d="M114 111v-12m-6 8l6 2 5-4m30 4v-15m-5 9l5 2 5-4" fill="none"/>
        <circle cx="114" cy="97" r="3"/><circle cx="149" cy="92" r="3"/>
        <path d="M291 93V80m-5 7l5 2 5-3" fill="none"/><circle cx="291" cy="78" r="3"/>
        </g>`;
    section.appendChild(details);
    for (let i = 0; i < 3; i++) {
        const butterfly = document.createElement('span');
        butterfly.className = 'butterfly butterfly-' + i;
        butterfly.setAttribute('aria-hidden', 'true');
        // Tabler's sourced butterfly silhouette, with independently fluttering wings.
        butterfly.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#374544" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path class="butterfly-wings" fill="#ffee00" d="M12 18.176a3 3 0 1 1 -4.953 -2.449l-.025 .023a4.502 4.502 0 0 1 1.483 -8.75c1.414 0 2.675 .652 3.5 1.671a4.5 4.5 0 1 1 4.983 7.079a3 3 0 1 1 -4.983 2.25l-.005 .176"/>
            <path d="M12 19v-10M9 3l3 2l3 -2"/></svg>`;
        section.appendChild(butterfly);
    }
})();
