<script setup>
import { ref, onMounted } from 'vue';
import { getRandomBoostedTrackId } from "../utils/boostedtracks"; 
import BoostCard from '../components/BoostCard.vue';
import HomeCard from '../components/HomeCard.vue';
import SongRow from '../components/SongRow.vue'
import Test from '../components/Test.vue'
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
import DotsHorizontal from 'vue-material-design-icons/DotsHorizontal.vue';
import Heart from 'vue-material-design-icons/Heart.vue';
import ClockTimeThreeOutline from 'vue-material-design-icons/ClockTimeThreeOutline.vue';
import artist from '../artist.json'
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';

let auth = getAuth();
const db = getFirestore();
const topHits = ref([]);
const topLiked = ref([]);
const boosted = ref([]);
const topBoost = ref("");

const useSong = useSongStore()
const { isPlaying, currentTrack } = storeToRefs(useSong);
const randBoost = ref(null)

const getTracks = async (playList) => {
  try {
    const pListRef = doc(db, 'playlists', playList); 
    const pListDoc = await getDoc(pListRef);
    if (pListDoc.exists()) {
      const data = pListDoc.data(); // Assuming the document contains an array of track IDs
      return data.tracks || []; // Replace 'tracks' with the actual field name containing the array
    } else {
      console.log('No such playlist exists.');
      return [];
    }
  } catch (error) {
    console.log('Error fetching playlist:', error);
    return [];
  }
};

onMounted(async () => {
  topHits.value = await getTracks('topHits'); 
  topLiked.value = await getTracks('mostLiked');
  boosted.value = await getTracks('boosted');
  topBoost.value = '53LnKhGA495Z3m6VdXMM';

  
});
// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Check if we have a stored boosted track ID for this user.
    const storedUserUid = localStorage.getItem("boostedTrackUser");
    const storedBoostId = localStorage.getItem("boostedTrackId");

    if (storedUserUid === user.uid && storedBoostId) {
      // Use the stored boosted track id if it exists and the user hasn't changed.
      randBoost.value = storedBoostId;
      console.log("Using cached boosted track:", storedBoostId);
    } else {
      // Otherwise, fetch a new random boosted track id.
      const boostedTrackId = await getRandomBoostedTrackId();
      if (boostedTrackId) {
        randBoost.value = boostedTrackId;
        // Cache the current user's UID and the boosted track id.
        localStorage.setItem("boostedTrackUser", user.uid);
        localStorage.setItem("boostedTrackId", boostedTrackId);
        console.log("New boosted track selected:", boostedTrackId);
      }
    }
  } else {
    // User logged out: clear the stored values.
    localStorage.removeItem("boostedTrackUser");
    localStorage.removeItem("boostedTrackId");
    randBoost.value = null;
  }
});

</script>

<template>
  <!-- Top Boost Section -->
  <div class="flex items-center" :style="{
    position: 'sticky',
    top: '60px',
  }">
  
      <BoostCard v-if="randBoost" :trackID="randBoost" :playList="boosted" />

  </div>

  <div :style="{
    position: 'relative',
    backgroundColor: '#000408',
  }">
  <!-- Top Hits Section -->
  <div class="relative p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Top Hits
    </button>

    <div class="py-1.5"></div>

    <!-- Responsive Grid Layout for Top Hits -->
    <div
      class="
        grid 
        grid-cols-2 
        sm:grid-cols-3 
        md:grid-cols-4 
        lg:grid-cols-5 
        gap-4
      "
    >
    <div v-for="track in topHits" :key="track">
      <HomeCard :trackId="track" :playList="topHits" />
    </div>
    </div>
  </div>

  <!-- Boosted Section -->
  <div class="relative p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Boosted
    </button>

    <div class="py-1.5"></div>

    <!-- Responsive Grid Layout for Top Hits -->
    <div
      class="
        grid 
        grid-cols-2 
        sm:grid-cols-3 
        md:grid-cols-4 
        lg:grid-cols-5 
        gap-4
      "
    >
    <div v-for="track in boosted" :key="track">
      <HomeCard :trackId="track" :playList="boosted" />
    </div>
    </div>
  </div>

  <!-- Top Liked Section -->
  <div class="relative p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline"
    >
      Most Liked
    </button>

    <div class="py-1.5"></div>

    <!-- Responsive Grid Layout for Top Hits -->
    <div
      class="
        grid 
        grid-cols-2 
        sm:grid-cols-3 
        md:grid-cols-4 
        lg:grid-cols-5 
        gap-4
      "
    >
    <div v-for="track in topLiked" :key="track">
      <HomeCard :trackId="track" :playList="topLiked" />
    </div>
    </div>
  </div>

  <!-- Music Section -->
  <div class="p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Music
    </button>

    <div class="mt-6"></div>
    <div class="flex items-center justify-between px-5 pt-2">
      <div class="flex items-center justify-between text-gray-400">
        <div class="mr-7">#</div>
        <div class="text-sm">Title</div>
      </div>
      <div>
        <ClockTimeThreeOutline fillColor="#FFFFFF" :size="18" />
      </div>
    </div>

    <div class="border-b border-b-[#2A2A2A] mt-2"></div>
    <div class="mb-4"></div>

    <!-- No grid layout for Music Section -->
    
  </div>
  </div>
</template>


  
