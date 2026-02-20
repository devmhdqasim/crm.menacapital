import React, { useState } from 'react';
import { X, Search, Bell, Info, Phone, ChevronLeft, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useWhatsAppSession } from '../../../hooks/useWhatsAppSession';

const ChatHeader = ({
  contact,
  isConnected,
  showMessageSearch,
  setShowMessageSearch,
  setShowReminderModal,
  showProfileSidebar,
  setShowProfileSidebar,
  onClose,
  messageSearchQuery,
  setMessageSearchQuery,
  searchResults,
  currentSearchIndex,
  activeTab,
  handleMessageSearch,
  navigateSearch,
  messages = [],
}) => {
  const { isSessionOpen, formattedTimeLeft } = useWhatsAppSession(contact?.phone);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Detect if text contains Arabic/RTL characters
  const hasArabic = (text) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  const handleDownloadPdf = () => {
    if (!messages.length || isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const addNewPageIfNeeded = (neededHeight = 12) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Filter: only text messages (skip media, templates, etc.)
      const textMessages = messages.filter((msg) => {
        const type = (msg.type || 'text').toLowerCase();
        if (type !== 'text' && type !== 'template') return false;
        if (msg.isTemplate) return false;
        if (msg.mediaUrl && !msg.text) return false;
        return true;
      });

      // Header background
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Gold accent line
      doc.setFillColor(187, 164, 115);
      doc.rect(0, 40, pageWidth, 1.5, 'F');

      // Title
      doc.setTextColor(187, 164, 115);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Chat Export', margin, 18);

      // Contact info
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(`${contact.name || 'Unknown'}  |  ${contact.phone || ''}`, margin, 28);

      // Date + count
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Exported: ${new Date().toLocaleString()}  |  ${textMessages.length} text messages`, margin, 35);

      y = 48;

      // Messages
      let lastDate = '';

      textMessages.forEach((msg) => {
        // Date separator
        const msgDate = msg.sortTimestamp
          ? new Date(msg.sortTimestamp).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            })
          : '';

        if (msgDate && msgDate !== lastDate) {
          lastDate = msgDate;
          addNewPageIfNeeded(14);
          doc.setFontSize(8);
          doc.setTextColor(130, 130, 130);
          const dateWidth = doc.getTextWidth(msgDate);
          doc.text(msgDate, (pageWidth - dateWidth) / 2, y);
          y += 8;
        }

        const isUser = msg.sender === 'user';
        const senderLabel = isUser ? 'You' : (contact.name || 'Contact');
        const timeStr = msg.timestamp || '';

        // Replace actual message text with language placeholders
        let text = msg.text || '';
        if (hasArabic(text)) {
          text = '[Arabic message]';
        } else {
          text = '[English message]';
        }

        // Wrap text
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(text, contentWidth - 30);
        const blockHeight = 6 + lines.length * 4 + 6;

        addNewPageIfNeeded(blockHeight);

        // Message bubble background
        const bubbleX = isUser ? pageWidth - margin - (contentWidth * 0.7) : margin;
        const bubbleWidth = contentWidth * 0.7;

        if (isUser) {
          doc.setFillColor(42, 42, 42);
        } else {
          doc.setFillColor(35, 35, 35);
        }
        doc.roundedRect(bubbleX, y - 2, bubbleWidth, blockHeight, 2, 2, 'F');

        // Sender + time
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isUser ? 187 : 140, isUser ? 164 : 180, isUser ? 115 : 140);
        doc.text(senderLabel, bubbleX + 4, y + 4);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(timeStr, bubbleX + bubbleWidth - 4 - doc.getTextWidth(timeStr), y + 4);

        // Message text (all shown as placeholders)
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        lines.forEach((line, i) => {
          doc.text(line, bubbleX + 4, y + 10 + i * 4);
        });

        y += blockHeight + 3;
      });

      // Footer on last page
      const footerY = pageHeight - 8;
      doc.setFillColor(187, 164, 115);
      doc.rect(0, footerY - 3, pageWidth, 0.5, 'F');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text('SaveInGold CRM - Chat Export', margin, footerY);
      doc.text(`${textMessages.length} messages`, pageWidth - margin - doc.getTextWidth(`${textMessages.length} messages`), footerY);

      const safeName = (contact.name || 'chat').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`chat_.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  return (
    <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 shadow-lg flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0 group">
            {contact.avatar ? (
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] shadow-lg ring-2 ring-[#BBA473]/20 transition-transform duration-300 group-hover:scale-110">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-full h-full rounded-full object-cover border-2 border-[#1A1A1A]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center shadow-lg ring-2 ring-[#BBA473]/20 transition-transform duration-300 group-hover:scale-110">
                <span className="text-2xl font-bold text-white">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isConnected && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#2A2A2A] animate-pulse" title="Real-time updates active"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate text-lg">{capitalizeWords(contact.name)}</h3>
            <p className="text-sm text-gray-400 truncate flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {formatPhoneDisplay(contact.phone)}
            </p>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowMessageSearch(!showMessageSearch)}
            className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
              showMessageSearch 
                ? 'bg-[#BBA473] text-black' 
                : 'bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]'
            }`}
            title="Search Messages"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !messages.length}
            className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
              isGeneratingPdf
                ? 'bg-[#BBA473]/30 text-[#BBA473] cursor-wait'
                : 'bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]'
            } ${!messages.length ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Download Chat as PDF"
          >
            <Download className={`w-5 h-5 ${isGeneratingPdf ? 'animate-pulse' : ''}`} />
          </button>

          <button
            onClick={() => setShowReminderModal(true)}
            className="p-2.5 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300 hover:scale-110"
            title="Set Reminder"
          >
            <Bell className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowProfileSidebar(!showProfileSidebar)}
            className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
              showProfileSidebar 
                ? 'bg-[#BBA473] text-black' 
                : 'bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]'
            }`}
            title="Contact Info"
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Search Bar */}
      {showMessageSearch && activeTab === 'chat' && handleMessageSearch && (
        <div className="mt-4 animate-slideDown">
          <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg p-2 border border-[#BBA473]/30">
            <Search className="w-4 h-4 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="Search in messages..."
              value={messageSearchQuery}
              onChange={(e) => handleMessageSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none"
            />
            {searchResults && searchResults.length > 0 && (
              <>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
                <button
                  onClick={() => navigateSearch('prev')}
                  className="p-1 rounded bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateSearch('next')}
                  className="p-1 rounded bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                setShowMessageSearch(false);
                setMessageSearchQuery('');
              }}
              className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;