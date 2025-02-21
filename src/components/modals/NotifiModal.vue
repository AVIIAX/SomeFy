<template>
    <div v-if="modalData?.type == 'success'" class="modal-container" style="background-color: #252638c7; color: azure;">
      <Check fill="#FFFFFF" size="20" /> {{modalData?.message}}
    </div>
    <div v-else-if="modalData?.type !== 'failure'" class="modal-container" style="background-color: #382525c7; color: azure;">
      <Close fill="#FFFFFF" size="20" /> {{modalData?.message}}
    </div>
    <div v-else-if="modalData?.type == 'normal'" class="modal-container" style="background-color: #252638c7; color: azure;">
      <Info fill="#FFFFFF" size="20" /> {{modalData?.message}}
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import Check from 'vue-material-design-icons/Check.vue';
import Close from 'vue-material-design-icons/Close.vue';
import Info from 'vue-material-design-icons/InformationOutline.vue';

const modalStore = useModalStore();
// Access the modal's data from the store if needed
const modalData = modalStore.modals.NotifiModal.data;

const closeModal = () => {
  modalStore.toggleModal('NotifiModal');  // Closes the modal
};

onMounted(() => {
  // Automatically close the modal after 3 seconds (3000ms)
  setTimeout(() => {
    closeModal();
  }, 3000);
});
</script>

<style scoped>
.modal-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  z-index: 50;
  position: absolute;
  bottom: 110px;
  left: 10px;
  background-color: #382525c7;
  backdrop-filter: blur(10px);
  width: fit-content;
}
h1 {
  font-weight: 700;
}
</style>
