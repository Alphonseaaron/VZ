import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const fetchProfile = async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const initialize = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      set({ 
        session,
        user: session?.user ?? null,
        loading: false 
      });

      if (session?.user) {
        await fetchProfile();
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ 
          session,
          user: session?.user ?? null,
          loading: false
        });

        if (session?.user) {
          await fetchProfile();
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  };

  initialize();

  return {
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialize,
    fetchProfile,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session });
      await fetchProfile();
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session });
      if (data.user) {
        await fetchProfile();
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
      set({ user: null, session: null, profile: null });
    },
  };
});