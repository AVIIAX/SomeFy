import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore('modal', () => {
  // Create an object to store visibility states and data for multiple modals
  const modals = ref({
    boostModal: {
      isVisible: false,
      data: null,  // Store data for the Boost modal
    },
    boostedModal: {
      isVisible: false,
      data: null,  // Store data for the Boost modal
    },
    uploadTrackModal: {
      isVisible: false,
      data: null,  // Store data for another modal
    },
    followModal: {
      isVisible: false,
      data: null,  // Store data for another modal
    },
    collabModal: {
      isVisible: false,
      data: null,  // Store data for another modal
    },
    // You can add more modals here
  });

  // Toggle visibility of a specific modal and set its data
  const toggleModal = (modalName, data = null) => {
    modals.value[modalName].isVisible = !modals.value[modalName].isVisible;
    if (data) {
      modals.value[modalName].data = data;  // Pass data to the modal
    }
  };

  return { modals, toggleModal };
});
