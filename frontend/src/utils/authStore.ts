import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuthListener: () => () => void; // Returns the unsubscribe function
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true, // Start loading until the initial session is fetched

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  initializeAuthListener: () => {
    set({ loading: true });
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, loading: false });

      // Set up the real-time auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, loading: false });
        console.log("Auth state changed, session:", session);
      });

      // Return the unsubscribe function
      return () => {
        subscription?.unsubscribe();
      };
    }).catch(error => {
      console.error("Error getting initial session:", error);
      set({ loading: false });
    });

    // Return a dummy unsubscribe function in case getSession fails immediately
    // The real one is returned inside the .then()
    return () => { console.log("Unsubscribed from auth state (initial setup)"); };
  },

  signInWithPassword: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ session: data.session, user: data.user, loading: false });
      console.log("Signed in successfully", data.session);
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      set({ loading: false });
      // Optionally: Propagate the error message to the UI
      throw error; // Re-throw to handle in component
    }
  },

  signUpWithPassword: async (email, password) => {
    set({ loading: true });
    try {
      // Note: Supabase sends a confirmation email by default.
      // You might need to disable this in Supabase settings if you want auto-login
      // or handle the confirmation flow.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // options: {
        //   emailRedirectTo: 'http://localhost:5173/', // Or your production URL
        // }
      });
      if (error) throw error;
      // Session might be null if email confirmation is required
      set({ session: data.session, user: data.user, loading: false });
      console.log("Signed up successfully", data);
      // Alert user to check email if confirmation is needed
      if (data.user && !data.session) {
        alert("Please check your email to confirm your account.");
      }
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      set({ loading: false });
      throw error; // Re-throw to handle in component
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, loading: false }); // Clear session and user
      console.log("Signed out successfully");
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      set({ loading: false });
      throw error; // Re-throw to handle in component
    }
  },
}));

// Initialize the auth listener when the store is loaded
// This immediately tries to get the session and sets up the listener
// useAuthStore.getState().initializeAuthListener(); // Moved initialization to AppProvider
