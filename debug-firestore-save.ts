import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Config:", JSON.stringify(firebaseConfig, null, 2));

async function main() {
    try {
        console.log("Initializing...");
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        console.log("Signing in...");
        const userCred = await signInAnonymously(auth);
        console.log("Signed in:", userCred.user.uid);

        console.log("Writing test doc...");
        await setDoc(doc(db, "gold_price_history", "debug_test"), {
            test: true,
            timestamp: new Date().toISOString()
        });
        console.log("Write success!");

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
