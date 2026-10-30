/**
 * 
 * @param {HTMLDivElement} plane 
 * @param {Number} velocity 
 */
const runPlane = (plane, velocity) => {
    if (plane.getAttribute('ran')) return;
    plane.setAttribute('ran', 'true');
    const section = plane.closest('section');
    const graphic = plane.querySelector('img');
    let direction = -1;
    let x = section.clientWidth + 40;
    let sectionWidth = section.clientWidth, planeWidth = plane.offsetWidth, planeScale = 1;
    const measure = () => { sectionWidth = section.clientWidth; planeWidth = plane.offsetWidth; planeScale = parseFloat(getComputedStyle(plane).scale) || 1; };
    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(section);
    sizeObserver.observe(plane);
    plane.style.right = 'auto';
    plane.style.transformOrigin = 'left center';
    function orient() {
        plane.dataset.direction = direction === 1 ? 'right' : 'left';
        // Only flip the aircraft: the trailing banner always reads normally.
        plane.style.flexDirection = direction === 1 ? 'row-reverse' : 'row';
        graphic.style.transform = direction === 1 ? 'scaleX(-1)' : 'none';
        const title = plane.querySelector('.title');
        const key = direction === -1 ? 'left' : 'right';
        title.innerHTML = window.websiteCopy.airplane[key];
        window.__localTextEditor?.bind(title, 'airplane.' + key);
    }
    orient();
    plane.style.left = '0px';
    function frame(now, delta) {
        const elapsed = delta / (1000 / 60);
        if (window.__localTextEditor && plane.matches(':hover, :focus-within')) {
            return;
        }
        x += direction * velocity * elapsed;
        const width = planeWidth * planeScale;
        if (direction === 1 && x > sectionWidth + 40) {
            direction = -1;
            orient();
            x = sectionWidth + 40;
        } else if (direction === -1 && x + width < -40) {
            direction = 1;
            orient();
            x = -width - 40;
        }
        // Individual translate is outside the plane's existing CSS scale.
        plane.style.translate = x + 'px 0';
    }
    window.sceneMotion.animate(section, frame);
}


let planes = document.getElementsByClassName("airplane");

let p_i = 0;
const id = () => p_i++;

for (const plane of planes) {
	const text = plane.innerHTML;
	const velocity = parseFloat(plane.getAttribute("velocity") ?? window.innerWidth / 1000);
	const stop = parseFloat(plane.getAttribute("distance") ?? -1);

	let graphic = document.createElement("img");
	graphic.src = "./assets/plane-demo.svg?v=20261024-propeller-front";
	graphic.style.padding = "0";
	graphic.style.margin = "0";
	// remove all children
	plane.innerHTML = "";
	plane.style.display = "flex";
	plane.style.alignItems = "center";

	plane.style.position = "absolute";

	plane.appendChild(graphic);

	

	graphic.onload = () => {

		let graphicBounds = graphic.getBoundingClientRect();
		graphicBounds.y += window.scrollY;

		let planeBounds = plane.getBoundingClientRect();
		planeBounds.y += window.scrollY;
		planeBounds.height /= plane.style.scale;

		plane.style.right = `calc(-100% - ${planeBounds.width}px)`;


		let container = document.createElement("div");
		let customClass = "plane-content" + id();
		container.classList.add(customClass);
		container.innerHTML = text;
		container.style.backgroundColor = "rgba(255, 255, 255)";
		container.style.display = "flex";
		let css = `
		.${customClass} * {
		}`;
		let cssStyle = document.createElement("style");
		cssStyle.innerHTML = css;
		document.head.appendChild(cssStyle);
		plane.appendChild(container);
		// Warp the existing white banner and text; keep all original layout and sizing.
		const filterId = 'plane-banner-wave-' + customClass;
		const definitions = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		definitions.setAttribute('width', '0');
		definitions.setAttribute('height', '0');
		definitions.setAttribute('aria-hidden', 'true');
		definitions.style.position = 'absolute';
		definitions.innerHTML = `<defs><filter id="${filterId}" x="-5%" y="-20%" width="110%" height="140%">
		  <feTurbulence type="fractalNoise" baseFrequency=".003 .012" numOctaves="1" seed="4" result="wind">
		  </feTurbulence><feDisplacementMap in="SourceGraphic" in2="wind" scale="22" xChannelSelector="R" yChannelSelector="G"/>
		</filter></defs>`;
		plane.appendChild(definitions);
		container.style.filter = `url(#${filterId})`;
		container.classList.add('plane-banner');

		if (!plane.getAttribute("ran")) {
			requestAnimationFrame(() => {
				runPlane(plane, velocity);
			});
		}
	}
}

