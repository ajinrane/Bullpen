-- ============================================
-- BULLPEN: Auth + Row Level Security Migration
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles RLS: authenticated users can read profiles, only update their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. WATCHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 8-char shareable code
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Anyone can view watchlists they're a member of
CREATE POLICY "Watchlists viewable by members"
  ON public.watchlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- ============================================
-- 3. WATCHLIST MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.watchlist_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL, -- Per-watchlist display name (shown on leaderboard)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(watchlist_id, user_id)
);

ALTER TABLE public.watchlist_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members of their watchlists"
  ON public.watchlist_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlist_members wm
      WHERE wm.watchlist_id = watchlist_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join watchlists"
  ON public.watchlist_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can leave watchlists"
  ON public.watchlist_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own membership"
  ON public.watchlist_members FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 4. WATCHLIST STOCKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.watchlist_stocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol)
);

ALTER TABLE public.watchlist_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stocks viewable by watchlist members"
  ON public.watchlist_stocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = watchlist_stocks.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add stocks"
  ON public.watchlist_stocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = watchlist_stocks.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Stock adder can remove it"
  ON public.watchlist_stocks FOR DELETE
  USING (added_by = auth.uid());

-- ============================================
-- 5. POSITIONS TABLE (PRIVATE - core privacy feature)
-- ============================================
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  shares DECIMAL(18, 8) NOT NULL,
  avg_cost DECIMAL(18, 4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, watchlist_id, symbol)
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Only the owner can see their own positions (shares, avg_cost)
CREATE POLICY "Users can only view their own positions"
  ON public.positions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can only insert their own positions"
  ON public.positions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only update their own positions"
  ON public.positions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can only delete their own positions"
  ON public.positions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 6. LEADERBOARD VIEW (PUBLIC % only, no $ amounts)
-- ============================================
-- This function calculates performance % without exposing position details
CREATE OR REPLACE FUNCTION public.get_watchlist_leaderboard(p_watchlist_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  position_count INTEGER,
  total_return_pct DECIMAL(10, 2)
) AS $$
BEGIN
  -- Verify caller is a member of this watchlist
  IF NOT EXISTS (
    SELECT 1 FROM public.watchlist_members
    WHERE watchlist_id = p_watchlist_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this watchlist';
  END IF;

  RETURN QUERY
  SELECT
    wm.user_id,
    wm.display_name, -- Use display_name from watchlist_members, not profiles
    COALESCE(pos_stats.position_count, 0)::INTEGER as position_count,
    COALESCE(pos_stats.total_return_pct, 0.00)::DECIMAL(10,2) as total_return_pct
  FROM public.watchlist_members wm
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::INTEGER as position_count,
      -- Calculate weighted average return % (no dollar amounts exposed)
      CASE
        WHEN SUM(pos.shares * pos.avg_cost) > 0
        THEN (SUM(pos.shares * pos.avg_cost * 0.05) / SUM(pos.shares * pos.avg_cost) * 100) -- placeholder: replace with real price lookup
        ELSE 0
      END as total_return_pct
    FROM public.positions pos
    WHERE pos.user_id = wm.user_id AND pos.watchlist_id = p_watchlist_id
  ) pos_stats ON true
  WHERE wm.watchlist_id = p_watchlist_id
  ORDER BY pos_stats.total_return_pct DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. NOTES TABLE (visible to watchlist members)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes viewable by watchlist members"
  ON public.notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = notes.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add notes"
  ON public.notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = notes.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 8. STANCES TABLE (bull/bear/neutral)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stance TEXT CHECK (stance IN ('bullish', 'bearish', 'neutral')) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol, user_id)
);

ALTER TABLE public.stances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stances viewable by watchlist members"
  ON public.stances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = stances.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can set stances"
  ON public.stances FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.watchlist_members
      WHERE watchlist_id = stances.watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own stances"
  ON public.stances FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 9. INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_watchlists_code ON public.watchlists(code);
CREATE INDEX IF NOT EXISTS idx_positions_user_watchlist ON public.positions(user_id, watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_members_user ON public.watchlist_members(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_members_watchlist ON public.watchlist_members(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_members_user_watchlist ON public.watchlist_members(user_id, watchlist_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_watchlist ON public.watchlist_stocks(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_notes_watchlist ON public.notes(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_stances_watchlist ON public.stances(watchlist_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
