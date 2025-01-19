<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { RouterLink, RouterView } from 'vue-router';
import Register from './components/Register.vue';
import Login from './components/Login.vue';
import MenuItem from './components/MenuItem.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import UploadTrackModal from './components/UploadTrackModal.vue';
import ChevronUp from 'vue-material-design-icons/ChevronUp.vue';
import ChevronDown from 'vue-material-design-icons/ChevronDown.vue';
import ChevronRight from 'vue-material-design-icons/ChevronRight.vue';
import ChevronLeft from 'vue-material-design-icons/ChevronLeft.vue';
import PlusIcon from 'vue-material-design-icons/Plus.vue';
import { useSongStore } from './stores/song';
import { storeToRefs } from 'pinia';
import { getFirestore, collection, addDoc, doc, getDoc} from "firebase/firestore";

const db = getFirestore();
const isLoggedIn = ref(false); // Corrected variable naming
const isArtist = ref(false);
const showRegister = ref(false); // Controls whether Register or Login is shown
let auth;
const showModal = ref(false);
const userID = ref("null");
const userEmail = ref("null");
const userName = ref("");
const userAV = ref("");

onMounted(() => {
  auth = getAuth();

  onAuthStateChanged(auth, async (user) => {
    isLoggedIn.value = !!user;

    if (user) {
    // If a user is authenticated
    userEmail.value = user.email;
    
    try {
        // Reference to the user's document in Firestore
        const userRef = doc(db, "user", user.uid); // Assuming the user's document is stored with their UID
        const userDoc = await getDoc(userRef); // Fetch the user's document
        userID.value = user.uid;
        if (userDoc.exists()) {
          // If the document exists, extract the 'name' field from it
          const userData = userDoc.data();
          userName.value = userData.name || "No name available"; // If name exists, use it, otherwise display fallback
          userAV.value = userData.avatar || "https://cdn.discordapp.com/attachments/1329382057264025611/1329791122477809767/nopic.png?ex=678b9ffd&is=678a4e7d&hm=63dc663cb5406512356f176f746dcb96657e0bcc927396d897a9394a4105917d&"
          isArtist.value = userData.artist;
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }

    
  } else {
    console.log("No auth");
  }

  });
  isPlaying.value = false;
});

const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);

const switchToLogin = () => {
  showRegister.value = false;
};

const switchToRegister = () => {
  showRegister.value = true;
};

const logout = async () => {
  try {
    await signOut(auth);
    isLoggedIn.value = false;
    currentView.value = 'Register';
  } catch (error) {
    console.error('Logout error:', error);
  }
};



let openMenu = ref(false);
</script>

<template> 
     <!-- NOT LOGGED IN -->
  <div
    v-if="!isLoggedIn"
    class="fixed left-0 top-0 w-full h-full bg-gradient-to-b from-[#1C1C1C] to-black flex items-center justify-center"
  >
    <div>
      <Register v-if="showRegister" @switchToLogin="switchToLogin"/>
      <Login v-else @switchToRegister="switchToRegister" />
    </div>
    
  </div>
  
    <!-- LOGGED IN -->
    <div v-if="isLoggedIn">
      <div>
        <!-- TopNav -->
        <div
          id="TopNav"
          class="
            w-[calc(100%-240px)] 
            h-[60px] 
            fixed 
            right-0 
            z-20 
            bg-[#101010] 
            bg-opacity-80 
            flex 
            items-center 
            justify-between
          "
        >
          <div class="flex items-center ml-6">
            <button type="button" class="rounded-full bg-black p-[1px] cursor-pointer">
              <ChevronLeft fillColor="#FFFFFF" :size="30" />
            </button>
            <button
              type="button"
              class="rounded-full bg-black p-[1px] hover:bg-[#] ml-4 cursor-pointer"
            >
              <ChevronRight fillColor="#FFFFFF" :size="30" />
            </button>
          </div>
  
          <button
            @click="openMenu = !openMenu"
            :class="openMenu ? 'bg-[#282828]' : 'bg-black'"
            class="bg-black hover:bg-[#282828] rounded-full p-0.5 mr-8 mt-0.5 cursor-pointer"
          >
            <div class="flex items-center">
              <img
                class="rounded-full"
                width="27"
                height="27"
                :src='userAV'
              />
              <div class="text-white text-[14px] ml-1.5 font-semibold">{{userName}}</div>
              <ChevronDown
                v-if="!openMenu"
                @click="openMenu = true"
                fillColor="#FFFFFF"
                :size="25"
              />
              <ChevronUp
                v-else
                @click="openMenu = false"
                fillColor="#FFFFFF"
                :size="25"
              />
            </div>
          </button>
  
          <span
            v-if="openMenu"
            class="fixed w-[190px] bg-[#282828] shadow-2xl z-50 rounded-sm top-[52px] right-[35px] p-1 cursor-pointer"
          >
            <ul class="text-gray-200 font-semibold text-[14px]">
              <li class="px-3 py-2.5 hover:bg-[#3E3D3D] border-b border-b-gray-600"><RouterLink :to="`/user/${userID}`">Profile</RouterLink>
              </li>
              <li class="px-3 py-2.5 hover:bg-[#3E3D3D]" @click="logout">Log out</li>
            </ul>
          </span>
        </div>
  
        <!-- NavBar -->
        <div id="SideNav" class="h-[100%] p-6 w-[240px] fixed z-50 bg-black">
          <RouterLink to="/">
            <img width="125" src="https://cdn.discordapp.com/avatars/155149108183695360/b4fdfc64edff74c37e1574d34fad66c2.webp" />
          </RouterLink>
          <div class="my-8"></div>
          <ul>
            <RouterLink to="/">
              <MenuItem
                class="ml-[1px]"
                :iconSize="23"
                name="Profile"
                pageUrl="/profile"
              />
            </RouterLink>
            <div class="py-3.5"></div>
          </ul>
          <div class="border-b border-b-gray-700"></div>
          <ul>
            <li
              class="font-semibold text-[13px] mt-3 text-gray-300 hover:text-white"
            >
              My Playlist #1
            </li>
          </ul>
        </div>
      </div>
  
      <!-- MainComp -->
      <div
        class="
          fixed
          right-0
          top-0
          w-[calc(100%-240px)]
          overflow-auto
          h-full
          bg-gradient-to-b
          from-[#1C1C1C]
          to-black
        "
      >
        <div class="mt-[70px]"></div>
        <RouterView />
        <div class="mb-[100px]"></div>
      </div>
      
      <button @click="showModal = true" class="open-modal-btn happyBtn p-6 fixed z-50 bg-black" v-if="isArtist" :style="{ 
        backgroundColor: '#3481c9', 
        color: 'Black', 
        padding: '1rem', 
        borderRadius: '100%',
        bottom: '130px',
        right: '60px'
        }">
        <PlusIcon fillColor="#FFFFFF" :size="30" />
      </button>
      <UploadTrackModal v-if="showModal" @close="showModal = false" />
      <MusicPlayer v-if="currentTrack" />
    </div>
</template>



<style>
/* width */
::-webkit-scrollbar {
  width: 10px;
  border-radius: 20px;
}

/* Track */
::-webkit-scrollbar-track {
  background: transparent;border-radius: 20px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;border-radius: 20px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;border-radius: 20px;
}

.happyBtn {
  transition: all 0.2s linear;
}
.happyBtn:hover {
  transform: scale(1.1) rotateZ(10deg);
}
</style>