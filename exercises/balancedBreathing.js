import { BaseBreathingExercise } from './BaseBreathingExercise.js';
import { getExerciseConfig, CONFIG } from '../config/config.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.136';

/**
 * Balanced Breathing exercise - Implements a simple inhale/exhale pattern
 * with smooth transitions and visual feedback
 */
class BalancedBreathing extends BaseBreathingExercise {
    constructor(config) {
        super(config);
        this.reset();
    }

    // Initialize/reset all exercise parameters
    reset() {
        this.isIntro = true;
        this.introStartTime = performance.now();
        this.counter = 1;
        this.phaseDuration = 4000; // 4 seconds per phase
        this.phaseStartTime = performance.now();
        this.initialScale = CONFIG.scale.min;
        this.targetScale = this.exerciseConfig.maxScale;
        this.scale = CONFIG.scale.min;
        this.cycleStage = 0;
        this.lastTime = performance.now();
    }

    // Set up initial phase parameters
    initializePhase() {
        this.counter = 1;
        this.phaseDuration = 4000;
        this.phaseStartTime = performance.now();
        this.initialScale = CONFIG.scale.min;
        this.targetScale = this.exerciseConfig.maxScale;
        this.scale = CONFIG.scale.min;
        this.cycleStage = 0;
    }

    // Create the basic sphere shape for the exercise
    createShape() {
        return new THREE.SphereGeometry(1, 64, 64);
    }

    // Update the instruction text based on current phase
    updateInstruction() {
        if (!this.instructionElement) return;
        const text = this.isIntro ? "Relax and make yourself comfortable" 
                                : this.cycleStage === 0 ? "Inhale" : "Exhale";
        this.instructionElement.innerText = text;
    }

    // Check if it's time to move to the next breathing phase
    shouldMoveToNextPhase() {
        const currentTime = performance.now();
        return currentTime - this.phaseStartTime >= this.phaseDuration;
    }

    // Handle transition between breathing phases
    moveToNextPhase() {
        this.cycleStage = (this.cycleStage + 1) % 2;
        this.counter = this.cycleStage === 0 ? 1 : 4;
        this.phaseStartTime = performance.now();
        
        // Reverse scales for inhale/exhale
        if (this.cycleStage === 0) {
            this.initialScale = CONFIG.scale.min;
            this.targetScale = this.exerciseConfig.maxScale;
        } else {
            this.initialScale = this.exerciseConfig.maxScale;
            this.targetScale = CONFIG.scale.min;
        }
        
        this.updateInstruction();
    }

    // Handle smooth scaling animation of the shape
    adjustShapeScale() {
        const currentTime = performance.now();
        const progress = (currentTime - this.phaseStartTime) / this.phaseDuration;
        const clampedProgress = Math.min(1, Math.max(0, progress));
        
        this.scale = this.initialScale + (this.targetScale - this.initialScale) * clampedProgress;
        this.shape.scale.set(this.scale, this.scale, this.scale);
        
        this.updateCounterBasedOnProgress(clampedProgress);
    }

    // Update the counter display based on animation progress
    updateCounterBasedOnProgress(progress) {
        if (!this.counterElement) return;
        
        if (this.isIntro) {
            this.counterElement.style.display = "none";
            return;
        }
        
        this.counterElement.style.display = "block";
        const totalSteps = 3;
        const stepProgress = progress * totalSteps;
        
        // Calculate counter value based on inhale/exhale phase
        if (this.cycleStage === 0) {
            this.counter = Math.min(4, 1 + Math.floor(stepProgress));
        } else {
            this.counter = Math.max(1, 4 - Math.floor(stepProgress));
        }
        
        this.counterElement.innerText = this.counter;
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
            this.initializePhase();
            this.updateInstruction();
            if (this.shape) {
                this.shape.scale.set(this.scale, this.scale, this.scale);
            }
        }
    }

    // Initialize the exercise and set up UI elements
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
}

// Export functions for exercise manager compatibility
export function initBalancedBreathing(config) {
    const exercise = new BalancedBreathing(config);
    exercise.init();
    return exercise;
}

export function cleanupBalancedBreathing() {
    // Cleanup is handled by the exerciseManager
}
