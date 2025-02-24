<template>
    <div class="p-8">
        <!-- "Browse all" button -->
        <button class="text-white text-2xl font-semibold cursor-pointer">
            Browse All
        </button>

        <div class="py-4"></div>

        <!-- Masonry container -->
        <div class="columns-5 gap-4 gallery">
            <div v-for="(genre, index) in genreList" :key="index"
                class="mb-4 break-inside-avoid overflow-hidden rounded-md flex flex-col items-center justify-center text-center z-0"
                :style="{ height: getRandomHeight(), backgroundColor: getRandomColor().color, }">
                <!-- Pass track IDs in the query -->
                <RouterLink :to="{
                    path: `/library/${genre}`,
                    params: { playlist: null, genre: genre }
                    }" class="w-full h-full flex flex-col items-center justify-center z-2">
                    <div class="font-bold text-lg">
                        {{ genre }}
                    </div>
                    <div class="text-sm text-gray-300 z-2">
                        {{ formatNumber(genreTrackCounts[genre] || 0) }} tracks
                    </div>
                </RouterLink>
            </div>
        </div>
    </div>
    <div class="p-8">
        <!-- "Browse all" button -->
        <button class="text-white text-2xl font-semibold cursor-pointer">
            Browse All
        </button>

        <div class="py-4"></div>

        <!-- Masonry container -->
        <div class="columns-5 gap-4 gallery">
            <div v-for="(genre, index) in genreList" :key="index"
                class="mb-4 break-inside-avoid overflow-hidden rounded-md flex flex-col items-center justify-center text-center z-0"
                :style="{ height: getRandomHeight(), backgroundColor: getRandomColor().color, }">
                <!-- Pass track IDs in the query -->
                <RouterLink :to="{
                    path: `/library/${genre}`,
                    params: { playlist: null, genre: genre }
                    }" class="w-full h-full flex flex-col items-center justify-center z-2">
                    <div class="font-bold text-lg">
                        {{ genre }}
                    </div>
                    <div class="text-sm text-gray-300 z-2">
                        {{ formatNumber(genreTrackCounts[genre] || 0) }} tracks
                    </div>
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
    getFirestore,
    collection,
    query,
    where,
    getDoc,
    getDocs,
    doc
} from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import uniqolor from 'uniqolor'


const db = getFirestore()

// Refs to store genres, counts, and IDs
const genreList = ref([])
const genreTrackCounts = ref({})
const genreTrackIDs = ref({})

// Fetch list of genres from Firestore
const fetchGenres = async () => {
    const systemDocRef = doc(db, 'misc', 'system')
    const systemDocSnap = await getDoc(systemDocRef)

    if (systemDocSnap.exists()) {
        const data = systemDocSnap.data()
        genreList.value = data.genres || []
    } else {
        console.error('System document does not exist!')
    }
}

// Fetch track IDs for a specific genre
const fetchTrackIdsForGenre = async (genre) => {
    const tracksRef = collection(db, 'track')
    const q = query(tracksRef, where('genre', '==', genre))
    const querySnapshot = await getDocs(q)

    const trackIds = []
    querySnapshot.forEach((docSnap) => {
        trackIds.push(docSnap.id)
    })
    return trackIds
}

// Format numbers with commas
const formatNumber = (num) => {
    return num.toLocaleString()
}

// On component mount, fetch genres and track info
onMounted(async () => {
    await fetchGenres()
    for (let genre of genreList.value) {
        const trackIds = await fetchTrackIdsForGenre(genre)
        genreTrackCounts.value[genre] = trackIds.length
        genreTrackIDs.value[genre] = trackIds
    }
})

// Randomly generate a height between 250px and 500px
const getRandomHeight = () => {
    return `${Math.floor(Math.random() * 250) + 250}px`
}

const getRandomColor = () => {
    return uniqolor.random()
}

</script>

<style scoped>
.gallery>div {
    position: relative;
    color: azure;
    transition: all 0.2s;
}

.gallery>div>a {
    z-index: 2;
}

.gallery>div::after {
    position: absolute;
    content: '';
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 5, 68, 0.397);
    z-index: 1;
}

.gallery>div:hover {
    filter: brightness(1.2);
}
</style>