import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
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
      unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
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
          const userRef = doc(db, 'profiles', user.uid);
          const userDoc = await transaction.get(userRef);
          const currentBalance = userDoc.data()?.balance || 0;
          transaction.update(userRef, { balance: currentBalance + amount });
        });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },

    fetchBalance: async () => {
      try {
        set({ loading: true });
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const userRef = doc(db, 'profiles', user.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
          const data = doc.data();
          if (data) {
            set({ balance: data.balance || 0, loading: false });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    }
  };
});