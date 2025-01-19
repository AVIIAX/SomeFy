<script setup>
    import BoostCard from '../components/BoostCard.vue';
    import HomeCard from '../components/HomeCard.vue';
    import SongRow from '../components/SongRow.vue'
    import Test from '../components/Test.vue'
import Play from 'vue-material-design-icons/Play.vue';
import Pause from 'vue-material-design-icons/Pause.vue';
import DotsHorizontal from 'vue-material-design-icons/DotsHorizontal.vue';
import Heart from 'vue-material-design-icons/Heart.vue';
import ClockTimeThreeOutline from 'vue-material-design-icons/ClockTimeThreeOutline.vue';
import artist from '../artist.json'


import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia';
const useSong = useSongStore()
const { isPlaying, currentTrack } = storeToRefs(useSong)
</script>

<template>
  <div class="relative p-8">
    <!-- Boost Section -->
    <div class="py-1.5"></div>
    <div class="flex items-center">
      <BoostCard :track="artist.boost" />
    </div>
  </div>

  <!-- Top Hits Section -->
  <div class="relative p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Top Hits
    </button>

    <div class="py-1.5"></div>

    <!-- Responsive Grid Layout for Top Hits -->
    <div
      class="
        grid 
        grid-cols-2 
        sm:grid-cols-3 
        md:grid-cols-4 
        lg:grid-cols-5 
        gap-4
      "
    >
      <div v-for="(track, index) in artist.tracks" :key="track.id">
        <HomeCard :track="track" />
      </div>
    </div>
  </div>

  <!-- Music Section -->
  <div class="p-8">
    <button
      type="button"
      class="text-white text-2xl font-semibold hover:underline cursor-pointer"
    >
      Music
    </button>

    <div class="mt-6"></div>
    <div class="flex items-center justify-between px-5 pt-2">
      <div class="flex items-center justify-between text-gray-400">
        <div class="mr-7">#</div>
        <div class="text-sm">Title</div>
      </div>
      <div>
        <ClockTimeThreeOutline fillColor="#FFFFFF" :size="18" />
      </div>
    </div>

    <div class="border-b border-b-[#2A2A2A] mt-2"></div>
    <div class="mb-4"></div>

    <!-- No grid layout for Music Section -->
    <ul class="w-full" v-for="(track, index) in artist.tracks" :key="track">
      <SongRow :artist="artist" :track="track" :index="++index" />
    </ul>
  </div>
</template>


  
