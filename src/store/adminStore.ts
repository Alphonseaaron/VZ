import { create } from 'zustand';
import { db } from '../lib/firebase';
import { 
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  where
} from 'firebase/firestore';

interface AdminState {
  users: any[];
  transactions: any[];
  gameStats: any;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  fetchUsers: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchGameStats: () => Promise<void>;
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  transactions: [],
  gameStats: null,
  loading: false,
  error: null,
  isAdmin: false,

  checkAdminStatus: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDocs(
        query(collection(db, 'profiles'), where('id', '==', user.uid))
      );
      
      const userData = userDoc.docs[0]?.data();
      set({ isAdmin: userData?.isAdmin || false });
    } catch (error) {
      console.error('Error checking admin status:', error);
      set({ isAdmin: false });
    }
  },

  fetchUsers: async () => {
    try {
      set({ loading: true });
      const usersQuery = query(
        collection(db, 'profiles'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      set({ loading: true });
      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions = await Promise.all(
        snapshot.docs.map(async (transDoc) => {
          const transaction = transDoc.data();
          const userDoc = await getDocs(
            query(collection(db, 'profiles'), where('id', '==', transaction.userId))
          );
          const userData = userDoc.docs[0]?.data();
          return {
            ...transaction,
            username: userData?.username
          };
        })
      );

      set({ transactions, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchGameStats: async () => {
    try {
      set({ loading: true });
      const gamesQuery = query(
        collection(db, 'games'),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(gamesQuery);
      const games = snapshot.docs.map(doc => doc.data());

      const stats = {
        totalGames: games.length,
        gamesByType: games.reduce((acc: any, game: any) => {
          acc[game.gameType] = (acc[game.gameType] || 0) + 1;
          return acc;
        }, {}),
        recentActivity: games.slice(0, 10)
      };

      set({ gameStats: stats, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  banUser: async (userId: string) => {
    try {
      set({ loading: true });
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, { banned: true });
      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  unbanUser: async (userId: string) => {
    try {
      set({ loading: true });
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, { banned: false });
      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));