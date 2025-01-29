import { BaseBreathingExercise } from './BaseBreathingExercise.js';
import { getExerciseConfig, CONFIG } from '../config/config.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.136';

class SquareBreathing extends BaseBreathingExercise {
    constructor(config) {
        super(config);
        this.reset();
    }

    // Initialize all exercise parameters to their default values
    reset() {
        this.isIntro = true;
        this.introStartTime = performance.now();
        this.counter = 1;
        this.phaseDuration = this.exerciseConfig.defaultCounter * 1000; // Convert to milliseconds
        this.phaseStartTime = performance.now();
        this.scale = CONFIG.scale.min;
        this.cycleStage = 0;
        this.lastTime = performance.now();
    }

    // Create a sphere geometry for the square breathing visualization
    createShape() {
        return new THREE.SphereGeometry(1, 64, 64);
    }

    // Update breathing instructions based on current phase
    // Phases: 0 = inhale, 1 = hold, 2 = exhale, 3 = hold
    updateInstruction() {
        if (!this.instructionElement) return;
        
        let instructionText;
        if (this.isIntro) {
            instructionText = "Relax and make yourself comfortable";
        } else {
            switch (this.cycleStage) {
                case 0: instructionText = "Inhale"; break;
                case 1: instructionText = "Hold your breath"; break;
                case 2: instructionText = "Exhale"; break;
                case 3: instructionText = "Hold your breath"; break;
            }
        }
        this.instructionElement.innerText = instructionText;
    }

    // Check if current phase duration has elapsed
    shouldMoveToNextPhase() {
        const currentTime = performance.now();
        return currentTime - this.phaseStartTime >= this.phaseDuration;
    }

    // Progress to next breathing phase in the cycle
    moveToNextPhase() {
        this.cycleStage = (this.cycleStage + 1) % 4;
        this.phaseStartTime = performance.now();
        this.counter = 4;
        this.updateInstruction();
    }

    // Handle shape scaling animation based on breathing phase
    adjustShapeScale() {
        // Skip scale adjustment during intro
        if (this.isIntro) {
            const fixedScale = 1;
            this.scale = fixedScale;
            this.shape.scale.set(fixedScale, fixedScale, fixedScale);
            return;
        }

        const scaleStep = (this.exerciseConfig.maxScale - CONFIG.scale.min) / (this.phaseDuration / 16);

        if (this.cycleStage === 0) { // Inhale phase
            this.scale += scaleStep;
            if (this.scale > this.exerciseConfig.maxScale) {
                this.scale = this.exerciseConfig.maxScale;
            }
        } else if (this.cycleStage === 2) { // Exhale phase
            this.scale -= scaleStep;
            if (this.scale < CONFIG.scale.min) {
                this.scale = CONFIG.scale.min;
            }
        }
        this.shape.scale.set(this.scale, this.scale, this.scale);
    }

    // Update counter display with proper counting direction for each phase
    updateCounterDisplay() {
        if (!this.counterElement) return;
        
        if (this.isIntro) {
            this.counterElement.style.display = "none";
            return;
        }
        
        const currentTime = performance.now();
        const elapsedTime = currentTime - this.phaseStartTime;
        const progress = elapsedTime / this.phaseDuration;
        
        // Count up for inhale and first hold phases
        // Count down for exhale and second hold phases
        if (this.cycleStage === 0 || this.cycleStage === 1) {
            this.counter = Math.max(1, Math.floor(1 + (progress * 4)));
        } else {
            this.counter = Math.ceil(4 - (progress * 4));
        }
        
        // Ensure counter stays within bounds
        this.counter = Math.min(Math.max(this.counter, 1), 4);
        
        this.counterElement.style.display = "block";
        this.counterElement.innerText = this.counter;
    }

    // Initialize exercise and UI elements
    init() {
        this.reset();
        super.init();
        
        if (this.instructionElement) {
            this.instructionElement.style.display = "block";
            this.instructionElement.style.opacity = "1";
            this.instructionElement.classList.remove('hidden');
            this.instructionElement.innerText = "Relax and make yourself comfortable";
        }
        
        if (this.counterElement) {
            this.counterElement.style.display = "none";
            this.counterElement.style.opacity = "1";
            this.counterElement.classList.remove('hidden');
            this.counterElement.innerText = "";
        }

        if (this.shape) {
            this.scale = CONFIG.scale.min;
            this.shape.scale.set(this.scale, this.scale, this.scale);
        }
    }

    // Handle the introduction animation sequence
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
            this.counter = 1;
            this.scale = CONFIG.scale.min;
            this.shape.scale.set(this.scale, this.scale, this.scale);
            this.updateInstruction();
            if (this.counterElement) {
                this.counterElement.style.display = "block";
                this.counterElement.innerText = this.counter;
            }
        }
    }
}

// Export initialization and cleanup functions for exercise manager
export function initSquareBreathing(config) {
    const exercise = new SquareBreathing(config);
    exercise.reset();
    exercise.init();
    return exercise;
}

export function cleanupSquareBreathing() {
    // Cleanup is handled by the exerciseManager
}
