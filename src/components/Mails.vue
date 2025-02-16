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
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouterLink } from 'vue-router';
import { getAuth } from 'firebase/auth';

const currentUser = getAuth().currentUser;

const db = getFirestore();

// The component receives the mail object via the `data` prop.
const props = defineProps(['data']);



const follower = ref(null);

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
    return 'today';
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
});
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
</style>
