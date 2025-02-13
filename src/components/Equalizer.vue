<template>
    <div v-draggable v-if="isOpenEq" id="eq" class="eq cursor-move draggable-box">
      <main id="eqMain" ref="eqMain"></main>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, nextTick, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useSongStore } from '../stores/song';
  import draggable from '../utils/DraggableDirective.js';
  
  const useSong = useSongStore();
  const { wavesurfer } = storeToRefs(useSong);
  
  const isOpenEq = ref(true); // Toggle EQ visibility
  const eqMain = ref(null);
  
  const eqBands = [32, 64, 128, 256, 512, 1000, 2000];
  let filters = [];
  let audioContext = null;
  let eqContainer = null;
  
  /**
   * Load saved EQ settings from localStorage.
   * If no setting exists, default gain is 0.
   */
  const loadEqSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem('eqSettings')) || {};
    return eqBands.map((band) => savedSettings[band] ?? 0);
  };
  
  /**
   * Update a single EQ setting (for a given band) in localStorage in real time.
   */
  const updateEqSetting = (band, value) => {
    const savedSettings = JSON.parse(localStorage.getItem('eqSettings')) || {};
    savedSettings[band] = value;
    localStorage.setItem('eqSettings', JSON.stringify(savedSettings));
  };
  
  /**
   * (Optional) Save all EQ settings at once.
   */
  const saveEqSettings = () => {
    const settings = {};
    filters.forEach((filter, i) => {
      settings[eqBands[i]] = filter.gain.value;
    });
    localStorage.setItem('eqSettings', JSON.stringify(settings));
  };
  
  /**
   * Apply the equalizer to the WaveSurfer audio.
   * This creates an audio context (if needed), builds a chain of filters using
   * the saved settings, and connects that chain to WaveSurfer’s media element.
   * Event listeners on the slider inputs update filter gains live.
   */
  const applyEqualizer = (ws) => {
    if (!ws) return;
  
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  
    const audio = ws.getMediaElement();
    if (!audio) {
      console.error("No media element found in wavesurfer");
      return;
    }
    const mediaNode = audioContext.createMediaElementSource(audio);
  
    // Create filters with initial values (using saved settings)
    const savedGains = loadEqSettings();
    filters = eqBands.map((band, i) => {
      const filter = audioContext.createBiquadFilter();
      // Use 'lowshelf' for very low frequencies, 'highshelf' for very high,
      // and 'peaking' for the rest.
      filter.type = band <= 32 ? 'lowshelf' : band >= 16000 ? 'highshelf' : 'peaking';
      filter.frequency.value = band;
      filter.Q.value = 1;
      filter.gain.value = savedGains[i];
      return filter;
    });
  
    // Chain the filters sequentially
    const equalizer = filters.reduce((prev, curr) => {
      prev.connect(curr);
      return curr;
    }, mediaNode);
  
    equalizer.connect(audioContext.destination);
  
    // For each slider input, update the corresponding filter gain live.
    // const sliderInputs = eqContainer.querySelectorAll('.range-slider input');
    // sliderInputs.forEach((input, i) => {
    //   input.addEventListener('input', (e) => {
    //     const value = parseFloat(e.target.value);
    //     filters[i].gain.value = value;
    //     // Update only the changed band in localStorage.
    //     updateEqSetting(eqBands[i], value);
    //   });
    // });

  };
  
  /**
   * Build the equalizer UI (sliders and reset button) and insert it into the component.
   */
  const setupEqualizer = () => {
    eqContainer = document.createElement('div');
    eqContainer.classList.add('sliders', 'no-drag');
  
    // Create Reset Button
    const resetEq = document.createElement('button');
    resetEq.textContent = 'Reset';
    resetEq.classList.add('eq-reset-button');
    eqContainer.appendChild(resetEq);
  
   resetEq.addEventListener('click', () => {
  // Reset localStorage: set all EQ bands to 0.
  const newSettings = {};
  eqBands.forEach((band) => {
    newSettings[band] = 0;
  });
  localStorage.setItem('eqSettings', JSON.stringify(newSettings));

  // Reset filter gains and slider input values.
  filters.forEach((filter, i) => {
    filter.gain.value = 0;
    const input = eqContainer.querySelectorAll('.range-slider input')[i];
    if (input) {
      input.value = 0;
    }
  });

  // Update the UI for each slider.
  const thumbs = eqContainer.querySelectorAll('.range-slider__thumb');
  const bars = eqContainer.querySelectorAll('.range-slider__bar');
  eqContainer.querySelectorAll('.range-slider input').forEach((input, i) => {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    if (thumbs[i]) thumbs[i].style.bottom = `${pct}%`;
    if (bars[i]) bars[i].style.height = `${pct}%`;
  });
});
  
    // Create a slider for each EQ band.
    eqBands.forEach((band, i) => {
      const sliderWrapper = document.createElement('div');
      sliderWrapper.classList.add('range-slider');
  
      const label = document.createElement('div');
  
      // Create the hidden slider input.
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = -40;
      slider.max = 40;
      slider.step = 0.1;
      slider.value = loadEqSettings()[i];
      slider.classList.add('hidden');
  
      const sliderBar = document.createElement('div');
      sliderBar.classList.add('range-slider__bar');
  
      const sliderThumb = document.createElement('div');
      sliderThumb.classList.add('range-slider__thumb');
  
      
          // Update the custom UI, update the filter gain (if created), and update localStorage in realtime.
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      const minVal = parseFloat(e.target.min);
      const maxVal = parseFloat(e.target.max);
      const pct = ((value - minVal) / (maxVal - minVal)) * 100;
      sliderThumb.style.bottom = `${pct}%`;
      sliderBar.style.height = `${pct}%`;
      updateEqSetting(eqBands[i], value);
      // If filters have been created, update the filter gain in real time.
      if (filters[i]) {
        filters[i].gain.value = value;
      }
    });
      // Set initial positions.
      const initialPct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
      sliderThumb.style.bottom = `${initialPct}%`;
      sliderBar.style.height = `${initialPct}%`;
  
      // Simulate click-and-drag on the slider wrapper.
      sliderWrapper.addEventListener('mousedown', (e) => {
        const rect = sliderWrapper.getBoundingClientRect();
        const updateSlider = (event) => {
          let pct = 1 - (event.clientY - rect.top) / rect.height;
          pct = Math.max(0, Math.min(1, pct));
          const value = (pct * (parseFloat(slider.max) - parseFloat(slider.min))) + parseFloat(slider.min);
          slider.value = value.toFixed(1);
          slider.dispatchEvent(new Event('input'));
        };
  
        updateSlider(e);
        const mouseMoveHandler = (event) => {
          updateSlider(event);
        };
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', () => {
          document.removeEventListener('mousemove', mouseMoveHandler);
        }, { once: true });
      });
  
      sliderWrapper.appendChild(slider);
      sliderWrapper.appendChild(sliderBar);
      sliderWrapper.appendChild(sliderThumb);
      sliderWrapper.appendChild(label);
  
      eqContainer.appendChild(sliderWrapper);
    });
  
    if (eqMain.value) {
      eqMain.value.appendChild(eqContainer);
    } else {
      console.error("Element with id 'eqMain' not found.");
    }
  };
  
  // Watch for changes in the WaveSurfer instance. Once available,
  // attach the equalizer when the track plays.
  watch(() => wavesurfer.value, (ws) => {
    if (ws) {
      ws.once('play', () => {
        applyEqualizer(ws);
      });
    }
  });
  
  onMounted(async () => {
    await nextTick();
    setupEqualizer();
  });
  </script>
  
  <script>
  export default {
    directives: {
      draggable, // Register the custom draggable directive
    },
  };
  </script>
  
  <style scoped>
  .eq {
    display: flex;
    position: absolute;
    flex-direction: column;
    align-items: center;
    background: #1f2225f5;
    padding: 1rem;
    border-radius: 8px;
    width: fit-content;
    z-index: 50;
    left: 30%;
    transform: translate(-50%, 60%);
  }
  
  .sliders {
    display: flex;
    gap: 10px;
  }
  
  .range-slider {
    position: relative;
    width: 50px;
    height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    background: #444;
    padding: 5px;
    border-radius: 5px;
  }
  
  .range-slider input {
    display: none !important;
  }
  
  .range-slider__bar {
    position: absolute;
    width: 10px;
    background: #2196f3;
    bottom: 0;
    transition: height 0.1s ease-out;
    border-radius: 5px;
  }
  
  .range-slider__thumb {
    position: absolute;
    width: 18px;
    height: 18px;
    background: red;
    border-radius: 50%;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    transition: bottom 0.1s ease-out;
  }
  
  .eq-reset-button {
    margin-bottom: 10px;
    padding: 5px 10px;
    background: #000;
    color: white;
    cursor: pointer;
    border: none;
    border-radius: 5px;
  }
  </style>
  