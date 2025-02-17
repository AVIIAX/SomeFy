<template>
  <RouterLink v-if="data.type === 'user'" :to="`/user/${data.id}`">
    <div id="" class="mainTab">
      <div class="searchImg" :style="{
        border: data.artist ? 'solid 2px #4287f5' : 'solid 2px #d4d4d4',
      }"><img class="h" :src="data.avatar" alt=""></div>
    
      <div class="nameDiv">
    <div>{{ data.name }}</div>
    <span v-if="data.artist">Artist</span>
  </div>

  </div>
  </RouterLink>



  <RouterLink v-else-if="data.type === 'track'" :to="`/track/${data.id}`">
  <div id="" class="mainTab">
    <div class="searchImgTrack">
      <img class="h" :src="data.image" alt="">
    </div>

    <div class="nameDiv">
      <div>{{ data.name }}</div>
      <RouterLink :to="`/user/${data.artist}`">
        <span class="toArtist">{{ artistName }}</span>
      </RouterLink>
    </div>

  </div>
</RouterLink>




  <RouterLink v-else-if="data.type === 'playlist'" :to="`/playlist/${data.id}`">
    <div id="" class="mainTab">
      📂 {{ data.name }}

    </div>
  </RouterLink>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();
const artistName = ref('');

// Directly accessing the props in the <script setup> block
const props = defineProps(['data']);

onMounted(async () => {
  const { data } = props;  // Extract `data` from the props object

  if (data.type == 'track') {
    const userRef = doc(db, 'user', data.artist);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      artistName.value = userData.name;
    }
  }
});
</script>



<style scoped>
div {
  color: white;
}

.nameDiv {
  align-items: center;
  justify-content: center;
  align-content: center;
  position: relative;
  width: calc(100% - 60px); /* Set the width to be 100% minus the width of the image */
  overflow: hidden; /* Hide overflow text */
}

.nameDiv span {
  color: rgb(105, 105, 105)
}

.mainTab {
  padding: 1rem;
  cursor: pointer;
  border-radius: 0.375rem;
  display: flex; /* Flexbox for layout */
  transition: background-color 0.2s ease-in-out;
  align-items: center;
  gap: 0.8rem;
  width: 100%; /* Ensure mainTab takes full width */
  overflow: hidden; /* Prevent overflow from spilling over the container */
}

.mainTab:hover {
  background-color: #1f2937;
}



@keyframes marquee {
  0% {
    transform: translateX(100%); /* Start off-screen */
  }
  100% {
    transform: translateX(-100%); /* End off-screen */
  }
}

</style>

<style>
.toArtist {
  display: inline-block;
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  width: auto; 
  /* animation: marquee 10s linear infinite; */
}

.toArtist:hover {
  text-decoration: underline;
}

.searchImg {
  width: 50px; /* Set the desired size */
  height: 50px; /* Match the width to make it a circle */
  border-radius: 50%; /* Makes the div a full circle */
  overflow: hidden; /* Ensures the image doesn't overflow the circle */
  display: flex; /* Optional: For alignment purposes */
  align-items: center; /* Optional: Center image vertically */
  justify-content: center; /* Optional: Center image horizontally */
}

.searchImgTrack {
  width: 50px; /* Set the desired size */
  height: 50px; /* Match the width to make it a circle */
  border-radius: 10%; /* Makes the div a full circle */
  overflow: hidden; /* Ensures the image doesn't overflow the circle */
  display: flex; /* Optional: For alignment purposes */
  align-items: center; /* Optional: Center image vertically */
  justify-content: center; /* Optional: Center image horizontally */
  border: 2px solid #e94e4e;
}

.searchImg img, .searchImgTrack img {
  width: 100%; /* Ensures the image covers the div */
  height: 100%; /* Ensures the image covers the div */
  object-fit: cover;  /* Ensures the image maintains its aspect ratio while covering the container */
}
</style>