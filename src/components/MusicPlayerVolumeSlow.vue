<template>
  <div class="volume-control-slow">
    <!-- A simple range slider for volume -->
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      v-model.number="volume"
      @input="onVolumeChange"
      class="w-24"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSongStore } from '../stores/song';
const useSong = useSongStore();

// Initialize volume (default to 0.5 or get it from your store)
const volume = ref(0.5);

// When volume changes, call the store method (which should update the PitchShifter's gain)
const onVolumeChange = () => {
  useSong.setVolume(volume.value);
};

// If your store provides a current volume value, you could watch it here to keep in sync.
// For example:
// watch(() => useSong.currentVolume, (newVal) => {
//   volume.value = newVal;
// });
</script>

<style scoped>
/* Add styling as needed */
</style>
