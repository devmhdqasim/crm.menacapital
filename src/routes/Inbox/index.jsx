import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getWatiContacts, getAllLeads } from '../../services/leadService';
import { getAllSalesManagerLeads } from '../../services/leadService';
import { getDashboardStatsByFilter } from '../../services/dashboardService';
import { getAllUsers } from '../../services/teamService';
import { markMessagesRead, getUnreadCount, getConversations } from '../../services/inboxService';
import toast from 'react-hot-toast';
import { useWebSocket } from '../../context/WebSocketContext';
import InboxListing from './InboxListing';
import InboxChatDrawer from './InboxChatDrawer';

const InboxPage = () => {
  const [contacts, setContacts] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalContacts, setTotalContacts] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('');

  // Chat drawer state
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  // Refs so WebSocket listener can access current drawer state without stale closures
  const selectedContactRef = useRef(null);
  const chatDrawerOpenRef = useRef(false);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
    chatDrawerOpenRef.current = chatDrawerOpen;
  }, [selectedContact, chatDrawerOpen]);

  // Reset unread count when inbox page is visible
  const { resetUnreadCount, addMessageListener } = useWebSocket();
  useEffect(() => {
    resetUnreadCount();
  }, [resetUnreadCount]);

  // Listen for new incoming messages and move that contact to the top
  useEffect(() => {
    const unsubscribe = addMessageListener((data) => {
      // Skip status updates and delivery/read events
      if (data.type === 'status_update') return;
      const evtType = data.type || data.eventType || '';
      if (evtType.includes('DELIVERED') || evtType.includes('READ_v')) return;

      // Sales Agent filtering: only show in inbox if leadAgentId matches logged-in user
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const role = userInfo.roleName || userInfo.role || '';
        const uid = userInfo._id || userInfo.id || '';
        const leadAgentId = data.leadData?.leadAgentId || null;
        if (role === 'Agent' && leadAgentId !== uid) {
          return; // Agent only sees messages for their own assigned leads
        }
      } catch {}

      // Extract phone number from the message
      const rawPhone = data.from || data.waId || '';
      const phone = typeof rawPhone === 'object' && rawPhone !== null
        ? (rawPhone.phoneNumber || '')
        : rawPhone;

      if (!phone) return;

      let messageText = data.text || data.message || '';
      // Backend sends type:"message" for media — infer actual type from URL for contact preview
      if (!messageText) {
        const mediaPath = (data.data || data.media?.url || '').toLowerCase();
        if (mediaPath.includes('/images/') || mediaPath.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) messageText = '📷 Image';
        else if (mediaPath.includes('/audios/') || mediaPath.includes('/ptt/') || mediaPath.match(/\.(opus|ogg|mp3|m4a|aac)(\?|$)/)) messageText = '🎤 Voice Note';
        else if (mediaPath.includes('/videos/') || mediaPath.match(/\.(mp4|mov|avi|3gp|webm)(\?|$)/)) messageText = '🎥 Video';
        else if (mediaPath.includes('/documents/') || mediaPath.match(/\.(pdf|doc|docx|xls|xlsx)(\?|$)/)) messageText = '📄 Document';
      }
      const stripNonDigits = (p) => (p || '').replace(/\D/g, '');
      const msgDigits = stripNonDigits(phone);

      // Match using last 9 digits to handle country code differences
      const phonesMatch = (a, b) => {
        if (!a || !b) return false;
        if (a === b) return true;
        const suffix = Math.min(a.length, b.length, 9);
        return a.slice(-suffix) === b.slice(-suffix);
      };

      const senderName = data.name && data.name !== 'Read type' ? data.name : phone;

      setContacts(prev => {
        const idx = prev.findIndex(c => phonesMatch(stripNonDigits(c.phone), msgDigits));

        if (idx === -1) {
          // Contact not in current list — add a temporary entry at the top
          const newContact = {
            id: `ws_${msgDigits}`,
            leadId: null,
            name: senderName,
            phone: phone,
            normalizedPhone: phone,
            email: '',
            agent: '',
            agentId: null,
            dateOfBirth: null,
            nationality: '',
            residency: '',
            language: '',
            source: '',
            remarks: '',
            depositStatus: '',
            status: '',
            createdAt: new Date().toISOString(),
            leadSourceId: null,
            kioskLeadStatus: '',
            contacted: false,
            answered: false,
            interested: false,
            hot: false,
            cold: false,
            real: false,
            demo: false,
            deposited: false,
            latestRemarks: '',
            lastTaskStatus: '',
            lastMessage: messageText || 'New message',
            lastMessageTime: new Date().toISOString(),
            sessionExpiresAt: null,
            unreadCount: 1,
            isOnline: false,
            avatar: null,
            _isFromWebSocket: true,
          };
          return [newContact, ...prev];
        }

        const updated = [...prev];
        const contact = { ...updated[idx] };
        contact.lastMessage = messageText || contact.lastMessage;
        contact.lastMessageTime = new Date().toISOString();

        // Don't increment unread if the drawer is currently open for this contact
        const isViewingThisContact = chatDrawerOpenRef.current &&
          selectedContactRef.current &&
          phonesMatch(stripNonDigits(selectedContactRef.current.phone), msgDigits);
        if (!isViewingThisContact) {
          contact.unreadCount = (contact.unreadCount || 0) + 1;
        }

        updated.splice(idx, 1);
        updated.unshift(contact);
        return updated;
      });
    });

    return () => unsubscribe();
  }, [addMessageListener]);

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Get user info from localStorage
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const role = userInfo.roleName || userInfo.role || '';
    const userId = userInfo._id || userInfo.id;

    setUserRole(role);
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    // Check if we need to auto-open a chat from Tasks page
    const phoneToOpen = sessionStorage.getItem('openChatForPhone');
    const nameToOpen = sessionStorage.getItem('openChatForName');
    const leadIdToOpen = sessionStorage.getItem('openChatForLeadId');
    
    if (phoneToOpen && contacts.length > 0) {
      // Find the contact by phone number
      const contactToOpen = contacts.find(
        contact => contact.phone === phoneToOpen || contact.id === leadIdToOpen
      );
      
      if (contactToOpen) {
        // Clear the sessionStorage
        sessionStorage.removeItem('openChatForPhone');
        sessionStorage.removeItem('openChatForName');
        sessionStorage.removeItem('openChatForLeadId');
        
        // Open the chat
        setTimeout(() => {
          handleContactClick(contactToOpen);
        }, 300);
      } else if (nameToOpen) {
        // If contact not found but we have the name, show a helpful message
        sessionStorage.removeItem('openChatForPhone');
        sessionStorage.removeItem('openChatForName');
        sessionStorage.removeItem('openChatForLeadId');
        
        toast.error(`Contact "${nameToOpen}" not found in current filters.`, {
          duration: 5000,
        });
      }
    }
  }, [contacts]); // Re-run when contacts are loaded

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const result = await getAllUsers(1, 100);

      if (result.success && result.data) {
        const agentsData = result.data.filter(user =>
          user.roleName === 'Agent' || user.role === 'Agent' ||
          user.roleName === 'Sales Manager' || user.role === 'Sales Manager'
        );

        const transformedAgents = agentsData.map((user) => ({
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phoneNumber,
          department: user.department || 'Sales',
          role: user.roleName || 'Agent',
        }));

        setAgents(transformedAgents);
      } else {
        console.error('Failed to fetch agents:', result.message);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Fetch contacts based on user role
  const fetchContacts = async (page = 1, limit = 30) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const agentId = selectedAgentFilter || '';

      let result;

      if (userRole === 'Sales Manager') {
        // Sales Manager sees all leads
        result = await getWatiContacts(
          page,
          limit,
          startDateStr,
          endDateStr,
          debouncedSearchQuery,
          '', // No status filter
          agentId
        );
      } else {
        // Agent sees only their assigned leads
        result = await getWatiContacts(
          page,
          limit,
          startDateStr,
          endDateStr,
          debouncedSearchQuery,
          '' // No status filter
        );
      }

      if (result.success && result.data) {
        const transformedContacts = result.data.map((lead) => {
          const userData = lead.userData || {};
          // leadAgentId can be null, a string, or an array of objects
          const agentObj = Array.isArray(lead.leadAgentId) && lead.leadAgentId.length > 0
            ? lead.leadAgentId[0]
            : null;

          return {
            id: lead._id,
            leadId: lead.leadId,
            name: lead.leadName || userData.name || '',
            email: lead.leadEmail || '',
            phone: typeof lead.leadPhoneNumber === 'object' && lead.leadPhoneNumber !== null
              ? (lead.leadPhoneNumber.phoneNumber || '')
              : (lead.leadPhoneNumber || ''),
            normalizedPhone: lead.normalizedPhone || userData.phoneNumber || '',
            agent: agentObj
              ? `${agentObj.firstName} ${agentObj.lastName}`
              : (lead.leadAgentId ? 'Assigned' : 'Not Assigned'),
            agentId: agentObj ? agentObj._id : (typeof lead.leadAgentId === 'string' ? lead.leadAgentId : null),
            dateOfBirth: lead.leadDateOfBirth,
            nationality: lead.leadNationality ?? '-',
            residency: lead.leadResidency,
            language: lead.leadPreferredLanguage,
            source: lead.leadSource,
            remarks: lead.leadDescription || '',
            depositStatus: lead.depositStatus || '',
            status: lead.leadStatus,
            createdAt: lead.createdAt,
            leadSourceId: Array.isArray(lead.leadSourceId) ? lead.leadSourceId[0] : lead.leadSourceId,
            kioskLeadStatus: lead.kioskLeadStatus ?? '-',
            contacted: lead.contacted || false,
            answered: lead.answered || false,
            interested: lead.interested || false,
            hot: lead.hot || false,
            cold: lead.cold || false,
            real: lead.real || false,
            demo: lead.demo || false,
            deposited: lead.deposited || false,
            latestRemarks: lead.latestRemarks || '',
            lastTaskStatus: lead.lastTaskStatus || '',
            // Messaging-specific fields from userData
            lastMessage: (Array.isArray(lead.lastMessage) && lead.lastMessage.length > 0 && lead.lastMessage[0].text)
              ? lead.lastMessage[0].text
              : (lead.latestRemarks || 'No messages yet'),
            lastMessageTime: (Array.isArray(lead.lastMessage) && lead.lastMessage.length > 0 && lead.lastMessage[0].createdAt)
              ? lead.lastMessage[0].createdAt
              : (userData.lastMessageAt || lead.updatedAt || lead.createdAt),
            leadAgentName: (lead.leadAgentName && lead.leadAgentName.trim()) ? lead.leadAgentName.trim() : '',
            sessionExpiresAt: userData.sessionExpiresAt || null,
            unreadCount: 0,
            isOnline: false,
            avatar: lead.profilePicture || lead.avatar || lead.profileUrl || lead.profileImg || null,
          };
        });

        setContacts(transformedContacts);
        setTotalContacts(result.metadata?.total || 0);

        // Fetch real unread counts from backend
        fetchUnreadCounts(transformedContacts);
      } else {
        console.error('Failed to fetch contacts:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch contacts');
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread counts from backend for all contacts
  const fetchUnreadCounts = async (contactsList) => {
    try {
      const results = await Promise.allSettled(
        contactsList.map(async (c) => {
          if (!c.phone) return { id: c.id, count: 0 };
          const result = await getUnreadCount(c.phone);
          if (result.success && result.data) {
            const d = result.data;
            const count = d.unreadCount ?? d.count ?? d.data?.unreadCount ?? d.data?.count ?? 0;
            return { id: c.id, count: typeof count === 'number' ? count : 0 };
          }
          return { id: c.id, count: 0 };
        })
      );

      const countMap = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          countMap[r.value.id] = r.value.count;
        }
      });

      setContacts(prev => prev.map(c => ({
        ...c,
        unreadCount: countMap[c.id] !== undefined ? countMap[c.id] : c.unreadCount,
      })));
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // Load contacts on component mount and when filters change
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Debug: log conversations API response
  useEffect(() => {
    getConversations(1, 10).then(result => {
      console.log('Conversations API response:', result);
    });
  }, []);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedAgentFilter]);

  // Fetch contacts when page, filters, or dates change
  useEffect(() => {
    if (userRole) {
      fetchContacts(currentPage, itemsPerPage);
    }
  }, [userRole, startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, selectedAgentFilter]);

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setChatDrawerOpen(true);

    // Mark messages as read and clear local unread badge
    if (contact.phone) {
      markMessagesRead(contact.phone).catch(() => {});
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  // Listen for notification clicks to open chat drawer
  useEffect(() => {
    const handleNotificationClick = () => {
      const phoneToOpen = sessionStorage.getItem('openChatForPhone');
      const nameToOpen = sessionStorage.getItem('openChatForName');
      if (!phoneToOpen) return;

      sessionStorage.removeItem('openChatForPhone');
      sessionStorage.removeItem('openChatForName');
      sessionStorage.removeItem('openChatForLeadId');

      const stripNonDigits = (p) => (p || '').replace(/\D/g, '');
      const targetDigits = stripNonDigits(phoneToOpen);

      const phonesMatch = (a, b) => {
        if (!a || !b) return false;
        if (a === b) return true;
        const suffix = Math.min(a.length, b.length, 9);
        return a.slice(-suffix) === b.slice(-suffix);
      };

      const contact = contacts.find(c => phonesMatch(stripNonDigits(c.phone), targetDigits));

      if (contact) {
        handleContactClick(contact);
      } else {
        // Contact not in current list — open with a minimal contact object
        handleContactClick({
          id: `ws_${targetDigits}`,
          name: nameToOpen || phoneToOpen,
          phone: phoneToOpen,
          email: '',
          agent: '',
          nationality: '',
          status: '',
          kioskLeadStatus: '',
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          isOnline: false,
          avatar: null,
        });
      }
    };

    window.addEventListener('openChatFromNotification', handleNotificationClick);
    return () => window.removeEventListener('openChatFromNotification', handleNotificationClick);
  }, [contacts]);

  const handleCloseChat = () => {
    setChatDrawerOpen(false);
    setSelectedContact(null);
  };

  const refreshContacts = useCallback(() => {
    fetchContacts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, userRole, startDate, endDate, debouncedSearchQuery, selectedAgentFilter]);

  const handleMarkUnread = useCallback((contactId) => {
    setContacts(prev => prev.map(c =>
      c.id === contactId ? { ...c, unreadCount: Math.max(c.unreadCount || 0, 1) } : c
    ));
  }, []);

  return (
    <>
      <InboxListing
        contacts={contacts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalContacts={totalContacts}
        loading={loading}
        isLoaded={isLoaded}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        handleContactClick={handleContactClick}
        userRole={userRole}
        agents={agents}
        selectedAgentFilter={selectedAgentFilter}
        setSelectedAgentFilter={setSelectedAgentFilter}
        onMarkUnread={handleMarkUnread}
      />

      <InboxChatDrawer
        isOpen={chatDrawerOpen}
        onClose={handleCloseChat}
        contact={selectedContact}
        refreshContacts={refreshContacts}
      />
    </>
  );
};

export default InboxPage;