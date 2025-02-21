<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h1>{{ modalName }}</h1>
      <div v-if="userList.length > 0" class="overflow-auto mt-2 w-full bg-[#181822] rounded-lg shadow-lg h-fit z-50">
        <SearchResult :style="{
          gap: '4rem',
          textAlign: 'left',
        }"
          v-for="(user, index) in userList"
          :key="index"
          :data="{ id: user.id, name: user.name, avatar: user.avatar, type: 'user', artist: user.artist }"
        />
      </div>
      
      <div v-else class="text-center text-gray-400 mt-4">No users found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import SearchResult from '../SearchResult.vue';

const modalStore = useModalStore();
const modalData = modalStore.modals.followModal.data.users; // Array of user IDs
const modalName = modalStore.modals.followModal.data.name;

const db = getFirestore();
const userList = ref([]);

const fetchUsers = async () => {
  console.log(modalData);
  
  if (!modalData || !Array.isArray(modalData)) return;
  userList.value = []; // Clear existing list
  
  const users = await Promise.all(
    modalData.map(async (uid) => {
      const userDocRef = doc(db, 'user', uid);
      const userSnap = await getDoc(userDocRef);
      return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
    })
  );

  userList.value = users.filter(user => user !== null);
  console.log(userList);
  
};

watchEffect(fetchUsers);

const closeModal = () => {
  modalStore.toggleModal('followModal');
};
</script>

<style scoped>
.modal-container {
  display: flex;
  flex-direction: column;
}
</style>