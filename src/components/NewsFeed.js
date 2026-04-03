import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, ExternalLink, X } from 'lucide-react';
import { fetchCompanyNews } from '../lib/finnhub';

const NewsFeed = ({ symbols, theme, onClose }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('all');

  useEffect(() => {
    const fetchAllNews = async () => {
      setLoading(true);
      const allNews = [];
      for (const symbol of symbols.slice(0, 5)) {
        const symbolNews = await fetchCompanyNews(symbol);
        symbolNews.forEach(item => allNews.push({ ...item, symbol }));
        await new Promise(r => setTimeout(r, 100));
      }
      allNews.sort((a, b) => b.datetime - a.datetime);
      setNews(allNews);
      setLoading(false);
    };
    if (symbols.length > 0) fetchAllNews();
  }, [symbols]);

  const filteredNews = selectedSymbol === 'all' ? news : news.filter(n => n.symbol === selectedSymbol);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <Newspaper className="w-5 h-5" /> Market News
        </h3>
        <div className="flex items-center gap-2">
          <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}
            className={`px-2 py-1 text-sm rounded ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}>
            <option value="all">All Stocks</option>
            {symbols.slice(0, 5).map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <button onClick={onClose} className={`p-1 rounded ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filteredNews.length === 0 ? (
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No news available</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNews.slice(0, 20).map((item, idx) => (
            <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer"
              className={`block p-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
              <div className="flex items-start gap-3">
                {item.image && (
                  <img src={item.image} alt="" className="w-16 h-16 object-cover rounded" onError={(e) => e.target.style.display = 'none'} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">{item.symbol}</span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.source}</span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(item.datetime)}</span>
                  </div>
                  <h4 className={`font-medium text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.headline}</h4>
                  <p className={`text-xs mt-1 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.summary}</p>
                </div>
                <ExternalLink className={`w-4 h-4 flex-shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
