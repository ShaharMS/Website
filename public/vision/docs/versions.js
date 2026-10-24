// Keep the current type/member when it exists in the selected release.
document.addEventListener('DOMContentLoaded', async () => {
    const select = document.getElementById('vision-version');
    if (!select) return;
    let manifest;
    const ready = fetch('/vision/docs/versions.json').then(response => {
        if (!response.ok) throw new Error('Cannot load documentation versions');
        return response.json();
    }).then(value => { manifest = value; }).catch(() => {});
    select.addEventListener('change', async () => {
        select.disabled = true;
        await ready;
        const current = decodeURIComponent(location.pathname).match(/\/vision\/docs\/[^/]+\/(.*)/);
        let page = current?.[1] || 'index.html';
        if (page.endsWith('/')) page += 'index.html';
        else if (!page.endsWith('.html')) page += '.html';
        const release = manifest?.versions.find(item => item.version === select.value);
        const destination = release?.pages.includes(page) ? page : 'index.html';
        location.assign('/vision/docs/' + select.value + '/' + destination +
            (destination === page ? location.hash : ''));
    });
});
