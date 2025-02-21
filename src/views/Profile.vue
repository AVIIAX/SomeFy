<template>
  <div class="user-profile">
    <!-- Banner Section -->
    <div class="profile-banner" :style="`background-color: ${randColor.color};`">
      <div class="banner-content">
        <h1 class="user-name">
          {{ userName.length > 20 ? userName.slice(0, 20) + '...' : userName }}
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

    <div class="profile-header flex-col gap-2">
      <div class="profile-img-container cursor-pointer">
        <!-- Avatar -->
        <img :src="userAvatar || 'https://i.postimg.cc/wxrwGs5t/a331a8d0a8ff50827c6cb3437f336a30.jpg'" alt="User Avatar"
          class="profile-img" @click="triggerFileInput" />
        <div class="edit-icon-container" v-if="isAuthUser">
          <i class="material-icons">✏</i>
        </div>
        <!-- File Input -->
        <input v-if="isAuthUser" type="file" ref="fileInput" class="file-input" @change="handleFileChange" />
      </div>

      <div class="text-[#dadadaf3] flex gap-5 relative">
        <span @click="handleFollowClick(followers, 'Followers')" class="cursor-pointer">{{ followers.length ||
          '0'}}</span>
        |
        <span @click="handleFollowClick(following, 'Following')" class="cursor-pointer">{{ following.length ||
          '0'}}</span>
        <span v-if="isAuthUser" class="edit-icon absolute left-full" @click="editUser">
          <Cog fillColor="#FFFFFF" :size="20" />
        </span>
      </div>

      <div class="follow flex">
        <div v-if="!isAuthUser" class="follow" @click="toggleFollow">
          <div v-if="!isFollowed" class="follow-btn">FOLLOW</div>
          <div v-else class="followed-btn">UNFOLLOW</div>
        </div>
        <div v-if="isFollowed" class="collab-btn flex items-center gap-1" @click="handleCollabClick">
          <Collab fillColor="#aea9d89" :size="20" />
          COLLAB?
        </div>
      </div>
    </div>

    <div class="profile-info">
      <div class="text-gray-500">{{ userGenre }}</div>
      <p class="about">
        {{ userAbout.length > 1000 ? userAbout.slice(0, 1000) + '...' : userAbout || 'No description available' }}
      </p>
    </div>

    <div v-if="isAuthUser" :style="{ width: '100%' }">
      <button v-if="!isArtist" id="beArtist" @click="beArtist">Switch To Artist Page</button>
    </div>
  </div>

  <!-- Tracks -->
  <div v-if="isArtist"></div>
  <div class="border-b border-b-[#2A2A2A] mt-2"></div>

  <!-- My Tracks -->
  <div v-if="isArtist" class="p-8">
    <button type="button" class="text-white text-2xl font-semibold hover:underline cursor-pointer">
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
        <button v-if="myTracks.length > 3 && !showAllTracks" @click="showAllTracks = true" class="see-more-button">
          Show More
        </button>
      </div>
    </div>
    <div v-if="!myTracks.length" class="text-sm" :style="{ color: '#666666', textAlign: 'center', padding: '2rem' }">No
      tracks yet</div>
    <div v-if="isAuthUser" :style="{ textAlign: 'center' }">
      <button @click="handleSongUploadClick" class="open-modal-btn happyBtn" v-if="!myTracks.length"
        :style="{ backgroundColor: '#3481c9', color: 'Black', padding: '0.4rem', paddingRight: '1rem', paddingLeft: '1rem', borderRadius: '18px' }">Upload</button>
    </div>
  </div>

  <!-- Liked Tracks -->
  <div v-if="likedTracks" class="p-8">
    <button type="button" class="text-white text-2xl font-semibold hover:underline cursor-pointer">
      Liked Tracks
    </button>
    <div v-if="likedTracks">
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
          <li v-for="(track, index) in visibleLikedTracks" :key="track">
            <SongRow :trackId="track.id" :playList="likedTracks" :index="index + 1" />
          </li>
        </ul>
        <button v-if="likedTracks.length > 3 && !showAllLikedTracks" @click="showAllLikedTracks = true"
          class="see-more-button">
          Show More
        </button>
      </div>
    </div>
    <div v-if="!likedTracks.length" class="text-sm" :style="{ color: '#666666', textAlign: 'center', padding: '2rem' }">
      No liked tracks</div>
    <div v-if="isAuthUser" :style="{ textAlign: 'center' }"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import SongRow from '../components/SongRow.vue';
import ModalComponent from '../components/modals/UploadTrackModal.vue';
import Cog from 'vue-material-design-icons/Cog.vue';
import Collab from 'vue-material-design-icons/AccountMultipleOutline.vue';
import axios from 'axios';
import { useModalStore } from '../stores/modalStore.js';
import uniqolor from 'uniqolor';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { cropImageToSquare } from "../main.js";


// Initialize Firebase Storage
const storage = getStorage();

let randColor = ref('');
randColor.value = uniqolor.random({ lightness: 10 });

const route = useRoute();
const db = getFirestore();
const currentUser = getAuth().currentUser;
const isFollowed = ref(false);
const userID = ref(route.params.userID);
const userName = ref('');
const userGenre = ref('');
const userAvatar = ref('');
const userAbout = ref('');
const userCredits = ref('');
const isAuthUser = ref(false);
const isArtist = ref(false);
const myTracks = ref([]);
const likedTracks = ref([]);
const followers = ref([]);
const following = ref([]);
const fileInput = ref(null);
const errorMessage = ref('');
const modalStore = useModalStore();
const showAllTracks = ref(false);
const showAllLikedTracks = ref(false);
const artworkBlob = ref(null); // To store the cropped image blob

// Utility function to update a profile field in Firestore
const updateProfileField = async (field, value) => {
  const userDocRef = doc(db, 'user', userID.value);
  await updateDoc(userDocRef, { [field]: value });
};

const fetchUserData = async (id) => {
  try {
    const userRef = doc(db, 'user', id);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      userName.value = userData.name;
      userGenre.value = userData.genre;
      userAvatar.value = userData.avatar || 'https://i.postimg.cc/wxrwGs5t/a331a8d0a8ff50827c6cb3437f336a30.jpg';
      userAbout.value = userData.about || 'No description available';
      isAuthUser.value = currentUser && currentUser.uid === id;
      isArtist.value = userData.artist || false;

      if (isArtist.value) {
        myTracks.value = await fetchTrackDetails(userData.tracks || []);
      }
      likedTracks.value = await fetchTrackDetails(userData.liked || []);
      followers.value = userData.followers || [];
      following.value = userData.following || [];

      if (userData.followers && Array.isArray(userData.followers)) {
        isFollowed.value = userData.followers.includes(currentUser.uid);
      } else {
        isFollowed.value = false;
      }
    } else {
      console.error('No such user document!');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    errorMessage.value = 'Failed to fetch user data.';
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

// Handle live updates from Firestore
const handleLiveUpdates = (id) => {
  const unsubscribe = onSnapshot(doc(db, 'user', id), async (docSnapshot) => {
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      userCredits.value = userData.credits || '0';

      if (isArtist.value && Array.isArray(userData.tracks)) {
        const tracksWithDetails = await Promise.all(userData.tracks.map(async (trackId) => {
          const trackRef = doc(db, 'track', trackId);
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            return { id: trackId, ...trackDoc.data() };
          }
          return null;
        }));

        myTracks.value = tracksWithDetails
          .filter(track => track !== null)
          .sort((a, b) => {
            if (a.boost && b.boost) return b.boost - a.boost;
            if (a.boost) return -1;
            if (b.boost) return 1;
            return (b.views || 0) - (a.views || 0);
          });
      }
      if (Array.isArray(userData.liked)) {
        const tracksWithDetails = await Promise.all(userData.liked.map(async (trackId) => {
          const trackRef = doc(db, 'track', trackId);
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            return { id: trackId, ...trackDoc.data() };
          }
          return null;
        }));

        likedTracks.value = tracksWithDetails
          .filter(track => track !== null)
          .sort((a, b) => {
            if (a.boost && b.boost) return b.boost - a.boost;
            if (a.boost) return -1;
            if (b.boost) return 1;
            return (b.views || 0) - (a.views || 0);
          });
      }
    }
  });

  return unsubscribe;
};

let unsubscribe;
onMounted(async () => {
  await fetchUserData(userID.value);
  unsubscribe = handleLiveUpdates(userID.value);
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

// Watch for route changes to update user data and reinitialize colors
watch(
  () => route.params.userID,
  async (newID) => {
    if (unsubscribe) unsubscribe();
    userID.value = newID;
    myTracks.value = [];
    likedTracks.value = [];
    await fetchUserData(newID);
    unsubscribe = handleLiveUpdates(newID);
    randColor.value = uniqolor.random({ lightness: 10 });
  }
);

const visibleTracks = computed(() => {
  return showAllTracks.value ? myTracks.value : myTracks.value.slice(0, 3);
});

const visibleLikedTracks = computed(() => {
  return showAllLikedTracks.value ? likedTracks.value : likedTracks.value.slice(0, 3);
});

const editUser = async () => {
  const dataForEditModal = { trackID: null, user: userID };
  modalStore.toggleModal('editProfileModal', dataForEditModal);
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      // Crop the image to a square using the provided function (returns a Blob)
      const croppedBlob = await cropImageToSquare(file);
      artworkBlob.value = croppedBlob;

      // Upload the cropped image to Firebase Storage
      const artworkStorageRef = storageRef(storage, `users/${userID.value}/profile/avatar.png`);

      await uploadBytes(artworkStorageRef, artworkBlob.value, { contentType: 'image/png' });
      const artworkUrl = await getDownloadURL(artworkStorageRef);

      // Update the user's avatar with the new image URL
      userAvatar.value = artworkUrl;
      errorMessage.value = '';
      await updateProfileField('avatar', artworkUrl);
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      errorMessage.value = 'Failed to upload file. Please try again.';
    }
  }
};

const beArtist = async () => {
  await updateProfileField('artist', true);
};

const handleSongUploadClick = () => {
  modalStore.toggleModal('uploadTrackModal', null);
};

const toggleFollow = async () => {
  if (!userID.value) return;

  const userDocRef = doc(db, "user", userID.value);
  const thisUserDocRef = doc(db, "user", currentUser.uid);

  try {
    const userSnap = await getDoc(userDocRef);
    const thisUserSnap = await getDoc(thisUserDocRef);

    if (userSnap.exists() && thisUserSnap.exists()) {
      const userData = userSnap.data();
      const thisUserData = thisUserSnap.data();

      const userFollowers = Array.isArray(userData.followers) ? userData.followers : [];
      const thisUserFollowing = Array.isArray(thisUserData.following) ? thisUserData.following : [];

      let newFollowers = [...userFollowers];
      let newFollowing = [...thisUserFollowing];

      if (userFollowers.includes(currentUser.uid)) {
        // Unfollow: remove user from arrays
        newFollowers = newFollowers.filter(uid => uid !== currentUser.uid);
        newFollowing = newFollowing.filter(uid => uid !== userID.value);

        await updateDoc(userDocRef, { followers: newFollowers });
        await updateDoc(thisUserDocRef, { following: newFollowing });
      } else {
        // Follow: add user to arrays
        newFollowers.push(currentUser.uid);
        newFollowing.push(userID.value);

        const mailKey = Date.now().toString() + Math.random().toString(36).substring(2, 15);
        const newMail = {
          type: "follower",
          follower: currentUser.uid,
          time: new Date(),
          seen: false,
        };

        await updateDoc(userDocRef, {
          followers: newFollowers,
          [`inboxMails.${mailKey}`]: newMail,
        });

        await updateDoc(thisUserDocRef, { following: newFollowing });
      }

      isFollowed.value = !isFollowed.value;
    }
  } catch (error) {
    console.error("Error updating follow status:", error);
  }
};

const handleFollowClick = (dataType, name) => {
  const dataForBoostModal = { users: dataType, name: name };
  modalStore.toggleModal('followModal', dataForBoostModal);
};

const handleCollabClick = () => {
  const dataForCollabModal = { type: 'request', target: userID.value, this: currentUser.uid };
  modalStore.toggleModal('collabModal', dataForCollabModal);
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
  backsground-color: #838383;
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
  margin-top: 10px;
  word-wrap: break-word;
  line-height: 1.4;
}

.edit-icon {
  cursor: pointer;
  font-size: 1.2rem;
  margin-left: 1rem;
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
