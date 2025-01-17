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
        <img :src="userAvatar || 'default-avatar.jpg'" alt="User Avatar" class="profile-img" @click="triggerFileInput" />
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


  <!-- Liked Tracks -->
   <div v-if="!isArtist"></div>

</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import SongRow from '../components/SongRow.vue';

const route = useRoute();
const userID = route.params.userID;
const userName = ref('');
const userAvatar = ref('');
const userAbout = ref('');
const userCredits = ref('');
const isAuthUser = ref(false);
const isArtist = ref(false);
const fileInput = ref(null);
const errorMessage = ref('');

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
    } else {
      console.log('No such user document!');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
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
