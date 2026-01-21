import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, X, UserPlus, Eye, EyeOff, RefreshCw, Upload, Calendar } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser, getDeviceInfo } from '../../services/teamService';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { getAllBranches } from '../../services/branchService';
import DateRangePicker from '../../components/DateRangePicker';

// Validation Schema
const salesManagerValidationSchema = Yup.object({
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
//   inBranch: Yup.string().required('Branch is required'),
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

const SalesManagers = () => {
  const [salesManagers, setSalesManagers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSalesManager, setEditingSalesManager] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalSalesManagers, setTotalSalesManagers] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // States for branches
  const [branches, setBranches] = useState([]);
  const [totalBranches, setTotalBranches] = useState(0);

  const perPageOptions = [10, 20, 30, 50, 100];
  const departments = ['Sales'];

  // Fetch branches from API
  const fetchBranches = async (page = 1, limit = 100) => {
    try {
      const result = await getAllBranches(page, limit);
      
      if (result.success && result.data) {
        const transformedBranches = result.data.map((branch) => ({
          id: branch._id,
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

  // Fetch users from API and filter for Kiosk Member role only
  const fetchSalesManagers = async (page = 1, limit = 100) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllUsers(page, limit, startDateStr, endDateStr);
      
      if (result.success && result.data) {
        // Filter only Kiosk Member users
        const salesManagersData = result.data.filter(user => 
          user.roleName === 'Kiosk Member' || user.roleName === 'Kiosk Member'
        );
        
        const transformedSalesManagers = salesManagersData.map((user) => ({
          id: user._id,
          username: user?.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phoneNumber,
          dateOfBirth: user.dateOfBirthday,
          department: user.department || 'Sales',
          role: user.roleName || 'Kiosk Member',
          branch: user?.branchData?.length ? user?.branchData[0]?.branchName : '-',
          image: user.imageUrl,
          permissions: user.permissions,
          createdAt: new Date().toISOString(),
        }));

        console.log(transformedSalesManagers, 'sdklfjskdf')
        
        setSalesManagers(transformedSalesManagers);
        setTotalSalesManagers(transformedSalesManagers.length);
      } else {
        console.error('Failed to fetch Kiosk Members:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch Kiosk Members');
        }
      }
    } catch (error) {
      console.error('Error fetching Kiosk Members:', error);
      toast.error('Failed to fetch Kiosk Members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    fetchSalesManagers();
  }, [startDate, endDate, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const formik = useFormik({
    initialValues: {
      firstName: editingSalesManager?.firstName || '',
      lastName: editingSalesManager?.lastName || '',
      email: editingSalesManager?.email || '',
      phone: editingSalesManager?.phone || '',
      dateOfBirth: editingSalesManager?.dateOfBirth || '',
      department: editingSalesManager?.department || 'Sales',
      role: 'Kiosk Member', // Fixed to Kiosk Member role
    //   inBranch: editingSalesManager?.branch || '',
      image: null,
      password: '',
      gender: 'Male',
      nationality: 'Pakistani',
      countryOfResidence: 'Pakistan',
    },
    validationSchema: salesManagerValidationSchema,
    context: { isEditing: !!editingSalesManager },
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
          roleName: 'Kiosk Member', // Always Kiosk Member
          department: values.department,
        //   inBranch: values.inBranch,
          countryOfResidence: values.countryOfResidence,
          nationality: values.nationality,
          isPhoneVerified: true,
          isEmailVerified: true,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          deviceOperatingSystem: deviceInfo.deviceOperatingSystem,
          deviceIPAddress: "0.0.0.0"
        };

        // Add password only for new users
        if (!editingSalesManager && values.password) {
          userData.password = values.password;
        }

        let result;
        if (editingSalesManager) {
          result = await updateUser(editingSalesManager.id, userData);
        } else {
          result = await createUser(userData);
        }

        if (result.success) {
          toast.success(result.message || (editingSalesManager ? 'Kiosk Member updated successfully!' : 'Kiosk Member created successfully!'));
          resetForm();
          setImagePreview(null);
          setDrawerOpen(false);
          setEditingSalesManager(null);
          fetchSalesManagers();
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error.payload.message || (editingSalesManager ? 'Failed to update Kiosk Member' : 'Failed to create Kiosk Member'));
          }
        }
      } catch (error) {
        console.error('Error saving Kiosk Member:', error);
        toast.error('Failed to save Kiosk Member. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredSalesManagers = salesManagers.filter(manager => {
    const matchesSearch = 
      manager.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      manager.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      manager.phone.includes(searchQuery);
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalSalesManagers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSalesManagers = filteredSalesManagers.slice(startIndex, endIndex);
  const showingFrom = filteredSalesManagers.length > 0 ? startIndex + 1 : 0;
  const showingTo = Math.min(startIndex + currentSalesManagers.length, totalSalesManagers);

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

  const handleEdit = (manager) => {
    setEditingSalesManager(manager);
    setImagePreview(manager.image || null);
    setDrawerOpen(true);
  };

  const handleDelete = async (managerId) => {
    if (window.confirm('Are you sure you want to delete this Kiosk Member?')) {
      try {
        const result = await deleteUser(managerId);
        
        if (result.success) {
          toast.success(result.message || 'Kiosk Member deleted successfully!');
          fetchSalesManagers();
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error.payload.message || 'Failed to delete Kiosk Member');
          }
        }
      } catch (error) {
        console.error('Error deleting Kiosk Member:', error);
        toast.error('Failed to delete Kiosk Member. Please try again.');
      }
    }
  };

  const handleAddSalesManager = () => {
    setEditingSalesManager(null);
    formik.resetForm();
    setImagePreview(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingSalesManager(null);
    formik.resetForm();
    setImagePreview(null);
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

  // Helper function to get branch name by ID
  const getBranchNameById = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.branchName : branchId;
  };

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Kiosk Members
              </h1>
              <p className="text-gray-400 mt-2">Manage all Save In Gold Kiosk Members</p>
            </div>
            <div className="flex flex-col gap-3">
            <button
              onClick={handleAddSalesManager}
              className="group relative w-fit inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 ml-auto"
              >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <UserPlus className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative z-10">Add New Kiosk Member</span>
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
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Full Name</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Branch</th>
                  <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBA473]/10">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      Loading Kiosk Members...
                    </td>
                  </tr>
                ) : currentSalesManagers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      No Kiosk Members found
                    </td>
                  </tr>
                ) : (
                  currentSalesManagers.map((manager) => (
                    <tr
                      key={manager.id}
                      className="hover:bg-[#3A3A3A] transition-all duration-300 group"
                    >
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                        {manager.username}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {manager.image ? (
                            <img
                              src={manager.image}
                              alt={manager.fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#BBA473]/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center text-black font-semibold">
                              {manager.firstName?.[0]}{manager.lastName?.[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                              {manager.fullName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{manager.email}</td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(manager.phone)}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#BBA473]/20 text-[#E8D5A3] border border-[#BBA473]/30">
                          {manager.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {manager.branch}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(manager)}
                            className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(manager.id)}
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
                  <span className="text-white font-semibold">{totalSalesManagers}</span> entries
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
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full lg:w-2/5 bg-[#1A1A1A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-[#BBA473]/30 bg-gradient-to-r from-[#BBA473]/10 to-transparent">
            <div>
              <h2 className="text-2xl font-bold text-[#BBA473]">
                {editingSalesManager ? 'Edit Kiosk Member' : 'Add New Kiosk Member'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingSalesManager ? 'Update Kiosk Member information' : 'Fill in the details to add a new Kiosk Member'}
              </p>
            </div>
            <button
              onClick={handleCloseDrawer}
              className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Personal Information Section */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#BBA473]/30 pb-3">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.firstName && formik.errors.firstName
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.firstName}</div>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.lastName && formik.errors.lastName
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.lastName}</div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@example.com"
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

                {/* Date of Birth with Calendar */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formik.values.dateOfBirth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.dateOfBirth && formik.errors.dateOfBirth
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                      style={{
                        colorScheme: 'dark'
                      }}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                  {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.dateOfBirth}</div>
                  )}
                </div>

                {/* Phone - International */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    international
                    defaultCountry="AE"
                    value={formik.values.phone}
                    onChange={(value) => formik.setFieldValue('phone', value || '')}
                    onBlur={() => formik.setFieldTouched('phone', true)}
                    className={`phone-input-custom ${
                      formik.touched.phone && formik.errors.phone
                        ? 'phone-input-error'
                        : ''
                    }`}
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.phone}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#BBA473]/30 pb-3">
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formik.values.department}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${
                        formik.touched.department && formik.errors.department
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                  {formik.touched.department && formik.errors.department && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.department}</div>
                  )}
                </div>

                {/* Branch */}
                {/* <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                <select
                      name="inBranch"
                      value={formik.values.inBranch}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${
                        formik.touched.inBranch && formik.errors.inBranch
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.branchName}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                  {formik.touched.inBranch && formik.errors.inBranch && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.inBranch}</div>
                  )}
                </div> */}

                {/* Password - only for new Kiosk Members */}
                {!editingSalesManager && (
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 pr-24 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                          formik.touched.password && formik.errors.password
                            ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                            : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white focus:outline-none transition-all duration-300 hover:scale-110"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="h-7 px-2 flex items-center justify-center bg-[#BBA473] text-black rounded-md hover:bg-[#d4bc89] focus:outline-none text-xs transition-all duration-300 hover:scale-105"
                          title="Generate Password"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span>Gen</span>
                        </button>
                      </div>
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.password}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2 pt-4">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Profile Image
                </label>
                
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-[#BBA473]/30 rounded-lg p-6 text-center hover:border-[#BBA473] transition-all duration-300">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-12 h-12 text-gray-400 transition-transform duration-300 hover:scale-110" />
                      <span className="text-gray-400">Click to upload image</span>
                      <span className="text-xs text-gray-500">JPG, PNG or GIF (Max 5MB)</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-[#BBA473]"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-300 hover:scale-110 hover:rotate-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {formik.touched.image && formik.errors.image && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.image}</div>
                )}
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
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                {formik.isSubmitting 
                  ? (editingSalesManager ? 'Updating...' : 'Creating...') 
                  : (editingSalesManager ? 'Update Kiosk Member' : 'Create Kiosk Member')
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

export default SalesManagers;