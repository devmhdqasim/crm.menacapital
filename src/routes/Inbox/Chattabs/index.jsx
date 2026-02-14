import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, StickyNote, Info, Timer } from 'lucide-react';

// Generate a deterministic random timer (in seconds) from a contact id, max 24hrs
const getSeededTimer = (id) => {
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % (24 * 60 * 60);
};

const formatCountdown = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getTimerColor = (totalSeconds) => {
  const hours = totalSeconds / 3600;
  if (hours < 1) return { text: 'text-red-400', bg: 'from-red-500/15 to-red-600/15', border: 'border-red-500/30', dot: 'bg-red-500', glow: 'shadow-red-500/20' };
  if (hours < 6) return { text: 'text-orange-400', bg: 'from-orange-500/15 to-orange-600/15', border: 'border-orange-500/30', dot: 'bg-orange-500', glow: 'shadow-orange-500/20' };
  return { text: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-600/15', border: 'border-emerald-500/30', dot: 'bg-emerald-500', glow: 'shadow-emerald-500/20' };
};

const ChatTabs = ({ activeTab, setActiveTab, notesCount, isLeadUnassigned, contactId }) => {
  const initialSeconds = useMemo(() => getSeededTimer(contactId), [contactId]);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(getSeededTimer(contactId));
  }, [contactId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [contactId]);

  const colors = getTimerColor(seconds);

  return (
    <div className="bg-[#1A1A1A] border-b border-[#BBA473]/20 px-5 flex-shrink-0">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
            activeTab === 'chat'
              ? 'text-[#BBA473] border-[#BBA473]'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline-block mr-2" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-300 border-b-2 relative ${
            activeTab === 'notes'
              ? 'text-[#BBA473] border-[#BBA473]'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <StickyNote className="w-4 h-4 inline-block mr-2" />
          Notes
          {notesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BBA473] text-black rounded-full text-xs flex items-center justify-center font-bold">
              {notesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => !isLeadUnassigned && setActiveTab('status')}
          disabled={isLeadUnassigned}
          title={isLeadUnassigned ? 'Lead must be assigned to an agent before updating status' : ''}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
            isLeadUnassigned
              ? 'text-gray-600 border-transparent cursor-not-allowed opacity-50'
              : activeTab === 'status'
                ? 'text-[#BBA473] border-[#BBA473]'
                : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <Info className="w-4 h-4 inline-block mr-2" />
          Status
        </button>

        {/* Timer - pushed to the right */}
        <div className="ml-auto flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border} shadow-lg ${colors.glow}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`}></span>
            </span>
            <Timer className={`w-3.5 h-3.5 ${colors.text}`} />
            <span className={`text-sm font-mono font-bold ${colors.text} tabular-nums tracking-wide`}>
              {formatCountdown(seconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTabs;