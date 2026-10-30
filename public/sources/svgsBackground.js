let w = window.innerWidth;
let h = window.innerHeight;
let animated = true;
const select = function (el) {
	return document.getElementById(el);
};
const wrapper = select("main-wrapper");
const checkBox = select("toggle");
const images = [
	{
		id: "#keyboard",
		name: "keyboard"
	},
	{
		id: "#headphones",
		name: "headphones"
	}, 
	{
		id: "#frying-pan",
		name: "frying-pan"
	},
	{
		id: "#dumbbell",
		name: "dumbbell"
	},
	{
		id: "#planet-2",
		name: "planet-2"
	},
	{
		id: "#moon-crescent",
		name: "moon-crescent"
	},
	{
		id: "#moon-full",
		name: "moon-full"
	},
	{
		id: "#constellation",
		name: "constellation"
	},
	{
		id: "#comet",
		name: "comet"
	},
	{
		id: "#galaxy",
		name: "galaxy"
	}
];
const extraIcons = ['monster', 'shirt', 'hanger', 'car', 'steering-wheel',
    'puzzle', 'puzzle-2', 'chart-candle', 'chart-line', 'coins', 'wallet', 'cash'];
extraIcons.forEach(name => images.push({id: '#' + name, name}));
// A shared, immutable image per icon avoids Chromium rebuilding SVG <use>
// shadow trees during tile animation. Extra padding preserves overflowing art.
for (const image of images) {
    const symbol = document.querySelector(image.id);
    const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    art.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    art.setAttribute('width', '80'); art.setAttribute('height', '66');
    art.innerHTML = `<svg x="12" y="12" width="56" height="42" viewBox="${symbol.getAttribute('viewBox')}" overflow="visible">${symbol.innerHTML}</svg>`;
    art.querySelectorAll('*').forEach(node => node.style.stroke = '#fff');
    image.source = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(art));
}
document.querySelectorAll('#main symbol').forEach(symbol => symbol.setAttribute('overflow', 'visible'));
checkBox.addEventListener("change", checkStatus);
window.addEventListener("resize", function () {
	w = window.innerWidth;
	h = window.innerHeight;
	init();
});

// building the pattern
function El(image, x, y, delay) {
	this.image = image;
	this.x = x;
	this.y = y;
	this.delay = delay;
}
El.prototype.attach = function () {
	this.svg = document.createElement('div');
    this.svg.className = 'pattern-icon';
    this.svg.setAttribute('aria-hidden', 'true');
	this.use = new Image(80, 66);
    this.use.alt = '';
    this.use.src = this.image.source;
    this.svg.dataset.icon = this.image.name;
	this.svg.setAttribute(
		"style",
		"top: " +
		this.y +
		"px; left: " +
		this.x +
		"px; animation-delay: " +
		this.delay +
		"s;"
	);
};
let spacing = 118;
// Keep a fresh arrangement per visit, but stable across layout/viewport updates.
const patternSeed = Math.floor(Math.random() * 0x100000000);
function patternRandom() {
    let seed = patternSeed;
    return () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 0x100000000;
    };
}
// Poisson-disc placement uses one distance in every direction, without rows.
function scatterPositions(width, height, pitch, random) {
    const distance = pitch * .8;
    const cell = distance / Math.SQRT2;
    const minX = -28, minY = -21, maxX = width + 28, maxY = height + 21;
    const grid = new Map(), points = [], active = [];
    const cellAt = point => [Math.floor((point.x - minX) / cell), Math.floor((point.y - minY) / cell)];
    function add(point) {
        const [x, y] = cellAt(point);
        grid.set(`${x}:${y}`, point);
        points.push(point);
        active.push(point);
    }
    function clear(point) {
        const [x, y] = cellAt(point);
        for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
            const other = grid.get(`${x + dx}:${y + dy}`);
            if (other && Math.hypot(point.x - other.x, point.y - other.y) < distance) return false;
        }
        return true;
    }
    add({x: random() * width, y: random() * height});
    while (active.length) {
        const index = Math.floor(random() * active.length);
        const origin = active[index];
        let found = false;
        for (let attempt = 0; attempt < 30; attempt++) {
            const angle = random() * Math.PI * 2;
            const radius = distance * Math.sqrt(1 + random() * 3);
            const point = {x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius};
            if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY || !clear(point)) continue;
            add(point);
            found = true;
            break;
        }
        if (!found) active.splice(index, 1);
    }
    // Type assignment walks spatially, rather than following growth clusters.
    return points.sort((a, b) => a.y - b.y || a.x - b.x);
}
function init() {
    w = wrapper.clientWidth;
    h = wrapper.clientHeight;
    spacing = w < 600 ? 90 : w < 1000 ? 105 : 118;
    while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
    const random = patternRandom();
    let bag = [];
    const placed = [];
    for (const point of scatterPositions(w, h, spacing, random)) {
        if (!bag.length) bag = images.slice();
        const neighbors = placed.filter(other => Math.hypot(point.x - other.x, point.y - other.y) < spacing * 1.5);
        const choices = bag.filter(image => !neighbors.some(other => other.image === image));
        const pool = choices.length ? choices : bag;
        const image = pool[Math.floor(random() * pool.length)];
        bag.splice(bag.indexOf(image), 1);
        placed.push({...point, image});
        draw(image, point.x - 28, point.y - 21, random());
    }
}

function draw(image, x, y, random) {
    const el = new El(image, x, y, Math.floor(random * 2));
    el.attach();
    el.svg.appendChild(el.use);
    wrapper.appendChild(el.svg);
}

init();
// Font/layout completion and mobile viewport changes can resize the section
// independently of a window resize (including the bottom row).
new ResizeObserver(init).observe(wrapper);

// Animate the small outer SVGs, leaving shared symbol trees immutable. Updating
// a symbol every frame rebuilds every <use> shadow tree across the pattern.
function checkStatus() {
    animated = checkBox.checked;
    wrapper.classList.toggle('pattern-stopped', !animated);
}
