<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h1>Update {{modalData?.user ? 'Profile' : 'Track'}}</h1>

      <!-- Edit Track -->
      <form v-if="modalData?.trackID" @submit.prevent="handleSubmit">
        <!-- Artwork Input -->
        <div class="artwork-container">
          <label for="artwork" class="artwork-label cursor-pointer">
            <img
              v-if="artwork"
              :src="artwork"
              class="artwork-preview"
              alt="Uploaded artwork"
            />
            <div v-else class="imagePlaceHold artwork-placeholder"></div>
          </label>
          <input
            id="artwork"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="handleArtworkUpload"
          />
        </div>

        <div class="max-h-[500px] overflow-auto my-8 p-3">
          <span>Required</span>
          <!-- Name Input -->
          <input
            v-model="name"
            type="text"
            placeholder="Track Name"
            class="input"
          />

          <!-- Genre Dropdown -->
          <select v-model="genre" class="input">
            <option value="" disabled>Select Genre</option>
            <option v-for="g in genresList" :key="g" :value="g">
              {{ g }}
            </option>
          </select>

          <!-- Year Input -->
          <input
            v-model="year"
            type="number"
            min="1900"
            max="2025"
            placeholder="Release Year"
            class="input"
          />

          <span>Optional</span>
          <!-- Description Input -->
          <textarea
            v-model="description"
            type="text"
            placeholder="Description"
            class="input"
          />

          <!-- Socials -->
          <input
            v-model="yt"
            type="text"
            placeholder="Youtube Link"
            class="input"
          />
          <input
            v-model="spotify"
            type="text"
            placeholder="Spotify Link"
            class="input"
          />
          <input
            v-model="soundc"
            type="text"
            placeholder="Sound Cloud Link"
            class="input"
          />
          <input
            v-model="apple"
            type="text"
            placeholder="Apple Music Link"
            class="input"
          />
        </div>
        <!-- Submit Button -->
        <button type="submit" class="submit-btn">Update</button>
      </form>

      <!-- Edit User -->
      <form v-else-if="modalData?.user" @submit.prevent="handleSubmit">
        <div class="max-h-[500px] overflow-auto my-8 p-3">
          <!-- Name Input -->
          <input
            v-model="userName"
            type="text"
            placeholder="User Name"
            class="input"
          />

          <!-- Custom Name Input -->
          <input v-if="isPro"
       v-model="userCustomID"
       type="text"
       placeholder="Custom Username"
       class="input"
       :style="{ border: 'solid 2px', borderColor: customIDStatus === 'taken' ? 'red' : customIDStatus === 'available' ? 'green' : '' }" />
          <span v-if="customIDStatus === 'taken' && customIDStatus !== 'null'" class="text-red-500">Username Not Available</span>
          <span v-if="customIDStatus === 'available' && customIDStatus !== 'null'" class="text-green-500">Username Available</span>

          <!-- Genre Dropdown -->
          <select v-if="modalData?.user.artist" v-model="userGenre" class="input">
            <option value="" disabled>Select Genre</option>
            <option v-for="g in genresList" :key="g" :value="g">
              {{ g }}
            </option>
          </select>

          <!-- Location Dropdown -->
          <select v-model="userLocation" class="input">
            <option value="" disabled>Select Location</option>
            <option v-for="loc in locationsList" :key="loc" :value="loc">
              {{ loc }}
            </option>
          </select>

          <!-- About Input -->
          <textarea
            v-model="userAbout"
            type="text"
            placeholder="About"
            class="input"
          />
        </div>
        <!-- Submit Button -->
        <button type="submit" class="submit-btn">Update</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, computed, watch } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { cropImageToSquare } from "../../main.js";
import { makeNotification } from '../../main.js';
import { useUserStore } from '../../stores/user';  // Import the store
const userStore = useUserStore();  // Access the store
const isPro = computed(() => userStore.isPro);  // Access `isPro` from the store

const modalStore = useModalStore();
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const modalData = modalStore.modals.editProfileModal.data;

const emit = defineEmits(['close']);
const currentUser = auth.currentUser;

// Profile details
const user = ref([]);
const userName = ref('');
const userCustomID = ref('');
const customIDStatus = ref(''); // 'available' or 'taken' or ''
const userAvatar = ref('');
const userAbout = ref('');
const userGenre = ref('');
const userLocation = ref('');

// Track details
const track = ref([]);
const name = ref('');
const genre = ref('');
const year = ref('');
const description = ref('');
const yt = ref('');
const spotify = ref('');
const soundc = ref('');
const apple = ref('');

const artwork = ref(''); // Data URL for preview
const artworkBlob = ref(null); // Blob to be uploaded

const genresList = ref([]);
const locationsList = ref([]);

const isSubmitting = ref(false);

const fetchUserData = async (id) => {
  try {
    const userRef = doc(db, 'user', id);
    const userDoc = await getDoc(userRef);
    // Fetch system data from Firestore (assumes a document at misc/system with fields 'genres' and 'locations')
    const systemDocRef = doc(db, "misc", "system");
    const systemDocSnap = await getDoc(systemDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      user.value = userData;
      userName.value = userData.name;
      userCustomID.value = userData.customID;
      userAvatar.value = userData.avatar;
      userAbout.value = userData.about;
      userGenre.value = userData.genre;
      userLocation.value = userData.location;
    } else {
      console.error('No such user document!');
    }

    if (systemDocSnap.exists()) {
      const data = systemDocSnap.data();
      genresList.value = data.genres || [];
      locationsList.value = data.locations || [];
    } else {
      console.error("System document does not exist!");
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

const fetchTrackData = async (id) => {
  try {
    const trackRef = doc(db, 'track', id);
    const trackDoc = await getDoc(trackRef);
    // Fetch system data from Firestore (assumes a document at misc/system with field 'genres')
    const systemDocRef = doc(db, "misc", "system");
    const systemDocSnap = await getDoc(systemDocRef);

    if (trackDoc.exists()) {
      const trackData = trackDoc.data();
      track.value = trackData;
      name.value = trackData.name;
      genre.value = trackData.genre;
      year.value = trackData.year;
      description.value = trackData.description;
      artwork.value = trackData.image;
      yt.value = trackData.socials.youtube;
      spotify.value = trackData.socials.spotify;
      soundc.value = trackData.socials.soundcloud;
      apple.value = trackData.socials.applemusic;
    } else {
      console.log("Track not found.");
    }

    if (systemDocSnap.exists()) {
      const data = systemDocSnap.data();
      genresList.value = data.genres || [];
    } else {
      console.error("System document does not exist!");
    }
  } catch (error) {
    console.error('Error fetching track data:', error);
  }
};

const restrictedCharacters = [
  '/', '>', '<', '@', '#', '$', '%', '&', '*', '!', '(', ')', '=', '+', 
  '[', ']', '{', '}', ';', ':', '"', "'", '\\', '|', '^', '~', '`', 
  ',', '.', '?', ' ', '\t', '\n', '\r', '\b', '\f'
];

// Emoji Unicode range patterns (these are broad patterns, but will capture most emojis)
const emojiRegex = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{2B50}]/gu;

const checkCustomIDAvailability = async (customID) => {
  try {
    // If customID is empty, return null immediately
    if (!customID || customID.trim() === '') {
      return null;
    }

    // Check if customID contains any restricted characters (including emojis)
    for (const char of restrictedCharacters) {
      if (customID.includes(char)) {
        return false; // Return false if restricted characters are found
      }
    }

    // Check if customID contains emojis or special symbols using regex
    if (emojiRegex.test(customID)) {
      return false; // Return false if emojis or special symbols are found
    }

    const usersRef = collection(db, 'user');
    const q = query(usersRef, where('customID', '==', customID));
    const querySnapshot = await getDocs(q);

    // If customID matches the current user's customID, return null
    if (querySnapshot.size === 1 && querySnapshot.docs[0].id === currentUser.uid) {
      return null;
    }

    // If no documents were found, customID is available
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking customID availability:', error);
    return false; // Return false if there's an error (e.g., network issues)
  }
};






onMounted(async () => {
  if (modalData.user) {
    await fetchUserData(currentUser.uid);
  } else if (modalData.trackID) {
    await fetchTrackData(modalData.trackID);
  }
});

watch(userCustomID, async (newCustomID) => {
  if (newCustomID) {
    // If the new customID is the same as the current user's customID, consider it available
    const isAvailable = newCustomID === user.value.customID || await checkCustomIDAvailability(newCustomID);
    customIDStatus.value = isAvailable === null 
  ? 'null' 
  : isAvailable 
  ? 'available' 
  : 'taken';

    console.log(isAvailable);
    
    
  } else {
    customIDStatus.value = ''; // Reset if customID is empty
  }
});



const handleArtworkUpload = async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      // Crop the image to a square (returns a Blob)
      const croppedBlob = await cropImageToSquare(file);
      artworkBlob.value = croppedBlob; // Save for Storage upload

      // Generate a Data URL for preview purposes
      const reader = new FileReader();
      reader.onload = (event) => {
        artwork.value = event.target.result;
      };
      reader.readAsDataURL(croppedBlob);
    } catch (error) {
      console.error('Error processing the image:', error);
    }
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  if (modalData?.trackID) {
    if (!name.value || !genre.value || !year.value) {
      alert('Please fill in all the fields!');
      return;
    }

    isSubmitting.value = true;

    try {
      const fieldsToCheck = [
        { field: 'name', newVal: name, modalValue: track.value.name },
        { field: 'genre', newVal: genre, modalValue: track.value.genre },
        { field: 'year', newVal: year, modalValue: track.value.year },
        { field: 'description', newVal: description, modalValue: track.value.description },
        { field: 'socials.youtube', newVal: yt, modalValue: track.value.socials.youtube },
        { field: 'socials.spotify', newVal: spotify, modalValue: track.value.socials.spotify },
        { field: 'socials.soundcloud', newVal: soundc, modalValue: track.value.socials.soundcloud },
        { field: 'socials.applemusic', newVal: apple, modalValue: track.value.socials.applemusic },
      ];

      fieldsToCheck.forEach(({ field, newVal, modalValue }) => {
        if (newVal.value !== modalValue) {
          updateProfileField(field, newVal.value);
        }
      });

      if (artworkBlob.value) {
        // Update the artwork to Firebase Storage
        const artworkStorageRef = storageRef(
          storage,
          `users/${currentUser.uid}/tracks/${modalData.trackID}/artwork.png`
        );
        await uploadBytes(artworkStorageRef, artworkBlob.value, { contentType: 'image/png' });
        const artworkUrl = await getDownloadURL(artworkStorageRef);

        // Update the track document with the Storage URL
        await updateDoc(doc(db, 'track', modalData.trackID), {
          image: artworkUrl,
        });
      }
      closeModal();
      makeNotification('success', 'Track Updated Successfully!');
    } catch (error) {
      makeNotification('failure', 'Couldnt Update Track! Try Again.');
    } finally {
      isSubmitting.value = false;
    }
  }

  if (modalData?.user) {
    if (!userName.value || customIDStatus.value === 'taken') {
      alert('Please fill in all the fields!');
      return;
    }

    isSubmitting.value = true;

    try {
      const fieldsToCheck = [
        { field: 'name', newVal: userName, modalValue: user.value.name },
        { field: 'customID', newVal: userCustomID, modalValue: user.value.customID },
        { field: 'genre', newVal: userGenre, modalValue: user.value.genre },
        { field: 'about', newVal: userAbout, modalValue: user.value.about },
        { field: 'location', newVal: userLocation, modalValue: user.value.location },
      ];

      fieldsToCheck.forEach(({ field, newVal, modalValue }) => {
        if (newVal.value !== modalValue) {
          updateProfileField(field, newVal.value);
        }
      });

      closeModal();
      makeNotification('success', 'Profile Updated Successfully!');
    } catch (error) {
      makeNotification('failure', 'Couldnt Update Profile! Try Again.');
    } finally {
      isSubmitting.value = false;
    }
  }
};

const updateProfileField = async (field, value) => {
  if (modalData.trackID) {
    try {
      const trackRef = doc(db, 'track', modalData.trackID);
      await updateDoc(trackRef, { [field]: value });
    } catch (error) {
      console.error('Error updating field:', error);
    }
  } else if (modalData.user) {
    try {
      const userRef = doc(db, 'user', modalData.user);
      await updateDoc(userRef, { [field]: value });
    } catch (error) {
      console.error('Error updating field:', error);
    }
  }
};

const closeModal = () => {
  // Clear inputs
  name.value = '';
  genre.value = '';
  year.value = '';
  artwork.value = '';
  artworkBlob.value = null;
  modalStore.toggleModal('editProfileModal');
};
</script>

<style scoped>
.modal-container {
  width: 700px;
  padding: 30px;
}
/* Artwork Input */
.artwork-container {
  margin: 20px 0;
  position: relative;
}

.artwork-label {
  display: block;
  cursor: pointer;
  position: relative;
}

.artwork-placeholder,
.artwork-preview {
  width: 200px;
  height: 200px;
  display: inline;
  object-fit: cover;
  border: 2px dashed #555;
  border-radius: 10px;
  transition: opacity 0.3s;
}

.artwork-placeholder:hover,
.artwork-preview:hover {
  opacity: 0.8;
}

.hidden-input {
  display: none;
}

/* Input Fields */
.input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  font-size: 14px;
  background-color: #2c2c2cbb;
  color: #f0f0f0;
}

/* Submit Button */
.submit-btn {
  position: relative;
  color: white;
  border: none;
  padding: 10px 20px;
  border: 2px solid #e0e0e0ea;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  left: 50%;
  transform: translateX(-50%);
  word-spacing: 0.5rem;
  transition: all 0.3s;
}

.submit-btn:hover {
  background-color: #e0e0e041;
  transform: translateX(-50%) scale(1.05);
}

.track-upload {
  position: relative;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.track-upload::after {
  content: '';
  position: absolute;
  width: 98%;
  height: 80%;
  border: 2px dotted rgb(138, 138, 138);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.track-upload::-webkit-file-upload-button {
  visibility: hidden;
}

.artwork-label::-webkit-file-upload-button {
  visibility: hidden;
}

.imagePlaceHold {
  display: flex;
  text-align: center;
  justify-content: center;
  justify-items: center;
  align-items: center;
  letter-spacing: 3px;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

.imagePlaceHold::after {
  content: 'Track Artwork';
}
</style>
