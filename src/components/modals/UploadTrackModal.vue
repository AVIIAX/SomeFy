<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <form @submit.prevent="handleSubmit">
        <!-- Artwork Input -->
        <div class="artwork-container">
          <label for="artwork" class="artwork-label cursor-pointer">
            <img v-if="artwork" :src="artwork" class="artwork-preview" alt="Uploaded artwork" />
            <div v-else class="imagePlaceHold artwork-placeholder"></div>
          </label>
          <input id="artwork" type="file" accept="image/*" class="hidden-input" @change="handleArtworkUpload" />
        </div>

        <div class="max-h-[500px] overflow-auto my-8 p-3">
          <span>Required</span>
          <!-- Name Input -->
          <input v-model="name" type="text" placeholder="Track Name" class="input" />

          <!-- Genre Dropdown -->
          <select v-model="selectedGenre" class="input">
            <option value="" disabled>Select Genre</option>
            <option v-for="genre in genresList" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>

          <!-- Year Input -->
          <input v-model="year" type="number" min="1900" max="2025" placeholder="Release Year" class="input" />

          <!-- Music File Input -->
          <span>Upload Track File</span>
          <input id="music" type="file" accept="audio/*" @change="handleMusicUpload" class="input track-upload" />

          <span>Optional</span>
          <!-- Description Input -->
          <textarea v-model="description" type="text" placeholder="Description" class="input"></textarea>

          <!-- Socials -->
          <input v-model="yt" type="text" placeholder="Youtube Link" class="input" />
          <input v-model="spotify" type="text" placeholder="Spotify Link" class="input" />
          <input v-model="soundc" type="text" placeholder="Sound Cloud Link" class="input" />
          <input v-model="apple" type="text" placeholder="Apple Music Link" class="input" />
        </div>
        <!-- Submit Button -->
        <button type="submit" class="submit-btn">
          Submit 5
          <CircleMultiple fill="#FFFFFF" size="20" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  arrayUnion,
  runTransaction
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { cropImageToSquare } from "../../main.js";
import { makeNotification } from '../../main.js';
import CircleMultiple from 'vue-material-design-icons/CircleMultiple.vue';

const modalStore = useModalStore();
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

const emit = defineEmits(['close']);
const currentUser = auth.currentUser;

// Track details
const name = ref('');
const selectedGenre = ref('');
const selectedLocation = ref('');
const year = ref('');
const description = ref('');
const yt = ref('');
const spotify = ref('');
const soundc = ref('');
const apple = ref('');

const artwork = ref(''); // Data URL for preview
const artworkBlob = ref(null); // Blob to be uploaded
const musicFile = ref(null); // Audio file object
const isSubmitting = ref(false);

// Dropdown options
const genresList = ref([]);

onMounted(async () => {
  try {
    // Fetch system data from Firestore (assumes a document at misc/system with fields 'genres' and 'location')
    const systemDocRef = doc(db, "misc", "system");
    const systemDocSnap = await getDoc(systemDocRef);
    if (systemDocSnap.exists()) {
      const data = systemDocSnap.data();
      genresList.value = data.genres || [];
    } else {
      console.error("System document does not exist!");
    }
  } catch (error) {
    console.error("Error fetching system data:", error);
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

const handleMusicUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    musicFile.value = file;
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  // Ensure required fields are filled (name, genre, location, year, artwork, music file)
  if (
    !name.value ||
    !selectedGenre.value ||
    !year.value ||
    !artworkBlob.value ||
    !musicFile.value ||
    !selectedLocation.value
  ) {
    alert('Please fill in all the fields!');
    return;
  }

  isSubmitting.value = true;

  try {
    // Create a new track document reference so we can use its ID for Storage paths
    const trackDocRef = doc(collection(db, "track"));
    const trackId = trackDocRef.id;

    // Run a transaction to check credits, add the track document, and update the user's doc
    const userRef = doc(db, "user", currentUser.uid);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist!");
      }
      const userData = userDoc.data();
      const currentCredits = userData.credits || 0;
      if (currentCredits < 5) {
        throw new Error("Not enough credits!");
      }

      const trackData = {
        artist: currentUser.uid,
        name: name.value,
        genre: selectedGenre.value,
        location: selectedLocation.value,
        year: year.value,
        image: "", // To be updated after Storage upload
        url: "",   // To be updated after Storage upload
        id: trackId,
        description: description.value,
        socials: {
          youtube: yt.value || null,
          spotify: spotify.value || null,
          soundcloud: soundc.value || null,
          applemusic: apple.value || null
        },
        views: 0,
        createdAt: new Date(),
      };

      transaction.set(trackDocRef, trackData);
      transaction.update(userRef, {
        tracks: arrayUnion(trackId),
        credits: currentCredits - 5,
      });
    });

    // Upload the artwork to Firebase Storage
    const artworkStorageRef = storageRef(storage, `users/${currentUser.uid}/tracks/${trackId}/artwork.png`);
    await uploadBytes(artworkStorageRef, artworkBlob.value, { contentType: 'image/png' });
    const artworkUrl = await getDownloadURL(artworkStorageRef);

    // Upload the audio file to Firebase Storage
    const audioStorageRef = storageRef(storage, `users/${currentUser.uid}/tracks/${trackId}/audio.wav`);
    await uploadBytes(audioStorageRef, musicFile.value, { contentType: 'audio/wav' });
    const audioUrl = await getDownloadURL(audioStorageRef);

    // Update the track document with the Storage URLs
    await updateDoc(trackDocRef, {
      image: artworkUrl,
      url: audioUrl,
    });

    closeModal();
    makeNotification('success', 'Track Uploaded Successfully!');
  } catch (error) {
    makeNotification('failure', 'Track Upload Failed! Try Again.');
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  // Clear inputs
  name.value = '';
  selectedGenre.value = '';
  selectedLocation.value = '';
  year.value = '';
  artwork.value = '';
  artworkBlob.value = null;
  musicFile.value = null;
  modalStore.toggleModal('uploadTrackModal');
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
