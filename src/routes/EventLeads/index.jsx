import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { getAllEventLeads, deleteEventLead } from '../../services/leadService';
import { getAllUsersEventMembers } from '../../services/teamService';
import DateRangePicker from '../../components/DateRangePicker';
import toast from 'react-hot-toast';
import LeadFormDrawer from './LeadFormDrawer';
import LeadsListingTable from './LeadsListingTable';

const EventLeadsManagement = () => {
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
  const [eventMembers, setEventMembers] = useState([]);
  const [selectedEventMemberFilter, setSelectedEventMemberFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [leadSources, setLeadSources] = useState([]);
  const [selectedLeadSourceFilter, setSelectedLeadSourceFilter] = useState('');

  const tabs = ['All']; //'Exhibition Lead',

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Fetch event members from API
  const fetchEventMembers = async () => {
    try {
      const result = await getAllUsersEventMembers();
      if (result.success && result.data) {
        const eventMembersData = result.data.filter(user => 
          user.roleName === 'Event Member'
        );
        const transformedEventMembers = eventMembersData.map((user) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        }));
        setEventMembers(transformedEventMembers);
      }
    } catch (error) {
      console.error('Error fetching event members:', error);
    }
  };

  // Fetch leads from API
  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      // Only pass eventMemberId if on Exhibition Lead tab and a filter is selected
      const eventMemberId = (activeTab === 'Exhibition Lead' && selectedEventMemberFilter) ? selectedEventMemberFilter : '';
      
      // Only pass leadSource if on Lead Sources tab and a filter is selected
      const leadSource = (activeTab === 'Lead Sources' && selectedLeadSourceFilter) ? selectedLeadSourceFilter : '';
      
      const result = await getAllEventLeads(
        page, 
        limit, 
        startDateStr, 
        endDateStr, 
        debouncedSearchQuery,
        statusFilter,
        eventMemberId,
        leadSource
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
          leadSourceName: `${lead.leadSourceId.length > 0 ? `${lead.leadSourceId.at(-1).firstName} ${lead.leadSourceId.at(-1).lastName}`: "-"}`,
          leadSourceId: lead.leadSourceId.at(-1),
          remarks: lead.leadDescription || '',
          status: lead.leadStatus ?? '',
          depositStatus: lead.depositStatus || '',
          eventName: lead.eventName || 'N/A',
          leadAgentId: lead.leadAgentId,
          createdAt: lead.createdAt,
          eventLeadStatus: lead.eventLeadStatus ?? '',
          leadAgentData: lead?.leadAgentData?.[0],
          kioskLeadStatus: lead?.kioskLeadStatus,
        }));
        
        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
        
        // Extract unique lead sources from the leads
        const uniqueSources = [...new Set(transformedLeads.map(lead => lead.source).filter(Boolean))];
        setLeadSources(uniqueSources);
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

  const handleDelete = async (leadId) => {
    try {
      const result = await deleteEventLead(leadId);
      
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
  }, [debouncedSearchQuery, statusFilter, selectedEventMemberFilter, selectedLeadSourceFilter, activeTab]);

  useEffect(() => {
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, statusFilter, selectedEventMemberFilter, selectedLeadSourceFilter, activeTab]);

  useEffect(() => {
    setIsLoaded(true);
    fetchEventMembers();
  }, []);

  return (
    <>
      {/* Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleCloseDrawer}
        />
      )}

      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Event Lead Management
              </h1>
              <p className="text-gray-400 mt-2">Manage and track your Save In Gold event leads</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setEditingLead(null);
                  setDrawerOpen(true);
                }}
                className="btn-animated btn-gold w-fit bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ml-auto"
              >
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
          eventMembers={eventMembers}
          selectedEventMemberFilter={selectedEventMemberFilter}
          setSelectedEventMemberFilter={setSelectedEventMemberFilter}
          leadSources={leadSources}
          selectedLeadSourceFilter={selectedLeadSourceFilter}
          setSelectedLeadSourceFilter={setSelectedLeadSourceFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalLeads={totalLeads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isEventLeads={true}
        />
      </div>
      
      {/* Lead Form Drawer Component */}
      <LeadFormDrawer
        drawerOpen={drawerOpen}
        editingLead={editingLead}
        eventMembers={eventMembers}
        leadSources={leadSources}
        onClose={handleCloseDrawer}
        onSuccess={handleFormSuccess}
        isEventLead={true}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        body{
          background-color: #000;
          ${drawerOpen ? 'overflow: hidden;' : ''}
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default EventLeadsManagement;