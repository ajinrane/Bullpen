import React from 'react';
import { DollarSign, MessageSquare, Target, Plus, Activity } from 'lucide-react';
import { getUserColor } from '../lib/constants';

const PenActivityFeed = ({ activities, currentUser, theme }) => {
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'position': return <DollarSign className="w-4 h-4" />;
      case 'note': return <MessageSquare className="w-4 h-4" />;
      case 'stance': return <Target className="w-4 h-4" />;
      case 'stock_added': return <Plus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'position': return 'bg-green-500/20 text-green-500';
      case 'note': return 'bg-blue-500/20 text-blue-500';
      case 'stance': return 'bg-purple-500/20 text-purple-500';
      case 'stock_added': return 'bg-cyan-500/20 text-cyan-500';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        <Activity className="w-5 h-5" /> Activity Feed
      </h3>

      {activities.length === 0 ? (
        <p className={`text-center py-6 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          No activity yet. Add stocks and positions to see the feed!
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.slice(0, 20).map((item, idx) => {
            const color = getUserColor(item.username);
            return (
              <div key={idx} className={`flex items-start gap-3 p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(item.type)}`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${color.text}`}>{item.username}</span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.description}
                  </p>
                </div>
                {item.symbol && (
                  <span className={`text-xs font-medium px-2 py-1 rounded ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {item.symbol}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PenActivityFeed;
