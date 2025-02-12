// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAl7px8bchWy4UkRglseH9yb252YPI1WkY",
  authDomain: "soundwave-182cf.firebaseapp.com",
  projectId: "soundwave-182cf",
  storageBucket: "soundwave-182cf.firebasestorage.app",
  messagingSenderId: "956308046544",
  appId: "1:956308046544:web:545babcc35bd01ac4f94d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Export the initialized services
export { app, db, auth };
