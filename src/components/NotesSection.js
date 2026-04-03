import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, Wifi, WifiOff } from 'lucide-react';
import { getUserColor } from '../lib/constants';
import { UserAvatar } from './ui';

const NotesSection = ({ symbol, notes, onAddNote, onDeleteNote, currentUser, isConnected }) => {
  const [newNote, setNewNote] = useState('');
  const stockNotes = notes.filter(n => n.symbol === symbol);

  const handleSubmit = () => {
    if (!newNote.trim()) return;
    onAddNote(symbol, newNote.trim());
    setNewNote('');
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Notes
        {isConnected ? (
          <span className="flex items-center gap-1 text-green-400 text-xs"><Wifi className="w-3 h-3" /> Live</span>
        ) : (
          <span className="flex items-center gap-1 text-yellow-400 text-xs"><WifiOff className="w-3 h-3" /> Offline</span>
        )}
      </h3>

      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {stockNotes.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No notes yet</p>
        ) : (
          stockNotes.map(note => {
            const color = getUserColor(note.author);
            return (
              <div key={note.id} className={`${color.light} rounded p-2 group`}>
                <div className="flex justify-between items-start">
                  <p className="text-white text-sm">{note.text}</p>
                  {note.author === currentUser && (
                    <button onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <UserAvatar username={note.author} size="sm" />
                  <span className={color.text}>{note.author}</span>
                  <span>·</span>
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Add a note..."
          className="flex-1 px-3 py-2 bg-slate-700 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button onClick={handleSubmit} disabled={!newNote.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotesSection;
