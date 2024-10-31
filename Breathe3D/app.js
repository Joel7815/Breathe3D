import { initBreathingExercise } from './breathingExercise.js';

function showHomePage() {
    document.getElementById("homePage").style.display = "block";
    document.getElementById("exercisePage").style.display = "none";

    const startButton = document.getElementById("startButton");
    if (startButton) {
        startButton.addEventListener("click", startBreathingExercise);
    } else {
        console.error("Le bouton 'startButton' n'a pas été trouvé dans le DOM.");
    }
}

function startBreathingExercise() {
    document.getElementById("homePage").style.display = "none";
    document.getElementById("exercisePage").style.display = "block";
    initBreathingExercise();
}

// Attendre que le DOM soit chargé
document.addEventListener("DOMContentLoaded", showHomePage);
