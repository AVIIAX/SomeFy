import { defineStore } from 'pinia';
import { db } from '../firebase'; // Ensure db is imported from your main.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import WaveSurfer from 'wavesurfer.js';
import { getRandomBoostedTrackId } from '../utils/boostedtracks.js';
import { WEQ8Runtime } from "weq8";

// Helper to load an impulse response for the reverb effect
async function loadImpulseResponse(url, context) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error loading impulse response:', error);
    return null;
  }
}

export const useSongStore = defineStore('song', {
  state: () => ({
    isPlaying: false,
    isLiked: false,
    // Do NOT persist these non-serializable objects:
    wavesurfer: null,
    currentTrack: null,
    currentTrackID: null,
    currentArtist: null,
    trackQueue: [],
    currentIndex: -1,
    // Effect state parameters:
    isSlowed: false,
    isReverbed: false,
    slowedRate: 0.8, // 80% speed when slowed
    reverbImpulseUrl: '../reverb.wav', // update as needed
    // Do NOT persist the reverb node
    reverbNode: null,
  }),

  actions: {
    createWS(container, url) {
      // Destroy any existing WaveSurfer instance.
      if (this.wavesurfer) {
        if (typeof this.wavesurfer.stop === 'function') {
          this.wavesurfer.stop();
        }
        if (typeof this.wavesurfer.destroy === 'function') {
          this.wavesurfer.destroy();
        }
      }
      try {
        // Create a new WaveSurfer instance.
        this.wavesurfer = WaveSurfer.create({
          container: container || '#waveform',
          waveColor: '#ffffff8f',
          progressColor: '#3295e2e8',
          backend: 'WebAudio',
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
          // Apply slowed playback rate if toggled.
          this.updatePlaybackRate();
          // Apply EQ and reverb via manual node chaining.
          await this.updateEffectsChain();

          //WEQ8Runtime
          console.log(this.wavesurfer);
          
          const audioContext = this.wavesurfer.backend.ac; // Get Wavesurfer's AudioContext
          const sourceNode = this.wavesurfer.backend.getAudioNode(); // Get source audio node
        
          // Initialize weq8 with the same AudioContext
          const weq8 = new WEQ8Runtime(audioContext);
        
          // Connect Wavesurfer's output to weq8 EQ
          sourceNode.connect(weq8.input);
        
          // Connect EQ output to the audio context destination
          weq8.connect(audioContext.destination);
        
          // Attach weq8 UI to control the EQ
          document.querySelector("weq8-ui").runtime = weq8;







          // Optional additional event listeners.
          this.wavesurfer.on('play', () => {
            // Reapply effects on play if necessary.
          });
          this.wavesurfer.on('interaction', () => {
            console.log('WaveSurfer interaction triggered');
          });
          this.wavesurfer.on('finish', () => {
            console.log('WaveSurfer finished playing');
          });
        });
      } catch (error) {
        console.error(error);
      }
    },

    async loadSong(track, trackIDs = null, container = '#waveform') {
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
          // Optionally prepend a boosted track.
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

      // (Re)create WaveSurfer for the new track.
      this.createWS(container, track.url);

      const checkDecodedData = setInterval(() => {
        if (this.wavesurfer && this.wavesurfer.getDecodedData()) {
          clearInterval(checkDecodedData);
          setTimeout(() => {
            this.isPlaying = true;
            this.wavesurfer.play();
            console.log(this.wavesurfer.getDecodedData());
          }, 500);
        }
      }, 100);

      await this.updateTrackViews(track.id);
    },

    async playOrPauseSong() {
      if (!this.wavesurfer || typeof this.wavesurfer.isPlaying !== 'function') {
        console.error('WaveSurfer instance not initialized');
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
      if (!this.wavesurfer) {
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
      if (this.wavesurfer) {
        this.wavesurfer.destroy();
      }
      this.wavesurfer = null;
      this.currentTrack = null;
      this.trackQueue = [];
      this.currentIndex = -1;
    },

    async likeOrUnlikeSong(id) {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.error('User not authenticated');
        return;
      }
      const userRef = doc(db, 'user', currentUser.uid);
      const trackRef = doc(db, 'track', id);

      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          console.error('User document does not exist');
          return;
        }
        const userData = userDoc.data();
        const likedTracks = userData.liked || [];
        this.isLiked = likedTracks.includes(id);

        if (this.isLiked) {
          this.isLiked = false;
          const updatedLikedTracks = likedTracks.filter((trackId) => trackId !== id);
          await updateDoc(userRef, { liked: updatedLikedTracks });
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            const trackData = trackDoc.data();
            const updatedTrackLikes = (trackData.liked || []).filter((uid) => uid !== currentUser.uid);
            await updateDoc(trackRef, { liked: updatedTrackLikes });
          }
        } else {
          this.isLiked = true;
          const updatedLikedTracks = [...likedTracks, id];
          await updateDoc(userRef, { liked: updatedLikedTracks });
          const trackDoc = await getDoc(trackRef);
          if (trackDoc.exists()) {
            const trackData = trackDoc.data();
            const updatedTrackLikes = trackData.liked
              ? [...new Set([...trackData.liked, currentUser.uid])]
              : [currentUser.uid];
            await updateDoc(trackRef, { liked: updatedTrackLikes });
          }
        }
      } catch (error) {
        console.error('Error liking/unliking the song:', error);
      }
    },

    // ================================
    // Effect Methods
    // ================================

    // Toggle the slowed playback effect.
    toggleSlowEffect() {
      this.isSlowed = !this.isSlowed;
      this.updatePlaybackRate();
    },

    // Update playback rate (and detune) based on whether slowed is active.
    updatePlaybackRate() {
      if (this.wavesurfer) {
        const backend = this.wavesurfer.backend;
        if (backend && backend.ac) {
          const rate = this.isSlowed ? this.slowedRate : 1;
          const detuneCents = this.isSlowed ? 1200 * Math.log2(1 / rate) : 0;
          backend.setPlaybackRate(rate);
          if (backend.source) {
            backend.source.detune.value = detuneCents;
          }
        } else {
          const rate = this.isSlowed ? this.slowedRate : 1;
          this.wavesurfer.setPlaybackRate(rate);
        }
      }
    },

    // Toggle the reverb effect.
    async toggleReverbEffect() {
      this.isReverbed = !this.isReverbed;
      await this.updateEffectsChain();
      console.log('Reverb effect toggled:', this.isReverbed);
    },

    async toggleSlowedReverbEffect() {
      // (Optional: combine toggles as needed)
      this.isSlowed = !this.isSlowed;
      this.isReverbed = !this.isReverbed;
      this.updatePlaybackRate();
      await this.updateEffectsChain();
    },

    // Manually rebuild the effects chain (EQ and reverb) and rewire the audio graph.
    async updateEffectsChain() {
      if (
        !this.wavesurfer ||
        !this.wavesurfer.backend ||
        !this.wavesurfer.backend.ac
      )
        return;
      const audioContext = this.wavesurfer.backend.ac;

      // Attempt to get the WaveSurfer output gain node.
      const wsGainNode = this.wavesurfer.backend.gainNode;
      if (!wsGainNode) {
        console.warn('No gain node available from WaveSurfer backend.');
        return;
      }

      // Disconnect the gain node from the destination.
      wsGainNode.disconnect();

      // --- Create EQ filters based on saved settings ---
      const eqBands = [32, 64, 128, 256, 512, 1000, 2000];
      const savedSettings = JSON.parse(localStorage.getItem('eqSettings')) || {};
      const eqFilters = eqBands.map((band) => {
        const filter = audioContext.createBiquadFilter();
        // Choose filter type based on frequency.
        if (band <= 32) {
          filter.type = 'lowshelf';
        } else if (band >= 16000) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
        }
        filter.frequency.value = band;
        filter.Q.value = 1;
        filter.gain.value = savedSettings[band] ?? 0;
        return filter;
      });

      // --- Create (or reuse) the reverb node if enabled ---
      if (this.isReverbed) {
        if (!this.reverbNode) {
          this.reverbNode = audioContext.createConvolver();
          const impulseResponse = await loadImpulseResponse(
            this.reverbImpulseUrl,
            audioContext
          );
          if (!impulseResponse) {
            console.error('Failed to load impulse response for reverb');
          } else {
            this.reverbNode.buffer = impulseResponse;
          }
        }
      } else {
        if (this.reverbNode) {
          this.reverbNode.disconnect();
          this.reverbNode = null;
        }
      }

      // Build the chain: start with the output gain node,
      // then connect each EQ filter in sequence,
      // then (if enabled) connect the reverb node,
      // and finally connect the last node to the destination.
      let currentNode = wsGainNode;
      eqFilters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });
      if (this.isReverbed && this.reverbNode) {
        currentNode.connect(this.reverbNode);
        currentNode = this.reverbNode;
      }
      currentNode.connect(audioContext.destination);
    },
  },

  // Persist only serializable state – exclude wavesurfer and reverbNode.
  persist: {
    paths: [
      'isPlaying',
      'isLiked',
      'currentTrack',
      'currentTrackID',
      'currentArtist',
      'trackQueue',
      'currentIndex',
      'isSlowed',
      'isReverbed',
      'slowedRate',
      'reverbImpulseUrl',
    ],
  },
});
