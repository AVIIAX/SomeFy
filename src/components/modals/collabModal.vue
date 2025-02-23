<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-btn" @click="closeModal">&times;</button>
      <div class="flex flex-col gap-4" v-if="modalData?.type === 'request'">
        <h1>Collab Request</h1>
        <div class="flex flex-col gap-3">
          <span class="opacity-60">For {{  target?.name }}</span>
          <textarea name="" class="msg" placeholder="Message (Optional)" v-model="message"></textarea>
          <button @click="request(modalData.target, modalData.this, message)" class="send">Send Request</button>
        </div>
      </div>
      <div class="flex flex-col gap-4 p-4 w-full" v-if="modalData?.type === 'accept'">
        <h1>Accept Request</h1>
        <div class="flex flex-col gap-4 justify-center items-center w-full">
          <span class="opacity-60">Accept Collab Request From</span>

        <RouterLink
          :to="`/user/${modalData?.target}`">
          <div class="flex gap-[0.2rem] justify-center items-center bg-[#4b4f9b8f] pr-[1rem] rounded-full w-fit cursor-pointer">
            <div class="searchImg" style="border: solid 2px #d4d4d4; transform: scale(0.7)">
              <img :src="target?.avatar" alt="" />
            </div>
            <div class="nameDiv">
              <div>{{ target?.name }}</div>
            </div>
          </div>
        </RouterLink>

          <p :style="{
            maxHeight: '100px',
            overflow: 'auto',
            color: '#a8a4a4',
            padding: '0.5rem',
            fontFamily: 'monospace'
          }">{{ modalData?.mail?.message }}</p>
          <textarea name="" class="msg w-full" placeholder="Share Your Socials (Optional)" v-model="message"></textarea>
          <button @click="accept(modalData.target, modalData.this, modalData.mailId, message)" class="send w-full">
            Accept Request

          </button>
        </div>
      </div>
      <div class="flex flex-col gap-4 p-4 w-full" v-if="modalData?.type === 'reject'">
        <h1>Reject Request</h1>
        <div class="flex flex-col gap-4 justify-center items-center w-full">
          <span class="opacity-60">Reject Collab Request From</span>

        <RouterLink
          :to="`/user/${modalData?.target}`">
          <div class="flex gap-[0.2rem] justify-center items-center bg-[#4b4f9b8f] pr-[1rem] rounded-full w-fit cursor-pointer">
            <div class="searchImg" style="border: solid 2px #d4d4d4; transform: scale(0.7)">
              <img :src="target?.avatar" alt="" />
            </div>
            <div class="nameDiv">
              <div>{{ target?.name }}</div>
            </div>
          </div>
        </RouterLink>

          <p :style="{
            maxHeight: '100px',
            overflow: 'auto',
            color: '#a8a4a4',
            padding: '0.5rem',
            fontFamily: 'monospace'
          }">{{ modalData?.mail?.message }}</p>
          <textarea name="" class="msg w-full" placeholder="Why Are You Rejecting? (Optional)" v-model="message"></textarea>
          <button @click="reject(modalData.target, modalData.this, modalData.mailId, message)" class="send w-full">
            Reject Request

          </button>
        </div>
      </div>
      <div class="flex flex-col gap-4 p- w-full max-h-[400px]" v-if="modalData?.type === 'msg'">
        <h1>Message</h1>
        <div class="justify-center items-center w-full">
          <p 
    :style="{
      maxHeight: '200px',
      maxWidth: '100%',
      overflow: 'auto',
      overflowX: 'hidden',
      color: '#a8a4a4',
      fontFamily: 'monospace',
      fontSize: '100%'
    }"
  >{{ modalData?.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, ref } from 'vue';
import { useModalStore } from '../../stores/modalStore.js';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { makeNotification } from '../../main.js';

const modalStore = useModalStore();
// Access the modal's data from the store
const modalData = modalStore.modals.collabModal.data;

const db = getFirestore();

//request
const target = ref([]);
const message = ref('');

//accept/reject
const reqFrom = ref([]);


const fetchUserData = async (id) => {
  try {
    const targetRef = doc(db, 'user', id);
    const targetDoc = await getDoc(targetRef);

    if (targetDoc.exists()) {
      const targetData = targetDoc.data();
      target.value = targetData;
    } else {
      console.error('No such user document!');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

onMounted(async () => {

  if(modalData.target) {
  await fetchUserData(modalData?.target);
  }
  
});

const closeModal = () => {
  modalStore.toggleModal('collabModal');  // Close the Boost modal
};

const request = async (target, thisUser, message) => {
  try {

    const userDocRef = doc(db, "user", target);
    // Generate a unique mail key.
    const mailKey =
          Date.now().toString() + Math.random().toString(36).substring(2, 15);

        // Build a new mail object.
        const newMail = {
          type: "collab",
          from: thisUser,
          message: message || "Hey, let's collab!",
          status: 'waiting',
          time: new Date(), 
          seen: false,
        };

        await updateDoc(userDocRef, {
          [`inboxMails.${mailKey}`]: newMail,
        });
        closeModal();
        makeNotification('success', 'Request Sent!')
  } catch (error) {
    makeNotification('failure', 'An Error Occurred! Try Again.')
  }
};

const accept = async (target, thisUser, mailId, message) => {
  try {

const targetDocRef = doc(db, "user", target);
const userDocRef = doc(db, "user", thisUser);
// TARGET UPDATE
// Generate a unique mail key.
const mailKey =
      Date.now().toString() + Math.random().toString(36).substring(2, 15);

    // Build a new mail object.
    const newMail = {
      type: "system",
      from: thisUser,
      message: message,
      collabID: mailId,
      status: 'accepted',
      time: new Date(), 
      seen: false,
    };

    await updateDoc(targetDocRef, {
      [`inboxMails.${mailKey}`]: newMail,
    });

//MAILUPDATE
await updateDoc(userDocRef, { 
  [`inboxMails.${mailId}.status`]: "accepted", 
  [`inboxMails.${mailId}.collabID`]: mailKey
});

closeModal()

} catch (error) {
console.error('Error accept collab request:', error);
}
};

const reject = async (target, thisUser, mailId, message) => {
  try {

const targetDocRef = doc(db, "user", target);
const userDocRef = doc(db, "user", thisUser);
// TARGET UPDATE
// Generate a unique mail key.
const mailKey =
      Date.now().toString() + Math.random().toString(36).substring(2, 15);

    // Build a new mail object.
    const newMail = {
      type: "system",
      from: thisUser,
      message: message,
      collabID: mailId,
      status: 'rejected',
      time: new Date(), 
      seen: false,
    };

    await updateDoc(targetDocRef, {
      [`inboxMails.${mailKey}`]: newMail,
    });

//MAILUPDATE
await updateDoc(userDocRef, { 
  [`inboxMails.${mailId}.status`]: "rejected", 
  [`inboxMails.${mailId}.collabID`]: mailKey
});

closeModal()

} catch (error) {
console.error('Error reject collab request:', error);
}
};




</script>

<style scoped>
.modal-container {
  display: flex;
  flex-direction: column;
}
h1 {
  font-weight: 700;
}

.send {
  border: solid 1px white;
  border-radius: 20px;
  padding: 0.4rem;
  padding-left: 1rem;
  padding-right: 1rem;
  text-align: center;
  transition: all 0.1s;
}

.send:hover {
  background-color: rgba(255, 255, 255, 0.123);
}

.msg {
  background-color: #5456798e; ;
  color: rgb(221, 221, 221);
  padding: 0.5rem;
  border-radius: 10px;
}
</style>
