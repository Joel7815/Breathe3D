import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import { getAnimationConfig, CONFIG } from '../config/config.js';
import { AudioManager } from '../audio/AudioManager.js';

/**
 * Base class for all breathing exercises implementing core functionality.
 * Handles the common features like 3D rendering, animation timing, and state management.
 */
export class BaseBreathingExercise {
    constructor(exerciseConfig) {
        // Core configuration and state
        this.exerciseConfig = exerciseConfig;
        this.animConfig = getAnimationConfig();
        this.scale = CONFIG.scale.min;
        this.cycleStage = 0;
        this.counter = 1;
        this.lastTime = 0;
        this.isIntro = true;
        this.isTransitioning = false;
        
        // Animation timing
        this.introDuration = this.animConfig.introDuration;
        this.transitionDuration = this.animConfig.transitionDuration;
        this.interval = this.animConfig.interval;
        
        // Light properties
        this.lightIntensity = {
            min: 0.5,
            max: 2
        };
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.shape = null;
        
        // UI elements
        this.instructionElement = null;
        this.counterElement = null;
        this.animationId = null;

        // Timer properties
        this.duration = null;
        this.startTime = null;
        this.timerElement = null;
        this.isInfinite = false;

        // Audio system
        this.audioManager = new AudioManager();

        // Add background transition properties
        this.introBackgroundColor = new THREE.Color(this.exerciseConfig.introBackground);
        this.finalBackgroundColor = new THREE.Color(0x000000); // Final color (black)
    }

    /**
     * Abstract methods that must be implemented by child classes
     */
    createShape() {
        throw new Error('createShape must be implemented');
    }

    updateInstruction() {
        throw new Error('updateInstruction must be implemented');
    }

    moveToNextPhase() {
        throw new Error('moveToNextPhase must be implemented');
    }

    shouldMoveToNextPhase() {
        throw new Error('shouldMoveToNextPhase must be implemented');
    }

    /**
     * Initializes the exercise, setting up the 3D scene, DOM elements, and starting the animation
     */
    init() {
        let canvas = document.getElementById("canvas");
        if (!canvas) {
            const container = document.querySelector(".container");
            canvas = document.createElement("canvas");
            canvas.id = "canvas";
            container.appendChild(canvas);
        }

        if (!this.setupDOMElements()) return;
        if (!this.setupScene(canvas)) return;

        this.introStartTime = performance.now();
        this.lastTime = performance.now();

        // Remove existing timer if present
        const oldTimer = document.getElementById("timer");
        if (oldTimer) oldTimer.remove();

        // Create and setup timer element
        this.timerElement = document.createElement("div");
        this.timerElement.id = "timer";
        const container = document.querySelector(".container");
        container.appendChild(this.timerElement);
        
        requestAnimationFrame(() => {
            this.timerElement.classList.add('visible');
        });

        // Initialize timer and duration
        this.duration = this.exerciseConfig.duration;
        this.isInfinite = this.duration === -1;
        this.startTime = null;

        // Initialize audio if music is selected
        if (this.exerciseConfig.music) {
            this.audioPromise = this.audioManager.play(this.exerciseConfig.music).catch(error => {
                console.error("Error initializing audio:", error);
            });
        }

        this.animate();
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    /**
     * Cleans up resources and stops the exercise
     */
    async cleanup() {
        try {
            // Arrêter l'animation immédiatement
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

            // S'assurer que l'audio est complètement arrêté
            if (this.audioManager) {
                await this.audioManager.stop();
                this.audioManager = null;  // Important: libérer la référence
            }

            // Nettoyer les ressources Three.js
            if (this.scene) {
                if (this.light) {
                    this.scene.remove(this.light);
                    this.light = null;
                }
                
                while(this.scene.children.length > 0) { 
                    this.scene.remove(this.scene.children[0]);
                }
                this.scene = null;
            }
            
            if (this.renderer) {
                this.renderer.dispose();
                this.renderer.domElement.remove();
                this.renderer = null;
            }

            // Supprimer les event listeners
            window.removeEventListener('resize', this.onWindowResize.bind(this));

            // Réinitialiser les autres propriétés
            this.camera = null;
            this.shape = null;
            this.timerElement = null;
            this.duration = null;
            this.startTime = null;
            this.isInfinite = false;
            this.ambientLight = null;

        } catch (error) {
            console.error("Error during cleanup:", error);
        }
    }

    /**
     * Sets up the Three.js scene with lights and shapes
     */
    setupScene(canvas) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Create main shape
        const geometry = this.createShape();
        const material = new THREE.MeshPhongMaterial({ 
            color: this.exerciseConfig.color,
            shininess: 60,
            emissive: this.exerciseConfig.color,
            emissiveIntensity: 0.5
        });
        this.shape = new THREE.Mesh(geometry, material);
        
        // Create glow shape (slightly larger than main shape)
        const glowGeometry = this.createShape();
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.exerciseConfig.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.FrontSide
        });
        this.glowShape = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowShape.scale.multiplyScalar(1.2);
        
        // Create outer glow shape
        const outerGlowGeometry = this.createShape();
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.exerciseConfig.color,
            transparent: true,
            opacity: 0.1,
            side: THREE.FrontSide
        });
        this.outerGlowShape = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        this.outerGlowShape.scale.multiplyScalar(1.4);

        // Create back glow shapes (for back effect)
        const backGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.exerciseConfig.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.backGlowShape = new THREE.Mesh(glowGeometry, backGlowMaterial);
        this.backGlowShape.scale.multiplyScalar(1.2);

        const outerBackGlowMaterial = new THREE.MeshBasicMaterial({
            color: this.exerciseConfig.color,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        this.outerBackGlowShape = new THREE.Mesh(outerGlowGeometry, outerBackGlowMaterial);
        this.outerBackGlowShape.scale.multiplyScalar(1.4);

        // Add shapes to scene in the correct order
        this.scene.add(this.outerBackGlowShape);
        this.scene.add(this.backGlowShape);
        this.scene.add(this.outerGlowShape);
        this.scene.add(this.glowShape);
        this.scene.add(this.shape);

        // Add lights
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(this.ambientLight);

        this.light = new THREE.PointLight(this.exerciseConfig.color, this.lightIntensity.min, 10);
        this.light.position.set(0, 0, 3);
        this.scene.add(this.light);

        return this.renderer.domElement;
    }

    setupDOMElements() {
        this.instructionElement = document.getElementById("instruction");
        this.counterElement = document.getElementById("counter");

        if (!this.instructionElement || !this.counterElement) return false;

        this.instructionElement.style.display = "block";
        this.instructionElement.style.opacity = "1";
        this.instructionElement.classList.remove('hidden');
        this.instructionElement.innerText = "Détendez-vous et mettez-vous à l'aise";

        this.counterElement.style.display = "none";
        this.counterElement.style.opacity = "1";
        this.counterElement.classList.remove('hidden');
        this.counterElement.innerText = "";
        this.counterElement.style.color = "#FFFFFF";
        this.counterElement.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.7)";
        
        return true;
    }

    animate(timestamp) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);

        if (this.isIntro) {
            this.handleIntroAnimation(timestamp);
            return;
        }

        this.adjustShapeScale();
        if (timestamp - this.lastTime >= this.interval) {
            this.updateCounter();
            this.lastTime = timestamp;
        }

        // Add timer update
        this.updateTimer();
    }

    handleIntroAnimation(timestamp) {
        // Keep shape at constant scale during intro
        this.scale = 1;
        this.shape.scale.set(this.scale, this.scale, this.scale);
        
        // Calculate progress of intro animation (0 to 1)
        const progress = Math.min(1, (timestamp - this.introStartTime) / this.introDuration);
        
        // Interpolate background color
        const currentColor = new THREE.Color();
        currentColor.lerpColors(this.introBackgroundColor, this.finalBackgroundColor, progress);
        this.scene.background = currentColor;
        
        if (timestamp - this.introStartTime >= this.introDuration) {
            this.isIntro = false;
            this.cycleStage = 0;
            this.lastTime = timestamp;
            this.startTime = Date.now();
            this.updateInstruction();
            if (this.counterElement) {
                this.counterElement.style.display = "block";
            }
        }
    }

    onWindowResize() {
        if (!this.renderer || !this.camera) return;  // Ajouter cette vérification
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updateCounter() {
        if (this.isTransitioning) return;

        this.updateCounterDisplay();
        
        // Vérifier si nous devons passer à la phase suivante
        if (this.shouldMoveToNextPhase()) {
            this.startPhaseTransition();
            return;
        }
    }

    startPhaseTransition() {
        this.isTransitioning = true;
        this.hideCounter();

        setTimeout(() => {
            this.moveToNextPhase();
            this.showCounter();
            this.isTransitioning = false;
        }, this.transitionDuration);
    }

    showCounter() {
        if (this.counterElement) {
            this.counterElement.style.display = "block";
            this.updateCounterDisplay();
        }
    }

    hideCounter() {
        if (this.counterElement) {
            this.counterElement.style.display = "none";
        }
    }

    updateCounterDisplay() {
        if (!this.counterElement) return;
        this.counterElement.innerText = this.counter;
    }

    updateTimer() {
        if (!this.timerElement || this.isInfinite) return;

        // Don't start countdown during intro
        if (this.isIntro) {
            this.timerElement.innerText = `${Math.floor(this.duration / 60)}:${(this.duration % 60).toString().padStart(2, '0')}`;
            return;
        }

        // Ensure startTime is defined before calculating elapsed time
        if (!this.startTime) {
            this.startTime = Date.now();
        }

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const remaining = Math.max(0, this.duration - elapsed);

        // Only end exercise if remaining time is actually 0
        if (remaining <= 0) {
            this.endExercise();
            return;
        }

        // Format remaining time
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        this.timerElement.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    endExercise() {
        console.log("endExercise called");
        
        // Ensure audio is stopped before cleanup
        this.audioManager.stop().then(() => {
            // Force a reflow of the home page
            const homePage = document.getElementById('homePage');
            homePage.style.display = 'none';
            
            // Force layout recalculation
            void homePage.offsetHeight;
            
            // Show home page with flex display
            homePage.style.display = 'flex';
            
            // Hide exercise page
            document.getElementById('exercisePage').style.display = 'none';
            
            this.cleanup();
        });
    }

    adjustShapeScale() {
        // Update all shapes' scales
        this.shape.scale.set(this.scale, this.scale, this.scale);
        this.glowShape.scale.set(this.scale * 1.2, this.scale * 1.2, this.scale * 1.2);
        this.outerGlowShape.scale.set(this.scale * 1.4, this.scale * 1.4, this.scale * 1.4);
        this.backGlowShape.scale.set(this.scale * 1.2, this.scale * 1.2, this.scale * 1.2);
        this.outerBackGlowShape.scale.set(this.scale * 1.4, this.scale * 1.4, this.scale * 1.4);
        
        // Déterminer si nous sommes en phase d'expiration (cycleStage 2)
        const isExhaling = this.cycleStage === 2;
        
        if (isExhaling) {
            // Pendant l'expiration, opacité maximale immédiate
            this.glowShape.material.opacity = 0.45;
            this.outerGlowShape.material.opacity = 0.15;
            this.backGlowShape.material.opacity = 0.45;
            this.outerBackGlowShape.material.opacity = 0.15;
        } else {
            // Pendant l'inspiration, augmentation progressive
            const scaleRange = this.exerciseConfig.maxScale - CONFIG.scale.min;
            const currentScaleProgress = (this.scale - CONFIG.scale.min) / scaleRange;
            const additionalOpacity = 0.3 * currentScaleProgress;
            const baseOpacity = 0.15;
            
            this.glowShape.material.opacity = baseOpacity + additionalOpacity;
            this.outerGlowShape.material.opacity = (baseOpacity + additionalOpacity) * 0.33;
            this.backGlowShape.material.opacity = baseOpacity + additionalOpacity;
            this.outerBackGlowShape.material.opacity = (baseOpacity + additionalOpacity) * 0.33;
        }
        
        // Update light intensity
        if (this.light) {
            const scaleRange = this.exerciseConfig.maxScale - CONFIG.scale.min;
            const currentScaleProgress = (this.scale - CONFIG.scale.min) / scaleRange;
            const mainIntensity = this.lightIntensity.min + 
                (this.lightIntensity.max - this.lightIntensity.min) * currentScaleProgress;
            this.light.intensity = mainIntensity;
        }
    }
}