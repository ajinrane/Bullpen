/**
 * AuthModal - Sign in/up UI
 *
 * Supports:
 * - Email + Password
 * - Magic Link (passwordless)
 * - Display name setup for new users
 */

import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ onClose, redirectUrl }) => {
  const { signIn, signUp, signInWithMagicLink, user, profile, updateProfile } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'magic', 'setup-name'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If user is logged in but has no display name, show setup
  const needsNameSetup = user && profile && !profile.display_name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'setup-name' || needsNameSetup) {
        // Update display name
        if (!username.trim()) {
          setError('Please enter a display name');
          setLoading(false);
          return;
        }

        const { error } = await updateProfile({
          display_name: username.trim(),
          username: username.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
        });

        if (error) {
          setError(error.message);
        } else {
          onClose?.();
        }
      } else if (mode === 'magic') {
        // Magic link - always redirect to main page (no watchlist param)
        const magicLinkRedirect = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
        const { error } = await signInWithMagicLink(email, magicLinkRedirect);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email for a magic link!');
        }
      } else if (mode === 'signup') {
        // Sign up
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, username);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email to confirm your account!');
        }
      } else {
        // Sign in
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose?.();
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Render name setup for authenticated users without display name
  if (needsNameSetup) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">🐂</span>
            <h2 className="text-2xl font-bold text-slate-800">One more step!</h2>
            <p className="text-slate-500 text-sm mt-1">
              Choose a display name for the leaderboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name on the leaderboard"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)' }}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">🐂</span>
          <h2 className="text-2xl font-bold text-slate-800">
            {mode === 'magic' ? 'Magic Link' : mode === 'signup' ? 'Join Bullpen' : 'Welcome Back!'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'magic'
              ? 'Get a sign-in link sent to your email'
              : mode === 'signup'
              ? 'Create an account to track stocks with friends'
              : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-100 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="email"
                required
                autoFocus={mode !== 'signup'}
              />
            </div>
          </div>

          {mode !== 'magic' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password (6+ chars)' : 'Your password'}
                  className="w-full pl-10 pr-12 py-3 bg-slate-100 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)' }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'magic'
              ? 'Send Magic Link'
              : mode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {mode !== 'magic' && (
            <button
              onClick={() => {
                setMode('magic');
                setError('');
                setSuccess('');
              }}
              className="w-full py-2 text-slate-500 hover:text-blue-500 text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Sign in with magic link instead
            </button>
          )}

          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setSuccess('');
            }}
            className="w-full py-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            {mode === 'signin' || mode === 'magic'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
