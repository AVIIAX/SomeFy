class AudioProcessorWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Float32Array(BUFFER_SIZE * 2); // Buffer size for two channels
    this.soundTouch = new SoundTouch();
    this.soundTouch.pitch = 1.0; // Default pitch
    this.soundTouch.tempo = 1.0; // Default tempo
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const numFrames = output[0].length;

    const left = output[0];
    const right = output[1];

    const framesExtracted = this.soundTouch.extract(this.samples, numFrames);
    if (framesExtracted === 0) {
      this.port.postMessage({ type: 'stop' });
    }

    for (let i = 0; i < framesExtracted; i++) {
      left[i] = this.samples[i * 2];
      right[i] = this.samples[i * 2 + 1];
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessorWorklet);
