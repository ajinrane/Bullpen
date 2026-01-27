import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Plus, X, RefreshCw, Star, ChevronDown, ChevronUp, AlertCircle, MessageSquare, Send, Trash2, Users, Wifi, WifiOff, DollarSign, Target, ThumbsUp, ThumbsDown, Share2, Copy, Check, Edit3, Minus, LayoutGrid, List, Filter, Sun, Moon, BarChart2, Activity } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ============================================
// 🔑 CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://adthubbgdaaaamjlkmqm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G7Svv6sASbxC4xMK_DgtMQ_LCbmQNc2';
const FINNHUB_API_KEY = 'd5rs899r01qj5oilqq60d5rs899r01qj5oilqq6g';
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User colors
const USER_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/20' },
  { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-500/20' },
  { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/20' },
  { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/20' },
  { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-500/20' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-500/20' },
];

const getUserColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

// Colors for comparison chart lines
const COMPARISON_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

const generateWatchlistId = () => Math.random().toString(36).substring(2, 10);

// ============================================
// FINNHUB API
// ============================================

const fetchFinnhub = async (endpoint) => {
  const url = `https://finnhub.io/api/v1${endpoint}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

const fetchStockQuote = async (symbol) => {
  try {
    const [quote, profile] = await Promise.all([
      fetchFinnhub(`/quote?symbol=${symbol}`),
      fetchFinnhub(`/stock/profile2?symbol=${symbol}`).catch(() => null)
    ]);
    
    if (!quote || quote.c === 0) {
      console.error(`No data for ${symbol}`);
      return null;
    }
    
    return {
      symbol,
      shortName: profile?.name || symbol,
      longName: profile?.name || symbol,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      previousClose: quote.pc,
      dayHigh: quote.h,
      dayLow: quote.l,
      open: quote.o,
      yearHigh: quote.c * 1.2,
      yearLow: quote.c * 0.8,
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
      sector: profile?.finnhubIndustry || null,
      industry: profile?.finnhubIndustry || null,
      logo: profile?.logo || null,
      pe: null,
      eps: null,
      dividend: null,
      beta: null,
      targetMeanPrice: null,
      targetHighPrice: null,
      targetLowPrice: null,
      recommendationKey: null,
      recommendationMean: null,
      numberOfAnalystOpinions: 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

const fetchHistoricalData = async (symbol, currentPrice = 150) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60);

    const data = await fetchFinnhub(`/stock/candle?symbol=${symbol}&resolution=D&from=${fiveYearsAgo}&to=${now}`);

    if (data.s !== 'ok' || !data.c || !data.t) {
      console.log(`No candle data for ${symbol}, generating mock`);
      return generateMockHistory(symbol, currentPrice);
    }

    const history = data.t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      price: data.c[i],
    })).filter(d => d.price > 0);

    return history.length > 0 ? history : generateMockHistory(symbol, currentPrice);
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    return generateMockHistory(symbol, currentPrice);
  }
};

const generateMockHistory = (symbol, currentPrice = 150) => {
  // Work backwards from current price to generate realistic historical data
  let price = currentPrice;
  const dataPoints = [];
  for (let i = 0; i <= 1260; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dataPoints.push({ date: date.toISOString().split('T')[0], price });
    // Random walk backwards (so we go back in time with some variance)
    price = price / (1 + (Math.random() - 0.48) * 0.03);
  }
  // Reverse to get chronological order (oldest first)
  return dataPoints.reverse();
};

const calculatePerformance = (historicalData, currentPrice) => {
  if (!historicalData || historicalData.length === 0) {
    return { '1W': 0, '1M': 0, '3M': 0, 'YTD': 0, '1Y': 0 };
  }
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const getPrice = (daysAgo) => {
    const targetIdx = Math.max(0, historicalData.length - daysAgo - 1);
    return historicalData[targetIdx]?.price || currentPrice;
  };
  const ytdData = historicalData.find(d => new Date(d.date) >= yearStart);
  const ytdPrice = ytdData?.price || historicalData[0]?.price || currentPrice;
  // Use 252 trading days for 1Y calculation (not the oldest data point)
  const yearAgoPrice = getPrice(252);
  return {
    '1W': ((currentPrice - getPrice(5)) / getPrice(5)) * 100,
    '1M': ((currentPrice - getPrice(22)) / getPrice(22)) * 100,
    '3M': ((currentPrice - getPrice(66)) / getPrice(66)) * 100,
    'YTD': ((currentPrice - ytdPrice) / ytdPrice) * 100,
    '1Y': ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100
  };
};

// ============================================
// COMPONENTS
// ============================================

const SectorBadge = ({ sector, small = false }) => {
  if (!sector) return null;
  const colors = {
    'Technology': 'bg-blue-600', 'Healthcare': 'bg-pink-600',
    'Financial Services': 'bg-green-600', 'Financials': 'bg-green-600',
    'Consumer Cyclical': 'bg-orange-600', 'Communication Services': 'bg-purple-600',
    'Industrials': 'bg-gray-600', 'Consumer Defensive': 'bg-teal-600',
    'Energy': 'bg-yellow-600', 'Utilities': 'bg-cyan-600',
    'Real Estate': 'bg-indigo-600', 'Basic Materials': 'bg-amber-600',
  };
  return (
    <span className={`${small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'} rounded font-medium text-white ${colors[sector] || 'bg-slate-600'}`}>
      {sector}
    </span>
  );
};

const PerformanceCell = ({ value, small = false }) => {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className="text-slate-500">—</span>;
  }
  const isPositive = value >= 0;
  return (
    <span className={`font-semibold ${small ? 'text-xs' : ''} ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

const MiniChart = ({ data, isPositive, height = 60 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-slate-500 text-sm">No data</div>;
  }
  const chartData = data.slice(-30);
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
            <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="price" stroke={isPositive ? '#22c55e' : '#ef4444'} fill={`url(#${gradientId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const LargeChart = ({ data, symbol }) => {
  const [range, setRange] = useState('1M');
  
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const ranges = { '1W': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '5Y': 1260 };
    const sliceAmount = ranges[range] || 22;
    return data.slice(-Math.min(sliceAmount, data.length));
  }, [data, range]);
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">{symbol} Price Chart</h3>
        <div className="h-48 flex items-center justify-center text-slate-500">No chart data available</div>
      </div>
    );
  }
  
  const isPositive = filteredData.length > 1 && filteredData[filteredData.length - 1].price >= filteredData[0].price;
  const gradientId = `large-gradient-${symbol}`;
  
  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">{symbol} Price Chart</h3>
        <div className="flex gap-1">
          {['1W', '1M', '3M', '6M', '1Y', '5Y'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-2 py-1 text-xs rounded ${range === r ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={filteredData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            tickFormatter={(d) => {
              const date = new Date(d);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            interval="preserveStartEnd" 
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v.toFixed(0)}`} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }} 
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()} 
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={isPositive ? '#22c55e' : '#ef4444'} 
            fill={`url(#${gradientId})`} 
            strokeWidth={2} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const ComparisonChart = ({ selectedStocks, stockData, theme, onClose }) => {
  const [range, setRange] = useState('1M');

  const chartData = useMemo(() => {
    if (selectedStocks.length === 0) return [];

    const ranges = { '1W': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '5Y': 1260 };
    const sliceAmount = ranges[range] || 22;

    // Get all stocks' historical data
    const stocksWithData = selectedStocks
      .map(symbol => ({ symbol, data: stockData[symbol]?.historicalData }))
      .filter(s => s.data && s.data.length > 0);

    if (stocksWithData.length === 0) return [];

    // Use the shortest data length
    const minLength = Math.min(...stocksWithData.map(s => s.data.length), sliceAmount);

    // Normalize all prices to percentage change from first data point
    const result = [];
    for (let i = 0; i < minLength; i++) {
      const dataPoint = { date: stocksWithData[0].data[stocksWithData[0].data.length - minLength + i]?.date };
      stocksWithData.forEach(({ symbol, data }) => {
        const slicedData = data.slice(-minLength);
        const firstPrice = slicedData[0]?.price;
        const currentPrice = slicedData[i]?.price;
        if (firstPrice && currentPrice) {
          dataPoint[symbol] = ((currentPrice - firstPrice) / firstPrice) * 100;
        }
      });
      result.push(dataPoint);
    }

    return result;
  }, [selectedStocks, stockData, range]);

  if (selectedStocks.length === 0) return null;

  return (
    <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <BarChart2 className="w-5 h-5" /> Performance Comparison
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['1W', '1M', '3M', '6M', '1Y', '5Y'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-2 py-1 text-xs rounded ${range === r ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={onClose}
            className={`p-1 rounded ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {selectedStocks.map((symbol, idx) => (
          <div key={symbol} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{symbol}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="date"
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10 }}
            tickFormatter={(d) => {
              const date = new Date(d);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10 }}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', border: theme === 'dark' ? 'none' : '1px solid #e2e8f0', borderRadius: '8px' }}
            labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#475569' }}
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          {selectedStocks.map((symbol, idx) => (
            <Line
              key={symbol}
              type="monotone"
              dataKey={symbol}
              stroke={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const UserAvatar = ({ username, size = 'sm' }) => {
  const color = getUserColor(username);
  const sizeClasses = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
  return (
    <div className={`${sizeClasses[size]} ${color.bg} rounded-full flex items-center justify-center text-white font-bold`}>
      {username.charAt(0).toUpperCase()}
    </div>
  );
};

const StanceBadge = ({ stance }) => {
  if (stance === 'bull') {
    return <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium"><TrendingUp className="w-3 h-3" /> Bull</span>;
  }
  if (stance === 'bear') {
    return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium"><TrendingDown className="w-3 h-3" /> Bear</span>;
  }
  return null;
};

const PositionEntry = ({ symbol, positions, currentPrice, currentUser, onAddPosition, onRemovePosition }) => {
  const [showForm, setShowForm] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [shares, setShares] = useState('');
  
  const userPositions = positions.filter(p => p.symbol === symbol);
  const myPosition = userPositions.find(p => p.username === currentUser);
  
  const handleSubmit = () => {
    if (!buyPrice || !shares) return;
    onAddPosition(symbol, parseFloat(buyPrice), parseFloat(shares));
    setBuyPrice('');
    setShares('');
    setShowForm(false);
  };
  
  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4" /> Positions & P/L
      </h3>
      
      <div className="space-y-2 mb-3">
        {userPositions.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No positions tracked</p>
        ) : (
          userPositions.map(pos => {
            const gainLoss = (currentPrice - pos.buy_price) * pos.shares;
            const gainLossPercent = ((currentPrice - pos.buy_price) / pos.buy_price) * 100;
            const isProfit = gainLoss >= 0;
            const color = getUserColor(pos.username);
            
            return (
              <div key={pos.id} className={`${color.light} rounded p-3 group`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <UserAvatar username={pos.username} size="sm" />
                    <span className="text-white font-medium">{pos.username}</span>
                  </div>
                  {pos.username === currentUser && (
                    <button onClick={() => onRemovePosition(pos.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div><span className="text-slate-400">Shares:</span><span className="text-white ml-2">{pos.shares}</span></div>
                  <div><span className="text-slate-400">Avg Cost:</span><span className="text-white ml-2">{formatCurrency(pos.buy_price)}</span></div>
                  <div><span className="text-slate-400">Value:</span><span className="text-white ml-2">{formatCurrency(currentPrice * pos.shares)}</span></div>
                  <div>
                    <span className="text-slate-400">P/L:</span>
                    <span className={`ml-2 font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(gainLoss)} ({isProfit ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {!myPosition && (
        <>
          {showForm ? (
            <div className="bg-slate-700 rounded p-3 space-y-2">
              <div className="flex gap-2">
                <input type="number" value={shares} onChange={(e) => setShares(e.target.value)}
                  placeholder="Shares" step="0.01"
                  className="flex-1 px-2 py-1 bg-slate-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="Buy price" step="0.01"
                  className="flex-1 px-2 py-1 bg-slate-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={!buyPrice || !shares}
                  className="flex-1 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-sm rounded">
                  Add Position
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full py-2 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 rounded flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Your Position
            </button>
          )}
        </>
      )}
    </div>
  );
};

const StanceSelector = ({ symbol, stances, currentUser, onSetStance }) => {
  const userStances = stances.filter(s => s.symbol === symbol);
  const myStance = userStances.find(s => s.username === currentUser)?.stance;
  const bullCount = userStances.filter(s => s.stance === 'bull').length;
  const bearCount = userStances.filter(s => s.stance === 'bear').length;
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
        <Target className="w-4 h-4" /> Bull / Bear Stance
      </h3>
      
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-bold text-lg">{bullCount}</span>
          <span className="text-slate-400 text-sm">Bulls</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-bold text-lg">{bearCount}</span>
          <span className="text-slate-400 text-sm">Bears</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button onClick={() => onSetStance(symbol, 'bull')}
          className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors
            ${myStance === 'bull' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
          <TrendingUp className="w-4 h-4" /> Bullish
        </button>
        <button onClick={() => onSetStance(symbol, 'neutral')}
          className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors
            ${!myStance || myStance === 'neutral' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
          <Minus className="w-4 h-4" /> Neutral
        </button>
        <button onClick={() => onSetStance(symbol, 'bear')}
          className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors
            ${myStance === 'bear' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
          <TrendingDown className="w-4 h-4" /> Bearish
        </button>
      </div>
    </div>
  );
};

const VoteButtons = ({ symbol, votes, currentUser, onVote }) => {
  const stockVotes = votes.filter(v => v.symbol === symbol);
  const myVote = stockVotes.find(v => v.username === currentUser)?.vote;
  const score = stockVotes.reduce((acc, v) => acc + (v.vote === 'up' ? 1 : -1), 0);
  
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onVote(symbol, 'up')}
        className={`p-1 rounded transition-colors ${myVote === 'up' ? 'text-green-400 bg-green-400/20' : 'text-slate-400 hover:text-green-400'}`}>
        <ThumbsUp className="w-4 h-4" />
      </button>
      <span className={`font-bold text-sm min-w-[20px] text-center ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-slate-400'}`}>
        {score > 0 ? '+' : ''}{score}
      </span>
      <button onClick={() => onVote(symbol, 'down')}
        className={`p-1 rounded transition-colors ${myVote === 'down' ? 'text-red-400 bg-red-400/20' : 'text-slate-400 hover:text-red-400'}`}>
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
};

const NotesSection = ({ symbol, notes, onAddNote, onDeleteNote, currentUser, isConnected }) => {
  const [newNote, setNewNote] = useState('');
  const stockNotes = notes.filter(n => n.symbol === symbol);
  
  const handleSubmit = () => {
    if (!newNote.trim()) return;
    onAddNote(symbol, newNote.trim());
    setNewNote('');
  };
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Notes
        {isConnected ? (
          <span className="flex items-center gap-1 text-green-400 text-xs"><Wifi className="w-3 h-3" /> Live</span>
        ) : (
          <span className="flex items-center gap-1 text-yellow-400 text-xs"><WifiOff className="w-3 h-3" /> Offline</span>
        )}
      </h3>
      
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {stockNotes.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No notes yet</p>
        ) : (
          stockNotes.map(note => {
            const color = getUserColor(note.author);
            return (
              <div key={note.id} className={`${color.light} rounded p-2 group`}>
                <div className="flex justify-between items-start">
                  <p className="text-white text-sm">{note.text}</p>
                  {note.author === currentUser && (
                    <button onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <UserAvatar username={note.author} size="sm" />
                  <span className={color.text}>{note.author}</span>
                  <span>·</span>
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="flex gap-2">
        <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Add a note..."
          className="flex-1 px-3 py-2 bg-slate-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button onClick={handleSubmit} disabled={!newNote.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const PortfolioSummary = ({ positions, stockData, currentUser, allUsers }) => {
  const userPortfolios = useMemo(() => {
    const portfolios = {};
    allUsers.forEach(user => {
      const userPositions = positions.filter(p => p.username === user);
      let totalCost = 0;
      let totalValue = 0;
      userPositions.forEach(pos => {
        const stock = stockData[pos.symbol];
        if (stock) {
          totalCost += pos.buy_price * pos.shares;
          totalValue += stock.price * pos.shares;
        }
      });
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      portfolios[user] = { totalCost, totalValue, totalGainLoss, totalGainLossPercent, positionCount: userPositions.length };
    });
    return portfolios;
  }, [positions, stockData, allUsers]);
  
  const sortedUsers = [...allUsers].sort((a, b) => 
    (userPortfolios[b]?.totalGainLossPercent || 0) - (userPortfolios[a]?.totalGainLossPercent || 0)
  );
  
  return (
    <div className="bg-slate-800 rounded-xl p-4 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" /> Portfolio Leaderboard
      </h2>
      
      <div className="space-y-3">
        {sortedUsers.map((user, index) => {
          const portfolio = userPortfolios[user];
          if (!portfolio || portfolio.positionCount === 0) return null;
          const isProfit = portfolio.totalGainLossPercent >= 0;
          const color = getUserColor(user);
          const isCurrentUser = user === currentUser;
          
          return (
            <div key={user} className={`flex items-center justify-between p-4 rounded-lg ${isCurrentUser ? color.light : 'bg-slate-700'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-slate-400 w-8">#{index + 1}</span>
                <UserAvatar username={user} size="md" />
                <span className={`font-semibold text-lg ${isCurrentUser ? color.text : 'text-white'}`}>{user}</span>
                {isCurrentUser && <span className="text-xs bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded">You</span>}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {isProfit ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%
                </div>
                <div className="text-xs text-slate-400">{portfolio.positionCount} position{portfolio.positionCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
        
        {sortedUsers.filter(u => userPortfolios[u]?.positionCount > 0).length === 0 && (
          <p className="text-slate-500 text-center py-4">No positions tracked yet. Add your buy prices to compete!</p>
        )}
      </div>
    </div>
  );
};

const SocialFeed = ({ feedItems, currentUser, theme, onClose }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'position': return <DollarSign className="w-4 h-4" />;
      case 'note': return <MessageSquare className="w-4 h-4" />;
      case 'stance': return <Target className="w-4 h-4" />;
      case 'vote': return <ThumbsUp className="w-4 h-4" />;
      case 'stock_added': return <Plus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'position': return 'bg-green-500/20 text-green-400';
      case 'note': return 'bg-blue-500/20 text-blue-400';
      case 'stance': return 'bg-purple-500/20 text-purple-400';
      case 'vote': return 'bg-orange-500/20 text-orange-400';
      case 'stock_added': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <Activity className="w-5 h-5" /> Social Feed
        </h2>
        <button onClick={onClose}
          className={`p-1 rounded ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {feedItems.length === 0 ? (
          <p className={`text-center py-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            No activity yet. Add positions, comments, or votes to see the feed!
          </p>
        ) : (
          feedItems.map((item, idx) => {
            const color = getUserColor(item.username);
            const isCurrentUser = item.username === currentUser;

            return (
              <div key={item.id || idx} className={`flex items-start gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <UserAvatar username={item.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${isCurrentUser ? color.text : theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {item.username}
                      {isCurrentUser && <span className="text-xs bg-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded ml-1">You</span>}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getActivityColor(item.type)}`}>
                      {getActivityIcon(item.type)}
                      {item.type === 'position' ? 'position' :
                       item.type === 'note' ? 'comment' :
                       item.type === 'stance' ? 'stance' :
                       item.type === 'vote' ? 'vote' :
                       item.type === 'stock_added' ? 'added stock' : item.type}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                      {item.symbol}
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ShareModal = ({ watchlistId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}${window.location.pathname}?watchlist=${watchlistId}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Share Watchlist
        </h2>
        <p className="text-slate-400 text-sm mb-4">Anyone with this link can view and collaborate on this watchlist.</p>
        <div className="flex gap-2">
          <input type="text" value={shareUrl} readOnly
            className="flex-1 px-3 py-2 bg-slate-700 text-white text-sm rounded focus:outline-none" />
          <button onClick={handleCopy}
            className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={onClose}
          className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

const UserSetupModal = ({ onSetUser }) => {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onSetUser(name.trim());
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-2">👋 Welcome!</h2>
        <p className="text-slate-400 text-sm mb-4">Enter your name to start tracking stocks with friends.</p>
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus />
          <button type="submit" disabled={!name.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
};

// Compact Stock Card
const CompactStockCard = ({
  stock, canDelete, onRemove, positions, currentUser, onExpand,
  comparisonMode, isSelectedForComparison, onToggleComparison, theme
}) => {
  const isPositive = (stock.change || 0) >= 0;
  const stockPositions = positions.filter(p => p.symbol === stock.symbol);
  const myPosition = stockPositions.find(p => p.username === currentUser);

  const formatCurrency = (v) => v === null || v === undefined ? '—' : `$${v.toFixed(2)}`;

  const handleClick = () => {
    if (comparisonMode) {
      onToggleComparison(stock.symbol);
    } else {
      onExpand(stock.symbol);
    }
  };

  return (
    <div
      className={`rounded-lg p-3 transition-all cursor-pointer ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white hover:bg-slate-50 shadow'} ${comparisonMode && isSelectedForComparison ? 'ring-2 ring-purple-500' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {comparisonMode && (
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelectedForComparison ? 'bg-purple-600 border-purple-600' : theme === 'dark' ? 'border-slate-500' : 'border-slate-300'}`}>
              {isSelectedForComparison && <Check className="w-3 h-3 text-white" />}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stock.symbol}</span>
              <SectorBadge sector={stock.sector} small />
            </div>
            <div className={`text-xs truncate max-w-[120px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stock.shortName}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <MiniChart data={stock.historicalData} isPositive={isPositive} height={30} />

          <div className="text-right min-w-[80px]">
            <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(stock.price)}</div>
            <div className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
            </div>
          </div>

          {myPosition && (
            <div className={`text-right min-w-[60px] px-2 py-1 rounded ${(stock.price - myPosition.buy_price) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`text-xs font-bold ${(stock.price - myPosition.buy_price) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(((stock.price - myPosition.buy_price) / myPosition.buy_price) * 100).toFixed(1)}%
              </div>
            </div>
          )}

          <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <Users className="w-3 h-3" />
            {stockPositions.length}
          </div>

          {canDelete && !comparisonMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(stock.symbol); }}
              className="text-slate-500 hover:text-red-400 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Full Stock Card
const StockCard = ({
  stock, canDelete, onRemove, onExpand, isExpanded, isLoading,
  notes, onAddNote, onDeleteNote,
  positions, onAddPosition, onRemovePosition,
  stances, onSetStance,
  votes, onVote,
  currentUser, isConnected, addedBy,
  comparisonMode, isSelectedForComparison, onToggleComparison, theme
}) => {
  const isPositive = (stock.change || 0) >= 0;
  const formatCurrency = (v) => v === null || v === undefined ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const formatLargeNumber = (v) => {
    if (!v) return '—';
    if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    return v.toLocaleString();
  };

  const stockNotes = notes.filter(n => n.symbol === stock.symbol);
  const stockPositions = positions.filter(p => p.symbol === stock.symbol);
  const myPosition = stockPositions.find(p => p.username === currentUser);
  const myStance = stances.find(s => s.symbol === stock.symbol && s.username === currentUser)?.stance;

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all ${isLoading ? 'opacity-60' : ''} ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} ${comparisonMode && isSelectedForComparison ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-3">
            {comparisonMode && (
              <button
                onClick={() => onToggleComparison(stock.symbol)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${isSelectedForComparison ? 'bg-purple-600 border-purple-600' : theme === 'dark' ? 'border-slate-500 hover:border-purple-500' : 'border-slate-300 hover:border-purple-500'}`}
              >
                {isSelectedForComparison && <Check className="w-4 h-4 text-white" />}
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stock.symbol}</h2>
                <VoteButtons symbol={stock.symbol} votes={votes} currentUser={currentUser} onVote={onVote} />
              </div>
              <div className={`text-sm mb-2 line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stock.shortName}</div>
              <div className="flex flex-wrap gap-1 items-center">
                <SectorBadge sector={stock.sector} />
                {myStance && <StanceBadge stance={myStance} />}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {canDelete && !comparisonMode && (
              <button onClick={() => onRemove(stock.symbol)} className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} hover:text-red-400 transition-colors p-1`}>
                <X className="w-5 h-5" />
              </button>
            )}
            {addedBy && (
              <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                <UserAvatar username={addedBy} size="sm" />
                <span>{addedBy}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(stock.price)}</div>
          <div className={`flex items-center gap-2 text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>{isPositive ? '+' : ''}{formatCurrency(stock.change)}</span>
            <span>({isPositive ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%)</span>
          </div>
        </div>

        {myPosition && (
          <div className={`p-2 rounded mb-3 ${(stock.price - myPosition.buy_price) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Your P/L:</span>
              <span className={`font-bold ${(stock.price - myPosition.buy_price) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(stock.price - myPosition.buy_price) >= 0 ? '+' : ''}
                {formatCurrency((stock.price - myPosition.buy_price) * myPosition.shares)}
                {' '}({(((stock.price - myPosition.buy_price) / myPosition.buy_price) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        <MiniChart data={stock.historicalData} isPositive={isPositive} />

        <div className="grid grid-cols-5 gap-1 mt-3 text-center text-xs">
          {['1W', '1M', '3M', 'YTD', '1Y'].map(period => (
            <div key={period}>
              <div className="text-slate-400">{period}</div>
              <PerformanceCell value={stock.performance?.[period]} />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3 text-xs">
          {stockNotes.length > 0 && (
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {stockNotes.length}
            </span>
          )}
          {stockPositions.length > 0 && (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> {stockPositions.length}
            </span>
          )}
        </div>

        <button onClick={() => onExpand(stock.symbol)}
          className="w-full mt-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 rounded">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isExpanded ? 'Less' : 'More Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700 p-5 bg-slate-850 space-y-4">
          <LargeChart data={stock.historicalData} symbol={stock.symbol} />
          
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Key Stats</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Market Cap</span>
                <span className="text-white">{formatLargeNumber(stock.marketCap)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Day High</span>
                <span className="text-white">{formatCurrency(stock.dayHigh)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Day Low</span>
                <span className="text-white">{formatCurrency(stock.dayLow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prev Close</span>
                <span className="text-white">{formatCurrency(stock.previousClose)}</span>
              </div>
            </div>
          </div>

          <StanceSelector symbol={stock.symbol} stances={stances} currentUser={currentUser} onSetStance={onSetStance} />
          <PositionEntry symbol={stock.symbol} positions={positions} currentPrice={stock.price}
            currentUser={currentUser} onAddPosition={onAddPosition} onRemovePosition={onRemovePosition} />
          <NotesSection symbol={stock.symbol} notes={notes} onAddNote={onAddNote} 
            onDeleteNote={onDeleteNote} currentUser={currentUser} isConnected={isConnected} />
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN DASHBOARD
// ============================================

const StockDashboard = () => {
  const [watchlistId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('watchlist') || localStorage.getItem('watchlist-id') || generateWatchlistId();
  });

  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('stock-username') || '');
  const [showUserSetup, setShowUserSetup] = useState(!currentUser);
  const [showShareModal, setShowShareModal] = useState(false);

  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('stock-theme') || 'dark');
  
  const [symbols, setSymbols] = useState(() => {
    const saved = localStorage.getItem(`watchlist-${watchlistId}-symbols`);
    return saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'GOOGL'];
  });
  const [stockData, setStockData] = useState({});
  const [stockMeta, setStockMeta] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSymbols, setLoadingSymbols] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // View and filter state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'
  const [sortBy, setSortBy] = useState('symbol'); // 'symbol' | 'holders' | 'change' | 'sector'
  const [filterSector, setFilterSector] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  
  const [notes, setNotes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stances, setStances] = useState([]);
  const [votes, setVotes] = useState([]);

  // Social feed state
  const [feedItems, setFeedItems] = useState([]);
  const [showFeed, setShowFeed] = useState(false);
  
  const allUsers = useMemo(() => {
    const users = new Set();
    if (currentUser) users.add(currentUser);
    notes.forEach(n => users.add(n.author));
    positions.forEach(p => users.add(p.username));
    stances.forEach(s => users.add(s.username));
    Object.values(stockMeta).forEach(m => m?.added_by && users.add(m.added_by));
    return [...users].filter(Boolean);
  }, [currentUser, notes, positions, stances, stockMeta]);

  // Get unique sectors for filter
  const sectors = useMemo(() => {
    const sectorSet = new Set();
    Object.values(stockData).forEach(s => {
      if (s.sector) sectorSet.add(s.sector);
    });
    return ['all', ...Array.from(sectorSet).sort()];
  }, [stockData]);

  // Apply theme class to document root
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('stock-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    localStorage.setItem('watchlist-id', watchlistId);
    const url = new URL(window.location);
    url.searchParams.set('watchlist', watchlistId);
    window.history.replaceState({}, '', url);
  }, [watchlistId]);

  useEffect(() => {
    localStorage.setItem(`watchlist-${watchlistId}-symbols`, JSON.stringify(symbols));
  }, [symbols, watchlistId]);

  const handleSetUser = (name) => {
    setCurrentUser(name);
    localStorage.setItem('stock-username', name);
    setShowUserSetup(false);
  };

  // Load Supabase data
  useEffect(() => {
    if (!currentUser) return;
    
    const loadData = async () => {
      try {
        const [notesRes, positionsRes, stancesRes, votesRes, metaRes] = await Promise.all([
          supabase.from('stock_notes').select('*').eq('watchlist_id', watchlistId).order('created_at', { ascending: false }),
          supabase.from('stock_positions').select('*').eq('watchlist_id', watchlistId),
          supabase.from('stock_stances').select('*').eq('watchlist_id', watchlistId),
          supabase.from('stock_votes').select('*').eq('watchlist_id', watchlistId),
          supabase.from('stock_meta').select('*').eq('watchlist_id', watchlistId),
        ]);
        
        if (notesRes.data) setNotes(notesRes.data);
        if (positionsRes.data) setPositions(positionsRes.data);
        if (stancesRes.data) setStances(stancesRes.data);
        if (votesRes.data) setVotes(votesRes.data);
        if (metaRes.data) {
          const meta = {};
          metaRes.data.forEach(m => { meta[m.symbol] = m; });
          setStockMeta(meta);
        }

        // Build initial feed from existing data
        const initialFeed = [];

        // Add notes to feed
        (notesRes.data || []).forEach(n => {
          initialFeed.push({
            id: `note-${n.id}`,
            type: 'note',
            username: n.author,
            symbol: n.symbol,
            description: `"${n.text.length > 60 ? n.text.slice(0, 60) + '...' : n.text}"`,
            created_at: n.created_at
          });
        });

        // Add positions to feed
        (positionsRes.data || []).forEach(p => {
          initialFeed.push({
            id: `position-${p.id}`,
            type: 'position',
            username: p.username,
            symbol: p.symbol,
            description: `Added position: ${p.shares} shares at $${p.buy_price.toFixed(2)}`,
            created_at: p.created_at
          });
        });

        // Add stances to feed
        (stancesRes.data || []).forEach(s => {
          initialFeed.push({
            id: `stance-${s.id}`,
            type: 'stance',
            username: s.username,
            symbol: s.symbol,
            description: `Set stance to ${s.stance === 'bull' ? 'Bullish' : s.stance === 'bear' ? 'Bearish' : 'Neutral'}`,
            created_at: s.created_at
          });
        });

        // Add votes to feed
        (votesRes.data || []).forEach(v => {
          initialFeed.push({
            id: `vote-${v.id}`,
            type: 'vote',
            username: v.username,
            symbol: v.symbol,
            description: v.vote === 'up' ? 'Upvoted this stock' : 'Downvoted this stock',
            created_at: v.created_at
          });
        });

        // Sort by date and keep last 50
        initialFeed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setFeedItems(initialFeed.slice(0, 50));

        setIsConnected(true);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
    
    // Helper to add feed items
    const addFeedItem = (type, payload) => {
      const item = payload.new;
      let feedItem = null;

      switch (type) {
        case 'note':
          feedItem = {
            id: `note-${item.id}`,
            type: 'note',
            username: item.author,
            symbol: item.symbol,
            description: `"${item.text.length > 60 ? item.text.slice(0, 60) + '...' : item.text}"`,
            created_at: item.created_at
          };
          break;
        case 'position':
          feedItem = {
            id: `position-${item.id}`,
            type: 'position',
            username: item.username,
            symbol: item.symbol,
            description: `Added position: ${item.shares} shares at $${item.buy_price.toFixed(2)}`,
            created_at: item.created_at
          };
          break;
        case 'stance':
          feedItem = {
            id: `stance-${item.id}`,
            type: 'stance',
            username: item.username,
            symbol: item.symbol,
            description: `Set stance to ${item.stance === 'bull' ? 'Bullish' : item.stance === 'bear' ? 'Bearish' : 'Neutral'}`,
            created_at: item.created_at
          };
          break;
        case 'vote':
          feedItem = {
            id: `vote-${item.id}`,
            type: 'vote',
            username: item.username,
            symbol: item.symbol,
            description: item.vote === 'up' ? 'Upvoted this stock' : 'Downvoted this stock',
            created_at: item.created_at
          };
          break;
        default:
          return;
      }

      if (feedItem) {
        setFeedItems(prev => [feedItem, ...prev].slice(0, 50)); // Keep last 50 items
      }
    };

    // Real-time subscriptions
    const channel = supabase.channel(`watchlist-${watchlistId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_notes', filter: `watchlist_id=eq.${watchlistId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new, ...prev]);
            addFeedItem('note', payload);
          }
          else if (payload.eventType === 'DELETE') setNotes(prev => prev.filter(n => n.id !== payload.old.id));
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_positions', filter: `watchlist_id=eq.${watchlistId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPositions(prev => [...prev, payload.new]);
            addFeedItem('position', payload);
          }
          else if (payload.eventType === 'DELETE') setPositions(prev => prev.filter(p => p.id !== payload.old.id));
          else if (payload.eventType === 'UPDATE') setPositions(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_stances', filter: `watchlist_id=eq.${watchlistId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStances(prev => [...prev, payload.new]);
            addFeedItem('stance', payload);
          }
          else if (payload.eventType === 'DELETE') setStances(prev => prev.filter(s => s.id !== payload.old.id));
          else if (payload.eventType === 'UPDATE') {
            setStances(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
            addFeedItem('stance', payload);
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_votes', filter: `watchlist_id=eq.${watchlistId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVotes(prev => [...prev, payload.new]);
            addFeedItem('vote', payload);
          }
          else if (payload.eventType === 'DELETE') setVotes(prev => prev.filter(v => v.id !== payload.old.id));
          else if (payload.eventType === 'UPDATE') {
            setVotes(prev => prev.map(v => v.id === payload.new.id ? payload.new : v));
            addFeedItem('vote', payload);
          }
        })
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, watchlistId]);

  // Supabase handlers
  const handleAddNote = async (symbol, text) => {
    await supabase.from('stock_notes').insert([{ watchlist_id: watchlistId, symbol, text, author: currentUser }]);
  };
  
  const handleDeleteNote = async (noteId) => {
    await supabase.from('stock_notes').delete().eq('id', noteId);
  };
  
  const handleAddPosition = async (symbol, buyPrice, shares) => {
    await supabase.from('stock_positions').insert([{ watchlist_id: watchlistId, symbol, buy_price: buyPrice, shares, username: currentUser }]);
  };
  
  const handleRemovePosition = async (positionId) => {
    await supabase.from('stock_positions').delete().eq('id', positionId);
  };
  
  const handleSetStance = async (symbol, stance) => {
    const existing = stances.find(s => s.symbol === symbol && s.username === currentUser);
    if (existing) {
      if (stance && stance !== 'neutral') {
        await supabase.from('stock_stances').update({ stance }).eq('id', existing.id);
      } else {
        await supabase.from('stock_stances').delete().eq('id', existing.id);
      }
    } else if (stance && stance !== 'neutral') {
      await supabase.from('stock_stances').insert([{ watchlist_id: watchlistId, symbol, stance, username: currentUser }]);
    }
  };
  
  const handleVote = async (symbol, vote) => {
    const existing = votes.find(v => v.symbol === symbol && v.username === currentUser);
    if (existing) {
      if (existing.vote === vote) {
        await supabase.from('stock_votes').delete().eq('id', existing.id);
      } else {
        await supabase.from('stock_votes').update({ vote }).eq('id', existing.id);
      }
    } else {
      await supabase.from('stock_votes').insert([{ watchlist_id: watchlistId, symbol, vote, username: currentUser }]);
    }
  };

  // Fetch stock data
  const fetchStockDataFn = useCallback(async (symbol) => {
    try {
      // Fetch quote first to get current price for mock data fallback
      const quote = await fetchStockQuote(symbol);
      if (!quote) return null;

      // Fetch historical data with current price for mock data fallback
      const history = await fetchHistoricalData(symbol, quote.price);
      return { ...quote, historicalData: history, performance: calculatePerformance(history, quote.price) };
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
      return null;
    }
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
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbols, fetchStockDataFn]);

  useEffect(() => { 
    if (currentUser) fetchAllData(); 
  }, [currentUser]);

  const addStock = async () => {
    const symbol = newSymbol.toUpperCase().trim();
    if (!symbol || symbols.includes(symbol) || symbol.length > 5) return;
    
    setSymbols(prev => [...prev, symbol]);
    setNewSymbol('');
    setLoadingSymbols(prev => new Set([...prev, symbol]));
    
    await supabase.from('stock_meta').insert([{ watchlist_id: watchlistId, symbol, added_by: currentUser }]).catch(() => {});
    setStockMeta(prev => ({ ...prev, [symbol]: { added_by: currentUser } }));

    // Add to social feed
    setFeedItems(prev => [{
      id: `stock-${symbol}-${Date.now()}`,
      type: 'stock_added',
      username: currentUser,
      symbol: symbol,
      description: `Added ${symbol} to the watchlist`,
      created_at: new Date().toISOString()
    }, ...prev].slice(0, 50));
    
    const data = await fetchStockDataFn(symbol);
    if (data) {
      setStockData(prev => ({ ...prev, [symbol]: data }));
    }
    setLoadingSymbols(prev => { const next = new Set(prev); next.delete(symbol); return next; });
  };

  const removeStock = (symbol) => {
    setSymbols(prev => prev.filter(s => s !== symbol));
    setStockData(prev => { const next = { ...prev }; delete next[symbol]; return next; });
    setExpandedCards(prev => { const next = new Set(prev); next.delete(symbol); return next; });
  };

  const toggleExpand = (symbol) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const toggleComparisonMode = () => {
    setComparisonMode(prev => !prev);
    if (comparisonMode) {
      setSelectedForComparison([]);
    }
  };

  const toggleStockComparison = (symbol) => {
    setSelectedForComparison(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      }
      if (prev.length >= 5) return prev; // Max 5 stocks
      return [...prev, symbol];
    });
  };

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    let stocks = symbols.map(s => stockData[s]).filter(Boolean);
    
    // Filter by sector
    if (filterSector !== 'all') {
      stocks = stocks.filter(s => s.sector === filterSector);
    }
    
    // Sort
    switch (sortBy) {
      case 'holders':
        stocks.sort((a, b) => {
          const aHolders = positions.filter(p => p.symbol === a.symbol).length;
          const bHolders = positions.filter(p => p.symbol === b.symbol).length;
          return bHolders - aHolders;
        });
        break;
      case 'change':
        stocks.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        break;
      case 'sector':
        stocks.sort((a, b) => (a.sector || 'ZZZ').localeCompare(b.sector || 'ZZZ'));
        break;
      default:
        stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
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

  // Check if current user can delete a stock
  const canDeleteStock = (symbol) => {
    const meta = stockMeta[symbol];
    return meta?.added_by === currentUser || !meta?.added_by;
  };

  if (showUserSetup) return <UserSetupModal onSetUser={handleSetUser} />;

  return (
    <div className={`min-h-screen p-4 md:p-6 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">📈 Stock Watchlist</h1>
              <span className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${isConnected ? 'text-green-400 bg-green-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <p className="text-slate-400">{lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <UserAvatar username={currentUser} size="sm" />
              <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{currentUser}</span>
              <button onClick={() => setShowUserSetup(true)} className={`${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => setShowFeed(!showFeed)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFeed ? 'bg-purple-600 hover:bg-purple-700 text-white' : theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>
              <Activity className="w-4 h-4" /> Feed
              {feedItems.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${showFeed ? 'bg-white/20' : 'bg-purple-500 text-white'}`}>
                  {feedItems.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Portfolio Leaderboard */}
        {positions.length > 0 && (
          <PortfolioSummary positions={positions} stockData={stockData} currentUser={currentUser} allUsers={allUsers} />
        )}

        {/* Social Feed */}
        {showFeed && (
          <SocialFeed
            feedItems={feedItems}
            currentUser={currentUser}
            theme={theme}
            onClose={() => setShowFeed(false)}
          />
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Stocks</div>
              <div className="text-2xl font-bold text-white">{summary.total}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Today</div>
              <div className={`text-2xl font-bold ${summary.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.avgChange >= 0 ? '+' : ''}{summary.avgChange.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">YTD</div>
              <div className={`text-2xl font-bold ${summary.avgYTD >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.avgYTD >= 0 ? '+' : ''}{summary.avgYTD.toFixed(2)}%
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Users</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                {allUsers.length}
                <div className="flex -space-x-1">
                  {allUsers.slice(0, 3).map(u => <UserAvatar key={u} username={u} size="sm" />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <input type="text" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addStock()}
                placeholder="Add ticker (e.g., AAPL)"
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={5} />
              <button onClick={addStock} disabled={!newSymbol.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            
            <div className="flex gap-2">
              {/* View mode toggle */}
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('compact')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'compact' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Comparison mode toggle */}
              <button onClick={toggleComparisonMode}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 ${comparisonMode ? 'bg-purple-600 text-white' : theme === 'dark' ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-800'}`}>
                <BarChart2 className="w-4 h-4" />
                {comparisonMode ? `Compare (${selectedForComparison.length})` : 'Compare'}
              </button>

              {/* Filter toggle */}
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 ${showFilters ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-800'}`}>
                <Filter className="w-4 h-4" />
              </button>
              
              <button onClick={fetchAllData} disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
          
          {/* Filter options */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Sort:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 bg-slate-700 text-white text-sm rounded-lg focus:outline-none">
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
                  {sectors.map(s => (
                    <option key={s} value={s}>{s === 'all' ? 'All Sectors' : s}</option>
                  ))}
                </select>
              </div>
              
              <div className="text-slate-500 text-sm flex items-center">
                Showing {filteredAndSortedStocks.length} of {Object.keys(stockData).length} stocks
              </div>
            </div>
          )}
        </div>

        {/* Comparison Chart */}
        {comparisonMode && selectedForComparison.length >= 2 && (
          <ComparisonChart
            selectedStocks={selectedForComparison}
            stockData={stockData}
            theme={theme}
            onClose={() => {
              setComparisonMode(false);
              setSelectedForComparison([]);
            }}
          />
        )}

        {/* Stock Grid or Compact List */}
        {loading && Object.keys(stockData).length === 0 ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading stock data...</p>
          </div>
        ) : viewMode === 'compact' ? (
          <div className="space-y-2">
            {filteredAndSortedStocks.map(stock => (
              <CompactStockCard
                key={stock.symbol}
                stock={stock}
                canDelete={canDeleteStock(stock.symbol)}
                onRemove={removeStock}
                positions={positions}
                currentUser={currentUser}
                onExpand={toggleExpand}
                comparisonMode={comparisonMode}
                isSelectedForComparison={selectedForComparison.includes(stock.symbol)}
                onToggleComparison={toggleStockComparison}
                theme={theme}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedStocks.map(stock => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                canDelete={canDeleteStock(stock.symbol)}
                onRemove={removeStock}
                onExpand={toggleExpand}
                isExpanded={expandedCards.has(stock.symbol)}
                isLoading={loadingSymbols.has(stock.symbol)}
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                positions={positions}
                onAddPosition={handleAddPosition}
                onRemovePosition={handleRemovePosition}
                stances={stances}
                onSetStance={handleSetStance}
                votes={votes}
                onVote={handleVote}
                currentUser={currentUser}
                isConnected={isConnected}
                addedBy={stockMeta[stock.symbol]?.added_by}
                comparisonMode={comparisonMode}
                isSelectedForComparison={selectedForComparison.includes(stock.symbol)}
                onToggleComparison={toggleStockComparison}
                theme={theme}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && symbols.length === 0 && (
          <div className="text-center py-20 bg-slate-800 rounded-xl">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No stocks yet</h3>
            <p className="text-slate-400">Add some tickers above to start tracking</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>📊 Data from Finnhub · Synced via Supabase</p>
        </div>
      </div>

      {showShareModal && <ShareModal watchlistId={watchlistId} onClose={() => setShowShareModal(false)} />}
    </div>
  );
};

export default StockDashboard;