<script setup>
import { ref, watch } from 'vue'
import Power from 'vue-material-design-icons/Power.vue'
import { useSongStore } from '../stores/song'
import { storeToRefs } from 'pinia'

const useSong = useSongStore()
const { wavesurfer } = storeToRefs(useSong)

// Volume in [0..100] and mute state
const vol = ref(80)
const isMuted = ref(false)

// Set WaveSurfer volume when available
watch(wavesurfer, (newWS) => {
  if (newWS && typeof newWS.setVolume === 'function') {
    newWS.setVolume(isMuted.value ? 0 : vol.value / 100)
  }
}, { immediate: true })

watch(vol, (newVol) => {
  if (wavesurfer.value && typeof wavesurfer.value.setVolume === 'function') {
    wavesurfer.value.setVolume(isMuted.value ? 0 : newVol / 100)
  }
})

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (wavesurfer.value && typeof wavesurfer.value.setVolume === 'function') {
    wavesurfer.value.setVolume(isMuted.value ? 0 : vol.value / 100)
  }
}

// --- KNOB LOGIC ---
// Internally, we track a "physical" knob rotation from 0 to 270° (which maps to volume 0–100).
const knobRotation = ref((vol.value / 100) * 270)
// When volume changes externally, sync knobRotation:
watch(vol, (newVol) => {
  knobRotation.value = (newVol / 100) * 270
})

// The visual angle maps the physical range [0,270] to a 180° arc.
// At volume 0: knobRotation = 0 → visualAngle = 0° (pointer at left)
// At volume 100: knobRotation = 270 → visualAngle = 180° (pointer rotated to right)
const visualAngle = () => (knobRotation.value / 270) * 180

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

// On drag, add the pointer’s angle difference so that upward motion increases volume.
const onDrag = (e) => {
  if (!dragging.value) return

  const angle = getPointerAngle(e)
  let angleDiff = angle - lastAngle.value

  // Correct for wrapping around 0°/360°
  if (angleDiff > 180) angleDiff -= 360
  if (angleDiff < -180) angleDiff += 360

  // Use addition: an increase in pointer angle increases knobRotation.
  const newRotation = knobRotation.value + angleDiff
  knobRotation.value = Math.max(0, Math.min(270, newRotation))

  // Update volume based on the physical rotation.
  vol.value = (knobRotation.value / 270) * 100

  lastAngle.value = angle
}

const stopDrag = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

const timeoutId = ref(null);
// --- WHEEL LOGIC ---
// Allow adjusting volume using the mouse wheel.
const onWheel = (e) => {
  wheeling.value = true;
  e.preventDefault()
  const step = 1 // adjust volume in 1% steps
  if (e.deltaY < 0) {
    // scroll up: increase volume
    vol.value = Math.min(100, vol.value + step)
  } else {
    // scroll down: decrease volume
    vol.value = Math.max(0, vol.value - step)
  }

   // Set new timeout to reset wheeling after 100ms of inactivity
   timeoutId.value = setTimeout(() => {
    wheeling.value = false;
  }, 1500);
}


// Helper: compute pointer angle (in degrees, [0,360)) relative to knob center.
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
          <stop offset="0%" stop-color="#151515" />
          <stop offset="100%" stop-color="#111" />
        </radialGradient>
        <radialGradient id="knobGradientIn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#252525" />
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
        stroke="#7babe5bf"
        stroke-width="2"
        filter="url(#glow)"
      />

      <!-- Rotating group: knob face and pointer.
           We rotate by the computed visualAngle. -->
      <g :transform="'rotate(' + visualAngle() + ' 25 25)'">
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

      <!-- Mute/Unmute icon in the center (non-rotating) -->
      <foreignObject x="15" y="15" width="20" height="20">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          @click.stop="toggleMute"
          style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;"
        >
          <Power v-if="isMuted" fillColor="#e57b7b" :size="17" />
          <Power v-else fillColor="#7bc2e5" :size="19" />
        </div>
      </foreignObject>
    </svg>
    <span v-if="dragging || wheeling" class="tooltiptext">{{ Math.round(vol * 10) / 10 }}</span>
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
