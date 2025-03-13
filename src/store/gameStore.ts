import { create } from 'zustand';
import { db } from '../lib/firebase';
import { 
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  doc
} from 'firebase/firestore';

interface Game {
  id: string;
  gameType: string;
  status: string;
  createdAt: any;
  endedAt?: any;
  winnerId?: string | null;
  metadata?: any;
}

interface GameState {
  currentGame: Game | null;
  gameHistory: Game[];
  loading: boolean;
  error: string | null;
  createGame: (gameType: string) => Promise<Game>;
  joinGame: (gameId: string) => Promise<void>;
  processGameResult: (gameId: string, result: any) => Promise<void>;
  fetchGameHistory: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  gameHistory: [],
  loading: false,
  error: null,

  createGame: async (gameType) => {
    set({ loading: true, error: null });
    try {
      const gameData = {
        gameType,
        status: 'active',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'games'), gameData);
      const game = { id: docRef.id, ...gameData };
      
      set({ currentGame: game, loading: false });
      return game;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  joinGame: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const participantData = {
        gameId,
        userId: auth.currentUser?.uid,
        joinedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'gameParticipants'), participantData);
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  processGameResult: async (gameId, result) => {
    set({ loading: true, error: null });
    try {
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'games', gameId);
        
        // Update game status
        transaction.update(gameRef, {
          status: 'completed',
          endedAt: serverTimestamp(),
          winnerId: result.winner_id
        });

        // Process participants
        result.participants.forEach((participant: any) => {
          const { userId, result: participantResult, score } = participant;
          
          // Update participant record
          const participantRef = doc(db, 'gameParticipants', `${gameId}_${userId}`);
          transaction.set(participantRef, {
            result: participantResult,
            score,
            leftAt: serverTimestamp()
          });

          // Update user balance
          const userRef = doc(db, 'profiles', userId);
          transaction.update(userRef, { balance: score });
        });
      });

      set({ loading: false });
      await get().fetchGameHistory();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  fetchGameHistory: async () => {
    set({ loading: true, error: null });
    try {
      const gamesQuery = query(
        collection(db, 'games'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(gamesQuery);
      const games = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];

      set({ gameHistory: games, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));