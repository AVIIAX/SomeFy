<template>
  <div class="track-profile">
    <div class="profile-header">
      <div class="p-8" :style="{
        position: 'relative',
        width: '100%',
        height: 'fit-content',
        backgroundColor: 'rgb(0 0 0 / 76%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: track.boost ? 'solid 2px' : 'none',
        borderImage: track.boost ? 'linear-gradient(to right, #3acfd5 0%, #3a4ed5 100%) 1' : 'none',
        outline: 'none'
      }">
        <img 
          :src="track.image || 'https://atlast.fm/images/no-artwork.jpg'" 
          :style="{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: '-1',
            objectFit: 'cover'
          }" 
        />

        <div class="w-[100%] pr-[1rem]">
          <div :style="{ position: 'relative' }" class="text-white pt-4 font-semibold text-[500%] track-name">
            {{ trackName.length > 50 ? trackName.slice(0, 50) + '...' : trackName }}
            <span v-if="isAuthUser" class="edit-icon" @click="editName">
              <Pencil fillColor="#FFFFFF" :size="20" />
            </span>
          </div>
          <RouterLink :to="`/user/${track.artist}`">
            <div class="text-gray-400 pt-1 pb-3 text-[30px] toArtist">{{ artist.name }}</div>
          </RouterLink>
          <div class="items-center justify-center flex" :style="{
            borderTopLeftRadius: '40%',
            borderBottomRightRadius: '17%',
            borderTopLeftRadius: '17%',
            borderBottomRightRadius: '40%',
            width: 'fit-content',
            padding: '0.05em',
            cursor: 'pointer',
            gap: '0.5rem'
          }">
            <svg
              v-if="(!isPlaying && currentTrack.id !== track.id) || currentTrack.id !== track.id"
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
              v-if="!isPlaying && currentTrack.id == track.id"
              xmlns="http://www.w3.org/2000/svg"
              :width="60"
              :height="60"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              @click="useSong.playOrPauseThisSong(currentTrack, trackQueue.map((t) => t.id))"
            >
              <path :d="mdilPlay" />
            </svg>

            <svg
              v-if="isPlaying && currentTrack.id == track.id"
              xmlns="http://www.w3.org/2000/svg"
              :width="60"
              :height="60"
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              @click="useSong.playOrPauseThisSong(currentTrack, trackQueue.map((t) => t.id))"
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

          <div id="waveform" ref="externalWaveform"></div>

          <span class="block my-8">{{ track.views }} Plays</span>

          <!-- Track Socials -->
           <div class="socials">
              <a href="https://www.w3schools.com/tags/att_a_href.asp" target="_blank"><Yt :size="30" /></a>
              <a href="https://www.w3schools.com/tags/att_a_href.asp" target="_blank"><Spotify :size="30" /></a>
              <a href="https://www.w3schools.com/tags/att_a_href.asp" target="_blank"><Soundcloud :size="30" /></a>
              <a href="https://www.w3schools.com/tags/att_a_href.asp" target="_blank"><Apple :size="30" /></a>
           </div>
        </div>
        <img 
          :src="track.image || 'https://atlast.fm/images/no-artwork.jpg'" 
          alt="User Avatar" 
          class="profile-img" 
          @click="triggerFileInput" 
        />
      </div>

      <!-- File Input -->
      <input v-if="isAuthUser" type="file" ref="fileInput" class="file-input" @change="handleFileChange" />
    </div>

    <div class="profile-info">
      <p class="about">
        {{ trackAbout.length > 1000 ? trackAbout.slice(0, 1000) + '...' : trackAbout }}
        <span v-if="isAuthUser" class="edit-icon" @click="editAbout">
          <Pencil fillColor="#FFFFFF" :size="20" />
        </span>
      </p>
    </div>
    
    <div class="border-b border-b-[#2A2A2A] mt-2"></div>
    
    <!-- Artist Tracks -->
    <div class="p-8 text-center">
      <button type="button" class="text-white text-2xl font-semibold hover:underline cursor-pointer">
        {{ artist.name }}'s Other Tracks
      </button>
      <div v-if="myTracks">
        <div class="mt-6"></div>
        <div class="flex items-center justify-between px-5 pt-2">
          <div>
            <ClockTimeThreeOutline fillColor="#FFFFFF" :size="18" />
          </div>
        </div>
        <div class="border-b border-b-[#2A2A2A] mt-2"></div>
        <div class="mb-4"></div>
        <!-- Music Section -->
        <div>
          <ul class="w-full">
            <li v-for="(track, index) in visibleTracks" :key="track">
              <SongRow :trackId="track.id" :playList="myTracks" :index="index + 1" />
            </li>
          </ul>
          <button 
            v-if="myTracks.length > 3 && !showAllTracks" 
            @click="showAllTracks = true" 
            class="see-more-button"
          >
            Show More
          </button>
        </div>
      </div>
      <div v-if="!myTracks.length" class="text-sm" :style="{ color: '#666666', textAlign: 'center', padding: '2rem' }">
        No tracks yet
      </div>
      <div v-if="isAuthUser" :style="{ textAlign: 'center' }">
        <button 
          @click="handleSongUploadClick" 
          class="open-modal-btn happyBtn" 
          v-if="!myTracks.length" 
          :style="{ backgroundColor: '#3481c9', color: 'Black', padding: '0.4rem', paddingRight: '1rem', paddingLeft: '1rem', borderRadius: '18px' }"
        >
          Upload
        </button>
      </div>
    </div>

    <!-- Top Hits Section -->
    <div class="relative p-8">
      <button type="button" class="text-white text-2xl font-semibold hover:underline cursor-pointer">
        Top Hits
      </button>
      <div class="py-1.5"></div>
      <!-- Responsive Grid Layout for Top Hits -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="track in topHits" :key="track">
          <HomeCard :trackId="track" :playList="topHits" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getFirestore, doc, getDoc, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useSongStore } from '../stores/song';
import { storeToRefs } from 'pinia';
import { mdilPlay, mdilPause } from '@mdi/light-js';
import Heart from 'vue-material-design-icons/HeartMultiple.vue';
import noHeart from 'vue-material-design-icons/HeartMultipleOutline.vue';
import SongRow from '../components/SongRow.vue';
import Pencil from 'vue-material-design-icons/Pencil.vue';
import Yt from 'vue-material-design-icons/Youtube.vue';
import Spotify from 'vue-material-design-icons/Spotify.vue';
import Soundcloud from 'vue-material-design-icons/Soundcloud.vue';
import Apple from 'vue-material-design-icons/Apple.vue';
import axios from 'axios';
import HomeCard from '../components/HomeCard.vue';
import ClockTimeThreeOutline from 'vue-material-design-icons/ClockTimeThreeOutline.vue';
import WaveSurfer from 'wavesurfer.js'

const route = useRoute();
const db = getFirestore();
const currentUser = getAuth().currentUser;
const useSong = useSongStore();
const { isPlaying, currentTrack, trackQueue } = storeToRefs(useSong);
const externalWaveform = ref(null);
let externalWaveSurfer = null;

const trackID = ref(route.params.trackID);
const track = ref({});
const trackName = ref('');
const artist = ref({});
const trackAbout = ref('');
const myTracks = ref([]);
const isAuthUser = ref(false);
const topHits = ref([]);
const fileInput = ref(null);
const errorMessage = ref('');
const trackLiked = ref(false);
const showAllTracks = ref(false);
const showAllLikedTracks = ref(false);
const pList = ref([]);
const userAvatar = ref('');
const isTrackTime = ref('');
const likedTracks = ref([]); // For potential liked tracks listing
let wavesurfer = null;

// Fetch the track data from Firestore and assign an "id" property
const fetchTrackData = async (id) => {
  try {
    const trackRef = doc(db, 'track', id);
    const trackDoc = await getDoc(trackRef);
    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      // Include the document ID in the track data
      track.value = { id, ...trackData };
      trackName.value = trackData.name;
      trackAbout.value = trackData.description || 'No description available';
      isAuthUser.value = currentUser && currentUser.uid === trackData.artist;
      trackLiked.value = trackData.liked.includes(currentUser.uid);
      
      // Fetch artist/user data
      const userRef = doc(db, 'user', trackData.artist);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        artist.value = userData;
        myTracks.value = await fetchTrackDetails(userData.tracks || []);
      }
    } else {
      console.log("Track not found.");
    }
  } catch (error) {
    console.error('Error fetching track data:', error);
    errorMessage.value = 'Failed to fetch track data.';
  }
};

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

const getTracks = async (playList) => {
  try {
    const pListRef = doc(db, 'playlists', playList);
    const pListDoc = await getDoc(pListRef);
    if (pListDoc.exists()) {
      const data = pListDoc.data();
      return data.tracks || [];
    } else {
      console.log('No such playlist exists.');
      return [];
    }
  } catch (error) {
    console.log('Error fetching playlist:', error);
    return [];
  }
};

// Real-time listener for track updates (including likes)
let unsubscribeTrack;
const listenForLikeUpdates = (trackId) => {
  const trackDocRef = doc(db, 'track', trackId);
  unsubscribeTrack = onSnapshot(trackDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const updatedTrackData = docSnapshot.data();
      track.value = { id: trackId, ...updatedTrackData };
      trackLiked.value = updatedTrackData.liked.includes(currentUser.uid);
    }
  });
};

// (Optional) Live updates on user data (tracks & liked)
let unsubscribe;
const handleLiveUpdates = (id) => {
  const userRef = doc(db, 'user', track.value.artist);
  const unsub = onSnapshot(userRef, async (docSnapshot) => {
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      if (isAuthUser.value && Array.isArray(userData.tracks)) {
        const tracksWithDetails = await Promise.all(userData.tracks.map(async (trackId) => {
          const tRef = doc(db, 'track', trackId);
          const tDoc = await getDoc(tRef);
          if (tDoc.exists()) {
            return { id: trackId, ...tDoc.data() };
          }
          return null;
        }));
        myTracks.value = tracksWithDetails.filter(t => t !== null)
          .sort((a, b) => (b.views || 0) - (a.views || 0));
      }
      if (Array.isArray(userData.liked)) {
        const tracksWithDetails = await Promise.all(userData.liked.map(async (trackId) => {
          const tRef = doc(db, 'track', trackId);
          const tDoc = await getDoc(tRef);
          if (tDoc.exists()) {
            return { id: trackId, ...tDoc.data() };
          }
          return null;
        }));
        likedTracks.value = tracksWithDetails.filter(t => t !== null)
          .sort((a, b) => (b.views || 0) - (a.views || 0));
      }
    }
  });
  return unsub;
};

onMounted(async () => {

  
  await fetchTrackData(trackID.value);
  topHits.value = await getTracks('topHits');
  unsubscribe = handleLiveUpdates(trackID.value);




  // Start listening for real-time like updates once track data is fetched
  if (track.value && track.value.id) {
    listenForLikeUpdates(track.value.id);
  }

  // (Optional) Additional code block that was in your original try-catch
  try {
    const trackRef = doc(db, 'track', trackID.value);
    const plistRef = doc(db, 'playlists', 'boosted');
    const trackDoc = await getDoc(trackRef);
    const plistDoc = await getDoc(plistRef);

    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      track.value = { id: trackID.value, ...trackData };
      const userRef = doc(db, 'user', trackData.artist);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        artist.value = userData;
      }
    } else {
      console.log("Track not found.");
    }
    if (plistDoc.exists()) {
      const plistData = plistDoc.data();
      pList.value = plistData.tracks;
      console.log(pList.value);
    }
  } catch (error) {
    console.log(error);
  }

  // Example: Set audio track time (if needed)
  const audio = new Audio(track.value.url);
  audio.addEventListener('loadedmetadata', function () {
    const duration = audio.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    isTrackTime.value = minutes + ':' + seconds.toString().padStart(2, '0');
  });

  // Initialize WaveSurfer when the component is mounted
  wavesurfer = WaveSurfer.create({
    container: externalWaveform.value,
    waveColor: '#ffffff42',
        barWidth: 1,
        barGap: 3,
        barAlign: 'center',
        barHeight: 0.3,
        height: 30,
        responsive: true,
        hideScrollbar: true,
        barRadius: 4,
        normalize: true,
        interact: false,
        cursorWidth: 0,
  });
  wavesurfer.load(track.value.url);
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  if (unsubscribeTrack) unsubscribeTrack();
});

// Watch for route changes
watch(() => route.params.trackID, async (newID) => {
  if (unsubscribe) unsubscribe();
  trackID.value = newID;
  await fetchTrackData(newID);

  if (wavesurfer) {
  console.log("Destroying WaveSurfer instance...");
  await wavesurfer.destroy(); // Ensure it's fully destroyed
  wavesurfer = null; // Reset reference
}
wavesurfer = WaveSurfer.create({
    container: externalWaveform.value,
    waveColor: '#ffffff42',
        barWidth: 1,
        barGap: 3,
        barAlign: 'center',
        barHeight: 0.3,
        height: 30,
        responsive: true,
        hideScrollbar: true,
        barRadius: 4,
        normalize: true,
        interact: false,
        cursorWidth: 0,
  });
  await wavesurfer.load(track.value.url);

  unsubscribe = handleLiveUpdates(newID);
  // Re-subscribe to track updates for the new track ID
  if (unsubscribeTrack) unsubscribeTrack();
  listenForLikeUpdates(newID);
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

const playWave = () => {
  wavesurfer.playPause();
};

const visibleTracks = computed(() => {
  return showAllTracks.value ? myTracks.value : myTracks.value.slice(0, 3);
});

const visibleLikedTracks = computed(() => {
  return showAllLikedTracks.value ? likedTracks.value : likedTracks.value.slice(0, 3);
});

const editName = async () => {
  const newName = prompt('Edit Track Name:', trackName.value);
  if (newName) {
    trackName.value = newName;
    await updateProfileField('name', newName);
  }
};

const editAbout = async () => {
  const newAbout = prompt('Edit your description:', trackAbout.value);
  if (newAbout) {
    trackAbout.value = newAbout;
    await updateProfileField('description', newAbout);
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  const webhookUrl = 'https://discord.com/api/webhooks/1329746552008212523/_3YiBZAKs8yCECE12IVBUBVP7UiGemGageDp0QbXD6b1X0w6pJ--Nmd9G2WpfUSFHKHK';
  if (file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('payload_json', JSON.stringify({ content: 'User uploaded an image' }));
      const response = await axios.post(webhookUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.attachments && response.data.attachments.length > 0) {
        userAvatar.value = response.data.attachments[0].url;
        errorMessage.value = '';
        await updateProfileField('avatar', userAvatar.value);
      } else {
        throw new Error('No attachment URL found in the response.');
      }
    } catch (error) {
      console.error('Error uploading file to Discord webhook:', error);
      errorMessage.value = 'Failed to upload file. Please try again.';
    }
  }
};

const updateProfileField = async (field, value) => {
  try {
    const userRef = doc(db, 'track', trackID.value);
    await updateDoc(userRef, { [field]: value });
    console.log(`${field} updated successfully!`);
  } catch (error) {
    console.error('Error updating field:', error);
  }
};
</script>

<style scoped>
.track-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  color: white;
}

.profile-banner {
  width: 100%;
  height: 180px;
  background-color: #838383;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  border-radius: 12px 12px 0 0;
}

.banner-content {
  display: flex;
  flex-direction: column;
}

.track-name {
  font-size: 2.5rem;
  font-weight: 600;
  display: flex;
}

.profile-header {
  align-items: center;
  padding: 20px;
  width: 100%;
  justify-content: center;
}

.profile-img-container {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
}

.profile-img {
  object-fit: cover;
  width: 30%;
}

.profile-info {
  margin-left: 20px;
  color: white;
  text-align: center;
  padding: 1rem;
  padding-top: 0;
}

.about {
  display: flex;
  font-size: 1.2rem;
  font-style: italic;
  margin-top: 10px;
  word-wrap: break-word;
  line-height: 1.4;
}

.edit-icon {
  cursor: pointer;
  font-size: 1.2rem;
  margin-left: 5px;
}

.file-input {
  display: none;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
  }
  .profile-info {
    margin-left: 0;
    margin-top: 10px;
    text-align: center;
  }
  .user-name {
    font-size: 2rem;
  }
}

.low-credits {
  color: rgb(223, 68, 68);
}

.see-more-button {
  color: rgb(163, 163, 163);
  border: none;
  padding: 12px 24px;
  margin-top: 15px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 16px;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.see-more-button:hover {
  color: rgb(202, 202, 202);
  transform: scale(1.05);
}

.see-more-button:focus {
  outline: none;
}
</style>
