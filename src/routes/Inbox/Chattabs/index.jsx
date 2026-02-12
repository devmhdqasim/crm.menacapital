import React from 'react';
import { MessageSquare, StickyNote, Info } from 'lucide-react';

const ChatTabs = ({ activeTab, setActiveTab, notesCount }) => {
  return (
    <div className="bg-[#1A1A1A] border-b border-[#BBA473]/20 px-5 flex-shrink-0">
      <div className="flex gap-1">
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
          onClick={() => setActiveTab('status')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
            activeTab === 'status'
              ? 'text-[#BBA473] border-[#BBA473]'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <Info className="w-4 h-4 inline-block mr-2" />
          Status
        </button>
      </div>
    </div>
  );
};

export default ChatTabs;