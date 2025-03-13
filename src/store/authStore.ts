import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';

interface AuthState {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Set up auth state listener
  onAuthStateChanged(auth, (user) => {
    set({ user, loading: false });
  });

  return {
    user: null,
    loading: true,
    signIn: async (email, password) => {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      set({ user });
    },
    signUp: async (email, password) => {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      set({ user });
    },
    signOut: async () => {
      await firebaseSignOut(auth);
      set({ user: null });
    },
  };
});