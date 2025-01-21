import { defineStore } from 'pinia';
import { db } from '../main'; // Ensure db is imported from your main.js
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

export const useSongStore = defineStore('song', {
  state: () => ({
    isPlaying: false,
    isLiked: false,
    audio: null,
    currentTrack: null,
    currentTrackID: null,
    trackQueue: [], // Queue of track details
    currentIndex: -1, // Tracks the index of the current track in the queue
  }),

  actions: {
    async loadSong(track, trackIDs = null) {
      // Set the track queue based on trackIDs or use a fallback
      console.log(trackIDs);
      
      if (trackIDs && Array.isArray(trackIDs)) {
        try {
          // Fetch track details for all trackIDs
          const tracks = await Promise.all(
            trackIDs.map(async (trackId) => {
              const trackRef = doc(db, 'track', trackId);
              const trackDoc = await getDoc(trackRef);

              if (trackDoc.exists()) {
                const trackData = trackDoc.data();
                return { id: trackId, ...trackData };
              } else {
                console.log(`Track not found for ID: ${trackId}`);
                return null;
              }
            })
          );

          // Filter valid tracks and assign to queue
          this.trackQueue = tracks.filter((track) => track);
          console.log('Track queue set:', this.trackQueue);
        } catch (error) {
          console.error('Error fetching track data:', error);
        }
      } else {
        console.log('No valid trackIDs provided, using fallback queue.');
        this.trackQueue = [track]; // Fallback to play only the current track
      }

      // Set the current track index
      this.currentIndex = this.trackQueue.findIndex((t) => t.id === track.id);

      // Play the current track
      this.currentTrack = track;
      this.currentTrackID = track.id;

      // Audio setup
      if (this.audio && this.audio.src) {
        this.audio.pause();
        this.isPlaying = false;
        this.audio.src = '';
      }

      this.audio = new Audio(track.url);

      // Play the track
      setTimeout(() => {
        this.isPlaying = true;
        this.audio.play();
      }, 200);

      // Update views in the database
      await this.updateTrackViews(track.id);
    },

    async updateTrackViews(trackID) {
      try {
        const trackRef = doc(db, 'track', trackID);
        const trackDoc = await getDoc(trackRef);

        if (trackDoc.exists()) {
          const trackData = trackDoc.data();
          const updatedViews = (trackData.views || 0) + 1;

          await updateDoc(trackRef, {
            views: updatedViews,
          });

          console.log(`Updated views for track ${trackID} to ${updatedViews}`);
        } else {
          console.log('No such track document to update views!');
        }
      } catch (error) {
        console.error('Error updating track views:', error);
      }
    },

    async playOrPauseSong() {
      if (this.audio.paused) {
        this.isPlaying = true;
        this.audio.play();
      } else {
        this.isPlaying = false;
        this.audio.pause();
      }
    },

    async playOrPauseThisSong(track, trackIDs = null) {
      if (!this.audio || !this.audio.src || this.currentTrackID !== track.id) {
        await this.loadSong(track, trackIDs);
        return;
      }

      this.playOrPauseSong();
    },

    async prevSong() {
      if (this.trackQueue.length === 0 || this.currentIndex <= 0) {
        console.log('No previous track available');
        return;
      }

      // Move to the previous track
      this.currentIndex -= 1;
      const prevTrack = this.trackQueue[this.currentIndex];

      // Play the previous track
      await this.loadSong(prevTrack, this.trackQueue.map((t) => t.id));
    },

    async nextSong() {
      if (this.trackQueue.length === 0 || this.currentIndex >= this.trackQueue.length - 1) {
        console.log('No next track available');
        return;
      }

      // Move to the next track
      this.currentIndex += 1;
      const nextTrack = this.trackQueue[this.currentIndex];

      // Play the next track
      await this.loadSong(nextTrack, this.trackQueue.map((t) => t.id));
    },

    async playFromFirst() {
      if (this.trackQueue.length === 0) {
        console.log('No tracks in the queue to play');
        return;
      }

      const firstTrack = this.trackQueue[0];
      this.currentIndex = 0;

      await this.loadSong(firstTrack, this.trackQueue.map((t) => t.id));
    },

    resetState() {
      this.isPlaying = false;
      this.audio = null;
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
  },

  persist: true,
});
