import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, X, RefreshCw, Star, AlertCircle, Users, Share2, Filter, LayoutGrid, List, Activity, Home } from 'lucide-react';

// Auth & utilities
import { useAuth, supabase } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import storage, { PREF_KEYS } from './utils/storage';
import watchlistUtils from './utils/watchlist';

// Lib
import { fetchStockQuote, fetchHistoricalData, calculatePerformance } from './lib/finnhub';

// Components
import { UserAvatar } from './components/ui';
import StockCard from './components/StockCard';
import CompactStockCard from './components/CompactStockCard';
import ComparisonChart from './components/ComparisonChart';
import PortfolioSummary from './components/PortfolioSummary';
import SocialFeed from './components/SocialFeed';
import ShareModal from './components/ShareModal';
import JoinWatchlistModal from './components/JoinWatchlistModal';
import HelpModal from './components/HelpModal';
import UserDropdown from './components/UserDropdown';
import PenSelector from './components/PenSelector';
import PenHeader from './components/PenHeader';
import PenActivityFeed from './components/PenActivityFeed';

// ============================================
// MAIN DASHBOARD
// ============================================

const StockDashboard = () => {
  // Auth context
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Watchlist slug
  const [watchlistSlug] = useState(() => {
    const urlSearch = typeof window !== 'undefined' ? window.location.search : '';
    const urlHash = typeof window !== 'undefined' ? window.location.hash : '';
    return watchlistUtils.parse({ urlSearch, urlHash });
  });

  // Watchlist and membership state
  const [watchlist, setWatchlist] = useState(null);
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Update browser URL with slug
  useEffect(() => {
    watchlistUtils.updateUrl(watchlistSlug);
  }, [watchlistSlug]);

  // Fetch watchlist and membership when user is authenticated
  useEffect(() => {
    if (!user) { setMembershipLoading(false); return; }

    const fetchMembership = async () => {
      setMembershipLoading(true);
      try {
        let { data: watchlistData, error: watchlistError } = await supabase
          .from('watchlists').select('id, code, name, created_by').eq('code', watchlistSlug).single();

        if ((watchlistError || !watchlistData) && watchlistSlug === 'bullpen') {
          const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User';
          const { data: newWatchlist, error: createError } = await supabase
            .from('watchlists').insert([{ code: 'bullpen', name: 'Bullpen', created_by: user.id }]).select().single();

          if (createError) {
            const { data: retryData } = await supabase
              .from('watchlists').select('id, code, name, created_by').eq('code', 'bullpen').single();
            watchlistData = retryData;
          } else {
            watchlistData = newWatchlist;
            await supabase.from('watchlist_members').insert([{ watchlist_id: newWatchlist.id, user_id: user.id, display_name: displayName }]);
          }
        }

        if (!watchlistData) { setWatchlist(null); setMembership(null); setMembershipLoading(false); return; }
        setWatchlist(watchlistData);

        const { data: memberData, error: memberError } = await supabase
          .from('watchlist_members').select('id, watchlist_id, user_id, display_name, created_at')
          .eq('watchlist_id', watchlistData.id).eq('user_id', user.id).single();

        if (memberError || !memberData) { setMembership(null); setShowJoinModal(true); }
        else { setMembership(memberData); }
      } catch (err) { console.error('Error fetching membership:', err); }
      finally { setMembershipLoading(false); }
    };

    fetchMembership();
  }, [user, watchlistSlug, profile]);

  // Current user display name
  const currentUser = membership?.display_name || profile?.display_name || profile?.username || user?.email?.split('@')[0] || '';

  // UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [theme, setTheme] = useState(() => storage.get(PREF_KEYS.THEME, 'light'));
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [viewMode, setViewMode] = useState(() => storage.get(PREF_KEYS.VIEW_MODE, 'grid'));

  // Stock data state
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT', 'GOOGL']);
  const [stockData, setStockData] = useState({});
  const [stockMeta, setStockMeta] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSymbols, setLoadingSymbols] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Filter state
  const [sortBy, setSortBy] = useState(() => storage.get(PREF_KEYS.SORT_BY, 'symbol'));
  const [filterSector, setFilterSector] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  // Social data
  const [notes, setNotes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stances, setStances] = useState([]);
  const [votes, setVotes] = useState([]);
  const [members, setMembers] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [showFeed, setShowFeed] = useState(false);

  // Pen state
  const [activePen, setActivePen] = useState(null);
  const [activePenCode, setActivePenCode] = useState(null);
  const [penPositions, setPenPositions] = useState([]);
  const [penNotes, setPenNotes] = useState([]);
  const [penStances, setPenStances] = useState([]);
  const [penActivity, setPenActivity] = useState([]);
  const [penSymbols, setPenSymbols] = useState([]);

  // Member lookup
  const memberMap = useMemo(() => {
    const map = {};
    members.forEach(m => { map[m.user_id] = m.display_name; });
    return map;
  }, [members]);

  const memberMapRef = useRef(memberMap);
  useEffect(() => { memberMapRef.current = memberMap; }, [memberMap]);

  const allUsers = useMemo(() => members.map(m => m.display_name).filter(Boolean), [members]);

  const sectors = useMemo(() => {
    const sectorSet = new Set();
    Object.values(stockData).forEach(s => { if (s.sector) sectorSet.add(s.sector); });
    return ['all', ...Array.from(sectorSet).sort()];
  }, [stockData]);

  // Theme
  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    storage.set(PREF_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const handleSignOut = async () => { await signOut(); };

  // ---- Load Supabase data ----
  useEffect(() => {
    if (!membership || !watchlist?.id) return;

    const watchlistId = watchlist.id;

    const loadData = async () => {
      try {
        const [membersRes, notesRes, positionsRes, stancesRes, stocksRes, votesRes] = await Promise.all([
          supabase.from('watchlist_members').select('user_id, display_name, created_at').eq('watchlist_id', watchlistId),
          supabase.from('notes').select('*').eq('watchlist_id', watchlistId).order('created_at', { ascending: false }),
          supabase.from('positions').select('*').eq('watchlist_id', watchlistId),
          supabase.from('stances').select('*').eq('watchlist_id', watchlistId),
          supabase.from('watchlist_stocks').select('*').eq('watchlist_id', watchlistId),
          supabase.from('votes').select('*').eq('watchlist_id', watchlistId).catch(() => ({ data: [] })),
        ]);

        const memberLookup = {};
        if (membersRes.data) { membersRes.data.forEach(m => { memberLookup[m.user_id] = m.display_name; }); setMembers(membersRes.data); }
        if (notesRes.data) setNotes(notesRes.data);
        if (positionsRes.data) setPositions(positionsRes.data);
        if (stancesRes.data) setStances(stancesRes.data);
        if (votesRes?.data) setVotes(votesRes.data);
        if (stocksRes.data) {
          const syms = stocksRes.data.map(s => s.symbol);
          setSymbols(syms);
          const meta = {};
          stocksRes.data.forEach(s => { meta[s.symbol] = { added_by: s.added_by, added_at: s.added_at }; });
          setStockMeta(meta);
        }

        // Build initial feed
        const initialFeed = [];
        (notesRes.data || []).forEach(n => {
          initialFeed.push({ id: `note-${n.id}`, type: 'note', user_id: n.user_id, username: memberLookup[n.user_id] || 'Unknown',
            symbol: n.symbol, description: `"${(n.content || '').length > 60 ? n.content.slice(0, 60) + '...' : n.content}"`, created_at: n.created_at });
        });
        (stancesRes.data || []).forEach(s => {
          initialFeed.push({ id: `stance-${s.id}`, type: 'stance', user_id: s.user_id, username: memberLookup[s.user_id] || 'Unknown',
            symbol: s.symbol, description: `Set stance to ${s.stance === 'bullish' ? 'Bullish' : s.stance === 'bearish' ? 'Bearish' : 'Neutral'}`, created_at: s.updated_at });
        });
        initialFeed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setFeedItems(initialFeed.slice(0, 50));
        setIsConnected(true);
      } catch (err) { console.error('Error loading data:', err); }
    };

    loadData();

    // Feed helper
    const addFeedItem = (type, payload, lookup = {}) => {
      const item = payload.new;
      let feedItem = null;
      switch (type) {
        case 'note':
          feedItem = { id: `note-${item.id}`, type: 'note', user_id: item.user_id, username: lookup[item.user_id] || 'Unknown',
            symbol: item.symbol, description: `"${(item.content || '').length > 60 ? item.content.slice(0, 60) + '...' : item.content}"`, created_at: item.created_at }; break;
        case 'stance':
          feedItem = { id: `stance-${item.id}`, type: 'stance', user_id: item.user_id, username: lookup[item.user_id] || 'Unknown',
            symbol: item.symbol, description: `Set stance to ${item.stance === 'bullish' ? 'Bullish' : item.stance === 'bearish' ? 'Bearish' : 'Neutral'}`, created_at: item.updated_at }; break;
        case 'stock':
          feedItem = { id: `stock-${item.id}`, type: 'stock_added', user_id: item.added_by, username: lookup[item.added_by] || 'Unknown',
            symbol: item.symbol, description: `Added ${item.symbol} to the watchlist`, created_at: item.added_at }; break;
        default: return;
      }
      if (feedItem) setFeedItems(prev => [feedItem, ...prev].slice(0, 50));
    };

    // Real-time subscriptions
    const channel = supabase.channel(`watchlist-${watchlistId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `watchlist_id=eq.${watchlistId}` }, (payload) => {
        if (payload.eventType === 'INSERT') { setNotes(prev => [payload.new, ...prev]); addFeedItem('note', payload, memberMapRef.current); }
        else if (payload.eventType === 'DELETE') setNotes(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions', filter: `watchlist_id=eq.${watchlistId}` }, (payload) => {
        if (payload.eventType === 'INSERT') setPositions(prev => [...prev, payload.new]);
        else if (payload.eventType === 'DELETE') setPositions(prev => prev.filter(p => p.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setPositions(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stances', filter: `watchlist_id=eq.${watchlistId}` }, (payload) => {
        if (payload.eventType === 'INSERT') { setStances(prev => [...prev, payload.new]); addFeedItem('stance', payload, memberMapRef.current); }
        else if (payload.eventType === 'DELETE') setStances(prev => prev.filter(s => s.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') { setStances(prev => prev.map(s => s.id === payload.new.id ? payload.new : s)); addFeedItem('stance', payload, memberMapRef.current); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist_stocks', filter: `watchlist_id=eq.${watchlistId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSymbols(prev => [...prev, payload.new.symbol]);
          setStockMeta(prev => ({ ...prev, [payload.new.symbol]: { added_by: payload.new.added_by, added_at: payload.new.added_at } }));
          addFeedItem('stock', payload, memberMapRef.current);
        } else if (payload.eventType === 'DELETE') {
          setSymbols(prev => prev.filter(s => s !== payload.old.symbol));
          setStockMeta(prev => { const next = { ...prev }; delete next[payload.old.symbol]; return next; });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist_members', filter: `watchlist_id=eq.${watchlistId}` }, (payload) => {
        if (payload.eventType === 'INSERT') setMembers(prev => [...prev, payload.new]);
        else if (payload.eventType === 'DELETE') setMembers(prev => prev.filter(m => m.user_id !== payload.old.user_id));
        else if (payload.eventType === 'UPDATE') setMembers(prev => prev.map(m => m.user_id === payload.new.user_id ? payload.new : m));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `watchlist_id=eq.${watchlistId}` }, (payload) => {
        if (payload.eventType === 'INSERT') setVotes(prev => [...prev, payload.new]);
        else if (payload.eventType === 'DELETE') setVotes(prev => prev.filter(v => v.id !== payload.old.id));
        else if (payload.eventType === 'UPDATE') setVotes(prev => prev.map(v => v.id === payload.new.id ? payload.new : v));
      })
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [membership, watchlist]);

  // ---- Supabase handlers ----
  const handleAddNote = async (symbol, content) => {
    if (!watchlist?.id || !user?.id) return;
    await supabase.from('notes').insert([{ watchlist_id: watchlist.id, symbol, content, user_id: user.id }]);
  };

  const handleDeleteNote = async (noteId) => {
    await supabase.from('notes').delete().eq('id', noteId);
  };

  const handleAddPosition = async (symbol, avgCost, shares) => {
    if (!watchlist?.id || !user?.id) return;
    await supabase.from('positions').insert([{ watchlist_id: watchlist.id, symbol, avg_cost: avgCost, shares, user_id: user.id }]);
  };

  const handleRemovePosition = async (positionId) => {
    await supabase.from('positions').delete().eq('id', positionId);
  };

  const handleSetStance = async (symbol, stance) => {
    if (!watchlist?.id || !user?.id) return;
    const existing = stances.find(s => s.symbol === symbol && s.user_id === user.id);
    if (existing) {
      if (stance && stance !== 'neutral') await supabase.from('stances').update({ stance, updated_at: new Date().toISOString() }).eq('id', existing.id);
      else await supabase.from('stances').delete().eq('id', existing.id);
    } else if (stance && stance !== 'neutral') {
      await supabase.from('stances').insert([{ watchlist_id: watchlist.id, symbol, stance, user_id: user.id }]);
    }
  };

  const handleVote = async (symbol, vote) => {
    if (!watchlist?.id || !user?.id) return;
    const existing = votes.find(v => v.symbol === symbol && v.user_id === user.id);
    if (existing) {
      if (existing.vote === vote) await supabase.from('votes').delete().eq('id', existing.id);
      else await supabase.from('votes').update({ vote, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('votes').insert([{ watchlist_id: watchlist.id, symbol, vote, user_id: user.id }]);
    }
  };

  // ---- Stock data fetching (uses cached finnhub) ----
  const fetchStockDataFn = useCallback(async (symbol) => {
    try {
      const quote = await fetchStockQuote(symbol);
      if (!quote) return null;
      const history = await fetchHistoricalData(symbol, quote.price);
      return { ...quote, historicalData: history, performance: calculatePerformance(history, quote.price) };
    } catch (err) { console.error(`Error fetching ${symbol}:`, err); return null; }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = [];
      for (const symbol of symbols) {
        const result = await fetchStockDataFn(symbol);
        results.push({ symbol, data: result });
        await new Promise(r => setTimeout(r, 100));
      }
      const newData = {};
      results.forEach(({ symbol, data }) => { if (data) newData[symbol] = data; });
      setStockData(newData);
      setLastUpdate(new Date());
    } catch (err) { setError('Failed to fetch stock data'); console.error(err); }
    finally { setLoading(false); }
  }, [symbols, fetchStockDataFn]);

  useEffect(() => {
    if (membership && watchlist) fetchAllData();
  }, [membership, watchlist, fetchAllData]);

  const addStock = async () => {
    if (!watchlist?.id || !user?.id) return;
    const symbol = newSymbol.toUpperCase().trim();
    if (!symbol || symbols.includes(symbol) || symbol.length > 5) return;
    setNewSymbol('');
    setLoadingSymbols(prev => new Set([...prev, symbol]));
    try {
      await supabase.from('watchlist_stocks').insert([{ watchlist_id: watchlist.id, symbol, added_by: user.id }]);
    } catch (e) {
      setLoadingSymbols(prev => { const next = new Set(prev); next.delete(symbol); return next; });
      return;
    }
    setSymbols(prev => [...prev, symbol]);
    setStockMeta(prev => ({ ...prev, [symbol]: { added_by: user.id, added_at: new Date().toISOString() } }));
    const data = await fetchStockDataFn(symbol);
    if (data) setStockData(prev => ({ ...prev, [symbol]: data }));
    setLoadingSymbols(prev => { const next = new Set(prev); next.delete(symbol); return next; });
  };

  const removeStock = (symbol) => {
    setSymbols(prev => prev.filter(s => s !== symbol));
    setStockData(prev => { const next = { ...prev }; delete next[symbol]; return next; });
    setExpandedCards(prev => { const next = new Set(prev); next.delete(symbol); return next; });
  };

  const toggleExpand = (symbol) => {
    setExpandedCards(prev => { const next = new Set(prev); if (next.has(symbol)) next.delete(symbol); else next.add(symbol); return next; });
  };

  const toggleComparisonMode = () => { setComparisonMode(prev => !prev); if (comparisonMode) setSelectedForComparison([]); };

  const toggleStockComparison = (symbol) => {
    setSelectedForComparison(prev => {
      if (prev.includes(symbol)) return prev.filter(s => s !== symbol);
      if (prev.length >= 5) return prev;
      return [...prev, symbol];
    });
  };

  // Filter and sort
  const filteredAndSortedStocks = useMemo(() => {
    let stocks = symbols.map(s => stockData[s]).filter(Boolean);
    if (filterSector !== 'all') stocks = stocks.filter(s => s.sector === filterSector);
    switch (sortBy) {
      case 'holders': stocks.sort((a, b) => positions.filter(p => p.symbol === b.symbol).length - positions.filter(p => p.symbol === a.symbol).length); break;
      case 'change': stocks.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)); break;
      case 'sector': stocks.sort((a, b) => (a.sector || 'ZZZ').localeCompare(b.sector || 'ZZZ')); break;
      default: stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
    return stocks;
  }, [symbols, stockData, filterSector, sortBy, positions]);

  const summary = useMemo(() => {
    const stocks = Object.values(stockData);
    if (stocks.length === 0) return null;
    const avgYTD = stocks.reduce((a, b) => a + (b.performance?.['YTD'] || 0), 0) / stocks.length;
    const avgChange = stocks.reduce((a, b) => a + (b.changePercent || 0), 0) / stocks.length;
    return { avgYTD, avgChange, total: stocks.length };
  }, [stockData]);

  const canDeleteStock = (symbol) => {
    const meta = stockMeta[symbol];
    return meta?.added_by === user?.id || !meta?.added_by;
  };

  // ---- Render gates ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)' }}>
        <div className="text-center"><span className="text-5xl mb-4 block">🐂</span><p className="text-slate-500">Loading...</p></div>
      </div>
    );
  }

  if (!user) return <AuthModal onClose={() => {}} />;

  if (membershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)' }}>
        <div className="text-center"><span className="text-5xl mb-4 block">🐂</span><p className="text-slate-500">Checking membership...</p></div>
      </div>
    );
  }

  if (!membership && watchlist) {
    return (
      <JoinWatchlistModal watchlist={watchlist} user={user} profile={profile}
        onJoin={(newMembership) => { setMembership(newMembership); setShowJoinModal(false); }}
        onCancel={() => handleSignOut()} />
    );
  }

  if (!watchlist) {
    const handleCreateWatchlist = async () => {
      if (!user || !supabase) return;
      const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User';
      const code = watchlistSlug === 'bullpen' ? 'bullpen' : watchlistUtils.generateCode().toLowerCase();
      const name = watchlistSlug === 'bullpen' ? 'Bullpen' : watchlistSlug;
      try {
        const { data: newWatchlist, error: createError } = await supabase.from('watchlists').insert([{ code, name, created_by: user.id }]).select().single();
        if (createError) { alert('Failed to create watchlist: ' + createError.message); return; }
        await supabase.from('watchlist_members').insert([{ watchlist_id: newWatchlist.id, user_id: user.id, display_name: displayName }]);
        window.location.reload();
      } catch (err) { alert('Error: ' + err.message); }
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <span className="text-5xl mb-4 block">🐂</span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{watchlistSlug === 'bullpen' ? 'Welcome to Bullpen!' : 'Watchlist Not Found'}</h2>
          <p className="text-slate-500 mb-4">{watchlistSlug === 'bullpen' ? 'Create the main Bullpen watchlist to get started.' : `The watchlist "${watchlistSlug}" doesn't exist.`}</p>
          <button onClick={handleCreateWatchlist} className="px-6 py-3 text-white font-semibold rounded-xl w-full mb-3"
            style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)' }}>
            {watchlistSlug === 'bullpen' ? 'Create Bullpen' : 'Create This Watchlist'}
          </button>
          {watchlistSlug !== 'bullpen' && (
            <button onClick={() => window.location.href = '/'} className="px-6 py-3 text-slate-600 font-semibold rounded-xl w-full border border-slate-200 hover:bg-slate-50">Go to Home</button>
          )}
        </div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: theme === 'dark' ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 50%, #F5F5F7 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl md:text-4xl">🐂</span>
              <h1 className={`text-3xl md:text-4xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`} style={{ letterSpacing: '-0.02em' }}>Bullpen</h1>
              <span className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${isConnected ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} style={{ boxShadow: isConnected ? '0 0 8px rgba(52,199,89,0.5)' : 'none' }}></span>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Track stocks. Compete with friends.</p>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowHelpModal(true)}
              className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800'}`}
              style={{ background: theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)' }}
              title="Help & Info">
              <AlertCircle className="w-5 h-5" />
            </button>
            <UserDropdown currentUser={currentUser} theme={theme} onSignOut={handleSignOut} toggleTheme={toggleTheme} />
            <button onClick={() => setShowFeed(!showFeed)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${showFeed ? 'text-white shadow-lg' : theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-blue-500'}`}
              style={showFeed ? { background: 'linear-gradient(180deg, #AF52DE 0%, #9B47C5 100%)', boxShadow: '0 4px 15px rgba(175,82,222,0.3)' } : { background: theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <Activity className="w-4 h-4" /> Feed
              {feedItems.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${showFeed ? 'bg-white/20 text-white' : 'bg-purple-500 text-white'}`}>{feedItems.length}</span>
              )}
            </button>
            <button onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-5 py-2 text-white rounded-xl font-medium transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)', boxShadow: '0 4px 15px rgba(0,122,255,0.3)' }}>
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Social Feed */}
        {showFeed && <SocialFeed feedItems={feedItems} currentUser={currentUser} theme={theme} onClose={() => setShowFeed(false)} />}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'leaderboard', label: 'Leaderboard', icon: Users, gradient: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)', shadow: '0 4px 15px rgba(0,122,255,0.3)' },
            { id: 'watchlist', label: 'Stock Screener', icon: Star, gradient: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)', shadow: '0 4px 15px rgba(0,122,255,0.3)' },
            { id: 'pens', label: 'Pens', icon: Home, gradient: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)', shadow: '0 4px 15px rgba(52,199,89,0.3)' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${activeTab === tab.id ? 'text-white shadow-lg' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-800'}`}
              style={activeTab === tab.id ? { background: tab.gradient, boxShadow: tab.shadow } : { background: theme === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <tab.icon className="w-4 h-4 inline mr-2" />{tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" /><span className="text-red-200">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <PortfolioSummary positions={positions} stockData={stockData} currentUser={currentUser}
            allUsers={allUsers} onAddPositionCTA={() => setActiveTab('watchlist')} theme={theme} />
        )}

        {/* WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <>
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Stocks', value: summary.total, color: theme === 'dark' ? 'text-white' : 'text-slate-800' },
                  { label: 'Today', value: `${summary.avgChange >= 0 ? '+' : ''}${summary.avgChange.toFixed(2)}%`, color: summary.avgChange >= 0 ? 'text-green-400' : 'text-red-400' },
                  { label: 'YTD', value: `${summary.avgYTD >= 0 ? '+' : ''}${summary.avgYTD.toFixed(2)}%`, color: summary.avgYTD >= 0 ? 'text-green-400' : 'text-red-400' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl p-5" style={{ background: theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                    <div className={`text-3xl font-semibold ${stat.color}`} style={{ letterSpacing: '-0.02em' }}>{stat.value}</div>
                  </div>
                ))}
                <div className="rounded-2xl p-5" style={{ background: theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                  <div className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Users</div>
                  <div className={`text-3xl font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`} style={{ letterSpacing: '-0.02em' }}>
                    {allUsers.length}
                    <div className="flex -space-x-1">{allUsers.slice(0, 3).map(u => <UserAvatar key={u} username={u} size="sm" />)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex gap-2 flex-1">
                  <input type="text" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && addStock()}
                    placeholder="Add ticker (e.g., AAPL)"
                    className="flex-1 px-4 py-3 text-slate-800 rounded-xl focus:outline-none transition-all"
                    style={{ background: 'rgba(60,60,67,0.12)', border: '1px solid transparent' }}
                    onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#007AFF'; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.15)'; }}
                    onBlur={(e) => { e.target.style.background = 'rgba(60,60,67,0.12)'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
                    maxLength={5} />
                  <button onClick={addStock} disabled={!newSymbol.trim()}
                    className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)', boxShadow: '0 4px 12px rgba(52,199,89,0.3)' }}>
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex rounded-xl p-1" style={{ background: 'rgba(60,60,67,0.12)' }}>
                    <button onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${viewMode === 'grid' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('compact')}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${viewMode === 'compact' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'text-white' : 'text-slate-600 hover:text-blue-500'}`}
                    style={showFilters ? { background: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)' } : { background: 'rgba(60,60,67,0.12)' }}>
                    <Filter className="w-4 h-4" />
                  </button>
                  <button onClick={fetchAllData} disabled={loading}
                    className="px-5 py-2 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)' }}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
              </div>
              {showFilters && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm font-medium">Sort:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 text-slate-800 text-sm rounded-lg focus:outline-none" style={{ background: 'rgba(60,60,67,0.12)' }}>
                      <option value="symbol">Symbol</option>
                      <option value="holders">Most Holders</option>
                      <option value="change">Day Change</option>
                      <option value="sector">Sector</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Sector:</span>
                    <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)}
                      className="px-3 py-1 bg-slate-700 text-white text-sm rounded-lg focus:outline-none">
                      {sectors.map(s => (<option key={s} value={s}>{s === 'all' ? 'All Sectors' : s}</option>))}
                    </select>
                  </div>
                  <div className="text-slate-500 text-sm flex items-center">Showing {filteredAndSortedStocks.length} of {Object.keys(stockData).length} stocks</div>
                </div>
              )}
            </div>

            {/* Comparison Chart */}
            {comparisonMode && selectedForComparison.length >= 2 && (
              <ComparisonChart selectedStocks={selectedForComparison} stockData={stockData} theme={theme}
                onClose={() => { setComparisonMode(false); setSelectedForComparison([]); }} />
            )}

            {/* Stock Grid or Compact List */}
            {loading && Object.keys(stockData).length === 0 ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Loading stock data...</p>
              </div>
            ) : viewMode === 'compact' ? (
              <div className="space-y-2">
                {filteredAndSortedStocks.map(stock => (
                  <CompactStockCard key={stock.symbol} stock={stock} canDelete={canDeleteStock(stock.symbol)}
                    onRemove={removeStock} positions={positions} currentUser={currentUser} onExpand={toggleExpand}
                    comparisonMode={comparisonMode} isSelectedForComparison={selectedForComparison.includes(stock.symbol)}
                    onToggleComparison={toggleStockComparison} theme={theme} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedStocks.map(stock => (
                  <StockCard key={stock.symbol} stock={stock} canDelete={canDeleteStock(stock.symbol)}
                    onRemove={removeStock} onExpand={toggleExpand} isExpanded={expandedCards.has(stock.symbol)}
                    isLoading={loadingSymbols.has(stock.symbol)}
                    notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote}
                    positions={positions} onAddPosition={handleAddPosition} onRemovePosition={handleRemovePosition}
                    stances={stances} onSetStance={handleSetStance}
                    votes={votes} onVote={handleVote}
                    currentUser={currentUser} isConnected={isConnected}
                    addedBy={stockMeta[stock.symbol]?.added_by ? (memberMap[stockMeta[stock.symbol].added_by] || stockMeta[stock.symbol].added_by) : null}
                    comparisonMode={comparisonMode} isSelectedForComparison={selectedForComparison.includes(stock.symbol)}
                    onToggleComparison={toggleStockComparison} theme={theme} />
                ))}
              </div>
            )}

            {!loading && symbols.length === 0 && (
              <div className={`text-center py-20 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
                <Star className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>No stocks yet</h3>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Add some tickers above to start tracking</p>
              </div>
            )}
          </>
        )}

        {/* PENS TAB */}
        {activeTab === 'pens' && (
          <div className="space-y-4">
            {!activePen ? (
              <PenSelector currentUser={currentUser}
                onSelectPen={async (code, pen) => {
                  setActivePenCode(code); setActivePen(pen);
                  const penData = JSON.parse(localStorage.getItem(`pen-${code}-data`) || '{"symbols":[],"positions":[],"notes":[],"stances":[],"activity":[]}');
                  setPenSymbols(penData.symbols || []); setPenPositions(penData.positions || []);
                  setPenNotes(penData.notes || []); setPenStances(penData.stances || []); setPenActivity(penData.activity || []);
                  for (const symbol of (penData.symbols || [])) {
                    if (!stockData[symbol]) { const data = await fetchStockDataFn(symbol); if (data) setStockData(prev => ({ ...prev, [symbol]: data })); }
                  }
                }}
                onCreatePen={(code, pen) => {
                  setActivePenCode(code); setActivePen(pen); setPenSymbols([]); setPenPositions([]); setPenNotes([]); setPenStances([]);
                  setPenActivity([{ type: 'stock_added', username: currentUser, description: `Created the pen "${pen.name}"`, created_at: new Date().toISOString() }]);
                }}
                theme={theme} />
            ) : (
              <>
                <PenHeader pen={activePen} penCode={activePenCode} onLeavePen={() => { setActivePen(null); setActivePenCode(null); }} theme={theme} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
                    <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}><Users className="w-5 h-5" /> Pen Leaderboard</h3>
                    {activePen.members?.length > 0 ? (
                      <div className="space-y-2">
                        {activePen.members.map((member, idx) => {
                          const memberPositions = penPositions.filter(p => p.username === member);
                          let totalPnL = 0;
                          memberPositions.forEach(pos => { const stock = stockData[pos.symbol]; if (stock) totalPnL += (stock.price - pos.buy_price) * pos.shares; });
                          return (
                            <div key={member} className={`flex items-center justify-between p-3 rounded-lg ${member === currentUser ? 'ring-2 ring-blue-500' : ''} ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg w-6">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                                <UserAvatar username={member} size="sm" />
                                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{member}</span>
                              </div>
                              <span className={`font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (<p className={`text-center py-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No members yet</p>)}
                  </div>
                  <div className="lg:col-span-2"><PenActivityFeed activities={penActivity} currentUser={currentUser} theme={theme} /></div>
                </div>

                <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
                  <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}><Star className="w-5 h-5" /> Pen Watchlist</h3>
                  <div className="flex gap-2 mb-4">
                    <input type="text" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      placeholder="Add ticker (e.g., AAPL)" maxLength={5}
                      className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter' && newSymbol.trim()) {
                          const symbol = newSymbol.trim().toUpperCase();
                          if (!penSymbols.includes(symbol)) {
                            const newSyms = [...penSymbols, symbol]; setPenSymbols(newSyms);
                            const newAct = [...penActivity, { type: 'stock_added', username: currentUser, symbol, description: `Added ${symbol} to the watchlist`, created_at: new Date().toISOString() }];
                            setPenActivity(newAct);
                            localStorage.setItem(`pen-${activePenCode}-data`, JSON.stringify({ symbols: newSyms, positions: penPositions, notes: penNotes, stances: penStances, activity: newAct }));
                            const data = await fetchStockDataFn(symbol); if (data) setStockData(prev => ({ ...prev, [symbol]: data }));
                          }
                          setNewSymbol('');
                        }
                      }} />
                    <button onClick={async () => {
                      if (newSymbol.trim()) {
                        const symbol = newSymbol.trim().toUpperCase();
                        if (!penSymbols.includes(symbol)) {
                          const newSyms = [...penSymbols, symbol]; setPenSymbols(newSyms);
                          const newAct = [...penActivity, { type: 'stock_added', username: currentUser, symbol, description: `Added ${symbol} to the watchlist`, created_at: new Date().toISOString() }];
                          setPenActivity(newAct);
                          localStorage.setItem(`pen-${activePenCode}-data`, JSON.stringify({ symbols: newSyms, positions: penPositions, notes: penNotes, stances: penStances, activity: newAct }));
                          const data = await fetchStockDataFn(symbol); if (data) setStockData(prev => ({ ...prev, [symbol]: data }));
                        }
                        setNewSymbol('');
                      }
                    }} disabled={!newSymbol.trim()} className="px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50"
                      style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)' }}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {penSymbols.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {penSymbols.map(symbol => {
                        const stock = stockData[symbol];
                        if (!stock) return (
                          <div key={symbol} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                            <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{symbol}</span>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
                          </div>
                        );
                        const isPositive = (stock.change || 0) >= 0;
                        return (
                          <div key={symbol} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{symbol}</span>
                              <button onClick={() => {
                                const newSyms = penSymbols.filter(s => s !== symbol); setPenSymbols(newSyms);
                                localStorage.setItem(`pen-${activePenCode}-data`, JSON.stringify({ symbols: newSyms, positions: penPositions, notes: penNotes, stances: penStances, activity: penActivity }));
                              }} className={`text-xs ${theme === 'dark' ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-500'}`}><X className="w-3 h-3" /></button>
                            </div>
                            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>${stock.price?.toFixed(2)}</div>
                            <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No stocks in this pen yet. Add some tickers above!</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showShareModal && <ShareModal watchlistSlug={watchlistSlug} onClose={() => setShowShareModal(false)} />}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} theme={theme} />}
    </div>
  );
};

export default StockDashboard;
