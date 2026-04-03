import React, { useState, useEffect } from 'react';
import { Home, LogIn, UserPlus, ChevronDown } from 'lucide-react';
import { getUserColor } from '../lib/constants';

const generatePenCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const PenSelector = ({ currentUser, onSelectPen, onCreatePen, theme }) => {
  const [mode, setMode] = useState('select'); // 'select', 'join', 'create'
  const [penCode, setPenCode] = useState('');
  const [penPassword, setPenPassword] = useState('');
  const [penName, setPenName] = useState('');
  const [error, setError] = useState('');
  const [myPens, setMyPens] = useState([]);

  useEffect(() => {
    // Load user's pens from localStorage
    const storedPens = JSON.parse(localStorage.getItem('bullpen-pens') || '{}');
    const userPens = Object.entries(storedPens)
      .filter(([_, pen]) => pen.members?.includes(currentUser))
      .map(([code, pen]) => ({ code, ...pen }));
    setMyPens(userPens);
  }, [currentUser]);

  const handleJoinPen = () => {
    const storedPens = JSON.parse(localStorage.getItem('bullpen-pens') || '{}');
    const pen = storedPens[penCode.toUpperCase()];

    if (!pen) {
      setError('Pen not found. Check the code and try again.');
      return;
    }
    if (pen.password !== penPassword) {
      setError('Incorrect password.');
      return;
    }

    // Add user to pen
    if (!pen.members.includes(currentUser)) {
      pen.members.push(currentUser);
      storedPens[penCode.toUpperCase()] = pen;
      localStorage.setItem('bullpen-pens', JSON.stringify(storedPens));
    }

    onSelectPen(penCode.toUpperCase(), pen);
  };

  const handleCreatePen = () => {
    if (!penName.trim() || !penPassword.trim()) {
      setError('Please enter a pen name and password.');
      return;
    }

    const code = generatePenCode();
    const newPen = {
      name: penName.trim(),
      password: penPassword,
      creator: currentUser,
      members: [currentUser],
      created_at: new Date().toISOString()
    };

    const storedPens = JSON.parse(localStorage.getItem('bullpen-pens') || '{}');
    storedPens[code] = newPen;
    localStorage.setItem('bullpen-pens', JSON.stringify(storedPens));

    onCreatePen(code, newPen);
  };

  return (
    <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        <Home className="w-5 h-5" /> Your Pens
      </h2>

      {/* List of user's pens */}
      {myPens.length > 0 && mode === 'select' && (
        <div className="space-y-2 mb-4">
          {myPens.map(pen => (
            <button
              key={pen.code}
              onClick={() => onSelectPen(pen.code, pen)}
              className={`w-full p-4 rounded-lg text-left transition-all flex justify-between items-center ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-50 hover:bg-slate-100'}`}
            >
              <div>
                <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{pen.name}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {pen.members?.length || 1} member{(pen.members?.length || 1) !== 1 ? 's' : ''} · Code: {pen.code}
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 rotate-[-90deg] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>
          ))}
        </div>
      )}

      {mode === 'select' && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('join')}
            className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-white"
            style={{ background: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)' }}
          >
            <LogIn className="w-4 h-4" /> Join a Pen
          </button>
          <button
            onClick={() => setMode('create')}
            className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-white"
            style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)' }}
          >
            <UserPlus className="w-4 h-4" /> Create Pen
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="space-y-3">
          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Pen Code</label>
            <input
              type="text"
              value={penCode}
              onChange={(e) => { setPenCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="Enter 6-character code"
              maxLength={6}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
            <input
              type="password"
              value={penPassword}
              onChange={(e) => { setPenPassword(e.target.value); setError(''); }}
              placeholder="Enter pen password"
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setMode('select'); setError(''); }} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
              Back
            </button>
            <button
              onClick={handleJoinPen}
              disabled={!penCode.trim() || !penPassword.trim()}
              className="flex-1 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(180deg, #0A84FF 0%, #007AFF 100%)' }}
            >
              Join Pen
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-3">
          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Pen Name</label>
            <input
              type="text"
              value={penName}
              onChange={(e) => { setPenName(e.target.value); setError(''); }}
              placeholder="e.g., Investment Club"
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Password (for others to join)</label>
            <input
              type="password"
              value={penPassword}
              onChange={(e) => { setPenPassword(e.target.value); setError(''); }}
              placeholder="Create a password"
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'}`}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setMode('select'); setError(''); }} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
              Back
            </button>
            <button
              onClick={handleCreatePen}
              disabled={!penName.trim() || !penPassword.trim()}
              className="flex-1 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(180deg, #34C759 0%, #2DB34B 100%)' }}
            >
              Create Pen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenSelector;
