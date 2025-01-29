import { CONFIG } from './config/config.js';
import { getExerciseConfig } from './config/config.js';

// Map of available exercises with their module paths
const exercises = {
    squareBreathing: './exercises/squareBreathing.js',
    balancedBreathing: './exercises/balancedBreathing.js',
    sleepBreathing: './exercises/sleepBreathing.js'
};

let currentExercise = null;
let selectedExercise = null;
let selectedDuration = 300; // Default duration: 5 minutes
let selectedMusic = '';

// Dynamically loads and initializes the selected breathing exercise
async function loadExercise(exerciseName) {
    // Cleanup previous exercise state
    const oldTimer = document.getElementById("timer");
    if (oldTimer) oldTimer.remove();

    if (currentExercise) {
        await currentExercise.cleanup();
        currentExercise = null;
    }

    // Reset canvas for new exercise
    const container = document.querySelector(".container");
    const oldCanvas = document.getElementById("canvas");
    if (oldCanvas) oldCanvas.remove();
    
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "canvas";
    container.appendChild(newCanvas);

    // Reset UI elements
    const instructionElement = document.getElementById("instruction");
    const counterElement = document.getElementById("counter");
    
    if (instructionElement) {
        instructionElement.remove();
        const newInstruction = document.createElement("div");
        newInstruction.id = "instruction";
        container.appendChild(newInstruction);
    }
    
    if (counterElement) {
        counterElement.remove();
        const newCounter = document.createElement("div");
        newCounter.id = "counter";
        container.appendChild(newCounter);
    }

    // Allow DOM to update before initializing new exercise
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load and initialize the selected exercise module
    const exerciseModulePath = exercises[exerciseName];
    if (!exerciseModulePath) {
        console.error(`Exercise "${exerciseName}" not found.`);
        return;
    }

    try {
        const module = await import(exerciseModulePath);
        const exerciseConfig = getExerciseConfig(exerciseName);
        exerciseConfig.duration = selectedDuration;
        exerciseConfig.music = selectedMusic;
        
        currentExercise = module[`init${capitalizeFirstLetter(exerciseName)}`](exerciseConfig);
        
        if (!currentExercise) {
            console.error('Exercise initialization failed');
            return;
        }
    } catch (err) {
        console.error("Error loading exercise:", err);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Resets application state and returns to home page
async function showHomePage() {
    if (currentExercise) {
        await currentExercise.cleanup();
        currentExercise = null;
    }

    // Reset configuration values
    selectedDuration = 300;
    selectedMusic = '';
    selectedExercise = null;

    // Reset UI elements
    const instructionElement = document.getElementById("instruction");
    const counterElement = document.getElementById("counter");
    if (instructionElement) {
        instructionElement.innerText = "";
        instructionElement.style.display = "none";
        instructionElement.classList.add('hidden');
    }
    if (counterElement) {
        counterElement.innerText = "";
        counterElement.style.display = "none";
        counterElement.classList.add('hidden');
    }

    // Force layout recalculation
    const homePage = document.getElementById("homePage");
    homePage.style.display = "none";
    // Force a reflow
    void homePage.offsetHeight;
    homePage.style.display = "flex";

    document.getElementById("exercisePage").style.display = "none";
}

// Initiates exercise configuration flow
function startExercise(exerciseName) {
    selectedExercise = exerciseName;
    showConfigModal();
}

// Modal management functions
function showConfigModal() {
    const modal = document.getElementById('configModal');
    modal.style.display = 'flex';
    
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });
    
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-duration="300"]`).classList.add('selected');
}

function hideConfigModal() {
    const modal = document.getElementById('configModal');
    modal.classList.remove('open');
    
    // Attendre la fin de l'animation avant de cacher la modale
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // 300ms = durée de la transition CSS
}

// Starts the configured exercise
function initializeExercise() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('exercisePage').style.display = 'block';
    hideConfigModal();
    
    if (selectedDuration === undefined || selectedDuration === null) {
        selectedDuration = 300;
    }
    
    loadExercise(selectedExercise);
}

// Sets up all event listeners and UI interactions
function setupHomePage() {
    const buttons = document.querySelectorAll('.exercise-button');
    const infoBox = document.getElementById('infoBox');
    const infoText = document.getElementById('infoText');

    // Exercise button hover effects
    buttons.forEach(button => {
        button.addEventListener('mouseover', () => {
            const exerciseName = button.dataset.exercise;
            let text = '';

            switch (exerciseName) {
                case 'squareBreathing':
                    text = "Heart rate regulation - Improved concentration - Stress and anxiety management";
                    break;
                case 'balancedBreathing':
                    text = "Respiratory harmonization - Nervous system balance - Physical tension reduction";
                    break;
                case 'sleepBreathing':
                    text = "Relaxation - Heart rate slowdown - Sleep aid";
                    break;
            }

            infoText.innerText = text;
            infoBox.style.display = 'block';
            
            const middleButton = document.querySelector('.exercise-button[data-exercise="balancedBreathing"]');
            const rect = middleButton.getBoundingClientRect();
            infoBox.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
            infoBox.style.top = `${rect.bottom + window.scrollY + 10}px`;
        });

        button.addEventListener('mouseout', () => {
            infoBox.style.display = 'none';
        });
    });

    // Exercise selection handlers
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const exerciseName = button.dataset.exercise;
            selectedMusic = '';
            document.getElementById('ambientMusic').value = '';
            startExercise(exerciseName);
        });
    });

    // Navigation and configuration handlers
    const backButton = document.getElementById("backButton");
    if (backButton) {
        backButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await showHomePage();
        });
    }

    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedDuration = parseInt(e.target.dataset.duration);
        });
    });

    const musicSelect = document.getElementById('ambientMusic');
    musicSelect.addEventListener('change', (e) => {
        selectedMusic = e.target.value;
    });

    document.getElementById('startExerciseBtn').addEventListener('click', initializeExercise);
    document.getElementById('cancelExerciseBtn').addEventListener('click', hideConfigModal);

    // Add info button functionality
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const infoBackButton = document.getElementById('infoBackButton');
    const homePage = document.getElementById('homePage');

    infoButton.addEventListener('click', () => {
        infoModal.style.display = 'block';
        homePage.style.display = 'none';
    });

    infoBackButton.addEventListener('click', () => {
        infoModal.style.display = 'none';
        homePage.style.display = 'flex';
    });
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", setupHomePage);
