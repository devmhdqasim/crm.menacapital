import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, FileText, Paperclip, Mic, Smile, RefreshCw, X, Camera, Video, SwitchCamera, Circle, Pause, Play } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { Mp3Encoder } from '../../../utils/mp3encoder';
import { sendMessageViaBackend, sendSessionFile } from '../../../services/inboxService';

const ChatInput = ({
  messageInput,
  setMessageInput,
  isSending,
  setIsSending,
  contact,
  isConnected,
  sendWsMessage,
  messages,
  setMessages,
  setContactNotFound,
  refreshContacts,
  inputRef,
  fileInputRef,
  setShowTemplatePicker,
  isRecording,
  setIsRecording,
  recordingDuration,
  setRecordingDuration,
  recordingTimer,
  setRecordingTimer,
  mediaRecorderRef,
  audioChunksRef,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  downloadedImages,
  setDownloadedImages,
  trackSentMessage,
  onCameraCapture,
  replyToMessage,
  setReplyToMessage,
}) => {
  
  // Keep input focused when messages change (send/receive) or sending completes
  useEffect(() => {
    if (!isRecording && !isSending) {
      inputRef.current?.focus();
    }
  }, [messages, isSending]);

  // Handle send text message
  const handleSendMessage = async () => {
    const textToSend = messageInput.trim();
    if (!textToSend || !contact) return;

    setIsSending(true);

    try {
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const result = await sendMessageViaBackend(cleanPhone, 'text', textToSend, contact.name || '');

      if (result.success) {
        // Track sent text to suppress self-notification toast
        if (trackSentMessage) trackSentMessage(textToSend);

        const newMessage = {
          id: Date.now(),
          text: textToSend,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          sortTimestamp: Date.now(),
          status: 'sent',
          failed: false,
          type: 'text',
          ...(replyToMessage ? { replyTo: { id: replyToMessage.id, text: replyToMessage.text, sender: replyToMessage.sender } } : {}),
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
        setReplyToMessage?.(null);
        setContactNotFound(false);

        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        toast.error(result.message || 'Failed to send message');
        if (result.contactNotFound || result.windowExpired) {
          setContactNotFound(true);
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle file attachment click
  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  // Voice recording pause state
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const recordingCancelledRef = useRef(false);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecordingDuration, setVideoRecordingDuration] = useState(0);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoTimerRef = useRef(null);

  // Open camera with getUserMedia
  const handleCameraCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      cameraStreamRef.current = stream;
      setShowCamera(true);
      // Attach stream to video element after render
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please allow camera permissions.');
      } else {
        toast.error('Failed to open camera. Check your device camera.');
      }
    }
  }, [cameraFacing]);

  // Close camera and stop stream
  const closeCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    setShowCamera(false);
    setIsVideoRecording(false);
    setVideoRecordingDuration(0);
    videoChunksRef.current = [];
  }, []);

  // Switch front/back camera
  const switchCamera = useCallback(async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    // Stop current stream
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      cameraStreamRef.current = stream;
      setCameraFacing(newFacing);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch {
      toast.error('Failed to switch camera');
    }
  }, [cameraFacing]);

  // Take photo - canvas snapshot
  const takePhoto = useCallback(() => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob && onCameraCapture) {
          onCameraCapture(blob, 'image');
          closeCamera();
        }
      },
      'image/jpeg',
      0.92
    );
  }, [onCameraCapture, closeCamera]);

  // Max video recording duration (seconds)
  const MAX_VIDEO_DURATION = 10 * 60; // 10 minutes

  // Start video recording — prefer MP4 (WhatsApp compatible), fallback to WebM
  const startVideoRecording = useCallback(() => {
    if (!cameraStreamRef.current) return;

    videoChunksRef.current = [];

    // Chrome 124+ supports video/mp4, Safari uses it natively
    const preferredMimes = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mimeType = preferredMimes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    console.log('🎥 Recording video with mimeType:', mimeType);

    const recorder = new MediaRecorder(cameraStreamRef.current, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (videoChunksRef.current.length > 0) {
        // Use the actual recorded MIME type so the data matches the label
        const actualMime = recorder.mimeType.split(';')[0];
        const blob = new Blob(videoChunksRef.current, { type: actualMime });
        if (onCameraCapture) {
          onCameraCapture(blob, 'video');
        }
      }
      closeCamera();
    };

    recorder.start(1000);
    videoRecorderRef.current = recorder;
    setIsVideoRecording(true);
    setVideoRecordingDuration(0);

    videoTimerRef.current = setInterval(() => {
      setVideoRecordingDuration(prev => {
        const next = prev + 1;
        if (next >= MAX_VIDEO_DURATION) {
          toast.error('Maximum recording time (10 minutes) reached.', { duration: 3000 });
          stopVideoRecording();
        }
        return next;
      });
    }, 1000);
  }, [onCameraCapture, closeCamera]);

  // Stop video recording
  const stopVideoRecording = useCallback(() => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
    };
  }, []);

  // ✅ FIXED: Start voice recording
  const startVoiceRecording = async () => {
    try {
      recordingCancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use a Wati-compatible format: prefer ogg/opus, fallback to mp4, then webm
      const preferredMimes = ['audio/ogg;codecs=opus', 'audio/mp4', 'audio/ogg', 'audio/webm'];
      const supportedMime = preferredMimes.find(m => MediaRecorder.isTypeSupported(m)) || 'audio/webm';
      console.log('🎙️ Recording with mimeType:', supportedMime);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMime
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && !recordingCancelledRef.current) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Reset recording UI immediately — don't wait for conversion/send
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsRecordingPaused(false);
        setRecordingDuration(0);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }

        // If cancelled, do nothing — just silently close
        if (recordingCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        // Strip codec params (e.g. "audio/ogg;codecs=opus" -> "audio/ogg") for API compatibility
        const rawMime = mediaRecorderRef.current?.mimeType || supportedMime;
        const cleanMime = rawMime.split(';')[0];
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });

        // Only send if recording has actual audio chunks
        if (audioChunksRef.current.length > 0) {
          await sendVoiceNote(audioBlob);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

      toast.success('Recording started', { duration: 1500, icon: '🎙️' });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
      } else {
        toast.error('Failed to start recording. Please check your microphone.');
      }
    }
  };

  // ✅ FIXED: Stop voice recording (send)
  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    // If paused, resume briefly so .stop() collects all data
    if (recorder.state === 'paused') {
      recorder.resume();
    }
    recorder.stop();
  };

  // ✅ FIXED: Cancel voice recording
  const cancelVoiceRecording = () => {
    // Flag as cancelled so onstop and ondataavailable do nothing
    recordingCancelledRef.current = true;
    audioChunksRef.current = [];
    setRecordingDuration(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsRecordingPaused(false);

    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };

  // Toggle pause/resume voice recording
  const togglePauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    try {
      if (recorder.state === 'recording') {
        recorder.pause();
        setIsRecordingPaused(true);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
      } else if (recorder.state === 'paused') {
        recorder.resume();
        setIsRecordingPaused(false);
        const timer = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        setRecordingTimer(timer);
      }
    } catch (err) {
      console.error('Pause/resume error:', err);
      toast.error('Pause not supported on this browser');
    }
  };

  // Convert recorded audio blob to MP3 using lamejs
  const convertToMp3 = async (audioBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);

    // Convert Float32 PCM to Int16
    const int16Samples = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const encoder = new Mp3Encoder(1, sampleRate, 128);
    const mp3Data = [];
    const blockSize = 1152;

    for (let i = 0; i < int16Samples.length; i += blockSize) {
      const chunk = int16Samples.subarray(i, i + blockSize);
      const encoded = encoder.encodeBuffer(chunk);
      if (encoded.length > 0) mp3Data.push(encoded);
    }

    const final = encoder.flush();
    if (final.length > 0) mp3Data.push(final);

    await audioContext.close();
    return new Blob(mp3Data, { type: 'audio/mpeg' });
  };

  // Send voice note — converts to MP3 before sending (same format as file upload)
  const sendVoiceNote = async (audioBlob) => {
    if (!contact) {
      toast.error('No contact selected');
      return;
    }

    if (audioBlob.size === 0) {
      toast.error('Recording is empty');
      return;
    }

    console.log('🎤 Preparing to send voice note:', {
      size: audioBlob.size,
      type: audioBlob.type,
      contact: contact.phone
    });

    setIsSending(true);

    // Create local URL for immediate display
    const localUrl = URL.createObjectURL(audioBlob);

    // Create optimistic message FIRST so it shows in chat immediately
    const optimisticMessageId = `voice-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticMessageId,
      text: '',
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      sortTimestamp: Date.now(),
      status: 'sending',
      type: 'audio',
      mediaUrl: localUrl,
      downloadedImageUrl: localUrl,
      localFile: true,
    };

    console.log('✅ Adding voice note to messages:', optimisticMessageId);

    // Add to messages immediately — always show in chat
    setMessages(prev => [...prev, optimisticMessage]);

    // Mark as downloaded so it displays without blur
    setDownloadedImages(prev => new Set(prev).add(optimisticMessageId));

    // Helper to mark the message as failed (keeps it visible in chat)
    const markFailed = () => {
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessageId
          ? { ...msg, status: 'failed', failed: true }
          : msg
      ));
      setIsSending(false);
    };

    try {
      // Convert recorded audio to MP3 (confirmed working with Wati/WhatsApp)
      console.log('🔄 Converting voice recording to MP3...');
      const mp3Blob = await convertToMp3(audioBlob);
      const filename = `voice-note-${Date.now()}.mp3`;

      console.log('📤 Sending voice note via Wati API:', {
        phone: contact.phone,
        originalSize: audioBlob.size,
        mp3Size: mp3Blob.size,
        filename,
      });

      const result = await sendSessionFile(contact.phone, mp3Blob, filename);

      if (result.success) {
        console.log('✅ Voice note sent via Wati API');

        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessageId
            ? { ...msg, status: 'sent' }
            : msg
        ));

        toast.success('Voice message sent!', { icon: '🎤' });

        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        console.error('❌ Wati API error:', result.message);
        toast.error(result.message || 'Failed to send voice message');
        markFailed();
      }

      setIsSending(false);
    } catch (error) {
      console.error('❌ Error sending voice note:', error);
      toast.error('Failed to send voice message');
      markFailed();
    }
  };

  // Format recording duration
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessageInput(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  // Handle key down
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
    {/* Camera Overlay */}
    {showCamera && (
      <div className="fixed inset-0 z-[60] bg-black flex flex-col">
        {/* Camera header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <button
            onClick={closeCamera}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium">
            {isVideoRecording ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {formatRecordingTime(videoRecordingDuration)}
              </span>
            ) : 'Camera'}
          </span>
          <button
            onClick={switchCamera}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        </div>

        {/* Video preview */}
        <video
          ref={cameraVideoRef}
          autoPlay
          playsInline
          muted
          className="flex-1 object-cover w-full"
        />

        {/* Hidden canvas for photo capture */}
        <canvas ref={cameraCanvasRef} className="hidden" />

        {/* Camera controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-8">
            {/* Video record button */}
            {!isVideoRecording ? (
              <>
                <button
                  onClick={startVideoRecording}
                  className="w-14 h-14 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:border-red-400 hover:text-red-400 transition-colors"
                  title="Record Video"
                >
                  <Video className="w-6 h-6" />
                </button>

                {/* Photo capture - main button */}
                <button
                  onClick={takePhoto}
                  className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Take Photo"
                >
                  <div className="w-[60px] h-[60px] rounded-full bg-white" />
                </button>

                {/* Placeholder for symmetry */}
                <div className="w-14 h-14" />
              </>
            ) : (
              <>
                <div className="w-14 h-14" />

                {/* Stop recording - main button */}
                <button
                  onClick={stopVideoRecording}
                  className="w-[72px] h-[72px] rounded-full border-4 border-red-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Stop Recording"
                >
                  <div className="w-8 h-8 rounded-md bg-red-500" />
                </button>

                <div className="w-14 h-14" />
              </>
            )}
          </div>
        </div>
      </div>
    )}

    <div className="bg-[#1e1e1e] border-t border-[#333] px-4 py-3 flex-shrink-0">
      {isRecording ? (
        // Voice Recording UI
        <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-2xl px-4 py-3">
          <div className={`w-10 h-10 rounded-full ${isRecordingPaused ? 'bg-yellow-500' : 'bg-red-500'} flex items-center justify-center ${isRecordingPaused ? '' : 'animate-pulse'} flex-shrink-0`}>
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium">{isRecordingPaused ? 'Paused' : 'Recording...'}</p>
            <p className={`text-lg font-mono ${isRecordingPaused ? 'text-yellow-400' : 'text-red-400'}`}>{formatRecordingTime(recordingDuration)}</p>
          </div>
          <button
            onClick={cancelVoiceRecording}
            className="w-9 h-9 rounded-full bg-[#333] hover:bg-[#444] text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={togglePauseRecording}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 flex-shrink-0 ${
              isRecordingPaused
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
            title={isRecordingPaused ? 'Resume' : 'Pause'}
          >
            {isRecordingPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={stopVoiceRecording}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg flex-shrink-0"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      ) : (
        // Normal Message Input
        <div className="space-y-2">
          {/* Main input row */}
          <div className="flex items-start gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                rows="1"
                disabled={isSending}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white text-sm placeholder-gray-500 resize-none transition-all duration-200 focus:outline-none focus:border-[#BBA473]/60 disabled:opacity-50"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {/* Send / Mic button */}
            {messageInput.trim() ? (
              <button
                onClick={() => handleSendMessage()}
                disabled={!messageInput.trim() || isSending}
                className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Send className="w-4.5 h-4.5" />
                )}
              </button>
            ) : (
              <button
                onClick={startVoiceRecording}
                disabled={isSending}
                className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Record Voice Message"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Emoji */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    showEmojiPicker
                      ? 'bg-[#BBA473] text-black'
                      : 'text-gray-400 hover:text-[#BBA473] hover:bg-[#BBA473]/10'
                  }`}
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-50">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme="dark"
                      searchPlaceholder="Search emoji..."
                      width={320}
                      height={380}
                      emojiStyle="native"
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              {/* Attach */}
              <button
                onClick={handleFileAttachment}
                disabled={isSending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#BBA473] hover:bg-[#BBA473]/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Camera */}
              <button
                onClick={handleCameraCapture}
                disabled={isSending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#BBA473] hover:bg-[#BBA473]/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Camera"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-[#333] mx-1" />

              {/* Template */}
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-gray-400 hover:text-[#BBA473] hover:bg-[#BBA473]/10 transition-all duration-200 text-xs"
                title="Send Template"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Template</span>
              </button>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              {isConnected ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ChatInput;