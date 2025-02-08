<script setup>
import { ref, toRefs, onMounted, watch } from 'vue';
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
        v-if="!isPlaying || currentTrack.name !== track.name"
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

</template>
