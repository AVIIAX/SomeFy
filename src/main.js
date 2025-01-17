import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl7px8bchWy4UkRglseH9yb252YPI1WkY",
  authDomain: "soundwave-182cf.firebaseapp.com",
  projectId: "soundwave-182cf",
  storageBucket: "soundwave-182cf.firebasestorage.app",
  messagingSenderId: "956308046544",
  appId: "1:956308046544:web:545babcc35bd01ac4f94d5"
};

import { getFirestore, collection, getDocs } from "firebase/firestore";

initializeApp(firebaseConfig);

export const db = getFirestore();

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
