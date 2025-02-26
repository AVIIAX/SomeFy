<script setup>
import { ref, onMounted } from 'vue';
import { getRandomBoostedTrackId } from "../utils/boostedtracks"; 
import ShopCardCredits from '../components/ShopCardCredits.vue';
import ShopCardPremium from '../components/ShopCardPremium.vue';
import ShopCardDonate from '../components/ShopCardDonate.vue';


import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';


</script>

<template>
  <!-- Top Boost Section -->
  <div class="relative items-center h-full" :style="{ }">

  <div class="shop-list relative top-[60px]">
    <div>
      <ShopCardCredits itemId="1" />
    </div>
    <div>
      <ShopCardPremium itemId="2" />
    </div>
    <div>
      <ShopCardDonate itemId="3" />
    </div>
  </div>
  </div>
</template>

<style>
.shop-list {
  list-style: none;
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 2rem;
  justify-content: center;
  padding: 0;
  flex-direction: row;
}
</style>

  
