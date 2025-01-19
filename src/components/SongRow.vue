<script setup>
import { ref, toRefs, onMounted } from 'vue';
import Heart from 'vue-material-design-icons/Heart.vue';
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';

const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);

let isHover = ref(false);
let isTrackTime = ref(null);

const db = getFirestore();

const props = defineProps({
  trackId: String,
  index: Number,
});

const { trackId, index } = toRefs(props);
const track = ref([]);
const artist = ref([]);

onMounted(async () => {

  console.log(trackId.value);
  
  //Get track details
try {
    const trackRef = doc(db, 'track', trackId.value); // Replace trackID with the actual track ID
    const trackDoc = await getDoc(trackRef);

    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      track.value = trackData;
      
    } else {
      console.log('No such track document!');
    }
  } catch (error) {
    console.error('Error fetching track data:', error);
  }



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

    <!-- Glass Effect Overlay (Optional) -->
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
        <Play
          v-else-if="isPlaying && currentTrack.name !== track.name"
          fillColor="#FFFFFF"
          :size="25"
          @click="useSong.loadSong(artist, track)"
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
        <div class="text-sm font-semibold text-gray-400">{{ track.artist }}</div>
      </div>
    </div>

    <!-- Right-Side Controls -->
    <div class="flex items-center relative z-10">
      <button type="button" v-if="isHover">
        <Heart fillColor="#1BD760" :size="22" />
      </button>
      <div v-if="isTrackTime" class="text-xs mx-5 text-gray-400">
        {{ isTrackTime }}
      </div>
    </div>
  </li>
</template>

<style scoped>
/* Prevent content from being affected by blur */
.relative {
  position: relative;
}

.z-10 {
  z-index: 10;
}

.-z-10 {
  z-index: -10;
}

/* Ensuring image is inside the list item, not overlaying */
#litem {
  position: relative;
  overflow: hidden;
}

#litem div.absolute {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}
</style>
