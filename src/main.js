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

//Image crop
export async function cropImageToSquare(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const reader = new FileReader();

    // When the file is read successfully, process the image
    reader.onload = (event) => {
      image.src = event.target.result;

      // Once the image is loaded, crop it
      image.onload = () => {
        // Get the smaller dimension
        const size = Math.min(image.width, image.height);

        // Set the canvas to the size of the square
        canvas.width = size;
        canvas.height = size;

        // Calculate offsets to crop the image
        const offsetX = (image.width - size) / 2;
        const offsetY = (image.height - size) / 2;

        // Draw the image on the canvas (cropping to a square)
        ctx.drawImage(image, offsetX, offsetY, size, size, 0, 0, size, size);

        // Convert the canvas to a Blob (PNG format)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob); // Return the cropped image as a Blob
          } else {
            reject(new Error("Failed to generate cropped image."));
          }
        }, 'image/png'); // You can change the format if needed
      };
    };

    reader.onerror = (error) => reject(error); // Handle any file reading error
    reader.readAsDataURL(file); // Read the file as a Data URL
  });
}


app.use(pinia)
app.use(router)

app.mount('#app')