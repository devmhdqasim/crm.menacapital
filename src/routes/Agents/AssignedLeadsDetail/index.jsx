import React, { useState, useEffect } from 'react';
import { getAllLeads } from '../../../services/leadService';
import toast from 'react-hot-toast';
import LeadsListing from '../LeadsListing'
import { getDashboardStatsByFilter } from '../../../services/dashboardService';

const LeadManagement = ({ selectedAgentId, selectedAgentUsername }) => {
  const [leads, setLeads] = useState([]);
  const [crmCategorySummary, setCrmCategorySummary] = useState([]);
  const [userDetails, setUserDetails] = useState('')
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // New hierarchical tab states
  const [contactedSubTab, setContactedSubTab] = useState('');
  const [interestedSubTab, setInterestedSubTab] = useState('');
  const [hotLeadSubTab, setHotLeadSubTab] = useState('');
  const [realSubTab, setRealSubTab] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadsSelectedId, setIsLeadsSelectedId] = useState(false);

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab, contactedSubTab, interestedSubTab, hotLeadSubTab, realSubTab]);

  // Helper function to get status parameter based on active tabs
  const getStatusParam = () => {
    if (activeTab === 'All') {
      return '';
    }
    
    if (activeTab === 'Pending') {
      return 'Pending';
    }
    
    if (activeTab === 'Contacted') {
      // Check for deepest level first
      if (contactedSubTab === 'Interested') {
        if (interestedSubTab === 'Warm') {
          return 'Warm';
        } else if (interestedSubTab === 'Hot') {
          if (hotLeadSubTab === 'Demo') {
            return 'Demo';
          } else if (hotLeadSubTab === 'Real') {
            if (realSubTab === 'Deposit') {
              return 'Deposit';
            } else if (realSubTab === 'Not Deposit') {
              return 'Not-Deposit';
            }
            return 'Real';
          }
          return 'Hot';
        }
        return 'Interested';
      } else if (contactedSubTab === 'Not Interested') {
        return 'Not-Interested';
      } else if (contactedSubTab === 'Not Answered') {
        return 'Not-Answered';
      }
      return 'Contacted';
    }
    
    return activeTab;
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    
    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr, debouncedSearchQuery, selectedAgentId);
      
      if (result.success && result.data) {
        // Save crmCategorySummary to context
        if (result.data.crmCategorySummary) {
          setCrmCategorySummary(result.data.crmAgentCategorySummary)
          localStorage.setItem('leadsCount', JSON.stringify(result.data.crmCategorySummary))
          localStorage.setItem('leadsAgentCount', JSON.stringify(result.data.crmAgentCategorySummary))
        }
        
        console.log('✅ Dashboard data loaded:', result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads from API
  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // Convert dates to ISO string format for API
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const statusParam = getStatusParam();
      const isAgent = true;
      
      const result = await getAllLeads(
        page, 
        limit, 
        startDateStr, 
        endDateStr, 
        debouncedSearchQuery, 
        statusParam,
        selectedAgentId || '', // Pass the selected agent ID
        isAgent,
      );
      
      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedLeads = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          email: lead.leadEmail,
          phone: lead.leadPhoneNumber,
          dateOfBirth: lead.leadDateOfBirth,
          nationality: lead.leadNationality,
          residency: lead.leadResidency,
          language: lead.leadPreferredLanguage,
          source: `${lead.leadSourceId.length > 0 ? `${lead.leadSourceId.at(-1).firstName} ${lead.leadSourceId.at(-1).lastName}`: "-"}`,
          leadSource: lead.leadSource,
          remarks: lead.leadDescription || '',
          status: lead.leadStatus ?? '-',
          createdAt: lead.createdAt,
          kioskLeadStatus: lead.kioskLeadStatus ?? '-',
          // Boolean flags for status tracking
          contacted: lead.contacted || false,
          answered: lead.answered || false,
          interested: lead.interested || false,
          hot: lead.hot || false,
          cold: lead.cold || false,
          real: lead.real || false,
          demo: lead.demo || false,
          deposited: lead.deposited || false,
          active: lead.active || false,
          depositStatus: lead.depositStatus || '',
          latestRemarks: lead.latestRemarks || '',
        }));
        
        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
        fetchDashboardData()
      } else {
        console.error('Failed to fetch leads:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Please try again');
    } finally {
      setLoading(false);
    }
  };

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    
    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
  
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2027-03-23';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsLeadsSelectedId(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Load leads on component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fetch leads when dependencies change - added sub-tab dependencies
  useEffect(() => {
    if (selectedAgentId) {
      fetchLeads(currentPage, itemsPerPage);
    }
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, activeTab, contactedSubTab, interestedSubTab, hotLeadSubTab, realSubTab, selectedAgentId]);

  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  };

  useEffect(() => {
    const userInfo = getUserInfo()
    setUserDetails(userInfo?.id ?? userInfo?.id)
  }, [])

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(null);
  };

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedLead(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset sub-tabs when changing main tab
    if (tab !== 'Contacted') {
      setContactedSubTab('subTask');
      setInterestedSubTab('');
      setHotLeadSubTab('');
      setRealSubTab('');
    }
    // Clear search when switching tabs
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const handleContactedSubTabChange = (subTab) => {
    setContactedSubTab(subTab);
    // Reset deeper level tabs
    if (subTab !== 'Interested') {
      setInterestedSubTab('');
      setHotLeadSubTab('');
      setRealSubTab('');
    }
  };

  const handleInterestedSubTabChange = (subTab) => {
    setInterestedSubTab(subTab);
    // Reset deeper level tabs
    if (subTab !== 'Hot') {
      setHotLeadSubTab('');
      setRealSubTab('');
    }
  };

  const handleHotLeadSubTabChange = (subTab) => {
    setHotLeadSubTab(subTab);
    // Reset deeper level tabs
    if (subTab !== 'Real') {
      setRealSubTab('');
    }
  };

  const handleRealSubTabChange = (subTab) => {
    setRealSubTab(subTab); 
  }; 

  return (
    <>
      <LeadsListing
        leads={leads} 
        title={'Agent Assigned Leads'}
        agentLeadsCount={crmCategorySummary?.find(lead => lead?.username == selectedAgentUsername)?.crmCategorySummary }
        description={'View and manage agent assigned leads'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        contactedSubTab={contactedSubTab}
        setContactedSubTab={handleContactedSubTabChange}
        interestedSubTab={interestedSubTab}
        setInterestedSubTab={handleInterestedSubTabChange}
        hotLeadSubTab={hotLeadSubTab}
        setHotLeadSubTab={handleHotLeadSubTabChange}
        realSubTab={realSubTab}
        setRealSubTab={handleRealSubTabChange}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalLeads={totalLeads}
        loading={loading}
        isLoaded={isLoaded}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isLeadsSelectedId={isLeadsSelectedId}
        handleRowClick={handleRowClick}
        setDrawerOpen={setDrawerOpen}
        setEditingLead={setEditingLead}
      />
    </>
  );
};

export default LeadManagement;