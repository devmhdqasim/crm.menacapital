import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, FileText, Paperclip, Mic, Smile, RefreshCw, X, Camera, Video, SwitchCamera, Circle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { sendWatiMessage, sendSessionFile } from '../../../services/inboxService';

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
}) => {
  
  // Handle send text message
  const handleSendMessage = async () => {
    const textToSend = messageInput.trim();
    if (!textToSend || !contact) return;

    setIsSending(true);

    try {
      const result = await sendWatiMessage(contact.phone, textToSend);

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
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
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

  // Start video recording
  const startVideoRecording = useCallback(() => {
    if (!cameraStreamRef.current) return;

    videoChunksRef.current = [];
    const recorder = new MediaRecorder(cameraStreamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (videoChunksRef.current.length > 0) {
        const blob = new Blob(videoChunksRef.current, { type: 'video/mp4' });
        if (onCameraCapture) {
          onCameraCapture(blob, 'video');
        }
      }
      closeCamera();
    };

    recorder.start();
    videoRecorderRef.current = recorder;
    setIsVideoRecording(true);
    setVideoRecordingDuration(0);

    videoTimerRef.current = setInterval(() => {
      setVideoRecordingDuration(prev => prev + 1);
    }, 1000);
  }, [onCameraCapture, closeCamera, videoRecordingDuration]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Only send if recording has actual audio chunks (cancel clears the array)
        if (audioChunksRef.current.length > 0) {
          await sendVoiceNote(audioBlob);
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        
        // Reset recording state
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
      };

      mediaRecorder.start();
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

  // ✅ FIXED: Stop voice recording
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // ✅ FIXED: Cancel voice recording
  const cancelVoiceRecording = () => {
    // Clear audio chunks so nothing is sent
    audioChunksRef.current = [];
    setRecordingDuration(0);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    
    toast.success('Recording cancelled', { duration: 1500, icon: '❌' });
  };

  // ✅ FIXED: Send voice note (matches image send pattern)
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
      const filename = `voice-note-${Date.now()}.webm`;

      console.log('📤 Sending voice note via Wati API:', {
        phone: contact.phone,
        size: audioBlob.size,
        filename,
      });

      const result = await sendSessionFile(contact.phone, audioBlob, filename);

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
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse flex-shrink-0">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium">Recording...</p>
            <p className="text-lg font-mono text-red-400">{formatRecordingTime(recordingDuration)}</p>
          </div>
          <button
            onClick={cancelVoiceRecording}
            className="w-9 h-9 rounded-full bg-[#333] hover:bg-[#444] text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
            title="Cancel"
          >
            <X className="w-4 h-4" />
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