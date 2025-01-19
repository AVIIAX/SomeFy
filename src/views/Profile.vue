<template>
  <div class="user-profile">
    <!-- Banner Section -->
    <div class="profile-banner">
      <div class="banner-content">
        <h1 class="user-name">
          {{ userName }}
          <span v-if="isAuthUser" class="edit-icon" @click="editName">
            <i class="material-icons">𓂃🖊</i>
          </span>
        </h1>
        
        <p v-if="isAuthUser" class="credits">
          <strong>Credits:</strong> {{ userCredits || '0' }}
        </p><span v-if="isArtist">~ Artist</span>
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
      <div class="profile-info">
        <p class="about">
          {{ userAbout || 'No description available' }}
          <span v-if="isAuthUser" class="edit-icon" @click="editAbout">
            <i class="material-icons">𓂃🖊</i>
          </span>
        </p>
      </div>
      
    </div><div v-if="isAuthUser" :style="{width: '100%'}">
      <button v-if="!isArtist" id="beArtist" @click="beArtist">Switch To Artist Page</button>
</div>
  </div>

  <!-- My Tracks -->
   <div v-if="isArtist"></div>
   <!-- <ul class="w-full" v-for="(track, index) in artist.tracks" :key="track">
      <SongRow :artist="artist" :track="track" :index="++index" />
    </ul> -->


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

    <!-- No grid layout for Music Section -->
    <ul class="w-full" v-for="(track, index) in myTracks" :key="track">
      <SongRow :trackId="track" :index="++index" />
    </ul>
    </div>
    <div v-if="!myTracks" class="text-sm" :style="{ color: '#666666', textAlign: 'center', padding: '2rem'}">No tracks yet</div>
      <div v-if="isAuthUser" :style="{textAlign: 'center'}">
        <button class="happyBtn" v-if="!myTracks" :style="{ backgroundColor: '#3481c9', color: 'Black', padding: '0.4rem',paddingRight:'1rem',paddingLeft:'1rem', borderRadius: '18px'}">Upload</button>
    </div>
  </div>

</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc, } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import SongRow from '../components/SongRow.vue';
import artist from '../artist.json'

const route = useRoute();
const userID = route.params.userID;
const userName = ref('');
const userAvatar = ref('');
const userAbout = ref('');
const userCredits = ref('');
const isAuthUser = ref(false);
const isArtist = ref(false);
const myTracks = ref('');
const likedTracks = ref([]);
const fileInput = ref(null);
const errorMessage = ref('');

const db = getFirestore();
const currentUser = getAuth().currentUser;


onMounted(async () => {
  try {
    const userRef = doc(db, 'user', userID); // Replace userID with the actual user ID
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
        myTracks.value = userData.tracks;
        
      }

    } else {
      console.log('No such user document!');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    errorMessage.value = 'Failed to fetch user data.';
  }
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
}

.about {
  font-size: 1.2rem;
  font-style: italic;
  margin-top: 10px;
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
</style>
