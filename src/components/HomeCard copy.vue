<script setup>
import { ref, toRefs, onMounted } from 'vue';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';

import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';

const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);

let isHover = ref(false);
let isTrackTime = ref(null);

const props = defineProps({
  track: Object,
  artist: Object,
  index: Number,
});

const { track } = toRefs(props);

onMounted(() => {
  const audio = new Audio(track.value.path);
  audio.addEventListener('loadedmetadata', function () {
    const duration = audio.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    isTrackTime.value = minutes + ':' + seconds.toString().padStart(2, '0');
  });
});
</script>

<template>
  <div
    class="relative bg-[#111111] p-4 rounded-md m-2 hover:bg-[#252525] cursor-pointer max-w-fit"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <div class="relative">
      <img
        class="rounded-sm transition-all duration-300"
        :class="{ 'blur-sm': isHover }"
        :src="track.img"
        :style="{ borderRadius: '15px'}"
      />
      <div
        v-if="isHover"
        class="absolute inset-0 flex items-center justify-center"
      >
        <Play
          v-if="!isPlaying || currentTrack.name !== track.name"
          fillColor="#FFFFFF"
          :size="60"
          @click="useSong.loadSong(null, track)"
        />
        <Pause
          v-else
          fillColor="#FFFFFF"
          :size="60"
          @click="useSong.playOrPauseSong()"
        />
      </div>
    </div>
    <div class="text-white pt-4 font-semibold text-[17px]">{{ track.name }}</div>
    <div class="text-gray-400 pt-1 pb-3 text-[14px]">{{ track.artist }}</div>
    <div v-if="isTrackTime" class="text-gray-400 pt-1 pb-3 text-[14px]">{{ isTrackTime }}</div>
  </div>
</template>
