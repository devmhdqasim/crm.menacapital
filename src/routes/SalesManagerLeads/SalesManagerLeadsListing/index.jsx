import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Edit, Trash2, UserPlus, AlertTriangle, X } from 'lucide-react';
import DateRangePicker from '../../../components/DateRangePicker';
import { deleteLead } from '../../../services/leadService';
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
}) => {
  const { crmCategorySummary } = useCRM();
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showAssignedLeadModal, setShowAssignedLeadModal] = useState(false);
  const [assignedLeadMessage, setAssignedLeadMessage] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const tabs = ['All', 'Assigned', 'Not Assigned', 'Contacted'];
  const perPageOptions = [10, 20, 30, 50, 100];

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

  // No frontend filtering needed - all handled by API
  const filteredLeads = leads;

  // Get unassigned count for the badge (from current filtered leads)
  const unassignedCount = leads.filter(lead => lead.agentId === null || lead.agent === 'Not Assigned').length;

  // Pagination calculations based on API metadata
  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const currentLeads = filteredLeads;
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

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setDrawerOpen(true);
  };

  // Check if lead is assigned to an agent
  const isLeadAssigned = (lead) => {
    return lead.agentId && lead.agentId !== null && lead.agentId !== undefined && lead.agentId !== '';
  };

  // Get agent name from lead
  const getAgentName = (lead) => {
    if (lead.agent && lead.agent !== 'Not Assigned') {
      return lead.agent;
    }
    return 'an agent';
  };

  const handleDelete = (lead) => {
    if (isLeadAssigned(lead)) {
      const agentName = getAgentName(lead);
      setAssignedLeadMessage(`This lead is currently assigned to ${agentName} and cannot be deleted.`);
      setShowAssignedLeadModal(true);
      return;
    }
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
        window.location.reload();
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

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'New': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Contacted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Qualified': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Unqualified': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'No Deposit': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  function convertToDubaiTime(utcDateString) {
    const date = new Date(utcDateString);
  
    if (isNaN(date)) return false;
  
    const options = {
      timeZone: "Asia/Dubai",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
  
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);
  
    return formatted.replace(",", "");
  }

  const leadsCount =  JSON.parse(localStorage.getItem('leadsCount'))

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
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
                  if(!drawerOpen) {
                    setEditingLead(null);
                    setDrawerOpen(true);
                  }
                }}
                className="group relative w-fit inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 ml-auto"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <UserPlus className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                <span className="relative z-10">Add New Lead</span>
              </button>

              {/* Agent Filter */}
              <div className="flex items-center gap-4 ml-auto">
              <label className="text-[#E8D5A3] font-medium text-sm whitespace-nowrap">
                Filter by Kiosk Member:
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

        {/* Main Tabs (Level 1) */}
        <div className="mb-4 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab
                      ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                >
                  <span>{tab}</span>
                  {leadsCount?.[tab?.replace(/\s+/g, '')] && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {leadsCount?.[tab?.replace(/\s+/g, '')]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub Tabs (Level 2) */}
        {getSubTabs().length > 0 && (
          <div className="mb-4 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-4">
              {getSubTabs().map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => handleSubTabChange(subTab)}
                  className={`px-5 py-2.5 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                    activeSubTab === subTab
                      ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                >
                  {subTab}
                  {leadsCount?.[subTab?.replace(/\s+/g, '')] && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {leadsCount?.[subTab?.replace(/\s+/g, '')]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub Sub Tabs (Level 3) */}
        {getSubSubTabs().length > 0 && (
          <div className="mb-4 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-8">
              {getSubSubTabs().map((subSubTab) => (
                <button
                  key={subSubTab}
                  onClick={() => handleSubSubTabChange(subSubTab)}
                  className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                    activeSubSubTab === subSubTab
                      ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                >
                  {subSubTab}
                  {leadsCount?.[subSubTab?.replace(/\s+/g, '')] && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {leadsCount?.[subSubTab?.replace(/\s+/g, '')]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub Sub Sub Tabs (Level 4) */}
        {getSubSubSubTabs().length > 0 && (
          <div className="mb-4 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-12">
              {getSubSubSubTabs().map((subSubSubTab) => (
                <button
                  key={subSubSubTab}
                  onClick={() => handleSubSubSubTabChange(subSubSubTab)}
                  className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                    activeSubSubSubTab === subSubSubTab
                      ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                >
                  {subSubSubTab}
                  {leadsCount?.[subSubSubTab?.replace(/\s+/g, '')] && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {leadsCount?.[subSubSubTab?.replace(/\s+/g, '')]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub Sub Sub Sub Tabs (Level 5) */}
        {getSubSubSubSubTabs().length > 0 && (
          <div className="mb-6 overflow-x-auto animate-fadeIn">
            <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-16">
              {getSubSubSubSubTabs().map((subSubSubSubTab) => (
                <button
                  key={subSubSubSubTab}
                  onClick={() => handleSubSubSubSubTabChange(subSubSubSubTab)}
                  className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm flex items-center gap-2 ${
                    activeSubSubSubSubTab === subSubSubSubTab
                      ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`}
                >
                  {subSubSubSubTab}
                  {leadsCount?.[subSubSubSubTab?.replace(/\s+/g, '')] && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {leadsCount?.[subSubSubSubTab?.replace(/\s+/g, '')]}
                    </span>
                  )}
                </button>
              ))}
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
            <table className="w-full ">
              <thead className="bg-[#1A1A1A] border-b border-[#BBA473]/30">
                <tr>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead ID</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Nationality</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Agent</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Source</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Created At</th>
                  <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBA473]/10">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BBA473]"></div>
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={(e) => handleRowClick(lead, e)}
                      className="hover:bg-[#3A3A3A] transition-all duration-300 group cursor-pointer"
                    >
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
                      <td className="px-6 py-4 text-gray-300 text-sm">{lead.source ?? 'Kiosk'} {lead?.leadSourceId?.firstName ? ` - ${lead?.leadSourceId?.firstName} ${lead?.leadSourceId?.lastName}` : '' }</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        {lead?.kioskLeadStatus ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.kioskLeadStatus)}`}>
                          {lead?.kioskLeadStatus} {lead.depositStatus && `- ${lead.depositStatus}`}
                        </span> : ''}
                        {lead.status ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>: ''}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{convertToDubaiTime(lead.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
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

          {/* Pagination - Updated to show proper counts */}
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
                <h3 className="text-xl font-bold text-[#BBA473] mb-2">
                  Cannot Modify Assigned Lead
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {assignedLeadMessage}
                </p>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#BBA473] mb-2">
                  Delete Lead
                </h3>
                <p className="text-gray-300 leading-relaxed mb-1">
                  Are you sure you want to delete this lead?
                </p>
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