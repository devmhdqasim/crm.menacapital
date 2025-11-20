import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, Shield, X, CheckCircle } from 'lucide-react';
import { getAllRoles, createRole } from '../../services/roleService';
import DateRangePicker from '../../components/DateRangePicker';
import toast from 'react-hot-toast';

// Validation Schema
const roleValidationSchema = Yup.object({
  roleName: Yup.string()
    .required('Role name is required')
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must not exceed 50 characters'),
  department: Yup.string()
    .required('Department is required'),
});

// Features List - Maps to API permissions
const featuresList = [
  { id: 'userPermissions', name: 'User Management', description: 'Manage system users', icon: '👤' },
  { id: 'leadPermissions', name: 'Lead Management', description: 'Manage leads', icon: '👥' },
];

// Permission types that map to API fields
const permissionTypes = [
  { id: 'canView', name: 'View', description: 'View records' },
  { id: 'canAdd', name: 'Add', description: 'Add new records' },
  { id: 'canEdit', name: 'Edit', description: 'Edit existing records' },
  { id: 'canDelete', name: 'Delete', description: 'Delete records' },
];

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalRoles, setTotalRoles] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const tabs = ['All', 'Sales Managers', 'Agents', 'Kiosk Team'];
  const perPageOptions = [10, 20, 30, 50, 100];
  const departments = ['Sales'];

  // Fetch roles from API
  const fetchRoles = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      const result = await getAllRoles(page, limit, startDateStr, endDateStr);
      
      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedRoles = result.data.map((role) => ({
          id: role._id,
          roleId: role.roleId,
          roleName: role.roleName,
          department: role.department || 'IT', // Default if not provided
          permissions: role.permissions,
          usersAssigned: 0, // Not provided by API
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        setRoles(transformedRoles);
        setTotalRoles(result.metadata?.total || 0);
      } else {
        console.error('Failed to fetch roles:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.message || 'Failed to fetch roles');
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // Load roles on component mount and when pagination changes
  useEffect(() => {
    setIsLoaded(true);
    fetchRoles(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage]);

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.roleName.toLowerCase().includes(searchQuery.toLowerCase()) || (role.department && role.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'All' || role.department === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(totalRoles / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoles = filteredRoles;
  const showingFrom = startIndex + 1;
  const showingTo = Math.min(startIndex + currentRoles.length, totalRoles);

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

  const handleEdit = (role) => {
    setEditingRole(role);
    setDrawerOpen(true);
    setShowActionsDropdown(null);
  };

  const handleDelete = (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== roleId));
      setShowActionsDropdown(null);
    }
  };

  const handleViewPermissions = (role) => {
    setShowPermissionsModal(role);
    setShowActionsDropdown(null);
  };

  const toggleActionsDropdown = (roleId) => {
    setShowActionsDropdown(showActionsDropdown === roleId ? null : roleId);
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setEditingRole(null), 300);
  };

  const PermissionBadge = ({ granted }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${granted ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
      {granted ? 'Yes' : 'No'}
    </span>
  );

  // Get initial form values
  const getInitialValues = (existingRole) => {
    if (existingRole && existingRole.permissions) {
      return {
        roleName: existingRole.roleName || '',
        department: existingRole.department || '',
        features: {
          userPermissions: {
            enabled: true,
            canView: existingRole.permissions.userPermissions?.canView || false,
            canAdd: existingRole.permissions.userPermissions?.canAdd || false,
            canEdit: existingRole.permissions.userPermissions?.canEdit || false,
            canDelete: existingRole.permissions.userPermissions?.canDelete || false,
          },
          leadPermissions: {
            enabled: true,
            canView: existingRole.permissions.leadPermissions?.canView || false,
            canAdd: existingRole.permissions.leadPermissions?.canAdd || false,
            canEdit: existingRole.permissions.leadPermissions?.canEdit || false,
            canDelete: existingRole.permissions.leadPermissions?.canDelete || false,
          },
        },
      };
    }
    return {
      roleName: '',
      department: '',
      features: {
        userPermissions: {
          enabled: false,
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
        leadPermissions: {
          enabled: false,
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
      },
    };
  };

  // Formik for drawer form
  const formik = useFormik({
    initialValues: getInitialValues(editingRole),
    validationSchema: roleValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        console.log('Form submitted:', values);
        
        // Prepare role data for API
        const roleData = {
          roleName: values.roleName,
          department: values.department,
          permissions: {
            userPermissions: {
              canView: values.features.userPermissions?.canView || false,
              canAdd: values.features.userPermissions?.canAdd || false,
              canEdit: values.features.userPermissions?.canEdit || false,
              canDelete: values.features.userPermissions?.canDelete || false,
            },
            leadPermissions: {
              canView: values.features.leadPermissions?.canView || false,
              canAdd: values.features.leadPermissions?.canAdd || false,
              canEdit: values.features.leadPermissions?.canEdit || false,
              canDelete: values.features.leadPermissions?.canDelete || false,
            },
          },
        };

        const result = await createRole(roleData);

        if (result.success) {
          toast.success(result.message || 'Role created successfully!');
          resetForm();
          handleCloseDrawer();
          // Refresh the role list
          fetchRoles(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
          } else {
            toast.error(result.message || 'Failed to create role');
          }
        }
      } catch (error) {
        console.error('Error creating role:', error);
        toast.error('Failed to create role. Please try again');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Feature toggle handler
  const handleFeatureToggle = (featureId) => {
    const currentEnabled = formik.values.features[featureId]?.enabled || false;
    formik.setFieldValue(`features.${featureId}.enabled`, !currentEnabled);
    
    // If disabling, clear all permissions
    if (currentEnabled) {
      formik.setFieldValue(`features.${featureId}.canView`, false);
      formik.setFieldValue(`features.${featureId}.canAdd`, false);
      formik.setFieldValue(`features.${featureId}.canEdit`, false);
      formik.setFieldValue(`features.${featureId}.canDelete`, false);
    }
  };

  // Permission toggle handler
  const handlePermissionToggle = (featureId, permission) => {
    const currentValue = formik.values.features[featureId]?.[permission] || false;
    formik.setFieldValue(`features.${featureId}.${permission}`, !currentValue);
  };

  // Select all permissions for a feature
  const handleSelectAll = (featureId) => {
    formik.setFieldValue(`features.${featureId}.canView`, true);
    formik.setFieldValue(`features.${featureId}.canAdd`, true);
    formik.setFieldValue(`features.${featureId}.canEdit`, true);
    formik.setFieldValue(`features.${featureId}.canDelete`, true);
  };

  // Clear all permissions for a feature
  const handleClearAll = (featureId) => {
    formik.setFieldValue(`features.${featureId}.canView`, false);
    formik.setFieldValue(`features.${featureId}.canAdd`, false);
    formik.setFieldValue(`features.${featureId}.canEdit`, false);
    formik.setFieldValue(`features.${featureId}.canDelete`, false);
  };

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Role Management
              </h1>
              <p className="text-gray-400 mt-2">Create and manage user roles with custom permissions</p>
            </div>
            <div className="flex flex-col gap-3">
            <button
              onClick={handleAddRole}
              className="group relative w-fit inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 ml-auto"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Shield className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative z-10">Create New Role</span>
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
              placeholder="Search by role name or department..."
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
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Role ID</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Role Name</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">User Permissions</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead Permissions</th>
                  <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBA473]/10">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      Loading roles...
                    </td>
                  </tr>
                ) : currentRoles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  currentRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-[#3A3A3A] transition-all duration-300 group"
                    >
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                        #{role.roleId || role.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <Shield className="w-5 h-5 text-black" />
                          </div> */}
                          <span className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {role.roleName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#BBA473]/20 text-[#E8D5A3] border border-[#BBA473]/30">
                          {role.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <PermissionBadge granted={role.permissions?.userPermissions?.canView} />
                          <PermissionBadge granted={role.permissions?.userPermissions?.canAdd} />
                          <PermissionBadge granted={role.permissions?.userPermissions?.canEdit} />
                          <PermissionBadge granted={role.permissions?.userPermissions?.canDelete} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <PermissionBadge granted={role.permissions?.leadPermissions?.canView} />
                          <PermissionBadge granted={role.permissions?.leadPermissions?.canAdd} />
                          <PermissionBadge granted={role.permissions?.leadPermissions?.canEdit} />
                          <PermissionBadge granted={role.permissions?.leadPermissions?.canDelete} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(role)}
                            className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(role.id)}
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
                <span className="text-white font-semibold">{totalRoles}</span> entries
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
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingRole ? 'Update role information and permissions' : 'Define role details and assign permissions'}
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
            {/* Basic Information */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#BBA473]/30 pb-3">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Role Name */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="roleName"
                    placeholder="Enter role name (e.g., Sales Manager)"
                    value={formik.values.roleName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.roleName && formik.errors.roleName
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.roleName && formik.errors.roleName && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.roleName}</div>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
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
                  {formik.touched.department && formik.errors.department && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.department}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Features & Permissions */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#BBA473]/30 pb-3">
                <Shield className="w-5 h-5 text-[#BBA473]" />
                <h3 className="text-lg font-semibold text-white">Features & Permissions</h3>
              </div>

              <p className="text-sm text-gray-400">
                Enable features and set permissions (View, Add, Edit, Delete) for this role.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 gap-4 mt-4">
                {featuresList.map((feature) => (
                  <div
                    key={feature.id}
                    className={`border rounded-lg transition-all duration-300 ${
                      formik.values.features[feature.id]?.enabled
                        ? 'border-[#BBA473] bg-[#1A1A1A] shadow-lg shadow-[#BBA473]/20'
                        : 'border-[#BBA473]/30 bg-[#252525] hover:border-[#BBA473]/50'
                    }`}
                  >
                    <div className="p-4">
                      {/* Feature Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={formik.values.features[feature.id]?.enabled || false}
                          onChange={() => handleFeatureToggle(feature.id)}
                          className="mt-1 h-5 w-5 accent-[#BBA473] border-gray-600 rounded focus:ring-[#BBA473] cursor-pointer transition-transform duration-300 hover:scale-110"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{feature.icon}</span>
                            <h4 className="text-white font-semibold text-sm">{feature.name}</h4>
                            {formik.values.features[feature.id]?.enabled && (
                              <CheckCircle className="w-4 h-4 text-green-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{feature.description}</p>
                        </div>
                      </div>

                      {/* Permissions Section */}
                      {formik.values.features[feature.id]?.enabled && (
                        <div className="space-y-3 pt-3 border-t border-[#BBA473]/30 animate-fadeIn">
                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectAll(feature.id)}
                              className="flex-1 text-xs px-3 py-2 bg-[#BBA473] text-black rounded hover:bg-[#d4bc89] transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearAll(feature.id)}
                              className="flex-1 text-xs px-3 py-2 bg-[#3A3A3A] text-white rounded hover:bg-[#4A4A4A] transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                              Clear All
                            </button>
                          </div>

                          {/* Permissions Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            {permissionTypes.map((permission) => (
                              <label key={permission.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#2A2A2A] transition-all duration-300 group">
                                <input
                                  type="checkbox"
                                  checked={formik.values.features[feature.id]?.[permission.id] || false}
                                  onChange={() => handlePermissionToggle(feature.id, permission.id)}
                                  className="h-4 w-4 accent-[#BBA473] border-gray-600 rounded cursor-pointer transition-transform duration-300 group-hover:scale-110"
                                />
                                <span className="text-xs text-gray-300 font-medium">{permission.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              <div className="bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Permission Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Enabled Features:</span>
                    <span className="text-[#BBA473] font-bold text-xl">
                      {Object.values(formik.values.features).filter(f => f.enabled).length} / {featuresList.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formik.values.features)
                      .filter(([_, permissions]) => permissions.enabled)
                      .map(([featureId]) => {
                        const feature = featuresList.find(f => f.id === featureId);
                        return (
                          <span
                            key={featureId}
                            className="px-3 py-1 bg-[#BBA473]/20 text-[#BBA473] rounded-full text-xs font-medium flex items-center gap-1 animate-fadeIn"
                          >
                            <span>{feature?.icon}</span>
                            <span>{feature?.name}</span>
                          </span>
                        );
                      })}
                    {Object.values(formik.values.features).filter(f => f.enabled).length === 0 && (
                      <span className="text-gray-500 text-sm italic">No features enabled yet</span>
                    )}
                  </div>
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
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                {formik.isSubmitting 
                  ? (editingRole ? 'Updating Role...' : 'Creating Role...') 
                  : (editingRole ? 'Update Role' : 'Create Role')
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
      `}</style>
    </>
  );
};

export default RoleManagement;