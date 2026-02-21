import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Check, CheckCheck, Clock, AlertTriangle, RefreshCw, FileText, Mic, Loader2, ChevronDown, Download } from 'lucide-react';
import { fetchWatiImage } from '../../../services/inboxService';

const MessagesArea = ({
  messages,
  isLoading,
  contact,
  isConnected,
  messagesEndRef,
  retryingMessageId,
  handleRetryMessage,
  downloadedImages,
  setDownloadedImages,
  setMessages,
}) => {

  // Track failed images and loading states
  const [failedImages, setFailedImages] = useState(new Set());
  const [loadingMedia, setLoadingMedia] = useState(new Set());
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Track which messages are currently being processed (ref to avoid re-renders)
  const processingRef = useRef(new Set());
  const isDownloadingRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  // Calculate media download progress
  const mediaProgress = useMemo(() => {
    const mediaMessages = messages.filter(
      msg => (msg.type === 'image' || msg.type === 'audio') && msg.mediaUrl && !msg.localFile
    );
    const total = mediaMessages.length;
    const downloaded = mediaMessages.filter(
      msg => downloadedImages.has(msg.id) || msg.mediaUrl?.startsWith('blob:') || failedImages.has(msg.id)
    ).length;
    return { total, downloaded, isComplete: total === 0 || downloaded >= total };
  }, [messages, downloadedImages, failedImages]);

  // Auto-download incoming images and audio - only depends on messages
  useEffect(() => {
    if (isDownloadingRef.current) return;

    const mediaToDownload = messages.filter(msg =>
      (msg.type === 'image' || msg.type === 'audio') &&
      msg.mediaUrl &&
      !msg.localFile &&
      !msg.mediaUrl.startsWith('blob:') &&
      !downloadedImages.has(msg.id) &&
      !failedImages.has(msg.id) &&
      !processingRef.current.has(msg.id)
    );

    if (mediaToDownload.length === 0) return;

    isDownloadingRef.current = true;

    const downloadAll = async () => {
      for (const msg of mediaToDownload) {
        if (processingRef.current.has(msg.id)) continue;

        processingRef.current.add(msg.id);
        setLoadingMedia(prev => new Set(prev).add(msg.id));

        try {
          const result = await fetchWatiImage(msg.mediaUrl);

          if (result.success && result.blobUrl) {
            setDownloadedImages(prev => new Set(prev).add(msg.id));
            setMessages(prev => prev.map(m =>
              m.id === msg.id
                ? { ...m, mediaUrl: result.blobUrl, downloadedImageUrl: result.blobUrl }
                : m
            ));
          } else {
            setFailedImages(prev => new Set(prev).add(msg.id));
          }
        } catch (error) {
          console.error('Failed to download media:', msg.id, error);
          setFailedImages(prev => new Set(prev).add(msg.id));
        } finally {
          setLoadingMedia(prev => {
            const s = new Set(prev);
            s.delete(msg.id);
            return s;
          });
        }

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      isDownloadingRef.current = false;
    };

    downloadAll();
  }, [messages]);

  const getMessageStatusIcon = (status, failed) => {
    if (failed) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }

    switch (status) {
      case 'sending':
        return <Clock className="w-4 h-4 text-gray-400 animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-gray-600" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-600" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-[#BBA473]" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.sortTimestamp);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  };

  const handleMediaDownload = async (message, e) => {
    if (e) e.stopPropagation();
    
    console.log('⬇️ Manual download triggered:', message.id, message.type);
    
    // Clear failed state if retrying
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(message.id);
      return newSet;
    });
    
    // Clear processing ref for retry
    processingRef.current.delete(message.id);
    
    // Mark as loading
    setLoadingMedia(prev => {
      const newSet = new Set(prev);
      newSet.add(message.id);
      return newSet;
    });
    
    try {
      const result = await fetchWatiImage(message.mediaUrl);
      
      if (result.success && result.blobUrl) {
        console.log('✅ Download successful:', message.id);
        setDownloadedImages(prev => {
          const newSet = new Set(prev);
          newSet.add(message.id);
          return newSet;
        });
        setMessages(prev => prev.map(m => 
          m.id === message.id 
            ? { 
                ...m, 
                mediaUrl: result.blobUrl,
                downloadedImageUrl: result.blobUrl 
              }
            : m
        ));
      } else {
        console.error('❌ Download failed:', message.id);
        setFailedImages(prev => {
          const newSet = new Set(prev);
          newSet.add(message.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      setFailedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(message.id);
        return newSet;
      });
    } finally {
      // Remove from loading state
      setLoadingMedia(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  };

  const renderMessageContent = (message) => {
    // DEBUG: Log all messages with their types, especially non-text ones
    if (message.type !== 'text') {
      console.log('🔍 NON-TEXT MESSAGE DEBUG:', {
        id: message.id,
        type: message.type,
        mediaUrl: message.mediaUrl,
        downloadedImageUrl: message.downloadedImageUrl,
        text: message.text,
        localFile: message.localFile,
        isInDownloadedSet: downloadedImages.has(message.id),
        isInFailedSet: failedImages.has(message.id),
        isInLoadingSet: loadingMedia.has(message.id),
        mediaUrlStartsWithBlob: message.mediaUrl?.startsWith('blob:'),
        fullMessage: message
      });
    }

    // IMAGE DISPLAY
    if ((message.type === 'image' || (message.type === 'text' && message.mediaUrl)) && message.mediaUrl) {
      const imageUrl = message.downloadedImageUrl || message.mediaUrl;
      const isDownloaded = downloadedImages.has(message.id) || message.localFile || message.mediaUrl.startsWith('blob:');
      const hasFailed = failedImages.has(message.id);

      return (
        <div className="space-y-2">
          {hasFailed ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl min-h-[150px] max-w-[300px]">
              <svg className="w-12 h-12 text-[#BBA473]/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[#BBA473]/70 text-sm">Image preview</p>
              <button
                onClick={() => handleMediaDownload(message)}
                className="mt-3 px-3 py-1.5 bg-[#BBA473]/20 hover:bg-[#BBA473]/30 rounded-lg text-[#BBA473] font-medium text-xs transition-all"
              >
                Retry
              </button>
            </div>
          ) : isDownloaded ? (
            <div
              className="relative rounded-xl overflow-hidden bg-black/20 group"
              style={{ maxWidth: '300px' }}
            >
              <img
                src={imageUrl}
                alt="Shared image"
                className="w-full h-auto object-cover transition-all duration-300"
                style={{ maxHeight: '400px', minHeight: '150px' }}
                onError={() => {
                  setFailedImages(prev => new Set(prev).add(message.id));
                }}
              />

              {/* Dropdown menu button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === message.id ? null : message.id);
                  }}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {openDropdownId === message.id && (
                  <div className="absolute right-0 top-10 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-xl shadow-2xl z-30 min-w-[160px] py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `image-${message.id}.jpg`;
                        link.click();
                        setOpenDropdownId(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#BBA473]/20 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl min-h-[150px] max-w-[300px]">
              <Loader2 className="w-12 h-12 text-[#BBA473] animate-spin mb-2" />
              <p className="text-[#BBA473]/70 text-sm">Loading image...</p>
            </div>
          )}

          {message.text && message.text !== '📷 Image' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    // AUDIO/VOICE NOTE DISPLAY
    if (message.type === 'audio' && message.mediaUrl) {
      const audioUrl = message.downloadedImageUrl || message.mediaUrl;
      const isDownloaded = downloadedImages.has(message.id) || message.localFile || message.mediaUrl.startsWith('blob:');
      const hasFailed = failedImages.has(message.id);

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl p-3 border border-[#BBA473]/20 relative group">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#BBA473]/30 to-[#8E7D5A]/30 flex items-center justify-center border border-[#BBA473]/20">
              <Mic className="w-5 h-5 text-[#BBA473]" />
            </div>

            <div className="flex-1">
              {hasFailed ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">Failed to load audio</span>
                  <button
                    onClick={() => handleMediaDownload(message)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-medium text-xs transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : isDownloaded ? (
                <audio
                  controls
                  src={audioUrl}
                  className="w-full"
                  style={{ height: '36px', minWidth: '200px' }}
                  preload="auto"
                  onError={() => {
                    setFailedImages(prev => new Set(prev).add(message.id));
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 text-[#BBA473]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading audio...</span>
                </div>
              )}
            </div>

            {/* Dropdown menu for audio */}
            {isDownloaded && !hasFailed && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === message.id ? null : message.id);
                  }}
                  className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-all"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {openDropdownId === message.id && (
                  <div className="absolute right-0 top-9 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-xl shadow-2xl z-30 min-w-[160px] py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = audioUrl;
                        link.download = `audio-${message.id}.ogg`;
                        link.click();
                        setOpenDropdownId(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#BBA473]/20 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {message.text && message.text !== '🎵 Audio' && message.text !== '🎤 Voice Message' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    // TEXT MESSAGE
    return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#BBA473]/20 border-t-[#BBA473]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A]"></div>
          </div>
        </div>
        <span className="text-gray-400 mt-4 font-medium">Loading messages...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn p-6">
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 flex items-center justify-center animate-pulse-slow">
            <svg className="w-14 h-14 text-[#BBA473]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Start a Conversation</h3>
        <p className="text-gray-400 text-sm max-w-xs mb-6 leading-relaxed">
          No messages yet. Send a message below to start chatting with {contact.name.split(' ')[0]}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'} animate-ping`}></div>
          <span>{isConnected ? 'Real-time updates active' : 'Ready to chat'}</span>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="relative p-6 space-y-3">
      {/* Loading overlay while media is downloading */}
      {!mediaProgress.isComplete && (
        <div className="sticky top-0 z-20 flex justify-center mb-2">
          <div className="bg-[#2A2A2A]/95 backdrop-blur-sm px-5 py-2.5 rounded-full border border-[#BBA473]/30 shadow-xl flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-[#BBA473] animate-spin" />
            <span className="text-sm text-gray-300">
              Loading media {mediaProgress.downloaded}/{mediaProgress.total}
            </span>
            <div className="w-20 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] rounded-full transition-all duration-300"
                style={{ width: `${(mediaProgress.downloaded / mediaProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {Object.keys(messageGroups).map((dateKey) => (
        <div key={dateKey} className="space-y-3">
          {/* Sticky Date Separator */}
          <div className="sticky top-0 z-10 flex items-center justify-center py-2">
            <div className="bg-[#2A2A2A] px-4 py-1.5 rounded-full text-xs font-semibold text-gray-400 border border-[#BBA473]/20 shadow-lg backdrop-blur-sm">
              {dateKey}
            </div>
          </div>

          {/* Messages for this date */}
          {messageGroups[dateKey].map((message) => (
            message.isReadReceipt ? (
              <>
              {/* <div key={message.id} className="flex justify-center message-item my-1">
                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1">
                  <CheckCheck className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Message read</span>
                  <span className="text-[10px] text-red-400/60 ml-1">{message.timestamp}</span>
                </div>
              </div> */}
              </>
            ) : (
            <div
              key={message.id}
              id={`message-${message.id}`}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-item transition-all duration-300`}
            >
              <div className={`max-w-[80%] group ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {message.isTemplate && (
                  <div className={`flex items-center gap-1 mb-1 text-xs ${message.sender === 'user' ? 'text-[#BBA473]' : 'text-gray-400'}`}>
                    <FileText className="w-3 h-3" />
                    <span>Template</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-md ${message.sender === 'user'
                    ? message.failed
                      ? 'bg-red-500/20 text-white border border-red-500/30'
                      : message.isTemplate
                        ? 'bg-gradient-to-r from-[#005C4B] to-[#128C7E] text-white border border-[#25D366]/30'
                        : 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black'
                    : 'bg-[#2A2A2A] text-white border border-[#BBA473]/20'
                    } transition-all duration-300 hover:shadow-lg ${message.sender === 'user' && !message.failed ? 'hover:scale-[1.02]' : ''}`}
                >
                  {renderMessageContent(message)}
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <span className={`text-xs font-medium ${message.sender === 'user'
                      ? message.failed
                        ? 'text-red-300'
                        : message.isTemplate
                          ? 'text-white/70'
                          : 'text-black/70'
                      : 'text-gray-400'
                      }`}>
                      {message.timestamp}
                    </span>
                    {message.sender === 'user' && (
                      <span className="ml-1">{getMessageStatusIcon(message.status, message.failed)}</span>
                    )}
                  </div>
                </div>

                {message.failed && message.sender === 'user' && handleRetryMessage && (
                  <button
                    onClick={() => handleRetryMessage(message.id, message.text)}
                    disabled={retryingMessageId === message.id}
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retryingMessageId === message.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        Retry
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            )
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesArea; 