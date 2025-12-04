import React from 'react';
import { Search, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const AgentsListing = ({
  agents,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  showPerPageDropdown,
  setShowPerPageDropdown,
  loading,
  totalAgents,
  handleEdit,
  handleDelete,
  showPassIcon,
  convertToDubaiTime,
  formatPhoneDisplay,
  onRowClick
}) => {
  const perPageOptions = [10, 20, 30, 50, 100];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      agent.phone.includes(searchQuery);
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalAgents / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgents = filteredAgents.slice(startIndex, endIndex);
  const showingFrom = filteredAgents.length > 0 ? startIndex + 1 : 0;
  const showingTo = Math.min(startIndex + currentAgents.length, totalAgents);

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

  return (
    <>
      {/* Search */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fadeIn">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
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
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Username</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Full Name</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Leads Assigned</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Created At</th>
                <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BBA473]/10">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    Loading agents...
                  </td>
                </tr>
              ) : currentAgents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No agents found
                  </td>
                </tr>
              ) : (
                currentAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => onRowClick(agent)}
                    className="hover:bg-[#3A3A3A] transition-all duration-300 group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                      {agent?.username}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {!showPassIcon && agent.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{agent.email}</td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(agent.phone)}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#BBA473]/20 text-[#E8D5A3] border border-[#BBA473]/30">
                        {agent.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{agent?.totalLeadsAssigned}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{convertToDubaiTime(agent.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(agent)}
                          className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
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
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#BBA473]/30 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{showingFrom}</span> to{' '}
                <span className="text-white font-semibold">{showingTo}</span> of{' '}
                <span className="text-white font-semibold">{totalAgents}</span> entries
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

            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-[#BBA473]/30 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black'
                      : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A] hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentsListing;