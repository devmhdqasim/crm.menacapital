import React, { useState, useEffect } from 'react';
import { getAllSalesManagerLeads, getSalesEventLeads, assignLeadToAgent, updateLeadTask, bulkAssignLeadsToAgent } from '../../services/leadService';
import { getAllUsers } from '../../services/teamService';
import toast from 'react-hot-toast';
import SalesManagerLeadsListing from './SalesManagerLeadsListing';
import SalesManagerLeadFormDrawer from './SalesManagerLeadFormDrawer';
import SalesManagerAssignLeadModal from './SalesManagerAssignLeadModal';
import ReminderModal from './TaskManagementModal';
import { getDashboardStatsByFilter } from '../../services/dashboardService';

// Source tabs that have their own dedicated API (handled inside Listing)
const SELF_FETCHING_SOURCES = ['Event']; // 'Event' maps to 'Event Leads' tab

const SalesManagerLeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [crmCategorySummary, setCrmCategorySummary] = useState({});
  const [crmLeadSourceSummary, setCrmLeadSourceSummary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState('');
  const [activeSubSubTab, setActiveSubSubTab] = useState('');
  const [activeSubSubSubTab, setActiveSubSubSubTab] = useState('');
  const [activeSubSubSubSubTab, setActiveSubSubSubSubTab] = useState('');
  const [taskCurrentLeadStatus, setTaskCurrentLeadStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [agents, setAgents] = useState([]);
  const [showRowModal, setShowRowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAgentForLead, setSelectedAgentForLead] = useState('');
  const [assigningLead, setAssigningLead] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [assignToSelf, setAssignToSelf] = useState(false);
  const [originalAssignedAgent, setOriginalAssignedAgent] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [kioskMembers, setKioskMembers] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState('assign');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('');
  const [eventLeadsCount, setEventLeadsCount] = useState(0);
  const [mobileLeadsCount, setMobileLeadsCount] = useState(0);
  const [ramadanLeadsCount, setRamadanLeadsCount] = useState(0);

  // Status update states
  const [leadResponseStatus, setLeadResponseStatus] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  const [modalAnswered, setModalAnswered] = useState('');
  const [modalInterested, setModalInterested] = useState('');
  const [modalLeadType, setModalLeadType] = useState('');
  const [modalHotLeadType, setModalHotLeadType] = useState('');
  const [modalDepositStatus, setModalDepositStatus] = useState('');

  // Demo checkboxes state
  const [demoInstallApp, setDemoInstallApp] = useState(false);
  const [demoEducationVideo, setDemoEducationVideo] = useState(false);
  const [demoAnalyzeChannel, setDemoAnalyzeChannel] = useState(false);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskLead, setTaskLead] = useState(null);

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper: is the active tab a dynamic source tab that fetches in the Listing?
  // Dynamic source tabs (everything after Event Leads) self-fetch inside Listing.
  const isDynamicSourceTab = () => {
    const staticTabs = ['All', 'Assigned', 'Not Assigned', 'Contacted', 'Event Leads'];
    return !staticTabs.includes(activeTab);
  };

  // Helper function to build status parameter based on active tabs
  const getStatusParam = () => {
    if (activeTab === 'Assigned') return 'Assigned';
    if (activeTab === 'Not Assigned') return 'Not-Assigned';
    if (activeTab === 'Contacted') {
      if (activeSubTab === 'Interested') {
        if (activeSubSubTab === 'Warm') return 'Warm';
        if (activeSubSubTab === 'Hot') {
          if (activeSubSubSubTab === 'Demo') return 'Demo';
          if (activeSubSubSubTab === 'Real') {
            if (activeSubSubSubSubTab === 'Deposit') return 'Deposit';
            if (activeSubSubSubSubTab === 'Not Deposit') return 'Not-Deposit';
            return 'Real';
          }
          return 'Hot';
        }
        return 'Interested';
      }
      if (activeSubTab === 'Not Interested') return 'Not-Interested';
      if (activeSubTab === 'Not Answered') return 'Not-Answered';
      if (activeSubTab === 'Answered') return 'Answered';
      return 'Contacted';
    }
    return '';
  };

  // Fetch event leads count on initial load
  const fetchEventLeadsCount = async () => {
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const agentId = selectedAgentFilter || '';

      const result = await getSalesEventLeads(1, 1, startDateStr, endDateStr, debouncedSearchQuery, '', agentId);
      if (result.success && result.metadata) {
        setEventLeadsCount(result.metadata.total || 0);
      }
    } catch (error) {
      console.error('Error fetching event leads count:', error);
    }
  };

  // Fetch mobile leads count
  const fetchMobileLeadsCount = async () => {
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const agentId = selectedAgentFilter || '';

      const result = await getAllSalesManagerLeads(1, 1, startDateStr, endDateStr, debouncedSearchQuery, 'Mobile', agentId);
      if (result.success && result.metadata) {
        setMobileLeadsCount(result.metadata.total || 0);
      }
    } catch (error) {
      console.error('Error fetching mobile leads count:', error);
    }
  };

  // Fetch ramadan leads count
  const fetchRamadanLeadsCount = async () => {
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const agentId = selectedAgentFilter || '';

      const result = await getAllSalesManagerLeads(1, 1, startDateStr, endDateStr, debouncedSearchQuery, 'Ramadan', agentId);
      if (result.success && result.metadata) {
        setRamadanLeadsCount(result.metadata.total || 0);
      }
    } catch (error) {
      console.error('Error fetching ramadan leads count:', error);
    }
  };

  // Fetch dashboard data — also stores crmLeadSourceSummary for dynamic tabs
  const fetchDashboardData = async () => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    const agentId = selectedAgentFilter || '';

    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr, debouncedSearchQuery, agentId);

      if (result.success && result.data) {
        if (result.data.crmCategorySummary) {
          setCrmCategorySummary(result.data.crmCategorySummary);
          localStorage.setItem('leadsCount', JSON.stringify(result.data.crmCategorySummary));
          localStorage.setItem('leadsAgentCount', JSON.stringify(result.data.crmAgentCategorySummary));
        }
        // Store source summary for dynamic tabs
        if (Array.isArray(result.data.crmLeadSourceSummary)) {
          setCrmLeadSourceSummary(result.data.crmLeadSourceSummary);
        }
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const statusParam = getStatusParam();
      const agentId = selectedAgentFilter || '';

      const result = await getAllSalesManagerLeads(
        page,
        limit,
        startDateStr,
        endDateStr,
        debouncedSearchQuery,
        statusParam,
        agentId
      );

      if (result.success && result.data) {
        const transformedLeads = result.data.map((lead) => ({
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
          lastTaskStatus: lead.lastTaskStatus,
          createdAt: lead.createdAt,
          leadSourceId: lead?.leadSourceId?.[0],
          kioskLeadStatus: lead.kioskLeadStatus ?? '-',
          chatbotMessage: lead.chatbotMessage,
          contacted: lead.contacted || false,
          answered: lead.answered || false,
          interested: lead.interested || false,
          hot: lead.hot || false,
          cold: lead.cold || false,
          real: lead.real || false,
          demo: lead.demo || false,
          deposited: lead.deposited || false,
          latestRemarks: lead.latestRemarks || '',
        }));

        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
        fetchDashboardData();
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch leads');
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh current tab data
  const refreshCurrentTab = () => {
    if (activeTab === 'Event Leads' || isDynamicSourceTab()) {
      // Listing component handles its own fetch via its own useEffect trigger
      // We trigger it by forcing a state update — simplest: call fetchDashboardData
      // and let the Listing re-fetch on its own dependency change.
      // For Event Leads the Listing already watches the deps.
      fetchEventLeadsCount();
    } else {
      fetchLeads(currentPage, itemsPerPage);
    }
  };

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

        const userData = JSON.parse(localStorage.getItem('userInfo') || '{}');
        setCurrentUserId(userData._id || userData.id);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchKioskMembers = async () => {
    try {
      const result = await getAllUsers(1, 100);
      if (result.success && result.data) {
        const kioskMembersData = result.data.filter(user => user.roleName === 'Kiosk Member');
        const transformedKioskMembers = kioskMembersData.map((user) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        }));
        setKioskMembers(transformedKioskMembers);
      }
    } catch (error) {
      console.error('Error fetching kiosk members:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchKioskMembers();
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fetch counts on initial load and when filters change
  useEffect(() => {
    fetchEventLeadsCount();
    fetchMobileLeadsCount();
    fetchRamadanLeadsCount();
  }, [startDate, endDate, debouncedSearchQuery, selectedAgentFilter]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab, activeSubTab, activeSubSubTab, activeSubSubSubTab, activeSubSubSubSubTab, selectedAgentFilter]);

  // Fetch leads when page, filters, or dates change — skip for self-fetching tabs
  useEffect(() => {
    if (activeTab === 'Event Leads' || isDynamicSourceTab()) {
      return;
    }
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, activeTab, activeSubTab, activeSubSubTab, activeSubSubSubTab, activeSubSubSubSubTab, selectedAgentFilter]);

  // Also fetch dashboard on initial mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const handleRowClick = (lead, e) => {
    if (e.target.closest('button')) return;

    setSelectedLead(lead);
    setOriginalAssignedAgent(lead.agentId || '');
    setSelectedAgentForLead(lead.agentId || '');
    setAssignToSelf(lead.agentId === currentUserId);

    setDemoInstallApp(false);
    setDemoEducationVideo(false);
    setDemoAnalyzeChannel(false);

    if (lead.agentId === currentUserId) {
      setActiveModalTab('status');
      setModalRemarks(lead.latestRemarks || '');

      if (!lead.contacted) {
        setModalAnswered('');
        setModalInterested('');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
        setLeadResponseStatus('');
      } else if (lead.contacted && !lead.answered) {
        setModalAnswered('Not Answered');
        setLeadResponseStatus('Not Answered');
        setModalInterested('');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (lead.contacted && lead.answered && !lead.interested) {
        setModalAnswered('Answered');
        setModalInterested('Not Interested');
        setLeadResponseStatus('Not Interested');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (lead.contacted && lead.answered && lead.interested) {
        setModalAnswered('Answered');
        setModalInterested('Interested');

        if (!lead.hot) {
          setModalLeadType('Warm');
          setLeadResponseStatus('Warm');
          setModalHotLeadType('');
          setModalDepositStatus('');
        } else {
          setModalLeadType('Hot');
          if (lead.demo && !lead.real) {
            setModalHotLeadType('Demo');
            setLeadResponseStatus('Demo');
            setModalDepositStatus('');
          } else if (lead.real) {
            setModalHotLeadType('Real');
            setLeadResponseStatus('Real');
            if (lead.deposited) {
              setModalDepositStatus('Deposit');
              setLeadResponseStatus('Deposit');
            } else {
              setModalDepositStatus('Not Deposit');
              setLeadResponseStatus('Not Deposit');
            }
          } else {
            setLeadResponseStatus('Hot');
            setModalHotLeadType('');
            setModalDepositStatus('');
          }
        }
      }
    } else {
      setActiveModalTab('assign');
    }

    setShowRowModal(true);
  };

  const handleAssignAgent = async () => {
    const agentToAssign = assignToSelf ? currentUserId : selectedAgentForLead;

    if (!agentToAssign) {
      toast.error('Please select an agent');
      return;
    }

    setAssigningLead(true);

    try {
      const result = await assignLeadToAgent(selectedLead.id, agentToAssign);

      if (result.success) {
        toast.success(result.message || 'Lead assigned to agent successfully!');
        setShowRowModal(false);
        setSelectedLead(null);
        setSelectedAgentForLead('');
        setAssignToSelf(false);
        setOriginalAssignedAgent('');
        refreshCurrentTab();
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to assign lead to agent');
        }
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead. Please try again');
    } finally {
      setAssigningLead(false);
    }
  };

  const validateModalForm = () => {
    const errors = {};
    if (!leadResponseStatus) {
      errors.answered = 'Please complete the status selection';
    }
    if (modalHotLeadType === 'Demo') {
      if (!demoInstallApp || !demoEducationVideo) {
        errors.demoCheckboxes = 'Please complete the first two required demo steps';
      }
    }
    if (modalRemarks && modalRemarks.length > 500) {
      errors.remarks = 'Remarks must not exceed 500 characters';
    }
    return errors;
  };

  const handleStatusUpdate = async () => {
    const errors = validateModalForm();
    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    try {
      const payload = {
        contacted: false,
        answered: false,
        interested: false,
        hot: false,
        cold: false,
        real: false,
        deposited: false,
        latestRemarks: modalRemarks,
        currentStatus: leadResponseStatus,
      };

      if (modalHotLeadType === 'Demo') {
        payload.applicationInstalled = demoInstallApp;
        payload.educationalVideosSent = demoEducationVideo;
        payload.socialMediaLinksSent = demoAnalyzeChannel;
      }

      if (modalAnswered === 'Not Answered') {
        payload.contacted = true;
        payload.answered = false;
      } else if (modalAnswered === 'Answered') {
        payload.contacted = true;
        payload.answered = true;

        if (modalInterested === 'Not Interested') {
          payload.interested = false;
          payload.cold = true;
        } else if (modalInterested === 'Interested') {
          payload.interested = true;

          if (modalLeadType === 'Warm') {
            payload.hot = false;
            payload.cold = false;
          } else if (modalLeadType === 'Hot') {
            payload.hot = true;

            if (modalHotLeadType === 'Demo') {
              payload.real = false;
            } else if (modalHotLeadType === 'Real') {
              payload.real = true;
              payload.deposited = modalDepositStatus === 'Deposit';
            }
          }
        }
      }

      const result = await updateLeadTask(selectedLead.id, payload);

      if (result.success) {
        toast.success(result?.message || 'Lead status updated successfully!');
        handleCloseModal();
        refreshCurrentTab();
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to update lead status');
        }
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status. Please try again');
    }
  };

  const hasAssignmentChanged = () => {
    const currentAssignment = assignToSelf ? currentUserId : selectedAgentForLead;
    return currentAssignment !== originalAssignedAgent;
  };

  const handleCloseModal = () => {
    setShowRowModal(false);
    setSelectedLead(null);
    setSelectedAgentForLead('');
    setAssignToSelf(false);
    setOriginalAssignedAgent('');
    setActiveModalTab('assign');
    setModalAnswered('');
    setModalInterested('');
    setModalLeadType('');
    setModalHotLeadType('');
    setModalDepositStatus('');
    setModalRemarks('');
    setModalErrors({});
    setDemoInstallApp(false);
    setDemoEducationVideo(false);
    setDemoAnalyzeChannel(false);
  };

  const handleBulkAssign = async (agentId, leadIds) => {
    try {
      const result = await bulkAssignLeadsToAgent(agentId, leadIds, 'Bulk assigned by sales manager', 'Pending');

      if (result.success) {
        toast.success(result.message || 'Leads assigned successfully!');
        refreshCurrentTab();
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.message || 'Failed to bulk assign leads');
        }
      }
    } catch (error) {
      console.error('Error bulk assigning leads:', error);
      toast.error('Failed to bulk assign leads. Please try again');
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(null);
  };

  const handleOpenTaskModal = (lead) => {
    setTaskLead(lead);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setTaskLead(null);
  };

  // Build leadsCount prop: merge crmCategorySummary + leadSourceSummary array
  const leadsCountProp = {
    ...crmCategorySummary,
    leadSourceSummary: crmLeadSourceSummary,
  };

  return (
    <>
      <SalesManagerLeadsListing
        leads={leads}
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
        totalLeads={totalLeads}
        loading={loading}
        isLoaded={isLoaded}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        handleRowClick={handleRowClick}
        setDrawerOpen={setDrawerOpen}
        setEditingLead={setEditingLead}
        drawerOpen={drawerOpen}
        agents={agents}
        leadsCount={leadsCountProp}
        selectedAgentFilter={selectedAgentFilter}
        setSelectedAgentFilter={setSelectedAgentFilter}
        setLeads={setLeads}
        setTotalLeads={setTotalLeads}
        setLoading={setLoading}
        debouncedSearchQuery={debouncedSearchQuery}
        eventLeadsCount={eventLeadsCount}
        setEventLeadsCount={setEventLeadsCount}
        mobileLeadsCount={mobileLeadsCount}
        setMobileLeadsCount={setMobileLeadsCount}
        ramadanLeadsCount={ramadanLeadsCount}
        setRamadanLeadsCount={setRamadanLeadsCount}
        kioskMembers={kioskMembers}
        handleBulkAssign={handleBulkAssign}
        currentUserId={currentUserId}
      />

      <SalesManagerLeadFormDrawer
        drawerOpen={drawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        editingLead={editingLead}
        fetchLeads={fetchLeads}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        kioskMembers={kioskMembers}
        currentUserId={currentUserId}
      />

      <SalesManagerAssignLeadModal
        showRowModal={showRowModal}
        selectedLead={selectedLead}
        handleCloseModal={handleCloseModal}
        agents={agents}
        assignToSelf={assignToSelf}
        setAssignToSelf={setAssignToSelf}
        selectedAgentForLead={selectedAgentForLead}
        setSelectedAgentForLead={setSelectedAgentForLead}
        assigningLead={assigningLead}
        handleAssignAgent={handleAssignAgent}
        hasAssignmentChanged={hasAssignmentChanged}
        activeModalTab={activeModalTab}
        setActiveModalTab={setActiveModalTab}
        currentUserId={currentUserId}
        leadResponseStatus={leadResponseStatus}
        setLeadResponseStatus={setLeadResponseStatus}
        modalRemarks={modalRemarks}
        setModalRemarks={setModalRemarks}
        modalErrors={modalErrors}
        setModalErrors={setModalErrors}
        modalAnswered={modalAnswered}
        setModalAnswered={setModalAnswered}
        modalInterested={modalInterested}
        setModalInterested={setModalInterested}
        modalLeadType={modalLeadType}
        setModalLeadType={setModalLeadType}
        modalHotLeadType={modalHotLeadType}
        setModalHotLeadType={setModalHotLeadType}
        modalDepositStatus={modalDepositStatus}
        setModalDepositStatus={setModalDepositStatus}
        handleStatusUpdate={handleStatusUpdate}
        onOpenTaskModal={handleOpenTaskModal}
        demoInstallApp={demoInstallApp}
        setDemoInstallApp={setDemoInstallApp}
        demoEducationVideo={demoEducationVideo}
        setDemoEducationVideo={setDemoEducationVideo}
        demoAnalyzeChannel={demoAnalyzeChannel}
        setDemoAnalyzeChannel={setDemoAnalyzeChannel}
        activeTab={activeTab}
      />

      <ReminderModal
        showReminderModal={showTaskModal}
        selectedLead={taskLead}
        currentStatus={leadResponseStatus}
        handleCloseReminderModal={handleCloseTaskModal}
      />
    </>
  );
};

export default SalesManagerLeadManagement;