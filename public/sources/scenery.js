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
    for (let i = 0; i < 3; i++) {
        const butterfly = document.createElement('span');
        butterfly.className = 'butterfly butterfly-' + i;
        butterfly.setAttribute('aria-hidden', 'true');
        butterfly.innerHTML = '<i></i><i></i>';
        section.appendChild(butterfly);
    }
})();
