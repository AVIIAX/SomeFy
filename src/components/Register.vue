<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1C1C1C] to-black">
    <div class="w-full max-w-sm bg-[#2C2C2C] rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-semibold text-white text-center mb-6">Create Account</h1>
      <div class="space-y-4">

        <!-- Other Inputs -->
        <input
          type="text"
          placeholder="Name"
          v-model="username"
          class="w-full p-3 text-sm rounded-md bg-[#1C1C1C] text-white border border-[#444] focus:outline-none focus:border-white"
        />
        <input
          type="text"
          placeholder="Email"
          v-model="email"
          class="w-full p-3 text-sm rounded-md bg-[#1C1C1C] text-white border border-[#444] focus:outline-none focus:border-white"
        />
        <input
          type="password"
          placeholder="Password"
          v-model="password"
          class="w-full p-3 text-sm rounded-md bg-[#1C1C1C] text-white border border-[#444] focus:outline-none focus:border-white"
        />
        <button
          @click="register"
          class="w-full p-3 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          Submit
        </button>
        <button
          @click="signInWithGoogle"
          class="w-full p-3 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
import { ref } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "vue-router";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();
const username = ref("");
const email = ref("");
const password = ref("");
const router = useRouter();

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

    console.log("User registered and data saved successfully!");
    router.push("/"); // Redirect after successful registration
  } catch (error) {
    console.error("Error registering user:", error);
    alert(error.message);
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
