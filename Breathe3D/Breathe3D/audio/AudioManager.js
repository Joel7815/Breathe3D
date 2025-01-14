/**
 * Manages audio playback for breathing exercises
 * Handles background ambient sounds with proper loading and cleanup
 */
export class AudioManager {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        // Map of available ambient sounds with their file paths
        this.musicMap = {
            'rain': './audio/rain.mp3',
            'waves': './audio/waves.mp3',
            'forest': './audio/forest.mp3',
            'whitenoise': './audio/whitenoise.mp3'
        };
    }

    /**
     * Starts playing the selected ambient sound
     * @param {string} musicType - Type of ambient sound to play
     * @returns {Promise} Resolves when audio starts playing or rejects on error
     */
    async play(musicType) {
        if (!this.musicMap[musicType]) {
            console.warn("Invalid music type:", musicType);
            return;
        }
    
        // Stop any currently playing audio before starting new one
        if (this.isPlaying) {
            await this.stop();
        }
    
        try {
            // Create and configure audio context (Firefox compatibility)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Fetch audio file
            const response = await fetch(this.musicMap[musicType]);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create and configure source
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.loop = true;
            
            // Create and configure gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.5;
            
            // Connect nodes
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // Start playback
            this.source.start(0);
            this.isPlaying = true;
        } catch (error) {
            console.error("Error playing audio:", error);
            this.isPlaying = false;
        }
    }
    
    /**
     * Stops the currently playing audio and cleans up resources
     * @returns {Promise} Resolves when audio is fully stopped
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.source) {
                try {
                    this.source.stop();
                    this.source.disconnect();
                    this.gainNode.disconnect();
                    this.audioContext.close();
                    this.source = null;
                    this.gainNode = null;
                    this.audioContext = null;
                } catch (error) {
                    console.error("Error stopping audio:", error);
                }
            }
            this.isPlaying = false;
            resolve();
        });
    }
} 