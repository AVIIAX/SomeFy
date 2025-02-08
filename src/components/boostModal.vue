<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h1>{{ modalData?.track.name }}</h1>
      <span class="opacity-60">{{  modalData?.artist.name }}</span>

      <DotLottieVue v-if="Number(userCredits) >= 5" class="svg my-2" style="height: 200px; width: 200px" autoplay loop src="https://lottie.host/ac7fe980-2e4a-49d9-bfff-6ceee45e881a/Q6BmlsVQ2u.lottie" />
      <DotLottieVue v-else class="svg my-2" style="height: 200px; width: 200px" autoplay loop src="https://lottie.host/7981ca63-1a71-428b-8ccd-7333ffc3d054/Art1r2HjSF.lottie" />
      <span>Plays</span>
      <button class="level">{{ modalData?.track.views || '0'}}</button>
      
      <span>Likes</span>
      <button class="level">{{ modalData?.track.liked?.length || '0'}}</button>

      <span>Current Level</span>
      <button class="level">{{ modalData?.track.boost || '0'}}</button>

      <p>Upgrade This Track To Level {{ modalData?.track.boost + 1 || '1'}} To Get More Audience</p>
      <button @click="boostTrack" v-if="Number(userCredits) >= (modalData?.track.boost ? modalData?.track.boost * 5 : 5)" 
        class="boostThis boost boost-moving-gradient boost-moving-gradient--blue my-5">
  Boost With {{ modalData?.track.boost ? modalData?.track.boost * 5 : 5 }} 
  <CircleMultiple fillColor="#FFFFFF" :size="30"/>
</button>


      <RouterLink v-else to="/Shop">
  
      <button @click="closeModal"  class="boost boost-moving-gradient boost-moving-gradient--blue my-5 boostThisFailed">Get More Credits 
        <CircleMultiple fillColor="#FFFFFF" :size="30"/>
      </button>
    </RouterLink>


    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, ref } from 'vue';
import { useModalStore } from '../stores/modalStore.js';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import CircleMultiple from 'vue-material-design-icons/CircleMultiple.vue';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot, runTransaction } from 'firebase/firestore';

const modalStore = useModalStore();
// Access the modal's data from the store
const modalData = modalStore.modals.boostModal.data;

const db = getFirestore();
const userCredits = modalData?.artist.credits || '0';

const boostComplete = async (requiredCredits) => {
  try {
    const userRef = doc(db, "user", modalData?.track.artist);
    const trackRef = doc(db, "track", modalData?.track.id);
    const boostExpiration = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const trackDoc = await transaction.get(trackRef);

      if (!userDoc.exists() || !trackDoc.exists()) {
        throw new Error("Document does not exist!");
      }

      const userData = userDoc.data();
      const trackData = trackDoc.data();

      if (userData.credits < requiredCredits) {
        throw new Error("Not enough credits!");
      }

      transaction.update(trackRef, {
        boost: (trackData.boost || 0) + 1,
        boostExpiration, // Save expiration time
      });

      transaction.update(userRef, {
        credits: userData.credits - requiredCredits,
      });
    });

    closeModal();
    modalStore.toggleModal('boostedModal', { track: modalData?.track, artist: modalData?.artist });

  } catch (error) {
    console.error('Error boosting track:', error);
    alert('Failed to boost track.');
  }
};




const boostTrack = () => {
  if(modalData?.track.boost === 1) {
    if(userCredits > 10) {
      alert("upgraded to level 2")
      boostComplete(10)
    }
  }
  else {
      if(userCredits > 5) {
      boostComplete(5)
      }
    }
}


const closeModal = () => {
  modalStore.toggleModal('boostModal');  // Close the Boost modal
};
</script>

<style scoped>
.modal-container {
  display: flex;
  flex-direction: column;
}
h1 {
  font-weight: 700;
}

.svg {
  display: inline;
}

.level {
  display: inline;
  font-weight: 600;
  font-size: 40px;
  color: aqua;
}

.boostThis{
  transition: all 0.5s;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.boostThis:hover, .boostThisFailed:hover {
  transform: scale(1.05);
  gap: 1rem;
}

.boostThisFailed {
  transition: all 0.5s;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background-image: none;
  background-color: rgba(212, 31, 31, 0.856) !important;
  box-shadow: none;
}
</style>
