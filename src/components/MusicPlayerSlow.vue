<script setup>
import { ref, watch } from 'vue'
import Power from 'vue-material-design-icons/Power.vue'
import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia'

const useSong = useSongStore()
// (Retaining wavesurfer here only in case it’s needed elsewhere)
const { wavesurfer } = storeToRefs(useSong)

// --- SLOWED RATE SETUP ---
// slowedRate ranges from 0.4 to 2, with the normal value 1.
// We assume useSong.slowedRate exists and is reactive.
const slowedRate = ref(useSong.slowedRate || 1)

// Sync external changes from the store.
watch(
  () => useSong.slowedRate,
  (newVal) => {
    slowedRate.value = newVal
  }
)

// Update the store when slowedRate changes locally and update playback rate.
watch(slowedRate, (newVal) => {
  useSong.slowedRate = newVal
  useSong.updatePlaybackRate()
})

// --- KNOB LOGIC ---
// The knob rotates between 0° and 270°.
// We want 0.4 → 0°, 1 → 135°, and 2 → 270°.
// We use piecewise linear mappings.

// Map a slowed rate to a rotation angle.
function mapRateToAngle(rate) {
  if (rate <= 1) {
    // Map [0.4, 1] to [0, 135]
    return ((rate - 0.4) / (1 - 0.4)) * 135
  } else {
    // Map [1, 2] to [135, 270]
    return 135 + ((rate - 1) / (2 - 1)) * 135
  }
}

// Map a rotation angle back to a slowed rate.
function mapAngleToRate(angle) {
  if (angle <= 135) {
    // Map [0, 135] to [0.4, 1]
    return 0.4 + (angle / 135) * (1 - 0.4)  // 1 - 0.4 = 0.6
  } else {
    // Map [135, 270] to [1, 2]
    return 1 + ((angle - 135) / 135) * (2 - 1)  // 2 - 1 = 1
  }
}

// The "physical" knob rotation in degrees.
const knobRotation = ref(mapRateToAngle(slowedRate.value)) // initial rotation (should be 135° when slowedRate is 1)

// Sync knobRotation when slowedRate changes externally.
watch(slowedRate, (newRate) => {
  knobRotation.value = mapRateToAngle(newRate)
})

// --- DRAGGING LOGIC ---
const knobRef = ref(null)
const dragging = ref(false)
const wheeling = ref(false)
const lastAngle = ref(0)

// On mousedown/touchstart, record the pointer’s starting angle.
const startDrag = (e) => {
  e.preventDefault()
  dragging.value = true

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)

  lastAngle.value = getPointerAngle(e)
}

// On drag, update knobRotation based on the pointer’s angle difference.
const onDrag = (e) => {
  if (!dragging.value) return

  const angle = getPointerAngle(e)
  let angleDiff = angle - lastAngle.value

  // Correct for wrapping around 0°/360°.
  if (angleDiff > 180) angleDiff -= 360
  if (angleDiff < -180) angleDiff += 360

  // Compute a new rotation based on pointer movement, clamped between 0 and 270°.
  let newRotation = knobRotation.value + angleDiff
  newRotation = Math.max(0, Math.min(270, newRotation))

  // Compute the continuous new slowed rate from newRotation.
  const continuousRate = mapAngleToRate(newRotation)
  // Snap it to the nearest 0.05.
  let snappedRate = Math.round(continuousRate / 0.1) * 0.1
  // Clamp to the valid range.
  snappedRate = Math.max(0.4, Math.min(2, snappedRate))
  // Update the knob rotation to the discrete step corresponding to snappedRate.
  const snappedAngle = mapRateToAngle(snappedRate)

  knobRotation.value = snappedAngle
  slowedRate.value = snappedRate

  lastAngle.value = angle
}

const stopDrag = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// Helper: compute pointer angle (in degrees, [0,360)) relative to the knob center.
function getPointerAngle(e) {
  let clientX, clientY
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  const rect = knobRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI)
  if (angle < 0) angle += 360
  return angle
}


// --- WHEEL LOGIC ---
// Allow adjusting the knob using the mouse wheel.
const onWheel = (e) => {
  wheeling.value = true;
  e.preventDefault()
  const step = 0.05
  // Scroll up (deltaY < 0) increases value; scroll down decreases.
  let newRate = slowedRate.value - (e.deltaY > 0 ? step : -step)
  newRate = Math.round(newRate / step) * step
  newRate = Math.max(0.4, Math.min(2, newRate))
  slowedRate.value = newRate
  // The watcher on slowedRate will update knobRotation.
}



// --- TOGGLE LOGIC ---
// Clicking the center toggles the slowed state and updates playback rate.
const toggleSlowed = () => {
  useSong.isSlowed = !useSong.isSlowed
  useSong.updatePlaybackRate()
}
</script>

<template>
  <div class="tooltip flex items-center justify-center voll" id="vol-knob">
    <svg
      ref="knobRef"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @wheel="onWheel"
      width="100"
      height="100"
      viewBox="0 0 50 50"
      class="cursor-pointer select-none"
    >
      <defs>
        <!-- Radial gradient for a modern, 3D look -->
        <radialGradient id="knobGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#555" />
          <stop offset="100%" stop-color="#111" />
        </radialGradient>
        <radialGradient id="knobGradientIn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#555" />
          <stop offset="100%" stop-color="#222" />
        </radialGradient>
        <!-- Glow filter for the outer ring -->
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Stationary outer ring -->
      <circle
        cx="25"
        cy="25"
        r="21"
        fill="none"
        stroke="#7be5ac"
        stroke-width="2"
        filter="url(#glow)"
      />

      <!-- Rotating group: knob face and pointer.
           We rotate by the computed knobRotation value. -->
      <g :transform="'rotate(' + knobRotation + ' 25 25)'">
        <!-- Knob face -->
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="url(#knobGradient)"
          stroke="#333"
          stroke-width="1"
        />

        <circle
          cx="25"
          cy="25"
          r="17"
          fill="url(#knobGradientIn)"
          stroke="#333"
          stroke-width="1"
        />
        <!-- Pointer placed at (5,25) so that with no rotation it sits at left. -->
        <circle cx="12" cy="20" r="1.5" fill="#fff" />
      </g>

      <!-- Center toggle icon (non-rotating) -->
      <foreignObject x="15" y="15" width="20" height="20">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          @click.stop="toggleSlowed"
          style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;"
        >
          <!-- When slowed is active, show one color/size; otherwise another -->
          <Power v-if="useSong.isSlowed" fillColor="#7bc2e5" :size="19" />
          <Power v-else fillColor="#e57b7b" :size="17" />
        </div>
      </foreignObject>
    </svg>
    <span v-if="dragging || wheeling" class="tooltiptext">{{ Math.round(useSong.slowedRate * 10) / 10 }}</span>
  </div>
</template>

<style>
/* Additional styling if needed */
#vol-knob {
  transform: scale(0.5);
  transition: all 0.5s;
}

#vol-knob:hover {
  transform: scale(0.55);
}
</style>
