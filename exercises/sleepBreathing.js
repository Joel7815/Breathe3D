import { BaseBreathingExercise } from './BaseBreathingExercise.js';
import { getExerciseConfig, CONFIG } from '../config/config.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.136';

/**
 * Sleep Breathing Exercise
 * A specialized breathing exercise designed to help users relax and prepare for sleep
 * Uses a 4-7-8 breathing pattern (inhale for 4, hold for 7, exhale for 8)
 */
class SleepBreathingExercise extends BaseBreathingExercise {
    constructor(config) {
        super(config);
    }

    /**
     * Creates a sphere geometry for the breathing visualization
     * @returns {THREE.SphereGeometry} The sphere geometry
     */
    createShape() {
        return new THREE.SphereGeometry(1, 64, 64);
    }

    /**
     * Handles the shape scaling animation based on the current breathing phase
     * - Phase 0: Inhale (scale up)
     * - Phase 1: Hold (maintain scale)
     * - Phase 2: Exhale (scale down)
     */
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

    /**
     * Determines if the current phase should transition to the next
     * - Inhale phase: moves after 4 counts
     * - Hold phase: moves after 7 counts
     * - Exhale phase: moves after reaching count 1
     * @returns {boolean} True if should move to next phase
     */
    shouldMoveToNextPhase() {
        return (this.cycleStage === 0 && this.counter > 4) || 
               (this.cycleStage === 1 && this.counter > 7) || 
               (this.cycleStage === 2 && this.counter < 1);
    }

    /**
     * Handles transition to the next breathing phase
     * Sets appropriate starting counter values for each phase:
     * - Inhale (Phase 0): starts at 1
     * - Hold (Phase 1): starts at 1
     * - Exhale (Phase 2): starts at 8
     */
    moveToNextPhase() {
        this.cycleStage = (this.cycleStage + 1) % 3;
        this.counter = this.cycleStage === 0 ? 1 : this.cycleStage === 1 ? 1 : 8;
        this.updateInstruction();
    }

    /**
     * Updates the instruction text based on current breathing phase
     * - Phase 0: Inhale
     * - Phase 1: Hold breath
     * - Phase 2: Exhale
     */
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

    /**
     * Updates the counter value
     * Counts up during inhale and hold phases
     * Counts down during exhale phase
     */
    updateCounter() {
        super.updateCounter();
        if (!this.isTransitioning) {
            this.counter = this.cycleStage === 2 ? this.counter - 1 : this.counter + 1;
        }
    }

    /**
     * Handles the introduction animation sequence
     * Shows initial relaxation message, then transitions to breathing instructions
     * @param {number} timestamp Current animation timestamp
     */
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

    /**
     * Sets up and styles the DOM elements used for instructions and counting
     * @returns {boolean} True if setup successful, false otherwise
     */
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

/**
 * Export functions for exercise manager compatibility
 */
let exerciseInstance = null;

export function initSleepBreathing(config) {
    exerciseInstance = new SleepBreathingExercise(config);
    exerciseInstance.init();
    return exerciseInstance;
}

export function cleanupSleepBreathing() {
    // This function can be removed as cleanup is handled by the exercise manager
}
