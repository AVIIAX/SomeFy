<template>
  <div class="user-profile">
    <!-- Banner Section -->
    <div class="profile-banner">
      <div class="banner-content">
        <h1 class="user-name">
          {{ userName.length > 20 ? userName.slice(0, 20) + '...' : userName }}
          <span v-if="isAuthUser" class="edit-icon" @click="editName">
            <Pencil fillColor="#FFFFFF" :size="20" />
          </span>
        </h1>
        <span v-if="isArtist">~ Artist</span>
        <p v-if="isAuthUser" class="credits">
  <strong>Credits : </strong> 
  <span :class="{ 'low-credits': userCredits <= 5 }">
    {{ userCredits || '0' }}
  </span>
</p>

      </div>
    </div>

    <div class="profile-header">
      <div class="profile-img-container cursor-pointer">
        <!-- Avatar -->
        <img :src="userAvatar || 'https://i.postimg.cc/wxrwGs5t/a331a8d0a8ff50827c6cb3437f336a30.jpg'" alt="User Avatar" class="profile-img" @click="triggerFileInput" />
        <div class="edit-icon-container" v-if="isAuthUser">
          <i class="material-icons">✏</i>
        </div>
        <!-- File Input -->
        <input v-if="isAuthUser" type="file" ref="fileInput" class="file-input" @change="handleFileChange" />
      </div>
      
      
      
    </div><div class="profile-info">
        <p class="about">
          {{ userAbout.length > 1000 ? userAbout.slice(0, 1000) + '...' : userAbout || 'No description available' }}

          <span v-if="isAuthUser" class="edit-icon" @click="editAbout">
            <Pencil fillColor="#FFFFFF" :size="20" />
          </span>
        </p>
      </div>
    
    
    <div v-if="isAuthUser" :style="{width: '100%'}">
      <button v-if="!isArtist" id="beArtist" @click="beArtist">Switch To Artist Page</button>
</div>
  </div>

  <!-- Tracks -->
   <div v-if="isArtist"></div>
   <div class="border-b border-b-[#2A2A2A] mt-2"></div>
   
   <!-- Liked Tracks -->
   <div v-if="!isArtist && likedTracks" class="p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Liked
    </button>

    <div class="mt-6"></div>
    <div class="flex items-center justify-between px-5 pt-2">
      <div>
        <ClockTimeThreeOutline fillColor="#FFFFFF" :size="18" />
      </div>
    </div>

    <div class="border-b border-b-[#2A2A2A] mt-2"></div>
    <div class="mb-4"></div>

    <!-- No grid layout for Music Section -->
    <ul class="w-full" v-for="(track, index) in artist.liked" :key="track">
      <SongRow :artist="artist" :track="track" :index="++index" />
    </ul>
  </div>

   <!-- My Tracks -->
   <div v-if="isArtist" class="p-8">
    
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Tracks
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

    
    <div v-if="!myTracks" class="text-sm" :style="{ color: '#666666', textAlign: 'center', padding: '2rem'}">No tracks yet</div>
      <div v-if="isAuthUser" :style="{textAlign: 'center'}">
        <button @click="showModal = true" class="open-modal-btn happyBtn" v-if="!myTracks" :style="{ backgroundColor: '#3481c9', color: 'Black', padding: '0.4rem',paddingRight:'1rem',paddingLeft:'1rem', borderRadius: '18px'}">Upload</button>
        <ModalComponent v-if="showModal" @close="showModal = false" />
    </div>
  </div>

</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import SongRow from '../components/SongRow.vue';
import ModalComponent from '../components/UploadTrackModal.vue';

const route = useRoute();
const userID = route.params.userID;
const userName = ref('');
const userAvatar = ref('');
const userAbout = ref('');
const userCredits = ref('');
const isAuthUser = ref(false);
const isArtist = ref(false);
const myTracks = ref([]);
const fileInput = ref(null);
const errorMessage = ref('');
const showModal = ref(false);
const showAllTracks = ref(false);
const db = getFirestore();
const currentUser = getAuth().currentUser;

onMounted(async () => {
  try {
    const userRef = doc(db, 'user', userID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      userName.value = userData.name;
      userAvatar.value =
        userData.avatar ||
        'https://cdn.discordapp.com/attachments/1329382057264025611/1329791122477809767/nopic.png';
      userAbout.value = userData.about || 'No description available';
      userCredits.value = userData.credits || '0';
      isAuthUser.value = currentUser && currentUser.uid === userID;
      isArtist.value = userData.artist;

      // Handle tracks
      if (isArtist && userData.tracks && Array.isArray(userData.tracks)) {
        // Fetch tracks with additional data (views, boost)
        const tracksWithDetails = await Promise.all(userData.tracks.map(async (trackId) => {
          const trackRef = doc(db, 'track', trackId);
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            return { id: trackId, ...trackDoc.data() };
          }
          return null;
        }));

        // Filter out any null values (tracks that couldn't be fetched)
        const filteredTracks = tracksWithDetails.filter(track => track !== null);

        // Sort tracks: First by boost (ascending), then by views (descending)
        myTracks.value = filteredTracks
          .sort((a, b) => {
            // Boost first in ascending order
            if (a.boost && b.boost) return a.boost - b.boost;
            if (a.boost) return -1; // Move boosted tracks to the top
            if (b.boost) return 1; // Move boosted tracks to the top
            // Then sort by views (descending)
            return (b.views || 0) - (a.views || 0);
          });
      }
    } else {
      console.log('No such user document!');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    errorMessage.value = 'Failed to fetch user data.';
  }
});

const visibleTracks = computed(() => {
  return showAllTracks.value ? myTracks.value : myTracks.value.slice(0, 3);
});

const editName = async () => {
  const newName = prompt('Edit your name:', userName.value);
  if (newName) {
    userName.value = newName;
    await updateProfileField('name', newName);
  }
};

const editAbout = async () => {
  const newAbout = prompt('Edit your description:', userAbout.value);
  if (newAbout) {
    userAbout.value = newAbout;
    await updateProfileField('about', newAbout);
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  const webhookUrl =
    'https://discord.com/api/webhooks/1329746552008212523/_3YiBZAKs8yCECE12IVBUBVP7UiGemGageDp0QbXD6b1X0w6pJ--Nmd9G2WpfUSFHKHK';
  if (file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('payload_json', JSON.stringify({ content: 'User uploaded an image' }));

      const response = await axios.post(webhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
    const userRef = doc(db, 'user', userID);
    await updateDoc(userRef, {
      [field]: value,
    });
    console.log(`${field} updated successfully!`);
  } catch (error) {
    console.error('Error updating field:', error);
  }
};

const beArtist = async () => {
    await updateProfileField('artist', true);
};
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background-color: rgb(28, 30, 37);
}

.profile-banner {
  width: 100%;
  height: 180px;
  background-color: #1db954;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  color: white;
  border-radius: 12px 12px 0 0;
}

.banner-content {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 2.5rem;
  font-weight: bold;
  display: flex;
}

.credits {
  font-size: 1.2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-top: -60px;
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
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
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

#beArtist {
  padding: 0.5rem;
  background-color: rgb(155, 143, 143);
  border-radius: 10px;
  width: 100%;
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
