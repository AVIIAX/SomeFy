import { defineStore } from 'pinia';
import { db } from '../firebase'; // Ensure db is imported from your main.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import WaveSurfer from 'wavesurfer.js';
import { getRandomBoostedTrackId } from "../utils/boostedtracks.js";
import * as Tone from 'tone';

// Global EQ configuration (adjust bands as needed)
const eqBands = [32, 64, 128, 256, 512, 1000, 2000];
let eqFilters = [];
let eqContext = null;
let eqUpdateInterval = null;

// Global variables to hold the last node of the EQ chain and a convolver for reverb
let eqChainOutput = null;
let reverbNode = null;

// Helper to load an impulse response for the reverb effect
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
    // Effect state parameters
    isSlowed: false,
    isPreservesPitch: false,
    isReverbed: false,
    slowedRate: 0.8, // Normal playback is 1; range is 0.4 (left) to 2 (right)
    custDetune: 1200,  // Detune in cents (e.g. 1200 = 12 semitones)
    reverbImpulseUrl: '../reverb.wav', // Customize with your impulse response URL
    localStorageListenerAdded: false,
    // New: Tone pitch shifter instance
    pitchShifter: null,
  }),

  actions: {
    // Initialize a storage event listener to update slowed parameters live
    initLocalStorageListener() {
      if (this.localStorageListenerAdded) return;
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
          // Assumes Pinia persist plugin uses key "pinia"
          if (event.key === 'pinia' && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              if (newState && newState.song) {
                const newSongState = newState.song;
                if (newSongState.slowedRate !== undefined) {
                  this.slowedRate = newSongState.slowedRate;
                }
                if (newSongState.isSlowed !== undefined) {
                  this.isSlowed = newSongState.isSlowed;
                }
                this.updatePlaybackRate();
              }
            } catch (e) {
              console.error("Error parsing persisted state", e);
            }
          }
        });
        this.localStorageListenerAdded = true;
      }
    },

    // Change pitch manually (in semitones)
    changePitch(semitones) {
      if (this.pitchShifter) {
        this.pitchShifter.pitch = semitones;
        // Also update custDetune (convert semitones back to cents)
        this.custDetune = semitones * 100;
      }
    },

    createWS(container, url) {
      // Initialize storage listener (only once)
      this.initLocalStorageListener();

      // Destroy existing wavesurfer instance before creating a new one
      if (this.wavesurfer && typeof this.wavesurfer.destroy === "function") {
        this.wavesurfer.destroy();
      }

      try {
        this.wavesurfer = WaveSurfer.create({
          container: '#waveform',
          waveColor: '#ffffff8f',
          progressColor: '#3295e2e8',
          backend: 'MediaElement',
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

          // Set up Tone.js pitch shifter:
          // Get the underlying media element from WaveSurfer
          const mediaElement = this.wavesurfer.backend.media;
          // Mute the media element so that only Tone's processed audio is heard.
          mediaElement.muted = true;
          // Create a media element source for Tone.js
          const mediaSource = Tone.context.createMediaElementSource(mediaElement);
          // Create a PitchShift effect and store it in the state.
          // Convert custDetune (in cents) to semitones.
          this.pitchShifter = new Tone.PitchShift({
            pitch: this.custDetune / 100
          }).toDestination();
          // Connect the media source to the pitch shifter.
          mediaSource.connect(this.pitchShifter);

          // Apply slowed effect if toggled on
          this.updatePlaybackRate();
        });

        this.wavesurfer.on('interaction', () => {
          console.log('WaveSurfer interaction triggered');
        });

        this.wavesurfer.on('finish', () => {
          console.log('WaveSurfer finished playing');
        });

        Tone.start().then(() => {
          console.log("Tone.js AudioContext started");
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
    // Toggle the slowed effect. When enabled, set the playback rate to the customized slowed rate.
    toggleSlowEffect() {
      this.setIsSlowed(!this.isSlowed);
    },

    // Update slowedRate in steps (0.1) and update playback rate in realtime.
    setSlowedRate(newRate) {
      const step = 0.1;
      newRate = Math.round(newRate * 10) / 10;
      if (newRate < 0.4) newRate = 0.4;
      if (newRate > 2) newRate = 2;
      if (Math.abs(newRate - this.slowedRate) >= step) {
        this.slowedRate = newRate;
        this.updatePlaybackRate();
      }
    },

    // Update the isSlowed flag and then update playback rate in realtime.
    setIsSlowed(newVal) {
      if (this.isSlowed !== newVal) {
        this.isSlowed = newVal;
        this.updatePlaybackRate();
      }
    },

    // Update playback rate based on isSlowed and slowedRate, and update Tone pitch shifter based on custDetune.
    async updatePlaybackRate() {
      if (this.wavesurfer) {
        const audio = this.wavesurfer.getMediaElement();
        if (audio) {
          // Set playback rate for slowed effect.
          const rate = this.isSlowed ? this.slowedRate : 1;
          if ('preservesPitch' in audio) {
            audio.preservesPitch = this.isPreservesPitch;
          }
          audio.playbackRate = rate;
          
          // Update pitch shifting using Tone's PitchShift.
          if (this.pitchShifter) {
            // Convert custDetune (in cents) to semitones.
            const semitones = this.custDetune / 100;
            this.pitchShifter.pitch = semitones;
          }
          
          console.log(`Playback rate set to ${rate}, Pitch shift set to ${this.custDetune} cents`);
        } else {
          console.error("No media element found in wavesurfer");
        }
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

    async addReverbEffect() {
      if (!eqContext || !eqChainOutput) {
        console.error("Audio context or EQ chain not initialized");
        return;
      }
      try {
        try {
          eqChainOutput.disconnect(eqContext.destination);
        } catch (e) {}
    
        if (!reverbNode) {
          reverbNode = eqContext.createConvolver();
          const impulseBuffer = await loadImpulseResponse(this.reverbImpulseUrl, eqContext);
          if (impulseBuffer) {
            reverbNode.buffer = impulseBuffer;
          } else {
            console.error("Failed to load impulse response; reverb effect not applied");
            eqChainOutput.connect(eqContext.destination);
            return;
          }
        }
    
        const wetGain = eqContext.createGain();
        wetGain.gain.value = 0.85;
    
        const dryGain = eqContext.createGain();
        dryGain.gain.value = 0.35;
    
        const stereoPanner = eqContext.createStereoPanner();
        stereoPanner.pan.value = 0;
    
        eqChainOutput.connect(dryGain);
        dryGain.connect(eqContext.destination);
    
        eqChainOutput.connect(reverbNode);
        reverbNode.connect(stereoPanner);
        stereoPanner.connect(wetGain);
        wetGain.connect(eqContext.destination);
    
        console.log("Reverb effect added with 25% mix and stereo");
      } catch (error) {
        console.error("Error adding reverb effect:", error);
      }
    },

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
        eqChainOutput.connect(eqContext.destination);
        console.log("Reverb effect removed");
      } catch (error) {
        console.error("Error removing reverb effect:", error);
      }
    },
  },

  persist: true,
});
