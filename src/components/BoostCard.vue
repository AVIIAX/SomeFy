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
  <div :style=" {
    height: '400px'
  }">
    <img 
        :src="track.image"
        :style="{
          filter: 'blur(5px)',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: '0',
          left: '0',
          zIndex: '-1',
          objectFit: 'cover',
        }"
      />
      

      <div :style="{position: 'relative'}" class="text-white pt-4 font-semibold text-[900%]">{{ track.name }}</div>
    <div class="text-gray-400 pt-1 pb-3 text-[44px]">{{ artist.name }}</div>
    <div
        class="items-center justify-center "
        :style=" {
          border: 'solid 1px #FFFFFF',
          borderRadius: '100%',
          width: 'fit-content',
          padding: '0.5rem'
        }"
      >
        <Play class="cursor-pointer"
          v-if="!isPlaying || currentTrack.name !== track.name"
          fillColor="#FFFFFF"
          :size="60"
          @click="useSong.loadSong(null, track)"
        />
        <Pause class="cursor-pointer"
          v-else
          fillColor="#FFFFFF"
          :size="60"
          @click="useSong.playOrPauseSong()"
        />
      </div>
    
  </div>
 
</template>
