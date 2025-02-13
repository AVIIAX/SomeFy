<template>
  <div
  id="MusicPlayer"

  class="fixed flex items-center justify-between bottom-0 w-full z-49 h-[90px] bg-[#121212] border-t p-4"
  :style="{ borderTopColor: isOffline ? '#ff7575' : '#75ff83' }"
>
      <div class="flex items-center w-1/4">
          <div class="flex items-center ml-4">
              <RouterLink :to="`/track/${currentTrack.id}`">
                  <img class="rounded-sm shadow-2xl max-w-none" width="55" :src="currentTrack.image" />
              </RouterLink>
              <div class="ml-4">
                  <RouterLink :to="`/track/${currentTrack.id}`">
                      <div class="text-[14px] text-white hover:underline cursor-pointer">
                          {{ currentTrack?.name || "Loading" }}
                      </div>
                  </RouterLink>
                  <RouterLink :to="`/user/${currentTrack.artist}`">
                      <div class="text-[11px] text-gray-500 hover:underline hover:text-white cursor-pointer">
                          {{ currentArtist?.name || "Loading" }}
                      </div>
                  </RouterLink>
              </div>
          </div>
          <div class="flex items-center ml-8">
              <button type="button">
                  <noHeart
                      v-if="!trackLiked"
                      fillColor="#1BD760"
                      :size="22"
                      @click="useSong.likeOrUnlikeSong(currentTrack.id)"
                  />
                  <Heart
                      v-else
                      fillColor="#1BD760"
                      :size="22"
                      @click="useSong.likeOrUnlikeSong(currentTrack.id)"
                  />
              </button>
              <Equalizer @click="isOpenEq = !isOpenEq" :class="isOpenEq ? 'text-[#282828]' : 'bg-black'" class="ml-4 cursor-pointer" :fillColor="isOpenEq ? '#ffffff96': '#FFFFFF'" :size="18" />

              
          </div>
      </div>

      <div class="max-w-[35%] mx-auto w-2/4 ">
          <div class="items-center justify-center" :style="{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }">
              <div class="buttons flex items-center justify-center h-[30px]">
                  <button class="mx-2" @click="useSong.prevSong()">
                      <svg xmlns="http://www.w3.org/2000/svg" :width="20" :height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                          <path :d="mdilSkipPrevious" />
                      </svg>
                  </button>
                  <button
                      class="p-1 rounded-full mx-3"
                      :style="{ border: 'solid 1px white' }"
                      @click="useSong.playOrPauseThisSong(currentTrack, trackQueue.map((t) => t.id))"
                  >
                      <svg
                          v-if="!isPlaying"
                          xmlns="http://www.w3.org/2000/svg"
                          :width="20"
                          :height="20"
                          viewBox="0 0 24 24"
                          fill="#FFFFFF"
                      >
                          <path :d="mdilPlay" />
                      </svg>
                      <svg
                          v-else
                          xmlns="http://www.w3.org/2000/svg"
                          :width="20"
                          :height="20"
                          viewBox="0 0 24 24"
                          fill="#FFFFFF"
                      >
                          <path :d="mdilPause" />
                      </svg>
                  </button>
                  <button class="mx-2" @click="useSong.nextSong()">
                      <svg xmlns="http://www.w3.org/2000/svg" :width="20" :height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                          <path :d="mdilSkipNext" />
                      </svg>
                  </button>
              </div>
              
              <div class="flex items-center h-fit w-[100%]">
                  <div v-if="isTrackTimeCurrent" class="text-white text-[12px] pr-2 ">
                      {{ isTrackTimeCurrent }}
                  </div>
                  
                  <div id="waveform"></div>

                  <div v-if="isTrackTimeTotal" class="text-white text-[12px] pl-2 ">
                      {{ isTrackTimeTotal }}
                  </div>
              </div>
          </div>
      </div>

      <div class="flex items-center w-1/4 justify-end pr-10">
          <MusicPlayerVolume />
      </div>
  </div>
  
<EqualizerCom v-if="isOpenEq" />

</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import MusicPlayerVolume from '../components/MusicPlayerVolume.vue';
import EqualizerCom from '../components/Equalizer.vue';
import Heart from 'vue-material-design-icons/HeartMultiple.vue';
import noHeart from 'vue-material-design-icons/HeartMultipleOutline.vue';
import Equalizer from 'vue-material-design-icons/EqualizerOutline.vue';
import { mdilPlay, mdilPause, mdilSkipPrevious, mdilSkipNext } from '@mdi/light-js';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';
import WaveSurfer from 'wavesurfer.js';
import { getAuth } from 'firebase/auth';

const useSong = useSongStore();
const { isPlaying, currentTrack, trackQueue, currentArtist, wavesurfer } = storeToRefs(useSong);
const isOffline = ref(!navigator.onLine);

const db = getFirestore();
const currentUser = getAuth().currentUser;
let isHover = ref(false);
let isTrackTimeCurrent = ref(null);
let isTrackTimeTotal = ref(null);
const trackLiked = ref(false);

let unsubscribeTrackListener = null;
let isOpenEq = ref(false);

const updateOnlineStatus = () => {
isOffline.value = !navigator.onLine;
};

// Function to listen for real-time updates on the current track's "liked" field.
const listenForLikeUpdates = (trackId) => {
  if (unsubscribeTrackListener) {
    unsubscribeTrackListener();
  }
  const trackDocRef = doc(db, 'track', trackId);
  unsubscribeTrackListener = onSnapshot(trackDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const trackData = docSnapshot.data();
      trackLiked.value =
        Array.isArray(trackData.liked) ? trackData.liked.includes(currentUser.uid) : false;
    }
  });
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  
  // Set up the real-time listener for like updates when a current track is available.
  if (currentTrack.value && currentTrack.value.id) {
    listenForLikeUpdates(currentTrack.value.id);
  }
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);

  if (wavesurfer.value) {
      wavesurfer.value.destroy();
  }
});

// Watch for changes in currentTrack and update the like listener accordingly.
watch(() => currentTrack.value.id, (newId) => {
  if (newId) {
    listenForLikeUpdates(newId);
  }
});

watch(() => wavesurfer.value, (ws) => {
  if (ws) {
      ws.on('audioprocess', () => {
          const currentTime = ws.getCurrentTime();
          const duration = ws.getDuration();
          isTrackTimeCurrent.value = formatTime(currentTime);
          isTrackTimeTotal.value = formatTime(duration);
      });
      

      ws.on('finish', () => {
          useSong.nextSong();
      });
  }
});

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};






</script>

<style scoped>
.rangeDotHidden[type="range"]::-webkit-slider-thumb {
-webkit-appearance: none;
appearance: none;
width: 0;
height: 0;
}
</style>
