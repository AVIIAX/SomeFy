<script setup>
import { ref, watch, onMounted } from 'vue'

import VolumeMute from 'vue-material-design-icons/VolumeMute.vue';
import VolumeHigh from 'vue-material-design-icons/VolumeHigh.vue';

import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';

const useSong = useSongStore();
const { wavesurfer } = storeToRefs(useSong);

let isHover = ref(false);
let vol = ref(80); // Default volume at 80%
let isMuted = ref(false); // Track mute status

// Ensure WaveSurfer volume is set when it becomes available
watch(wavesurfer, (newWS) => {
    if (newWS && typeof newWS.setVolume === 'function') {
        // Apply volume based on mute state
        newWS.setVolume(isMuted.value ? 0 : vol.value / 100);
    }
}, { immediate: true });

// Watch for volume changes and update WaveSurfer's volume dynamically
watch(vol, (newVol) => {
    if (wavesurfer.value && typeof wavesurfer.value.setVolume === 'function') {
        // Apply volume based on mute state
        wavesurfer.value.setVolume(isMuted.value ? 0 : newVol / 100);
    }
});

// Toggle mute and volume
const toggleMute = () => {
    isMuted.value = !isMuted.value;
    if (wavesurfer.value && typeof wavesurfer.value.setVolume === 'function') {
        wavesurfer.value.setVolume(isMuted.value ? 0 : vol.value / 100);
    }
}

</script>

<template>
    <!-- Mute/Unmute Button -->
    <div @click="toggleMute">
        <VolumeMute v-if="isMuted" fillColor="#FFFFFF" :size="20" />
        <VolumeHigh v-else fillColor="#FFFFFF" :size="20" />
    </div>

    <!-- Volume Slider -->
    <div
        class="flex items-center ml-2 w-[150px] relative mt-2 mb-[23px]"
        @mouseenter="isHover = true"
        @mouseleave="isHover = false"
    >
        <input
            v-model="vol"
            type="range"
            min="0"
            max="100"
            class="
                mt-[24px] absolute rounded-full my-2 w-full h-0 z-40
                appearance-none bg-opacity-100 focus:outline-none accent-white
            "
            :class="{ 'rangeDotHidden': !isHover }"
            :disabled="isMuted" 
        />

        <!-- Active Volume Bar -->
        <div
            class="pointer-events-none mt-[6px] absolute h-[4px] z-10 inset-y-0 left-0"
            :style="`width: ${vol}%;`"
            :class="isHover ? 'bg-green-500' : 'bg-white'"
        />

        <!-- Full Volume Track -->
        <div class="absolute h-[4px] z-[-0] mt-[6px] inset-y-0 left-0 w-full bg-gray-500 rounded-full" />
    </div>

</template>

<style>
/* Hide range dot when not hovering */
.rangeDotHidden[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0;
  height: 0;
}
</style>

