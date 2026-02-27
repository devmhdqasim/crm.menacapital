import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, MapPin, X, Building2, User, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { getAllBranches, createBranch, updateBranch, deleteBranch } from '../../services/eventService';
import { getAllUsers } from '../../services/teamService';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import Select from 'react-select';
import DateRangePicker from '../../components/DateRangePicker';

// Event location options
const BRANCH_LOCATIONS = [
  { value: 'head_office', label: 'Head Office' },
  { value: 'sharjah_branch', label: 'Sharjah Event' }
];

// Validation Schema matching new API structure
const branchValidationSchema = Yup.object({
  branchName: Yup.string()
    .required('Event name is required')
    .min(3, 'Event name must be at least 3 characters')
    .max(100, 'Event name must not exceed 100 characters'),
  branchLocation: Yup.string()
    .required('Event location is required'),
    // .oneOf(['head_office', 'sharjah_branch'], 'Invalid event location'),
  branchPhoneNumber: Yup.string()
    .required('Phone number is required')
    .test('valid-phone', 'Invalid phone number', function(value) {
      if (!value) return false;
      try {
        return isValidPhoneNumber(value);
      } catch {
        return false;
      }
    }),
  branchEmail: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
  branchPassword: Yup.string()
    .when('$isEditing', {
      is: false,
      then: (schema) => schema
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain uppercase, lowercase, number and special character'
        ),
      otherwise: (schema) => schema
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain uppercase, lowercase, number and special character'
        )
    }),
  salesManager: Yup.string()
    .required('Sales Manager is required'),
  latitude: Yup.number()
    .required('Latitude is required')
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: Yup.number()
    .required('Longitude is required')
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  // ── NEW: eventSource – optional field ──────────────────────────────────────
  eventSource: Yup.string()
    .optional()
    .test('no-leading-digit', 'First character cannot be a number', (value) => {
      if (!value || value.length === 0) return true; // optional – skip if empty
      return !/^\d/.test(value);
    })
    .test('no-special-chars', 'No special characters allowed', (value) => {
      if (!value || value.length === 0) return true;
      return /^[a-zA-Z0-9\s]+$/.test(value);
    })
    .test('min-length', 'Event source must be at least 3 characters', (value) => {
      if (!value || value.length === 0) return true;
      return value.length >= 3;
    }),
});

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalBranches, setTotalBranches] = useState(0);
  const [isBranchMembersVisible, setIsBranchMembersVisible] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [kioskMembers, setKioskMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [salesManagers, setSalesManagers] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const tabs = ['All'];
  const perPageOptions = [10, 20, 30, 50, 100];

  const fetchSalesManagers = async () => {
    try {
      const result = await getAllUsers(1, 100);
      if (result.success && result.data) {
        const filtered = result.data.filter(
          (user) => user.role === 'Sales Manager' || user.roleName === 'Sales Manager'
        );
  
        const formatted = filtered.map((u) => ({
          id: u._id || u.id,
          name: `${u.firstName} ${u.lastName}`,
          value: u._id || u.id,
        }));
  
        setSalesManagers(formatted);
      }
    } catch (err) {
      console.error('Error fetching sales managers:', err);
    }
  };
  

  // Fetch Kiosk Members from API
  const fetchKioskMembers = async () => {
    setLoadingMembers(true);
    try {
      // Fetch all users and filter by Kiosk Member role
      const result = await getAllUsers(1, 100); // Fetch more to ensure we get all kiosk members
      
      if (result.success && result.data) {
        // Filter users with role "Kiosk Member"
        const filteredMembers = result.data.filter(user => 
          user.role === 'Kiosk Member' || 
          user.roleName === 'Kiosk Member'
        );
        
        // Transform to the format needed for react-select dropdown
        const transformedMembers = filteredMembers.map(member => ({
          value: member._id || member.id,
          label: `${member.firstName} ${member.lastName}`,
          email: member.email,
          phone: member.phone
        }));
        
        setKioskMembers(transformedMembers);
        console.log('Fetched Kiosk Members:', transformedMembers.length);
      } else {
        console.error('Failed to fetch members:', result.message);
      }
    } catch (error) {
      console.error('Error fetching kiosk members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch branches from API
  const fetchBranches = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllBranches(page, limit, startDateStr, endDateStr);
      
      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedBranches = result.data.map((event) => ({
          id: event._id,
          branchId: event.branchId || event.eventId,
          branchName: event.eventName || event.branchName,
          branchUsername: event.eventUsername || event.branchUsername,
          branchLocation: event.eventLocation || event.branchLocation,
          branchPhoneNumber: event.eventPhoneNumber || event.branchPhoneNumber,
          branchEmail: event.eventEmail || event.branchEmail,
          branchManager: event.eventManager || event.branchManager, // Keep original manager object
          branchManagerDisplay: event.eventManager?.firstName 
            ? `${event.eventManager.firstName} ${event.eventManager.lastName}`
            : event.branchManager?.firstName 
              ? `${event.branchManager.firstName} ${event.branchManager.lastName}`
              : "-",
          branchMembers: event.eventMembers || event.branchMembers || [], // Keep original members array
          branchCoordinates: event.eventCoordinates || event.branchCoordinates || [0, 0],
          // ── NEW: preserve eventSource from API ────────────────────────────
          eventSource: event.eventSource || '',
          createdAt: event.createdAt || new Date().toISOString(),
        }));
        
        console.log('📊 Transformed branches:', transformedBranches);
        
        setBranches(transformedBranches);
        setTotalBranches(result.metadata?.total || 0);
      } else {
        console.error('Failed to fetch branches:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch branches');
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch branches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load branches and kiosk members on component mount
  useEffect(() => {
    setIsLoaded(true);
    fetchBranches(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage]);

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    

    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
  
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2027-03-19';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsBranchMembersVisible(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchKioskMembers();
    fetchSalesManagers();
  }, [currentPage, itemsPerPage]);

  const filteredBranches = branches.filter(event => {
    const matchesSearch = 
      event.branchName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.branchLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.branchManagerDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.branchEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalBranches / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBranches = filteredBranches;
  const showingFrom = startIndex + 1;
  const showingTo = Math.min(startIndex + currentBranches.length, totalBranches);

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

  const handleEdit = (event) => {
    console.log('📝 Editing event:', event);
    
    // Extract event member IDs - handle both object array and string array
    const branchMemberIds = Array.isArray(event.branchMembers) 
      ? event.branchMembers.map(member => {
          if (typeof member === 'string') {
            return member;
          } else if (member && (member._id || member.id)) {
            return member._id || member.id;
          }
          return null;
        }).filter(id => id !== null)
      : [];
    
    console.log('👥 Extracted branchMembers IDs:', branchMemberIds);
    
    // Extract sales manager ID
    const salesManagerId = typeof event.branchManager === 'string' 
      ? event.branchManager 
      : event.branchManager?._id || event.branchManager?.id || '';
    
    console.log('👔 Sales Manager ID:', salesManagerId);
    
    setEditingBranch({
      ...event,
      branchMembers: branchMemberIds,
      salesManager: salesManagerId,
      // ── NEW: carry eventSource into the edit form ──────────────────────
      eventSource: event.eventSource || '',
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (branchId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const result = await deleteBranch(branchId);
        
        if (result.success) {
          toast.success(result.message || 'Event deleted successfully!', {
            duration: 3000,
            style: {
              background: '#2A2A2A',
              color: '#fff',
              border: '1px solid #BBA473',
            },
            iconTheme: {
              primary: '#BBA473',
              secondary: '#1A1A1A',
            },
          });
          
          // Refresh the event list
          fetchBranches(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error?.payload?.message || result.message || 'Failed to delete event');
          }
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event. Please try again.');
      }
    }
  };

  const handleAddBranch = () => {
    setEditingBranch(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setShowMemberDropdown(false);
    setShowLocationDropdown(false);
    setTimeout(() => setEditingBranch(null), 300);
  };

  // Get initial form values
  const getInitialValues = (existingBranch) => {
    if (existingBranch) {
      return {
        branchName: existingBranch.branchName || '',
        branchLocation: existingBranch.branchLocation || '',
        branchPhoneNumber: existingBranch.branchPhoneNumber || '',
        branchEmail: existingBranch.branchEmail || '',
        branchPassword: '',
        branchMembers: existingBranch.branchMembers || [],
        salesManager: existingBranch.salesManager || '',
        latitude: existingBranch.branchCoordinates?.[0] || 0,
        longitude: existingBranch.branchCoordinates?.[1] || 0,
        // ── NEW ───────────────────────────────────────────────────────────
        eventSource: existingBranch.eventSource || '',
      };
    }
    return {
      branchName: '',
      branchLocation: '',
      branchPhoneNumber: '',
      branchEmail: '',
      branchPassword: '',
      branchMembers: [],
      salesManager: '',
      latitude: 24.8607,
      longitude: 67.0011,
      // ── NEW ───────────────────────────────────────────────────────────
      eventSource: '',
    };
  };

  // Formik for drawer form
  const formik = useFormik({
    initialValues: getInitialValues(editingBranch),
    validationSchema: branchValidationSchema,
    enableReinitialize: true,
    context: { isEditing: !!editingBranch },
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        console.log('Form submitted:', values);
        
        // Get the selected location label for API
        const selectedLocation = BRANCH_LOCATIONS.find(loc => loc.value === values.branchLocation);
        
        // Ensure branchMembers is an array (it should be from react-select)
        const branchMemberArray = Array.isArray(values.branchMembers) ? values.branchMembers : [];
        
        if (!values.salesManager) {
          toast.error('Please select a sales manager');
          setSubmitting(false);
          return;
        }
        
        // Prepare event data for API matching new structure
        const branchData = {
          branchName: values.branchName,
          branchLocation: values.branchLocation,
          branchPhoneNumber: values.branchPhoneNumber,
          branchEmail: values.branchEmail,
          branchMembers: branchMemberArray, // Array of kiosk member IDs
          branchManager: values.salesManager, // Sales Manager ID
          branchCoordinates: [parseFloat(values.latitude), parseFloat(values.longitude)],
          isAvailable: true, // Default to available
        };

        // Only include password if it's provided (for edit, it's optional)
        if (values.branchPassword) {
          branchData.branchPassword = values.branchPassword;
        }

        // ── NEW: only send eventSource if the user filled it in ───────────
        if (values.eventSource && values.eventSource.trim().length > 0) {
          branchData.eventSource = values.eventSource.trim();
        }

        console.log('Sending event data to API:', branchData);

        let result;
        
        if(!isBranchMembersVisible) {
          if (editingBranch) {
            // Update existing event
            result = await updateBranch(editingBranch.id, branchData);
          } else {
            // Create new event
            result = await createBranch(branchData);
          }
        }

        if (result.success) {
          toast.success(result.message || result.data?.message || `Event ${editingBranch ? 'updated' : 'created'} successfully!`, {
            duration: 3000,
            style: {
              background: '#2A2A2A',
              color: '#fff',
              border: '1px solid #BBA473',
            },
            iconTheme: {
              primary: '#BBA473',
              secondary: '#1A1A1A',
            },
          });
          resetForm();
          handleCloseDrawer();
          // Refresh the event list
          fetchBranches(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error?.payload?.message || result.message || `Failed to ${editingBranch ? 'update' : 'create'} event`);
          }
        }
      } catch (error) {
        console.error(`Error ${editingBranch ? 'updating' : 'creating'} event:`, error);
        toast.error(`Failed to ${editingBranch ? 'update' : 'create'} event. Please try again.`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Get selected location label for display
  const getSelectedLocationLabel = () => {
    const location = BRANCH_LOCATIONS.find(loc => loc.value === formik.values.branchLocation);
    return location ? location.label : 'Select event location';
  };

  // Generate secure password
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    const categories = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      special: '@$!%*?&'
    };
    // Ensure at least one character from each category
    password += categories.lowercase[Math.floor(Math.random() * categories.lowercase.length)];
    password += categories.uppercase[Math.floor(Math.random() * categories.uppercase.length)];
    password += categories.numbers[Math.floor(Math.random() * categories.numbers.length)];
    password += categories.special[Math.floor(Math.random() * categories.special.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    return password;
  };

  // Custom styles for react-select to match your theme
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#1A1A1A',
      borderColor: state.isFocused 
        ? '#BBA473' 
        : formik.touched.branchMembers && formik.errors.branchMembers 
          ? '#ef4444' 
          : 'rgba(187, 164, 115, 0.3)',
      borderWidth: '2px',
      borderRadius: '0.5rem',
      padding: '0.25rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(187, 164, 115, 0.5)' : 'none',
      '&:hover': {
        borderColor: '#BBA473',
      },
      minHeight: '48px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#2A2A2A',
      border: '2px solid rgba(187, 164, 115, 0.3)',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      zIndex: 30,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0,
      maxHeight: '240px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'rgba(187, 164, 115, 0.2)' 
        : state.isFocused 
          ? '#3A3A3A' 
          : 'transparent',
      color: state.isSelected ? '#BBA473' : '#fff',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'rgba(187, 164, 115, 0.3)',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(187, 164, 115, 0.2)',
      borderRadius: '0.375rem',
      border: '1px solid rgba(187, 164, 115, 0.3)',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#BBA473',
      padding: '0.25rem 0.5rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#BBA473',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#BBA473',
        color: '#1A1A1A',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6B7280',
    }),
    input: (provided) => ({
      ...provided,
      color: '#fff',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#fff',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#BBA473',
      '&:hover': {
        color: '#d4bc89',
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: '#BBA473',
      '&:hover': {
        color: '#d4bc89',
      },
    }),
  };

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Event Management
              </h1>
              <p className="text-gray-400 mt-2">Manage your Save In Gold branches locations and information</p>
            </div>

            <div className="flex flex-col gap-3">
            <button
              onClick={handleAddBranch}
              className="group relative w-fit inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 ml-auto"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Building2 className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative z-10">Add New Event</span>
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

        {/* Search */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fadeIn">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, location, manager, or email..."
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
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Event ID</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Event Name</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Manager</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Email</th>
                  <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBA473]/10">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      Loading events...
                    </td>
                  </tr>
                ) : currentBranches.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      No event found
                    </td>
                  </tr>
                ) : (
                  currentBranches.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-[#3A3A3A] transition-all duration-300 group"
                    >
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                        {event.branchUsername}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 aspect-square rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <Building2 className="w-5 h-5 text-black" />
                          </div>
                          <span className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {event.branchName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-xs">
                          <MapPin className="w-4 h-4 text-[#BBA473] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{event.branchLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{event.branchManagerDisplay}</td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{event.branchPhoneNumber}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{event.branchEmail}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
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
                <span className="text-white font-semibold">{totalBranches}</span> entries
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

      {/* ── Drawer backdrop overlay ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          drawerOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCloseDrawer}
      />

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
                {editingBranch ? 'Edit Event' : 'Add New Event'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingBranch ? 'Update event information' : 'Fill in the details to create a new event'}
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
          <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Event Information */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#BBA473]/30 pb-3">
                Event Information
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Event Name */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  {!isBranchMembersVisible && (
                    <input
                      type="text"
                      name="branchName"
                      placeholder="Enter event name (e.g., Downtown Gold Hub)"
                      value={formik.values.branchName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.branchName && formik.errors.branchName
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    />
                  )}
                  {formik.touched.branchName && formik.errors.branchName && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.branchName}</div>
                  )}
                </div>

                {/* Event Location */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Event Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="branchLocation"
                    placeholder="Enter event location"
                    value={formik.values.branchLocation}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.branchLocation && formik.errors.branchLocation
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.branchLocation && formik.errors.branchLocation && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.branchLocation}</div>
                  )}
                </div>

                {/* Phone Number - International Phone Input */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    international
                    defaultCountry="AE"
                    value={formik.values.branchPhoneNumber}
                    onChange={(value) => formik.setFieldValue('branchPhoneNumber', value || '')}
                    onBlur={() => formik.setFieldTouched('branchPhoneNumber', true)}
                    className={`phone-input-custom ${
                      formik.touched.branchPhoneNumber && formik.errors.branchPhoneNumber
                        ? 'phone-input-error'
                        : ''
                    }`}
                  />
                  {formik.touched.branchPhoneNumber && formik.errors.branchPhoneNumber && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.branchPhoneNumber}</div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="branchEmail"
                    placeholder="example@email.com"
                    value={formik.values.branchEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.branchEmail && formik.errors.branchEmail
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.branchEmail && formik.errors.branchEmail && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.branchEmail}</div>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Event Password {!editingBranch && <span className="text-red-500">*</span>}
                    {editingBranch && <span className="text-gray-500 text-xs ml-2">(Leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="branchPassword"
                      placeholder={editingBranch ? "Enter new password (optional)" : "Enter secure password"}
                      value={formik.values.branchPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 pr-20 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.branchPassword && formik.errors.branchPassword
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formik.touched.branchPassword && formik.errors.branchPassword && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.branchPassword}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const generatedPassword = generatePassword();
                        formik.setFieldValue('branchPassword', generatedPassword);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#BBA473]/20 text-[#BBA473] rounded-lg hover:bg-[#BBA473]/30 transition-all duration-300 border border-[#BBA473]/30"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate Password
                    </button>
                    <p className="text-xs text-gray-500">Min 8 chars with uppercase, lowercase, number & special char</p>
                  </div>
                </div>

                {/* Sales Manager Select */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Sales Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="salesManager"
                    value={formik.values.salesManager}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.salesManager && formik.errors.salesManager
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  >
                    <option value="" disabled>
                      Select sales manager
                    </option>
                    {salesManagers.map((manager) => (
                      <option key={manager.id} value={manager.value}>
                        {!isBranchMembersVisible && manager.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.salesManager && formik.errors.salesManager && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.salesManager}</div>
                  )}
                </div>

                {/* ── NEW: Event Source (optional) ──────────────────────────────── */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Event Source
                    <span className="text-gray-500 text-xs ml-2">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="eventSource"
                    placeholder="Save In Gold Event(WTC)"
                    value={formik.values.eventSource}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.eventSource && formik.errors.eventSource
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.eventSource && formik.errors.eventSource && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.eventSource}</div>
                  )}
                </div>
                {/* ── END NEW ───────────────────────────────────────────────────── */}
              </div>
            </div>

            {/* Coordinates */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#BBA473]/30 pb-3">
                <MapPin className="w-5 h-5 text-[#BBA473]" />
                <h3 className="text-lg font-semibold text-white">GPS Coordinates</h3>
              </div>

              <p className="text-sm text-gray-400">
                Enter the GPS coordinates for the event location.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Latitude */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    name="latitude"
                    placeholder="24.8607"
                    value={formik.values.latitude}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.latitude && formik.errors.latitude
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.latitude && formik.errors.latitude && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.latitude}</div>
                  )}
                </div>

                {/* Longitude */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    name="longitude"
                    placeholder="67.0011"
                    value={formik.values.longitude}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.longitude && formik.errors.longitude
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.longitude && formik.errors.longitude && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.longitude}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              {!isBranchMembersVisible && (
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
                >
                  {formik.isSubmitting 
                    ? (editingBranch ? 'Updating Event...' : 'Creating Event...') 
                    : (editingBranch ? 'Update Event' : 'Create Event')
                  }
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Overlay for dropdowns */}
      {(showMemberDropdown || showLocationDropdown) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            if(!isBranchMembersVisible) {
              setShowMemberDropdown(false);
              setShowLocationDropdown(false);
            }
          }}
        />
      )}

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
        
        /* Phone Input Custom Styles */
        .phone-input-custom {
          display: flex;
          align-items: center;
          position: relative;
        }
        
        .phone-input-custom .PhoneInputInput {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid rgba(187, 164, 115, 0.3);
          border-radius: 0.5rem;
          background-color: #1A1A1A;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        .phone-input-custom .PhoneInputInput:hover {
          border-color: #BBA473;
        }
        
        .phone-input-custom .PhoneInputInput:focus {
          outline: none;
          border-color: #BBA473;
          ring: 2;
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

export default BranchManagement;