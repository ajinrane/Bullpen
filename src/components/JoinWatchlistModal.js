import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../contexts/AuthContext';

const JoinWatchlistModal = ({ watchlist, user, profile, onJoin, onCancel }) => {
  const [displayName, setDisplayName] = useState(profile?.display_name || profile?.username || user?.email?.split('@')[0] || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter a display name'); return; }
    setLoading(true); setError('');
    try {
      const { error: joinError } = await supabase.from('watchlist_members').insert([{ watchlist_id: watchlist.id, user_id: user.id, display_name: displayName.trim() }]);
      if (joinError) setError(joinError.message);
      else onJoin({ watchlist_id: watchlist.id, user_id: user.id, display_name: displayName.trim() });
    } catch (err) { setError(err.message || 'Failed to join watchlist'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">{'\u{1F402}'}</span>
          <h2 className="text-2xl font-bold text-slate-800">Join {watchlist?.name || 'Watchlist'}</h2>
          <p className="text-slate-500 text-sm mt-1">Choose a display name for this watchlist's leaderboard</p>
        </div>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name on this leaderboard"
              className="w-full px-4 py-3 bg-slate-100 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>
          {error && (<div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>)}
          <button type="submit" disabled={loading || !displayName.trim()}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)' }}>
            {loading ? 'Joining...' : 'Join Watchlist'}
          </button>
          {onCancel && (<button type="button" onClick={onCancel} className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm">Cancel</button>)}
        </form>
      </div>
    </div>
  );
};

export default JoinWatchlistModal;
