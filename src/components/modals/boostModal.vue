<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <h1>{{ modalData?.track.name }}</h1>
      <span class="opacity-60">{{ modalData?.artist.name }}</span>

      <DotLottieVue
        v-if="Number(userCredits) >= 5"
        class="svg my-2"
        style="height: 200px; width: 200px"
        autoplay
        loop
        src="https://lottie.host/ac7fe980-2e4a-49d9-bfff-6ceee45e881a/Q6BmlsQ2u.lottie"
      />
      <DotLottieVue
        v-else
        class="svg my-2"
        style="height: 200px; width: 200px"
        autoplay
        loop
        src="https://lottie.host/7981ca63-1a71-428b-8ccd-7333ffc3d054/Art1r2HjSF.lottie"
      />
      <span>Plays</span>
      <button class="level">{{ modalData?.track.views || '0' }}</button>
      
      <span>Likes</span>
      <button class="level">{{ modalData?.track.liked?.length || '0' }}</button>

      <span>Current Level</span>
      <button class="level">{{ modalData?.track.boost || '0' }}</button>

      <p>
        Upgrade This Track To Level {{ modalData?.track.boost + 1 || '1' }} To Get More Audience
      </p>
      <button
        @click="boostTrack(modalData?.track.id)"
        v-if="Number(userCredits) >= (modalData?.track.boost ? modalData?.track.boost * 5 : 5)"
        class="boostThis boost boost-moving-gradient boost-moving-gradient--blue my-5"
      >
        Boost With {{ modalData?.track.boost ? modalData?.track.boost * 5 : 5 }}
        <CircleMultiple fillColor="#FFFFFF" :size="30" />
      </button>

      <RouterLink v-else to="/Shop">
        <button @click="closeModal" class="boost boost-moving-gradient boost-moving-gradient--blue my-5 boostThisFailed">
          Get More Credits
          <CircleMultiple fillColor="#FFFFFF" :size="30" />
        </button>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
import CircleMultiple from 'vue-material-design-icons/CircleMultiple.vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/firebase'; // ensure this path is correct

// Access modal data and user credits from the store
const modalStore = useModalStore();
const modalData = modalStore.modals.boostModal.data;
const trackID = modalData?.track.id;
const userCredits = modalData?.artist.credits || '0';

// Initialize Firebase Auth and create a reactive user variable
const auth = getAuth();
const currentUser = ref(null);

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
    if (user) {
      console.log('✅ User logged in:', user.uid);
    } else {
      console.log('🚨 No user logged in');
    }
  });
});

const boostTrack = async (trackId) => {
  // Initialize Auth using the same app instance.
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    console.error("🚨 User not authenticated in frontend!");
    alert("You must be signed in to boost a track.");
    return;
  }

  console.log("✅ Authenticated User:", user.uid);

  try {
    // Force token refresh (to ensure it's valid and not expired)
    const token = await user.getIdToken(true);
    console.log("🔑 Refreshed User Token:", token);

    // Initialize Functions (with region)
    const functions = getFunctions(app, "us-central1");
    const boostTrackFunction = httpsCallable(functions, "boostTrack");

    // Call function and pass trackId
    console.log('track', trackId);
    
    const response = await boostTrackFunction({ trackId });

    console.log("🚀 Boost Track Response:", response.data);

    closeModal()
  } catch (error) {
    console.error("❌ Error boosting track:", error);
  }
};


const closeModal = () => {
  modalStore.toggleModal('boostModal'); // Close the Boost modal
};
</script>

<style scoped>
.modal-container {
  display: flex;
  flex-direction: column;
}
h1 {
  font-weight: 700;
}
.svg {
  display: inline;
}
.level {
  display: inline;
  font-weight: 600;
  font-size: 40px;
  color: aqua;
}
.boostThis {
  transition: all 0.5s;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.boostThis:hover,
.boostThisFailed:hover {
  transform: scale(1.05);
  gap: 1rem;
}
.boostThisFailed {
  transition: all 0.5s;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background-image: none;
  background-color: rgba(212, 31, 31, 0.856) !important;
  box-shadow: none;
}
</style>
