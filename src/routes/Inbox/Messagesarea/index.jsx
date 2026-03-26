import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Clock, AlertTriangle, RefreshCw, FileText, Mic, Loader2, Download, Play, Pause, Video, Image as ImageIcon, MoreVertical, Copy, CornerUpLeft, Share2, Star, Trash2, Pin, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchWatiImage } from '../../../services/inboxService';

// Custom audio player matching the gold/dark theme
const AudioPlayer = ({ src, isUserMessage, onError }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [audioMenuUp, setAudioMenuUp] = useState(true);
  const progressRef = useRef(null);
  const audioMenuRef = useRef(null);

  const formatTime = (secs) => {
    if (!secs || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setLoadError(true));
    }
  }, [isPlaying]);

  const changeSpeed = useCallback((rate) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
    setShowAudioMenu(false);
  }, []);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  // Close audio menu on click outside
  useEffect(() => {
    if (!showAudioMenu) return;
    const handleClick = (e) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target)) {
        setShowAudioMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAudioMenu]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => { if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration); };
    const onErr = () => { setLoadError(true); onError?.(); };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('error', onErr);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('error', onErr);
    };
  }, [onError]);

  if (loadError) return null; // let parent handle error state

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Waveform bars (static visual)
  const bars = [3, 5, 8, 12, 7, 14, 10, 6, 11, 8, 13, 5, 9, 7, 12, 6, 10, 14, 8, 5];

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="flex items-center gap-2.5 min-w-[220px]">
      <audio ref={audioRef} src={src} preload="auto" className="hidden" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 ${
          isUserMessage
            ? 'bg-black/20 hover:bg-black/30 text-black'
            : 'bg-[#BBA473]/20 hover:bg-[#BBA473]/30 text-[#BBA473]'
        }`}
      >
        {isPlaying
          ? <Pause className="w-4 h-4" />
          : <Play className="w-4 h-4 ml-0.5" />
        }
      </button>

      {/* Waveform + progress */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div
          ref={progressRef}
          className="flex items-end gap-[2px] h-[22px] cursor-pointer"
          onClick={handleSeek}
        >
          {bars.map((h, i) => {
            const barProgress = (i / bars.length) * 100;
            const isFilled = barProgress < progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  isFilled
                    ? isUserMessage ? 'bg-black/60' : 'bg-[#BBA473]'
                    : isUserMessage ? 'bg-black/15' : 'bg-[#BBA473]/25'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        {/* Time + speed */}
        <div className={`flex justify-between text-[10px] leading-none font-medium ${
          isUserMessage ? 'text-black/50' : 'text-gray-500'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Speed / More button */}
      <div className="relative flex-shrink-0" ref={audioMenuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!showAudioMenu) {
              const rect = e.currentTarget.getBoundingClientRect();
              setAudioMenuUp(rect.bottom > window.innerHeight * 0.5);
            }
            setShowAudioMenu(!showAudioMenu);
          }}
          className={`min-w-[32px] h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
            isUserMessage
              ? 'bg-black/15 hover:bg-black/25 text-black/70'
              : 'bg-[#BBA473]/15 hover:bg-[#BBA473]/25 text-[#BBA473]'
          }`}
          title="Playback speed"
        >
          {playbackRate !== 1 ? `${playbackRate}x` : <Gauge className="w-3.5 h-3.5" />}
        </button>
        {showAudioMenu && (
          <div className={`absolute right-0 bg-[#2A2A2A] border border-[#BBA473]/20 rounded-xl shadow-2xl py-1.5 min-w-[130px] z-40 animate-scaleIn ${
            audioMenuUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Speed</p>
            {speeds.map(s => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); changeSpeed(s); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
                  playbackRate === s
                    ? 'text-[#BBA473] bg-[#BBA473]/10'
                    : 'text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473]'
                }`}
              >
                <span>{s}x</span>
                {playbackRate === s && <span className="text-[#BBA473] text-xs">&#10003;</span>}
              </button>
            ))}
            <div className="my-1 border-t border-[#BBA473]/10" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (src) {
                  const a = document.createElement('a');
                  a.href = src;
                  a.download = `audio-${Date.now()}.mp3`;
                  a.click();
                }
                setShowAudioMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473] transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
  onReply,
  starredMessages,
  pinnedMessages,
  onToggleStar,
  onTogglePin,
}) => {

  // Track failed images and loading states
  const [failedImages, setFailedImages] = useState(new Set());
  const [loadingMedia, setLoadingMedia] = useState(new Set());
  const [previewImage, setPreviewImage] = useState(null);

  // Message action menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuOpenUp, setMenuOpenUp] = useState(true);
  const menuRef = useRef(null);

  // Close message menu on click outside
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Track which messages are currently being processed (ref to avoid re-renders)
  const processingRef = useRef(new Set());
  const isDownloadingRef = useRef(false);

  // Calculate media download progress
  const mediaProgress = useMemo(() => {
    const mediaMessages = messages.filter(
      msg => (msg.type === 'image' || msg.type === 'audio' || msg.type === 'video' || msg.type === 'document') && msg.mediaUrl && !msg.localFile
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
      (msg.type === 'image' || msg.type === 'audio' || msg.type === 'video' || msg.type === 'document') &&
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

  // Single tick SVG
  const SingleTick = ({ className, style }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Double tick SVG
  const DoubleTick = ({ className, style }) => (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" className={className} style={style}>
      <path d="M1.5 8.5L4.5 11.5L10.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 8.5L9.5 11.5L15.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const getMessageStatusIcon = (status, failed) => {
    if (failed) {
      return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    }

    switch (status) {
      case 'sending':
        return <Clock className="w-3.5 h-3.5 text-black/40 animate-pulse" />;
      case 'sent':
        return <SingleTick className="text-black/50" />;
      case 'delivered':
        return <DoubleTick className="text-[#26369c]" style={{ filter: 'drop-shadow(0 1px 2px rgba(83, 189, 235, 0.45))' }} />;
      case 'read':
        return <DoubleTick className="text-[#26369c]" style={{ filter: 'drop-shadow(0 1px 3px rgba(83, 189, 235, 0.6))' }} />;
      default:
        return <Clock className="w-3.5 h-3.5 text-black/40" />;
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
    if (message.type === 'image' && !message.mediaUrl) {
      return (
        <div className="flex items-center gap-2 py-2 px-1">
          <ImageIcon className="w-5 h-5 text-[#BBA473]" />
          <span className="text-sm text-[#BBA473]/80">{message.text || 'Image'}</span>
        </div>
      );
    }
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
              className="relative rounded-xl overflow-hidden bg-black/20 cursor-pointer"
              style={{ maxWidth: '300px' }}
              onClick={() => setPreviewImage(imageUrl)}
            >
              <img
                src={imageUrl}
                alt="Shared image"
                className="w-full h-auto object-cover transition-all duration-300 hover:brightness-90"
                style={{ maxHeight: '400px', minHeight: '150px' }}
                onError={() => {
                  setFailedImages(prev => new Set(prev).add(message.id));
                }}
              />
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

    // AUDIO/VOICE NOTE DISPLAY (no mediaUrl - show icon placeholder)
    if (message.type === 'audio' && !message.mediaUrl) {
      return (
        <div className="flex items-center gap-2 py-2 px-1">
          <Mic className="w-5 h-5 text-[#BBA473]" />
          <span className="text-sm text-[#BBA473]/80">{message.text || 'Voice Note'}</span>
        </div>
      );
    }
    // AUDIO/VOICE NOTE DISPLAY
    if (message.type === 'audio' && message.mediaUrl) {
      const audioUrl = message.downloadedImageUrl || message.mediaUrl;
      const isDownloaded = downloadedImages.has(message.id) || message.localFile || message.mediaUrl.startsWith('blob:');
      const hasFailed = failedImages.has(message.id);
      const isUser = message.sender === 'user';

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Mic className={`w-4 h-4 flex-shrink-0 ${isUser ? 'text-black/50' : 'text-[#BBA473]'}`} />
            <div className="flex-1 min-w-0">
              {hasFailed ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isUser ? 'text-black/60' : 'text-red-400'}`}>Failed to load audio</span>
                  <button
                    onClick={() => handleMediaDownload(message)}
                    className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-medium text-xs transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : isDownloaded ? (
                <AudioPlayer
                  src={audioUrl}
                  isUserMessage={isUser && !message.failed}
                  onError={() => setFailedImages(prev => new Set(prev).add(message.id))}
                />
              ) : (
                <div className={`flex items-center gap-2 ${isUser ? 'text-black/50' : 'text-[#BBA473]'}`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading audio...</span>
                </div>
              )}
            </div>
          </div>

          {message.text && message.text !== '🎵 Audio' && message.text !== '🎤 Voice Message' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    // VIDEO DISPLAY (no mediaUrl - show icon placeholder)
    if (message.type === 'video' && !message.mediaUrl) {
      return (
        <div className="flex items-center gap-2 py-2 px-1">
          <Video className="w-5 h-5 text-[#BBA473]" />
          <span className="text-sm text-[#BBA473]/80">{message.text || 'Video'}</span>
        </div>
      );
    }
    // VIDEO DISPLAY
    if (message.type === 'video' && message.mediaUrl) {
      const videoUrl = message.downloadedImageUrl || message.mediaUrl;
      const isDownloaded = downloadedImages.has(message.id) || message.localFile || message.mediaUrl.startsWith('blob:');
      const hasFailed = failedImages.has(message.id);
      const isUser = message.sender === 'user';

      return (
        <div className="space-y-2">
          {hasFailed ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl min-h-[150px] max-w-[300px]">
              <Video className={`w-12 h-12 mb-2 ${isUser ? 'text-black/30' : 'text-[#BBA473]/50'}`} />
              <p className={`text-sm ${isUser ? 'text-black/50' : 'text-[#BBA473]/70'}`}>Failed to load video</p>
              <button
                onClick={() => handleMediaDownload(message)}
                className="mt-3 px-3 py-1.5 bg-[#BBA473]/20 hover:bg-[#BBA473]/30 rounded-lg text-[#BBA473] font-medium text-xs transition-all"
              >
                Retry
              </button>
            </div>
          ) : isDownloaded ? (
            <div className="relative rounded-xl overflow-hidden bg-black/20" style={{ maxWidth: '300px' }}>
              <video
                src={videoUrl}
                controls
                preload="metadata"
                className="w-full h-auto rounded-xl"
                style={{ maxHeight: '350px', minHeight: '120px' }}
                onError={() => {
                  setFailedImages(prev => new Set(prev).add(message.id));
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl min-h-[150px] max-w-[300px]">
              <Loader2 className="w-12 h-12 text-[#BBA473] animate-spin mb-2" />
              <p className="text-[#BBA473]/70 text-sm">Loading video...</p>
            </div>
          )}

          {message.text && message.text !== '🎥 Video' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    // DOCUMENT/PDF DISPLAY (no mediaUrl - show icon placeholder)
    if (message.type === 'document' && !message.mediaUrl) {
      return (
        <div className="flex items-center gap-2 py-2 px-1">
          <FileText className="w-5 h-5 text-[#BBA473]" />
          <span className="text-sm text-[#BBA473]/80">{message.text || 'Document'}</span>
        </div>
      );
    }
    // DOCUMENT/PDF DISPLAY
    if (message.type === 'document' && message.mediaUrl) {
      const docUrl = message.downloadedImageUrl || message.mediaUrl;
      const isDownloaded = downloadedImages.has(message.id) || message.localFile || message.mediaUrl.startsWith('blob:');
      const hasFailed = failedImages.has(message.id);
      const isUser = message.sender === 'user';
      const fileName = message.mediaUrl?.split('/').pop()?.split('?')[0] || message.text || 'Document.pdf';

      return (
        <div className="space-y-2">
          {hasFailed ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl min-h-[100px] max-w-[280px]">
              <FileText className={`w-10 h-10 mb-2 ${isUser ? 'text-black/30' : 'text-[#BBA473]/50'}`} />
              <p className={`text-sm ${isUser ? 'text-black/50' : 'text-[#BBA473]/70'}`}>Failed to load document</p>
              <button
                onClick={() => handleMediaDownload(message)}
                className="mt-3 px-3 py-1.5 bg-[#BBA473]/20 hover:bg-[#BBA473]/30 rounded-lg text-[#BBA473] font-medium text-xs transition-all"
              >
                Retry
              </button>
            </div>
          ) : isDownloaded ? (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl max-w-[280px] cursor-pointer transition-all hover:opacity-80 ${
                isUser ? 'bg-black/10' : 'bg-[#BBA473]/10'
              }`}
              onClick={() => window.open(docUrl, '_blank')}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isUser ? 'bg-red-500/20' : 'bg-red-500/15'
              }`}>
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isUser ? 'text-black/80' : 'text-white/90'}`}>
                  {fileName}
                </p>
                <p className={`text-xs ${isUser ? 'text-black/50' : 'text-gray-400'}`}>PDF &middot; Tap to open</p>
              </div>
              <Download className={`w-4 h-4 flex-shrink-0 ${isUser ? 'text-black/40' : 'text-[#BBA473]/60'}`} />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-[#BBA473]/10 to-[#8E7D5A]/10 rounded-xl max-w-[280px]">
              <Loader2 className="w-5 h-5 text-[#BBA473] animate-spin flex-shrink-0" />
              <span className="text-[#BBA473]/70 text-sm">Loading document...</span>
            </div>
          )}

          {message.text && message.text !== 'Document' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    // TEMPLATE MESSAGE
    if (message.isTemplate && message.text) {
      const isUser = true;
      return (
        <div className="rounded-2xl px-4 py-3 shadow-md bg-gradient-to-r from-[#005C4B] to-[#128C7E] text-white border border-[#25D366]/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] min-w-[200px]">
          {message.templateName && (
            <div className={`flex items-center gap-1.5 mb-2 pb-2 border-b ${isUser ? 'border-white/20' : 'border-[#BBA473]/20'}`}>
              <FileText className={`w-3.5 h-3.5 ${isUser ? 'text-white/70' : 'text-[#BBA473]'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${isUser ? 'text-white/70' : 'text-[#BBA473]'}`}>
                {message.templateName.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
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

      {/* Pinned messages banner */}
      {pinnedMessages?.length > 0 && (
        <div className="sticky top-0 z-20 mb-2 space-y-1.5">
          {pinnedMessages.map(pin => (
            <div
              key={pin.id}
              className="bg-[#2A2A2A]/95 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#BBA473]/30 shadow-xl cursor-pointer hover:bg-[#333]/95 transition-colors"
              onClick={() => {
                const el = document.getElementById(`message-${pin.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('highlight-message');
                  setTimeout(() => el.classList.remove('highlight-message'), 2000);
                }
              }}
            >
              <div className="flex items-center gap-2.5">
                <Pin className="w-3.5 h-3.5 text-[#BBA473] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#BBA473]">Pinned</p>
                  <p className="text-xs text-gray-300 truncate">{pin.text || 'Media'}</p>
                </div>
              </div>
            </div>
          ))}
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
              className={`flex ${message.sender === 'user' || (message.isTemplate && message.text) ? 'justify-end' : 'justify-start'} message-item transition-all duration-300`}
            >
              <div className={`max-w-[80%] group ${message.sender === 'user' || (message.isTemplate && message.text) ? 'items-end' : 'items-start'} flex flex-col`}>
                {message.isTemplate && (
                  <div className={`flex items-center gap-1 mb-1 text-xs ${message.sender === 'user' || (message.isTemplate && message.text) ? 'text-[#BBA473]' : 'text-gray-400'}`}>
                    <FileText className="w-3 h-3" />
                    <span>Template</span>
                  </div>
                )}

                <div className="flex items-start gap-1">
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
                    {/* Reply quote */}
                    {message.replyTo && (
                      <div
                        className={`mb-2 rounded-lg px-3 py-1.5 cursor-pointer border-l-[3px] ${
                          message.sender === 'user'
                            ? 'bg-black/10 border-white/40'
                            : 'bg-white/5 border-[#BBA473]'
                        }`}
                        onClick={() => {
                          const el = document.getElementById(`message-${message.replyTo.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('highlight-message');
                            setTimeout(() => el.classList.remove('highlight-message'), 2000);
                          }
                        }}
                      >
                        <p className={`text-[11px] font-semibold ${
                          message.sender === 'user' ? 'text-black/60' : 'text-[#BBA473]'
                        }`}>
                          {message.replyTo.sender === 'user' ? 'You' : contact?.name?.split(' ')[0] || 'Contact'}
                        </p>
                        <p className={`text-xs truncate max-w-[250px] ${
                          message.sender === 'user' ? 'text-black/50' : 'text-gray-400'
                        }`}>
                          {message.replyTo.text || 'Media'}
                        </p>
                      </div>
                    )}
                    {renderMessageContent(message)}
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      {starredMessages?.has(message.id) && (
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      )}
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
                        <span className="ml-0.5 inline-flex items-center">{getMessageStatusIcon(message.status, message.failed)}</span>
                      )}
                    </div>
                  </div>

                  {/* 3-dot action menu for contact messages */}
                  {(message.sender !== 'user' && !(message.isTemplate && message.text)) &&  (
                    <div className="relative flex-shrink-0" ref={activeMenuId === message.id ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeMenuId !== message.id) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuOpenUp(rect.bottom > window.innerHeight * 0.5);
                          }
                          setActiveMenuId(activeMenuId === message.id ? null : message.id);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 mt-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenuId === message.id && (
                        <div className={`absolute left-0 bg-[#2A2A2A] border border-[#BBA473]/20 rounded-xl shadow-2xl py-1.5 min-w-[160px] z-30 animate-scaleIn ${
                          menuOpenUp ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}>
                          <button
                            onClick={() => { onReply?.(message); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473] transition-colors"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                            Reply
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(message.text || ''); toast.success('Copied to clipboard'); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473] transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </button>
                          <button
                            onClick={() => { toast('Forward coming soon', { icon: '🔜' }); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473] transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Forward
                          </button>
                          <button
                            onClick={() => { onToggleStar?.(message.id); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473] transition-colors"
                          >
                            <Star className={`w-3.5 h-3.5 ${starredMessages?.has(message.id) ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                            {starredMessages?.has(message.id) ? 'Unstar' : 'Star'}
                          </button>
                          <button
                            onClick={() => { onTogglePin?.(message); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-200 hover:bg-[#BBA473]/10 hover:text-[#BBA473] transition-colors"
                          >
                            <Pin className={`w-3.5 h-3.5 ${pinnedMessages?.some(p => p.id === message.id) ? 'text-[#BBA473]' : ''}`} />
                            {pinnedMessages?.some(p => p.id === message.id) ? 'Unpin' : 'Pin'}
                          </button>
                          <div className="my-1 border-t border-[#BBA473]/10" />
                          <button
                            onClick={() => { toast('Delete coming soon', { icon: '🗑️' }); setActiveMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.failed && message.sender === 'user' && handleRetryMessage && message.type === 'text' && (
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
                {message.failed && message.sender === 'user' && message.type !== 'text' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs">Failed to send</span>
                  </div>
                )}
              </div>
            </div>
            )
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />

      {/* Full-screen image preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = previewImage;
              link.download = `image-${Date.now()}.jpg`;
              link.click();
            }}
            className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <Download className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MessagesArea; 