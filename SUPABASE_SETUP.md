# Supabase Setup - Full Schema

Run this SQL in your Supabase SQL Editor to set up all the tables.

## Complete SQL Schema

```sql
-- =============================================
-- STOCK WATCHLIST - FULL DATABASE SCHEMA
-- =============================================

-- 1. NOTES TABLE (shared annotations)
CREATE TABLE IF NOT EXISTS stock_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. POSITIONS TABLE (buy prices & shares per user)
CREATE TABLE IF NOT EXISTS stock_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  username TEXT NOT NULL,
  buy_price DECIMAL(12, 4) NOT NULL,
  shares DECIMAL(12, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol, username)
);

-- 3. STANCES TABLE (bull/bear per user per stock)
CREATE TABLE IF NOT EXISTS stock_stances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  username TEXT NOT NULL,
  stance TEXT NOT NULL CHECK (stance IN ('bull', 'bear', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol, username)
);

-- 4. VOTES TABLE (upvote/downvote stocks)
CREATE TABLE IF NOT EXISTS stock_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  username TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol, username)
);

-- 5. STOCK META TABLE (who added which stock)
CREATE TABLE IF NOT EXISTS stock_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE stock_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_stances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_meta ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Anyone can read notes" ON stock_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notes" ON stock_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete notes" ON stock_notes FOR DELETE USING (true);

-- Positions policies
CREATE POLICY "Anyone can read positions" ON stock_positions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert positions" ON stock_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update positions" ON stock_positions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete positions" ON stock_positions FOR DELETE USING (true);

-- Stances policies
CREATE POLICY "Anyone can read stances" ON stock_stances FOR SELECT USING (true);
CREATE POLICY "Anyone can insert stances" ON stock_stances FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stances" ON stock_stances FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stances" ON stock_stances FOR DELETE USING (true);

-- Votes policies
CREATE POLICY "Anyone can read votes" ON stock_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON stock_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON stock_votes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete votes" ON stock_votes FOR DELETE USING (true);

-- Meta policies
CREATE POLICY "Anyone can read meta" ON stock_meta FOR SELECT USING (true);
CREATE POLICY "Anyone can insert meta" ON stock_meta FOR INSERT WITH CHECK (true);

-- =============================================
-- REALTIME
-- =============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE stock_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_stances;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_meta;

-- =============================================
-- INDEXES (for performance)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_notes_watchlist ON stock_notes(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_notes_symbol ON stock_notes(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_watchlist ON stock_positions(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_positions_username ON stock_positions(username);
CREATE INDEX IF NOT EXISTS idx_stances_watchlist ON stock_stances(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_votes_watchlist ON stock_votes(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_meta_watchlist ON stock_meta(watchlist_id);
```

## What Each Table Does

| Table | Purpose |
|-------|---------|
| `stock_notes` | Shared notes/annotations on each stock |
| `stock_positions` | Each user's buy price & shares for P&L tracking |
| `stock_stances` | Bull/Bear/Neutral stance per user per stock |
| `stock_votes` | Upvote/downvote stocks |
| `stock_meta` | Track who added each stock |

## Features This Enables

✅ **Portfolio Tracking**
- Enter your buy price and shares for any stock
- See your P&L (profit/loss) in $ and %
- Leaderboard showing who's up the most

✅ **Social Features**
- See who added each stock
- Bull/Bear stance voting
- Upvote/downvote stocks
- User avatars with unique colors

✅ **Shared Watchlist**
- Shareable link - anyone with the link can collaborate
- Real-time sync - changes appear instantly for everyone
- Notes attached to each stock

## Next Steps

1. Run the SQL above in Supabase SQL Editor
2. Run the app locally:
   ```bash
   npx create-react-app stock-watchlist
   cd stock-watchlist
   npm install recharts lucide-react @supabase/supabase-js
   # Copy the dashboard code to src/App.js
   npm start
   ```
3. Share the link with your friend!
