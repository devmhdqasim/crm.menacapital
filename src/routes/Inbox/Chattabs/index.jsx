import React from 'react';
import { MessageSquare, StickyNote, Info, Timer, UserPlus } from 'lucide-react';
import { useWhatsAppSession } from '../../../hooks/useWhatsAppSession'; // adjust path as needed

const ChatTabs = ({ activeTab, setActiveTab, notesCount, isLeadUnassigned, contactId, contactPhone }) => {
  const { isSessionOpen, formattedTimeLeft, colors } = useWhatsAppSession(contactPhone);

  // Hide Status tab for Sales Agents — only Sales Managers can update status
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.roleName || userInfo.role || '';
  const isSalesAgent = userRole === 'Agent';

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
        {!isSalesAgent && (
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
        )}
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-4 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${
            activeTab === 'assign'
              ? 'text-[#BBA473] border-[#BBA473]'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <UserPlus className="w-4 h-4 inline-block mr-2" />
          Assign
        </button>

        {/* ✅ Real Firebase timer - only renders if session isOpen */}
        {isSessionOpen && formattedTimeLeft && (
          <div className="ml-auto flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border} shadow-lg ${colors.glow}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`}></span>
              </span>
              <Timer className={`w-3.5 h-3.5 ${colors.text}`} />
              <span className={`text-sm font-mono font-bold ${colors.text} tabular-nums tracking-wide`}>
                {formattedTimeLeft}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatTabs;