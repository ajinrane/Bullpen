import React, { useState } from 'react';
import { X } from 'lucide-react';

const HelpModal = ({ onClose, theme }) => {
  const [activeTab, setActiveTab] = useState('how');

  const tabs = [
    { id: 'how', label: 'How It Works' },
    { id: 'positions', label: 'Positions' },
    { id: 'stances', label: 'Stances' },
    { id: 'invite', label: 'Inviting' },
    { id: 'faq', label: 'FAQ' },
  ];

  const content = {
    how: (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
          <div>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Add Stocks</h4>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Add ticker symbols to your watchlist to track prices in real-time.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">2</div>
          <div>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Track Positions</h4>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Add your buy price and shares to see your P/L and compete on the leaderboard.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">3</div>
          <div>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Compete & Collaborate</h4>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>See how your portfolio ranks, share notes, and track what others are bullish on.</p>
          </div>
        </div>
      </div>
    ),
    positions: (
      <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
        <p className="mb-3">Track your positions to see real-time profit/loss:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Click on a stock card and expand "More Details"</li>
          <li>Add your buy price and number of shares</li>
          <li>See your P/L update as prices change</li>
          <li>Your total return determines your leaderboard rank</li>
        </ul>
      </div>
    ),
    stances: (
      <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
        <p className="mb-3">Share your outlook on each stock:</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded font-medium">Bullish</span>
            <span>You expect the stock to go up</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-500/20 text-slate-500 rounded font-medium">Neutral</span>
            <span>No strong opinion</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded font-medium">Bearish</span>
            <span>You expect the stock to go down</span>
          </div>
        </div>
      </div>
    ),
    invite: (
      <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
        <p className="mb-3">Invite friends to collaborate:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Click the "Share" button in the header</li>
          <li>Copy the unique watchlist link</li>
          <li>Send it to your friends</li>
          <li>They'll join the same watchlist and can add positions</li>
        </ol>
        <p className="mt-4 p-3 bg-blue-500/10 text-blue-500 rounded-lg text-sm">
          Everyone with the link can view and contribute to the watchlist!
        </p>
      </div>
    ),
    faq: (
      <div className="space-y-4">
        <div>
          <h4 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Where does the data come from?</h4>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Stock prices are fetched from Finnhub API in real-time.</p>
        </div>
        <div>
          <h4 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Is my data saved?</h4>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Yes! All data is synced via Supabase and persists across sessions.</p>
        </div>
        <div>
          <h4 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Can I use real money here?</h4>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>No, this is for tracking only. No actual trading happens.</p>
        </div>
      </div>
    ),
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        style={{ background: theme === 'dark' ? '#1e293b' : 'white' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Help & Info</h2>
          <button onClick={onClose} className={`p-1 rounded hover:bg-slate-200 ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : ''}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b overflow-x-auto" style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {content[activeTab]}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
