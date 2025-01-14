import { BaseBreathingExercise } from './BaseBreathingExercise.js';
import { getExerciseConfig, CONFIG } from '../config/config.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.136';

class SleepBreathingExercise extends BaseBreathingExercise {
    constructor(config) {
        super(config);
    }

    createShape() {
        return new THREE.SphereGeometry(1, 64, 64);
    }

    adjustShapeScale() {
        if (this.cycleStage === 0) {
            this.scale += 0.0025;
            if (this.scale > this.exerciseConfig.maxScale) this.scale = this.exerciseConfig.maxScale;
        } else if (this.cycleStage === 2) {
            this.scale -= 0.0025;
            if (this.scale < CONFIG.scale.min) this.scale = CONFIG.scale.min;
        }
        this.shape.scale.set(this.scale, this.scale, this.scale);
    }

    shouldMoveToNextPhase() {
        return (this.cycleStage === 0 && this.counter > 4) || 
               (this.cycleStage === 1 && this.counter > 7) || 
               (this.cycleStage === 2 && this.counter < 1);
    }

    moveToNextPhase() {
        this.cycleStage = (this.cycleStage + 1) % 3;
        this.counter = this.cycleStage === 0 ? 1 : this.cycleStage === 1 ? 1 : 8;
        this.updateInstruction();
    }

    updateInstruction() {
        if (!this.instructionElement) return;
        
        switch (this.cycleStage) {
            case 0:
                this.instructionElement.innerText = "Inhale";
                this.scale = 1;
                break;
            case 1:
                this.instructionElement.innerText = "Hold your breath";
                break;
            case 2:
                this.instructionElement.innerText = "Exhale";
                break;
        }
    }

    updateCounter() {
        super.updateCounter();
        if (!this.isTransitioning) {
            this.counter = this.cycleStage === 2 ? this.counter - 1 : this.counter + 1;
        }
    }

    handleIntroAnimation(timestamp) {
        super.handleIntroAnimation(timestamp);

        const introHalfDuration = this.introDuration / 2;
        if (timestamp - this.introStartTime >= introHalfDuration) {
            this.instructionElement.innerText = "Focus on your breathing";
        }
        
        if (timestamp - this.introStartTime >= this.introDuration) {
            this.isIntro = false;
            this.cycleStage = 0;
            this.phaseStartTime = performance.now();
            this.scale = CONFIG.scale.min;
            this.shape.scale.set(this.scale, this.scale, this.scale);
            this.updateInstruction();
            if (this.counterElement) {
                this.counterElement.style.display = "block";
            }
        }
    }

    setupDOMElements() {
        this.instructionElement = document.getElementById("instruction");
        this.counterElement = document.getElementById("counter");

        if (!this.instructionElement || !this.counterElement) return false;

        this.instructionElement.style.display = "block";
        this.instructionElement.style.opacity = "1";
        this.instructionElement.classList.remove('hidden');
        this.instructionElement.innerText = "Relax and make yourself comfortable";

        this.counterElement.style.display = "none";
        this.counterElement.style.opacity = "1";
        this.counterElement.classList.remove('hidden');
        this.counterElement.innerText = "";
        this.counterElement.style.color = "#FFFFFF";
        this.counterElement.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.7)";
        
        return true;
    }
}

// Fonctions d'export pour la compatibilité avec le gestionnaire d'exercices
let exerciseInstance = null;

export function initSleepBreathing(config) {
    exerciseInstance = new SleepBreathingExercise(config);
    exerciseInstance.init();
    return exerciseInstance;
}

export function cleanupSleepBreathing() {
    // Cette fonction peut être supprimée
}
