<template>
    <div>
      <h1>Upload an Image to Discord</h1>
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
  
  // Replace this with your actual Discord webhook URL
  const webhookUrl = "https://discord.com/api/webhooks/1329746552008212523/_3YiBZAKs8yCECE12IVBUBVP7UiGemGageDp0QbXD6b1X0w6pJ--Nmd9G2WpfUSFHKHK"; 
  
  // Reactive variables to store the file URL and error messages
  const fileUrl = ref(null);
  const errorMessage = ref("");
  
  /**
   * Handles the file upload process when a file is selected.
   * @param {Event} event - The file input change event.
   */
  async function onFileChange(event) {
    const file = event.target.files[0];
  
    if (!file) {
      errorMessage.value = "Please select a file to upload.";
      return;
    }
  
    try {
      // Prepare the form data for the Discord webhook
      const formData = new FormData();
      formData.append("file", file); // Attach the file
      formData.append(
        "payload_json",
        JSON.stringify({ content: "User uploaded an image" }) // Optional message
      );
  
      // Send the file to the Discord webhook
      const response = await axios.post(webhookUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      // Extract and store the file's CDN URL
      if (response.data.attachments && response.data.attachments.length > 0) {
        fileUrl.value = response.data.attachments[0].url;
        errorMessage.value = ""; // Clear any error message
      } else {
        throw new Error("No attachment URL found in the response.");
      }
    } catch (error) {
      console.error("Error uploading file to Discord webhook:", error);
      errorMessage.value = "Failed to upload file. Please try again.";
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
  