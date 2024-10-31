// Importation de Three.js
import * as THREE from 'https://cdn.skypack.dev/three@0.136';

let scene, camera, renderer, cube;
let scale = 1;
let cycleStage = 0;
let counter = 4;

export function initBreathingExercise() {
    setupScene();
    setupCounter(); // Appel de la fonction ajoutée
    animate();
    setInterval(updateCounter, 1000);
}

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas") });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
}

function setupCounter() {
    const counterElement = document.getElementById("counter");
    if (counterElement) {
        counterElement.innerText = counter; // Initialise l'affichage du compteur
    } else {
        console.error("L'élément 'counter' n'a pas été trouvé dans le DOM.");
    }
}

function animate() {
    requestAnimationFrame(animate);
    adjustCubeScale();
    renderer.render(scene, camera);
}

function adjustCubeScale() {
    if (cycleStage === 0) {
        scale += 0.01;
        cube.scale.set(scale, scale, scale);
    } else if (cycleStage === 2) {
        scale -= 0.01;
        cube.scale.set(scale, scale, scale);
    }
}

function updateCounter() {
    if (counter === 0) {
        cycleStage = (cycleStage + 1) % 4;
        counter = 4;
        updateInstruction();
    }
    document.getElementById("counter").innerText = counter;
    counter--;
}

function updateInstruction() {
    const instructionDisplay = document.getElementById("instruction");
    console.log("Mise à jour des instructions pour le cycleStage:", cycleStage);
    switch (cycleStage) {
        case 0:
            instructionDisplay.innerText = "Inspirez";
            scale = 1;
            break;
        case 1:
            instructionDisplay.innerText = "Gardez votre respiration";
            break;
        case 2:
            instructionDisplay.innerText = "Expirez";
            break;
        case 3:
            instructionDisplay.innerText = "Gardez votre respiration";
            break;
    }
}

