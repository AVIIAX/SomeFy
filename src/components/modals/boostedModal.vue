<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h1>{{ modalData?.track.name }}</h1>
      <span class="opacity-60">{{  modalData?.artist.name }}</span>

      <DotLottieVue class="svg my-2" style="height: 200px; width: 200px" autoplay loop src="https://assets-v2.lottiefiles.com/a/2b610cec-116a-11ee-917e-5b9b6a234276/Jmuthf9UwJ.lottie" />

      <span>Upgraded To Level</span>
      <button class="level">{{ modalData?.track.boost + 1 || '1'}}</button>

      <p>Thank You!!</p>

    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, ref } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import CircleMultiple from 'vue-material-design-icons/CircleMultiple.vue';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const modalStore = useModalStore();
// Access the modal's data from the store
const modalData = modalStore.modals.boostedModal.data;

const db = getFirestore();
const userCredits = modalData?.artist.credits || '0';

const closeModal = () => {
  modalStore.toggleModal('boostedModal');  // Close the Boost modal
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
