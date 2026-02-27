import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser, getDeviceInfo } from '../../services/teamService';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { getAllBranches } from '../../services/branchService';
import DateRangePicker from '../../components/DateRangePicker';
import AgentsListing from './AgentsListing';
import AgentFormDrawer from './AgentFormDrawer';
import AgentBottomSheet from './AgentBottomSheet';

// Validation Schema
const agentValidationSchema = Yup.object({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  email: Yup.string() 
    .required('Email is required')
    .email('Invalid email address'),
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
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Must be at least 18 years old', function(value) {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return value <= cutoff;
    }),
  department: Yup.string().required('Department is required'),
  image: Yup.mixed()
    .nullable()
    .test('fileSize', 'File size must be less than 5MB', function(value) {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Only image files are allowed (JPG, PNG, GIF)', function(value) {
      if (!value) return true;
      return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(value.type);
    }),
  password: Yup.string()
    .when('$isEditing', {
      is: false,
      then: (schema) => schema
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain uppercase, lowercase, number and special character'
        ),
      otherwise: (schema) => schema.notRequired()
    }),
});

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassIcon, setShowPassIcon] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalAgents, setTotalAgents] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // States for branches
  const [branches, setBranches] = useState([]);
  const [totalBranches, setTotalBranches] = useState(0);

  const departments = ['Sales'];

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Fetch branches from API
  const fetchBranches = async (page = 1, limit = 100) => {
    try {
      const result = await getAllBranches(page, limit);
      
      if (result.success && result.data) {
        const transformedBranches = result.data.map((branch) => ({
          id: branch._id,
          username: branch.username,
          branchId: branch.branchId,
          branchName: branch.branchName,
          branchLocation: branch.branchLocation,
          branchPhoneNumber: branch.branchPhoneNumber,
          branchEmail: branch.branchEmail,
          branchManager: branch.branchManager,
          branchCoordinates: branch.branchCoordinates || [0, 0],
          createdAt: branch.createdAt || new Date().toISOString(),
        }));
        
        setBranches(transformedBranches);
        setTotalBranches(result.metadata?.total || transformedBranches.length);
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
    }
  };

  // Fetch users from API and filter for Agent role only
  const fetchAgents = async (page = 1, limit = 100) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllUsers(page, limit, startDateStr, endDateStr, debouncedSearchQuery);
      
      if (result.success && result.data) {
        // Filter only Agent users
        const agentsData = result.data.filter(user => 
          user.roleName === 'Agent' || user.role === 'Agent' || user.roleName === 'Sales Manager' || user.role === 'Sales Manager'
        );
        
        const transformedAgents = agentsData.map((user) => ({
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phoneNumber,
          dateOfBirth: user.dateOfBirthday,
          department: user.department || 'Sales',
          role: user.roleName || 'Agent',
          totalLeadsAssigned: user.totalLeadsAssigned || 0,
          image: user.imageUrl,
          permissions: user.permissions,
          createdAt: user?.createdAt,
        }));
        
        setAgents(transformedAgents);
        setTotalAgents(transformedAgents.length);
      } else {
        console.error('Failed to fetch agents:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch agents');
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      setShowPassIcon(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchAgents(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const formik = useFormik({
    initialValues: {
      firstName: editingAgent?.firstName || '',
      lastName: editingAgent?.lastName || '',
      email: editingAgent?.email || '',
      phone: editingAgent?.phone || '',
      dateOfBirth: editingAgent?.dateOfBirth || '',
      department: editingAgent?.department || 'Sales',
      role: 'Agent',
      image: null,
      password: '',
      gender: 'Male',
      nationality: 'Pakistani',
      countryOfResidence: 'Pakistan',
    },
    validationSchema: agentValidationSchema,
    context: { isEditing: !!editingAgent },
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const deviceInfo = getDeviceInfo();
        const phoneNumber = values.phone.replace(/\s/g, '');
        
        const userData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: phoneNumber,
          dateOfBirthday: values.dateOfBirth,
          gender: values.gender,
          imageUrl: values.imageUrl || "https://example.com/images/default.jpg",
          roleName: 'Agent',
          department: values.department,
          countryOfResidence: values.countryOfResidence,
          nationality: values.nationality,
          isPhoneVerified: true,
          isEmailVerified: true,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          deviceOperatingSystem: deviceInfo.deviceOperatingSystem,
          deviceIPAddress: "0.0.0.0"
        };

        if (!editingAgent && values.password) {
          userData.password = values.password;
        }

        let result;
        if (editingAgent && !showPassIcon) {
          result = await updateUser(editingAgent.id, userData);
        } else {
          result = await createUser(userData);
        }

        if (result.success) {
          toast.success(result.message || (editingAgent ? 'Agent updated successfully!' : 'Agent created successfully!'));
          resetForm();
          setImagePreview(null);
          setDrawerOpen(false);
          setEditingAgent(null);
          fetchAgents();
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error.payload.message || (editingAgent ? 'Failed to update agent' : 'Failed to create agent'));
          }
        }
      } catch (error) {
        console.error('Error saving agent:', error);
        toast.error('Failed to save agent. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setImagePreview(agent.image || null);
    setDrawerOpen(true);
  };

  const handleDelete = async (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        const result = await deleteUser(agentId);
        
        if (result.success) {
          toast.success(result.message || 'Agent deleted successfully!');
          fetchAgents();
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error.payload.message || 'Failed to delete agent');
          }
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        toast.error('Failed to delete agent. Please try again.');
      }
    }
  };

  const handleAddAgent = () => {
    setEditingAgent(null);
    formik.resetForm();
    setImagePreview(null);
    setDrawerOpen(true);
  };

  const handleRowClick = (agent) => {
    setSelectedAgent(agent);
    setBottomSheetOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingAgent(null);
    formik.resetForm();
    setImagePreview(null);
  };

  const handleCloseBottomSheet = () => {
    setBottomSheetOpen(false);
    setSelectedAgent(null);
  };

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
    password += categories.lowercase[Math.floor(Math.random() * categories.lowercase.length)];
    password += categories.uppercase[Math.floor(Math.random() * categories.uppercase.length)];
    password += categories.numbers[Math.floor(Math.random() * categories.numbers.length)];
    password += categories.special[Math.floor(Math.random() * categories.special.length)];
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    formik.setFieldValue('password', password);
  };  

  const handleImageChange = (e) => {  
    const file = e.target.files?.[0]; 
    if (file) {
      formik.setFieldValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    formik.setFieldValue('image', null);
    setImagePreview(null);
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  function convertToDubaiTime(utcDateString) {
    const date = new Date(utcDateString);
  
    if (isNaN(date) && !showPassIcon) return false;
  
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
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 relative ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Agents Management
              </h1>
              <p className="text-gray-400 mt-2">Manage all Save In Gold Agents</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddAgent}
                className="btn-animated btn-gold w-fit bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ml-auto"
              >
                {!showPassIcon && <span className="inline-block">Add New Agent</span>}
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

        {/* Agents Listing Component */}
        <AgentsListing
          agents={agents}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          showPerPageDropdown={showPerPageDropdown}
          setShowPerPageDropdown={setShowPerPageDropdown}
          loading={loading}
          totalAgents={totalAgents}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          showPassIcon={showPassIcon}
          convertToDubaiTime={convertToDubaiTime}
          formatPhoneDisplay={formatPhoneDisplay}
          onRowClick={handleRowClick}
        />

        {/* Agent Bottom Sheet Component - Inside content area */}
        <AgentBottomSheet
          isOpen={bottomSheetOpen}
          onClose={handleCloseBottomSheet}
          selectedAgent={selectedAgent}
        />
      </div>

      {/* Agent Form Drawer Component */}
      <AgentFormDrawer
        drawerOpen={drawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        formik={formik}
        editingAgent={editingAgent}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showPassIcon={showPassIcon}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        removeImage={removeImage}
        generatePassword={generatePassword}
        departments={departments}
        branches={branches}
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

        /* Custom select arrow fix */
        select {
          background-image: none;
        }

        /* Date input calendar icon styling */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(3) hue-rotate(5deg);
          cursor: pointer;
          opacity: 0;
          position: absolute;
          right: 0;
          width: 100%;
          height: 100%;
        }

        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default AgentManagement;