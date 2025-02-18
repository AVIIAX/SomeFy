<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <form @submit.prevent="handleSubmit">
        <!-- Artwork Input -->
        <div class="artwork-container">
          <label for="artwork" class="artwork-label">
            <img
              v-if="artwork"
              :src="artwork"
              class="artwork-preview"
              alt="Uploaded artwork"
            />
            <img
              v-else
              src="https://archive.org/download/placeholder-image/placeholder-image.jpg"
              class="artwork-placeholder"
              alt="Placeholder"
            />
          </label>
          <input
            id="artwork"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="handleArtworkUpload"
          />
        </div>

        <!-- Name Input -->
        <input
          v-model="name"
          type="text"
          placeholder="Enter song name"
          class="input"
        />

        <!-- Genre Input -->
        <input
          v-model="genre"
          type="text"
          placeholder="Enter genre"
          class="input"
        />

        <!-- Year Input -->
        <input
          v-model="year"
          type="text"
          placeholder="Release year"
          class="input"
        />

        <!-- Music File Input -->
        <input
          id="music"
          type="file"
          accept="audio/*"
          @change="handleMusicUpload"
          class="input"
        />

        <!-- Submit Button -->
        <button type="submit" class="submit-btn happyBtn">Submit</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
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

const modalStore = useModalStore();
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

const emit = defineEmits(['close']);
const currentUser = auth.currentUser;

// Track details
const name = ref('');
const genre = ref('');
const year = ref('');
const artwork = ref(''); // Data URL for preview
const artworkBlob = ref(null); // Blob to be uploaded
const musicFile = ref(null); // Audio file object
const isSubmitting = ref(false);

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

  if (!name.value || !genre.value || !year.value || !artworkBlob.value || !musicFile.value) {
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
        genre: genre.value,
        year: year.value,
        image: "", // To be updated after Storage upload
        url: "",   // To be updated after Storage upload
        id: trackId,
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
    const artworkStorageRef = storageRef(storage, `tracks/artwork/${trackId}`);
    await uploadBytes(artworkStorageRef, artworkBlob.value, { contentType: 'image/png' });
    const artworkUrl = await getDownloadURL(artworkStorageRef);

    // Upload the audio file to Firebase Storage
    const audioStorageRef = storageRef(storage, `tracks/audio/${trackId}`);
    await uploadBytes(audioStorageRef, musicFile.value, { contentType: 'audio/mpeg' });
    const audioUrl = await getDownloadURL(audioStorageRef);

    // Update the track document with the Storage URLs
    await updateDoc(trackDocRef, {
      image: artworkUrl,
      url: audioUrl,
    });

    alert('Track uploaded successfully!');
    closeModal();
  } catch (error) {
    console.error('Error uploading track:', error);
    alert('Failed to upload the track. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  // Clear inputs
  name.value = '';
  genre.value = '';
  year.value = '';
  artwork.value = '';
  artworkBlob.value = null;
  musicFile.value = null;
  modalStore.toggleModal('uploadTrackModal');
};
</script>

<style scoped>
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
  border: 1px solid #555;
  border-radius: 5px;
  font-size: 14px;
  background-color: #3c3c3c;
  color: #f0f0f0;
}

/* Submit Button */
.submit-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:hover {
  background-color: #45a049;
}
</style>
