/**
 * 
 * @param {HTMLDivElement} plane 
 * @param {Number} velocity 
 */
const runPlane = (plane, velocity) => {
	if (plane.getAttribute("ran")) return;
	plane.setAttribute("ran", "true");
	let right = parseFloat(getComputedStyle(plane).right);
	let previous = performance.now();
	function frame(now) {
		const elapsed = Math.min(now - previous, 50) / (1000 / 60);
		previous = now;
		right += velocity * elapsed;
		plane.style.right = right + 'px';
		if (plane.getBoundingClientRect().right < -window.innerWidth * .3) {
			right = -window.innerWidth - plane.getBoundingClientRect().width * 1.5;
		}
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
}


let planes = document.getElementsByClassName("airplane");

let p_i = 0;
const id = () => p_i++;

for (const plane of planes) {
	const text = plane.innerHTML;
	const velocity = parseFloat(plane.getAttribute("velocity") ?? window.innerWidth / 1000);
	const stop = parseFloat(plane.getAttribute("distance") ?? -1);

	let graphic = document.createElement("img");
	graphic.src = "../assets/plane-demo.svg";
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
		    <animate attributeName="baseFrequency" values=".003 .012;.005 .02;.003 .012" dur="2.8s" repeatCount="indefinite"/>
		  </feTurbulence><feDisplacementMap in="SourceGraphic" in2="wind" scale="22" xChannelSelector="R" yChannelSelector="G"/>
		</filter></defs>`;
		plane.appendChild(definitions);
		container.style.filter = `url(#${filterId})`;

		if (!plane.getAttribute("ran")) {
			requestAnimationFrame(() => {
				runPlane(plane, velocity);
			});
		}
	}
}

