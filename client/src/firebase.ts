import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACHgYkddla6eDc2LTu0YIprRGlQB62aFo",
  authDomain: "typewrites.firebaseapp.com",
  projectId: "typewrites",
  storageBucket: "typewrites.appspot.com",
  messagingSenderId: "874755270968",
  appId: "1:874755270968:web:2b1df3f3901a0ed28939cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore();