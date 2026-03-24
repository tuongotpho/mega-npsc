// Firebase configuration for Innovation Module (Sangkien)
// This is a separate Firebase instance to keep data isolated from the main QLDA project
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfigSangkien = {
  apiKey: "AIzaSyD_0AkyF0VHWWjqiX_ZE1KapQ72kgbM--Q",
  authDomain: "dashboard-8787.firebaseapp.com",
  projectId: "dashboard-8787",
  storageBucket: "dashboard-8787.firebasestorage.app",
  messagingSenderId: "544276859484",
  appId: "1:544276859484:web:973ad657ff87044349b499",
  measurementId: "G-GS3R89R7ZY"
};

// Initialize secondary Firebase app for Innovation module
// Using a named instance to avoid conflicts with the main QLDA Firebase
const sangkienApp = firebase.apps.find(app => app.name === 'sangkien') 
  || firebase.initializeApp(firebaseConfigSangkien, 'sangkien');

export const dbSangkien = sangkienApp.firestore();
export const authSangkien = sangkienApp.auth();
export const storageSangkien = sangkienApp.storage();

export default firebase;
