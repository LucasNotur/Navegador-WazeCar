import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, enableIndexedDbPersistence } from 'firebase/firestore';
import { generateMockOrders } from './mockData';

const firebaseConfig = {
  projectId: "silicon-ethos-hq6d2",
  appId: "1:856724831299:web:14658a7fac1f7f265128f6",
  apiKey: "AIzaSyAbQgTPf-0enEq9k4nBNz9uVH9HF2j3Qx0",
  authDomain: "silicon-ethos-hq6d2.firebaseapp.com",
  storageBucket: "silicon-ethos-hq6d2.firebasestorage.app",
  messagingSenderId: "856724831299",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-astrumevnavigato-6c4f0e66-0071-4e43-831c-8b916d3f52c6");

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

// Seed function to insert mock data if the collection is empty
export const seedDatabase = async (lat: number, lng: number) => {
  console.log("Seeding database with mock OS...");
  const batch = writeBatch(db);
  const mockOrders = generateMockOrders(lat, lng);
  mockOrders.forEach(order => {
    // Use the order ID as the document ID
    const docRef = doc(db, 'service_orders', order.id);
    batch.set(docRef, order);
  });
  await batch.commit();
  console.log("Database seeded successfully!");
};
