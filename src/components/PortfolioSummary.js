import React, { useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { getUserColor } from '../lib/constants';
import { UserAvatar } from './ui';

const PortfolioSummary = ({ positions, stockData, currentUser, allUsers, onAddPositionCTA, theme }) => {
  const userPortfolios = useMemo(() => {
    const portfolios = {};
    allUsers.forEach(user => {
      const userPositions = positions.filter(p => p.username === user);
      let totalCost = 0, totalValue = 0;
      userPositions.forEach(pos => {
        const stock = stockData[pos.symbol];
        if (stock) { totalCost += pos.buy_price * pos.shares; totalValue += stock.price * pos.shares; }
      });
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      portfolios[user] = { totalCost, totalValue, totalGainLoss, totalGainLossPercent, positionCount: userPositions.length };
    });
    return portfolios;
  }, [positions, stockData, allUsers]);

  const sortedUsers = [...allUsers].sort((a, b) => (userPortfolios[b]?.totalGainLossPercent || 0) - (userPortfolios[a]?.totalGainLossPercent || 0));
  const getMedal = (index) => { if (index === 0) return '\u{1F947}'; if (index === 1) return '\u{1F948}'; if (index === 2) return '\u{1F949}'; return `#${index + 1}`; };
  const myPortfolio = userPortfolios[currentUser];
  const myRank = sortedUsers.filter(u => userPortfolios[u]?.positionCount > 0).indexOf(currentUser) + 1;
  const hasPositions = myPortfolio?.positionCount > 0;

  return (
    <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="mb-6 p-5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Your Performance</h3>
            <div className="flex items-center gap-2"><UserAvatar username={currentUser} size="md" /><span className="font-bold text-xl">{currentUser}</span></div>
          </div>
          {hasPositions && (<div className="text-right"><div className="text-white/80 text-sm">Rank</div><div className="text-3xl font-bold">{getMedal(myRank - 1)}</div></div>)}
        </div>
        {hasPositions ? (
          <div className="grid grid-cols-3 gap-4">
            <div><div className="text-white/70 text-xs mb-1">Portfolio Value</div><div className="text-xl font-bold">${myPortfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
            <div><div className="text-white/70 text-xs mb-1">Total P/L</div><div className={`text-xl font-bold ${myPortfolio.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>{myPortfolio.totalGainLoss >= 0 ? '+' : ''}${myPortfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
            <div><div className="text-white/70 text-xs mb-1">Return</div><div className={`text-xl font-bold ${myPortfolio.totalGainLossPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>{myPortfolio.totalGainLossPercent >= 0 ? '+' : ''}{myPortfolio.totalGainLossPercent.toFixed(2)}%</div></div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-white/80 mb-3">Start tracking your positions to compete on the leaderboard!</p>
            <button onClick={onAddPositionCTA} className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-white/90 transition-colors"><Plus className="w-4 h-4 inline mr-2" />Add Your First Position</button>
          </div>
        )}
      </div>
      <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}><Users className="w-5 h-5" /> Leaderboard</h2>
      <div className="space-y-3">
        {sortedUsers.map((user, index) => {
          const portfolio = userPortfolios[user];
          if (!portfolio || portfolio.positionCount === 0) return null;
          const isProfit = portfolio.totalGainLossPercent >= 0;
          const color = getUserColor(user);
          const isCurrentUser = user === currentUser;
          return (
            <div key={user} className={`flex items-center justify-between p-4 rounded-lg transition-all ${isCurrentUser ? 'ring-2 ring-blue-500' : ''} ${theme === 'dark' ? (isCurrentUser ? color.light : 'bg-slate-700') : (isCurrentUser ? 'bg-blue-50' : 'bg-slate-50')}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold w-10 text-center">{getMedal(index)}</span>
                <UserAvatar username={user} size="md" />
                <div>
                  <span className={`font-semibold ${isCurrentUser ? color.text : theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{user}</span>
                  {isCurrentUser && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">You</span>}
                  <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{portfolio.positionCount} position{portfolio.positionCount !== 1 ? 's' : ''} · ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%</div>
                <div className={`text-xs ${isProfit ? 'text-green-400' : 'text-red-400'}`}>{isProfit ? '+' : ''}${portfolio.totalGainLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          );
        })}
        {sortedUsers.filter(u => userPortfolios[u]?.positionCount > 0).length === 0 && (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium mb-2">No positions tracked yet</p><p className="text-sm">Add your buy prices to compete on the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioSummary;
