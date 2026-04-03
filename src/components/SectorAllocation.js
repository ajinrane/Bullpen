import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, X } from 'lucide-react';
import { SECTOR_COLORS } from '../lib/constants';

const SectorAllocation = ({ stockData, positions, currentUser, theme, onClose }) => {
  const sectorData = useMemo(() => {
    const userPositions = positions.filter(p => p.username === currentUser);
    const sectorValues = {};

    userPositions.forEach(pos => {
      const stock = stockData[pos.symbol];
      if (stock) {
        const sector = stock.sector || 'Unknown';
        const value = stock.price * pos.shares;
        sectorValues[sector] = (sectorValues[sector] || 0) + value;
      }
    });

    if (Object.keys(sectorValues).length === 0) {
      Object.values(stockData).forEach(stock => {
        const sector = stock.sector || 'Unknown';
        sectorValues[sector] = (sectorValues[sector] || 0) + 1;
      });
    }

    return Object.entries(sectorValues)
      .map(([name, value]) => ({ name, value, color: SECTOR_COLORS[name] || SECTOR_COLORS['Unknown'] }))
      .sort((a, b) => b.value - a.value);
  }, [stockData, positions, currentUser]);

  const total = sectorData.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <PieChartIcon className="w-5 h-5" /> Sector Allocation
        </h3>
        <button onClick={onClose} className={`p-1 rounded ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
              {sectorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }}
              formatter={(value, name) => [`${((value / total) * 100).toFixed(1)}%`, name]} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2">
          {sectorData.map((sector, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>{sector.name}</span>
              </div>
              <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {((sector.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectorAllocation;
