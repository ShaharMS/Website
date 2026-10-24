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

function run() {
    let clouds = container.getElementsByClassName("cloud");
    for (const cloud of clouds) {
        if (window.__localTextEditor && cloud.matches(':hover, :focus-within')) continue;
        if (cloud.getBoundingClientRect().x > container.getBoundingClientRect().x + container.getBoundingClientRect().width) {
            container.removeChild(cloud);
        } else {
            cloud.style.left = +parseFloat(cloud.style.left) + +cloud.getAttribute("velocity") + "px";
        }
    }

    if (shouldCreateCloud(container.getBoundingClientRect().width)) {
        let cloud = document.createElement("div");
        cloud.classList.add("cloud");
		cloud.innerHTML = cloudContent();
	window.__localTextEditor?.bind(cloud.firstElementChild, cloud.firstElementChild.dataset.copyKey);
        cloud.style.top = randomHeight(container.getBoundingClientRect().height) + "px";
        cloud.style.left = "-240px";
        cloud.setAttribute("velocity", randomVelocity());
        container.appendChild(cloud);
    }
    requestAnimationFrame(run);
}


requestAnimationFrame(run);
