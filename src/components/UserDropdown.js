import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sun, Moon, X } from 'lucide-react';
import { UserAvatar } from './ui';

const UserDropdown = ({ currentUser, theme, onSignOut, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: theme === 'dark' ? Sun : Moon, label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', onClick: () => { toggleTheme(); setIsOpen(false); } },
    { divider: true },
    { icon: X, label: 'Sign Out', onClick: () => { onSignOut(); setIsOpen(false); }, danger: true },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:shadow-md"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <UserAvatar username={currentUser} size="sm" />
        <span className="font-medium text-slate-800">{currentUser}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50"
          style={{ background: theme === 'dark' ? '#1e293b' : 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
          {menuItems.map((item, idx) =>
            item.divider ? (<div key={idx} className={`border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`} />) : (
              <button key={idx} onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${item.danger ? 'text-red-500 hover:bg-red-50' : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                <item.icon className="w-4 h-4" />{item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
