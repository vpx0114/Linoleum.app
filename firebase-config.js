/* =========================================================
   firebase-config.js — Linoleum.app uchun bulutli sinxronlash
   Bu yerga Firebase konsolidan olingan o'z konfiguratsiyangizni
   qo'ying: console.firebase.google.com > Project settings >
   Your apps > Web app (</>) > SDK setup and configuration
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDMMrmYp-FzPkAI1YorR1WCzYSHi95d_74",
  authDomain: "linoleum-app.firebaseapp.com",
  projectId: "linoleum-app",
  storageBucket: "linoleum-app.firebasestorage.app",
  messagingSenderId: "847055573980",
  appId: "1:847055573980:web:d64778d53847a12a76b519"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (e) {
  console.log("Firebase ulanmadi (konfiguratsiya to'ldirilmagan bo'lishi mumkin):", e.message);
}
