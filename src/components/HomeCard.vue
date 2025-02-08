<script setup>
import { ref, toRefs, onMounted } from 'vue';
import { mdilPlay } from '@mdi/light-js';
import { mdilPause } from '@mdi/light-js';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';

const db = getFirestore();
const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);

let isHover = ref(false);
let isTrackTime = ref(null);

const props = defineProps({
  trackId: String,
  playList: Object,
  index: Number,
});

const { trackId, playList } = toRefs(props);
const track = ref([]);
const artist = ref([]);
const trackIDs = playList.value.map(track => track.id);

onMounted(async () => {

  try {
    
    const trackRef = doc(db, 'track', trackId.value);
    const trackDoc = await getDoc(trackRef);

    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      track.value = trackData;

      const userRef = doc(db, 'user', trackData.artist);
      const userDoc = await getDoc(userRef);
      
      if (trackDoc.exists()) {
        const userData = userDoc.data();
        artist.value = userData;
      }
      
    } else {
      console.log("na bn");
      
    }

  } catch (error) {
    console.log(error);
    
  }
  const audio = new Audio(track.value.url);
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
    class="card"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <div class="image-container">
      <img
        class="image"
        :class="{ 'blur-sm': isHover }"
        :src="track.image"
        :style="{ borderRadius: '15px', objectFit: 'cover'}"
      />
      <div
        v-if="isHover"
        class="play-pause-container"
      >

      <svg
        v-if="!isPlaying || currentTrack.name !== track.name"
        xmlns="http://www.w3.org/2000/svg"
        :width="60"
        :height="60"
        viewBox="0 0 24 24"
        fill="#FFFFFF"
        @click="useSong.loadSong(track, playList)"
      >
        <path :d="mdilPlay" />
      </svg>
        <svg
      v-else  
        xmlns="http://www.w3.org/2000/svg"
        :width="60"
        :height="60"
        viewBox="0 0 24 24"
        fill="#FFFFFF"
        @click="useSong.playOrPauseSong()"
      >
        <path :d="mdilPause" />
      </svg>
      
      </div>
    </div>
    <RouterLink :to="`/track/${track.id}`">
    <div class="track-name">{{ track.name }}</div>
  </RouterLink>
    <RouterLink :to="`/user/${track.artist}`">
      <div class="artist-name">{{ artist.name }}</div>
    </RouterLink>
    <div v-if="isTrackTime" class="track-time">{{ isTrackTime }}</div>
  </div>
</template>



<style scoped>
.card {
  background-color: #111111;
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 0.5rem;
  cursor: pointer;
  max-width: fit-content;
  height: 100%;
  transition: background-color 0.2s ease;
}

.card:hover {
  background-color: #252525;
}

.image-container {
  position: relative;
}

.image {
  border-radius: 0.375rem;
  transition: all 0.3s ease;
}

.play-pause-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-name {
  color: white;
  padding-top: 1rem;
  font-weight: 600;
  font-size: 17px;
}

.artist-name {
  color: #9e9e9e;
  padding-top: 0.25rem;
  padding-bottom: 0.75rem;
  font-size: 14px;
}

.artist-name:hover {
  text-decoration: underline;
}

.track-time {
  color: #9e9e9e;
  padding-top: 0.25rem;
  padding-bottom: 0.75rem;
  font-size: 14px;
}
</style>

