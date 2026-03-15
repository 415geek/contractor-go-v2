import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { sendOtp as sendOtpRequest, verifyOtp as verifyOtpRequest } from "@/lib/api/auth";
import { supabase } from "@/lib/supabase";

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
};

let authSubscriptionInitialized = false;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  initialized: false,
  initialize: async () => {
    if (get().initialized) {
      return;
    }

    set({ isLoading: true });

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      set({ isLoading: false, initialized: true });
      throw error;
    }

    set({
      session: data.session,
      user: data.session?.user ?? null,
      isLoading: false,
      initialized: true,
    });

    if (!authSubscriptionInitialized) {
      authSubscriptionInitialized = true;

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isLoading: false,
          initialized: true,
        });
      });
    }
  },
  signIn: async (phone, code) => {
    await get().verifyOtp(phone, code);
  },
  signOut: async () => {
    set({ isLoading: true });

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    set({
      user: null,
      session: null,
      isLoading: false,
    });
  },
  sendOtp: async (phone) => {
    set({ isLoading: true });

    try {
      await sendOtpRequest(phone);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  verifyOtp: async (phone, code) => {
    set({ isLoading: true });

    try {
      const response = await verifyOtpRequest(phone, code);

      set({
        session: response.session,
        user: response.user,
        isLoading: false,
        initialized: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
