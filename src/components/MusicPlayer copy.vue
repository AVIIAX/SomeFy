<template>
    <div
    id="MusicPlayer"
    v-if="audio"
    class="fixed flex items-center justify-between bottom-0 w-full z-50 h-[90px] bg-[#121212] border-t"
    :style="{ borderTopColor: isOffline ? '#ff7575' : '#75ff83' }"
  >
        <div class="flex items-center w-1/4">
            <div class="flex items-center ml-4">
                <RouterLink :to="`/track/${currentTrack.id}`">
                    <img class="rounded-sm shadow-2xl" width="55" :src="currentTrack.image" />
                </RouterLink>
                <div class="ml-4">
                    <RouterLink :to="`/track/${currentTrack.id}`">
                        <div class="text-[14px] text-white hover:underline cursor-pointer">
                            {{ currentTrack.name }}
                        </div>
                    </RouterLink>
                    <RouterLink :to="`/user/${currentTrack.artist}`">
                        <div class="text-[11px] text-gray-500 hover:underline hover:text-white cursor-pointer">
                            {{ currentArtist.name }}
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
                <PictureInPictureBottomRight class="ml-4" fillColor="#FFFFFF" :size="18" />
            </div>
        </div>

        <div class="max-w-[35%] mx-auto w-2/4 mb-3">
            <div class="flex-col items-center justify-center">
                <div class="buttons flex items-center justify-center h-[30px]">
                    <button class="mx-2">
                        <!-- SkipBackward -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            :width="25"
                            :height="25"
                            viewBox="0 0 24 24"
                            fill="#FFFFFF"
                            @click="useSong.prevSong()"
                        >
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
                            :width="25"
                            :height="25"
                            viewBox="0 0 24 24"
                            fill="#FFFFFF"
                        >
                            <path :d="mdilPlay" />
                        </svg>
                        <svg
                            v-else
                            xmlns="http://www.w3.org/2000/svg"
                            :width="25"
                            :height="25"
                            viewBox="0 0 24 24"
                            fill="#FFFFFF"
                        >
                            <path :d="mdilPause" />
                        </svg>
                    </button>
                    <button class="mx-2">
                        <!-- SkipForward -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            :width="25"
                            :height="25"
                            viewBox="0 0 24 24"
                            fill="#FFFFFF"
                            @click="useSong.nextSong()"
                        >
                            <path :d="mdilSkipNext" />
                        </svg>
                    </button>
                </div>
                <div class="flex items-center h-[25px]">
                    <div v-if="isTrackTimeCurrent" class="text-white text-[12px] pr-2 pt-[11px]">
                        {{ isTrackTimeCurrent }}
                    </div>
                    <div
                        ref="seekerContainer"
                        class="w-full relative mt-2 mb-3"
                        @mouseenter="isHover = true"
                        @mouseleave="isHover = false"
                    >
                        <input
                            v-model="range"
                            ref="seeker"
                            type="range"
                            class="absolute rounded-full my-2 w-full h-0 z-40 appearance-none bg-opacity-100 focus:outline-none accent-white"
                            :class="{ 'rangeDotHidden': !isHover }"
                        />
                        <div
                            class="pointer-events-none mt-[6px] absolute h-[4px] z-10 inset-y-0 left-0"
                            :style="`width: ${range}%;`"
                            :class="isHover ? 'bg-green-500' : 'bg-white'"
                        />
                        <div class="absolute h-[4px] z-[-0] mt-[6px] inset-y-0 left-0 w-full bg-gray-500 rounded-full" />
                    </div>
                    <div v-if="isTrackTimeTotal" class="text-white text-[12px] pl-2 pt-[11px]">
                        {{ isTrackTimeTotal }}
                    </div>
                </div>
            </div>
        </div>

        <div class="flex items-center w-1/4 justify-end pr-10">
            <MusicPlayerVolume />
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import MusicPlayerVolume from '../components/MusicPlayerVolume.vue';
import Heart from 'vue-material-design-icons/HeartMultiple.vue';
import noHeart from 'vue-material-design-icons/HeartMultipleOutline.vue';
import PictureInPictureBottomRight from 'vue-material-design-icons/PictureInPictureBottomRight.vue';
import { mdilPlay, mdilPause, mdilSkipPrevious, mdilSkipNext } from '@mdi/light-js';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';

const db = getFirestore();
const useSong = useSongStore();
const { isPlaying, audio, currentTrack, trackQueue, currentArtist } = storeToRefs(useSong);
const currentUser = getAuth().currentUser;
const isOffline = ref(!navigator.onLine);

let isHover = ref(false);
let isTrackTimeCurrent = ref(null);
let isTrackTimeTotal = ref(null);
let seeker = ref(null);
let seekerContainer = ref(null);
let range = ref(0);
const trackLiked = ref(false);

let unsubscribeTrackListener = null; // Will hold the unsubscribe function from onSnapshot

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

  if (audio.value) {
    setTimeout(() => {
      timeupdate();
      loadmetadata();
    }, 300);
  }

  if (currentTrack.value) {
    seeker.value.addEventListener("change", function () {
      const time = audio.value.duration * (seeker.value.value / 100);
      audio.value.currentTime = time;
    });

    seeker.value.addEventListener("mousedown", function () {
      audio.value.pause();
      isPlaying.value = false;
    });

    seeker.value.addEventListener("mouseup", function () {
      audio.value.play();
      isPlaying.value = true;
    });

    seekerContainer.value.addEventListener("click", function (e) {
      const clickPosition = (e.pageX - seekerContainer.value.offsetLeft) / seekerContainer.value.offsetWidth;
      const time = audio.value.duration * clickPosition;
      audio.value.currentTime = time;
      seeker.value.value = (100 / audio.value.duration) * audio.value.currentTime;
    });
  }

  // Set up the real-time listener for like updates when a current track is available.
  if (currentTrack.value && currentTrack.value.id) {
    listenForLikeUpdates(currentTrack.value.id);
  }
});

onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  
  if (unsubscribeTrackListener) {
    unsubscribeTrackListener();
  }
});

const timeupdate = () => {
  audio.value.addEventListener("timeupdate", function () {
    const minutes = Math.floor(audio.value.currentTime / 60);
    const seconds = Math.floor(audio.value.currentTime - minutes * 60);
    isTrackTimeCurrent.value = minutes + ':' + seconds.toString().padStart(2, '0');
    const value = (100 / audio.value.duration) * audio.value.currentTime;
    range.value = value;
    seeker.value.value = value;
  });
};

const loadmetadata = () => {
  audio.value.addEventListener('loadedmetadata', function () {
    const duration = audio.value.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    isTrackTimeTotal.value = minutes + ':' + seconds.toString().padStart(2, '0');
  });
};

watch(() => audio.value, () => {
  timeupdate();
  loadmetadata();
});

watch(() => isTrackTimeCurrent.value, (time) => {
  if (time && time === isTrackTimeTotal.value) {
    useSong.nextSong(currentTrack.value);
  }
});

// Watch for changes in currentTrack and update the like listener accordingly.
watch(() => currentTrack.value.id, (newId) => {
  if (newId) {
    listenForLikeUpdates(newId);
  }
});
</script>

<style>
.rangeDotHidden[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0;
  height: 0;
}
</style>
