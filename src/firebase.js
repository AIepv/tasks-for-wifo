// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFq_LxeS3kIhY4-7x96wauVvC-B9Qc71A",
  authDomain: "tareas-javier-marian.firebaseapp.com",
  projectId: "tareas-javier-marian",
  storageBucket: "tareas-javier-marian.firebasestorage.app",
  messagingSenderId: "194214324039",
  appId: "1:194214324039:web:8d94603f4aef45cc928e62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);