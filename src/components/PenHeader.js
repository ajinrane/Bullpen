import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const PenHeader = ({ pen, penCode, onLeavePen, onCopyCode, theme }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(penCode); setCopied(true); setTimeout(() => setCopied(false), 2000); onCopyCode?.(); };

  return (
    <div className={`rounded-xl p-4 mb-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{'\u{1F402}'} {pen.name}</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{pen.members?.length || 1} member{(pen.members?.length || 1) !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}{penCode}
          </button>
          <button onClick={onLeavePen} className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-slate-700 text-slate-400 hover:text-red-400' : 'bg-slate-100 text-slate-500 hover:text-red-500'}`}>Leave</button>
        </div>
      </div>
    </div>
  );
};

export default PenHeader;
