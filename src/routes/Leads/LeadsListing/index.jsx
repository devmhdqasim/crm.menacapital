import React, { useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DateRangePicker from '../../../components/DateRangePicker';

const LeadsListing = ({
  leads,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  contactedSubTab,
  setContactedSubTab,
  interestedSubTab,
  setInterestedSubTab,
  hotLeadSubTab,
  setHotLeadSubTab,
  realSubTab,
  setRealSubTab,
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
  isLeadsSelectedId,
  handleRowClick,
  setDrawerOpen,
  setEditingLead
}) => {
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);

  const tabs = ['All', 'Pending', 'Contacted'];
  const contactedSubTabs = ['Interested', 'Not Interested', 'Not Answered'];
  const interestedSubTabs = ['Warm Lead', 'Hot Lead'];
  const hotLeadSubTabs = ['Demo', 'Real'];
  const realSubTabs = ['Deposit', 'Not Deposit'];

  const perPageOptions = [10, 20, 30, 50, 100];

  // Calculate pending leads count
  const pendingLeadsCount = leads.filter(lead => !lead.contacted).length;

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
    (lead?.name?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.email?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.phone || '').includes(searchQuery || '') ||
    (lead?.nationality?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.residency?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.source?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '');
    
    // Level 1: Main tabs (All, Pending, Contacted)
    let matchesTab = true;
    if (activeTab === 'All') {
      matchesTab = true;
    } else if (activeTab === 'Pending') {
      matchesTab = !lead.contacted;
    } else if (activeTab === 'Contacted') {
      matchesTab = lead.contacted;
      
      // Level 2: Contacted sub-tabs (Interested, Not Interested, Not Answered)
      if (contactedSubTab === 'Interested') {
        matchesTab = matchesTab && lead.answered && lead.interested;
        
        // Level 3: Interested sub-tabs (Warm Lead, Hot Lead)
        if (interestedSubTab === 'Warm Lead') {
          matchesTab = matchesTab && lead.status === 'Lead';
        } else if (interestedSubTab === 'Hot Lead') {
          matchesTab = matchesTab && (lead.status === 'Demo' || lead.status === 'Real' || lead.status === 'Deposit' || lead.status === 'Not Deposit');
          
          // Level 4: Hot Lead sub-tabs (Demo, Real)
          if (hotLeadSubTab === 'Demo') {
            matchesTab = matchesTab && lead.status === 'Demo';
          } else if (hotLeadSubTab === 'Real') {
            matchesTab = matchesTab && (lead.status === 'Real' || lead.status === 'Deposit' || lead.status === 'Not Deposit');
            
            // Level 5: Real sub-tabs (Deposit, Not Deposit)
            if (realSubTab === 'Deposit') {
              matchesTab = matchesTab && lead.depositStatus === 'Deposited';
            } else if (realSubTab === 'Not Deposit') {
              matchesTab = matchesTab && lead.depositStatus === 'Not Deposited';
            }
          }
        }
      } else if (contactedSubTab === 'Not Interested') {
        matchesTab = matchesTab && lead.answered && !lead.interested;
      } else if (contactedSubTab === 'Not Answered') {
        matchesTab = matchesTab && !lead.answered;
      }
    }
    
    return matchesSearch && matchesTab;
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

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+\d{1,4})(\d+)/, '$1 $2').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Not Deposit': 'bg-red-500/20 text-red-400 border-red-500/30'
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
            {/* Date Range Filter */}
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
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setContactedSubTab('');
                setInterestedSubTab('');
                setHotLeadSubTab('');
                setRealSubTab('');
              }}
              className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
              }`}
            >
              <span>{tab}</span>
              {tab === 'Pending' && pendingLeadsCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#BBA473] text-black'
                    : 'bg-red-500 text-white'
                }`}>
                  {pendingLeadsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tabs (Level 2) - Shown when Contacted is active */}
      {activeTab === 'Contacted' && (
        <div className="mb-4 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-4">
            {contactedSubTabs.map((subTab) => (
              <button
                key={subTab}
                onClick={() => {
                  setContactedSubTab(subTab);
                  setInterestedSubTab('');
                  setHotLeadSubTab('');
                  setRealSubTab('');
                }}
                className={`px-5 py-2.5 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  contactedSubTab === subTab
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

      {/* Sub Sub Tabs (Level 3) - Shown when Interested is active */}
      {activeTab === 'Contacted' && contactedSubTab === 'Interested' && (
        <div className="mb-4 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-8">
            {interestedSubTabs.map((subTab) => (
              <button
                key={subTab}
                onClick={() => {
                  setInterestedSubTab(subTab);
                  setHotLeadSubTab('');
                  setRealSubTab('');
                }}
                className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  interestedSubTab === subTab
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

      {/* Sub Sub Sub Tabs (Level 4) - Shown when Hot Lead is active */}
      {activeTab === 'Contacted' && contactedSubTab === 'Interested' && interestedSubTab === 'Hot Lead' && (
        <div className="mb-4 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-12">
            {hotLeadSubTabs.map((subTab) => (
              <button
                key={subTab}
                onClick={() => {
                  setHotLeadSubTab(subTab);
                  setRealSubTab('');
                }}
                className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  hotLeadSubTab === subTab
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

      {/* Sub Sub Sub Sub Tabs (Level 5) - Shown when Real is active */}
      {activeTab === 'Contacted' && contactedSubTab === 'Interested' && interestedSubTab === 'Hot Lead' && hotLeadSubTab === 'Real' && (
        <div className="mb-6 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/20 min-w-max pl-16">
            {realSubTabs.map((subTab) => (
              <button
                key={subTab}
                onClick={() => setRealSubTab(subTab)}
                className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm ${
                  realSubTab === subTab
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
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1A1A] border-b border-[#BBA473]/30">
              <tr>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead ID</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Nationality</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Source</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Created At</th>
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
                    className="hover:bg-[#3A3A3A] transition-all duration-300 group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm" onClick={() => handleRowClick(lead)}>{lead.leadId || lead.id.slice(-6)}</td>
                    <td className="px-6 py-4" onClick={() => handleRowClick(lead)}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                          {lead.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm" onClick={() => handleRowClick(lead)}>{formatPhoneDisplay(lead.phone)}</td>
                    <td className="px-6 py-4 text-gray-300" onClick={() => handleRowClick(lead)}>{lead.nationality}</td>
                    {!isLeadsSelectedId && (
                      <>
                        <td className="px-6 py-4 text-gray-300 text-sm" onClick={() => handleRowClick(lead)}>{lead.source}</td>
                        <td className="flex items-center gap-1.5 px-6 py-4" onClick={() => handleRowClick(lead)}> 
                          {lead?.kioskLeadStatus ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.kioskLeadStatus)}`}>
                            {lead?.kioskLeadStatus} {lead.depositStatus && `- ${lead.depositStatus}`}
                          </span> : ''}
                          {lead.status ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>: ''}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-gray-300 text-sm" onClick={() => handleRowClick(lead)}>{convertToDubaiTime(lead.createdAt)}</td>
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

export default LeadsListing;