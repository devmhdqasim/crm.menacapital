import React, { useState, useEffect, useCallback } from 'react';
import { getAllLeads } from '../../services/leadService';
import { getAllSalesManagerLeads } from '../../services/leadService';
import { getDashboardStatsByFilter } from '../../services/dashboardService';
import { getAllUsers } from '../../services/teamService';
import toast from 'react-hot-toast';
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
        result = await getAllSalesManagerLeads(
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
        result = await getAllLeads(
          page,
          limit,
          startDateStr,
          endDateStr,
          debouncedSearchQuery,
          '' // No status filter
        );
      }

      if (result.success && result.data) {
        const transformedContacts = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          email: lead.leadEmail,
          phone: lead.leadPhoneNumber,
          agent: lead.leadAgentId && lead.leadAgentId.length > 0
            ? `${lead.leadAgentId[0].firstName} ${lead.leadAgentId[0].lastName}`
            : 'Not Assigned',
          agentId: lead.leadAgentId && lead.leadAgentId.length > 0 ? lead.leadAgentId[0]._id : null,
          dateOfBirth: lead.leadDateOfBirth,
          nationality: lead.leadNationality ?? '-',
          residency: lead.leadResidency,
          language: lead.leadPreferredLanguage,
          source: lead.leadSource,
          remarks: lead.leadDescription || '',
          depositStatus: lead.depositStatus || '',
          status: lead.leadStatus,
          createdAt: lead.createdAt,
          leadSourceId: lead?.leadSourceId?.[0],
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
          // Add messaging-specific fields
          lastMessage: lead.latestRemarks || 'No messages yet',
          lastMessageTime: lead.updatedAt || lead.createdAt,
          unreadCount: 0, // TODO: Implement unread count from backend
          isOnline: false, // TODO: Implement online status from backend
          // Map potential profile picture fields
          avatar: lead.profilePicture || lead.avatar || lead.profileUrl || lead.profileImg || null,
        }));

        setContacts(transformedContacts);
        setTotalContacts(result.metadata?.total || 0);
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

  // Load contacts on component mount and when filters change
  useEffect(() => {
    setIsLoaded(true);
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
  };

  const handleCloseChat = () => {
    setChatDrawerOpen(false);
    setSelectedContact(null);
  };

  const refreshContacts = useCallback(() => {
    fetchContacts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, userRole, startDate, endDate, debouncedSearchQuery, selectedAgentFilter]);

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