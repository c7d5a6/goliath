// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAk8BXkbIjV61o8SzLxl6YEw5em7k-aMTk",
  authDomain: "goliath-fd522.firebaseapp.com",
  projectId: "goliath-fd522",
  storageBucket: "goliath-fd522.firebasestorage.app",
  messagingSenderId: "1014603000424",
  appId: "1:1014603000424:web:627f0c36a885648510a9dd",
  measurementId: "G-9TC0B3HTRG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export default app

