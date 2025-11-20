import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, X, UserPlus, Eye } from 'lucide-react';
import { getAllLeads, createLead, updateLead, deleteLead } from '../../services/leadService';
import { Calendar } from 'lucide-react'
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
    .matches(/^\+\d{1,4}\s\d{1,14}$/, 'Invalid phone number format'),
  email: Yup.string()
    .email('Invalid email address'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future'),
    // .test('age', 'Must be at least 18 years old', function(value) {
    //   const cutoff = new Date();
    //   cutoff.setFullYear(cutoff.getFullYear() - 18);
    //   return value <= cutoff;
    // }),
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isLeadsDrawerOpen, setIsLeadsDrawerOpen] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [interestedSubTab, setInterestedSubTab] = useState('Hot Lead');
  const [hotLeadsSubTab, setHotLeadsSubTab] = useState('Real');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [selectedFilter, setSelectedFilter] = useState('');

  // const tabs = ['All', 'Answered', 'Not Answered ( Cold Leads )', 'Interested', 'Not Interested'];
  const tabs = ['All', 'Real', 'Demo'];

  const interestedSubTabs = ['Warm Lead ( Silent Leads )', 'Hot Leads'];
  const hotLeadsSubTabs = ['Real', 'Demo'];
  const perPageOptions = [10, 20, 30, 50, 100];
  const filterOptions = ['Active Deposits', 'Not Active Deposits'];

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

  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);

  const nationalities = ['Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Australian', 'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Canadian', 'Chinese', 'Colombian', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Italian', 'Japanese', 'Jordanian', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nigerian', 'Norwegian', 'Pakistani', 'Palestinian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Saudi', 'Singaporean', 'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Syrian', 'Thai', 'Turkish', 'Ukrainian', 'Yemeni'];

  const residencies = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Pakistan', 'India', 'Egypt', 'Jordan', 'Lebanon', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'];

  const languages = ['English', 'Arabic', 'Urdu', 'Hindi', 'French', 'Spanish', 'German', 'Chinese (Mandarin)', 'Russian', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Turkish', 'Persian (Farsi)', 'Bengali', 'Tamil', 'Telugu', 'Malayalam'];

  const sources = ['Kiosk'];

  // Fetch leads from API
  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // Convert dates to ISO string format for API
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllLeads(page, limit, startDateStr, endDateStr);
      
      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedLeads = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          email: lead.leadEmail,
          phone: lead.leadPhoneNumber,
          dateOfBirth: lead.leadDateOfBirth,
          nationality: lead.leadNationality,
          residency: lead.leadResidency,
          language: lead.leadPreferredLanguage,
          // depositStatus: lead.depositStatus,
          source: `${lead.leadSourceId.length > 0 ? `${lead.leadSourceId.at(-1).firstName} ${lead.leadSourceId.at(-1).lastName}`: "-"}`,
          remarks: lead.leadDescription || '',
          status: lead.leadStatus,
          createdAt: lead.createdAt,
        }));
        
        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
      } else {
        console.error('Failed to fetch leads:', result.message);
        if (result.requiresAuth) {
          // Handle authentication error - redirect to login
          toast.error('Session expired. Please login again');
          // You can add navigation logic here if needed
        } else {
          // alert(result.message || 'Failed to fetch leads');
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Please try again');
    } finally {
      setLoading(false);
    }
  };

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

        let result;
        
        if (editingLead) {
          // Update existing lead
          result = await updateLead(editingLead.id, leadData);
        } else {
          // Create new lead
          result = await createLead(leadData);
        }

        if (result.success) {
          toast.success(result.message || `Lead ${editingLead ? 'updated' : 'created'} successfully!`);
          resetForm();
          setDrawerOpen(false);
          setEditingLead(null);
          // Refresh the lead list
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
            // You can add navigation logic here if needed
          } else {
            toast.error(result.message || `Failed to ${editingLead ? 'update' : 'create'} lead`);
          }
        }
      } catch (error) {
        console.error('Error submitting lead:', error);
        toast.error(`Failed to ${editingLead ? 'update' : 'create'} lead. Please try again.`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
    (lead?.name?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.email?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.phone || '').includes(searchQuery || '') ||
    (lead?.nationality?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.residency?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '') ||
    (lead?.source?.toLowerCase() || '').includes(searchQuery?.toLowerCase() || '');
      const matchesTab = activeTab === 'All' || lead.status === activeTab;
    return matchesSearch && matchesTab;
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
    
    // Extract country code and phone number
    const phoneMatch = lead.phone.match(/^(\+\d{1,4})\s?(.+)$/);
    let countryCode = countryCodes[0];
    let phoneNumber = lead.phone;
    
    if (phoneMatch) {
      const dialCode = phoneMatch[1];
      phoneNumber = phoneMatch[2];
      const foundCountry = countryCodes.find(c => c.dialCode === dialCode);
      if (foundCountry) {
        countryCode = foundCountry;
      }
    }
    
    setSelectedCountry(countryCode);
    
    // Set form values
    formik.setValues({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      dateOfBirth: lead.dateOfBirth || '',
      nationality: lead.nationality || '',
      residency: lead.residency || '',
      language: lead.language || '',
      source: lead.source || '',
      remarks: lead.remarks || '',
    });
    
    setDrawerOpen(true);
    setShowActionsDropdown(null);
  };

  const handleDelete = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const result = await deleteLead(leadId);
        
        if (result.success) {
          toast.success(result.message || 'Lead deleted successfully!');
          // Refresh the lead list
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
          } else {
            toast.error(result.message || 'Failed to delete lead');
          }
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead. Please try again');
      }
      setShowActionsDropdown(null);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(null);
    formik.resetForm();
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

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    

    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
  
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2025-11-21';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsLeadsDrawerOpen(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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
                  if(!isLeadsDrawerOpen) {
                    setEditingLead(null);
                    formik.resetForm();
                    setDrawerOpen(true);
                  }
                }}
                className="group relative w-fit inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 ml-auto"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <UserPlus className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                <span className="relative z-10">Add New Lead</span>
              </button>

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

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

        {/* Sub-tabs for Interested and Filter Select */}
        {activeTab === 'Interested' && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                {interestedSubTabs.map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setInterestedSubTab(subTab)}
                    className={`px-5 py-2 font-medium rounded-lg transition-all duration-300 ${
                      interestedSubTab === subTab
                        ? 'bg-[#BBA473] text-black'
                        : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#3A3A3A] border border-[#BBA473]/30'
                    }`}
                  >
                    {subTab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

            {/* Sub-tabs for Hot Leads and Filter Select */}
        {interestedSubTab === 'Hot Leads' && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                {hotLeadsSubTabs.map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setHotLeadsSubTab(subTab)}
                    className={`px-5 py-2 font-medium rounded-lg transition-all duration-300 ${
                      hotLeadsSubTab === subTab
                        ? 'bg-[#BBA473] text-black'
                        : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#3A3A3A] border border-[#BBA473]/30'
                    }`}
                  >
                    {subTab}
                  </button>
                ))}
              </div>

              {/* Filter Select */}
              <div className="w-full lg:w-64">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
                >
                  <option value="">Select Filter</option>
                  {filterOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
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
                  {/* <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Email</th> */}
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Nationality</th>
                  {/* <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Residency</th> */}
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
                      className="hover:bg-[#3A3A3A] transition-all duration-300 group"
                    >
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">#{lead.leadId || lead.id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {lead.name}
                          </span>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 text-gray-300">{lead.email}</td> */}
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(lead.phone)}</td>
                      <td className="px-6 py-4 text-gray-300">{lead.nationality}</td>
                      {/* <td className="px-6 py-4 text-gray-300">{lead.residency}</td> */}
                      <td className="px-6 py-4 text-gray-300 text-sm">{lead.source}</td>
                      {!isLeadsDrawerOpen && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                            {lead.status} {lead.depositStatus ? ` - ${lead.depositStatus}` : ''}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-300 text-sm">{convertToDubaiTime(lead.createdAt)}</td>
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
      </div>

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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#E8D5A3] border-b border-[#BBA473]/30 pb-2">
                  Lead Information
                </h3>

                {/* Two Column Grid - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter full name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.name && formik.errors.name
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    />
                    {formik.touched.name && formik.errors.name && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Email Address 
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.email && formik.errors.email
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    />
                    {formik.touched.email && formik.errors.email && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.email}</div>
                    )}
                  </div>
                </div>

                {/* Phone Number - Full Width */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="h-full px-3 py-3 border-2 border-[#BBA473]/30 rounded-lg bg-[#1A1A1A] hover:border-[#BBA473] transition-all duration-300 flex items-center gap-2 min-w-[100px]"
                      >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-white text-sm">{selectedCountry.dialCode}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>
                      {showCountryDropdown && (
                        <div className="absolute top-full mt-2 left-0 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg shadow-xl z-10 min-w-[280px] max-h-60 overflow-y-auto">
                          {countryCodes.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setShowCountryDropdown(false);
                                const phoneWithoutCode = formik.values.phone.replace(/^\+\d{1,4}\s/, '');
                                formik.setFieldValue('phone', `${country.dialCode} ${phoneWithoutCode}`);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[#3A3A3A] transition-colors flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg"
                            >
                              <span className="text-xl">{country.flag}</span>
                              <div className="flex-1">
                                <div className="text-white text-sm">{country.name}</div>
                                <div className="text-gray-400 text-xs">{country.dialCode}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isLeadsDrawerOpen && (
                      <input
                        type="text"
                        name="phone"
                        placeholder="50 123 4567"
                        value={formik.values.phone.replace(/^\+\d{1,4}\s/, '')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          formik.setFieldValue('phone', `${selectedCountry.dialCode} ${value}`);
                        }}
                        onBlur={formik.handleBlur}
                        className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                          formik.touched.phone && formik.errors.phone
                            ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                            : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                        }`}
                      />
                    )}
                  </div>
                  {formik.touched.phone && formik.errors.phone && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.phone}</div>
                  )}
                </div>

                {/* Two Column Grid - Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date of Birth */}
                  <div className="space-y-2 relative">
                    <label className="text-sm text-[#E8D5A3] font-medium block">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formik.values.dateOfBirth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.dateOfBirth && formik.errors.dateOfBirth
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.dateOfBirth}</div>
                    )}
                  </div>

                  {/* Nationality */}
                  <div className="relative space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Nationality
                    </label>
                    <select
                      name="nationality"
                      value={formik.values.nationality}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.nationality && formik.errors.nationality
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Nationality</option>
                      {nationalities.map((nationality) => (
                        <option key={nationality} value={nationality}>{nationality}</option>
                      ))}
                    </select>
                    {formik.touched.nationality && formik.errors.nationality && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.nationality}</div>
                    )}
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Two Column Grid - Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Residency */}
                  <div className="relative space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Country of Residency
                    </label>
                    <select
                      name="residency"
                      value={formik.values.residency}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.residency && formik.errors.residency
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Residency</option>
                      {residencies.map((residency) => (
                        <option key={residency} value={residency}>{residency}</option>
                      ))}
                    </select>
                    {formik.touched.residency && formik.errors.residency && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.residency}</div>
                    )}
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Language */}
                  <div className="relative space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Preferred Language
                    </label>
                    <select
                      name="language"
                      value={formik.values.language}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.language && formik.errors.language
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Language</option>
                      {languages.map((language) => (
                        <option key={language} value={language}>{language}</option>
                      ))}
                    </select>
                    {formik.touched.language && formik.errors.language && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.language}</div>
                    )}
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Source - Full Width */}
                <div className="relative space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Lead Source
                  </label>
                  <select
                    name="source"
                    value={formik.values.source}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.source && formik.errors.source
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  >
                    <option value="">Select Source</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  {formik.touched.source && formik.errors.source && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.source}</div>
                  )}
                  <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Remarks - Full Width */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    placeholder="Add any additional notes or comments about this lead..."
                    rows="4"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white resize-none transition-all duration-300 ${
                      formik.touched.remarks && formik.errors.remarks
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      {formik.touched.remarks && formik.errors.remarks && (
                        <div className="text-red-400 text-sm animate-pulse">{formik.errors.remarks}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formik.values.remarks.length}/500
                    </div>
                  </div>
                </div>
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
              {!isLeadsDrawerOpen && (
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
              )}
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
      `}</style>
    </>
  );
};

export default LeadManagement;