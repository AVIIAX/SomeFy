<template>
    <div>
      <h1>Upload an Image to Imgur</h1>
      <input type="file" @change="onFileChange" accept="image/*" />
      <p v-if="fileUrl">
        Uploaded successfully! <a :href="fileUrl" target="_blank">View Image</a>
      </p>
      <img v-if="fileUrl" :src="fileUrl" alt="Uploaded Image" style="max-width: 100%; margin-top: 1em;" />
      <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import axios from "axios";
  
  // Reactive variables
  const fileUrl = ref(null);
  const errorMessage = ref("");
  const uploading = ref(false);
  
  // Function to handle image file change
  async function onFileChange(event) {
    const file = event.target.files[0];
  
    if (!file) {
      errorMessage.value = "Please select a file to upload.";
      return;
    }
  
    uploading.value = true;
    errorMessage.value = "";
  
    try {
      // Prepare the form data for the Imgur API
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "file");
      formData.append("name", file.name); // Optional: you can specify a name
  
      // Imgur API URL and Client ID
      const uploadUrl = "https://api.imgur.com/3/upload";
      const clientId = "546c25a59c58ad7"; // Replace with your Imgur API Client ID
  
      // Send POST request to Imgur API
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Client-ID ${clientId}`, // Add your Client ID here
        },
      });
  
      // Check if the response was successful
      if (response.data.success) {
        fileUrl.value = response.data.data.link; // Get the image link from the response
        errorMessage.value = ""; // Clear any previous errors
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      errorMessage.value = "Failed to upload file. Please try again.";
    } finally {
      uploading.value = false;
    }
  }
  </script>
  
  <style scoped>
  h1 {
    font-size: 1.5em;
    margin-bottom: 1em;
  }
  p {
    margin-top: 0.5em;
  }
  img {
    display: block;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  </style>
  