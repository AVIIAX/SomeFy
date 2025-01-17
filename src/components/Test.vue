<template>
    <div class="container">
      <h1>User Data</h1>
  
      <!-- Display users -->
      <div v-if="users.length > 0">
        <ul>
          <li v-for="user in users" :key="user.id">
            <p>Name: {{ user.name }}</p>
            <p>Email: {{ user.email }}</p>
            <button @click="editUser(user.id)">Edit</button>
          </li>
        </ul>
      </div>
  
      <!-- Add new user -->
      <div>
        <h2>Add New User</h2>
        <input v-model="newUserName" placeholder="Enter Name" />
        <input v-model="newUserEmail" placeholder="Enter Email" />
        <button @click="addUser">Add User</button>
      </div>
  
      <!-- Edit user -->
      <div v-if="editingUserId">
        <h2>Edit User</h2>
        <input v-model="editUserName" placeholder="Edit Name" />
        <input v-model="editUserEmail" placeholder="Edit Email" />
        <button @click="updateUser">Update User</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
  import { useRouter } from 'vue-router';
  
  const db = getFirestore();
  const users = ref([]);
  const newUserName = ref('');
  const newUserEmail = ref('');
  const editUserName = ref('');
  const editUserEmail = ref('');
  const editingUserId = ref(null);
  
  const router = useRouter();
  
  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'user'));
      users.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  // Add a new user
  const addUser = async () => {
    if (newUserName.value && newUserEmail.value) {
      try {
        await addDoc(collection(db, 'user'), {
          name: newUserName.value,
          email: newUserEmail.value,
        });
        newUserName.value = '';
        newUserEmail.value = '';
        fetchUsers(); // Refresh user list
      } catch (error) {
        console.error('Error adding user:', error);
      }
    }
  };
  
  // Edit user (set up form)
  const editUser = (userId) => {
    const user = users.value.find(u => u.id === userId);
    editUserName.value = user.name;
    editUserEmail.value = user.email;
    editingUserId.value = userId;
  };
  
  // Update user
  const updateUser = async () => {
    if (editingUserId.value && editUserName.value && editUserEmail.value) {
      try {
        const userRef = doc(db, 'user', editingUserId.value);
        await updateDoc(userRef, {
          name: editUserName.value,
          email: editUserEmail.value,
        });
        editingUserId.value = null;
        fetchUsers(); // Refresh user list
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  };
  
  // Fetch users when the component is mounted
  onMounted(() => {
    fetchUsers();
  });
  </script>
  
  <style scoped>
  /* Add your styles here */
  * {
    color: white;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  </style>
  