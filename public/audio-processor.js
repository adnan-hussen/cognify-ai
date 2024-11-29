// public/audio-processor.js

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.isRecording = false;          // Tracks recording state
      this.bufferSize = 2400;            // Buffer size: ~100ms at 24kHz
      this.currentBuffer = [];           // Buffer for audio samples
  
      // Handle messages from the main thread
      this.port.onmessage = (event) => {
        const { command } = event.data;
        if (command === "START_RECORDING") {
          this.isRecording = true;
          console.log('AudioProcessor: START_RECORDING received.');
        } else if (command === "STOP_RECORDING") {
          this.isRecording = false;
          console.log('AudioProcessor: STOP_RECORDING received.');
          this.flushBuffer();           // Send remaining buffer
        }
      };
    }
  
    /**
     * Converts the buffer to PCM16 format and sends it to the main thread
     */
    flushBuffer() {
      if (this.currentBuffer.length > 0) {
        // Convert Float32Array to PCM16 Int16Array
        const int16Buffer = new Int16Array(this.currentBuffer.length);
        for (let i = 0; i < this.currentBuffer.length; i++) {
          let s = Math.max(-1, Math.min(1, this.currentBuffer[i]));
          int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
  
        // Send the PCM16 data to the main thread
        this.port.postMessage({
          type: "audio-chunk",
          audioData: int16Buffer,
        });
  
        // Clear the buffer after sending
        this.currentBuffer = [];
        console.log('AudioProcessor: Audio chunk sent.');
      }
    }
  
    /**
     * Process method called for each audio frame
     * @param {Float32Array[][]} inputs - Audio input data
     * @param {Float32Array[][]} outputs - Audio output data (unused)
     * @param {Object} parameters - Audio parameters (unused)
     * @returns {boolean} - Keep processor alive
     */
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input && this.isRecording) {
        const audioData = input[0];     // Process first channel data
        this.currentBuffer.push(...audioData);
  
        if (this.currentBuffer.length >= this.bufferSize) {
          this.flushBuffer();           // Send buffer if size is met
        }
      }
  
      return true;                      // Keep processor active
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);
  