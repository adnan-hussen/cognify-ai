// public/playback-worklet.js

class PlaybackProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.bufferQueue = [];
      this.port.onmessage = (event) => {
        if (event.data === null) {
          // Clear buffers
          this.bufferQueue = [];
        } else {
          // Append new audio buffer
          this.bufferQueue.push(event.data);
        }
      };
    }
  
    process(inputs, outputs, parameters) {
      const output = outputs[0];
      if (this.bufferQueue.length > 0) {
        const buffer = this.bufferQueue.shift();
        // Assume buffer is Int16Array
        const float32Buffer = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
          float32Buffer[i] = buffer[i] / 0x7FFF;
        }
        output[0].set(float32Buffer);
      } else {
        // If no buffer, output silence
        output[0].fill(0);
      }
      return true;
    }
  }
  
  registerProcessor('playback-worklet', PlaybackProcessor);
  