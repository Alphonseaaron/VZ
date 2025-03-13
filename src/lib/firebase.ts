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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export const firebaseHelper = {
  getCurrentUser: () => auth.currentUser,
  
  async getUserProfile(userId: string) {
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data();
  },

  async updateUserBalance(userId: string, amount: number) {
    const { doc, runTransaction } = await import('firebase/firestore');
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const currentBalance = userDoc.data()?.balance || 0;
      const newBalance = currentBalance + amount;
      
      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }
      
      transaction.update(userRef, { balance: newBalance });
    });
  },

  async createGameSession(userId: string, gameType: string, betAmount: number) {
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const gamesRef = collection(db, 'games');
    
    // Verify and deduct balance first
    await this.updateUserBalance(userId, -betAmount);
    
    const gameDoc = await addDoc(gamesRef, {
      userId,
      gameType,
      betAmount,
      status: 'active',
      createdAt: serverTimestamp()
    });
    
    return gameDoc.id;
  },

  async processGameResult(gameId: string, userId: string, winAmount: number) {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Update game status
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      status: 'completed',
      winAmount,
      completedAt: serverTimestamp()
    });

    // Update user balance if they won
    if (winAmount > 0) {
      await this.updateUserBalance(userId, winAmount);
    }
  }
};