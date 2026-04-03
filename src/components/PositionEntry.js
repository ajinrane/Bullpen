import React, { useState } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { getUserColor } from '../lib/constants';
import { UserAvatar } from './ui';

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

export default PositionEntry;
