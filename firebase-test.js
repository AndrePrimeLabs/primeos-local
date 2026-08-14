import 'dotenv/config';
import { initializeApp } from "firebase/app";
// 1. Import Firestore functions
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore"; 

const firebaseApiKey = process.env.FIREBASE_API_KEY;
if (!firebaseApiKey) throw new Error('FIREBASE_API_KEY missing in environment');

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "primeosapp.firebaseapp.com",
  projectId: "primeosapp",
  storageBucket: "primeosapp.firebasestorage.app",
  messagingSenderId: "667030236741",
  appId: "1:667030236741:web:52ce197780b97bb1d3bd2c",
  measurementId: "G-MPWEGVKWPF"
};

const app = initializeApp(firebaseConfig);

// 2. Initialize the Database instance
const db = getFirestore(app);

try {
  // 3. WRITE DATA: Add a new document to a collection called "users"
  console.log("Saving data...");
  const docRef = await addDoc(collection(db, "users"), {
    name: "Alex Pugedo",
    role: "Developer",
    createdAt: new Date().toISOString()
  });
  console.log("Document saved with ID: ", docRef.id);

  // 4. READ DATA: Fetch all documents from the "users" collection
  console.log("Fetching data...");
  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    console.log(`User ID: ${doc.id} =>`, doc.data());
  });

} catch (error) {
  console.error("Error communicating with Firestore:", error);
}
