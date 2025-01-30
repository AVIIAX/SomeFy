<template>
    <div class="relative">
      <input
        v-model="sQuery"
        @input="handleSearch"
        @focus="expandSideNav"
        @blur="shrinkSideNav"
        type="text"
        placeholder="Search..."
        class="w-full p-2 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div v-if="results.length > 0" class="absolute overflow-auto mt-2 w-full bg-gray-900 rounded-lg shadow-lg h-[400px]">
        <SearchResult
          v-for="(result, index) in results"
          :key="index"
          :data="result"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import SearchResult from './SearchResult.vue';
  import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
  
  const db = getFirestore();
  const sQuery = ref(''); // Renamed from `query` to `sQuery`
  const results = ref([]);
  
  const handleSearch = async () => {
  if (sQuery.value.trim() === '') {
    results.value = [];
    return;
  }

  console.log('Searching for:', sQuery.value); // Log search term

  try {
    const searches = [
      searchCollection('user', sQuery.value),     // Query users
      searchCollection('track', sQuery.value),   // Query tracks
      searchCollection('playlist', sQuery.value), // Query playlists
    ];

    const [users, tracks, playlists] = await Promise.all(searches);

    // Combine results from all collections
    results.value = [...users, ...tracks, ...playlists];

    console.log('Final results:', results.value); // Log combined results
  } catch (error) {
    console.error('Error during search:', error);
  }
};


  
const searchCollection = async (collectionName, searchTerm) => {
  try {
    console.log(`Querying collection: ${collectionName}`);
    const colRef = collection(db, collectionName);
    const querySnapshot = await getDocs(colRef);

    // Convert search term to lowercase
    const lowerSearchTerm = searchTerm.toLowerCase();

    // Filter locally for case-insensitive and partial matches
    const filteredDocs = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: collectionName, // Distinguish the type (user, track, playlist)
      }))
      .filter((doc) => doc.name && doc.name.toLowerCase().includes(lowerSearchTerm));

    console.log(`Filtered results from ${collectionName}:`, filteredDocs);
    return filteredDocs;
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    return [];
  }
};


  
  const expandSideNav = () => {
    const sideNav = document.getElementById('SideNav');
    sideNav.style.transition = 'width 0.3s ease-in-out';
    sideNav.style.width = '400px';
  };
  
  const shrinkSideNav = () => {
    const sideNav = document.getElementById('SideNav');
    sideNav.style.transition = 'width 0.3s ease-in-out';
    sideNav.style.width = '240px';
  };
  </script>
  
  <style scoped>
  input:focus {
    background-color: #1a1a1a;
  }
  </style>
  