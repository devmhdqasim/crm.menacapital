import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { getAllBranchLeads, deleteBranch, getAllSalesManagerLeads } from '../../services/leadService';
import { getAllUsersKioskMembers } from '../../services/teamService';
import DateRangePicker from '../../components/DateRangePicker';
import toast from 'react-hot-toast';
import LeadFormDrawer from './LeadFormDrawer';
import LeadsListingTable from './LeadsListingTable';

const BranchLeadsManagement = () => {
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [kioskMembers, setKioskMembers] = useState([]);
  const [selectedKioskMemberFilter, setSelectedKioskMemberFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sourceChangeLeadFromCreate, setSourceChangeLeadFromCreate] = useState(null);

  const tabs = ['All', 'Kiosk Members', 'MobileAPP'];

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Fetch kiosk members from API
  const fetchKioskMembers = async () => {
    try {
      const result = await getAllUsersKioskMembers();
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

  // Fetch leads from API
  const fetchLeads = async (page = 1, limit = 10) => {
    if (activeTab === 'MobileAPP') {
      return fetchMobileAppLeads(page, limit);
    }

    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';

      // Only pass agentId if on Kiosk Members tab and a filter is selected
      const agentId = (activeTab === 'Kiosk Members' && selectedKioskMemberFilter) ? selectedKioskMemberFilter : '';

      const result = await getAllBranchLeads(
        page,
        limit,
        startDateStr,
        endDateStr,
        debouncedSearchQuery,
        statusFilter,
        agentId
      );

      if (result.success && result.data) {
        const transformedLeads = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          phone: lead.leadPhoneNumber,
          nationality: lead.leadNationality,
          language: lead.leadPreferredLanguage,
          source: lead.leadSource,
          leadSourceName: `${lead.leadSourceId.length > 0 ? `${lead.leadSourceId.at(-1).firstName} ${lead.leadSourceId.at(-1).lastName}` : (lead.leadSource || "-")}`,
          leadSourceId: lead.leadSourceId.at(-1),
          remarks: lead.leadDescription || '',
          status: lead.leadStatus ?? '',
          depositStatus: lead.depositStatus || '',
          kioskName: lead.kioskName || 'N/A',
          leadAgentId: lead.leadAgentId,
          createdAt: lead.createdAt,
          kioskLeadStatus: lead.kioskLeadStatus ?? '',
          leadAgentData: lead?.leadAgentData?.[0],
        }));

        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
      } else {
        console.error('Failed to fetch leads:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch leads');
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch MobileAPP leads using the same sales API as SalesManager
  const fetchMobileAppLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';

      const result = await getAllSalesManagerLeads(
        page,
        limit,
        startDateStr,
        endDateStr,
        debouncedSearchQuery,
        'MobileApp',
        ''
      );

      if (result.success && result.data) {
        const transformedLeads = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          phone: lead.leadPhoneNumber,
          nationality: lead.leadNationality,
          language: lead.leadPreferredLanguage,
          source: lead.leadSource,
          leadSourceName: `${lead.leadSourceId?.length > 0 ? `${lead.leadSourceId.at(-1).firstName} ${lead.leadSourceId.at(-1).lastName}` : (lead.leadSource || "-")}`,
          leadSourceId: lead.leadSourceId?.at(-1),
          remarks: lead.leadDescription || '',
          status: lead.leadStatus ?? '',
          depositStatus: lead.depositStatus || '',
          kioskName: lead.kioskName || 'N/A',
          leadAgentId: lead.leadAgentId,
          createdAt: lead.createdAt,
          kioskLeadStatus: lead.kioskLeadStatus ?? '',
          leadAgentData: lead?.leadAgentData?.[0],
        }));

        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
      } else {
        console.error('Failed to fetch mobile app leads:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to fetch mobile app leads');
        }
      }
    } catch (error) {
      console.error('Error fetching mobile app leads:', error);
      toast.error('Failed to fetch mobile app leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leadId) => {
    try {
      const result = await deleteBranch(leadId);
      
      if (result) {
        toast.success(result.message || 'Lead deleted successfully!');
        await fetchLeads(currentPage, itemsPerPage);
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to delete lead');
        }
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead. Please try again.');
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(null);
  };

  const handleFormSuccess = () => {
    setDrawerOpen(false);
    setEditingLead(null);
    fetchLeads(currentPage, itemsPerPage);
  };

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, selectedKioskMemberFilter, activeTab]);

  useEffect(() => {
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, selectedKioskMemberFilter, activeTab]);

  useEffect(() => {
    setIsLoaded(true);
    fetchKioskMembers();
  }, []);

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
                  setEditingLead(null);
                  setDrawerOpen(true);
                }}
                className="btn-animated btn-gold w-fit bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ml-auto"
              >
                {/* <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <UserPlus className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" /> */}
                <span className="inline-block">Add New Lead</span>
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


        {/* Leads Listing Table Component */}
        <LeadsListingTable
          leads={leads}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          kioskMembers={kioskMembers}
          selectedKioskMemberFilter={selectedKioskMemberFilter}
          setSelectedKioskMemberFilter={setSelectedKioskMemberFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalLeads={totalLeads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={() => fetchLeads(currentPage, itemsPerPage)}
          sourceChangeLeadFromCreate={sourceChangeLeadFromCreate}
          onSourceChangeLeadConsumed={() => setSourceChangeLeadFromCreate(null)}
        />
      </div>


      {/* Lead Form Drawer Component */}
      <LeadFormDrawer
        drawerOpen={drawerOpen}
        editingLead={editingLead}
        kioskMembers={kioskMembers}
        onClose={handleCloseDrawer}
        onSuccess={handleFormSuccess}
        onSourceChange={(lead) => setSourceChangeLeadFromCreate(lead)}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        body{
          background-color: #000;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BranchLeadsManagement;