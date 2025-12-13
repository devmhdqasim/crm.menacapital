import React, { useState, useEffect } from 'react';
import { getAllSalesManagerLeads, assignLeadToAgent, updateLeadTask } from '../../services/leadService';
import { getAllUsers } from '../../services/teamService';
import toast from 'react-hot-toast';
import SalesManagerLeadsListing from './SalesManagerLeadsListing';
import SalesManagerLeadFormDrawer from './SalesManagerLeadFormDrawer';
import SalesManagerAssignLeadModal from './SalesManagerAssignLeadModal';
import ReminderModal from './TaskManagementModal';
import { getDashboardStatsByFilter } from '../../services/dashboardService';

const SalesManagerLeadManagement = () => {
  const [leads, setLeads] = useState([]);
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
  
  // Status update states
  const [leadResponseStatus, setLeadResponseStatus] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  const [modalAnswered, setModalAnswered] = useState('');
  const [modalInterested, setModalInterested] = useState('');
  const [modalLeadType, setModalLeadType] = useState('');
  const [modalHotLeadType, setModalHotLeadType] = useState('');
  const [modalDepositStatus, setModalDepositStatus] = useState('');

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskLead, setTaskLead] = useState(null);

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

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
      }  else if (activeSubTab === 'Answered') {
        return 'Answered';
      }
      return 'Contacted';
    }
    return ''; // All tab - no status filter
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    const agentId = selectedAgentFilter || '';
    
    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr, debouncedSearchQuery, agentId);
      
      if (result.success && result.data) {
        // Save crmCategorySummary to context
        if (result.data.crmCategorySummary) {
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
        }));
        
        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
        fetchDashboardData()
      } else {
        console.error('Failed to fetch leads:', result.message);
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

  const fetchAgents = async () => {
    try {
      const result = await getAllUsers(1, 100);
      
      if (result.success && result.data) {
        const agentsData = result.data.filter(user => 
          user.roleName === 'Agent' || user.role === 'Agent'
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
      } else {
        console.error('Failed to fetch agents:', result.message);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchKioskMembers = async () => {
    try {
      const result = await getAllUsers(1, 100);
      if (result.success && result.data) {
        const kioskMembersData = result.data.filter(user => 
          user.roleName === 'Kiosk Member'
        );
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

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab, activeSubTab, activeSubSubTab, activeSubSubSubTab, activeSubSubSubSubTab, selectedAgentFilter]);

  // Fetch leads when page, filters, or dates change
  useEffect(() => {
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, activeTab, activeSubTab, activeSubSubTab, activeSubSubSubTab, activeSubSubSubSubTab, selectedAgentFilter]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveSubTab('');
    setActiveSubSubTab('');
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
    // Clear search when switching tabs
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
    if (e.target.closest('button')) {
      return;
    }
    
    setSelectedLead(lead);
    setOriginalAssignedAgent(lead.agentId || '');
    setSelectedAgentForLead(lead.agentId || '');
    setAssignToSelf(lead.agentId === currentUserId);
    
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
        } else if (lead.hot) {
          setModalLeadType('Hot');
          
          if (lead.demo && !lead.real) {
            setModalHotLeadType('Demo');
            setLeadResponseStatus('Demo');
            setModalDepositStatus('');
          } else if (lead.real) {
            setModalHotLeadType('Real');
            
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
        await fetchLeads(currentPage, itemsPerPage);
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
        currentStatus: leadResponseStatus
      };

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
              
              if (modalDepositStatus === 'Deposit') {
                payload.deposited = true;
              } else if (modalDepositStatus === 'Not Deposit') {
                payload.deposited = false;
              }
            }
          }
        }
      }
      
      const result = await updateLeadTask(selectedLead.id, payload);
      
      if (result.success) {
        toast.success(result?.message || 'Lead status updated successfully!');
        
        // Close modal and refresh leads - no task modal opening
        handleCloseModal();
        fetchLeads(currentPage, itemsPerPage);
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
    // setLeadResponseStatus('');
    setModalAnswered('');
    setModalInterested('');
    setModalLeadType('');
    setModalHotLeadType('');
    setModalDepositStatus('');
    setModalRemarks('');
    setModalErrors({});
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
        selectedAgentFilter={selectedAgentFilter}
        setSelectedAgentFilter={setSelectedAgentFilter}
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