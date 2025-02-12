import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Import Firebase services from the dedicated file
import { db, auth } from './firebase'

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