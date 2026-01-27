# Stock Watchlist

A collaborative stock tracking app to share with friends. Track positions, compare P&L, and discuss stocks together.

## Quick Start

```bash
npm install
npm start
```

Opens at `http://localhost:3000`

## Features

- 📈 Real-time stock data from Yahoo Finance
- 💰 Track your buy price & shares for P&L
- 🏆 Portfolio leaderboard (compare gains with friends)
- 🐂 Bull/Bear stance voting
- 👍 Upvote/downvote stocks
- 💬 Shared notes on each stock
- 🔗 Shareable watchlist link
- ⚡ Real-time sync via Supabase

## Setup Supabase (for sharing)

To enable real-time sync between you and your friend:

1. Go to [supabase.com](https://supabase.com) and create a project
2. Run the SQL in `SUPABASE_SETUP.md` in the SQL Editor
3. Update the keys in `src/App.js`:

```js
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Deploy to Vercel

```bash
npm run build
npx vercel
```

Then share the link with your friend!
