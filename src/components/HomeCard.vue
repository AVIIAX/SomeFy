<script setup>
import { ref, toRefs, onMounted } from 'vue';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
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
        <Play
          v-if="!isPlaying || currentTrack.name !== track.name"
          fillColor="#FFFFFF"
          :size="60"
          @click="useSong.loadSong(track, playList)"
        />
        <Pause
          v-else
          fillColor="#FFFFFF"
          :size="60"
          @click="useSong.playOrPauseSong()"
        />
      </div>
    </div>
    <div class="track-name">{{ track.name }}</div>
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

