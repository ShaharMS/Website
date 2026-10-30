let timerDone = false;
let counter = Math.floor(Math.random() * 8);
let container = document.getElementsByClassName("cloud-container")[0];


const randomVelocity = () => Math.max(0.2, Math.random()) / 2;
const randomHeight = (height) => Math.random() * height;
const randomStartPosition = (width) => Math.random() * width;
const getTime = () => 2500;
const shouldCreateCloud = (width) => {
    const capacity = Math.max(5, Math.ceil(width / 140));
    if (timerDone && container.children.length < capacity) {
        timerDone = false;
        setTimeout(() => timerDone = true, getTime(width));

        return true;
    }
    return false;
};
const cloudContent = () => {
	const array = window.websiteCopy.clouds;
	const index = counter++ % array.length;
	return '<div data-copy-key="clouds.' + index + '" style="position: relative; top: -10px; width: 80%">' + array[index].replaceAll('{years}', new Date(new Date() - new Date(2021, 2, 15)).getFullYear() - 1970) + '</div>';
}

setTimeout(() => timerDone = true, getTime(container.getBoundingClientRect().width));
let cloudWidth = container.clientWidth, cloudHeight = container.clientHeight;
const cloudPositions = new WeakMap();
new ResizeObserver(() => {
    cloudWidth = container.clientWidth;
    cloudHeight = container.clientHeight;
}).observe(container);

for (let i = 0; i < Math.ceil(container.getBoundingClientRect().width / 200); i++) {
    let cloud = document.createElement("div");
    cloud.classList.add("cloud");
	cloud.innerHTML = cloudContent();
	window.__localTextEditor?.bind(cloud.firstElementChild, cloud.firstElementChild.dataset.copyKey);
    cloud.style.top = randomHeight(container.getBoundingClientRect().height - 20) + 20 + "px";
    cloud.style.left = randomStartPosition(container.getBoundingClientRect().width) + "px";
    cloud.setAttribute("velocity", randomVelocity());
    container.appendChild(cloud);
}

function run(now, elapsed) {
    let clouds = container.getElementsByClassName("cloud");
    for (const cloud of clouds) {
        if (window.__localTextEditor && cloud.matches(':hover, :focus-within')) continue;
        const x = cloudPositions.get(cloud) ?? parseFloat(cloud.style.left);
        if (x > cloudWidth) {
            container.removeChild(cloud);
        } else {
            const next = x + +cloud.getAttribute('velocity') * elapsed / (1000 / 60);
            cloudPositions.set(cloud, next);
            cloud.style.left = '0px';
            cloud.style.transform = `translateX(${next}px)`;
        }
    }

    if (shouldCreateCloud(cloudWidth)) {
        let cloud = document.createElement("div");
        cloud.classList.add("cloud");
		cloud.innerHTML = cloudContent();
	window.__localTextEditor?.bind(cloud.firstElementChild, cloud.firstElementChild.dataset.copyKey);
        cloud.style.top = randomHeight(cloudHeight) + "px";
        cloud.style.left = "-240px";
        cloud.setAttribute("velocity", randomVelocity());
        container.appendChild(cloud);
    }
}


window.sceneMotion.animate(container.closest('section'), run);
