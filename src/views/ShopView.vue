<script setup>
import { ref, onMounted } from 'vue';
import { getRandomBoostedTrackId } from "../utils/boostedtracks"; 
import ShopCard from '../components/ShopCard.vue';


import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';


</script>

<template>
  <!-- Top Boost Section -->
  <div class="relative items-center" :style="{
  }">

  <div class="shop-list">
    <div>
      <ShopCard itemId="1" />
    </div>
    <div>
      <ShopCard itemId="2" />
    </div>
    <div>
      <ShopCard itemId="3" />
    </div>
    <div>
      <ShopCard itemId="3" />
    </div>
  </div>
  </div>
</template>

<style>
.shop-list {
  list-style: none;
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 1rem;
  justify-content: center;
  padding: 0;
  flex-direction: row;
}
</style>

  
