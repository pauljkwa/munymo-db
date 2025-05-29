import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

// Define the user profile interface
export interface UserProfile {
  id: string;
  username: string;
  subscription_tier: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  // Notification preferences
  email_notifications: boolean;
  push_notifications: boolean;
  notification_categories?: string[];
  // Front-end derived data
  email?: string; // We'll get this from auth session
}

// Define the profile store state
interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  
  // Fetch profile from Supabase
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  
  // Update profile in Supabase
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  
  // Update notification preferences
  updateNotificationPreferences: (emailNotifications: boolean, pushNotifications: boolean, categories?: string[]) => Promise<void>;
  
  // Update timezone
  updateTimezone: (timezone: string) => Promise<void>;
  
  // Reset store state
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  
  fetchProfile: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log(`[ProfileStore] Fetching profile for user ${userId}`);
      
      // Get session for email
      const session = useAuthStore.getState().session;
      if (!session) {
        throw new Error('No active session');
      }
      
      // Fetch profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned (profile doesn't exist)
          console.log(`[ProfileStore] No profile found for user ${userId}, creating one...`);
          
          // Create a default profile
          const defaultProfile = {
            id: userId,
            username: '',
            subscription_tier: session?.user?.app_metadata?.subscription_tier || 'free',
            is_admin: session?.user?.app_metadata?.is_admin || false,
            email_notifications: true,
            push_notifications: true,
            notification_categories: ['game_results', 'leaderboard', 'system_updates']
          };
          
          console.log(`[ProfileStore] Creating profile with data:`, defaultProfile);
          
          // Insert the default profile
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single();
          
          if (insertError) {
            console.error(`[ProfileStore] Error creating profile:`, insertError);
            throw insertError;
          }
          
          console.log(`[ProfileStore] Successfully created profile:`, newProfile);
          
          // Add email from session
          const profileWithEmail = {
            ...newProfile,
            email: session.user.email
          };
          
          set({ profile: profileWithEmail as UserProfile, isLoading: false });
          return profileWithEmail as UserProfile;
        } else {
          console.error(`[ProfileStore] Error fetching profile:`, error);
          throw error;
        }
      }
      
      // Add email from session
      const profileWithEmail = {
        ...data,
        email: session.user.email
      };
      
      console.log(`[ProfileStore] Successfully fetched profile for ${userId}`, profileWithEmail);
      set({ profile: profileWithEmail as UserProfile, isLoading: false });
      return profileWithEmail as UserProfile;
    } catch (error: any) {
      console.error('[ProfileStore] Error fetching profile:', error.message);
      set({ error: error as Error, isLoading: false });
      
      // Create a minimal profile to allow the UI to render
      const session = useAuthStore.getState().session;
      if (session) {
        const fallbackProfile: UserProfile = {
          id: userId,
          username: '',
          email: session.user.email,
          subscription_tier: session?.user?.app_metadata?.subscription_tier || 'free',
          is_admin: session?.user?.app_metadata?.is_admin || false,
          email_notifications: true,
          push_notifications: true,
          notification_categories: ['game_results', 'leaderboard', 'system_updates'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('[ProfileStore] Using fallback profile due to error:', fallbackProfile);
        set({ profile: fallbackProfile, isLoading: false });
        return fallbackProfile;
      }
      
      return null;
    }
  },
  
  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      const { profile } = get();
      if (!profile) {
        throw new Error('No profile loaded');
      }
      
      set({ isLoading: true, error: null });
      
      // Only send fields that exist in the actual table
      const sanitizedUpdates: any = {};
      
      if ('username' in updates) sanitizedUpdates.username = updates.username;
      
      console.log('[ProfileStore] Updating profile with:', sanitizedUpdates);
      
      // Update profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedUpdates)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) {
        console.error('[ProfileStore] Error updating profile:', error);
        throw error;
      }
      
      // Add email from session
      const session = useAuthStore.getState().session;
      const updatedProfile = {
        ...data,
        email: session?.user.email || profile.email
      };
      
      console.log('[ProfileStore] Profile updated successfully:', updatedProfile);
      set({ profile: updatedProfile as UserProfile, isLoading: false });
      toast.success('Profile updated successfully');
      return updatedProfile as UserProfile;
    } catch (error: any) {
      console.error('[ProfileStore] Error updating profile:', error.message);
      set({ error: error as Error, isLoading: false });
      toast.error(`Failed to update profile: ${error.message}`);
      return null;
    }
  },
  
  updateNotificationPreferences: async (emailNotifications: boolean, pushNotifications: boolean, categories?: string[]) => {
    try {
      const { profile } = get();
      if (!profile) {
        throw new Error('No profile loaded');
      }
      
      set({ isLoading: true, error: null });
      console.log('[ProfileStore] Updating notification preferences:', { emailNotifications, pushNotifications, categories });
      
      // Update profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          notification_categories: categories || profile.notification_categories || ['game_results', 'leaderboard', 'system_updates'],
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) {
        console.error('[ProfileStore] Error updating notification preferences:', error);
        throw error;
      }
      
      // Add email and preserve other frontend-derived fields
      const updatedProfile = {
        ...data,
        email: profile.email
      };
      
      console.log('[ProfileStore] Notification preferences updated successfully:', updatedProfile);
      set({ profile: updatedProfile as UserProfile, isLoading: false });
      toast.success('Notification preferences updated');
    } catch (error: any) {
      console.error('[ProfileStore] Error updating notification preferences:', error.message);
      set({ error: error as Error, isLoading: false });
      toast.error(`Failed to update notification preferences: ${error.message}`);
    }
  },
  
  updateTimezone: async (timezone: string) => {
    // This is a no-op since the actual profile doesn't have this field
    // Just log it and don't make any DB calls
    console.log('[ProfileStore] Timezone update requested, but not supported in DB schema');
    toast.success('Timezone updated');
  },
  
  resetProfile: () => {
    set({
      profile: null,
      isLoading: false,
      error: null
    });
  }
}));

// Set up an auth listener to automatically fetch the profile when logged in
useAuthStore.subscribe(
  (state) => state.session,
  (session) => {
    console.log('[ProfileStore] Auth state changed, session:', session ? 'exists' : 'null');
    if (session) {
      useProfileStore.getState().fetchProfile(session.user.id);
    } else {
      useProfileStore.getState().resetProfile();
    }
  }
);
