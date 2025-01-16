<template>
    <div class="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1C1C1C] to-black">
      <div class="w-full max-w-sm bg-[#2C2C2C] rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-semibold text-white text-center mb-6">Log In</h1>
        <div class="space-y-4">
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
          <p v-if="errMsg" class="text-sm text-red-500 text-center">{{ errMsg }}</p>
          <button
            @click="login"
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
        </div>
        <p class="text-center mt-4 text-gray-400 text-sm">
          Don't have an account?
          <a
            @click.prevent="$emit('switchToRegister')"
            href="#"
            class="text-red-500 hover:underline"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
  import { useRouter } from "vue-router";
  
  const email = ref("");
  const password = ref("");
  const errMsg = ref(null);
  const router = useRouter();
  
  const login = () => {
    signInWithEmailAndPassword(getAuth(), email.value, password.value)
      .then(() => {
        alert("Successfully logged in!");
        router.push("/");
      })
      .catch((error) => {
        errMsg.value = error.message;
      });
  };
  
  const signInWithGoogle = () => {
    // Add Google Sign-In logic here
  };
  </script>
  
  <style scoped>
  body {
    color: aliceblue;
  }
  </style>
  