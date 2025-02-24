<script setup>
import { ref, onMounted, watch } from 'vue'
import { getRandomBoostedTrackId } from '../utils/boostedtracks'
import BoostCard from '../components/BoostCard.vue'
import SongRow from '../components/SongRow.vue'
import Arch from 'vue-material-design-icons/Arch.vue'

import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'

// Define the props for optional route parameters
const props = defineProps({
  // When navigating as a genre page, pass playlist as null and genre with a value.
  // When navigating as a playlist page, pass genre as null and playlist with a value.
  playlist: {
    type: String,
    default: null
  },
  genre: {
    type: String,
    default: null
  }
})

// Create local reactive variables based on the props
const currentGenre = ref(props.genre)
const currentPlaylist = ref(props.playlist)

// Determine page type
const isGenrePage = ref(!!currentGenre.value)
const isPlaylistPage = ref(!!currentPlaylist.value)

// Firebase and other refs
const auth = getAuth()
const db = getFirestore()
const randBoost = ref(null)
const allTracks = ref([])

// Helper: Generic function to fetch tracks based on a field and its value
async function fetchTracks(queryField, value) {
  try {
    const tracksRef = collection(db, 'track')
    const q = query(tracksRef, where(queryField, '==', value))
    const querySnapshot = await getDocs(q)
    const results = []
    querySnapshot.forEach(docSnap => {
      results.push({
        id: docSnap.id,
        ...docSnap.data()
      })
    })
    return results
  } catch (error) {
    console.error('Error fetching tracks:', error)
    return []
  }
}

const fetchTrackDetails = async (trackIds) => {
  return Promise.all(trackIds.map(async (trackId) => {
    try {
      const trackRef = doc(db, 'track', trackId);
      const trackDoc = await getDoc(trackRef);
      if (trackDoc.exists()) {
        return { id: trackId, ...trackDoc.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching track with ID ${trackId}:`, error);
      return null;
    }
  })).then(tracks => tracks.filter(Boolean));
};

// On mount, fetch tracks based on which parameter is provided
onMounted(async () => {
  
  console.log(isPlaylistPage,isGenrePage);
  
  
  if (isGenrePage.value && currentGenre.value) {
    // For a genre page, fetch tracks where the track's 'genre' field matches the parameter
    allTracks.value = await fetchTracks('genre', currentGenre.value)
  } else if (isPlaylistPage.value && currentPlaylist.value) {
    // For a playlist page, fetch tracks where the track's 'playlist' field matches the parameter
    allTracks.value = await fetchTrackDetails(currentPlaylist.value)
    console.log('MyTracks');
  }
  randBoost.value = await getRandomBoostedTrackId()
})

// Watch for changes in the genre prop
watch(
  () => props.genre,
  async (newGenre) => {
    currentGenre.value = newGenre
    if (newGenre) {
      isGenrePage.value = true
      isPlaylistPage.value = false
      allTracks.value = await fetchTracks('genre', newGenre)
    }
  }
)

// Watch for changes in the playlist prop
watch(
  () => props.playlist,
  async (newPlaylist) => {
    currentPlaylist.value = newPlaylist
    if (newPlaylist) {
      isPlaylistPage.value = true
      isGenrePage.value = false
      allTracks.value = await fetchTracks('playlist', newPlaylist)
    }
  }
)
</script>

<template>
  <!-- Main container with a dark background -->
  <div :style="{ position: 'relative', backgroundColor: '#000408' }">
    <!-- Header + Tracks Section -->
    <div class="p-8">
      <button
        type="button"
        class="text-white text-2xl font-semibold hover:underline cursor-pointer"
      >
        <!-- Display either the genre or playlist name -->
        <span v-if="isGenrePage">{{ currentGenre }}</span>
        <span v-else-if="isPlaylistPage">{{ currentPlaylist }}</span>
      </button>

      <!-- Only show tracks if any exist -->
      <div v-if="allTracks.length">
        <div class="mt-6"></div>
        
        <!-- Example icon row -->
        <div class="flex items-center justify-between px-5 pt-2">
          <Arch fillColor="#FFFFFF" :size="18" />
        </div>
        
        <div class="border-b border-b-[#2A2A2A] mt-2"></div>
        <div class="mb-4"></div>

        <!-- List of tracks -->
        <div>
          <ul class="w-full">
            <li v-for="(track, index) in allTracks" :key="track.id">
              <!-- SongRow component expects trackId, the full track list, and an index -->
              <SongRow
                :trackId="track.id"
                :playList="allTracks"
                :index="index + 1"
              />
            </li>
          </ul>
        </div>
      </div>
      <!-- Message if no tracks are found -->
      <div
        v-else
        class="text-sm"
        :style="{ color: '#666666', textAlign: 'center', padding: '2rem' }"
      >
        No tracks yet
      </div>

      <!-- Optional additional UI for authenticated users could go here -->
      <div v-if="false" class="text-center">
      </div>
    </div>
  </div>

  <!-- Boosted Track Section (sticky) -->
  <div
    class="flex items-center"
    :style="{ position: 'sticky', top: '60px' }"
  >
    <BoostCard v-if="randBoost" :trackID="randBoost" :playList="null" />
  </div>
</template>
