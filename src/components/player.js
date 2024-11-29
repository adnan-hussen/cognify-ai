// src/components/player.js

export class Player {
    constructor() {
      this.audioContext = null;
      this.playbackNode = null;
    }
  
    /**
     * Initializes the AudioContext and registers the playback worklet.
     * @param {number} sampleRate - The sample rate for the AudioContext.
     */
    async init(sampleRate) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      await this.audioContext.audioWorklet.addModule('/playback-worklet.js'); // Ensure this path is correct
  
      this.playbackNode = new AudioWorkletNode(this.audioContext, 'playback-worklet');
      this.playbackNode.connect(this.audioContext.destination);
    }
  
    /**
     * Plays the provided Int16Array audio buffer.
     * @param {Int16Array} buffer - The audio buffer to play.
     */
    play(buffer) {
      if (this.playbackNode && buffer instanceof Int16Array) {
        this.playbackNode.port.postMessage(buffer);
      }
    }
  
    /**
     * Clears the playback buffers.
     */
    clear() {
      if (this.playbackNode) {
        this.playbackNode.port.postMessage(null);
      }
    }
  }
  