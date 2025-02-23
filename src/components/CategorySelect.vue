<template>
  <div
    v-if="randColor.color"
    :class="rClass"
    :style="{ 
      backgroundColor: randColor.color, 
      width: width, 
      height: height 
    }"
    class="contrast-[2] brightness-[0.87] rounded-xl relative overflow-hidden"
  >
    <div class="text-white pt-3 pl-4 font-semibold text-[23px]">{{ text }}</div>
  </div>
</template>

<script setup>
import { ref, toRefs } from 'vue'
import uniqolor from 'uniqolor'

// Props received for dynamic class and text
const props = defineProps({ text: String, rClass: String })
const { text, rClass } = toRefs(props)

// Generate a random color
let randColor = ref('')
randColor.value = uniqolor.random()

// Randomize width and height for each category
const width = `${Math.floor(Math.random() * 200) + 250}px` // Random width between 250px and 450px
const height = `${Math.floor(Math.random() * 200) + 250}px` // Random height between 250px and 450px
</script>

<style scoped>
/* Additional styles for layout, if needed */
</style>
