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
} from 'recharts';
import { getDashboardStatsByFilter } from '../../services/dashboardService';
import toast, { Toaster } from 'react-hot-toast';
import DateRangePicker from '../../components/DateRangePicker';

const Dashboard = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Last 3 Days');
  const [loading, setLoading] = useState(false);
  const [hasLeadsPermission, setHasLeadsPermission] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [permissions, setPermissions] = useState({
    userPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    leadPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    branchPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
    activityPermissions: { canAdd: false, canEdit: false, canDelete: false, canView: false },
  });

  // Fetch dashboard data
  const fetchDashboardData = async (filter) => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    
    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr);
      
      if (result.success && result.data) {
        setDashboardData(result.data);
        setPermissions(result.data.permissions || permissions);
        console.log('✅ Dashboard data loaded:', result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.message || 'Failed to fetch dashboard data');
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
        };
        const colorMap = {
          totalSalesManagers: 'rgb(255, 99, 132)',
          totalAgents: 'rgb(54, 162, 235)',
          totalBranches: 'rgb(156, 163, 175)',
          totalKioskMembers: 'rgb(255, 187, 40)',
          totalBranchLeads: 'rgb(75, 192, 192)',
        };
        const bgColorMap = {
          totalSalesManagers: 'rgba(255, 99, 132, 0.125)',
          totalAgents: 'rgba(54, 162, 235, 0.125)',
          totalBranches: 'rgba(156, 163, 175, 0.125)',
          totalKioskMembers: 'rgba(255, 187, 40, 0.125)',
          totalBranchLeads: 'rgba(75, 192, 192, 0.125)',
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

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    

    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
  
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2025-11-17';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setHasLeadsPermission(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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
        className="text-xs"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalLeads = dashboardData?.leadsCountPerStatus?.total || 0;

  return (
    <>
      <div className="min-h-screen bg-black text-white p-6">
        <main>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome to the Save In Gold Sales CRM
              </h2>
              <p className="text-gray-400">
                Monitor your monthly performance, revenue growth, and conversion progress in real-time.
              </p>
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
            {/* <div className="mt-4 md:mt-0 flex items-center flex-wrap">
              <span className="mr-4 text-gray-300">Filter by:</span>
              <div className="relative inline-block w-45">
                <button
                  type="button"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="cursor-pointer w-full flex items-center justify-between h-10 px-3 bg-[#1A1A1A] border border-[#BBA473] focus:outline-none transition-colors duration-200 rounded"
                >
                  <span className="text-sm">{selectedFilter}</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-2 text-white transition-transform duration-200 ${
                      filterOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {filterOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1A1A1A] border border-[#BBA473] rounded shadow-lg">
                    {['Last 3 Days', 'Last Week', 'Last Month', 'Last Year'].map(
                      (option) => (
                        <div
                          key={option}
                          onClick={() => handleFilterChange(option)}
                          className="px-3 py-2 hover:bg-[#2A2A2A] cursor-pointer text-sm"
                        >
                          {option}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div> */}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#BBA473]"></div>
              <p className="text-gray-400 mt-4">Loading dashboard data...</p>
            </div>
          )}

          {/* Stats Grid */}
          {!loading && dashboardData && (
            <>
              <div 
                className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 ${
                  stats.length === 1 ? 'sm:justify-items-center' : ''
                }`}
              >
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="w-full border border-[#BBA473] rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-yellow-400"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {stat.value}
                          </p>
                        </div>
                        <div
                          className="p-3 rounded-full"
                          style={{ backgroundColor: stat.bgColor }}
                        >
                          <Icon style={{ color: stat.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Pie Chart */}
                <div className="border border-[#BBA473] rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 text-center text-white">
                    Leads Overview
                  </h3>
                  {totalLeads > 0 && pieData.length > 0 && !hasLeadsPermission ? (
                    <>
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
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1A1A1A',
                              border: '1px solid #BBA473',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <h3 className="text-xl font-semibold mb-4 text-left text-white">
                        <span className="font-normal">Total Leads:</span> {!hasLeadsPermission && totalLeads}
                      </h3>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[400px]">
                      <p className="text-gray-400 text-lg">No leads data available</p>
                    </div>
                  )}
                </div>

                {/* Bar Chart */}
                <div className="border border-[#BBA473] rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 text-center text-white">
                    Monthly Summary
                  </h3>
                  <ResponsiveContainer width="100%" height={450}>
                    {!hasLeadsPermission && (
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={12}
                          stroke="#9CA3AF"
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #BBA473',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* No Data State */}
          {!loading && !dashboardData && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No dashboard data available</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;