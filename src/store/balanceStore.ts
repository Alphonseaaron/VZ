import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction, getDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';

interface BalanceStore {
  balance: number;
  loading: boolean;
  error: string | null;
  updateBalance: (amount: number) => Promise<void>;
  fetchBalance: () => Promise<void>;
}

export const useBalanceStore = create<BalanceStore>((set, get) => {
  let unsubscribe: (() => void) | null = null;

  // Set up real-time listener for balance updates
  auth.onAuthStateChanged((user) => {
    if (user) {
      unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        const data = doc.data();
        if (data) {
          set({ balance: data.balance || 0 });
        }
      });
    } else if (unsubscribe) {
      unsubscribe();
    }
  });

  return {
    balance: 0,
    loading: false,
    error: null,

    updateBalance: async (amount: number) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', user.uid);
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
      } catch (error) {
        set({ error: (error as Error).message });
        throw error;
      }
    },

    fetchBalance: async () => {
      try {
        set({ loading: true });
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          set({ balance: userDoc.data().balance || 0, loading: false });
        }
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    }
  };
});