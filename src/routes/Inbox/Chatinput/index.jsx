import React from 'react';
import { Send, FileText, Paperclip, Mic, Smile, RefreshCw, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { sendWatiMessage } from '../../../services/inboxService';

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
}) => {
  
  // Handle send text message
  const handleSendMessage = async () => {
    const textToSend = messageInput.trim();
    if (!textToSend || !contact) return;

    setIsSending(true);

    try {
      const result = await sendWatiMessage(contact.phone, textToSend);

      if (result.success) {
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

        // Send via WebSocket if connected
        if (isConnected) {
          const cleanPhone = contact.phone.replace(/\D/g, '');
          sendWsMessage({
            waId: cleanPhone,
            text: textToSend,
            type: 'text',
            name: 'Agent',
          });
        }

        setMessages([...messages, newMessage]);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
        
        // ✅ Only send if recording has content and duration > 0
        if (audioChunksRef.current.length > 0 && recordingDuration > 0) {
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

    if (!isConnected) {
      toast.error('Not connected to server. Please try again.');
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
    
    try {
      // ✅ Create local URL for immediate display
      const localUrl = URL.createObjectURL(audioBlob);
      
      // ✅ CRITICAL: Create optimistic message FIRST so it shows in chat immediately
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

      // ✅ Add to messages immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // ✅ Mark as downloaded so it displays without blur
      setDownloadedImages(prev => new Set(prev).add(optimisticMessageId));

      // ✅ Read file as ArrayBuffer for sending
      const reader = new FileReader();
      
      reader.onload = () => {
        const cleanPhone = contact.phone.replace(/\D/g, '');
        
        console.log('📤 Sending voice note via WebSocket:', {
          waId: cleanPhone,
          size: audioBlob.size,
          bufferSize: reader.result.byteLength
        });
        
        // ✅ CRITICAL: Send the voice note via Socket.IO with proper structure
        sendWsMessage({
          waId: cleanPhone,
          type: 'audio',
          file: {
            buffer: reader.result, // ArrayBuffer
            originalName: `voice-note-${Date.now()}.ogg`,
            mimeType: 'audio/ogg',
            size: audioBlob.size
          },
          name: 'Agent'
        });

        console.log('✅ Voice note sent via WebSocket');

        // ✅ Update message status to 'sent' after successful send
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessageId 
              ? { ...msg, status: 'sent' }
              : msg
          ));
        }, 500);

        toast.success('Voice message sent!', { icon: '🎤' });
        
        if (refreshContacts) {
          refreshContacts();
        }
        
        setIsSending(false);
      };

      reader.onerror = (error) => {
        console.error('❌ Failed to read voice note:', error);
        toast.error('Failed to send voice message');
        // Remove the optimistic message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageId));
        setIsSending(false);
      };

      // ✅ CRITICAL: Read as ArrayBuffer (same as image)
      reader.readAsArrayBuffer(audioBlob);
      
    } catch (error) {
      console.error('❌ Error sending voice note:', error);
      toast.error('Failed to send voice message');
      setIsSending(false);
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

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5 shadow-lg flex-shrink-0">
      {isRecording ? (
        // Voice Recording UI
        <div className="space-y-3">
          <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Recording voice message...</p>
              <p className="text-2xl font-mono text-red-400 mt-1">
                {formatRecordingTime(recordingDuration)}
              </p>
            </div>
            <button
              onClick={cancelVoiceRecording}
              className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={stopVoiceRecording}
              className="p-4 rounded-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black transition-all duration-300 shadow-lg hover:scale-110"
              title="Send"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Tap X to cancel • Tap Send arrow to send voice note
          </p>
        </div>
      ) : (
        // Normal Message Input
        <>
          <div className="flex items-start gap-3">
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] hover:scale-110 active:scale-95 group"
              title="Send Template"
            >
              <FileText className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            </button>

            <button
              onClick={handleFileAttachment}
              disabled={isSending}
              className="p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send Image or Audio"
            >
              <Paperclip className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Emoji Picker Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform hover:scale-110 active:scale-95 group ${
                  showEmojiPicker 
                    ? 'bg-[#BBA473] text-black' 
                    : 'bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473]'
                }`}
                title="Add Emoji"
              >
                <Smile className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50 animate-scaleIn">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme="dark"
                    searchPlaceholder="Search emoji..."
                    width={350}
                    height={400}
                    emojiStyle="native"
                    previewConfig={{
                      showPreview: false
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows="1"
                disabled={isSending}
                className="w-full px-5 py-3.5 pr-12 border-2 border-[#BBA473]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white placeholder-gray-500 resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '52px', maxHeight: '120px' }}
              />
              {messageInput.length > 0 && (
                <div className="absolute right-4 bottom-4 text-xs text-gray-500">
                  {messageInput.length} chars
                </div>
              )}
            </div>
            
            {/* Voice/Send Button (WhatsApp style) */}
            {messageInput.trim() ? (
              <button
                onClick={() => handleSendMessage()}
                disabled={!messageInput.trim() || isSending}
                className={`p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform ${messageInput.trim() && !isSending
                  ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:scale-110 shadow-lg hover:shadow-xl active:scale-95'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isSending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              <button
                onClick={startVoiceRecording}
                disabled={isSending}
                className="p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:scale-110 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Record Voice Message"
              >
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>
              Press Enter to send • Shift+Enter for new line • 😊 for emoji • 📎 for media • 🎤 for voice
            </span>
            <span className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInput;