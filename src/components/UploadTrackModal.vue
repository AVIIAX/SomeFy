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
          <button @click="uploadTrack" type="submit" class="submit-btn happyBtn">Submit</button>
        </form>
      </div>
    </div>
</template>
  
<script setup>
import { ref, defineEmits } from 'vue';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, addDoc, updateDoc, collection, arrayUnion, runTransaction } from "firebase/firestore";

// Firebase setup
const db = getFirestore();
const auth = getAuth();

const emit = defineEmits(['close']);
const currentUser = auth.currentUser;

// Track details
const name = ref('');
const genre = ref('');
const year = ref('');
const artwork = ref('');
const musicFile = ref('');
const isSubmitting = ref(false); // Track the submission state

const handleArtworkUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      artwork.value = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value) return; // Prevent duplicate submissions

  if (!name.value || !genre.value || !year.value || !artwork.value) {
    alert('Please fill in all the fields!');
    return;
  }

  isSubmitting.value = true; // Lock submission

  try {

    // Use a transaction to update the user's credits and tracks atomically
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

       // Add track data to 'track' collection
    const trackRef = await addDoc(collection(db, "track"), {
      artist: currentUser ? currentUser.uid : "unknown",
      name: name.value,
      genre: genre.value,
      year: year.value,
      image: artwork.value,
      id: '', // Temporary placeholder for the ID
      views: 0,
      createdAt: new Date(),
    });

    const trackId = trackRef.id; // Fetch the generated unique ID

    // Update the track document to include the ID
    await updateDoc(trackRef, {
      id: trackId,
    });


      transaction.update(userRef, {
        tracks: arrayUnion(trackId),
        credits: currentCredits - 5,
      });
    });

    
   

    

    alert('Track uploaded successfully!');
    closeModal();
  } catch (error) {
    console.error('Error uploading track:', error);
    alert('Failed to upload the track. Please try again.');
  } finally {
    isSubmitting.value = false; // Unlock submission
  }
};



const closeModal = () => {
  // Clear inputs
  name.value = '';
  genre.value = '';
  artwork.value = '';
  musicFile.value = '';
  emit('close');
};
</script>

  
<style scoped>
  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8); /* Dark transparent background */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  /* Modal Container */
  .modal-container {
    background-color: #2c2c2c; /* Dark mode modal */
    padding: 20px;
    border-radius: 10px;
    width: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    text-align: center;
    color: #f0f0f0; /* Light text */
    position: relative;
  }
  
  /* Close Button */
  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: #f0f0f0;
    font-size: 20px;
    cursor: pointer;
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
