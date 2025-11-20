import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, X, UserPlus, Eye } from 'lucide-react';
import { getAllSalesManagerLeads, createLead, assignLeadToAgent, deleteLead } from '../../services/leadService';
import { Calendar } from 'lucide-react'
import { getAllUsers, getKioskMembersbySalesManager } from '../../services/teamService';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import DateRangePicker from '../../components/DateRangePicker';
import toast from 'react-hot-toast';

// Validation Schema
const leadValidationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
    phone: Yup.string()
    .required('Phone number is required')
    .test('valid-phone', 'Invalid phone number', function(value) {
      if (!value) return false;
      try {
        return isValidPhoneNumber(value);
      } catch {
        return false;
      }
    }),
  email: Yup.string()
    .email('Invalid email address'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Must be at least 18 years old', function(value) {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return value <= cutoff;
    }),
  nationality: Yup.string(),
  residency: Yup.string(),
  language: Yup.string(),
  source: Yup.string(),
  remarks: Yup.string().max(500, 'Remarks must not exceed 500 characters'),
});

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState(''); // For level 2 tabs
  const [activeSubSubTab, setActiveSubSubTab] = useState(''); // For level 3 tabs
  const [activeSubSubSubTab, setActiveSubSubSubTab] = useState(''); // For level 4 tabs
  const [activeSubSubSubSubTab, setActiveSubSubSubSubTab] = useState(''); // For level 5 tabs
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [depositFilter, setDepositFilter] = useState('');
  const [agents, setAgents] = useState([]);
  const [showRowModal, setShowRowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedAgentForLead, setSelectedAgentForLead] = useState('');
  const [assigningLead, setAssigningLead] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Tab hierarchy configuration
  const tabs = ['All', 'Assigned', 'Not Assigned', 'Contacted'];
  
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

  const perPageOptions = [10, 20, 30, 50, 100];

  const countryCodes = [
    { code: 'ae', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'sa', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'pk', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
    { code: 'in', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'gb', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'us', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'eg', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
    { code: 'jo', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
    { code: 'kw', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
    { code: 'qa', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  ];

  const statusOptions = ['Lead', 'Demo', 'Real'];
  const depositStatusOptions = ['Deposit', 'No Deposit'];

  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);

  const nationalities = ['Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Australian', 'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Canadian', 'Chinese', 'Colombian', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Italian', 'Japanese', 'Jordanian', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nigerian', 'Norwegian', 'Pakistani', 'Palestinian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Saudi', 'Singaporean', 'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Syrian', 'Thai', 'Turkish', 'Ukrainian', 'Yemeni'];

  const residencies = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Pakistan', 'India', 'Egypt', 'Jordan', 'Lebanon', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'];

  const languages = ['English', 'Arabic', 'Urdu', 'Hindi', 'French', 'Spanish', 'German', 'Chinese (Mandarin)', 'Russian', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Turkish', 'Persian (Farsi)', 'Bengali', 'Tamil', 'Telugu', 'Malayalam'];

  const sources = ['Website', 'Social Media (Facebook)', 'Social Media (Instagram)', 'Social Media (LinkedIn)', 'Social Media (Twitter)', 'Google Ads', 'Referral', 'Walk-in', 'Phone Call', 'Email Campaign', 'Exhibition/Event', 'WhatsApp', 'Agent', 'Partner', 'Other'];

  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllSalesManagerLeads(page, limit, startDateStr, endDateStr);
      
      if (result.success && result.data) {
        // Transform API data to match component structure
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
          nationality: lead.leadNationality,
          residency: lead.leadResidency,
          language: lead.leadPreferredLanguage,
          source: lead.leadSource,
          remarks: lead.leadDescription || '',
          depositStatus: lead.depositStatus || '',
          status: lead.leadStatus,
          createdAt: lead.createdAt,
          // ADD THESE BOOLEAN FLAGS FROM API:
          contacted: lead.contacted || false,
          answered: lead.answered || false,
          interested: lead.interested || false,
          hot: lead.hot || false,
          cold: lead.cold || false,
          real: lead.real || false,
          demo: lead.demo || false,
          deposited: lead.deposited || false,
        }));
        
        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
      } else {
        console.error('Failed to fetch leads:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.message || 'Failed to fetch leads');
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents from API
  const fetchAgents = async () => {
    try {
      const result = await getAllUsers(1, 100); // Fetch all agents
      
      if (result.success && result.data) {
        // Filter only Agent users
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
        console.log('✅ Fetched agents:', transformedAgents.length);
      } else {
        console.error('Failed to fetch agents:', result.message);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []); // Empty dependency array means it runs only once on mount


  // Load leads on component mount and when pagination changes
  useEffect(() => {
    setIsLoaded(true);
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage]);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      residency: '',
      language: '',
      source: '',
      remarks: '',
    },
    validationSchema: leadValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Format phone number for API (remove spaces)
        const phoneNumber = values.phone.replace(/\s/g, '');
        
        // Prepare lead data for API
        const leadData = {
          leadName: values.name,
          leadEmail: values.email,
          leadPhoneNumber: phoneNumber,
          leadResidency: values.residency,
          leadPreferredLanguage: values.language,
          leadDateOfBirth: values.dateOfBirth,
          leadNationality: values.nationality,
          leadDescription: values.remarks,
          leadSource: values.source,
          leadStatus: "New", // Default status for new leads
        };

        const result = await createLead(leadData);

        if (result.success) {
          toast.success(result.message || 'Lead created successfully!');
          resetForm();
          setDrawerOpen(false);
          // Refresh the lead list
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
            // You can add navigation logic here if needed
          } else {
            toast.error(result.message || 'Failed to create lead');
          }
        }
      } catch (error) {
        console.error('Error creating lead:', error);
        toast.error('Failed to create lead. Please try again');
      } finally {
        setSubmitting(false);
      }
    },
  });

const filteredLeads = leads.filter(lead => {
  const matchesSearch =
    lead?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    lead?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    lead?.phone?.includes(searchQuery) ||
    lead?.nationality?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    lead?.residency?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    lead?.source?.toLowerCase()?.includes(searchQuery?.toLowerCase());
  
  // Level 1: Main tabs
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
    // Level 2: Contacted sub-tabs
    if (!activeSubTab) {
      // Show all contacted leads
      return matchesSearch && lead.contacted === true;
    }
    
    if (activeSubTab === 'Interested') {
      // Level 3: Interested sub-sub-tabs
      if (!activeSubSubTab) {
        // Show all interested leads
        return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true;
      }
      
      if (activeSubSubTab === 'Warm Lead') {
        // Show warm leads (interested but not hot)
        return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === false;
      }
      
      if (activeSubSubTab === 'Hot Lead') {
        // Level 4: Hot Lead sub-sub-sub-tabs
        if (!activeSubSubSubTab) {
          // Show all hot leads
          return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true;
        }
        
        if (activeSubSubSubTab === 'Demo') {
          // Show demo hot leads
          return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.demo === true;
        }
        
        if (activeSubSubSubTab === 'Real') {
          // Level 5: Real sub-sub-sub-sub-tabs
          if (!activeSubSubSubSubTab) {
            // Show all real hot leads
            return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.real === true;
          }
          
          if (activeSubSubSubSubTab === 'Deposit') {
            // Show deposited real hot leads
            return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.real === true && lead.deposited === true;
          }
          
          if (activeSubSubSubSubTab === 'Not Deposit') {
            // Show non-deposited real hot leads
            return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === true && lead.hot === true && lead.real === true && lead.deposited === false;
          }
        }
      }
    }
    
    if (activeSubTab === 'Not Interested') {
      // Show contacted, answered but not interested leads
      return matchesSearch && lead.contacted === true && lead.answered === true && lead.interested === false;
    }
    
    if (activeSubTab === 'Not Answered') {
      // Show contacted but not answered leads
      return matchesSearch && lead.contacted === true && lead.answered === false;
    }
  }
  
  return matchesSearch;
});

  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
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
    setShowActionsDropdown(null);
  };

  const handleDelete =  async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const res = await deleteLead(leadId);

        if(res.code == 1){
          console.log(res)
        }else {
          console.log()
        }
      }catch(err) {
        console.log(err)
      }
      // setLeads(leads.filter(l => l.id !== leadId));
      setShowActionsDropdown(null);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(null);
    formik.resetForm();
  };

  const handleRowClick = (lead, e) => {
    // Don't open modal if clicking on action buttons
    if (e.target.closest('button')) {
      return;
    }
    setSelectedLead(lead);
    // Pre-select agent if already assigned
    setSelectedAgentForLead(lead.agentId || '');
    setShowRowModal(true);
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentForLead) {
      toast.error('Please select an agent');
      return;
    }
    
    setAssigningLead(true);
    
    try {
      console.log('🔵 Assigning lead:', selectedLead.id, 'to agent:', selectedAgentForLead);
      
      const result = await assignLeadToAgent(selectedLead.id, selectedAgentForLead);
      
      if (result.success) {
        toast.success(result.message || 'Lead assigned to agent successfully!');
        setShowRowModal(false);
        setSelectedLead(null);
        setSelectedAgentForLead('');
        // Refresh leads list
        await fetchLeads(currentPage, itemsPerPage);
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.message || 'Failed to assign lead to agent');
        }
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead. Please try again');
    } finally {
      setAssigningLead(false);
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
      'Unqualified': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  function convertToDubaiTime(utcDateString) {
    const date = new Date(utcDateString);
  
    if (isNaN(date)) return false; // only returns false if input is invalid
  
    const options = {
      timeZone: "Asia/Dubai",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",     // ← FIXED
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
  
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);
  
    return formatted.replace(",", "");
  }

  // Handle tab changes with proper state reset
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset all sub-tabs when changing main tab
    setActiveSubTab('');
    setActiveSubSubTab('');
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
    if (tab !== 'Real') {
      setDepositFilter('');
    }
  };

  const handleSubTabChange = (subTab) => {
    setActiveSubTab(subTab);
    // Reset deeper level tabs
    setActiveSubSubTab('');
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
  };

  const handleSubSubTabChange = (subSubTab) => {
    setActiveSubSubTab(subSubTab);
    // Reset deeper level tabs
    setActiveSubSubSubTab('');
    setActiveSubSubSubSubTab('');
  };

  const handleSubSubSubTabChange = (subSubSubTab) => {
    setActiveSubSubSubTab(subSubSubTab);
    // Reset deeper level tabs
    setActiveSubSubSubSubTab('');
  };

  const handleSubSubSubSubTabChange = (subSubSubSubTab) => {
    setActiveSubSubSubSubTab(subSubSubSubTab);
  };
  
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

        {/* Main Tabs (Level 1) */}
        <div className="mb-4 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Tabs (Level 2) - Shown when Contacted is active */}
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

        {/* Sub Sub Tabs (Level 3) - Shown when Interested is active */}
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

        {/* Sub Sub Sub Tabs (Level 4) - Shown when Hot Lead is active */}
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

        {/* Sub Sub Sub Sub Tabs (Level 5) - Shown when Real is active */}
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
          {/* Table */}
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
                  {/* <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th> */}
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
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">#{lead.leadId || lead.id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {lead.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(lead.phone)}</td>
                      <td className="px-6 py-4 text-gray-300">{lead.nationality}</td>
                      <td className="px-6 py-4 text-gray-300">{lead.agent}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{lead.source ?? 'Kiosk'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                          {lead.status} {lead.depositStatus ? ` - ${lead.depositStatus}` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{convertToDubaiTime(lead.createdAt)}</td>
                      {/* <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td> */}
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
      </div>

      {/* Row Click Modal - UPDATED WITH PRE-SELECTED AGENT AND REMARKS */}
      {showRowModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 w-full max-w-md animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#BBA473]/30">
              <div>
                <h3 className="text-xl font-bold text-[#BBA473]">Assign Lead</h3>
                <p className="text-gray-400 text-sm mt-1">Assign this lead to an agent</p>
              </div>
              <button
                onClick={() => {
                  setShowRowModal(false);
                  setSelectedLead(null);
                  setSelectedAgentForLead('');
                }}
                className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Lead Info */}
              <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#BBA473]/20">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Lead Name:</span>
                    <p className="text-white font-medium mt-1">{selectedLead.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <p className="text-white font-medium mt-1">{formatPhoneDisplay(selectedLead.phone)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Nationality:</span>
                    <p className="text-white font-medium mt-1">{selectedLead.nationality}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Language:</span>
                    <p className="text-white font-medium mt-1">{selectedLead.language}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedLead.status)}`}>
                        {selectedLead.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Remarks Section */}
                {selectedLead.remarks && (
                  <div className="mt-3 pt-3 border-t border-[#BBA473]/20">
                    <span className="text-gray-400 text-sm">Remarks:</span>
                    <p className="text-white text-sm mt-1 leading-relaxed">{selectedLead.remarks}</p>
                  </div>
                )}
              </div>

              {/* Agent Selection */}
              <div className="relative space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Select Agent <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedAgentForLead}
                    onChange={(e) => setSelectedAgentForLead(e.target.value)}
                    disabled={assigningLead}
                    className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose agent...</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName} ({agent.username}) - {agent.department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute bg-[#1a1a1a] right-1 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-[#BBA473]/30">
              <button
                onClick={() => {
                  setShowRowModal(false);
                  setSelectedLead(null);
                  setSelectedAgentForLead('');
                }}
                disabled={assigningLead}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAgent}
                disabled={assigningLead || !selectedAgentForLead}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigningLead ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full lg:w-2/5 bg-[#1A1A1A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#BBA473]/30 bg-gradient-to-r from-[#BBA473]/10 to-transparent">
            <div>
              <h2 className="text-2xl font-bold text-[#BBA473]">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingLead ? 'Update lead information' : 'Fill in the details to create a new lead'}
              </p>
            </div>
            <button
              onClick={handleCloseDrawer}
              className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer Form */}
          <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="grid space-y-4">
                <h3 className="text-lg font-semibold text-[#E8D5A3] border-b border-[#BBA473]/30 pb-2">
                  Lead Information
                </h3>

                {/* Form fields remain the same as original... */}
                {/* ... rest of the form ... */}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30 mt-6">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                {formik.isSubmitting 
                  ? (editingLead ? 'Updating Lead...' : 'Creating Lead...') 
                  : (editingLead ? 'Update Lead' : 'Create Lead')
                }
              </button>
            </div>
          </form>
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

        /* Custom Phone Input Styles */
        .phone-input-custom .PhoneInputInput {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid rgba(187, 164, 115, 0.3);
          border-radius: 0.5rem;
          background-color: #1A1A1A;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .phone-input-custom .PhoneInputInput:hover {
          border-color: #BBA473;
        }

        .phone-input-custom .PhoneInputInput:focus {
          border-color: #BBA473;
          ring: 2px;
          ring-color: rgba(187, 164, 115, 0.5);
        }

        .phone-input-error .PhoneInputInput {
          border-color: #ef4444;
        }

        .phone-input-error .PhoneInputInput:focus {
          border-color: #f87171;
          ring-color: rgba(239, 68, 68, 0.5);
        }

        .phone-input-custom .PhoneInputCountry {
          margin-right: 0.5rem;
          padding: 0.5rem;
          background-color: #1A1A1A;
          border: 2px solid rgba(187, 164, 115, 0.3);
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }

        .phone-input-custom .PhoneInputCountry:hover {
          border-color: #BBA473;
        }

        .phone-input-custom .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .phone-input-custom .PhoneInputCountrySelectArrow {
          color: #BBA473;
          opacity: 0.8;
          margin-left: 0.5rem;
        }
      `}</style>
    </>
  );
};

export default LeadManagement;