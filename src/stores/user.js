// stores/userStore.js

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const isPro = ref(false);
  const isArtist = ref(false);

  // This action can be used to update the `isPro` status
  const setIsPro = (value) => {
    isPro.value = value;
  };

  const setIsArtist = (value) => {
    isArtist.value = value;
  };

  return {
    isPro,
    setIsPro,
    isArtist,
    setIsArtist,  
  };
});
