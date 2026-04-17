import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_USER } from '../lib/mockData';

interface AuthContextType {
  session: any;
  user: any;
  isInitializing: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isInitializing: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false }),
  signInWithGoogle: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsInitializing(true);
      // Simulate Supabase async session hydration
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // For the sake of strict backend-readiness, we remove localStorage hacks.
      // A real Supabase client would call supabase.auth.getSession() here.
      // We default to logged out to ensure the hydration flow is respected.
      setUser(null);
      setSession(null);
      setIsInitializing(false);
    };
    
    initAuth();
  }, []);

  const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 800));

  const signIn = async (email: string, password: string) => {
    await simulateDelay();
    setUser(MOCK_USER);
    setSession({ access_token: 'mock_token' });
    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    await simulateDelay();
    setUser({ ...MOCK_USER, email, user_metadata: { full_name: name } });
    setSession({ access_token: 'mock_token' });
    return { error: null, needsConfirmation: false };
  };

  const signInWithGoogle = async () => {
    await simulateDelay();
    setUser(MOCK_USER);
    setSession({ access_token: 'mock_token' });
  };

  const signOut = async () => {
    await simulateDelay();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    await simulateDelay();
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    await simulateDelay();
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ session, user, isInitializing, signOut, signIn, signUp, signInWithGoogle, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
