// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyD9kl_LOqxP88JEx9d1XAaimOQ1SrOFL0A",
  authDomain: "pingpong-900db.firebaseapp.com",
  projectId: "pingpong-900db",
  storageBucket: "pingpong-900db.firebasestorage.app",
  messagingSenderId: "245554248699",
  appId: "1:245554248699:web:3cddafe1470a56ee69295e",
  measurementId: "G-XVWP1QDTVW",
  databaseURL: "https://pingpong-900db-default-rtdb.firebaseio.com/"
};

// Initialize Firebase (Global variables)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
window.db = firebase.database();
console.log("Firebase Database Initialized:", window.db);
