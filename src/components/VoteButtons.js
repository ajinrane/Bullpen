import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const VoteButtons = ({ symbol, votes, currentUser, onVote }) => {
  const stockVotes = votes.filter(v => v.symbol === symbol);
  const myVote = stockVotes.find(v => v.username === currentUser)?.vote;
  const score = stockVotes.reduce((acc, v) => acc + (v.vote === 'up' ? 1 : -1), 0);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onVote(symbol, 'up')}
        className={`p-1 rounded transition-colors ${myVote === 'up' ? 'text-green-400 bg-green-400/20' : 'text-slate-400 hover:text-green-400'}`}>
        <ThumbsUp className="w-4 h-4" />
      </button>
      <span className={`font-bold text-sm min-w-[20px] text-center ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-slate-400'}`}>
        {score > 0 ? '+' : ''}{score}
      </span>
      <button onClick={() => onVote(symbol, 'down')}
        className={`p-1 rounded transition-colors ${myVote === 'down' ? 'text-red-400 bg-red-400/20' : 'text-slate-400 hover:text-red-400'}`}>
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
};

export default VoteButtons;
