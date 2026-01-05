import React, { useState, useEffect } from 'react';
import { getAllLeads } from '../../services/leadService';
import { getAllSalesManagerLeads } from '../../services/leadService';
import { getDashboardStatsByFilter } from '../../services/dashboardService';
import toast from 'react-hot-toast';
import InboxListing from './InboxListing';
import InboxChatDrawer from './InboxChatDrawer';

const InboxPage = () => {
  const [contacts, setContacts] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState('');
  const [activeSubSubTab, setActiveSubSubTab] = useState('');
  const [activeSubSubSubTab, setActiveSubSubSubTab] = useState('');
  const [activeSubSubSubSubTab, setActiveSubSubSubSubTab] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalContacts, setTotalContacts] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [contactsCount, setContactsCount] = useState({});
  
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

  // Helper function to build status parameter based on active tabs
  const getStatusParam = () => {
    if (activeTab === 'Assigned') {
      return 'Assigned';
    } else if (activeTab === 'Not Assigned') {
      return 'Not-Assigned';
    } else if (activeTab === 'Contacted') {
      if (activeSubTab === 'Interested') {
        if (activeSubSubTab === 'Warm') {
          return 'Warm';
        } else if (activeSubSubTab === 'Hot') {
          if (activeSubSubSubTab === 'Demo') {
            return 'Demo';
          } else if (activeSubSubSubTab === 'Real') {
            if (activeSubSubSubSubTab === 'Deposit') {
              return 'Deposit';
            } else if (activeSubSubSubSubTab === 'Not Deposit') {
              return 'Not-Deposit';
            }
            return 'Real';
          }
          return 'Hot';
        }
        return 'Interested';
      } else if (activeSubTab === 'Not Interested') {
        return 'Not-Interested';
      } else if (activeSubTab === 'Not Answered') {
        return 'Not-Answered';
      } else if (activeSubTab === 'Answered') {
        return 'Answered';
      }
      return 'Contacted';
    } else if (activeTab === 'Pending') {
      return 'Pending';
    }
    return '';
  };

  // Fetch dashboard data for counters
  const fetchDashboardData = async () => {
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    
    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr, debouncedSearchQuery, '');
      
      if (result.success && result.data) {
        if (result.data.crmCategorySummary) {
          setContactsCount(result.data.crmCategorySummary);
          localStorage.setItem('leadsCount', JSON.stringify(result.data.crmCategorySummary));
          localStorage.setItem('leadsAgentCount', JSON.stringify(result.data.crmAgentCategorySummary));
        }
        
        console.log('✅ Dashboard data loaded:', result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data. Please try again.');
    }
  };

  // Fetch contacts based on user role
  const fetchContacts = async (page = 1, limit = 30) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const statusParam = getStatusParam();
      
      let result;
      
      if (userRole === 'Sales Manager') {
        // Sales Manager sees all leads
        result = await getAllSalesManagerLeads(
          page,
          limit,
          startDateStr,
          endDateStr,
          debouncedSearchQuery,
          statusParam,
          '' // No agent filter
        );
      } else {
        // Agent sees only their assigned leads
        result = await getAllLeads(
          page,
          limit,
          startDateStr,
          endDateStr,
          debouncedSearchQuery,
          statusParam
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
        }));
        
        setContacts(transformedContacts);
        setTotalContacts(result.metadata?.total || 0);
        
        // Fetch dashboard data for counters
        fetchDashboardData();
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
  }, [debouncedSearchQuery, activeTab, activeSubTab, activeSubSubTab, activeSubSubSubTab, activeSubSubSubSubTab]);

  // Fetch contacts when page, filters, or dates change
  useEffect(() => {
    if (userRole) {
      fetchContacts(currentPage, itemsPerPage);
    }
  }, [userRole, startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, activeTab, activeSubTab, activeSubSubTab, activeSubSubSubTab, activeSubSubSubSubTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveSubTab('');
    setActiveSubSubTab('');
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const handleSubTabChange = (subTab) => {
    setActiveSubTab(subTab);
    setActiveSubSubTab('');
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
  };

  const handleSubSubTabChange = (subSubTab) => {
    setActiveSubSubTab(subSubTab);
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
  };

  const handleSubSubSubTabChange = (subSubSubTab) => {
    setActiveSubSubSubTab(subSubSubTab);
    setActiveSubSubSubSubTab('');
  };

  const handleSubSubSubSubTabChange = (subSubSubSubTab) => {
    setActiveSubSubSubSubTab(subSubSubSubTab);
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setChatDrawerOpen(true);
  };

  const handleCloseChat = () => {
    setChatDrawerOpen(false);
    setSelectedContact(null);
  };

  const refreshContacts = () => {
    fetchContacts(currentPage, itemsPerPage);
  };

  return (
    <>
      <InboxListing
        contacts={contacts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        activeSubSubTab={activeSubSubTab}
        activeSubSubSubTab={activeSubSubSubTab}
        activeSubSubSubSubTab={activeSubSubSubSubTab}
        handleTabChange={handleTabChange}
        handleSubTabChange={handleSubTabChange}
        handleSubSubTabChange={handleSubSubTabChange}
        handleSubSubSubTabChange={handleSubSubSubTabChange}
        handleSubSubSubSubTabChange={handleSubSubSubSubTabChange}
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
        contactsCount={contactsCount}
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