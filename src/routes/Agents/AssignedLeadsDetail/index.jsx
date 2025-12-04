import React, { useState, useEffect } from 'react';
import { getAllLeads } from '../../../services/leadService';
import toast from 'react-hot-toast';
import LeadsListing from '../../Leads/LeadsListing';

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [userDetails, setUserDetails] = useState('')
  const [searchQuery, setSearchQuery] = useState('');
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
  const [contactedSubTab, setContactedSubTab] = useState('Not Answered');
  const [interestedSubTab, setInterestedSubTab] = useState('');
  const [hotLeadSubTab, setHotLeadSubTab] = useState('');
  const [realSubTab, setRealSubTab] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadsSelectedId, setIsLeadsSelectedId] = useState(false);

  // Fetch leads from API
  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // Convert dates to ISO string format for API
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllLeads(page, limit, startDateStr, endDateStr);
      
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
    const FEATURE_START_DATE = '2026-01-23';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsLeadsSelectedId(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Load leads on component mount and when pagination changes
  useEffect(() => {
    setIsLoaded(true);
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage]);

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

  return (
    <>
      <LeadsListing
        leads={leads}
        title={'Agent Leads'}
        description={'View and manage agent leads information'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contactedSubTab={contactedSubTab}
        setContactedSubTab={setContactedSubTab}
        interestedSubTab={interestedSubTab}
        setInterestedSubTab={setInterestedSubTab}
        hotLeadSubTab={hotLeadSubTab}
        setHotLeadSubTab={setHotLeadSubTab}
        realSubTab={realSubTab}
        setRealSubTab={setRealSubTab}
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