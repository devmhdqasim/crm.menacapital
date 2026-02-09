import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Check, CheckCheck, Clock, AlertCircle, RefreshCw, Phone, Mail, Globe, User, ChevronDown, AlertTriangle, CheckCircle, FileText, Search, ChevronLeft, Filter, Smartphone, StickyNote, Bell, Tag, Calendar, MessageSquare, Info, Paperclip, Image as ImageIcon, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { sendWatiMessage, getWatiMessages, createWatiContact, getWatiTemplates, sendWatiTemplateMessage } from '../../../services/inboxService';
import { useWebSocket } from '../../../context/WebSocketContext';

const InboxChatDrawerWithMedia = ({ isOpen, onClose, contact, refreshContacts }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contactNotFound, setContactNotFound] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState(null);
  const [failedMessages, setFailedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState({});
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Profile sidebar state
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // Message search state
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Follow-up reminder state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  // Tags state
  const [contactTags, setContactTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // WebSocket integration
  const { isConnected, addMessageListener, sendMessage: sendWsMessage } = useWebSocket();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch messages and contact data
  useEffect(() => {
    if (contact) {
      setMessages([]);
      setIsLoading(true);
      setContactNotFound(false);
      setMessageInput('');
      setShowTemplatePicker(false);
      setShowContactInfo(false);
      setRetryingMessageId(null);
      setIsSending(false);
      setActiveTab('chat');
      setShowMessageSearch(false);

      fetchWatiMessages();
      loadContactNotes();
      loadContactTags();
      loadContactReminders();

      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [contact]);

  // Load contact notes from localStorage/API
  const loadContactNotes = () => {
    try {
      const storedNotes = localStorage.getItem(`notes_${contact.id}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
  };

  // Save note
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

  // Delete note
  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${contact.id}`, JSON.stringify(updatedNotes));
    toast.success('Note deleted');
  };

  // Load contact tags
  const loadContactTags = () => {
    try {
      const storedTags = localStorage.getItem(`tags_${contact.id}`);
      if (storedTags) {
        setContactTags(JSON.parse(storedTags));
      } else {
        setContactTags([]);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      setContactTags([]);
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (!newTag.trim() || contactTags.includes(newTag.trim())) return;

    const updatedTags = [...contactTags, newTag.trim()];
    setContactTags(updatedTags);
    localStorage.setItem(`tags_${contact.id}`, JSON.stringify(updatedTags));
    setNewTag('');
    setShowTagInput(false);
    toast.success('Tag added');
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = contactTags.filter(t => t !== tagToRemove);
    setContactTags(updatedTags);
    localStorage.setItem(`tags_${contact.id}`, JSON.stringify(updatedTags));
    toast.success('Tag removed');
  };

  // Load reminders
  const loadContactReminders = () => {
    // TODO: Implement reminder loading from backend
  };

  // Set follow-up reminder
  const handleSetReminder = () => {
    if (!reminderTime) {
      toast.error('Please select a time');
      return;
    }

    const reminder = {
      id: Date.now(),
      contactId: contact.id,
      time: reminderTime,
      note: reminderNote,
      createdAt: new Date().toISOString(),
    };

    const existingReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    existingReminders.push(reminder);
    localStorage.setItem('reminders', JSON.stringify(existingReminders));

    toast.success(`Reminder set for ${new Date(reminderTime).toLocaleString()}`);
    setShowReminderModal(false);
    setReminderTime('');
    setReminderNote('');
  };

  // Search messages
  const handleMessageSearch = (query) => {
    setMessageSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages
      .map((msg, index) => ({ ...msg, originalIndex: index }))
      .filter(msg => 
        msg.text && msg.text.toLowerCase().includes(query.toLowerCase())
      );
    
    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      scrollToMessage(results[0].id);
    }
  };

  // Navigate search results
  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }

    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex].id);
  };

  // Scroll to specific message
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => element.classList.remove('highlight-message'), 2000);
    }
  };

  // Group messages by date
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

  // WebSocket listener for incoming messages
  useEffect(() => {
    if (!contact || !isConnected) return;

    console.log('👂 Listening for messages from:', contact.phone);

    const unsubscribe = addMessageListener((data) => {
      console.log('📨 Socket.IO message received:', data);

      const messageWaId = data.from || data.waId;
      const contactWaId = contact.phone.replace(/\D/g, '');
      
      if (!messageWaId.includes(contactWaId) && !contactWaId.includes(messageWaId)) {
        return;
      }

      // Create new message object with media support
      const newMessage = {
        id: `socket-${Date.now()}`,
        text: data.text || data.message || '',
        sender: 'contact',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        sortTimestamp: Date.now(),
        status: 'delivered',
        type: data.type || 'text',
        mediaUrl: data.media?.url || data.data || null,
      };

      setMessages(prev => {
        const exists = prev.some(msg => 
          msg.text === newMessage.text && 
          Math.abs(msg.sortTimestamp - newMessage.sortTimestamp) < 5000
        );
        if (exists) return prev;
        
        return [...prev, newMessage].sort((a, b) => a.sortTimestamp - b.sortTimestamp);
      });

      setTimeout(() => scrollToBottom(), 100);

      toast.success(`New message from ${contact.name}`, {
        duration: 3000,
        icon: '💬',
      });

      if (refreshContacts) {
        refreshContacts();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [contact, isConnected, addMessageListener, refreshContacts]);

  const fetchWatiMessages = async () => {
    if (!contact || !contact.phone) return;

    setIsLoading(true);
    setContactNotFound(false);
    try {
      const result = await getWatiMessages(contact.phone, 100, 0);

      if (result.success && result.data && result.data.messages && result.data.messages.items) {
        const watiMessages = result.data.messages.items;

        const transformedMessages = watiMessages
          .filter(msg =>
            msg.eventType === 'message' ||
            msg.type === 'template' ||
            msg.eventType === 'broadcastMessage'
          )
          .map((msg) => {
            const timestamp = msg.timestamp ? parseInt(msg.timestamp) * 1000 : new Date(msg.created).getTime();
            const date = new Date(timestamp);

            const timeString = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            let messageText = msg.text;
            let isTemplate = msg.type === 'template' || msg.eventType === 'broadcastMessage';

            if (msg.eventType === 'broadcastMessage' && msg.finalText) {
              messageText = msg.finalText;
            } else if (msg.type === 'template') {
              const templateData = msg.data || {};
              messageText = templateData.body || templateData.text || msg.text || '📋 Template Message';
              if (templateData.header?.text) {
                messageText = `*${templateData.header.text}*\n\n${messageText}`;
              }
              if (templateData.footer) {
                messageText = `${messageText}\n\n_${templateData.footer}_`;
              }
            } else if (!messageText) {
              if (msg.type === 'image') messageText = '📷 Image';
              else if (msg.type === 'document') messageText = '📄 Document';
              else if (msg.type === 'audio') messageText = '🎵 Audio';
              else if (msg.type === 'video') messageText = '🎬 Video';
              else messageText = '📎 Media';
            }

            return {
              id: msg.id,
              text: messageText,
              sender: (msg.owner || msg.eventType === 'broadcastMessage') ? 'user' : 'contact',
              timestamp: timeString,
              sortTimestamp: timestamp,
              status: msg.statusString ? msg.statusString.toLowerCase() : 'sent',
              type: msg.type || 'text',
              mediaUrl: msg.data?.url || null,
              isTemplate: isTemplate,
            };
          });

        transformedMessages.sort((a, b) => a.sortTimestamp - b.sortTimestamp);

        setMessages(transformedMessages);
      } else if (result.info && result.info.includes('Contact not found')) {
        setContactNotFound(true);
        if (contact.remarks || contact.latestRemarks) {
          setMessages([
            {
              id: 1,
              text: contact.remarks || contact.latestRemarks,
              sender: 'contact',
              timestamp: new Date(contact.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }),
              sortTimestamp: new Date(contact.createdAt).getTime(),
              status: 'read',
              type: 'text',
            },
          ]);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching Wati messages:', error);
      toast.error('Failed to load conversation history');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await getWatiTemplates();

      if (result.success && result.data) {
        const templatesList = result.data.messageTemplates || result.templates || result.data || [];
        const activeTemplates = templatesList.filter(t => t.status === 'APPROVED');
        setTemplates(activeTemplates);
        setFilteredTemplates(activeTemplates);

        const uniqueCategories = [...new Set(activeTemplates.map(t => t.category || 'UNCATEGORIZED'))];
        setCategories(uniqueCategories);
      } else {
        toast.error('Failed to load templates');
        setTemplates([]);
        setFilteredTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => (t.category || 'UNCATEGORIZED') === selectedCategory);
    }

    if (templateSearchQuery.trim()) {
      const query = templateSearchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.elementName || '').toLowerCase().includes(query) ||
        (t.body || '').toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templateSearchQuery, selectedCategory, templates]);

  const handleOpenTemplatePicker = () => {
    setShowTemplatePicker(true);
    setSelectedTemplate(null);
    setTemplateParams({});
    setTemplateSearchQuery('');
    setSelectedCategory('all');
    if (templates.length === 0) {
      fetchTemplates();
    }
  };

  const handleCloseTemplatePicker = () => {
    setShowTemplatePicker(false);
    setSelectedTemplate(null);
    setTemplateParams({});
    setTemplateSearchQuery('');
    setSelectedCategory('all');
    setShowWhatsAppPreview(false);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (template.customParams && template.customParams.length > 0) {
      const params = {};
      template.customParams.forEach((param, index) => {
        params[index] = {
          name: param.paramName,
          value: '',
          placeholder: param.paramValue || '',
        };
      });
      setTemplateParams(params);
    } else {
      const paramMatches = (template.body || '').match(/\{\{(\d+)\}\}/g);
      if (paramMatches) {
        const uniqueParams = [...new Set(paramMatches)];
        const params = {};
        uniqueParams.forEach((match, index) => {
          const paramNum = match.match(/\d+/)[0];
          params[index] = {
            name: paramNum,
            value: '',
            placeholder: '',
          };
        });
        setTemplateParams(params);
      } else {
        setTemplateParams({});
      }
    }
  };

  const handleBackToTemplateList = () => {
    setSelectedTemplate(null);
    setTemplateParams({});
    setShowWhatsAppPreview(false);
  };

  const renderTemplatePreviewText = (template, params) => {
    let text = template.body || '';
    Object.keys(params).forEach((key, idx) => {
      const param = params[key];
      const value = typeof param === 'object' ? (param.value || `{{${idx + 1}}}`) : (param || `{{${key}}}`);
      text = text.replace(
        new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'),
        `<span class="text-[#BBA473] font-semibold bg-[#BBA473]/10 px-1 rounded">${value}</span>`
      );
    });
    return text;
  };

  const renderTemplateText = (text) => {
    if (!text) return '';
    return text.replace(/\{\{(\d+)\}\}/g, '<span class="text-[#BBA473] font-semibold">{{$1}}</span>');
  };

  const handleSendTemplateMessage = async () => {
    if (!selectedTemplate || !contact) return;

    const requiredParams = Object.keys(templateParams);
    const missingParams = requiredParams.filter(key => {
      const param = templateParams[key];
      return typeof param === 'object' ? !param.value?.trim() : !param?.trim();
    });

    if (missingParams.length > 0) {
      toast.error('Please fill in all template parameters');
      return;
    }

    setIsSendingTemplate(true);
    try {
      const formattedParams = Object.keys(templateParams)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => {
          const param = templateParams[key];
          if (typeof param === 'object') {
            return {
              name: param.name,
              value: param.value,
            };
          }
          return {
            name: key,
            value: param,
          };
        });

      const result = await sendWatiTemplateMessage(
        contact.phone,
        selectedTemplate.elementName,
        formattedParams
      );

      if (result.success) {
        toast.success('Template message sent successfully!');

        const newMessage = {
          id: Date.now(),
          text: `📋 Template: ${selectedTemplate.elementName}\n\n${Object.keys(templateParams).length > 0
            ? selectedTemplate.body.replace(/\{\{(\d+)\}\}/g, (_, num) => templateParams[num] || `{{${num}}}`)
            : selectedTemplate.body}`,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          sortTimestamp: Date.now(),
          status: 'sent',
          isTemplate: true,
          type: 'text',
        };
        setMessages(prev => [...prev, newMessage]);

        handleCloseTemplatePicker();
        setContactNotFound(false);

        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        if (result.contactNotFound || result.windowExpired) {
          toast.error(result.message || 'Failed to send template', { duration: 4000 });
        } else {
          toast.error(result.message || 'Failed to send template message');
        }
      }
    } catch (error) {
      console.error('Error sending template:', error);
      toast.error('Failed to send template message');
    } finally {
      setIsSendingTemplate(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateContact = async () => {
    if (!contact) return;

    setIsSending(true);
    try {
      const result = await createWatiContact(contact.phone, contact.name, {
        email: contact.email,
        nationality: contact.nationality,
        source: contact.source,
      });

      if (result.success) {
        toast.success('Contact added to Wati successfully!');
        setContactNotFound(false);
        fetchWatiMessages();
      } else {
        toast.error(result.message || 'Failed to add contact to Wati');
      }
    } catch (error) {
      console.error('❌ Error creating Wati contact:', error);
      toast.error('Failed to add contact to Wati');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (retryMessageId = null, retryText = null) => {
    const textToSend = retryText || messageInput.trim();
    if (!textToSend || !contact) return;

    const isRetry = retryMessageId !== null;

    if (isRetry) {
      setRetryingMessageId(retryMessageId);
    } else {
      setIsSending(true);
    }

    try {
      const result = await sendWatiMessage(contact.phone, textToSend);

      if (result.success) {
        if (isRetry) {
          setMessages(prev => prev.map(msg =>
            msg.id === retryMessageId
              ? { ...msg, status: 'sent', failed: false }
              : msg
          ));
          setFailedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(retryMessageId);
            return newSet;
          });
          toast.success('Message resent successfully!');
        } else {
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

          if (isConnected) {
            const cleanPhone = contact.phone.replace(/\D/g, '');
            sendWsMessage({
              waId: cleanPhone,
              text: textToSend,
              name: 'Agent',
            });
          }

          setMessages([...messages, newMessage]);
          setMessageInput('');
          setContactNotFound(false);

          if (!isConnected) {
            setTimeout(() => {
              setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
              ));
            }, 1000);

            setTimeout(() => {
              setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
              ));
            }, 3000);
          }
        }

        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        if (isRetry) {
          if (result.contactNotFound || result.windowExpired) {
            setContactNotFound(true);
            toast.error('Cannot resend: 24-hour messaging window closed', {
              duration: 4000,
              icon: '⏰',
            });
          } else {
            toast.error(result.message || 'Failed to resend message', {
              duration: 4000,
            });
          }
        } else {
          const failedMessage = {
            id: Date.now(),
            text: textToSend,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            sortTimestamp: Date.now(),
            status: 'failed',
            failed: true,
            type: 'text',
          };

          setMessages([...messages, failedMessage]);
          setFailedMessages(prev => new Set(prev).add(failedMessage.id));
          setMessageInput('');

          if (result.contactNotFound || result.windowExpired) {
            setContactNotFound(true);
            toast.error('Cannot send message: 24-hour messaging window closed', {
              duration: 4000,
              icon: '⏰',
            });
          } else {
            toast.error(result.message || 'Failed to send message', {
              duration: 4000,
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);

      if (isRetry) {
        toast.error('Failed to resend message. Please try again.', {
          duration: 4000,
        });
      } else {
        const failedMessage = {
          id: Date.now(),
          text: textToSend,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          sortTimestamp: Date.now(),
          status: 'failed',
          failed: true,
          type: 'text',
        };

        setMessages([...messages, failedMessage]);
        setFailedMessages(prev => new Set(prev).add(failedMessage.id));
        setMessageInput('');

        toast.error('Failed to send message. Please try again.', {
          duration: 4000,
        });
      }
    } finally {
      if (isRetry) {
        setRetryingMessageId(null);
      } else {
        setIsSending(false);
      }
    }
  };

  // NEW: Handle file attachment
  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  // NEW: Handle file selection and send
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !contact) return;

    // WhatsApp-safe MIME types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'audio/mpeg',
      'audio/ogg',
      'audio/mp4'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type. Only JPEG, PNG images and MP3, OGG, MP4 audio files are supported.');
      event.target.value = '';
      return;
    }

    const type = file.type.startsWith('audio') ? 'audio' : 'image';

    setIsSending(true);
    try {
      // Read file as ArrayBuffer
      const reader = new FileReader();
      
      reader.onload = async () => {
        // Send via Socket.IO
        if (isConnected) {
          const cleanPhone = contact.phone.replace(/\D/g, '');
          sendWsMessage({
            waId: cleanPhone,
            type,
            file: {
              buffer: reader.result,
              originalName: file.name,
              mimeType: file.type,
              size: file.size
            },
            name: 'Agent'
          });

          // Add optimistic message to UI
          const newMessage = {
            id: Date.now(),
            text: type === 'image' ? '📷 Image' : '🎵 Audio',
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            sortTimestamp: Date.now(),
            status: 'sent',
            type,
            mediaUrl: URL.createObjectURL(file), // Temporary local URL for preview
          };

          setMessages(prev => [...prev, newMessage]);
          toast.success(`${type === 'image' ? 'Image' : 'Audio'} sent successfully!`);
          
          if (refreshContacts) {
            refreshContacts();
          }
        } else {
          toast.error('Not connected to server. Please try again.');
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error(`Failed to send ${type}`);
    } finally {
      setIsSending(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleRetryMessage = (messageId, messageText) => {
    handleSendMessage(messageId, messageText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (status, failed) => {
    if (failed) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }

    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-[#BBA473]" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
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

  // NEW: Render message content based on type
  const renderMessageContent = (message) => {
    if (message.type === 'image' && message.mediaUrl) {
      return (
        <div className="space-y-2">
          <img
            src={message.mediaUrl}
            alt="Shared image"
            className="rounded-lg border-2 border-white/10 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.mediaUrl, '_blank')}
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
          {message.text && message.text !== '📷 Image' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    if (message.type === 'audio' && message.mediaUrl) {
      return (
        <div className="space-y-2">
          <audio controls className="w-full rounded-lg">
            <source src={message.mediaUrl} />
            Your browser does not support the audio element.
          </audio>
          {message.text && message.text !== '🎵 Audio' && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
      );
    }

    // Default text message
    return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>;
  };

  if (!isOpen) return null;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,audio/mpeg,audio/ogg,audio/mp4"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full bg-gradient-to-br from-[#1A1A1A] to-[#252525] shadow-2xl z-50 flex transform transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${showProfileSidebar ? 'w-full lg:w-[900px]' : 'w-full md:w-[500px] lg:w-[650px]'}`}>
        {contact && (
          <>
            {/* Main Chat Area */}
            <div className={`flex flex-col ${showProfileSidebar ? 'flex-1' : 'w-full'} transition-all duration-300`}>
              {/* Header */}
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
                {showMessageSearch && activeTab === 'chat' && (
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
                      {searchResults.length > 0 && (
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
                          setSearchResults([]);
                        }}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 24-Hour Window Warning */}
              {contactNotFound && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-yellow-500/30 p-5 animate-slideDown">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-yellow-400 font-bold mb-2 text-base">
                        ⏰ 24-Hour Messaging Window Closed
                      </h4>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                        WhatsApp Business requires the contact to message you first or the conversation must be within 24 hours of their last message.
                      </p>

                      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-yellow-500/20">
                        <p className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          How to reopen the conversation:
                        </p>
                        <ul className="text-sm text-gray-300 space-y-2.5">
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-0.5 text-lg">1.</span>
                            <span>Ask the contact to send a message to your WhatsApp Business number</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-0.5 text-lg">2.</span>
                            <span>Call them and request they message you on WhatsApp</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-yellow-400 mt-0.5 text-lg">3.</span>
                            <span>Use approved WhatsApp template messages (if configured)</span>
                          </li>
                        </ul>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg text-sm font-semibold transition-all duration-300 hover:from-[#d4bc89] hover:to-[#a69363] shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <Phone className="w-4 h-4" />
                          Call Contact
                        </button>
                        <button
                          onClick={() => setContactNotFound(false)}
                          className="px-4 py-2.5 bg-[#3A3A3A] text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-[#4A4A4A] border border-[#BBA473]/20"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat/Notes Tab Switcher */}
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
                    {notes.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BBA473] text-black rounded-full text-xs flex items-center justify-center font-bold">
                        {notes.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Messages/Notes Area */}
              <div className="flex-1 overflow-y-auto bg-[#1A1A1A] custom-scrollbar">
                {activeTab === 'chat' ? (
                  // Messages View
                  <div className="p-6 space-y-3">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#BBA473]/20 border-t-[#BBA473]"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A]"></div>
                          </div>
                        </div>
                        <span className="text-gray-400 mt-4 font-medium">Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
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
                    ) : (
                      <>
                        {/* Grouped Messages by Date */}
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

                                  {message.failed && message.sender === 'user' && (
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
                            ))}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                ) : (
                  // Notes View
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
                          disabled={!newNote.trim() || isAddingNote}
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
                )}
              </div>

              {/* Message Input */}
              <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5 shadow-lg flex-shrink-0">
                <div className="flex items-start gap-3">
                  <button
                    onClick={handleOpenTemplatePicker}
                    className="p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] hover:scale-110 active:scale-95 group"
                    title="Send Template"
                  >
                    <FileText className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                  </button>

                  {/* NEW: Attachment button */}
                  <button
                    onClick={handleFileAttachment}
                    disabled={isSending}
                    className="p-4 rounded-2xl flex-shrink-0 transition-all duration-300 transform bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send Image or Audio"
                  >
                    <Paperclip className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>

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
                    <div className="absolute right-4 bottom-4 text-xs text-gray-500">
                      {messageInput.length > 0 && `${messageInput.length} chars`}
                    </div>
                  </div>
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
                </div>

                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                  <span>Press Enter to send • Shift+Enter for new line • 📎 for media</span>
                  <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Sidebar - keeping existing code */}
            {showProfileSidebar && (
              <div className="w-80 bg-[#1A1A1A] border-l border-[#BBA473]/30 flex flex-col animate-slideInRight">
                {/* Profile Header */}
                <div className="p-5 border-b border-[#BBA473]/20">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <span className="text-4xl font-bold text-white">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{capitalizeWords(contact.name)}</h3>
                    <p className="text-sm text-gray-400">{formatPhoneDisplay(contact.phone)}</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  {/* Contact Info */}
                  <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
                    <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Contact Info</h4>
                    <div className="space-y-3">
                      {contact.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-4 h-4 text-[#BBA473]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-xs">Email</p>
                            <p className="text-white truncate">{contact.email}</p>
                          </div>
                        </div>
                      )}
                      {contact.nationality && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-4 h-4 text-[#BBA473]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-xs">Nationality</p>
                            <p className="text-white truncate">{contact.nationality}</p>
                          </div>
                        </div>
                      )}
                      {contact.source && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-base">📍</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-xs">Source</p>
                            <p className="text-white truncate">{contact.source}</p>
                          </div>
                        </div>
                      )}
                      {contact.agent && contact.agent !== 'Not Assigned' && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-[#BBA473]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-xs">Assigned Agent</p>
                            <p className="text-white truncate">{capitalizeWords(contact.agent)}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-[#BBA473]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs">First Contact</p>
                          <p className="text-white">{new Date(contact.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tags</h4>
                      <button
                        onClick={() => setShowTagInput(!showTagInput)}
                        className="text-[#BBA473] hover:text-[#d4bc89] text-xs font-medium"
                      >
                        + Add
                      </button>
                    </div>

                    {showTagInput && (
                      <div className="mb-3 flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="Enter tag..."
                          className="flex-1 px-3 py-1.5 text-sm bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white focus:outline-none focus:border-[#BBA473]"
                        />
                        <button
                          onClick={handleAddTag}
                          className="px-3 py-1.5 bg-[#BBA473] text-black rounded-lg text-sm font-medium hover:bg-[#d4bc89] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {contactTags.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No tags yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {contactTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#BBA473]/10 text-[#BBA473] rounded-full text-xs font-medium border border-[#BBA473]/20 group"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 hover:text-red-400" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
                    <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
                      <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Status</h4>
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${contact.kioskLeadStatus === 'Demo'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : contact.kioskLeadStatus === 'Real'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                        <CheckCircle className="w-3 h-3" />
                        {contact.kioskLeadStatus}
                      </span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
                    <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg text-sm font-semibold transition-all duration-300"
                      >
                        <Phone className="w-4 h-4" />
                        Call Contact
                      </button>
                      <button
                        onClick={() => setShowReminderModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg text-sm font-semibold transition-all duration-300"
                      >
                        <Bell className="w-4 h-4" />
                        Set Follow-up
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Template Picker Overlay */}
        {showTemplatePicker && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#252525] z-10 flex flex-col animate-slideInRight">
            {/* Template Picker Header */}
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectedTemplate ? handleBackToTemplateList : handleCloseTemplatePicker}
                  className="p-2 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300"
                >
                  {selectedTemplate ? <ChevronLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#BBA473]" />
                    {selectedTemplate ? 'Configure Template' : 'Send Template'}
                  </h3>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {selectedTemplate
                      ? `Sending to ${contact?.name || 'Contact'}`
                      : 'Choose a template to send'}
                  </p>
                </div>
              </div>

              {/* Search and Filter - Only show when viewing template list */}
              {!selectedTemplate && (
                <div className="mt-4 space-y-3">
                  {/* Search and Category Filter */}
                  <div className="flex flex-col md:flex-row gap-2">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-[#BBA473]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white text-sm transition-all duration-300"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="relative md:w-40">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border-2 border-[#BBA473]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white text-sm transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="all">All</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</span>
                    {(selectedCategory !== 'all' || templateSearchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setTemplateSearchQuery('');
                        }}
                        className="text-[#BBA473] hover:text-[#d4bc89] transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Template List or Selected Template View */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {!selectedTemplate ? (
                // Template List
                isLoadingTemplates ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#BBA473]/20 border-t-[#BBA473]"></div>
                    <span className="text-gray-400 mt-4">Loading templates...</span>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <FileText className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-400">No templates found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {templateSearchQuery ? 'Try adjusting your search' : 'No approved templates available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id || template.elementName}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full text-left bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20 hover:border-[#BBA473]/50 transition-all duration-300 hover:shadow-lg group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-white font-semibold text-sm group-hover:text-[#BBA473] transition-colors truncate">
                            {template.elementName}
                          </h4>
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                            Approved
                          </span>
                        </div>
                        <p
                          className="text-gray-400 text-sm line-clamp-2 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderTemplateText(template.body) }}
                        />
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="text-[#BBA473]">📁</span>
                            {template.category || 'General'}
                          </span>
                          {(() => {
                            const paramCount = (template.body || '').match(/\{\{\d+\}\}/g)?.length || 0;
                            return paramCount > 0 ? (
                              <span className="flex items-center gap-1">
                                <span className="text-[#BBA473]">📝</span>
                                {paramCount} param{paramCount > 1 ? 's' : ''}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                // Selected Template View with Parameter Input
                <div className="space-y-4">
                  {/* Template Info Header Card */}
                  <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-2xl p-5 border border-[#BBA473]/20 shadow-lg">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                            Approved
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#BBA473]/10 text-[#BBA473] border border-[#BBA473]/20">
                            {selectedTemplate.category || 'General'}
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-base mt-2">{selectedTemplate.elementName}</h4>
                        {selectedTemplate.language && (
                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                            <span>🌐</span> {selectedTemplate.language.text || selectedTemplate.language.key}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowWhatsAppPreview(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#2be374] hover:to-[#15a08e] text-white rounded-xl text-xs font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        <Smartphone className="w-4 h-4" />
                        Preview
                      </button>
                    </div>

                    {/* Template Body Preview */}
                    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#BBA473]/10">
                      {selectedTemplate.header && selectedTemplate.header.text && (
                        <div className="mb-3 pb-3 border-b border-[#BBA473]/10">
                          <p className="text-[#BBA473] text-sm font-semibold">{selectedTemplate.header.text}</p>
                        </div>
                      )}
                      <p
                        className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: renderTemplatePreviewText(selectedTemplate, templateParams)
                        }}
                      />
                      {selectedTemplate.footer && (
                        <div className="mt-3 pt-3 border-t border-[#BBA473]/10">
                          <p className="text-gray-500 text-xs italic">{selectedTemplate.footer}</p>
                        </div>
                      )}
                      {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#BBA473]/10 flex flex-wrap gap-2">
                          {selectedTemplate.buttons.map((btn, idx) => (
                            <div key={idx} className="px-3 py-1.5 bg-[#2A2A2A] rounded-lg text-xs text-[#BBA473] border border-[#BBA473]/20">
                              {btn.parameter?.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recipient Card */}
                  <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20">
                    <h5 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Sending To</h5>
                    <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-xl px-4 py-3 border border-[#BBA473]/10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-lg font-bold text-white">
                          {contact?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{contact?.name}</p>
                        <p className="text-gray-400 text-sm truncate flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {contact?.phone}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Parameter Inputs */}
                  {Object.keys(templateParams).length > 0 && (
                    <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-white font-semibold text-sm flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#BBA473]/20 flex items-center justify-center">
                            <span className="text-[#BBA473] text-xs">📝</span>
                          </div>
                          Template Variables
                        </h5>
                        <span className="text-xs text-gray-500">
                          {Object.values(templateParams).filter(p => typeof p === 'object' ? p.value?.trim() : p?.trim()).length} / {Object.keys(templateParams).length} filled
                        </span>
                      </div>
                      <div className="space-y-4">
                        {Object.keys(templateParams).sort((a, b) => parseInt(a) - parseInt(b)).map((paramKey) => {
                          const param = templateParams[paramKey];
                          const paramName = typeof param === 'object' ? param.name : paramKey;
                          const paramValue = typeof param === 'object' ? param.value : param;
                          const paramPlaceholder = typeof param === 'object' ? param.placeholder : '';
                          const isFilled = typeof param === 'object' ? param.value?.trim() : param?.trim();

                          return (
                            <div key={`param-${paramKey}`} className="group">
                              <label className="text-gray-300 text-sm mb-2 block font-medium flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-[#BBA473]/10 flex items-center justify-center text-[#BBA473] text-xs font-bold">
                                  {parseInt(paramKey) + 1}
                                </span>
                                <span className="text-[#BBA473]">{paramName}</span>
                                {!isFilled && (
                                  <span className="text-red-400 text-xs">*required</span>
                                )}
                              </label>
                              <input
                                type="text"
                                placeholder={paramPlaceholder || `Enter ${paramName}...`}
                                value={paramValue}
                                onChange={(e) => setTemplateParams({
                                  ...templateParams,
                                  [paramKey]: typeof param === 'object'
                                    ? { ...param, value: e.target.value }
                                    : e.target.value
                                })}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white text-sm transition-all duration-300 ${isFilled
                                  ? 'border-green-500/30 focus:border-green-500'
                                  : 'border-[#BBA473]/30 focus:border-[#BBA473]'
                                  }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Info Banner */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-blue-400 font-semibold text-sm">Template Messages</p>
                        <p className="text-blue-300/80 text-xs mt-1 leading-relaxed">
                          Template messages are pre-approved by WhatsApp and can be sent even outside the 24-hour messaging window.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Send Button - Only show when template is selected */}
            {selectedTemplate && (
              <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseTemplatePicker}
                    className="flex-1 px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendTemplateMessage}
                    disabled={isSendingTemplate || (Object.keys(templateParams).length > 0 && Object.values(templateParams).some(v => {
                      if (typeof v === 'object') return !v.value?.trim();
                      return !v?.trim();
                    }))}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSendingTemplate ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Preview Modal */}
        {showWhatsAppPreview && selectedTemplate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowWhatsAppPreview(false)}
            />
            <div
              className="bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col relative z-10 border border-[#BBA473]/30 animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-4 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">WhatsApp Preview</h3>
                      <p className="text-gray-400 text-xs">{selectedTemplate.elementName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWhatsAppPreview(false)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Phone Preview */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="bg-[#0A0A0A] rounded-3xl p-3 shadow-2xl border-4 border-[#2A2A2A]">
                  {/* Phone Status Bar */}
                  <div className="flex items-center justify-between px-4 py-2 text-white/60 text-xs">
                    <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-white/40 rounded-sm">
                        <div className="w-3/4 h-full bg-green-400 rounded-sm"></div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Header */}
                  <div className="bg-[#075E54] rounded-t-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ChevronLeft className="w-5 h-5 text-white" />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {contact?.name?.charAt(0)?.toUpperCase() || 'W'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{contact?.name || 'Contact'}</p>
                        <p className="text-white/70 text-xs">online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="bg-[#0B141A] min-h-[300px] p-4 relative">
                    {/* WhatsApp Background Pattern */}
                    <div className="absolute inset-0 opacity-5" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>

                    {/* Message Bubble */}
                    <div className="relative max-w-[85%] ml-auto">
                      <div className="bg-[#005C4B] rounded-lg rounded-tr-none p-3 shadow-lg">
                        {/* Header */}
                        {selectedTemplate.header && selectedTemplate.header.type > 0 && (
                          <div className="mb-2 pb-2 border-b border-white/10">
                            {selectedTemplate.header.text && (
                              <p className="text-white font-bold text-sm">{selectedTemplate.header.text}</p>
                            )}
                            {selectedTemplate.header.type === 3 && (
                              <div className="mt-2 bg-black/20 rounded-lg p-3 flex items-center gap-2">
                                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                                  📷
                                </div>
                                <span className="text-white/80 text-xs">Image</span>
                              </div>
                            )}
                            {selectedTemplate.header.type === 4 && (
                              <div className="mt-2 bg-black/20 rounded-lg p-3 flex items-center gap-2">
                                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                                  📹
                                </div>
                                <span className="text-white/80 text-xs">Video</span>
                              </div>
                            )}
                            {selectedTemplate.header.type === 5 && (
                              <div className="mt-2 bg-black/20 rounded-lg p-3 flex items-center gap-2">
                                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                                  📄
                                </div>
                                <span className="text-white/80 text-xs">Document</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Body */}
                        <p
                          className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{
                            __html: renderTemplatePreviewText(selectedTemplate, templateParams)
                          }}
                        />

                        {/* Footer */}
                        {selectedTemplate.footer && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-white/60 text-xs">{selectedTemplate.footer}</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-white/50 text-[10px]">
                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <CheckCheck className="w-4 h-4 text-blue-400" />
                        </div>
                      </div>

                      {/* Buttons */}
                      {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {selectedTemplate.buttons.map((btn, idx) => (
                            <div
                              key={idx}
                              className="bg-[#005C4B] rounded-lg px-4 py-2 text-center border-t border-[#0B141A]"
                            >
                              <p className="text-[#53BDEB] text-sm font-medium">{btn.parameter?.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Bar */}
                  <div className="bg-[#1F2C33] rounded-b-2xl px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-2">
                      <p className="text-gray-400 text-sm">Type a message</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center">
                      <Send className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-4 rounded-b-2xl flex-shrink-0">
                <p className="text-center text-gray-500 text-xs">
                  This is how your message will appear in WhatsApp
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-2xl shadow-2xl w-full max-w-md border border-[#BBA473]/30 animate-scaleIn">
              <div className="p-5 border-b border-[#BBA473]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#BBA473]/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-[#BBA473]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Set Follow-up Reminder</h3>
                      <p className="text-gray-400 text-xs">Get notified to follow up with this contact</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReminderModal(false)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#BBA473]" />
                    When to remind you?
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={reminderTime ? new Date(reminderTime) : null}
                      onChange={(date) => setReminderTime(date ? date.toISOString() : '')}
                      showTimeSelect
                      timeFormat="h:mm aa"
                      timeIntervals={15}
                      dateFormat="MMM d, yyyy h:mm aa"
                      placeholderText="Select date and time"
                      minDate={new Date()}
                      className="w-full px-4 py-3 pl-11 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] cursor-pointer"
                      calendarClassName="custom-datepicker"
                      wrapperClassName="w-full"
                      timeCaption="Time"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block font-medium">Note (optional)</label>
                  <textarea
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="Add a note about this follow-up..."
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white placeholder-gray-500 resize-none transition-all duration-300"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block font-medium">Quick presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'In 1 hour', hours: 1 },
                      { label: 'In 3 hours', hours: 3 },
                      { label: 'Tomorrow 9 AM', tomorrow: true },
                      { label: 'Next week', days: 7 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          const date = new Date();
                          if (preset.hours) {
                            date.setHours(date.getHours() + preset.hours);
                          } else if (preset.tomorrow) {
                            date.setDate(date.getDate() + 1);
                            date.setHours(9, 0, 0, 0);
                          } else if (preset.days) {
                            date.setDate(date.getDate() + preset.days);
                          }
                          setReminderTime(date.toISOString());
                        }}
                        className="px-3 py-2 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg text-xs font-medium transition-all duration-300 border border-[#BBA473]/20"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#BBA473]/20 flex gap-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetReminder}
                  disabled={!reminderTime}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-xl transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Reminder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }

        @keyframes pulse-slow {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.8; 
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .highlight-message {
          animation: highlightPulse 2s ease-out;
        }

        @keyframes highlightPulse {
          0% { background-color: rgba(187, 164, 115, 0.2); }
          50% { background-color: rgba(187, 164, 115, 0.4); }
          100% { background-color: transparent; }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1A1A;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #BBA473 0%, #8E7D5A 100%);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #d4bc89 0%, #a69363 100%);
        }

        textarea {
          field-sizing: content;
        }

        .z-\\[70\\] {
          z-index: 70;
        }

        /* Custom DatePicker Styling */
        .custom-datepicker {
          background-color: #2A2A2A !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 12px !important;
          font-family: inherit !important;
        }

        .react-datepicker {
          background-color: #2A2A2A !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 12px !important;
        }

        .react-datepicker__header {
          background-color: #1A1A1A !important;
          border-bottom: 1px solid rgba(187, 164, 115, 0.3) !important;
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker__day-name {
          color: #E8D5A3 !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day {
          color: #ffffff !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }

        .react-datepicker__day:hover {
          background-color: rgba(187, 164, 115, 0.2) !important;
          color: #BBA473 !important;
        }

        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list {
          background-color: #2a2a2a;
        }

        .react-datepicker__navigation--next--with-time:not(.react-datepicker__navigation--next--with-today-button) {
          width: 100%;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #BBA473 !important;
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--disabled {
          color: #666666 !important;
          opacity: 0.5 !important;
        }

        .react-datepicker__time-container {
          position: absolute;
          right: 100%;
          border: 2px solid #e8d5a33d;
          border-radius: 12px;
          border-left: 1px solid rgba(187, 164, 115, 0.3) !important;
        }

        .react-datepicker__time-list-item {
          color: #ffffff !important;
          transition: all 0.2s !important;
        }

        .react-datepicker__time-list-item:hover {
          background-color: rgba(187, 164, 115, 0.2) !important;
          color: #BBA473 !important;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #BBA473 !important;
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #BBA473 !important;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #E8D5A3 !important;
        }

        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default InboxChatDrawerWithMedia;