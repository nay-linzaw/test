// This is a JavaScript file

  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDDCwAtOF3tncX8xguOpH2Kca89_C8C0Iw",
    authDomain: "recycle-leader-3.firebaseapp.com",
    projectId: "recycle-leader-3",
    storageBucket: "recycle-leader-3.appspot.com",
    messagingSenderId: "345620035718",
    appId: "1:345620035718:web:e10dec570a000fc945b907",
    measurementId: "G-VCT5YBK53V"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);