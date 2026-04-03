// ============================================
// Finnhub API client with caching layer
// ============================================

const FINNHUB_API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

if (!FINNHUB_API_KEY && process.env.NODE_ENV === 'production') {
  console.error('[Bullpen] REACT_APP_FINNHUB_API_KEY is not set. Stock data will use mock values.');
} else if (!FINNHUB_API_KEY) {
  console.warn('[Bullpen] REACT_APP_FINNHUB_API_KEY is not set. Stock data will use mock values.');
}

// ---- Cache layer ----
const CACHE_PREFIX = 'bullpen_cache_';
const QUOTE_TTL = 5 * 60 * 1000;       // 5 minutes
const HISTORY_TTL = 60 * 60 * 1000;     // 1 hour
const PROFILE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const NEWS_TTL = 15 * 60 * 1000;        // 15 minutes

const memoryCache = new Map();

function getCached(key, ttl) {
  const memEntry = memoryCache.get(key);
  if (memEntry && Date.now() - memEntry.ts < ttl) return memEntry.data;

  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      const entry = JSON.parse(stored);
      if (Date.now() - entry.ts < ttl) {
        memoryCache.set(key, entry);
        return entry.data;
      }
    }
  } catch (e) { /* ignore */ }

  return null;
}

function setCache(key, data) {
  const entry = { data, ts: Date.now() };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) { /* localStorage full, fine */ }
}

// Return stale cached data (any age) as last-resort fallback
function getStaleCached(key) {
  const memEntry = memoryCache.get(key);
  if (memEntry) return memEntry.data;
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (stored) return JSON.parse(stored).data;
  } catch (e) { /* ignore */ }
  return null;
}

// ---- API ----
class APILimitError extends Error {
  constructor(status) {
    super(`API limit or auth error: ${status}`);
    this.status = status;
    this.name = 'APILimitError';
  }
}

const fetchFinnhub = async (endpoint) => {
  if (!FINNHUB_API_KEY) throw new APILimitError(401);
  const url = `https://finnhub.io/api/v1${endpoint}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);

  if (response.status === 403 || response.status === 429 || response.status === 401) {
    throw new APILimitError(response.status);
  }
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

// ---- Mock data generation ----
export const generateMockHistory = (symbol, currentPrice = 150) => {
  let price = currentPrice;
  const dataPoints = [];
  for (let i = 0; i <= 1260; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dataPoints.push({ date: date.toISOString().split('T')[0], price });
    price = price / (1 + (Math.random() - 0.48) * 0.03);
  }
  return dataPoints.reverse();
};

const buildMockQuote = (symbol) => {
  const mockPrice = 100 + Math.random() * 200;
  return {
    symbol,
    shortName: symbol,
    longName: symbol,
    price: mockPrice,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    previousClose: mockPrice * 0.99,
    dayHigh: mockPrice * 1.02,
    dayLow: mockPrice * 0.98,
    open: mockPrice * 0.995,
    yearHigh: mockPrice * 1.2,
    yearLow: mockPrice * 0.8,
    marketCap: null, sector: null, industry: null, logo: null,
    pe: null, eps: null, dividend: null, beta: null,
    targetMeanPrice: null, targetHighPrice: null, targetLowPrice: null,
    recommendationKey: null, recommendationMean: null, numberOfAnalystOpinions: 0,
    apiWarning: 'API limit reached - showing demo data',
  };
};

// ---- Public API (cached) ----

export const fetchStockQuote = async (symbol) => {
  // Check cache first
  const cached = getCached(`quote:${symbol}`, QUOTE_TTL);
  if (cached) return cached;

  try {
    const [quote, profile] = await Promise.all([
      fetchFinnhub(`/quote?symbol=${symbol}`),
      fetchFinnhub(`/stock/profile2?symbol=${symbol}`).catch(() =>
        getCached(`profile:${symbol}`, PROFILE_TTL)
      )
    ]);

    if (!quote || quote.c === 0) {
      console.error(`No data for ${symbol}`);
      return getStaleCached(`quote:${symbol}`) || null;
    }

    // Cache the profile separately (long TTL)
    if (profile && profile.name) setCache(`profile:${symbol}`, profile);

    const result = {
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
      pe: null, eps: null, dividend: null, beta: null,
      targetMeanPrice: null, targetHighPrice: null, targetLowPrice: null,
      recommendationKey: null, recommendationMean: null, numberOfAnalystOpinions: 0,
      apiWarning: null,
    };

    setCache(`quote:${symbol}`, result);
    return result;
  } catch (error) {
    if (error.name === 'APILimitError') {
      console.warn(`[Bullpen] API limit for ${symbol}, checking cache...`);
      // Try stale cache before mock data
      const stale = getStaleCached(`quote:${symbol}`);
      if (stale) {
        return { ...stale, apiWarning: 'Using cached data (API limit reached)' };
      }
      return buildMockQuote(symbol);
    }
    console.error(`Error fetching quote for ${symbol}:`, error);
    return getStaleCached(`quote:${symbol}`) || null;
  }
};

export const fetchHistoricalData = async (symbol, currentPrice = 150) => {
  const cached = getCached(`history:${symbol}`, HISTORY_TTL);
  if (cached) return cached;

  try {
    const now = Math.floor(Date.now() / 1000);
    const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60);
    const data = await fetchFinnhub(`/stock/candle?symbol=${symbol}&resolution=D&from=${fiveYearsAgo}&to=${now}`);

    if (data.s !== 'ok' || !data.c || !data.t) {
      const mock = generateMockHistory(symbol, currentPrice);
      setCache(`history:${symbol}`, mock);
      return mock;
    }

    const history = data.t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      price: data.c[i],
    })).filter(d => d.price > 0);

    const result = history.length > 0 ? history : generateMockHistory(symbol, currentPrice);
    setCache(`history:${symbol}`, result);
    return result;
  } catch (error) {
    if (error.name === 'APILimitError') {
      console.warn(`[Bullpen] API limit for ${symbol} history, using cache/mock`);
      const stale = getStaleCached(`history:${symbol}`);
      if (stale) return stale;
    }
    return generateMockHistory(symbol, currentPrice);
  }
};

export const calculatePerformance = (historicalData, currentPrice) => {
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
  const yearAgoPrice = getPrice(252);
  return {
    '1W': ((currentPrice - getPrice(5)) / getPrice(5)) * 100,
    '1M': ((currentPrice - getPrice(22)) / getPrice(22)) * 100,
    '3M': ((currentPrice - getPrice(66)) / getPrice(66)) * 100,
    'YTD': ((currentPrice - ytdPrice) / ytdPrice) * 100,
    '1Y': ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100
  };
};

export const fetchCompanyNews = async (symbol) => {
  const cached = getCached(`news:${symbol}`, NEWS_TTL);
  if (cached) return cached;

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = weekAgo.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];
    const data = await fetchFinnhub(`/company-news?symbol=${symbol}&from=${from}&to=${to}`);
    const result = Array.isArray(data) ? data.slice(0, 10) : [];
    setCache(`news:${symbol}`, result);
    return result;
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return getStaleCached(`news:${symbol}`) || [];
  }
};
