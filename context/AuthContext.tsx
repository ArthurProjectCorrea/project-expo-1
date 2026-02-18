import React, { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: any;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  sendOtp: (email: string) => Promise<any>;
  verifyOtp: (email: string, token: string, type?: 'signup' | 'recovery') => Promise<any>;
  sendPasswordResetOtp: (email: string) => Promise<any>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  }

  async function signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function sendOtp(email: string) {
    return await supabase.auth.signInWithOtp({ email });
  }

  async function verifyOtp(email: string, token: string, type: 'signup' | 'recovery' = 'signup') {
    // unified wrapper: use `type` to distinguish signup vs recovery verification
    return await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
  }

  async function sendPasswordResetOtp(email: string) {
    // Use Supabase password-recovery API — Supabase will send the recovery email.
    // If "Email OTP" is enabled in the dashboard the user will receive an OTP code;
    // otherwise the provider may send a recovery link.
    return await supabase.auth.resetPasswordForEmail(email);
  }

  async function verifyPasswordResetOtp(email: string, token: string) {
    // backward-compatible wrapper that delegates to verifyOtp
    return await verifyOtp(email, token, 'recovery');
  }

  async function updatePassword(password: string) {
    return await supabase.auth.updateUser({
      password,
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        sendOtp,
        verifyOtp,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        updatePassword,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// NOTE: `src/` copies were deprecated — keep `context/` and `lib/` at project root as the source of truth.
