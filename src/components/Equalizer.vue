<template>
  <div v-draggable v-if="isOpenEq" id="eq" class="eq cursor-move draggable-box">
    <main id="eqMain" ref="eqMain"></main>
  </div>
  <weq8-ui />
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useSongStore } from '../stores/song';
import draggable from '../utils/DraggableDirective.js';
import 'https://cdn.skypack.dev/weq8/ui';

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
 * Update a single EQ setting in localStorage in real time.
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
 * (This example uses the media element source from WaveSurfer.)
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

  // Create filters using saved settings
  const savedGains = loadEqSettings();
  filters = eqBands.map((band, i) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = band <= 32 ? 'lowshelf' : band >= 16000 ? 'highshelf' : 'peaking';
    filter.frequency.value = band;
    filter.Q.value = 1;
    filter.gain.value = savedGains[i];
    return filter;
  });

  // Chain the filters sequentially
  const equalizerChain = filters.reduce((prev, curr) => {
    prev.connect(curr);
    return curr;
  }, mediaNode);

  equalizerChain.connect(audioContext.destination);
};

/**
 * Build the equalizer UI (sliders and reset button) and insert it.
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

    // Reset filter gains and slider values.
    filters.forEach((filter, i) => {
      filter.gain.value = 0;
      const input = eqContainer.querySelectorAll('.range-slider input')[i];
      if (input) {
        input.value = 0;
      }
    });

    // Update slider UI.
    const thumbs = eqContainer.querySelectorAll('.range-slider__thumb');
    const bars = eqContainer.querySelectorAll('.range-slider__bar');
    eqContainer.querySelectorAll('.range-slider input').forEach((input, i) => {
      const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      if (thumbs[i]) thumbs[i].style.bottom = `${pct}%`;
      if (bars[i]) bars[i].style.height = `${pct}%`;
    });

    // Update the effects chain in WaveSurfer.
    if (wavesurfer.value) {
      useSong.updateEffectsChain();
    }
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

    // Update UI and localStorage on input.
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      const minVal = parseFloat(e.target.min);
      const maxVal = parseFloat(e.target.max);
      let pct = ((value - minVal) / (maxVal - minVal)) * 100;
      sliderThumb.style.bottom = `${pct}%`;
      sliderBar.style.height = `${pct}%`;
      updateEqSetting(eqBands[i], value);
      if (filters[i]) {
        filters[i].gain.value = value;
      }
      // Update the effects chain in WaveSurfer.
      if (wavesurfer.value) {
        useSong.updateEffectsChain();
      }
    });

    // Set initial positions.
    const initialPct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    sliderThumb.style.bottom = `${initialPct}%`;
    sliderBar.style.height = `${initialPct}%`;

    // Enable click-and-drag on the slider.
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

// Watch for the WaveSurfer instance and apply the equalizer on play.
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
