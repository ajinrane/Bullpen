import React from 'react';
import { X, Users, Check } from 'lucide-react';
import { SectorBadge, MiniChart } from './ui';

const CompactStockCard = ({
  stock, canDelete, onRemove, positions, currentUser, onExpand,
  comparisonMode, isSelectedForComparison, onToggleComparison, theme
}) => {
  const isPositive = (stock.change || 0) >= 0;
  const stockPositions = positions.filter(p => p.symbol === stock.symbol);
  const myPosition = stockPositions.find(p => p.username === currentUser);
  const formatCurrency = (v) => v === null || v === undefined ? '—' : `$${v.toFixed(2)}`;

  const handleClick = () => {
    if (comparisonMode) onToggleComparison(stock.symbol);
    else onExpand(stock.symbol);
  };

  return (
    <div className={`rounded-lg p-3 transition-all cursor-pointer ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white hover:bg-slate-50 shadow'} ${comparisonMode && isSelectedForComparison ? 'ring-2 ring-purple-500' : ''}`}
      onClick={handleClick}>
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
            <Users className="w-3 h-3" />{stockPositions.length}
          </div>
          {canDelete && !comparisonMode && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(stock.symbol); }}
              className="text-slate-500 hover:text-red-400 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactStockCard;
