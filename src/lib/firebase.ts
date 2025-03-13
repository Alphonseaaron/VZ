import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAYyvziLds668JHTpdqeSrYFoSAov1c8NY",
  authDomain: "verzus-ee5f6.firebaseapp.com",
  databaseURL: "https://verzus-ee5f6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "verzus-ee5f6",
  storageBucket: "verzus-ee5f6.firebasestorage.app",
  messagingSenderId: "406215586841",
  appId: "1:406215586841:web:f7983bd3949606a7ec6688",
  measurementId: "G-JSXP5Z4GCR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);

// Helper functions for common Firebase operations
export const firebaseHelper = {
  getCurrentUser: () => auth.currentUser,
  
  async getUserProfile(userId: string) {
    const { ref, get } = await import('firebase/database');
    const snapshot = await get(ref(db, `profiles/${userId}`));
    return snapshot.val();
  },

  async updateUserBalance(userId: string, amount: number) {
    const { ref, runTransaction } = await import('firebase/database');
    const balanceRef = ref(db, `profiles/${userId}/balance`);
    await runTransaction(balanceRef, (currentBalance) => {
      return (currentBalance || 0) + amount;
    });
  },

  async createGameSession(gameType: string, metadata = {}) {
    const { ref, push, serverTimestamp } = await import('firebase/database');
    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    await newGameRef.set({
      gameType,
      status: 'active',
      createdAt: serverTimestamp(),
      metadata
    });
    return { id: newGameRef.key, ...metadata };
  },

  async processGameResult(gameId: string, winnerId: string | null, participants: any[]) {
    const { ref, update, serverTimestamp } = await import('firebase/database');
    const updates: any = {};
    
    // Update game status
    updates[`games/${gameId}/status`] = 'completed';
    updates[`games/${gameId}/endedAt`] = serverTimestamp();
    updates[`games/${gameId}/winnerId`] = winnerId;

    // Process participants
    participants.forEach((participant) => {
      const { userId, result, score } = participant;
      updates[`gameParticipants/${gameId}/${userId}`] = {
        result,
        score,
        leftAt: serverTimestamp()
      };

      // Update user balance
      updates[`profiles/${userId}/balance`] = score;
    });

    await update(ref(db), updates);
  }
};