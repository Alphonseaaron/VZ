import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAYyvziLds668JHTpdqeSrYFoSAov1c8NY",
  authDomain: "verzus-ee5f6.firebaseapp.com",
  projectId: "verzus-ee5f6",
  storageBucket: "verzus-ee5f6.appspot.com",
  messagingSenderId: "406215586841",
  appId: "1:406215586841:web:f7983bd3949606a7ec6688",
  measurementId: "G-JSXP5Z4GCR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Helper functions for common Firebase operations
export const firebaseHelper = {
  getCurrentUser: () => auth.currentUser,
  
  async getUserProfile(userId: string) {
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'profiles', userId));
    return userDoc.data();
  },

  async updateUserBalance(userId: string, amount: number) {
    const { doc, runTransaction } = await import('firebase/firestore');
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'profiles', userId);
      const userDoc = await transaction.get(userRef);
      const currentBalance = userDoc.data()?.balance || 0;
      transaction.update(userRef, { balance: currentBalance + amount });
    });
  },

  async createGameSession(gameType: string, metadata = {}) {
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const gamesRef = collection(db, 'games');
    const gameDoc = await addDoc(gamesRef, {
      gameType,
      status: 'active',
      createdAt: serverTimestamp(),
      metadata
    });
    return { id: gameDoc.id, ...metadata };
  },

  async processGameResult(gameId: string, winnerId: string | null, participants: any[]) {
    const { doc, updateDoc, collection, writeBatch, serverTimestamp } = await import('firebase/firestore');
    const batch = writeBatch(db);
    
    // Update game status
    const gameRef = doc(db, 'games', gameId);
    batch.update(gameRef, {
      status: 'completed',
      endedAt: serverTimestamp(),
      winnerId
    });

    // Process participants
    participants.forEach((participant) => {
      const { userId, result, score } = participant;
      const participantRef = doc(collection(db, 'gameParticipants'), `${gameId}_${userId}`);
      batch.set(participantRef, {
        result,
        score,
        leftAt: serverTimestamp()
      });

      // Update user balance
      const userRef = doc(db, 'profiles', userId);
      batch.update(userRef, { balance: score });
    });

    await batch.commit();
  }
};