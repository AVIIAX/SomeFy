import { defineStore } from 'pinia';
import { db } from '../firebase'; // Ensure db is imported from your main.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import WaveSurfer from 'wavesurfer.js';
import { getRandomBoostedTrackId } from "../utils/boostedtracks.js";

// Global EQ configuration (adjust bands as needed)
const eqBands = [32, 64, 128, 256, 512, 1000, 2000];
let eqFilters = [];
let eqContext = null;
let eqUpdateInterval = null;

// NEW: Global variables to hold the last node of the EQ chain and a convolver for reverb
let eqChainOutput = null;
let reverbNode = null;

// NEW: Helper to load an impulse response for the reverb effect
async function loadImpulseResponse(url, context) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Error loading impulse response:", error);
    return null;
  }
}

function attachEqFilters(ws) {
  if (!ws) return;
  if (!eqContext) {
    eqContext = new AudioContext();
  }
  if (eqContext.state === 'suspended') {
    eqContext.resume();
  }
  const audio = ws.getMediaElement();
  if (!audio) {
    console.error("No media element found in wavesurfer");
    return;
  }
  const mediaNode = eqContext.createMediaElementSource(audio);
  const savedSettings = JSON.parse(localStorage.getItem('eqSettings')) || {};
  
  // Create an array of filters using stored settings
  eqFilters = eqBands.map((band) => {
    const filter = eqContext.createBiquadFilter();
    filter.type = band <= 32 ? 'lowshelf' : band >= 16000 ? 'highshelf' : 'peaking';
    filter.frequency.value = band;
    filter.Q.value = 1;
    filter.gain.value = savedSettings[band] || 0;
    return filter;
  });
  
  // Chain filters: mediaNode -> filter1 -> filter2 -> ... -> destination
  const chain = eqFilters.reduce((prev, curr) => {
    prev.connect(curr);
    return curr;
  }, mediaNode);
  
  // Save chain's last node for further effects processing
  eqChainOutput = chain;
  
  // Initially connect chain to destination
  chain.connect(eqContext.destination);
  
  // Poll localStorage for any changes in EQ settings and update filters in realtime
  if (eqUpdateInterval) clearInterval(eqUpdateInterval);
  eqUpdateInterval = setInterval(() => {
    const currentSettings = JSON.parse(localStorage.getItem('eqSettings')) || {};
    eqFilters.forEach((filter) => {
      const band = filter.frequency.value;
      const newGain = currentSettings[band] || 0;
      if (filter.gain.value !== newGain) {
        filter.gain.value = newGain;
      }
    });
  }, 100); // adjust interval (in ms) as needed
}

export const useSongStore = defineStore('song', {
  state: () => ({
    isPlaying: false,
    isLiked: false,
    wavesurfer: null,
    currentTrack: null,
    currentTrackID: null,
    currentArtist: null,
    trackQueue: [], // Queue of track details
    currentIndex: -1, // Tracks the index of the current track in the queue
    // NEW: Effect state parameters
    isSlowed: false,
    isReverbed: false,
    slowedRate: 0.8, // Customize slowed playback rate (e.g., 0.8 means 80% speed)
    reverbImpulseUrl: '../reverb.wav', // Customize with your impulse response URL
  }),

  actions: {
    createWS(container, url) {
      // Destroy existing wavesurfer instance before creating a new one
      if (this.wavesurfer && typeof this.wavesurfer.destroy === "function") {
        this.wavesurfer.destroy();
      }

      try {
        this.wavesurfer = WaveSurfer.create({
          container: '#waveform',
          waveColor: '#ffffff8f',
          progressColor: '#3295e2e8',
          barWidth: 1,
          barGap: 3,
          barAlign: 'center',
          barHeight: 0.3,
          height: 10,
          responsive: true,
          hideScrollbar: true,
          barRadius: 4,
          normalize: true,
        });

        this.wavesurfer.load(url);

        this.wavesurfer.on('ready', async () => {
          console.log('WaveSurfer is ready');
          attachEqFilters(this.wavesurfer); // Route audio through EQ filters from localStorage
          
          // Apply reverb effect if toggled on
          if (this.isReverbed) {
            await this.addReverbEffect();
          }
          // Apply slowed effect if toggled on
          this.updatePlaybackRate();
        });

        this.wavesurfer.on('interaction', () => {
          console.log('WaveSurfer interaction triggered');
        });

        this.wavesurfer.on('finish', () => {
          console.log('WaveSurfer finished playing');
        });
      } catch (error) {
        console.log(error);
      }
    },

    async loadSong(track, trackIDs = null, container = ".waveform") {
      console.log(trackIDs);

      if (trackIDs && Array.isArray(trackIDs)) {
        try {
          const tracks = await Promise.all(
            trackIDs.map(async (trackId) => {
              const trackRef = doc(db, 'track', trackId);
              const trackDoc = await getDoc(trackRef);

              if (trackDoc.exists()) {
                return { id: trackId, ...trackDoc.data() };
              } else {
                console.log(`Track not found for ID: ${trackId}`);
                return null;
              }
            })
          );

          this.trackQueue = tracks.filter((track) => track);
          this.trackQueue.unshift(getRandomBoostedTrackId());
          console.log('Track queue set:', this.trackQueue);
        } catch (error) {
          console.error('Error fetching track data:', error);
        }
      } else {
        console.log('No valid trackIDs provided, using fallback queue.');
        this.trackQueue = [track];
      }

      this.currentIndex = this.trackQueue.findIndex((t) => t.id === track.id);

      this.currentTrack = track;
      this.currentTrackID = track.id;

      const userRef = doc(db, 'user', track.artist);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.error('User document does not exist');
        return;
      }
      this.currentArtist = userDoc.data();

      this.createWS(container, track.url);

      setTimeout(() => {
        this.isPlaying = true;
        
        this.wavesurfer.play();
      }, 200);
      
      await this.updateTrackViews(track.id);
    },

    async playOrPauseSong() {
      if (!this.wavesurfer) {
        console.error("WaveSurfer instance not initialized");
        return;
      }

      if (this.wavesurfer.isPlaying()) {
        this.isPlaying = false;
        this.wavesurfer.pause();
      } else {
        this.isPlaying = true;
        this.wavesurfer.play();
      }
    },

    async playOrPauseThisSong(track, trackIDs = null) { 
      if (!(this.wavesurfer.decodedData instanceof AudioBuffer)) {
        await this.loadSong(track, trackIDs);
        return;
      }
    
      this.playOrPauseSong();
    },
    
    async nextSong() {
      if (this.trackQueue.length === 0 || this.currentIndex >= this.trackQueue.length - 1) {
        console.log('No next track available');
        return;
      }

      this.currentIndex += 1;
      const nextTrack = this.trackQueue[this.currentIndex];
      await this.loadSong(nextTrack, this.trackQueue.map((t) => t.id));
    },

    async prevSong() {
      if (this.trackQueue.length === 0 || this.currentIndex <= 0) {
        console.log('No previous track available');
        return;
      }

      this.currentIndex -= 1;
      const prevTrack = this.trackQueue[this.currentIndex];
      await this.loadSong(prevTrack, this.trackQueue.map((t) => t.id));
    },

    async updateTrackViews(trackID) {
      try {
        const trackRef = doc(db, 'track', trackID);
        const trackDoc = await getDoc(trackRef);

        if (trackDoc.exists()) {
          const trackData = trackDoc.data();
          const updatedViews = (trackData.views || 0) + 1;

          await updateDoc(trackRef, { views: updatedViews });
          console.log(`Updated views for track ${trackID} to ${updatedViews}`);
        } else {
          console.log('No such track document to update views!');
        }
      } catch (error) {
        console.error('Error updating track views:', error);
      }
    },

    resetState() {
      this.isPlaying = false;
      this.wavesurfer = null;
      this.currentTrack = null;
      this.trackQueue = [];
      this.currentIndex = -1;
    },

    async likeOrUnlikeSong(id) {
      const currentUser = getAuth().currentUser; // Get the current authenticated user
      if (!currentUser) {
        console.error('User not authenticated');
        return;
      }

      const userRef = doc(db, 'user', currentUser.uid); // Reference to the current user's document
      const trackRef = doc(db, 'track', id); // Reference to the specific track document

      try {
        // Fetch the current user's data
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          console.error('User document does not exist');
          return;
        }

        const userData = userDoc.data();
        const likedTracks = userData.liked || []; // Get the liked tracks array, default to empty

        this.isLiked = likedTracks.includes(id); // Check if the track is already liked

        if (this.isLiked) {
          // Unlike the track
          this.isLiked = false;

          // Remove the track ID from the user's liked array
          const updatedLikedTracks = likedTracks.filter((trackId) => trackId !== id);
          await updateDoc(userRef, { liked: updatedLikedTracks });

          // Remove the user ID from the track's liked array
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            const trackData = trackDoc.data();
            const updatedTrackLikes = (trackData.liked || []).filter((uid) => uid !== currentUser.uid);
            await updateDoc(trackRef, { liked: updatedTrackLikes });
          }
        } else {
          // Like the track
          this.isLiked = true;

          // Add the track ID to the user's liked array
          const updatedLikedTracks = [...likedTracks, id];
          await updateDoc(userRef, { liked: updatedLikedTracks });

          // Add the user ID to the track's liked array (ensure no duplicates)
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            const trackData = trackDoc.data();
            const updatedTrackLikes = trackData.liked ? [...new Set([...trackData.liked, currentUser.uid])] : [currentUser.uid];
            await updateDoc(trackRef, { liked: updatedTrackLikes });
          }
        }
      } catch (error) {
        console.error('Error liking/unliking the song:', error);
      }
    },

    // ================================
    // New Effect Methods
    // ================================

    // Toggle the slowed effect. When enabled, set the playback rate to the customized slowed rate.
    toggleSlowEffect() {
      this.isSlowed = !this.isSlowed;
      this.updatePlaybackRate();
    },

    // Helper: update playback rate based on the isSlowed flag.
    updatePlaybackRate() {
      if (this.wavesurfer) {
        const rate = this.isSlowed ? this.slowedRate : 1;
        this.wavesurfer.setPlaybackRate(rate);
        console.log(`Playback rate set to ${rate}`);
      }
    },

    // Toggle the reverb effect.
    async toggleReverbEffect() {
      this.isReverbed = !this.isReverbed;
      if (this.isReverbed) {
        await this.addReverbEffect();
      } else {
        this.removeReverbEffect();
      }
    },

    async toggleSlowedReverbEffect() {
      this.isReverbed = !this.isReverbed;
      this.isSlowed = !this.isSlowed;
      if (this.isReverbed) {
        await this.addReverbEffect();
      } else {
        this.removeReverbEffect();
      }
      this.updatePlaybackRate();
    },
    // Add reverb effect by inserting a Convolver node between the EQ chain and the destination.
    async addReverbEffect() {
      if (!eqContext || !eqChainOutput) {
        console.error("Audio context or EQ chain not initialized");
        return;
      }
      try {
        // Disconnect the current connection from eqChainOutput to destination.
        try {
          eqChainOutput.disconnect(eqContext.destination);
        } catch (e) {
          // It might not be connected—ignore error.
        }
        // Create the convolver node if it doesn't exist.
        if (!reverbNode) {
          reverbNode = eqContext.createConvolver();
          const impulseBuffer = await loadImpulseResponse(this.reverbImpulseUrl, eqContext);
          if (impulseBuffer) {
            reverbNode.buffer = impulseBuffer;
          } else {
            console.error("Failed to load impulse response; reverb effect not applied");
            // Reconnect directly if impulse loading fails.
            eqChainOutput.connect(eqContext.destination);
            return;
          }
        }
        // Connect the chain through the reverb node to the destination.
        eqChainOutput.connect(reverbNode);
        reverbNode.connect(eqContext.destination);
        console.log("Reverb effect added");
      } catch (error) {
        console.error("Error adding reverb effect:", error);
      }
    },

    // Remove the reverb effect by bypassing the convolver node.
    removeReverbEffect() {
      if (!eqContext || !eqChainOutput) {
        console.error("Audio context or EQ chain not initialized");
        return;
      }
      try {
        if (reverbNode) {
          try {
            eqChainOutput.disconnect(reverbNode);
          } catch (e) {}
          try {
            reverbNode.disconnect(eqContext.destination);
          } catch (e) {}
        }
        // Reconnect the EQ chain directly to the destination.
        eqChainOutput.connect(eqContext.destination);
        console.log("Reverb effect removed");
      } catch (error) {
        console.error("Error removing reverb effect:", error);
      }
    },
  },

  persist: true,
});
