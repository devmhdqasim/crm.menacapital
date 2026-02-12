import React from 'react';
import { StickyNote, User, X } from 'lucide-react';
import toast from 'react-hot-toast';

const NotesArea = ({ notes, setNotes, newNote, setNewNote, contact }) => {
  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note = {
      id: Date.now(),
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
      author: JSON.parse(localStorage.getItem('userInfo') || '{}').username || 'You',
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${contact.id}`, JSON.stringify(updatedNotes));
    setNewNote('');
    toast.success('Note added');
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${contact.id}`, JSON.stringify(updatedNotes));
    toast.success('Note deleted');
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Note Form */}
      <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[#BBA473]" />
          Add Internal Note
        </h4>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type a note (only visible to your team)..."
          rows="3"
          className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white placeholder-gray-500 resize-none transition-all duration-300 text-sm"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg text-sm font-semibold transition-all duration-300 hover:from-[#d4bc89] hover:to-[#a69363] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <StickyNote className="w-4 h-4" />
            Add Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No notes yet</p>
          <p className="text-gray-500 text-sm mt-2">Add internal notes to track important information</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10 group hover:border-[#BBA473]/30 transition-all duration-300">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{note.author}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(note.timestamp)}</span>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesArea;