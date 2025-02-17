<template>
  <!-- System message -->
  <div v-if="data.type === 'system'">
    <div class="mainTab">
      <div class="nameDiv flex">
        <div>{{ data.message }}</div>
        <span>{{ formattedTime }}</span>
      </div>
    </div>
  </div>

  <!-- Follower notification -->
  <RouterLink
    v-else-if="data.type === 'follower'"
    :to="`/user/${data.follower}`"
  >
    <div class="mainTab">
      <div class="searchImg" style="border: solid 2px #d4d4d4">
        <img class="h" :src="follower?.avatar" alt="" />
      </div>
      <div class="nameDiv">
        <div>{{ follower ? follower.name : 'Loading...' }}</div>
        <h4>Started Following You!</h4>
        <span>{{ formattedTime }}</span>
      </div>
    </div>
  </RouterLink>

  <!-- Collab message -->
    <div v-else-if="data.type === 'collab'">
    <div class="mainTab">
      <div class="nameDiv flex">
        <div>{{ data.message.length > 20 ? data.message.slice(0, 20) + '...' : data.message }}</div>
        <RouterLink
    
    :to="`/user/${data.from}`"
  >
        <h4 class="hover:underline">~ {{ collabFrom ? collabFrom.name : 'Loading...' }}</h4>
        </RouterLink>
        <span>{{ formattedTime }}</span>
        <div class="flex collabBtns my-2">
          <button @click="acceptCollab(data, data.id)" class="accept bg-[#d1d1d1] text-[#171717]">ACCEPT</button>
          <button @click="rejectCollab(data)" class="reject bg-[#de6363]">REJECT</button>
        </div>
      </div>
    </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouterLink } from 'vue-router';
import { getAuth } from 'firebase/auth';
import { useModalStore } from '../stores/modalStore.js';

const currentUser = getAuth().currentUser;

const db = getFirestore();
const modalStore = useModalStore();
// The component receives the mail object via the `data` prop.
const props = defineProps(['data']);



const follower = ref(null);
const collabFrom = ref(null);

// Format the timestamp (assumed to be a Firebase Timestamp or a date string/number)
const formattedTime = computed(() => {
  let date;
  if (props.data.time && typeof props.data.time.toDate === 'function') {
    date = props.data.time.toDate();
  } else {
    date = new Date(props.data.time);
  }
  const now = new Date();
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return 'Today';
  } else {
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1D ago' : `${diffDays} Days ago`;
  }
});

onMounted(async () => {
  
  // When the mail is viewed, update Firestore to mark it as seen
  if (props.data.id && !props.data.seen) {
    const userDocRef = doc(db, 'user', currentUser.uid);
    try {
      await updateDoc(userDocRef, { 
  [`inboxMails.${props.data.id}.seen`]: true 
});
      // Optionally update the local data (if needed for UI)
      props.data.seen = true;
    } catch (error) {
      console.error('Error marking mail as seen:', error);
    }
  }

  // For follower notifications, fetch the follower's user data.
  if (props.data.type === 'follower') {
    const userRef = doc(db, 'user', props.data.follower);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      follower.value = userDoc.data();
    }
  }

  // For collab notifications, fetch the collab's user data.
  if (props.data.type === 'collab') {
    const userRef = doc(db, 'user', props.data.from);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      collabFrom.value = userDoc.data();
    }
  }
});

const acceptCollab = async (data, id) => {
  const dataForCollabModal = { type: 'accept', target: data.from, this: currentUser.uid,  mail: data, mailId: id };  // Example data
  modalStore.toggleModal('collabModal', dataForCollabModal);  // Pass data to Boost modal
};
</script>

<style scoped>
div {
  color: white;
}

.searchImg {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.searchImgTrack {
  width: 50px;
  height: 50px;
  border-radius: 10%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e94e4e;
}

.searchImg img,
.searchImgTrack img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nameDiv {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  width: calc(100% - 60px);
  overflow: hidden;
}

.nameDiv span {
  color: rgb(105, 105, 105);
}

.nameDiv h4 {
  color: rgb(194, 194, 194);
}

.mainTab {
  padding: 1rem;
  cursor: pointer;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  transition: background-color 0.2s ease-in-out;
  overflow: hidden;
}

.mainTab:hover {
  background-color: #1f2937;
}

.toArtist {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: auto;
}

.toArtist:hover {
  text-decoration: underline;
}

.collabBtns {
  display: flex;
  gap: 0.5rem;
}

.collabBtns button {
  padding: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.collabBtns button:hover {
  opacity: 90%;
}
</style>
