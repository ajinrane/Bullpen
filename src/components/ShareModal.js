import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

const ShareModal = ({ watchlistSlug, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}${window.location.pathname}?watchlist=${watchlistSlug}`;
  const handleCopy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Share2 className="w-5 h-5" /> Share Watchlist</h2>
        <p className="text-slate-400 text-sm mb-4">Anyone with this link can view and collaborate on this watchlist.</p>
        <div className="flex gap-2">
          <input type="text" value={shareUrl} readOnly className="flex-1 px-3 py-2 bg-slate-700 text-white text-sm rounded focus:outline-none" />
          <button onClick={handleCopy} className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">Close</button>
      </div>
    </div>
  );
};

export default ShareModal;
