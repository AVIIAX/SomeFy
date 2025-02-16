import { defineStore } from 'pinia';
import { db } from '../firebase'; // Ensure db is imported from your main.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import WaveSurfer from 'wavesurfer.js';
import { getRandomBoostedTrackId } from "../utils/boostedtracks.js";

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
    slowedRate: 0.8, // e.g., 80% speed when slowed
    reverbImpulseUrl: '../reverb.wav', // Customize with your impulse response URL
    reverbNode: null, // Holds the convolver node for reverb
  }),

  actions: {
    createWS(container, url) {
      // Destroy existing WaveSurfer instance if it exists
      if (
        this.wavesurfer &&
        typeof this.wavesurfer.destroy === "function" &&
        typeof this.wavesurfer.stop === "function"
      ) {
        this.wavesurfer.stop();
        this.wavesurfer.destroy();
      }

      try {
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

          // Apply slowed effect (if toggled)
          this.updatePlaybackRate();

          // Apply the complete effects chain (EQ + Reverb)
          await this.updateEffectsChain();

          this.wavesurfer.on('play', () => {
            // (Optional) Additional logic on play
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

    async loadSong(track, trackIDs = null, container = "#waveform") {
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
          // Optionally prepend a boosted track
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

      const checkDecodedData = setInterval(() => {
        if (this.wavesurfer.getDecodedData()) {
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
      if (!(this.wavesurfer && this.wavesurfer.getDecodedData())) {
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

    // Toggle the slowed playback effect.
    toggleSlowEffect() {
      this.isSlowed = !this.isSlowed;
      this.updatePlaybackRate();
    },

    // Update playback rate (and detune) based on whether slowed is active.
    updatePlaybackRate() {
      if (this.wavesurfer) {
        const backend = this.wavesurfer.backend;
        if (backend?.ac) {
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
    },

    async toggleSlowedReverbEffect() {
      this.isSlowed = !this.isSlowed;
      this.isReverbed = !this.isReverbed;
      this.updatePlaybackRate();
      await this.updateEffectsChain();
    },


    // Rebuild the effects chain (EQ + reverb) based on current settings.
    async updateEffectsChain() {
      if (!this.wavesurfer || !this.wavesurfer.backend?.ac) return;
      const audioContext = this.wavesurfer.backend.ac;
      const filters = [];

      // --- Create EQ filters based on saved settings ---
      const eqBands = [32, 64, 128, 256, 512, 1000, 2000];
      const savedSettings = JSON.parse(localStorage.getItem('eqSettings')) || {};
      eqBands.forEach((band) => {
        const filter = audioContext.createBiquadFilter();
        // Use lowshelf/highshelf/peaking depending on frequency
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
        filters.push(filter);
      });

      // --- Add the reverb effect if enabled ---
      if (this.isReverbed) {
        if (!this.reverbNode) {
          this.reverbNode = audioContext.createConvolver();
          const impulseResponse = await loadImpulseResponse(this.reverbImpulseUrl, audioContext);
          if (!impulseResponse) {
            console.error("Failed to load impulse response for reverb");
          } else {
            this.reverbNode.buffer = impulseResponse;
          }
        }
        filters.push(this.reverbNode);
      } else {
        if (this.reverbNode) {
          this.reverbNode.disconnect();
          this.reverbNode = null;
        }
      }

      // --- Apply the filters ---
      if (this.wavesurfer.backend.setFilters) {
        this.wavesurfer.backend.setFilters(filters);
      } else {
        console.warn("setFilters method is not available on the WaveSurfer backend.");
      }
    },
  },

  persist: true,
});
