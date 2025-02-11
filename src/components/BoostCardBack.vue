<script setup>
import { ref, toRefs, onMounted, watch } from 'vue';
import { mdilPlay } from '@mdi/light-js';
import { mdilPause } from '@mdi/light-js';
import Heart from 'vue-material-design-icons/HeartMultiple.vue';
import noHeart from 'vue-material-design-icons/HeartMultipleOutline.vue';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';

const db = getFirestore();
const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);
const trackLiked = ref(false);
let isHover = ref(false);
let isTrackTime = ref(null);

const props = defineProps({
  trackId: String,
  index: Number,
});

const { trackId } = toRefs(props);
const track = ref([]);
const pList = ref([]);
const artist = ref([]);
const trackIDs = pList.value.map(track => track.id);

onMounted(async () => {

  try {

    const trackRef = doc(db, 'track', trackId.value);
    const plistRef = doc(db, 'playlists', 'boosted');
    const trackDoc = await getDoc(trackRef);
    const plistDoc = await getDoc(plistRef);

    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      track.value = trackData;

      const userRef = doc(db, 'user', trackData.artist);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        artist.value = userData;
      }

    } else {
      console.log("na bn");
    }
    if (plistDoc.exists()) {
        const plistData = plistDoc.data();
        pList.value = plistData.tracks;
        console.log(pList.value);
        
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

// Toggle like status in Firestore
const toggleLike = async () => {
  if (!track.value?.id) return;
  const trackDocRef = doc(db, 'track', track.value.id);

  try {
    const trackSnap = await getDoc(trackDocRef);
    if (trackSnap.exists()) {
      const trackData = trackSnap.data();
      let newLiked = [];

      // If the liked field exists and is an array, toggle the like.
      if (trackData.liked && Array.isArray(trackData.liked)) {
        if (trackData.liked.includes(currentUser.uid)) {
          newLiked = trackData.liked.filter(uid => uid !== currentUser.uid);
        } else {
          newLiked = [...trackData.liked, currentUser.uid];
        }
      } else {
        // If the liked field does not exist (or isn't an array), initialize it.
        newLiked = [currentUser.uid];
      }

      await updateDoc(trackDocRef, {
        liked: newLiked,
      });
      // The onSnapshot listener will update the UI automatically.
    }
  } catch (error) {
    console.error("Error updating like status:", error);
  }
};
</script>

<template>
  <div class="p-8" :style="{
    position: 'relative',
    width: '100%',
    height: '400px',
    backgroundColor: '#0000009e',
  }">
    <img :src="track.image" :style="{
      filter: 'blur(15px)',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '-1',
      objectFit: 'cover',
    }" />


    <div :style="{ position: 'relative' }" class="text-white pt-4 font-semibold text-[500%]">{{ track.name }}</div>
    <RouterLink :to="`/user/${track.artist}`">
      <div class="text-gray-400 pt-1 pb-3 text-[44px] toArtist">{{ artist.name }}</div>
    </RouterLink>
    <div class="items-center justify-center" :style="{
     
      borderTopLeftRadius: '40%',
      borderBottomRightRadius: '17%',
      borderTopLeftRadius: '17%',
      borderBottomRightRadius: '40%',
      width: 'fit-content',
      padding: '0.05em',
      cursor: 'pointer',
    }">
     <svg
              v-if="!currentTrack || (!isPlaying && (currentTrack.id !== track.id)) || (currentTrack.id !== track.id)"
              xmlns="http://www.w3.org/2000/svg"
              :width="60"
              :height="60"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              @click="useSong.loadSong(track, pList)"
            >
              <path :d="mdilPlay" />
            </svg>

            <svg
              v-if="!isPlaying && (currentTrack && currentTrack.id == track.id)"
              xmlns="http://www.w3.org/2000/svg"
              :width="60"
              :height="60"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              @click="useSong.playOrPauseThisSong(currentTrack, pList)"
            >
              <path :d="mdilPlay" />
            </svg>

            <svg
              v-if="isPlaying && (currentTrack && currentTrack.id == track.id)"
              xmlns="http://www.w3.org/2000/svg"
              :width="60"
              :height="60"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              @click="useSong.playOrPauseThisSong(currentTrack, pList)"
            >
              <path :d="mdilPause" />
            </svg>

            <!-- Like Button -->
            <button type="button" @click="toggleLike">
              <noHeart v-if="!trackLiked" fillColor="#1BD760" :size="40" />
              <Heart v-else fillColor="#1BD760" :size="40" />
            </button>
            <span v-if="track.liked">{{ track.liked.length }}</span>

    </div>

  </div>

</template>
