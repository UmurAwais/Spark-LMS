// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAon4KXsfP6tqSJ6b9RgXd_xDkEowztJ3I",
  authDomain: "spark-trainings-lms.firebaseapp.com",
  projectId: "spark-trainings-lms",
  storageBucket: "spark-trainings-lms.appspot.com",
  messagingSenderId: "210481812654",
  appId: "1:210481812654:web:255bc24f5a49912e63893f",
  measurementId: "G-D79DNM0VD2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);