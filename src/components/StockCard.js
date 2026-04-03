import React from 'react';
import { TrendingUp, TrendingDown, X, ChevronDown, ChevronUp, AlertCircle, DollarSign, MessageSquare, Check } from 'lucide-react';
import { SectorBadge, MiniChart, PerformanceCell, UserAvatar, StanceBadge } from './ui';
import VoteButtons from './VoteButtons';
import LargeChart from './LargeChart';
import StanceSelector from './StanceSelector';
import PositionEntry from './PositionEntry';
import NotesSection from './NotesSection';

const StockCard = ({
  stock, canDelete, onRemove, onExpand, isExpanded, isLoading,
  notes, onAddNote, onDeleteNote,
  positions, onAddPosition, onRemovePosition,
  stances, onSetStance,
  votes, onVote,
  currentUser, isConnected, addedBy,
  comparisonMode, isSelectedForComparison, onToggleComparison, theme
}) => {
  const isPositive = (stock.change || 0) >= 0;
  const formatCurrency = (v) => v === null || v === undefined ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const formatLargeNumber = (v) => {
    if (!v) return '—';
    if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    return v.toLocaleString();
  };

  const stockNotes = notes.filter(n => n.symbol === stock.symbol);
  const stockPositions = positions.filter(p => p.symbol === stock.symbol);
  const myPosition = stockPositions.find(p => p.username === currentUser);
  const myStance = stances.find(s => s.symbol === stock.symbol && s.username === currentUser)?.stance;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${isLoading ? 'opacity-60' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: comparisonMode && isSelectedForComparison ? '2px solid #AF52DE' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            {comparisonMode && (
              <button onClick={() => onToggleComparison(stock.symbol)}
                className="w-6 h-6 rounded-lg flex items-center justify-center mt-1 transition-all"
                style={{ background: isSelectedForComparison ? 'linear-gradient(180deg, #AF52DE 0%, #9B47C5 100%)' : 'rgba(60,60,67,0.12)', border: isSelectedForComparison ? 'none' : '1.5px solid rgba(118,118,128,0.2)' }}>
                {isSelectedForComparison && <Check className="w-4 h-4 text-white" />}
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-semibold text-slate-800" style={{ letterSpacing: '-0.02em' }}>{stock.symbol}</h2>
                <VoteButtons symbol={stock.symbol} votes={votes} currentUser={currentUser} onVote={onVote} />
              </div>
              <div className="text-sm mb-2 line-clamp-1 text-slate-500">{stock.shortName}</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <SectorBadge sector={stock.sector} />
                {myStance && <StanceBadge stance={myStance} />}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {canDelete && !comparisonMode && (
              <button onClick={() => onRemove(stock.symbol)} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                <X className="w-4 h-4" />
              </button>
            )}
            {addedBy && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <UserAvatar username={addedBy} size="sm" />
                <span>{addedBy}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-3xl font-semibold text-slate-800" style={{ letterSpacing: '-0.02em' }}>{formatCurrency(stock.price)}</div>
          <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">{isPositive ? '+' : ''}{formatCurrency(stock.change)}</span>
            <span className="px-2 py-0.5 rounded-full text-sm font-medium" style={{ background: isPositive ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)' }}>
              {isPositive ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
            </span>
          </div>
          {stock.apiWarning && (
            <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs">
              <AlertCircle className="w-3 h-3" />{stock.apiWarning}
            </div>
          )}
        </div>

        {myPosition && (
          <div className={`p-2 rounded mb-3 ${(stock.price - myPosition.buy_price) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Your P/L:</span>
              <span className={`font-bold ${(stock.price - myPosition.buy_price) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(stock.price - myPosition.buy_price) >= 0 ? '+' : ''}
                {formatCurrency((stock.price - myPosition.buy_price) * myPosition.shares)}
                {' '}({(((stock.price - myPosition.buy_price) / myPosition.buy_price) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        <MiniChart data={stock.historicalData} isPositive={isPositive} />

        <div className="grid grid-cols-5 gap-1 mt-3 text-center text-xs">
          {['1W', '1M', '3M', 'YTD', '1Y'].map(period => (
            <div key={period}>
              <div className="text-slate-400">{period}</div>
              <PerformanceCell value={stock.performance?.[period]} />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3 text-xs">
          {stockNotes.length > 0 && (
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {stockNotes.length}
            </span>
          )}
          {stockPositions.length > 0 && (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> {stockPositions.length}
            </span>
          )}
        </div>

        <button onClick={() => onExpand(stock.symbol)}
          className="w-full mt-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 rounded">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isExpanded ? 'Less' : 'More Details'}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700 p-5 bg-slate-850 space-y-4">
          <LargeChart data={stock.historicalData} symbol={stock.symbol} />
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Key Stats</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Market Cap</span><span className="text-white">{formatLargeNumber(stock.marketCap)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Day High</span><span className="text-white">{formatCurrency(stock.dayHigh)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Day Low</span><span className="text-white">{formatCurrency(stock.dayLow)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Prev Close</span><span className="text-white">{formatCurrency(stock.previousClose)}</span></div>
            </div>
          </div>
          <StanceSelector symbol={stock.symbol} stances={stances} currentUser={currentUser} onSetStance={onSetStance} />
          <PositionEntry symbol={stock.symbol} positions={positions} currentPrice={stock.price}
            currentUser={currentUser} onAddPosition={onAddPosition} onRemovePosition={onRemovePosition} />
          <NotesSection symbol={stock.symbol} notes={notes} onAddNote={onAddNote}
            onDeleteNote={onDeleteNote} currentUser={currentUser} isConnected={isConnected} />
        </div>
      )}
    </div>
  );
};

export default StockCard;
