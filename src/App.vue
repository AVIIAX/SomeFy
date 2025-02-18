<script setup>
import { watch , ref, onMounted, computed  } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { RouterLink, RouterView } from 'vue-router';
import Register from './components/Register.vue';
import Login from './components/Login.vue';
import MenuItem from './components/MenuItem.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import SearchBar from './components/SearchBar.vue';
import UploadTrackModal from './components/modals/UploadTrackModal.vue';
import songRow from './components/SongRow.vue';
import boostModal from './components/modals/boostModal.vue';
import boostedModal from './components/modals/boostedModal.vue';
import followModal from './components/modals/followModal.vue';
import Mail from './components/Mails.vue';
import CollabModal from './components/modals/collabModal.vue';
import ChevronUp from 'vue-material-design-icons/ChevronUp.vue';
import ChevronDown from 'vue-material-design-icons/ChevronDown.vue';
import CircleMultiple from 'vue-material-design-icons/CircleMultiple.vue';
import MailBox from 'vue-material-design-icons/EmailOutline.vue';
import MailBoxOpen from 'vue-material-design-icons/EmailOpenOutline.vue';
import PlusIcon from 'vue-material-design-icons/Plus.vue';
import { useSongStore } from './stores/song';
import { useModalStore } from './stores/modalStore.js';
import { storeToRefs } from 'pinia';
import { getFirestore, collection, addDoc, doc, getDoc, onSnapshot} from "firebase/firestore";
import draggable from './utils/DraggableDirective.js';

const db = getFirestore();
const isLoggedIn = ref(false); // Corrected variable naming
const isArtist = ref(false);
const showRegister = ref(false); // Controls whether Register or Login is shown
let auth = getAuth();
const showModal = ref(false);
const userID = ref("null");
const userEmail = ref("null");
const userName = ref("");
const userAV = ref("");
const userCredits = ref("");
const userMails = ref([null]);
const unseenMailCount = computed(() => {
  return userMails.value.filter(mail => !mail.seen).length;
});
const useSong = useSongStore();
const { isPlaying, currentTrack } = storeToRefs(useSong);

const modalStore = useModalStore();



onMounted(() => {
  const auth = getAuth();
  const db = getFirestore();

  // Listen for authentication state changes
  onAuthStateChanged(auth, (user) => {
    isLoggedIn.value = !!user;

    if (user) {
      // If a user is authenticated
      userEmail.value = user.email;
      
      // Reference to the user's document in Firestore
      const userRef = doc(db, "user", user.uid);

      // Listen for real-time updates to the user's document
      onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();

          userID.value = user.uid;
          userName.value = userData.name || "No name available";
          userAV.value =
            userData.avatar ||
            "https://cdn.discordapp.com/attachments/1329382057264025611/1329791122477809767/nopic.png?ex=678b9ffd&is=678a4e7d&hm=63dc663cb5406512356f176f746dcb96657e0bcc927396d897a9394a4105917d&";
          userCredits.value = userData.credits || 0;
          isArtist.value = userData.artist || false;
          
          // Convert inboxMails (which is a map) to an array
      // if (userData.inboxMails) {
      //   userMails.value = Object.keys(userData.inboxMails).map((key) => {
      //     return { id: key, ...userData.inboxMails[key] };
      //   });
      // } else {
      //   userMails.value = [];
      // }
      fetchUserMails(user.uid)
        } else {
          console.log("No such document!");
        }
      }, (error) => {
        console.error("Error listening to document: ", error);
      });
    } else {
      console.log("No authenticated user");
      isLoggedIn.value = false;
      userEmail.value = null;
      userName.value = null;
      userID.value = null;
      userAV.value = null;
      userCredits.value = 0;
      isArtist.value = false;
    }
  });


  isPlaying.value = false;

});

const switchToLogin = () => {
  showRegister.value = false;
};

const switchToRegister = () => {
  showRegister.value = true;
};

const handleSongUploadClick = () => {
  modalStore.toggleModal('uploadTrackModal', null);
};

const fetchUserMails = async (id) => {
  try {
    const userDocRef = doc(db, 'user', id);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.inboxMails) {
        // Convert the inboxMails map to an array
        userMails.value = Object.keys(userData.inboxMails).map((key) => {
          
          return { id: key, ...userData.inboxMails[key] };
        });
        // Sort the mails so that the newest (most recent timestamp) is at the top
        userMails.value.sort((a, b) => {
          // If using Firebase Timestamp, use toDate().getTime(), otherwise fallback to Date constructor
          const timeA =
            a.time && typeof a.time.toDate === 'function'
              ? a.time.toDate().getTime()
              : new Date(a.time).getTime();
          const timeB =
            b.time && typeof b.time.toDate === 'function'
              ? b.time.toDate().getTime()
              : new Date(b.time).getTime();
          return timeB - timeA; // descending order (newest first)
        });
      } else {
        userMails.value = [];
      }
    }
  } catch (error) {
    console.error('Error fetching user mails:', error);
    userMails.value = [];
  }
};


const logout = async () => {
  try {
    console.log(auth);
    
    await signOut(auth);
    isLoggedIn.value = false;
    currentView.value = 'Login';
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Watch for changes in currentTrack and log updates
watch(currentTrack, (newTrack) => {
  currentTrack.value = newTrack;
  console.log('Current track changed:', newTrack);
});

let openMenu = ref(false);
let openMail = ref(false);
</script>
<script>
export default {
  directives: {
    draggable, // Register the custom directive
  },
};
</script>
<template> 
    <!-- NOT LOGGED IN -->
    <div v-if="!isLoggedIn" class="fixed left-0 top-0 w-full h-full bg-gradient-to-b from-[#1C1C1C] to-black flex items-center justify-center">
        <div>
            <Register v-if="showRegister" @switchToLogin="switchToLogin"/>
            <Login v-else @switchToRegister="switchToRegister"/>
        </div>
    </div>
    <!-- LOGGED IN -->
    <div v-if="isLoggedIn">
        <div>
            <!-- TopNav -->
            <div id="TopNav" class="
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
          ">
                <RouterLink to="/Shop">
                    <div class="flex items-center ml-6">
                        <button type="button" class="rounded-full bg-black p-[1px] cursor-pointer text-white">
                            <CircleMultiple fillColor="#FFFFFF" :size="30"/>
                        </button>
                        <button type="button" class="rounded-full bg-black p-[1px] cursor-pointer text-white">
                            {{userCredits}}
</button>
                    </div>
                </RouterLink>
                <div class="flex items-center ml-6 gap-5">

                  <div class="cursor-pointer relative">
    <MailBox
      v-if="!openMail"
      @click="openMail = true"
      fillColor="#FFFFFF"
      :size="30"
    />
    <MailBoxOpen
      v-else
      @click="openMail = false"
      fillColor="#FFFFFF"
      :size="30"
    />
    <!-- Red dot indicator if there are unseen mails -->
    <span
      v-if="unseenMailCount > 0"
      class="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500"
    ></span>
  </div>

  <span
    v-if="openMail"
    class="fixed w-[190px] bg-[#282828] shadow-2xl z-50 rounded-sm top-[52px] right-[105px] w-[250px] h-[300px] p-1 cursor-pointer"
  >
    <div class="text-gray-200 font-semibold text-[14px]">
      <div
        v-if="userMails && userMails.length > 0"
        class="overflow-auto mt-2 w-full h-[400px]  bg-[#181822] rounded-lg shadow-lg z-50"
      >
      <Mail
      v-for="(mail, index) in userMails"
      :key="mail.id"        
      :data="mail"          
    ></Mail>
      </div>
      <div v-else class="text-center text-gray-400 mt-4">No mails found.</div>
    </div>
  </span>
                    
                <button @click="openMenu = !openMenu" :class="openMenu ? 'bg-[#282828]' : 'bg-black'" class="bg-black hover:bg-[#282828] rounded-full p-0.5 mr-8 mt-0.5 cursor-pointer">
                    <div class="flex items-center">
                        <img class="rounded-full navProfileImg" width="27" height="27" :src='userAV'/>
                        <div class="text-white text-[14px] ml-1.5 font-semibold">{{userName}}</div>
                        <ChevronDown v-if="!openMenu" @click="openMenu = true" fillColor="#FFFFFF" :size="25"/>
                        <ChevronUp v-else @click="openMenu = false" fillColor="#FFFFFF" :size="25"/>
                    </div>
                </button>
              </div>
              
              
              <span v-if="openMenu && userMails" class="fixed w-[190px] bg-[#282828] shadow-2xl z-50 rounded-sm top-[52px] right-[35px] p-1 cursor-pointer"> <ul class="text-gray-200 font-semibold text-[14px]">
                        <li class="px-3 py-2.5 hover:bg-[#3E3D3D] border-b border-b-gray-600">
                            <RouterLink :to="`/user/${userID}`">Profile</RouterLink>
                        </li>
                        <li class="px-3 py-2.5 hover:bg-[#3E3D3D]" @click="logout">Log out</li>
                    </ul> </span>

            </div>
            <!-- NavBar -->
            <div id="SideNav" class="p-6 w-[240px] fixed z-50 bg-black" :style="{
          height: currentTrack ? 'calc(100% - 90px)' : '100%'
        }">
                <RouterLink to="/">
                    <img width="125" src="https://i.postimg.cc/QdgWWrjW/Sound-Wave.png"/>
                </RouterLink>
                <div class="my-8"></div>
                <ul>
                    <RouterLink to="/">
                        <MenuItem class="ml-[1px]" name="Home" pageUrl="/"/>
                    </RouterLink>
                    <RouterLink to="/Shop">
                        <MenuItem class="ml-[1px]" name="Get More Credits" pageUrl="/Shop"/>
                    </RouterLink>
                    <RouterLink to="/library">
                        <MenuItem class="ml-[1px]" name="Library" pageUrl="/library"/>
                    </RouterLink>
                    <div class="py-3.5"></div>
                </ul>
                <div class="border-b border-b-gray-700"></div>
                <div class="mt-4">
                    <SearchBar/>
                </div>
            </div>
        </div>
        <!-- MainComp -->
        <div class="
          fixed
          right-0
          top-0
          w-[calc(100%-240px)]
          overflow-auto
          h-full
          bg-gradient-to-b
          from-[#1C1C1C]
          to-black
        ">
            <div class="mt-[60px]"></div>
            <RouterView/>
            <div class="mb-[100px]"></div>
        </div>
        <button @click="handleSongUploadClick" class="open-modal-btn happyBtn p-6 fixed z-50 bg-black draggable-box" v-if="isArtist" :style="{ 
        backgroundColor: '#3481c9', 
        color: 'Black', 
        padding: '1rem', 
        borderRadius: '100%',
        bottom: '130px',
        right: '60px'
        }">
            <PlusIcon fillColor="#FFFFFF" :size="30"/>
        </button>
        
        <teleport to="body">
        <UploadTrackModal v-if="modalStore.modals.uploadTrackModal.isVisible"/>
        <boostModal v-if="modalStore.modals.boostModal.isVisible"/>
        <boostedModal v-if="modalStore.modals.boostedModal.isVisible"/>
        <followModal v-if="modalStore.modals.followModal.isVisible"/>
        <collabModal v-if="modalStore.modals.collabModal.isVisible"/>
        </teleport>

        <MusicPlayer v-if="currentTrack"/>
    </div>

    
</template>
<style>
body {
   background-color:  rgb(0 0 0);;
}
/* width */
::-webkit-scrollbar {
  width: 7px;
  border-radius: 20px;
}

/* Track */
::-webkit-scrollbar-track {
  border-radius: 20px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #ffffff86;border-radius: 20px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #ffffffd7;border-radius: 20px;
}

.happyBtn {
  transition: all 0.2s linear;
}
.happyBtn:hover {
  transform: scale(1.1) rotateZ(10deg);
}

.navProfileImg {
  height: revert-layer;
  object-fit: cover;
  border-radius: 50%;
}
</style>