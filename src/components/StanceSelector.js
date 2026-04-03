import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

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

export default StanceSelector;
