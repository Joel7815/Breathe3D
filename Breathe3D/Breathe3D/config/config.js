// Core configuration object for the breathing application
export const CONFIG = {
  // Animation timing settings (in milliseconds)
  animation: {
    introDuration: 12000,     // Duration of the initial introduction phase
    transitionDuration: 500,  // Duration of transitions between phases
    interval: 1000,          // Base interval for animation updates
  },
  
  // Scale ranges for shape animations
  scale: {
    min: 0.8,  // Légèrement plus petit que l'original
    max: {   // Maximum scale per exercise type
      squareBreathing: 1.8,
      balancedBreathing: 1.8,
      sleepBreathing: 1.8,
    },
  },
  
  // Color definitions for each exercise type (in hexadecimal)
  colors: {
    squareBreathing: 0xD8B4E2,    // Soft Lavender
    balancedBreathing: 0xFADCC8,  // Pastel Peach
    sleepBreathing: 0xF5E3B3,     // Ivory Yellow
  },
  
  // Exercise-specific configuration
  shapes: {
    squareBreathing: {
      phases: 4,        // Number of phases in the exercise
      defaultCounter: 4, // Default countdown value
    },
    balancedBreathing: {
      phases: 2,
      defaultCounter: 4,
    },
    sleepBreathing: {
      phases: 3,
      defaultCounter: 8,
    },
  },
};

// Returns specific configuration for a given exercise type
export function getExerciseConfig(exerciseName) {
    return {
        maxScale: CONFIG.scale.max[exerciseName],
        color: CONFIG.colors[exerciseName],
        phases: CONFIG.shapes[exerciseName].phases,
        defaultCounter: CONFIG.shapes[exerciseName].defaultCounter,
    };
}

// Returns animation timing configuration
export function getAnimationConfig() {
    return CONFIG.animation;
} 