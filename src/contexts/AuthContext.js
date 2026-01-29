/**
 * AuthContext - Supabase Auth integration
 *
 * Mobile-ready: No window/document usage inside hooks.
 * All auth state managed via Supabase session.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Environment variables (CRA requires REACT_APP_ prefix)
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// TEMP DEBUG: Log what we see (safe booleans only)
console.log('ENV CHECK', {
  hasUrl: !!SUPABASE_URL,
  hasAnon: !!SUPABASE_ANON_KEY,
  urlLength: SUPABASE_URL?.length || 0,
  keyLength: SUPABASE_ANON_KEY?.length || 0
});

// Track if env vars are missing
const ENV_MISSING = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Create Supabase client ONLY if env vars exist
export const supabase = ENV_MISSING
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

// Config error component (shown when env vars missing)
const ConfigError = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)',
    padding: '20px'
  }}>
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '500px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h1 style={{ color: '#1e293b', marginBottom: '8px' }}>Configuration Error</h1>
      <p style={{ color: '#64748b', marginBottom: '16px' }}>
        Supabase environment variables are not configured.
      </p>
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'left',
        fontSize: '14px',
        color: '#991b1b'
      }}>
        <strong>Missing:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>REACT_APP_SUPABASE_URL</li>
          <li>REACT_APP_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
      <p style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>
        Add these in Vercel → Settings → Environment Variables, then redeploy.
      </p>
    </div>
  </div>
);

// Context
const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: new Error('Not initialized') }),
  signIn: async () => ({ error: new Error('Not initialized') }),
  signInWithMagicLink: async () => ({ error: new Error('Not initialized') }),
  signOut: async () => ({ error: new Error('Not initialized') }),
  updateProfile: async () => ({ error: new Error('Not initialized') }),
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Internal provider that uses hooks (only rendered when supabase exists)
const AuthProviderInternal = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || !supabase) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, may be creating...');
          return null;
        }
        throw error;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            if (mounted) fetchProfile(session.user.id);
          }, 500);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up with email/password
  const signUp = useCallback(async (email, password, username) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username?.trim() || email.split('@')[0],
            display_name: username?.trim() || email.split('@')[0],
          },
        },
      });
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  // Sign in with magic link
  const signInWithMagicLink = useCallback(async (email, redirectTo) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setProfile(null);
      }
      return { error };
    } catch (error) {
      return { error };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { data: null, error };
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [user]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Main AuthProvider - shows config error or renders internal provider
export const AuthProvider = ({ children }) => {
  if (ENV_MISSING) {
    return <ConfigError />;
  }
  return <AuthProviderInternal>{children}</AuthProviderInternal>;
};

export default AuthContext;
