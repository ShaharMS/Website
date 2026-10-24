let w = window.innerWidth;
let h = window.innerHeight;
let animated = false;
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
	this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	this.use = document.createElementNS("http://www.w3.org/2000/svg", "use");
	this.use.setAttributeNS(
		"http://www.w3.org/1999/xlink",
		"xlink:href",
		this.image.id
	);
	this.svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
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
let spacing = 170;
const yOffset = 15;
let i, s;
function init() {
	w = wrapper.clientWidth;
	h = wrapper.clientHeight;
	spacing = w < 600 ? 130 : w < 1000 ? 150 : 170;
	while (wrapper.firstChild) {
		wrapper.removeChild(wrapper.firstChild);
	}
	i = 0;
	s = 0;
	// Fit complete rows to the actual section, then overscan every edge. Integer
	// row/column parity also remains reliable with fractional responsive spacing.
	const columns = Math.max(1, Math.ceil(w / spacing));
	const rows = Math.max(1, Math.ceil(h / spacing));
	const stepX = w / columns;
	const stepY = h / rows;
	for (let row = 0; row <= rows + 1; row++) {
		for (let column = -1; column <= columns; column++) {
			const x = column * stepX + (row % 2 ? stepX / 2 : 0) - 28;
			const y = row * stepY - 21 + ((row + column) % 2 ? yOffset : -yOffset);
			draw(x, y);
		}
	}
}
function draw(x, y) {
	const image = images[i];
	const delay = Math.floor(Math.random() * 2);
	const el = new El(image, x, y, delay);
	if (i === images.length - 1) {
		i = 0;
	} else {
		i++;
	}
	el.attach();
	el.svg.appendChild(el.use);
	wrapper.appendChild(el.svg);
}

init();
// Font/layout completion and mobile viewport changes can resize the section
// independently of a window resize (including the bottom row).
new ResizeObserver(init).observe(wrapper);

// Animation functions
const keyboard = document.querySelector("symbol#keyboard > g");
const headphones = document.querySelector("symbol#headphones > g");
const fryingPan = document.querySelector("symbol#frying-pan > g");
const dumbbell = document.querySelector("symbol#dumbbell > g");
const moonFull = document.querySelector("symbol#moon-full > g");
const galaxy = document.querySelector("symbol#galaxy > g");
const planet2 = document.querySelector("symbol#planet-2 > g");
const moonCrescent = document.querySelector("symbol#moon-crescent > g");
const comet = document.querySelector("symbol#comet > g");
const constellationStars = document.querySelectorAll("symbol#constellation polygon");
let cometLines = document.querySelectorAll("symbol#comet .trail");

// Some styling needs to be pre-applied
keyboard.style.transformOrigin = "center";
keyboard.style.transform = "rotate(25deg)";

headphones.style.transformOrigin = "center";
headphones.style.transform = "rotate(-5deg)";

dumbbell.style.transformOrigin = "center";
dumbbell.style.transform = "rotate(-10deg)";

fryingPan.style.transformOrigin = "right";
fryingPan.style.transform = "rotate(-15deg)";

const tlKeyboard = new TimelineMax({
	repeat: -1,
	paused: false,
	yoyo: true
});
tlKeyboard.to(keyboard, 1, {
	rotation: 35,
	ease: Power0.easeNone,
	transformOrigin: "50% 50%"
}).to(keyboard, 1, {
	rotation: 25,
	ease: Power0.easeNone,
	transformOrigin: "50% 50%"
});

const tlHeadphones = new TimelineMax({
	repeat: -1,
	paused: false,
	yoyo: true
});
tlHeadphones.to(headphones, 0.5, {
	x: 1,
	y: 3,
	rotation: 0,
	ease: Power0.easeNone
});

const tlFryingPan = new TimelineMax({
	repeat: -1,
	paused: false,
	yoyo: true
});
tlFryingPan.to(fryingPan, 2, {
	x: 0,
	y: -5,
	rotation: 4,
	ease: Power0.easeNone
});

const tlDumbbell = new TimelineMax({
	repeat: -1,
	paused: false
});
tlDumbbell.to(dumbbell, 2, {
	rotation: 10,
	ease: Sine.inOut
}).to(dumbbell, 0.3, {}).to(dumbbell, 2, {
	rotation: -10,
	ease: Sine.inOut
}).to(dumbbell, 0.3, {});

const tlMoonFull = new TimelineMax({
	repeat: -1,
	paused: false
});
tlMoonFull.to(moonFull, 20, {
	rotation: 360,
	ease: Power0.easeNone,
	transformOrigin: "50% 50%"
});

const tlGalaxy = new TimelineMax({
	repeat: -1,
	yoyo: true,
	paused: false
});
tlGalaxy.to(galaxy, 5, {
	rotationX: -45,
	ease: Power0.easeNone
});

const tlPlanet2 = new TimelineMax({
	repeat: -1,
	yoyo: true,
	paused: false
});
tlPlanet2.to(planet2, 0.5, {
	x: 1,
	y: 1,
	ease: Power0.easeNone
});
const tlComet = new TimelineMax({
	repeat: -1,
	yoyo: true,
	paused: false
});
const tlCometTrail = new TimelineMax({
	repeat: -1,
	yoyo: true,
	paused: false
});
tlComet.to(comet, 0.15, {
	x: 1,
	y: 1,
	ease: Power0.easeNone
});
cometLines.forEach((el, i) => {
	const x2 = parseInt(el.getAttribute("x2")) - 10;
	const y2 = parseInt(el.getAttribute("y2")) - 10;
	let tl = new TimelineMax({
		repeat: -1,
		yoyo: true
	});
	tl.to(el, 1, {
		attr: {
			x2: x2,
			y2: y2
		},
		ease: Linear.easeNone
	});
	tlCometTrail.add(tl, i / 2);
});
const tlMoonCrescent = new TimelineMax({
	repeat: -1,
	yoyo: true,
	paused: false
});
tlMoonCrescent
	.to(moonCrescent, 2, {
		rotation: 5,
		ease: Power0.easeNone
	})
	.to(moonCrescent, 2, {
		rotation: -5,
		ease: Power0.easeNone
	});
const tlConstellation = new TimelineMax({
	repeat: -1,
	paused: false
});
constellationStars.forEach((el, i) => {
	var tl = new TimelineMax({
		repeat: -1,
		yoyo: true
	});
	tl.to(el, 1, {
		opacity: 0.3,
		ease: Linear.easeNone
	});
	tlConstellation.add(tl, i);
});
function checkStatus() {
	if (checkBox.checked) {
		animated = true;
		startAnimation();
	} else {
		animated = false;
		stopAnimation();
	}
}
function startAnimation() {
    extraMotion.forEach(timeline => timeline.play());
	tlKeyboard?.play();
	tlHeadphones?.play();
	tlFryingPan?.play();
	tlDumbbell?.play();
	tlMoonFull?.play();
	tlMoonCrescent?.play();
	tlPlanet2?.play();
	tlGalaxy?.play();
	tlComet?.play();
	tlCometTrail?.play();
	tlConstellation?.play();
}
function stopAnimation() {
    extraMotion.forEach(timeline => timeline.pause());
	tlKeyboard?.pause();
	tlHeadphones?.pause();
	tlFryingPan?.pause();
	tlDumbbell?.pause();
	tlMoonFull?.pause();
	tlMoonCrescent?.pause();
	tlPlanet2?.pause();
	tlGalaxy?.pause();
	tlComet?.pause();
	tlCometTrail?.pause();
	tlConstellation?.pause();
}

// Small gestures keep the sourced line art alive without changing the pattern's size or placement.
const extraMotion = [];
for (const [name, rotation, x, y, duration] of [
    ['monster', 5, 0, .2, 2],
    ['shirt', 3, 0, .2, 1.9],
    ['hanger', 9, 0, 0, 2.2],
    ['steering-wheel', 24, 0, 0, 2.1],
    ['puzzle', 7, .2, 0, 2.1], ['puzzle-2', 4, 0, .25, 1.8],
    ['chart-candle', 3, 0, .15, 2.4], ['chart-line', 3, 0, .15, 2.2],
    ['coins', 5, 0, .2, 1.9], ['wallet', 4, 0, .15, 2.3], ['cash', 6, .2, 0, 2]
]) {
    const artwork = document.querySelector('symbol#' + name + ' > g');
    const motion = gsap.timeline({repeat: -1, yoyo: true});
    motion.fromTo(artwork, {rotation: -rotation, x: -x, y: -y},
        {rotation, x, y, duration, transformOrigin: '50% 50%', ease: 'sine.inOut'});
    extraMotion.push(motion);
}

// A continuous miniature drive: the road passes beneath rolling wheels.
extraMotion.push(gsap.fromTo(document.querySelector('#car .car-road'),
    {strokeDashoffset: 0}, {strokeDashoffset: 6, duration: .55, repeat: -1, ease: 'none'}));
document.querySelectorAll('#car .car-wheel').forEach(wheel => {
    extraMotion.push(gsap.to(wheel, {rotation: 360, transformOrigin: '50% 50%', duration: .85, repeat: -1, ease: 'none'}));
});
extraMotion.push(gsap.fromTo(document.querySelector('#car .car-chassis'),
    {y: -.16}, {y: .16, duration: .16, repeat: -1, yoyo: true, ease: 'sine.inOut'}));
