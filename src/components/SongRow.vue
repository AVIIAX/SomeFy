<script setup>
import { ref, toRefs, onMounted, onUnmounted } from 'vue';
import Heart from 'vue-material-design-icons/Heart.vue';
import noHeart from 'vue-material-design-icons/HeartOutline.vue';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
import MusicNote from 'vue-material-design-icons/MusicNote.vue';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';
import { getAuth } from "firebase/auth";
const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);
const currentUser = getAuth().currentUser;
let isHover = ref(false);
let isTrackTime = ref(null);
const isTrackPlays = ref(null);
const isTrackLikes = ref(null);

const db = getFirestore();

const props = defineProps({
  trackId: String,
  playList: Object,
  index: Number,
});

const { trackId, playList, index } = toRefs(props);

const trackIDs = playList.value.map(track => track.id);

console.log(trackIDs);

const track = ref([]);
const trackArtist = ref([]);
const trackLiked = ref(false);  // Local state for liked status of this specific track

onMounted(async () => {
  // Get track details
  try {
    const trackRef = doc(db, 'track', trackId.value);
    const trackDoc = await getDoc(trackRef);

    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      track.value = trackData;

      if (trackData.views) {
        isTrackPlays.value = trackData.views;
      }

      if (trackData.liked && Array.isArray(trackData.liked) ) {
        isTrackLikes.value = trackData.liked.length;
  
          trackLiked.value = trackData.liked.includes(currentUser.uid);
  
          // Check if this track is liked by the current user
      }

      const artistRef = doc(db, 'user', trackData.artist);
      const artistDoc = await getDoc(artistRef);

      if (artistDoc.exists()) {
        const artistData = artistDoc.data();
        trackArtist.value = artistData;
      }
    } else {
      console.log('No such track document!');
    }
  } catch (error) {
    console.error('Error fetching track data:', error);
  }

  const audio = new Audio(track.value.url);
  audio.addEventListener('loadedmetadata', function () {
    const duration = audio.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    isTrackTime.value = minutes + ':' + seconds.toString().padStart(2, '0');
  });

  // Listen for real-time updates to the track's liked field
  const unsubscribe = onSnapshot(doc(db, 'track', trackId.value), (doc) => {
    if (doc.exists()) {
      const updatedTrackData = doc.data();

      if(Array.isArray(updatedTrackData.liked)){
      trackLiked.value = updatedTrackData.liked.includes(currentUser.uid);
      }

      if(Array.isArray(updatedTrackData.liked)) {
      isTrackLikes.value = updatedTrackData.liked.length;
      }
    }
  });

  // Clean up listener on component unmount
  onUnmounted(() => {
    unsubscribe();
  });
});

</script>

<template>
  <li
    class="relative flex items-center justify-between rounded-md mx-2 my-4"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <!-- Image with Glass Effect -->
    <div class="absolute inset-0 rounded-md overflow-hidden">
      <img
        :src="track.image"
        alt="Track Image"
        class="object-cover w-full h-full"
        :style="{
          filter: 'blur(8px)',
          opacity: isHover ? '0.1' : '0.2',
          transition: 'opacity 0.3s ease',
        }"
      />
    </div>

    <!-- Glass Effect Overlay -->
    <div
      class="absolute inset-0 opacity-20 backdrop-blur-md rounded-md"
      :style="{ zIndex: '-1', backgroundColor: '#0d0d0d', border: 'none', outline: 'none' }"
    ></div>

    <!-- Content -->
    <div class="flex items-center w-full py-1.5 relative z-10 px-4">
      <div v-if="isHover" class="w-[40px] ml-[14px] mr-[6px] cursor-pointer">
        <Play
          v-if="!isPlaying"
          fillColor="#FFFFFF"
          :size="25"
          @click="useSong.playOrPauseThisSong(artist, track)"
        />
        <Pause v-else fillColor="#FFFFFF" :size="25" @click="useSong.playOrPauseSong()" />
      </div>
      <div v-else class="text-white font-semibold w-[40px] ml-5">
        <span :class="{'text-green-500': currentTrack && currentTrack.name === track.name}">
          {{ index }}
        </span>
      </div>
      <div>
        <div
          :class="{'text-green-500': currentTrack && currentTrack.name === track.name}"
          class="text-white font-semibold"
        >
          {{ track.name }}
        </div>
        <div class="text-sm font-semibold text-gray-400">{{ trackArtist.name }}</div>
      </div>
    </div>

    <!-- Right-Side Controls -->
    <div class="flex items-center relative z-10">
      <button type="button" v-if="isHover">
        <noHeart v-if="!trackLiked" fillColor="#1BD760" :size="22" @click="useSong.likeOrUnlikeSong(track.id)" />
        <Heart v-else fillColor="#1BD760" :size="22" @click="useSong.likeOrUnlikeSong(track.id)" />
      </button>

      <div class="text-xs mx-5 text-gray-400 flex">
        {{ isTrackLikes || '0' }}
      </div>

      <div class="text-xs mx-5 text-gray-400 flex">
        <MusicNote :size="15" />
        {{ isTrackPlays || '0' }}
      </div>

      <div  class="text-xs mx-5 text-gray-400">
        {{ isTrackTime || '00:00' }}
      </div>
    </div>
  </li>
</template>

<style scoped>
/* Styles */
</style>
