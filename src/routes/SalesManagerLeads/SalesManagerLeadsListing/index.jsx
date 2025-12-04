import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Edit, Trash2, UserPlus } from 'lucide-react';
import DateRangePicker from '../../../components/DateRangePicker';
import { deleteLead } from '../../../services/leadService';
import toast from 'react-hot-toast';

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
  drawerOpen
}) => {
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);

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
      return ['Warm Lead', 'Hot Lead'];
    }
    return [];
  };

  const getSubSubSubTabs = () => {
    if (activeTab === 'Contacted' && activeSubTab === 'Interested' && activeSubSubTab === 'Hot Lead') {
      return ['Demo', 'Real'];
    }
    return [];
  };

  const getSubSubSubSubTabs = () => {
    if (activeTab === 'Contacted' && activeSubTab === 'Interested' && activeSubSubTab === 'Hot Lead' && activeSubSubSubTab === 'Real') {
      return ['Deposit', 'Not Deposit'];
    }
    return [];
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      lead?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      lead?.phone?.includes(searchQuery) ||
      lead?.nationality?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      lead?.residency?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      lead?.source?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    
    if (activeTab === 'All') {
      return matchesSearch;
    }
    
    if (activeTab === 'Assigned') {
      return matchesSearch && lead.agentId !== null;
    }
    
    if (activeTab === 'Not Assigned') {
      return matchesSearch && (lead.agentId === null || lead.agent === 'Not Assigned');
    }
    
    if (activeTab === 'Contacted') {
      if (!activeSubTab) {
        return matchesSearch && lead.contacted === true;
      }
      
      if (activeSubTab === 'Interested') {
        if (!activeSubSubTab) {
          return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true;
        }
        
        if (activeSubSubTab === 'Warm Lead') {
          return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === false;
        }
        
        if (activeSubSubTab === 'Hot Lead') {
          if (!activeSubSubSubTab) {
            return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true;
          }
          
          if (activeSubSubSubTab === 'Demo') {
            return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.demo === true;
          }
          
          if (activeSubSubSubTab === 'Real') {
            if (!activeSubSubSubSubTab) {
              return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.real === true;
            }
            
            if (activeSubSubSubSubTab === 'Deposit') {
              return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.real === true && lead.deposited === true;
            }
            
            if (activeSubSubSubSubTab === 'Not Deposit') {
              return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.real === true && lead.deposited === false;
            }
          }
        }
      }
      
      if (activeSubTab === 'Not Interested') {
        return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === false;
      }
      
      if (activeSubTab === 'Not Answered') {
        return matchesSearch && lead.contacted === true && lead.answered === false;
      }
    }
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = filteredLeads;
  const showingFrom = startIndex + 1;
  const showingTo = Math.min(startIndex + currentLeads.length, totalLeads);

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

  const handleDelete = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const result = await deleteLead(leadId);

        if (result.success) {
          toast.success(result.message || 'Lead deleted successfully!');
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
    }
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

  return (
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
            const unassignedCount = tab === 'Not Assigned' 
              ? leads.filter(lead => lead.agentId === null || lead.agent === 'Not Assigned').length 
              : 0;
            
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
                {tab === 'Not Assigned' && unassignedCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                    {unassignedCount}
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
                className={`px-5 py-2.5 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  activeSubTab === subTab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {subTab}
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
                className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  activeSubSubTab === subSubTab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {subSubTab}
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
                className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  activeSubSubSubTab === subSubSubTab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {subSubSubTab}
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
                className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  activeSubSubSubSubTab === subSubSubSubTab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {subSubSubSubTab}
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
          <table className="w-full">
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
                    Loading leads...
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
                          onClick={() => handleDelete(lead.id)}
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
      `}</style>
    </div>
  );
};

export default SalesManagerLeadsListing;