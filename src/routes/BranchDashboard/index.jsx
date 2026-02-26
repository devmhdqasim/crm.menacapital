import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Users,
  CreditCard,
  ArrowDownToLine,
  Coins,
  Activity,
  Gift,
  TrendingUp,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getBranchDashboardStats } from '../../services/dashboardService';
import toast, { Toaster } from 'react-hot-toast';
import DateRangePicker from '../../components/DateRangePicker';
import { useCRM } from '../../context/CRMContext';

const Dashboard = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 3 Days');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedKioskMember, setSelectedKioskMember] = useState('all');
  const [permissions, setPermissions] = useState({
    userPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    leadPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    branchPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    activityPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
  });

  // Get CRM context
  const { setCrmCategorySummary } = useCRM();

  // Fetch dashboard data
  const fetchDashboardData = async (filter) => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';

    try {
      const result = await getBranchDashboardStats(startDateStr, endDateStr);

      if (result.success && result.data) {
        setDashboardData(result.data);
        setPermissions(result.data.permissions || permissions);

        // Save crmCategorySummary to context
        if (result.data.crmCategorySummary) {
          setCrmCategorySummary(result.data.crmCategorySummary);
          localStorage.setItem('leadsCount', JSON.stringify(result.data.crmCategorySummary))
        }

        console.log('✅ Dashboard data loaded:', result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when filter changes
  useEffect(() => {
    fetchDashboardData(selectedFilter);
  }, [startDate, endDate]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setFilterOpen(false);
  };

  // Get kiosk member options
  const kioskMemberOptions = dashboardData?.realCountByKiosk || [];

  // Get selected kiosk member's total leads
  const getKioskMemberLeads = () => {
    if (selectedKioskMember === 'all') {
      return kioskMemberOptions.reduce((sum, member) => sum + (member.totalLeads || 0), 0);
    }
    const member = kioskMemberOptions.find(m => m.kioskMemberId === selectedKioskMember);
    return member?.totalLeads || 0;
  };

  // Get selected kiosk member's name
  const getKioskMemberName = () => {
    if (selectedKioskMember === 'all') {
      return 'All Kiosk Members';
    }
    const member = kioskMemberOptions.find(m => m.kioskMemberId === selectedKioskMember);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  // Dynamic stats cards data
  const stats = dashboardData
    ? Object.entries(dashboardData)
      .filter(([key, value]) => typeof value === 'string' || typeof value === 'number')
      .map(([key, value]) => {
        // Format key into a readable title
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        // Optional: map icons/colors based on key
        const iconMap = {
          totalSalesManagers: ShoppingCart,
          totalAgents: Users,
          totalBranches: Coins,
          totalKioskMembers: TrendingUp,
          totalBranchLeads: Activity,
          leads: Activity,
        };
        const colorMap = {
          totalSalesManagers: 'rgb(255, 99, 132)',
          totalAgents: 'rgb(54, 162, 235)',
          totalBranches: 'rgb(156, 163, 175)',
          totalKioskMembers: 'rgb(255, 187, 40)',
          totalBranchLeads: 'rgb(75, 192, 192)',
          leads: 'rgb(75, 192, 192)',
        };
        const bgColorMap = {
          totalSalesManagers: 'rgba(255, 99, 132, 0.125)',
          totalAgents: 'rgba(54, 162, 235, 0.125)',
          totalBranches: 'rgba(156, 163, 175, 0.125)',
          totalKioskMembers: 'rgba(255, 187, 40, 0.125)',
          totalBranchLeads: 'rgba(75, 192, 192, 0.125)',
          leads: 'rgba(75, 192, 192, 0.125)',
        };

        return {
          label,
          value,
          icon: iconMap[key] || Users, // fallback icon
          color: colorMap[key] || 'rgb(255,255,255)',
          bgColor: bgColorMap[key] || 'rgba(255,255,255,0.1)',
        };
      })
    : [];

  // Pie chart data - Updated to match API response structure
  const pieData = dashboardData?.leadsCountPerStatus ? (() => {
    const statusData = dashboardData.leadsCountPerStatus;
    const data = [];

    // Map API status fields to pie chart data
    if (statusData.Lead > 0) {
      data.push({ name: 'Lead', value: statusData.Lead, color: '#FF6384' });
    }
    if (statusData.Demo > 0) {
      data.push({ name: 'Demo', value: statusData.Demo, color: '#36A2EB' });
    }
    if (statusData.Real > 0) {
      data.push({ name: 'Real', value: statusData.Real, color: '#FFCE56' });
    }

    return data;
  })() : [];

  // Bar chart data - Updated to match API response structure with month names
  const barData = dashboardData?.leadsCountPerMonth?.length > 0
    ? dashboardData.leadsCountPerMonth.map((item) => {
      // Convert month number to month name
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[item.month - 1] || `Month ${item.month}`;

      // Color mapping based on month
      const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#C9CBCF', '#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF'];

      return {
        name: monthName,
        value: item.totalLeads || 0,
        color: colors[(item.month - 1) % 12],
      };
    })
    : [
      { name: 'Jan', value: 0, color: '#FF6384' },
      { name: 'Feb', value: 0, color: '#36A2EB' },
      { name: 'Mar', value: 0, color: '#FFCE56' },
      { name: 'Apr', value: 0, color: '#4BC0C0' },
      { name: 'May', value: 0, color: '#9966FF' },
      { name: 'Jun', value: 0, color: '#FF9F40' },
      { name: 'Jul', value: 0, color: '#C9CBCF' },
      { name: 'Aug', value: 0, color: '#36A2EB' },
      { name: 'Sep', value: 0, color: '#FF6384' },
      { name: 'Oct', value: 0, color: '#4BC0C0' },
      { name: 'Nov', value: 0, color: '#FFCE56' },
      { name: 'Dec', value: 0, color: '#9966FF' }
    ];

  // Custom label for pie chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={pieData.find((item) => item.name === name)?.color}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalLeads = dashboardData?.leadsCountPerStatus?.total || 0;

  // Enhanced Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-[#BBA473]/30 rounded-lg p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-32 mb-3"></div>
                <div className="h-8 bg-gray-600 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border border-[#BBA473]/30 rounded-lg p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]"
          >
            <div className="h-6 bg-gray-700 rounded w-48 mx-auto mb-6"></div>
            <div className="h-[400px] bg-gray-900/30 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border-2 border-[#BBA473] rounded-lg p-4 shadow-2xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{label}</p>
          <p className="text-[#BBA473] font-bold text-lg">
            {payload[0].value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white p-6">
        <main>
          {/* Header with Gradient Background */}
          <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-8 bg-gradient-to-r from-[#BBA473]/10 to-transparent border border-[#BBA473]/30 rounded-2xl p-6 backdrop-blur-sm z-10">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#BBA473] to-yellow-200 mb-3 animate-fade-in">
                Welcome to the SIG Sales CRM
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Monitor your monthly performance, revenue growth, and conversion progress in real-time.
              </p>
            </div>

            {/* Filters Container */}
            <div className="mt-4 md:mt-0 md:ml-6 flex flex-col gap-3 relative z-50">
              {/* Date Range Filter */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                maxDate={new Date()}
                isClearable={true}
              />

              {/* Kiosk Member Filter */}
              {kioskMemberOptions.length > 0 && (
                <div className='flex items-center gap-3'>
                  <label htmlFor="" className='text-[#E8D5A3] font-medium text-sm whitespace-nowrap'>
                    Filter by Agent:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedKioskMember}
                      onChange={(e) => setSelectedKioskMember(e.target.value)}
                      className="w-full md:w-64 px-4 py-2.5 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#BBA473]/40 rounded-lg text-white text-sm font-medium appearance-none cursor-pointer hover:border-[#BBA473] focus:border-[#BBA473] focus:outline-none focus:ring-2 focus:ring-[#BBA473]/20 transition-all pl-10 duration-300 shadow-lg"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23BBA473' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="all" className="bg-[#1A1A1A] text-white">
                        All Kiosk Members
                      </option>
                      {kioskMemberOptions.map((member) => (
                        <option
                          key={member.kioskMemberId}
                          value={member.kioskMemberId}
                          className="bg-[#1A1A1A] text-white"
                        >
                          {member.firstName} {member.lastName} ({member.totalLeads} leads)
                        </option>
                      ))}
                    </select>
                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BBA473] pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State with Enhanced Animation */}
          {loading && (
            <div className="text-center py-16">
              <div className="relative inline-block">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-[#BBA473]/20 animate-pulse"></div>
                {/* Main spinner */}
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#BBA473]"></div>
                {/* Inner spinning dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#BBA473] rounded-full animate-ping"></div>
              </div>
              <p className="text-gray-300 mt-6 text-lg font-medium animate-pulse">
                Loading dashboard data...
              </p>
              <p className="text-gray-500 mt-2 text-sm">Please wait while we fetch your analytics</p>
            </div>
          )}

          {/* Skeleton Loader */}
          {loading && <SkeletonLoader />}

          {/* Stats Grid with Enhanced Cards */}
          {!loading && dashboardData && (
            <div className="animate-fade-in">
              {/* Kiosk Member Total Leads Cards */}
              {kioskMemberOptions.length > 0 && (
                <div className="mb-6">
                  {selectedKioskMember === 'all' ? (
                    // Show all cards when "all" is selected
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {kioskMemberOptions.map((member, index) => (
                        <div
                          key={member.kioskMemberId}
                          className="group relative w-full border border-[#BBA473]/40 rounded-lg p-4 shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#BBA473] hover:scale-105 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] overflow-hidden"
                          style={{ animation: `slideInUp 0.5s ease-out ${index * 0.1}s both` }}
                        >
                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#BBA473]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                          {/* Animated Corner Accent */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#BBA473]/20 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

                          <div className="relative">
                            {/* Header with Icon */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-gray-400 text-xs font-bold mb-1 group-hover:text-gray-300 transition-colors duration-300 truncate">
                                  {member.firstName} {member.lastName}
                                </p>
                              </div>
                              <div
                                className="p-2 rounded-full transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg"
                                style={{ backgroundColor: 'rgba(75, 192, 192, 0.125)' }}
                              >
                                <UserCircle
                                  style={{ color: 'rgb(75, 192, 192)' }}
                                  className="w-5 h-5 group-hover:animate-pulse"
                                />
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="space-y-2">
                              {/* Leads */}
                              <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-xs font-medium">Leads</p>
                                <p className="text-lg font-bold text-white group-hover:text-[#BBA473] transition-colors duration-300">
                                  {member.leadCount || 0}
                                </p>
                              </div>

                              {/* Demo */}
                              <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-xs font-medium">Demo</p>
                                <p className="text-lg font-bold text-white group-hover:text-[#36A2EB] transition-colors duration-300">
                                  {member.demoCount || 0}
                                </p>
                              </div>

                              {/* Real Deposit */}
                              <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-xs font-medium">Real (Deposit)</p>
                                <p className="text-lg font-bold text-white group-hover:text-[#4BC0C0] transition-colors duration-300">
                                  {member.realDepositCount || 0}
                                </p>
                              </div>

                              {/* Real Not Deposit */}
                              <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-xs font-medium">Real (No Deposit)</p>
                                <p className="text-lg font-bold text-white group-hover:text-[#FF6384] transition-colors duration-300">
                                  {member.realNotDepositCount || 0}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Accent Line */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#BBA473] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Show single card when specific agent is selected
                    (() => {
                      const member = kioskMemberOptions.find(m => m.kioskMemberId === selectedKioskMember);
                      return member ? (
                        <div className="max-w-full mx-auto">
                          <div
                            className="group relative w-full border border-[#BBA473]/40 rounded-lg p-4 shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#BBA473] hover:scale-101 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] overflow-hidden"
                            style={{ animation: 'slideInUp 0.5s ease-out' }}
                          >
                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#BBA473]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Animated Corner Accent */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#BBA473]/20 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

                            <div className="relative">
                              {/* Header with Icon */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-gray-400 text-xs font-bold mb-1 group-hover:text-gray-300 transition-colors duration-300">
                                    {member.firstName} {member.lastName}
                                  </p>
                                </div>
                                <div
                                  className="p-2 rounded-full transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg"
                                  style={{ backgroundColor: 'rgba(75, 192, 192, 0.125)' }}
                                >
                                  <UserCircle
                                    style={{ color: 'rgb(75, 192, 192)' }}
                                    className="w-5 h-5 group-hover:animate-pulse"
                                  />
                                </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="space-y-2">
                                {/* Leads */}
                                <div className="flex items-center justify-between">
                                  <p className="text-gray-400 text-xs font-medium">Leads</p>
                                  <p className="text-lg font-bold text-white group-hover:text-[#BBA473] transition-colors duration-300">
                                    {member.leadCount || 0}
                                  </p>
                                </div>

                                {/* Demo */}
                                <div className="flex items-center justify-between">
                                  <p className="text-gray-400 text-xs font-medium">Demo</p>
                                  <p className="text-lg font-bold text-white group-hover:text-[#36A2EB] transition-colors duration-300">
                                    {member.demoCount || 0}
                                  </p>
                                </div>

                                {/* Real Deposit */}
                                <div className="flex items-center justify-between">
                                  <p className="text-gray-400 text-xs font-medium">Real (Deposit)</p>
                                  <p className="text-lg font-bold text-white group-hover:text-[#4BC0C0] transition-colors duration-300">
                                    {member.realDepositCount || 0}
                                  </p>
                                </div>

                                {/* Real Not Deposit */}
                                <div className="flex items-center justify-between">
                                  <p className="text-gray-400 text-xs font-medium">Real (No Deposit)</p>
                                  <p className="text-lg font-bold text-white group-hover:text-[#FF6384] transition-colors duration-300">
                                    {member.realNotDepositCount || 0}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Accent Line */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#BBA473] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
              )}

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 ${stats.length === 1 ? 'sm:justify-items-center' : ''
                  }`}
              >
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="group relative w-full border border-[#BBA473]/40 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:border-[#BBA473] hover:scale-101 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] overflow-hidden"
                      style={{
                        animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#BBA473]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Animated Corner Accent */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#BBA473]/20 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform pl-10 duration-500"></div>

                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-gray-400 text-sm font-medium mb-2 group-hover:text-gray-300 transition-colors duration-300">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold text-white mt-1 group-hover:text-[#BBA473] transition-colors duration-300">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className="p-4 rounded-full transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg"
                          style={{ backgroundColor: stat.bgColor }}
                        >
                          <Icon
                            style={{ color: stat.color }}
                            className="w-8 h-8 group-hover:animate-pulse"
                          />
                        </div>
                      </div>

                      {/* Bottom Accent Line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#BBA473] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Grid with Enhanced Design */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Pie Chart with Enhanced Styling */}
                <div
                  className="border border-[#BBA473]/40 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] hover:border-[#BBA473]"
                  style={{ animation: 'slideInLeft 0.6s ease-out' }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-1 w-12 bg-gradient-to-r from-transparent to-[#BBA473] mr-3"></div>
                    <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      Leads Overview
                    </h3>
                    <div className="h-1 w-12 bg-gradient-to-l from-transparent to-[#BBA473] ml-3"></div>
                  </div>

                  {pieData.length > 0 ? (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={3}
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#BBA473]/30">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-300">
                            Total Leads
                          </h3>
                          <span className="text-3xl font-bold text-[#BBA473] animate-pulse">
                            {totalLeads}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                      <Activity className="w-16 h-16 text-gray-600 animate-pulse" />
                      <p className="text-gray-400 text-lg">No leads data available</p>
                      <p className="text-gray-500 text-sm">Data will appear once leads are created</p>
                    </div>
                  )}
                </div>

                {/* Bar Chart with Enhanced Styling */}
                <div
                  className="border border-[#BBA473]/40 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] hover:border-[#BBA473]"
                  style={{ animation: 'slideInRight 0.6s ease-out' }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-1 w-12 bg-gradient-to-r from-transparent to-[#BBA473] mr-3"></div>
                    <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      Monthly Summary
                    </h3>
                    <div className="h-1 w-12 bg-gradient-to-l from-transparent to-[#BBA473] ml-3"></div>
                  </div>

                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={barData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#BBA473" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#BBA473" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* No Data State with Enhanced Design */}
          {!loading && !dashboardData && (
            <div className="text-center py-20 animate-fade-in">
              <div className="inline-block p-8 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-2xl border border-[#BBA473]/30 shadow-2xl">
                <Activity className="w-20 h-20 text-gray-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-400 text-xl font-semibold mb-2">No dashboard data available</p>
                <p className="text-gray-500 text-sm">Please check back later or adjust your filters</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        /* Remove white border on chart clicks */
        .recharts-surface:focus,
        .recharts-wrapper:focus,
        .recharts-sector:focus,
        .recharts-bar-rectangle:focus {
          outline: none !important;
        }

        /* Remove all focus outlines from chart elements */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        svg:focus {
          outline: none !important;
        }

        /* Custom select dropdown styling */
        select option {
          padding: 10px;
        }

        select option:hover {
          background-color: #BBA473 !important;
        }
      `}</style>
    </>
  );
};

export default Dashboard;