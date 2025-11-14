// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase (only if all required keys are present)
let FireBase_App;
let FireBase_Auth;
let db;

if (firebaseConfig.apiKey && firebaseConfig.authDomain) {
    FireBase_App = initializeApp(firebaseConfig);
    FireBase_Auth = getAuth(FireBase_App);
    db = getFirestore(FireBase_App);
} else {
    console.warn('Firebase is not configured. Please set environment variables.');
}

export { FireBase_App, FireBase_Auth, db };