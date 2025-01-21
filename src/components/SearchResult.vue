<template>
    <div class="p-4 hover:bg-gray-800 cursor-pointer rounded-md">
      <div v-if="data.type === 'user'">
        👤 {{ data.name }}
      </div>
      <div v-else-if="data.type === 'track'">
        🎵 {{ data.name }}
      </div>
      <div v-else-if="data.type === 'playlists'">
        📂 {{ data.name }}
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps(['data']);
  </script>
  
  <style scoped>
  div {
    color: white;
  }
  </style>
  