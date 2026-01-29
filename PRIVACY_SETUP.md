# Bullpen Privacy Setup Guide

## Overview
This guide covers setting up proper privacy with Supabase Auth + Row Level Security (RLS).

## What's Implemented

### 1. Environment Variables
- **Files Created:**
  - `.env.example` - Template for environment variables
  - `.env.local` - Local development values (gitignored)

- **Variables:**
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`
  - `REACT_APP_FINNHUB_API_KEY`

### 2. Database Schema (RLS)
- **File:** `supabase/migrations/001_auth_and_rls.sql`

| Table | Privacy Level | Who Can Read | Who Can Write |
|-------|--------------|--------------|---------------|
| `profiles` | Public | Everyone | Only owner |
| `watchlists` | Members only | Watchlist members | Creator |
| `watchlist_members` | Members only | Watchlist members | Self (join/leave) |
| `watchlist_stocks` | Members only | Watchlist members | Members (add), Adder (delete) |
| `positions` | **PRIVATE** | **Only owner** | **Only owner** |
| `notes` | Members only | Watchlist members | Author |
| `stances` | Members only | Watchlist members | Author |

### 3. Leaderboard Privacy
- Uses `get_watchlist_leaderboard()` function
- Shows ONLY:
  - Username
  - Position count
  - Total return %
- Does NOT expose:
  - Dollar amounts
  - Share counts
  - Average costs

### 4. Auth Components
- **Files Created:**
  - `src/contexts/AuthContext.js` - Auth state management
  - `src/components/AuthModal.js` - Sign in/up UI

---

## Setup Checklist

### Vercel Deployment
- [ ] Add `REACT_APP_SUPABASE_URL` to Vercel env vars
- [ ] Add `REACT_APP_SUPABASE_ANON_KEY` to Vercel env vars
- [ ] Add `REACT_APP_FINNHUB_API_KEY` to Vercel env vars

### Supabase Setup
- [ ] Go to Supabase Dashboard > SQL Editor
- [ ] Run `supabase/migrations/001_auth_and_rls.sql`
- [ ] Enable Email Auth in Authentication > Providers
- [ ] Configure email templates (optional)
- [ ] Set Site URL in Authentication > URL Configuration

### Code Integration
- [ ] Update `src/index.js` to wrap App with `AuthProvider`
- [ ] Replace `UserSetupModal` with `AuthModal`
- [ ] Update all Supabase queries to use authenticated client
- [ ] Test RLS policies are working

---

## Testing RLS Policies

### Test 1: Position Privacy
```sql
-- As user A, insert a position
INSERT INTO positions (user_id, watchlist_id, symbol, shares, avg_cost)
VALUES ('user-a-id', 'watchlist-id', 'AAPL', 100, 150.00);

-- As user B, try to read user A's position (should fail)
SELECT * FROM positions WHERE user_id = 'user-a-id';
-- Result: 0 rows (RLS blocks access)
```

### Test 2: Leaderboard Shows % Only
```sql
-- This should return username and % only, not $ amounts
SELECT * FROM get_watchlist_leaderboard('watchlist-id');
```

---

## Security Notes

1. **Never commit `.env.local`** - It's gitignored but double-check
2. **API keys in code** - Removed from App.js, now uses `process.env`
3. **Supabase anon key is safe** - RLS protects data, anon key just identifies the app
4. **Positions are 100% private** - Only the owner can see shares, avg_cost
5. **Leaderboard is safe** - Only shows performance %, no sensitive data

---

## Files Changed

1. `src/App.js` - Uses env vars for config
2. `.env.example` - Template file (commit this)
3. `.env.local` - Actual values (gitignored)
4. `.gitignore` - Already ignores .env.local
5. `supabase/migrations/001_auth_and_rls.sql` - Database setup
6. `src/contexts/AuthContext.js` - Auth state
7. `src/components/AuthModal.js` - Auth UI
