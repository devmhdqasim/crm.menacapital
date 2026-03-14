import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Edit, Trash2, UserPlus, AlertTriangle, X, MessageSquare, Check, Users, RefreshCw, StickyNote, ArrowRightLeft } from 'lucide-react';
import InboxChatDrawer from '../../Inbox/InboxChatDrawer';
import DateRangePicker from '../../../components/DateRangePicker';
import { deleteLead } from '../../../services/leadService';
import { getSalesEventLeads, getAllSalesManagerLeads } from '../../../services/leadService';
import toast from 'react-hot-toast';
import { useCRM } from '../../../context/CRMContext';

const SalesManagerLeadsListing = ({
  leads,
  searchQuery,
  setSearchQuery,
  activeTab,
  activeSubTab,
  activeSubSubTab,
  activeSubSubSubTab,
  activeSubSubSubSubTab,
  handleTabChange,
  handleSubTabChange,
  handleSubSubTabChange,
  handleSubSubSubTabChange,
  handleSubSubSubSubTabChange,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalLeads,
  loading,
  isLoaded,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleRowClick,
  setDrawerOpen,
  setEditingLead,
  drawerOpen,
  agents,
  selectedAgentFilter,
  setSelectedAgentFilter,
  leadsCount,
  setLeads,
  setTotalLeads,
  setLoading,
  debouncedSearchQuery,
  eventLeadsCount,
  setEventLeadsCount,
  mobileLeadsCount,
  setMobileLeadsCount,
  ramadanLeadsCount,
  setRamadanLeadsCount,
  kioskMembers = [],
}) => {
  const { crmCategorySummary } = useCRM();
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showAssignedLeadModal, setShowAssignedLeadModal] = useState(false);
  const [assignedLeadMessage, setAssignedLeadMessage] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatContact, setChatContact] = useState(null);

  // Source change modal states
  const [showSourceChangeModal, setShowSourceChangeModal] = useState(false);
  const [sourceChangeLead, setSourceChangeLead] = useState(null);
  const [sourceChangeStep, setSourceChangeStep] = useState('confirm'); // 'confirm' | 'form'
  const [sourceChangeSource, setSourceChangeSource] = useState('Kiosk');
  const [sourceChangeKioskMember, setSourceChangeKioskMember] = useState('');
  const [sourceChangeClosing, setSourceChangeClosing] = useState(false);
  const [sourceChangeErrors, setSourceChangeErrors] = useState({});

  // Bulk selection states
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [showBulkAssignDropdown, setShowBulkAssignDropdown] = useState(false);

  // Static tabs — Event Leads onwards will be appended dynamically
  const staticTabs = ['All', 'Assigned', 'Not Assigned', 'Contacted', 'Event Leads'];
  const perPageOptions = [10, 20, 30, 50, 100];

  // ─── Dynamic source tabs from crmLeadSourceSummary ───────────────────────────
  // leadsCount comes from the parent (crmCategorySummary from dashboard API).
  // The dashboard API also exposes crmLeadSourceSummary which the parent stores.
  // We receive it as `leadsCount` prop that mirrors crmCategorySummary.
  // The parent should pass crmLeadSourceSummary separately; for now we derive
  // dynamic tabs from a `sourceLeadsSummary` prop — see note below.
  // Because the parent only passes `leadsCount` (crmCategorySummary), we also
  // need the source summary. We'll read it from props if provided, else fall back
  // to an empty array so nothing breaks.
  // The parent passes `leadsCount` as crmCategorySummary. To support source tabs
  // we accept an additional optional prop `leadSourceSummary` (array).
  // Since the parent component isn't changed here, we read it from leadsCount
  // if it happens to be there, otherwise we show no extra tabs (safe fallback).

  // NOTE: The parent (SalesManagerLeadManagement) stores dashboard data in
  // crmCategorySummary state and passes it as `leadsCount`. The raw
  // crmLeadSourceSummary array is part of the same dashboard response but not
  // currently forwarded. The parent needs to forward it as `leadSourceSummary`.
  // We read it from props with a safe default so nothing breaks today.
  const leadSourceSummary = (typeof leadsCount === 'object' && Array.isArray(leadsCount?.leadSourceSummary))
    ? leadsCount.leadSourceSummary
    : [];

  // Build dynamic source tabs: exclude null _id, skip sources already covered or not wanted
  // 'Event' is already the 'Event Leads' static tab.
  // 'Kiosk' and 'Goldie' are excluded per product requirement.
  const excludedSources = ['Event'];
  const dynamicSourceTabs = leadSourceSummary
    .filter(s => s._id && !excludedSources.map(e => e.toLowerCase()).includes(s._id.toLowerCase()))
    .map(s => ({ name: s._id, count: s.total }));

  const allTabs = [
    ...staticTabs,
    ...dynamicSourceTabs.map(t => t.name),
  ];

  // Special tabs that have their own fetch logic inside this component
  const selfFetchingTabs = ['Event Leads', ...dynamicSourceTabs.map(t => t.name)];

  // Clear selection when tab, page, or filters change
  useEffect(() => {
    setSelectedLeads([]);
    setShowBulkStatusDropdown(false);
    setShowBulkAssignDropdown(false);
  }, [activeTab, activeSubTab, currentPage, itemsPerPage, debouncedSearchQuery]);

  // Close bulk dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.bulk-dropdown-container')) {
        setShowBulkStatusDropdown(false);
        setShowBulkAssignDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Critical tabs that get a red badge (high priority) ───────────────────
  const criticalTabs = ['Not Assigned'];

  // ─── Fetch leads based on active tab ─────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'Event Leads') {
      fetchEventLeads();
    } else {
      const dynTab = dynamicSourceTabs.find(t => t.name === activeTab);
      if (dynTab) {
        fetchSourceLeads(activeTab);
      }
    }
  }, [activeTab, currentPage, itemsPerPage, startDate, endDate, debouncedSearchQuery, selectedAgentFilter]);

  const fetchEventLeads = async () => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const agentId = selectedAgentFilter || '';

      const result = await getSalesEventLeads(
        currentPage,
        itemsPerPage,
        startDateStr,
        endDateStr,
        debouncedSearchQuery,
        '',
        agentId
      );

      if (result.success && result.data) {
        const transformedLeads = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          email: lead.leadEmail || '-',
          phone: lead.leadPhoneNumber,
          agent: lead.leadAgentId && lead.leadAgentId.length > 0
            ? `${lead.leadAgentId[0].firstName} ${lead.leadAgentId[0].lastName}`
            : 'Not Assigned',
          agentId: lead.leadAgentId && lead.leadAgentId.length > 0 ? lead.leadAgentId[0]._id : null,
          dateOfBirth: lead.leadDateOfBirth || '-',
          nationality: lead.leadNationality ?? '-',
          residency: lead.leadResidency || '-',
          language: lead.leadPreferredLanguage || '-',
          source: lead.leadSource,
          remarks: lead.leadDescription || '',
          depositStatus: lead.depositStatus || '',
          status: lead.leadStatus,
          lastTaskStatus: lead.lastTaskStatus,
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
        setEventLeadsCount(result.metadata?.total || 0);
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch event leads');
        }
      }
    } catch (error) {
      console.error('Error fetching event leads:', error);
      toast.error('Failed to fetch event leads. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Generic source-based fetch for dynamic tabs.
  // The leadService.getAllSalesManagerLeads API accepts `status` as the filter param.
  // For source tabs (e.g. MobileApp, Ramdhan, Social Media/WhatsApp) we pass the
  // source _id value directly as the `status` query param — this is how the backend
  // differentiates source-filtered requests.
  const fetchSourceLeads = async (source) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const agentId = selectedAgentFilter || '';

      // Pass source as the `status` param — getAllSalesManagerLeads signature:
      // (page, limit, fromDate, toDate, keyword, status, agentId)
      // Sanitize to strip special chars like "/" before building the URL.
// Build URL manually to send `source=` instead of `status=`
const axios = (await import('axios')).default;
const authToken = localStorage.getItem('refreshToken');
const API_BASE_URL = 'https://api.crm.saveingold.app/api/v1';

const queryParams = new URLSearchParams({
  paramPage: currentPage,
  paramLimit: itemsPerPage,
  fromDate: startDateStr,
  toDate: endDateStr,
  keyword: debouncedSearchQuery || '',
  source: source,  // ← source param, not status
});

if (agentId) queryParams.append('agent', agentId);

const response = await axios.get(
  `${API_BASE_URL}/lead/sales/en?${queryParams.toString()}`,
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    timeout: 30000,
  }
);

const data = response.data;
const result = data.status === 'success' && data.payload?.allBranchLeads?.[0]?.data
  ? {
      success: true,
      data: data.payload.allBranchLeads[0].data,
      metadata: data.payload.allBranchLeads[0].metadata?.[0] || {},
    }
  : { success: false, data: [], metadata: {}, error: { payload: { message: data.message } } };
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
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || `Failed to fetch ${source} leads`);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${source} leads:`, error);
      toast.error(`Failed to fetch ${source} leads. Please try again`);
    } finally {
      setLoading(false);
    }
  };

  // ─── Keep legacy separate fetchers for backward compat (Mobile / Ramadan) ─
  const fetchMobileLeads = async () => fetchSourceLeads('Mobile');
  const fetchRamadanLeads = async () => fetchSourceLeads('Ramadan');

  const getSubTabs = () => {
    if (activeTab === 'Contacted') {
      return ['Interested', 'Not Interested', 'Not Answered'];
    }
    return [];
  };

  const getSubSubTabs = () => {
    if (activeTab === 'Contacted' && activeSubTab === 'Interested') {
      return ['Warm', 'Hot'];
    }
    return [];
  };

  const getSubSubSubTabs = () => {
    if (activeTab === 'Contacted' && activeSubTab === 'Interested' && activeSubSubTab === 'Hot') {
      return ['Demo', 'Real'];
    }
    return [];
  };

  const getSubSubSubSubTabs = () => {
    if (activeTab === 'Contacted' && activeSubTab === 'Interested' && activeSubSubTab === 'Hot' && activeSubSubSubTab === 'Real') {
      return ['Deposit', 'Not Deposit'];
    }
    return [];
  };

  const filteredLeads = leads;

  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const currentLeads = filteredLeads;

  // Bulk selection computed values
  const isAllSelected = currentLeads.length > 0 && selectedLeads.length === currentLeads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < currentLeads.length;

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentLeads.map(l => l.id));
    }
  };

  const bulkStatusOptions = [
    { value: 'Not Answered', label: 'Not Answered', dot: 'bg-gray-400' },
    { value: 'Not Interested', label: 'Not Interested', dot: 'bg-gray-400' },
    { value: 'Warm', label: 'Warm Lead', dot: 'bg-orange-400' },
    { value: 'Hot', label: 'Hot Lead', dot: 'bg-red-400' },
    { value: 'Demo', label: 'Demo', dot: 'bg-yellow-400' },
    { value: 'Deposit', label: 'Deposit', dot: 'bg-purple-400' },
    { value: 'Not Deposit', label: 'Not Deposit', dot: 'bg-red-400' },
  ];

  const showingFrom = totalLeads > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min((currentPage - 1) * itemsPerPage + leads.length, totalLeads);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handlePerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setShowPerPageDropdown(false);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (currentPage >= totalPages - 1) {
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }
    return pages;
  };

  const handleOpenChat = (lead) => {
    if (lead.phone) {
      setChatContact({
        id: lead.id || `lead_${lead.phone}`,
        name: lead.name || lead.phone,
        phone: lead.phone,
        email: lead.email || '',
        agent: lead.agent || '',
        nationality: lead.nationality || '',
        status: lead.status || '',
        kioskLeadStatus: lead.kioskLeadStatus || '',
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false,
        avatar: null,
      });
      setChatDrawerOpen(true);
    } else {
      toast.error('No phone number available for this lead');
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setDrawerOpen(true);
  };

  const handleDelete = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;

    try {
      const result = await deleteLead(leadToDelete.id);

      if (result.success) {
        toast.success(result.message || 'Lead deleted successfully!');
        setShowDeleteConfirmModal(false);
        setLeadToDelete(null);

        if (activeTab === 'Event Leads') {
          fetchEventLeads();
        } else {
          const dynTab = dynamicSourceTabs.find(t => t.name === activeTab);
          if (dynTab) {
            fetchSourceLeads(activeTab);
          } else {
            window.location.reload();
          }
        }
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to delete lead');
        }
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('Failed to delete lead. Please try again');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setLeadToDelete(null);
  };

  const isMobileAppSource = (source) => {
    if (!source) return false;
    const s = source.toLowerCase().replace(/[\s_-]/g, '');
    return s === 'mobile' || s === 'mobileapp';
  };

  const handleOpenSourceChange = (lead) => {
    setSourceChangeLead(lead);
    setSourceChangeStep('confirm');
    setSourceChangeSource('Kiosk');
    setSourceChangeKioskMember('');
    setSourceChangeClosing(false);
    setSourceChangeErrors({});
    setShowSourceChangeModal(true);
  };

  const handleCloseSourceChangeModal = () => {
    setSourceChangeClosing(true);
    setTimeout(() => {
      setShowSourceChangeModal(false);
      setSourceChangeLead(null);
      setSourceChangeStep('confirm');
      setSourceChangeSource('Kiosk');
      setSourceChangeKioskMember('');
      setSourceChangeClosing(false);
      setSourceChangeErrors({});
    }, 200);
  };

  const handleSourceChangeConfirm = () => {
    setSourceChangeStep('form');
  };

  const handleSourceChangeSubmit = () => {
    const errors = {};
    if (!sourceChangeSource) errors.source = 'Please select a lead source';
    if (!sourceChangeKioskMember) errors.kioskMember = 'Please select a kiosk team member';
    if (Object.keys(errors).length > 0) {
      setSourceChangeErrors(errors);
      return;
    }
    toast.success('Source change submitted');
    handleCloseSourceChangeModal();
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Not Assigned': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'New': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Contacted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Qualified': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Unqualified': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'No Deposit': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  function convertToDubaiTime(utcDateString) {
    const date = new Date(utcDateString);
    if (isNaN(date)) return false;
    const options = {
      timeZone: 'Asia/Dubai',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const formatted = new Intl.DateTimeFormat('en-GB', options).format(date);
    return formatted.replace(',', '');
  }

  // Helper: strip special characters (/, \, @, etc.) from source value before
  // sending as the ?status= query param so the URL stays clean.
  // e.g. "Social Media/WhatsApp" → "Social MediaWhatsApp"
  const sanitizeStatusParam = (source) =>
    source.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();

  // Helper: capitalize first letter of every word for tab display labels.
  // e.g. "social media/whatsapp" → "Social Media/Whatsapp"
  const capitalizeWords = (str) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  // Helper: resolve tab count
  const getTabCount = (tab) => {
    if (tab === 'Event Leads') return eventLeadsCount;
    if (tab === 'Mobile Leads') return mobileLeadsCount;
    if (tab === 'Ramadan Leads') return ramadanLeadsCount;
    // dynamic source tab
    const dynTab = dynamicSourceTabs.find(t => t.name === tab);
    if (dynTab) return dynTab.count;
    // static crm summary tabs
    return leadsCount?.[tab?.replace(/\s+/g, '')];
  };

  // Helper: is this tab "critical" (shows red badge)
  const isCriticalTab = (tab) => criticalTabs.includes(tab);

  // Determine if active tab hides sub-tabs (source tabs & event leads)
  const isDynamicSourceTab = dynamicSourceTabs.some(t => t.name === activeTab);

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

        {/* ── Drawer backdrop overlay ──────────────────────────────────────── */}
        {drawerOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
            onClick={() => {
              setDrawerOpen(false);
              setEditingLead(null);
            }}
          />
        )}

        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Lead Management
              </h1>
              <p className="text-gray-400 mt-2">Manage and track your Save In Gold mobile application leads</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (!drawerOpen) {
                    setEditingLead(null);
                    setDrawerOpen(true);
                  }
                }}
                className="btn-animated btn-gold w-fit bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ml-auto"
              >
                <span className="inline-block">Add New Lead</span>
              </button>

              {/* Agent Filter */}
              <div className="flex items-center gap-4 ml-auto">
                <label className="text-[#E8D5A3] font-medium text-sm whitespace-nowrap">
                  Filter by Agent:
                </label>
                <div className="relative w-full max-w-xs min-w-64">
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 bg-[#1a1a1a] transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                maxDate={new Date()}
                isClearable={true}
              />
            </div>
          </div>
        </div>

        {/* ── Bulk Actions Bar ──────────────────────────────────────────── */}
        {selectedLeads.length > 0 && (
          <div className="mb-4 animate-fadeIn">
            <div className="bg-[#262626] border border-[#BBA473]/30 rounded-xl px-5 py-3 flex flex-wrap items-center gap-3 shadow-lg shadow-[#BBA473]/5">
              {/* Selected count */}
              <div className="flex items-center gap-2 pr-4 border-r border-[#BBA473]/20">
                <div className="w-7 h-7 rounded-lg bg-[#BBA473]/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-[#BBA473]" />
                </div>
                <span className="text-white font-medium text-sm">
                  {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                </span>
              </div>

              {/* Bulk Status Update */}
              <div className="relative bulk-dropdown-container">
                {showBulkStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-[#1f1f1f] border border-[#BBA473]/30 rounded-xl shadow-2xl z-20 min-w-[200px] py-1 animate-fadeIn">
                    {bulkStatusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          setShowBulkStatusDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors text-sm flex items-center gap-3"
                      >
                        <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                        <span className="text-white">{status.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign Lead */}
              <div className="relative bulk-dropdown-container">
                <button
                  onClick={() => {
                    setShowBulkAssignDropdown(!showBulkAssignDropdown);
                    setShowBulkStatusDropdown(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border ${
                    showBulkAssignDropdown
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Assign Lead</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showBulkAssignDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showBulkAssignDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-[#1f1f1f] border border-[#BBA473]/30 rounded-xl shadow-2xl z-20 min-w-[260px] py-1 animate-fadeIn max-h-[300px] overflow-y-auto bulk-actions-scrollbar">
                    {/* Assign to Myself */}
                    <button
                      onClick={() => {
                        setShowBulkAssignDropdown(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors text-sm flex items-center gap-3 border-b border-white/[0.06]"
                    >
                      <UserPlus className="w-4 h-4 text-[#BBA473]" />
                      <span className="text-[#BBA473] font-medium">Assign to Myself</span>
                    </button>
                    {/* Agents list */}
                    <div className="py-1">
                      <p className="px-4 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Sales Agents & Managers</p>
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setShowBulkAssignDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors text-sm flex items-center gap-3"
                        >
                          <div className="w-6 h-6 rounded-full bg-[#BBA473]/20 flex items-center justify-center text-[#BBA473] text-xs font-semibold flex-shrink-0">
                            {agent.firstName?.[0]}{agent.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="text-white">{agent.fullName}</span>
                            <span className="text-gray-500 text-xs ml-2">{agent.role}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Bulk Note */}
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all duration-300 border border-green-500/20 hover:border-green-500/40"
                disabled
              >
                <StickyNote className="w-4 h-4" />
                <span className="text-sm text-green-400 font-medium">Write Note</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">Coming Soon</span>
              </button>

              {/* Bulk Delete */}
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 border border-red-500/20 hover:border-red-500/40"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Delete</span>
              </button>

              {/* Deselect All */}
              <button
                onClick={() => {
                  setSelectedLeads([]);
                  setShowBulkStatusDropdown(false);
                  setShowBulkAssignDropdown(false);
                }}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Deselect</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Main Tabs (Level 1) ─────────────────────────────────────────── */}
        <div className="mb-4 animate-fadeIn">
          <div className="overflow-x-auto tabs-scroll-container">
            <div className="flex gap-1 border-b border-[#BBA473]/30 min-w-max">
              {allTabs.map((tab) => {
                const tabCount = getTabCount(tab);
                const critical = isCriticalTab(tab);
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`
                      px-5 py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap
                      flex items-center gap-2 rounded-t-md
                      ${isActive
                        ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#2A2A2A]'
                      }
                    `}
                  >
                    <span className="text-sm">{capitalizeWords(tab)}</span>
                    {tabCount ? (
                      <span
                        className={`
                          inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold
                          leading-none rounded-full
                          ${critical
                            ? 'text-white bg-red-500 animate-pulse'
                            : 'text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30'
                          }
                        `}
                      >
                        {tabCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sub Tabs (Level 2) — hidden for source/event tabs ───────────── */}
        {!isDynamicSourceTab && activeTab !== 'Event Leads' && getSubTabs().length > 0 && (
          <div className="mb-4 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-4">
              {getSubTabs().map((subTab) => {
                const count = leadsCount?.[subTab?.replace(/\s+/g, '')];
                const isActiveSub = activeSubTab === subTab;
                // 'Not Answered' and 'Not Interested' are critical sub-tabs
                const subCritical = ['Not Answered', 'Not Interested'].includes(subTab);
                return (
                  <button
                    key={subTab}
                    onClick={() => handleSubTabChange(subTab)}
                    className={`px-5 py-2.5 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                      isActiveSub
                        ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <span className="capitalize">{subTab}</span>
                    {count ? (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full ${
                        subCritical
                          ? 'text-white bg-red-500 animate-pulse'
                          : 'text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30'
                      }`}>
                        {count}
                      </span>
                    ) : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub Sub Tabs (Level 3) */}
        {!isDynamicSourceTab && activeTab !== 'Event Leads' && getSubSubTabs().length > 0 && (
          <div className="mb-4 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-8">
              {getSubSubTabs().map((subSubTab) => {
                const count = leadsCount?.[subSubTab?.replace(/\s+/g, '')];
                return (
                  <button
                    key={subSubTab}
                    onClick={() => handleSubSubTabChange(subSubTab)}
                    className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                      activeSubSubTab === subSubTab
                        ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <span className="capitalize">{subSubTab}</span>
                    {count ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30">
                        {count}
                      </span>
                    ) : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub Sub Sub Tabs (Level 4) */}
        {!isDynamicSourceTab && activeTab !== 'Event Leads' && getSubSubSubTabs().length > 0 && (
          <div className="mb-4 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-12">
              {getSubSubSubTabs().map((subSubSubTab) => {
                const count = leadsCount?.[subSubSubTab?.replace(/\s+/g, '')];
                return (
                  <button
                    key={subSubSubTab}
                    onClick={() => handleSubSubSubTabChange(subSubSubTab)}
                    className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                      activeSubSubSubTab === subSubSubTab
                        ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <span className="capitalize">{subSubSubTab}</span>
                    {count ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30">
                        {count}
                      </span>
                    ) : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub Sub Sub Sub Tabs (Level 5) */}
        {!isDynamicSourceTab && activeTab !== 'Event Leads' && getSubSubSubSubTabs().length > 0 && (
          <div className="mb-6 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-16">
              {getSubSubSubSubTabs().map((subSubSubSubTab) => {
                const count = leadsCount?.[subSubSubSubTab?.replace(/\s+/g, '')];
                const isDepositCritical = subSubSubSubTab === 'Deposit';
                return (
                  <button
                    key={subSubSubSubTab}
                    onClick={() => handleSubSubSubSubTabChange(subSubSubSubTab)}
                    className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                      activeSubSubSubSubTab === subSubSubSubTab
                        ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <span className="capitalize">{subSubSubSubTab}</span>
                    {count ? (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full ${
                        isDepositCritical
                          ? 'text-white bg-red-500 animate-pulse'
                          : 'text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30'
                      }`}>
                        {count}
                      </span>
                    ) : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fadeIn">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, nationality, residency, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden border border-[#BBA473]/20 animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1A1A1A] border-b border-[#BBA473]/30">
                <tr>
                  <th className="text-center px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                      onChange={handleSelectAll}
                      className="dark-checkbox"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Lead ID</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Nationality</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Agent</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Source</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Kiosk - Lead - Task</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Created At</th>
                  <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBA473]/10">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BBA473]"></div>
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-400">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={(e) => handleRowClick(lead, e)}
                      className={`hover:bg-[#3A3A3A] transition-all duration-300 group cursor-pointer ${
                        selectedLeads.includes(lead.id) ? 'bg-[#BBA473]/[0.06]' : ''
                      }`}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="dark-checkbox"
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{lead.leadId || lead.id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium capitalize text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {lead.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(lead.phone)}</td>
                      <td className="px-6 py-4 text-gray-300">{lead.nationality}</td>
                      <td className="px-6 py-4 text-gray-300">{lead.agent}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {(activeTab.toLowerCase() === 'ramadan' || lead?.source?.toLowerCase() == 'ramadan')
                          ? 'Ramadan'
                          : (lead.source ?? 'Kiosk') + (lead?.leadSourceId?.firstName ? ` - ${lead?.leadSourceId?.firstName} ${lead?.leadSourceId?.lastName}` : '')
                        }
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        {lead?.kioskLeadStatus ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.kioskLeadStatus)}`}>
                            {lead?.kioskLeadStatus} {lead.depositStatus && `- ${lead.depositStatus}`}
                          </span>
                        ) : ''}
                        {lead.status ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        ) : ''}
                        {lead.lastTaskStatus ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.lastTaskStatus)}`}>
                            {lead.lastTaskStatus}
                          </span>
                        ) : ''}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{convertToDubaiTime(lead.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {lead.phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(lead);
                              }}
                              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-300 hover:scale-110"
                              title="Open Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          {isMobileAppSource(lead.source) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSourceChange(lead);
                              }}
                              className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-110"
                              title="Change Source"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(lead)}
                            className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#BBA473]/30 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{showingFrom}</span> to{' '}
                <span className="text-white font-semibold">{showingTo}</span> of{' '}
                <span className="text-white font-semibold">{totalLeads}</span> entries
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPerPageDropdown(!showPerPageDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30"
                >
                  <span className="text-sm">{itemsPerPage} per page</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showPerPageDropdown && (
                  <div className="absolute bottom-full mb-2 right-0 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg shadow-xl z-10 min-w-[150px]">
                    {perPageOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => handlePerPageChange(option)}
                        className={`w-full px-4 py-2 text-left hover:bg-[#3A3A3A] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          option === itemsPerPage ? 'bg-[#BBA473]/20 text-[#BBA473]' : 'text-white'
                        }`}
                      >
                        {option} per page
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473] disabled:hover:border-[#BBA473]/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {currentPage > 2 && totalPages > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473]"
                  >
                    1
                  </button>
                  {currentPage > 3 && <span className="text-gray-400">...</span>}
                </>
              )}

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 border ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black border-[#BBA473] font-semibold shadow-lg'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] border-[#BBA473]/30 hover:border-[#BBA473]'
                  }`}
                >
                  {page}
                </button>
              ))}

              {currentPage < totalPages - 1 && totalPages > 3 && (
                <>
                  {currentPage < totalPages - 2 && <span className="text-gray-400">...</span>}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473]"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473] disabled:hover:border-[#BBA473]/30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          /* Fix horizontal scroll hover bg */
          .tabs-scroll-container {
            scrollbar-width: thin;
            scrollbar-color: #BBA473 #1a1a1a;
          }
          .tabs-scroll-container::-webkit-scrollbar {
            height: 4px;
          }
          .tabs-scroll-container::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          .tabs-scroll-container::-webkit-scrollbar-thumb {
            background-color: #BBA473;
            border-radius: 2px;
          }
          /* Bulk actions dropdown scrollbar */
          /* Dark checkbox styling */
          .dark-checkbox {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(187, 164, 115, 0.35);
            border-radius: 4px;
            background-color: #1A1A1A;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }
          .dark-checkbox:hover {
            border-color: rgba(187, 164, 115, 0.6);
            background-color: #222;
          }
          .dark-checkbox:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(187, 164, 115, 0.25);
          }
          .dark-checkbox:checked {
            background-color: #BBA473;
            border-color: #BBA473;
          }
          .dark-checkbox:checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 1px;
            width: 5px;
            height: 9px;
            border: solid #000;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
          .dark-checkbox:indeterminate {
            background-color: #BBA473;
            border-color: #BBA473;
          }
          .dark-checkbox:indeterminate::after {
            content: '';
            position: absolute;
            left: 3px;
            top: 5px;
            width: 8px;
            height: 2px;
            background: #000;
            border-radius: 1px;
          }
          .bulk-actions-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .bulk-actions-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .bulk-actions-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(187, 164, 115, 0.15);
            border-radius: 10px;
          }
          .bulk-actions-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(187, 164, 115, 0.3);
          }
        `}</style>
      </div>

      {/* Assigned Lead Modal */}
      {showAssignedLeadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#BBA473] mb-2">Cannot Modify Assigned Lead</h3>
                <p className="text-gray-300 leading-relaxed">{assignedLeadMessage}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAssignedLeadModal(false)}
                className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      <InboxChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => {
          setChatDrawerOpen(false);
          setChatContact(null);
        }}
        contact={chatContact}
        refreshContacts={() => {}}
      />

      {/* Source Change Modal */}
      {showSourceChangeModal && (
        <div
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity duration-200 ${sourceChangeClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={handleCloseSourceChangeModal}
        >
          <div
            className={`bg-[#2A2A2A] rounded-2xl shadow-2xl border border-[#BBA473]/30 max-w-md w-full transform transition-all duration-200 ${sourceChangeClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'} overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#262626] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {sourceChangeStep === 'confirm' ? 'Change Lead Source' : 'Update Source Details'}
                </h3>
              </div>
              <button
                onClick={handleCloseSourceChangeModal}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="relative overflow-hidden">
              {/* Step 1: Confirmation */}
              <div className={`px-6 py-6 transition-all duration-300 ease-in-out ${sourceChangeStep === 'confirm' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute inset-0'}`}>
                {sourceChangeLead && (
                  <>
                    {/* Lead info card */}
                    <div className="p-4 bg-[#1A1A1A] rounded-xl border border-orange-500/20 mb-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 text-sm font-bold flex-shrink-0">
                          {sourceChangeLead.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold capitalize truncate">{sourceChangeLead.name}</p>
                          <p className="text-gray-400 text-sm font-mono">{sourceChangeLead.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25">
                          {sourceChangeLead.source || 'Mobile'}
                        </span>
                        <span className="text-gray-500 text-xs">Current Source</span>
                      </div>
                    </div>

                    {/* Confirmation text */}
                    <div className="space-y-3">
                      <p className="text-gray-300 leading-relaxed">
                        This lead was generated from the <span className="text-orange-400 font-semibold">Mobile App</span>. Would you like to change its source?
                      </p>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Changing the source will reassign this lead from Mobile App to a different source category.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Step 2: Form */}
              <div className={`px-6 py-6 transition-all duration-300 ease-in-out ${sourceChangeStep === 'form' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute inset-0'}`}>
                <div className="space-y-5">
                  {/* Lead Source */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Lead Source <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={sourceChangeSource}
                        onChange={(e) => { setSourceChangeSource(e.target.value); setSourceChangeErrors(prev => ({ ...prev, source: undefined })); }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${
                          sourceChangeErrors.source
                            ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                            : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                        }`}
                      >
                        <option value="">Select Source</option>
                        <option value="Kiosk">Kiosk</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {sourceChangeErrors.source && (
                      <p className="text-red-400 text-sm animate-pulse">{sourceChangeErrors.source}</p>
                    )}
                  </div>

                  {/* Kiosk Team */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Kiosk Team <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={sourceChangeKioskMember}
                        onChange={(e) => { setSourceChangeKioskMember(e.target.value); setSourceChangeErrors(prev => ({ ...prev, kioskMember: undefined })); }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${
                          sourceChangeErrors.kioskMember
                            ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                            : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                        }`}
                      >
                        <option value="">Select Kiosk Member</option>
                        {kioskMembers.map((member) => (
                          <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {sourceChangeErrors.kioskMember && (
                      <p className="text-red-400 text-sm animate-pulse">{sourceChangeErrors.kioskMember}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#262626] border-t border-white/[0.06] px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={handleCloseSourceChangeModal}
                className="px-5 py-2.5 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              {sourceChangeStep === 'confirm' ? (
                <button
                  onClick={handleSourceChangeConfirm}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-orange-500/30 transform hover:scale-105 active:scale-95"
                >
                  Yes, Change Source
                </button>
              ) : (
                <button
                  onClick={handleSourceChangeSubmit}
                  className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-[#BBA473]/30 transform hover:scale-105 active:scale-95"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#BBA473] mb-2">Delete Lead</h3>
                <p className="text-gray-300 leading-relaxed mb-1">Are you sure you want to delete this lead?</p>
                {leadToDelete && (
                  <div className="mt-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#BBA473]/20">
                    <p className="text-white capitalize font-semibold">{leadToDelete.name}</p>
                    <p className="text-gray-400 text-sm">{formatPhoneDisplay(leadToDelete.phone)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-6 py-2.5 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 active:scale-95"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesManagerLeadsListing;