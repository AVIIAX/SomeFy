<template>
  <div class="gradient z-[-1]">
    <div class="gradient-1"></div>
    <div class="gradient-2"></div>
  </div>

  <div class="glitch flex items-center justify-center min-h-screen">
    <div class="w-full max-w-sm rounded-lg shadow-lg p-8">
      <h1 class="glitch text-3xl font-semibold text-white text-center mb-6">Create Account</h1>
      <div class="space-y-4">

        <!-- Other Inputs -->
        <input
          type="text"
          placeholder="Name"
          v-model="username"
          @keydown.enter="register"
          class="w-full p-3 text-sm rounded-md bg-[#0000002e] text-white border border-[#444] focus:outline-none focus:border-white"
        />
        <input
          type="text"
          placeholder="Email"
          v-model="email"
          @keydown.enter="register"
          class="w-full p-3 text-sm rounded-md bg-[#0000002e] text-white border border-[#444] focus:outline-none focus:border-white"
        />
        <input
          type="password"
          placeholder="Password"
          v-model="password"
          @keydown.enter="register"
          class="w-full p-3 text-sm rounded-md bg-[#0000002e] text-white border border-[#444] focus:outline-none focus:border-white"
        />

        <p v-if="errMsg" class="text-sm text-red-500 text-center">{{ errMsg }}</p>

        <button
          @click="register"
          class="w-full p-3 text-sm font-medium text-white minimal-btn text-center justify-center"
            style="margin-top: 2.5rem;"
        >
          Submit
        </button>
        <button
          @click="signInWithGoogle"
          class="w-full p-3 text-sm font-medium text-white minimal-btn text-center justify-center bg-[#e0e0e0ea]"
            style="color: black;"
        >
          Sign In with Google
        </button>
        <p class="text-center mt-4 text-gray-400 text-sm">
          Already have an account?
          <a
            class="text-red-500 hover:underline cursor-pointer"
            @click="$emit('switch-to-login')"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useModalStore } from '../stores/modalStore.js';
import { PowerGlitch } from 'powerglitch'

onMounted(() => {
  PowerGlitch.glitch('.glitch'), {
  "playMode": "always",
  "optimizeSeo": true,
  "createContainers": true,
  "hideOverflow": false,
  "timing": {
    "duration": 3950,
    "easing": "ease-in-out"
  },
  "glitchTimeSpan": {
    "start": 0.5,
    "end": 0.7
  },
  "shake": {
    "velocity": 2,
    "amplitudeX": 0.2,
    "amplitudeY": 0.2
  },
  "slice": {
    "count": 6,
    "velocity": 1,
    "minHeight": 0.02,
    "maxHeight": 0.15,
    "hueRotate": true
  },
  "pulse": false
}
})

const modalStore = useModalStore();
const db = getFirestore();
const username = ref("");
const email = ref("");
const password = ref("");
const router = useRouter();
const errMsg = ref(null);

const register = async () => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(getAuth(), email.value, password.value);
    const user = userCredential.user;

    // Use the Auth UID as the Firestore document ID
    const userRef = doc(db, "user", user.uid); // Create a reference using the user's UID as the document ID

    // Set user data in Firestore
    await setDoc(userRef, {
      artist: false,
      credits: "15",
      name: username.value,
      email: email.value,
    });

    router.push("/"); // Redirect after successful registration

    const dataForEditModal = { trackID: null, user: user.uid };
    modalStore.toggleModal('editProfileModal', dataForEditModal);
  } catch (error) {
    errMsg.value = error.code.split('/')[1];
    
  }
};

const signInWithGoogle = () => {
  // Add Google Sign-In logic here
};
</script>

<style scoped>
a {
  transition: color 0.3s ease;
}
</style>
