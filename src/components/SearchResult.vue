<template>
    <div id="" class="p-4 hover:bg-gray-800 cursor-pointer rounded-md">
      <div v-if="data.type === 'user'">
        <RouterLink :to="`/user/${data.id}`"><div class="searchImg"><img class="h" :src="data.avatar" alt=""></div> {{ data.name }}</RouterLink>
      </div>
      <div v-else-if="data.type === 'track'">
        🎵 {{ data.name }} <div class="searchImg"><img class="h" :src="data.image" alt=""></div>
      </div>
      <div v-else-if="data.type === 'playlists'">
        📂 {{ data.name }} 
      </div>
    </div>
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
    max-width: 50px;
    height: revert-layer;
    object-fit: cover;
    border-radius: 100%;
  }
  .h {
    height: revert-layer;
    object-fit: cover;
  }

  </style>
  