// FIX: Switched to Firebase v8 compatibility imports to resolve module resolution errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Hardcoded Firebase configuration as per user request.
// This resolves runtime errors when environment variables are not available.
const firebaseConfig = {
  apiKey: "AIzaSyCJsXTXTKuyJAkc4JihBZz5vtxemIRJ4V0",
  authDomain: "qlda-npsc.firebaseapp.com",
  projectId: "qlda-npsc",
  storageBucket: "qlda-npsc.firebasestorage.app",
  messagingSenderId: "212193217563",
  appId: "1:212193217563:web:ebb6d95b6fa9afd42cbcbe",
};


// Initialize Firebase, preventing re-initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// FIX: Export the firebase object itself for use with features like FieldValue.
export { auth, db, storage, googleProvider, firebase };