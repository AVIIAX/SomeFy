<script setup>
import { ref, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import ChevronRight from 'vue-material-design-icons/ChevronRight.vue';
import ChevronLeft from 'vue-material-design-icons/ChevronTripleRight.vue';

const route = useRoute();

const props = defineProps({
  iconSize: Number,
  pageUrl: String,
  name: String,
});

const { pageUrl, name, iconSize } = toRefs(props);

const textIsHover = ref(false); // Tracks hover state

</script>

<template>
  <li class="flex items-center justify-start pb-4 cursor-pointer">
    <!-- Dynamically render the icon based on active state -->
    <component
      :is="route.path === pageUrl ? ChevronLeft : ChevronRight"
      fillColor="#FFFFFF"
      :size="iconSize"
    />
    <div
      :class="route.path === pageUrl ? 'text-white' : 'text-gray-400'"
      class="font-semibold text-[14px] ml-4 mt-0.5"
    >
      <span>{{ name }}</span>
    </div>
  </li>
</template>
