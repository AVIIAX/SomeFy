<template>
    <div class="embed-player">
      <div class="player-header">
        <img :src="track.thumbnailUrl" alt="Track Thumbnail" class="thumbnail" />
        <div>
          <h2>{{ track.title }}</h2>
          <p>{{ track.artist }}</p>
        </div>
      </div>
  
      <audio :src="track.audioUrl" ref="audioPlayer" controls></audio>
  
      <div class="embed-code">
        <h3>Embed This Player</h3>
        <textarea
          v-model="embedCode"
          readonly
          rows="4"
          class="embed-textarea"
        ></textarea>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import { getFirestore, doc, getDoc } from "firebase/firestore";
  import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
  
  export default {
    name: "EmbedMusicPlayer",
    props: {
      trackId: String, // This will be the track ID that the player needs to play
    },
    setup(props) {
      const track = ref({});
      const embedCode = ref("");
  
      const db = getFirestore();
      const storage = getStorage();
  
      // Fetch track details from Firestore and set up player
      onMounted(async () => {
        const trackRef = doc(db, "tracks", props.trackId);
        const docSnap = await getDoc(trackRef);
        if (docSnap.exists()) {
          track.value = docSnap.data();
          
          // Get the download URL for the audio file
          const audioUrl = await getDownloadURL(storageRef(storage, track.value.audioUrl));
          track.value.audioUrl = audioUrl;
          
          // Generate the embed code
          embedCode.value = `<iframe src="https://http://localhost:5173/embed/${props.trackId}" width="300" height="380" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
        } else {
          console.error("No such document!");
        }
      });
  
      return {
        track,
        embedCode,
      };
    },
  };
  </script>
  
  <style scoped>
  .embed-player {
    width: 300px;
    text-align: center;
  }
  
  .player-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .thumbnail {
    width: 50px;
    height: 50px;
    margin-right: 10px;
  }
  
  .embed-code {
    margin-top: 10px;
  }
  
  .embed-textarea {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }
  </style>
  