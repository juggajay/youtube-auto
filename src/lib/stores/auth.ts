import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/db/client';

interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  youtube_channel_id: string | null;
  youtube_channel_name: string | null;
  youtube_connected_at: string | null;
  default_voice_id: string;
  default_video_visibility: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),

      initialize: async () => {
        set({ isLoading: true });
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            set({
              user: {
                id: user.id,
                email: user.email || '',
                displayName: user.user_metadata?.full_name,
                avatarUrl: user.user_metadata?.avatar_url,
              },
              isAuthenticated: true,
            });

            // Fetch profile
            await get().refreshProfile();
          } else {
            set({ user: null, profile: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set({ user: null, profile: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, profile: null, isAuthenticated: false });
      },

      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            set({ profile: profile as Profile });
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      },
    }),
    {
      name: 'vidflow-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
