// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging"; // <-- Add this

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwZcWRl2hYaHqSXZudWDXX82x0KdZWVQU",
  authDomain: "servicesuitecloudpwa.firebaseapp.com",
  projectId: "servicesuitecloudpwa",
  storageBucket: "servicesuitecloudpwa.firebasestorage.app",
  messagingSenderId: "486863334363",
  appId: "1:486863334363:web:efdc1af79d8690f8bc15fe",
  measurementId: "G-GWN2N2LCDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app); // <-- Add this

export { app, analytics, messaging }; // <-- Export messaging