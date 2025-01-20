import { defineStore } from 'pinia'
import artist from '../artist.json'
// import { getFirestore, doc, getDoc } from 'firebase/firestore';

// const db = getFirestore();

export const useSongStore = defineStore('song', {
  state: () => ({
    isPlaying: false,
    audio: null,
    currentTrack: null,
    currentPlaylist: null
  }),
  actions: {
    loadSong(artist, track, playList) {
        this.currentArtist = artist
        this.currentTrack = track
        this.currentPlaylist = playList

        console.log("Playlist" + this.currentPlaylist);
        

        if (this.audio && this.audio.src) {
            this.audio.pause()
            this.isPlaying = false
            this.audio.src = ''
        }

        this.audio = new Audio()
        this.audio.src = track.url

        setTimeout(() => {
            this.isPlaying = true
            this.audio.play()
        }, 200)
    },

    playOrPauseSong() {
        if (this.audio.paused) {
            this.isPlaying = true
            this.audio.play()

        } else {
            this.isPlaying = false
            this.audio.pause()
        }
    },

    playOrPauseThisSong(artist, track) {
        if (!this.audio || !this.audio.src || (this.currentTrack.id !== track.id)) {
            this.loadSong(artist, track)
            return
        }

        this.playOrPauseSong()
    },

    prevSong(currentTrack) {
        let track = artist.tracks[currentTrack.id - 2]
        this.loadSong(artist, track)
    },

    nextSong(currentTrack) {
        if (currentTrack.id === artist.tracks.length) {
            let track = artist.tracks[0]
            this.loadSong(artist, track)
        } else {
            let track = artist.tracks[currentTrack.id]
            this.loadSong(artist, track)
        }
    },

    playFromFirst() {
        this.resetState()
        let track = artist.tracks[0]
        this.loadSong(artist, track)
    },

    resetState() {
        this.isPlaying = false
        this.audio = null
        this.currentArtist = null
        this.currentTrack = null
    }
  },
  persist: true
})
