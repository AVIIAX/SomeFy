<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h3>{{ modalData?.title }} - {{ modalData?.artist }}</h3>
      <p>Some content inside the Boost modal...</p>
    </div>
  </div>
</template>

<script setup>
import { useModalStore } from '../stores/modalStore.js';

const modalStore = useModalStore();  // Access the modal store

// Access the modal's data from the store
const modalData = modalStore.modals.boostModal.data;

const closeModal = () => {
  modalStore.toggleModal('boostModal');  // Close the Boost modal
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: rgb(37, 61, 97);
  padding: 20px;
  border-radius: 5px;
}
</style>
