import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize auth state
  const initialize = async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Set initial state
      set({ 
        session,
        user: session?.user ?? null,
        loading: false 
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ 
          session,
          user: session?.user ?? null,
          loading: false
        });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  };

  // Call initialize immediately
  initialize();

  return {
    user: null,
    session: null,
    loading: true,
    initialize,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session });
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session });
    },
    signOut: async () => {
      await supabase.auth.signOut();
      set({ user: null, session: null });
    },
  };
});