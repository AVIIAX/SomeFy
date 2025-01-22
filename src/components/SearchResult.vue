<template>
  <RouterLink v-if="data.type === 'user'" :to="`/user/${data.id}`">
    <div id="" class="mainTab">
      <div class="searchImg"><img class="h" :src="data.avatar" alt=""></div>
    
      <div class="nameDiv">
    <div>{{ data.name }}</div>
    <span v-if="data.artist">Artist</span>
  </div>

  </div>
  </RouterLink>



  <RouterLink v-else-if="data.type === 'track'" :to="`/track/${data.id}`">
    <div id="" class="mainTab">
      <div class="searchImg"><img class="h" :src="data.image" alt=""></div>
    
      <div class="nameDiv">
    <div>{{ data.name }}</div>
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
import { RouterLink } from 'vue-router';

defineProps(['data']);
</script>

<style scoped>
div {
  color: white;
}

.searchImg {
  width: 50px; /* Set the desired size */
  height: 50px; /* Match the width to make it a circle */
  border-radius: 50%; /* Makes the div a full circle */
  overflow: hidden; /* Ensures the image doesn't overflow the circle */
  display: flex; /* Optional: For alignment purposes */
  align-items: center; /* Optional: Center image vertically */
  justify-content: center; /* Optional: Center image horizontally */
  border: 2px solid #ddd;
}

.searchImg img {
  width: 100%; /* Ensures the image covers the div */
  height: 100%; /* Ensures the image covers the div */
  object-fit: cover;  /* Ensures the image maintains its aspect ratio while covering the container */
}

.nameDiv {
  display: table-cell;
  align-items: center;
  justify-content: center;
  align-content: center
}

.nameDiv span {
  color: rgb(105, 105, 105)
}

.mainTab {
  padding: 1rem;
  cursor: pointer;
  border-radius: 0.375rem;
  display: -webkit-box;
  transition: background-color 0.2s ease-in-out;
  align-items: center;
  gap: 0.8rem;
}

.mainTab:hover {
  background-color: #1f2937;
}
</style>