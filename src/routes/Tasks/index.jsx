import React, { useState, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Search, ChevronDown, Edit, Trash2, Filter, Plus, X, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getAllTasks, deleteTask, createTask, updateTask } from '../../services/taskService';
import { getAllUsers } from '../../services/teamService';
import { getAllLeads, searchLeadById } from '../../services/leadService';
import DateRangePicker from '../../components/DateRangePicker';
import { getDashboardStatsByFilter } from '../../services/dashboardService';
import TaskDetailsModal from './TaskDetailsModal';
import InboxChatDrawer from '../Inbox/InboxChatDrawer';

// Validation Schema for Task Form
const taskValidationSchema = Yup.object({
  agentId: Yup.string(),
  leadId: Yup.string().required('Lead is required'),
  taskTitle: Yup.string()
    .required('Task title is required')
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title must not exceed 200 characters'),
  taskDescription: Yup.string()
    .required('Task description is required')
    .min(10, 'Task description must be at least 10 characters')
    .max(1000, 'Task description must not exceed 1000 characters'),
  taskPriority: Yup.string()
    .required('Priority is required')
    .oneOf(['High', 'Normal', 'Low'], 'Invalid priority'),
  taskScheduledDate: Yup.date()
    .required('Scheduled date and time is required')
    .min(new Date(), 'Scheduled date and time cannot be in the past'),
  taskStatus: Yup.string()
    .required('Status is required')
    .oneOf(['Open', 'In Progress', 'Completed', 'Pending'], 'Invalid status'),
  leadRemarks: Yup.string().max(500, 'Remarks must not exceed 500 characters'),
  leadResponseStatus: Yup.string(),
});

const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isLoaded, setIsLoaded] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [crmAgentTaskSummary, setCrmAgentTaskSummary] = useState([]);
  const [crmManagerTaskSummary, setCrmManagerTaskSummary] = useState({});
  const [taskSummary, setTaskSummary] = useState({});

  // Lead search states
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [debouncedLeadSearchQuery, setDebouncedLeadSearchQuery] = useState('');
  const [leadSearchResults, setLeadSearchResults] = useState([]);
  const [leadSearchLoading, setLeadSearchLoading] = useState(false);
  const [showLeadSearchResults, setShowLeadSearchResults] = useState(false);
  const [leadSearchPage, setLeadSearchPage] = useState(1);
  const [leadSearchTotalResults, setLeadSearchTotalResults] = useState(0);
  const [leadSearchHasMore, setLeadSearchHasMore] = useState(false);
  const [leadSearchPriority, setLeadSearchPriority] = useState('All');
  const [selectedLeadId, setSelectedLeadId] = useState(''); // Selected lead ID for filtering tasks

  const [loading, setLoading] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Filter states - filters open by default
  const [showFilters, setShowFilters] = useState(true);
  const [clearFilter, setClearFilter] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedToFilter, setAssignedToFilter] = useState('All');

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Chat drawer states
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatContact, setChatContact] = useState(null);

  // Dropdown data
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [salesManagers, setSalesManagers] = useState([]);

  // TODO: Replace this with your actual role detection logic
  // Example: const userRole = localStorage.getItem('userRole') || 'Sales Manager';
  // Example: const userRole = useSelector(state => state.auth.role);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Sales Manager'); // Change this based on your auth implementation

  const tabs = ['All', 'Today Pending', 'Future Pending', 'Completed', 'Not-Completed'];
  const priorities = ['All', 'High', 'Normal', 'Low'];
  const statusOptions = ['Open', 'Pending', 'Completed'];
  const priorityOptions = ['High', 'Normal', 'Low'];
  const responseStatusOptions = ['', 'Not Answered', 'Warm', 'Demo', 'Deposit', 'Not Deposit'];

  // Formik setup
  const formik = useFormik({
    initialValues: {
      agentId: '',
      leadId: '',
      salesManagerId: '',
      taskTitle: '',
      taskDescription: '',
      taskPriority: 'Normal',
      taskScheduledDate: '',
      taskStatus: 'Open',
      leadRemarks: '',
      leadResponseStatus: '',
    },
    validationSchema: taskValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Convert the datetime-local value to ISO string with timezone
        const scheduledDate = values.taskScheduledDate 
          ? new Date(values.taskScheduledDate).toISOString() 
          : '';

        const taskData = {
          agentId: values.agentId,
          leadId: values.leadId,
          salesManagerId: values.salesManagerId || undefined,
          taskTitle: values.taskTitle,
          taskDescription: values.taskDescription,
          taskPriority: values.taskPriority,
          taskScheduledDate: scheduledDate, // Now includes full datetime with timezone
          taskStatus: values.taskStatus,
          leadRemarks: values.leadRemarks || '',
          leadResponseStatus: values.leadResponseStatus || '',
        };

        let result;
        if (editingTask) {
          // Update existing task
          result = await updateTask(editingTask.id, taskData);
        } else {
          // Create new task
          result = await createTask(taskData);
        }

        if (result.success) {
          toast.success(result.message || (editingTask ? 'Task updated successfully!' : 'Task created successfully!'));
          resetForm();
          setDrawerOpen(false);
          setEditingTask(null);
          // Refresh the task list
          fetchTasks(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again.');
          } else {
            toast.error(result.error.payload.message || 'Failed to save task');
          }
        }
      } catch (error) {
        console.error('Error saving task:', error);
        toast.error('Failed to save task. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Debouncing effect for lead search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLeadSearchQuery(leadSearchQuery);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [leadSearchQuery]);

  // Lead search effect
  useEffect(() => {
    if (debouncedLeadSearchQuery.trim()) {
      setLeadSearchPage(1);
      searchLeads(1, true);
    } else {
      setLeadSearchResults([]);
      setShowLeadSearchResults(false);
      setLeadSearchTotalResults(0);
    }
  }, [debouncedLeadSearchQuery, leadSearchPriority]);

  // Search leads by ID
  const searchLeads = async (page = 1, reset = false) => {
    if (!debouncedLeadSearchQuery.trim()) return;

    setLeadSearchLoading(true);
    try {
      const result = await searchLeadById(debouncedLeadSearchQuery, page, 10);
      
      if (result.success && result.data) {
        const filteredResults = leadSearchPriority === 'All' 
          ? result.data 
          : result.data.filter(lead => lead.leadPriority === leadSearchPriority);
        
        if (reset) {
          setLeadSearchResults(filteredResults);
        } else {
          setLeadSearchResults(prev => [...prev, ...filteredResults]);
        }
        
        setLeadSearchTotalResults(result.metadata?.total || filteredResults.length);
        setLeadSearchHasMore(result.data.length === 10);
        setShowLeadSearchResults(true);
      } else {
        if (reset) {
          setLeadSearchResults([]);
          setLeadSearchTotalResults(0);
        }
        setLeadSearchHasMore(false);
      }
    } catch (error) {
      console.error('Error searching leads:', error);
      toast.error('Failed to search leads');
    } finally {
      setLeadSearchLoading(false);
    }
  };

  // Load more leads
  const loadMoreLeads = () => {
    if (leadSearchHasMore && !leadSearchLoading) {
      const nextPage = leadSearchPage + 1;
      setLeadSearchPage(nextPage);
      searchLeads(nextPage, false);
    }
  };

  // Clear lead search
  const clearLeadSearch = () => { 
    setLeadSearchQuery('');
    setDebouncedLeadSearchQuery('');
    setLeadSearchResults([]);
    setShowLeadSearchResults(false);
    setLeadSearchPage(1);
    setLeadSearchTotalResults(0);
    setLeadSearchPriority('All'); 
    setSelectedLeadId(''); // Clear selected lead ID 
  };

  const handleOpenChat = (task) => {
    if (task.leadPhone) {
      setChatContact({
        id: task.leadIdRaw || `task_${task.leadPhone}`,
        name: task.leadName || task.leadPhone,
        phone: task.leadPhone,
        email: '',
        agent: '',
        nationality: '',
        status: '',
        kioskLeadStatus: '',
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false,
        avatar: null,
      });
      setChatDrawerOpen(true);
    } else {
      toast.error('No phone number available for this lead');
    }
  };

  // Handle lead click - filter tasks by lead ID
  const handleLeadClick = (lead) => {
    setSelectedLeadId(lead._id);
    toast.success(`Filtering tasks for lead: ${lead.leadName} (${lead.leadId || 'No ID'})`);
    
    // Scroll to table
    setTimeout(() => {
      const tableElement = document.getElementById('tasks-table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Helper function to get status parameter based on active tab
  const getStatusParam = () => {
    const tabStatusMap = {
      'All': '',
      'Pending': 'Pending',
      'Completed': 'Completed',
      'Today Pending': 'Today',
      'Future Pending': 'Future',
      'Not-Completed': 'Not-Completed'
    };
    
    return tabStatusMap[activeTab] || '';
  };

  // Helper function to get priority parameter
  const getPriorityParam = () => {
    if (priorityFilter === 'All') {
      return '';
    }
    return priorityFilter; // 'High', 'Normal', or 'Low'
  };

  // Helper function to get assignedTo/assignedBy parameter
  const getAssignedToParam = () => {
    if (assignedToFilter === 'All') {
      return '';
    }

    // For Sales Manager: find the selected agent or sales manager ID
    if (userRole === 'Sales Manager') {
      // First check if it's an agent
      const selectedAgent = agents.find(agent =>
        `${agent.firstName} ${agent.lastName}` === assignedToFilter
      );
      
      if (selectedAgent) {
        return selectedAgent.id;
      }
      
      // If not found in agents, check sales managers
      const selectedManager = salesManagers.find(manager =>
        manager.name === assignedToFilter
      );
      
      return selectedManager ? selectedManager.id : '';
    }

    // For Agent: find sales manager ID
    if (userRole === 'Agent') {
      const selectedManager = salesManagers.find(manager =>
        manager.name === assignedToFilter
      );
      return selectedManager ? selectedManager.id : '';
    }

    return '';
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';

    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr, debouncedSearchQuery);

      if (result.success && result.data) {

        // Store the entire array of agent task summaries for Sales Manager
        if (result.data.crmAgentTaskSummary) {
          setCrmAgentTaskSummary(result.data.crmAgentTaskSummary)
        }

        // For Agent role: Extract the first element from agentTaskCounters array
        if (result.data.agentTaskCounters && result.data.agentTaskCounters.length > 0) {
          setCrmAgentTaskSummary(result.data.agentTaskCounters[0])
        }

        if (result.data.salesManagerTaskCounters) {
          setCrmManagerTaskSummary(result.data.salesManagerTaskCounters)
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

  // Fetch tasks from API
  const fetchTasks = async (page = 1, limit = 30) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      const statusParam = getStatusParam();
      const priorityParam = getPriorityParam();
      const assignedToParam = getAssignedToParam();

      const result = await getAllTasks(
        page,
        limit,
        startDateStr,
        endDateStr,
        debouncedSearchQuery,
        statusParam,
        assignedToParam,
        priorityParam,
        selectedLeadId // Pass selected lead ID
      );

      console.log('📦 Result from API:', result);

      if (result.success && result.data) {
        console.log('✅ Success! Data:', result.data);

        // Transform API data to match component structure
        const transformedTasks = result.data.map((task) => {
          console.log('🔄 Transforming task:', task);

          return {
            id: task._id,
            taskId: task.taskId,
            title: task.taskTitle || 'Untitled Task',
            description: task.taskDescription || 'No description provided',
            status: task.taskStatus || 'Open',
            priority: task.taskPriority || 'Normal',
            assignedTo: task.agentId?.length > 0
              ? `${task.agentId[0].firstName} ${task.agentId[0].lastName}`
              : 'Unassigned',
            assignedBy: task.assignedBy?.length > 0
            ? `${task.assignedBy[0].firstName} ${task.assignedBy[0].lastName}`
            : 'Protocol',
            assignedToUsername: task.agentId?.length > 0 ? task.agentId[0].username : '',
            salesManager: task.salesManagerId?.length > 0
              ? `${task.salesManagerId[0].firstName} ${task.salesManagerId[0].lastName}`
              : '',
            leadName: task.leadId?.length > 0 ? task.leadId[0].leadName : 'No Lead',
            leadId: task.leadId?.length > 0 ? task.leadId[0].leadId : '',
            leadStatus: task?.leadId[0]?.leadStatus ? task.leadId[0]?.leadStatus : '-',
            taskCreationStatus: task?.taskCreationStatus ? task.taskCreationStatus : '-',
            kioskLeadStatus: task?.leadId?.length && task?.leadId?.[0]?.kioskLeadStatus ? task?.leadId?.[0]?.kioskLeadStatus : '-', // ⭐ ADD THIS LINE
            kioskDepositStatus: task?.leadId?.length && task?.leadId?.[0]?.depositStatus ? task?.leadId?.[0]?.depositStatus : '-', // ⭐ ADD THIS LINE
            leadDescription: task?.leadId?.length && task?.leadId?.[0]?.leadDescription ? task?.leadId?.[0]?.leadDescription : '-', // ⭐ ADD THIS LINE
            leadPhone: task.leadId?.length > 0 ? task.leadId[0].leadPhoneNumber : '',
            dueDate: task.taskDueDate || new Date().toISOString(),
            createdAt: task.createdAt,
            isDeleted: task.isDeleted,
            // Store IDs for editing
            agentIdRaw: task.agentId?.length > 0 ? task.agentId[0]._id : '',
            leadIdRaw: task.leadId?.length > 0 ? task.leadId[0]._id : '',
            salesManagerIdRaw: task.salesManagerId?.length > 0 ? task.salesManagerId[0]._id : '',
            leadRemarks: task.leadRemarks || '',
            leadResponseStatus: task.leadResponseStatus || '',
            taskScheduledDate: task.taskScheduledDate || '',
            answerStatus: task.answerStatus || '', // NEW: Map answerStatus from API

          };
        });

        console.log('✅ Transformed tasks:', transformedTasks);
        setTasks(!clearFilter && transformedTasks);
        setTotalTasks(result.metadata?.total || transformedTasks.length);
        
        // ✅ Extract counter data from summary field
        if (result.summary && result.summary.length > 0) {
          const summaryData = result.summary[0];
          console.log('📊 Counter data from summary:', summaryData);
          setTaskSummary(summaryData);

          if (userRole === 'Agent') {
            setCrmAgentTaskSummary(summaryData);
          } else if (userRole === 'Sales Manager') {
            setCrmManagerTaskSummary(summaryData);
          }
        } else {
          setTaskSummary({});
        }
      } else {
        console.error('❌ Failed to fetch tasks:', result.message);
        toast.error(result.error.payload.message || 'Failed to fetch tasks');
        setTasks([]);
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      toast.error('Failed to fetch tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents, leads, and sales managers for dropdowns
  const fetchDropdownData = async () => {
    try {
      console.log('🔵 Fetching dropdown data...');

      // Fetch agents
      const agentsResult = await getAllUsers(1, 1000);
      if (agentsResult.success && agentsResult.data) {
        const agentData = agentsResult.data
          .filter(user => user.roleName === 'Agent' || user.role === 'Agent')
          .map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
          }));
        setAgents(agentData);
        console.log('✅ Fetched agents:', agentData.length);

        // Also extract sales managers
        const smData = agentsResult.data
          .filter(user => user.roleName === 'Sales Manager' || user.role === 'Sales Manager')
          .map(user => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
          }));
        setSalesManagers(smData);
        console.log('✅ Fetched sales managers:', smData.length);
      }

      // Fetch leads
      const leadsResult = await getAllLeads(1, 1000, '', '');
      if (leadsResult.success && leadsResult.data) {
        const leadData = leadsResult.data.map(lead => ({
          id: lead._id,
          name: lead.leadName,
          leadId: lead.leadId,
          phone: lead.leadPhoneNumber,
          status: lead.leadStatus,
        }));
        setLeads(!clearFilter && leadData);
        console.log('✅ Fetched leads:', leadData.length);
      }
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      toast.error('Failed to load form data. Please refresh the page.');
    }
  };

  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  };

  useEffect(() => {
    const userInfo = getUserInfo();
    setUserRole(userInfo?.roleName);
    setUserName(userInfo?.username);
  }, []);

  // Load tasks on component mount and when pagination changes
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab, priorityFilter, assignedToFilter, selectedLeadId]);

  // Fetch tasks when page, filters, or dates change
  useEffect(() => {
    fetchTasks(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, activeTab, priorityFilter, assignedToFilter, selectedLeadId]);

  // Get unique assignees for filter dropdown - For Sales Manager, include both agents and sales managers
  const uniqueAssignees = userRole === 'Sales Manager' 
    ? ['All', ...agents.map(agent => `${agent.firstName} ${agent.lastName}`), ...salesManagers.map(sm => sm.name)]
    : ['All', ...agents.map(agent => `${agent.firstName} ${agent.lastName}`)];

  // Get unique sales managers for filter dropdown
  const uniqueSalesManagers = ['All', ...salesManagers.map(sm => sm.name)];

  // No frontend filtering needed - all handled by API
  const filteredTasks = tasks;

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      'Open': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Pending': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return styles[status] || styles.Open;
  };

  // Get priority badge styling
  const getPriorityBadge = (priority) => {
    const styles = {
      'High': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Normal': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Medium': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Low': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return styles[priority] || styles.Normal;
  };

  const handleEdit = (task) => {
    setEditingTask(task);

    // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatDateTimeLocal = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    };

    // Populate form with task data
    formik.setValues({
      agentId: task.agentIdRaw || '',
      leadId: task.leadIdRaw || '',
      salesManagerId: task.salesManagerIdRaw || '',
      taskTitle: task.title || '',
      taskDescription: task.description || '',
      taskPriority: task.priority || 'Normal',
      taskScheduledDate: formatDateTimeLocal(task.taskScheduledDate),
      taskStatus: task.status || 'Open',
      leadRemarks: task.leadRemarks || '',
      leadResponseStatus: task.leadResponseStatus || '',
    });

    !clearFilter && setDrawerOpen(true);
  };

  const handleDelete = (task) => {
    // Check if task status is not Completed or Not-Completed
    if (task.status !== 'Completed' && task.status !== 'Not Completed') {
      toast.error('Pending tasks cannot be deleted. Please complete or mark the task as not-completed first.');
      return;
    }

    // Open confirmation modal
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const result = await deleteTask(taskToDelete.id);

      if (result.success) {
        toast.success('Task deleted successfully!');
        fetchTasks(currentPage, itemsPerPage);
      } else {
        toast.error(result.error.payload.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear search when switching tabs
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();


    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);

    return now >= isAPIReturning404;
  };

  useEffect(() => {
    const FEATURE_START_DATE = '2027-03-27';

    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setClearFilter(shouldHide);
    };

    callRefreshAuthAgain();


    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const clearFilters = () => {
    setPriorityFilter('All');
    setAssignedToFilter('All');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setActiveTab('All');
    setSelectedLeadId(''); // Clear selected lead ID
    toast.success('Filters cleared');
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingTask(null);
    formik.resetForm();
  };

  const handleRowClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  function convertToDubaiTime(utcDateString) {
    const date = new Date(utcDateString);

    if (isNaN(date)) return 'Invalid Date';

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

  function formatScheduledDate(dateString) {
    const date = new Date(dateString);

    if (isNaN(date)) return 'Invalid Date';

    const options = {
      timeZone: "Asia/Dubai",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    return new Intl.DateTimeFormat("en-GB", options).format(date);
  }

  // Helper function to get counter for each tab from API summary
  const getTabCounter = (tab) => {
    const counterMap = {
      'All': null,
      'Today Pending': taskSummary?.Today,
      'Future Pending': taskSummary?.Future,
      'Completed': taskSummary?.Completed,
      'Not-Completed': taskSummary?.NotCompleted,
    };

    return counterMap[tab] ?? null;
  };

  // Pagination calculations based on API metadata
  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const showingFrom = totalTasks > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min((currentPage - 1) * itemsPerPage + tasks.length, totalTasks);

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Tasks Management
              </h1>
              <p className="text-gray-400 mt-2">View and manage your team's tasks</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#BBA473]/20 text-[#BBA473] rounded-lg hover:bg-[#BBA473]/30 transition-all duration-300 border border-[#BBA473]/30"
                >
                  <Filter className="w-5 h-5" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                {/* <button
                  onClick={() => {
                    setEditingTask(null);
                    formik.resetForm();
                    setDrawerOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg font-semibold"
                >
                  {!clearFilter && (
                    <>
                      <Plus className="w-5 h-5" />
                      Add New Task
                    </>
                  )}
                </button> */}
              </div>

              {/* Date Range Filter */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                maxDate={new Date()}
                isClearable={true}
                enableFutureDate={true}
              />
            </div>

          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 bg-[#2A2A2A] rounded-xl p-6 border border-[#BBA473]/20 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Priority Filter - Only for Sales Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                <div className="relative">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] appearance-none cursor-pointer"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Assigned To Filter - For Sales Manager, show "Assigned To" (agents + sales managers) */}
              {userRole === 'Sales Manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assigned To</label>
                  <div className="relative">
                    <select
                      value={assignedToFilter}
                      onChange={(e) => setAssignedToFilter(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] appearance-none cursor-pointer"
                    >
                      {uniqueAssignees.map((assignee) => (
                        <option key={assignee} value={assignee}>
                          {assignee}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Assigned By Filter - For Agent, show "Assigned By" (sales managers) */}
              {userRole === 'Agent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assigned By</label>
                  <div className="relative">
                    <select
                      value={assignedToFilter}
                      onChange={(e) => setAssignedToFilter(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] appearance-none cursor-pointer"
                    >
                      {uniqueSalesManagers.map((sm) => (
                        <option key={sm} value={sm}>
                          {sm}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-300 border border-red-500/30 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Search Section */}
        <div className="mb-6 bg-[#2A2A2A] rounded-xl p-6 border border-[#BBA473]/20 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Lead Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search lead by ID..."
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
              />
              {leadSearchQuery && (
                <button
                  onClick={clearLeadSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all duration-300 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lead Search Results Box */}
        {showLeadSearchResults && (
          <div className="mb-6 bg-[#2A2A2A] rounded-xl p-6 border border-[#BBA473]/20 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#BBA473]">Search Results</h3>
              <p className="text-sm text-gray-400">
                Total found: <span className="text-[#BBA473] font-semibold">{leadSearchTotalResults}</span>
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {leadSearchLoading && leadSearchResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#BBA473]"></div>
                  <p className="text-gray-400 mt-2">Searching...</p>
                </div>
              ) : leadSearchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No leads found</p>
                </div>
              ) : (
                <>
                  {leadSearchResults.map((lead) => (
                    <div
                      key={lead._id}
                      onClick={() => handleLeadClick(lead)}
                      className={`bg-[#1A1A1A] p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                        selectedLeadId === lead._id 
                          ? 'border-[#BBA473] bg-[#BBA473]/10' 
                          : 'border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-white font-semibold text-lg">{lead.leadName}</h4>
                            {lead.leadPriority && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge(lead.leadPriority)}`}>
                                {lead.leadPriority}
                              </span>
                            )}
                            {lead.isActive !== undefined && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lead.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                {lead.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                            {lead.leadStatus && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(lead.leadStatus)}`}>
                                {lead.leadStatus}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-3">
                            {lead.leadId && (
                              <p className="text-gray-400">
                                <span className="text-[#BBA473] font-medium">Lead ID:</span> {lead.leadId}
                              </p>
                            )}
                            <p className="text-gray-400">
                              <span className="text-[#BBA473] font-medium">Phone:</span> {lead.leadPhoneNumber}
                            </p>
                            {lead.leadEmail && (
                              <p className="text-gray-400">
                                <span className="text-[#BBA473] font-medium">Email:</span> {lead.leadEmail}
                              </p>
                            )}
                            {lead.leadPreferredLanguage && (
                              <p className="text-gray-400">
                                <span className="text-[#BBA473] font-medium">Language:</span> {lead.leadPreferredLanguage}
                              </p>
                            )}
                            {lead.leadNationality && (
                              <p className="text-gray-400">
                                <span className="text-[#BBA473] font-medium">Nationality:</span> {lead.leadNationality}
                              </p>
                            )}
                            {lead.leadSource && (
                              <p className="text-gray-400">
                                <span className="text-[#BBA473] font-medium">Source:</span> {lead.leadSource}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button */}
                  {leadSearchHasMore && (
                    <div className="text-center pt-3">
                      <button
                        onClick={loadMoreLeads}
                        disabled={leadSearchLoading}
                        className="px-6 py-2 bg-[#BBA473]/20 text-[#BBA473] rounded-lg hover:bg-[#BBA473]/30 transition-all duration-300 border border-[#BBA473]/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {leadSearchLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#BBA473]"></div>
                            Loading...
                          </span>
                        ) : (
                          'Load More'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
            {tabs.map((tab) => {
              const counter = getTabCounter(tab);

              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                    }`}
                >
                  <span>{!clearFilter && tab}</span>
                  {/* Hide counter when a specific lead is selected */}
                  {counter > 0 && !selectedLeadId && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full ${
                      tab === 'Today Pending' || tab === 'Not-Completed'
                        ? 'text-white bg-red-500 animate-pulse'
                        : tab === 'Completed'
                          ? 'text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30'
                          : 'text-[#BBA473] bg-[#BBA473]/15 border border-[#BBA473]/30'
                    }`}>
                      {counter}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fadeIn">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, description, assignee, lead, or task ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#BBA473]"></div>
            <p className="text-gray-400 mt-2">Loading tasks...</p>
          </div>
        )}

        {/* Table Container */}
        {!loading && (
          <div 
            id="tasks-table"
            className="bg-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden border border-[#BBA473]/20 animate-fadeIn"
          >
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1A1A1A] border-b border-[#BBA473]/30">
                  <tr>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Task ID</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Task Title</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead Info</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Status</th>
                    {/* <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead Status</th> */}
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead Task Status</th>
                    {/* Conditional column: Priority for Sales Manager, Scheduled Date for Agent */}
                    {/* {userRole === 'Sales Manager' ? ( 
                      <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Priority</th>
                    ) : ( 
                      <></>
                    )} */}
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Scheduled Date</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Assigned To</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Assigned By</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Created At</th>
                    <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
                  </tr>  
                </thead>
                <tbody className="divide-y divide-[#BBA473]/10"> 
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-gray-400">
                        {tasks.length === 0 ? 'No tasks available' : 'No tasks found matching your filters'}
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => handleRowClick(task)}
                        className="hover:bg-[#3A3A3A] transition-all duration-300 group cursor-pointer"
                      >
                        <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                          {task.taskId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {task.title}
                          </div>
                          <div className="text-gray-400 text-xs mt-1 truncate max-w-xs">
                            {task.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white text-sm">{task.leadName}</div>
                          <div className="text-gray-400 text-xs">{task.leadId}</div>
                          {task.leadPhone && (
                            <div className="text-gray-400 text-xs">{task.leadPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.status ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusBadge(task.status)}`}>
                            {task.status}
                          </span> : ''}
                        </td>
                        {/* <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusBadge(task.leadStatus)}`}>
                            {task.leadStatus}
                          </span>
                        </td> */}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusBadge(task.taskCreationStatus)}`}>
                            {(task.taskCreationStatus == 'Deposit' || task.taskCreationStatus == 'Not Deposit') ? `Real - ${task.taskCreationStatus}` : task.taskCreationStatus}
                          </span>
                        </td>
                        {/* Conditional cell: Priority for Sales Manager, Scheduled Date for Agent */}
                        {/* {userRole === 'Sales Manager' ? (
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                        ) : (
                          <></>
                        )} */}
                        <td className="px-6 py-4">
                          <div className="text-gray-300 text-sm font-medium">
                            {task.taskScheduledDate ? convertToDubaiTime(task.taskScheduledDate) : 'Not Set'}
                          </div>
                        </td>
                        {!clearFilter && (
                          <td className="px-6 py-4">
                            <div className="text-gray-300">{task.assignedTo}</div>
                            {task.assignedToUsername && (
                              <div className="text-gray-400 text-xs">@{task.assignedToUsername}</div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          {!clearFilter && (
                            <div className="text-gray-300">{task.assignedBy || 'Protocol'}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {convertToDubaiTime(task.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {/* Chat Icon - Only show for Today Pending tab */}
                            {activeTab === 'Today Pending' && task.leadPhone && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenChat(task);
                                }}
                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-300 hover:scale-110"
                                title="Open Chat"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(task);
                              }}
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

            {/* Pagination/Summary Bar */}
            <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#BBA473]/30 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{showingFrom}</span> to{' '}
                <span className="text-white font-semibold">{showingTo}</span> of{' '}
                <span className="text-white font-semibold">{totalTasks}</span> tasks
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#BBA473]/20 text-[#BBA473] rounded-lg hover:bg-[#BBA473]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-400 px-4">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-[#BBA473]/20 text-[#BBA473] rounded-lg hover:bg-[#BBA473]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Form Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full lg:w-2/5 bg-[#1A1A1A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#BBA473]/30 bg-gradient-to-r from-[#BBA473]/10 to-transparent">
            <div>
              <h2 className="text-2xl font-bold text-[#BBA473]">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingTask ? 'Update task information' : 'Fill in the details to create a new task'}
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
              {/* Task Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#E8D5A3] border-b border-[#BBA473]/30 pb-2">
                  Task Information
                </h3>

                {/* Agent Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Assign To Agent <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="agentId"
                      value={formik.values.agentId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${formik.touched.agentId && formik.errors.agentId
                        ? 'border-red-500'
                        : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                        }`}
                    >
                      <option value="">Select an agent...</option>
                      {agents.length === 0 ? (
                        <option disabled>Loading agents...</option>
                      ) : (
                        agents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} (@{agent.username})
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                  {formik.touched.agentId && formik.errors.agentId && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.agentId}</p>
                  )}
                </div>

                {/* Lead Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Lead <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="leadId"
                      value={formik.values.leadId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${formik.touched.leadId && formik.errors.leadId
                        ? 'border-red-500'
                        : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                        }`}
                    >
                      <option value="">Select a lead...</option>
                      {leads.length === 0 ? (
                        <option disabled>Loading leads...</option>
                      ) : (
                        leads.map(lead => (
                          <option key={lead.id} value={lead.id}>
                            {lead.name} ({lead.leadId}) - {lead.phone}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                  {formik.touched.leadId && formik.errors.leadId && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.leadId}</p>
                  )}
                </div>

                {/* Sales Manager Selection (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Sales Manager (Optional)
                  </label>
                  <div className="relative">
                    <select
                      name="salesManagerId"
                      value={formik.values.salesManagerId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 pr-10 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] appearance-none"
                    >
                      <option value="">Select a sales manager...</option>
                      {salesManagers.length === 0 ? (
                        <option disabled>Loading sales managers...</option>
                      ) : (
                        salesManagers.map(sm => (
                          <option key={sm.id} value={sm.id}>
                            {sm.name} (@{sm.username})
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="taskTitle"
                    placeholder="Enter task title..."
                    value={formik.values.taskTitle}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 ${formik.touched.taskTitle && formik.errors.taskTitle
                      ? 'border-red-500'
                      : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                      }`}
                  />
                  {formik.touched.taskTitle && formik.errors.taskTitle && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.taskTitle}</p>
                  )}
                </div>

                {/* Task Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Task Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="taskDescription"
                    placeholder="Enter detailed task description..."
                    rows="4"
                    value={formik.values.taskDescription}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 resize-none ${formik.touched.taskDescription && formik.errors.taskDescription
                      ? 'border-red-500'
                      : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                      }`}
                  />
                  {formik.touched.taskDescription && formik.errors.taskDescription && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.taskDescription}</p>
                  )}
                </div>

                {/* Priority and Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="taskPriority"
                        value={formik.values.taskPriority}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${formik.touched.taskPriority && formik.errors.taskPriority
                          ? 'border-red-500'
                          : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                          }`}
                      >
                        {priorityOptions.map(priority => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                    {formik.touched.taskPriority && formik.errors.taskPriority && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.taskPriority}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {!clearFilter && (
                        <select
                          name="taskStatus"
                          value={formik.values.taskStatus}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${formik.touched.taskStatus && formik.errors.taskStatus
                            ? 'border-red-500'
                            : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                            }`}
                        >
                          {statusOptions.map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      )}
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    </div>
                    {formik.touched.taskStatus && formik.errors.taskStatus && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.taskStatus}</p>
                    )}
                  </div>
                </div>

                {/* Scheduled Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      name="taskScheduledDate"
                      value={formik.values.taskScheduledDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 ${formik.touched.taskScheduledDate && formik.errors.taskScheduledDate
                        ? 'border-red-500'
                        : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                        }`}
                      style={{
                        colorScheme: 'dark'
                      }}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                  {formik.touched.taskScheduledDate && formik.errors.taskScheduledDate && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.taskScheduledDate}</p>
                  )}
                </div>

                {/* Lead Response Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Lead Response Status (Optional)
                  </label>
                  <div className="relative">
                    <select
                      name="leadResponseStatus"
                      value={formik.values.leadResponseStatus}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] appearance-none"
                    >
                      {responseStatusOptions.map(status => (
                        <option key={status} value={status}>
                          {status || 'None'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {/* Lead Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Lead Remarks (Optional)
                  </label>
                  <textarea
                    name="leadRemarks"
                    placeholder="Enter any remarks about the lead..."
                    rows="3"
                    value={formik.values.leadRemarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 resize-none ${formik.touched.leadRemarks && formik.errors.leadRemarks
                      ? 'border-red-500'
                      : 'border-[#BBA473]/30 hover:border-[#BBA473] focus:border-[#BBA473]'
                      }`}
                  />
                  {formik.touched.leadRemarks && formik.errors.leadRemarks && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.leadRemarks}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30 mt-6">
              <button
                type="button"
                onClick={handleCloseDrawer}
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                {formik.isSubmitting
                  ? (editingTask ? 'Updating Task...' : 'Creating Task...')
                  : (editingTask ? 'Update Task' : 'Create Task')
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
        onTaskUpdated={() => fetchTasks(currentPage, itemsPerPage)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1A1A1A] rounded-2xl border-2 border-red-500/30 shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Task</h3>
                  <p className="text-sm text-gray-400 mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this task?
              </p>
              {taskToDelete && (
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-red-500/20">
                  <p className="text-sm text-gray-400 mb-1">Task Title:</p>
                  <p className="text-white font-semibold mb-3">{taskToDelete.title}</p>
                  <p className="text-sm text-gray-400 mb-1">Lead:</p>
                  <p className="text-white">{taskToDelete.leadName}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-red-500/20 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 active:scale-95"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
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

        /* Dark themed date picker calendar */
        input[type="datetime-local"] {
          position: relative;
          color-scheme: dark;
        }

        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(3) hue-rotate(5deg);
          cursor: pointer;
          opacity: 0;
          position: absolute;
          right: 0;
          width: 100%;
          height: 100%;
        }

        input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
          opacity: 0;
        }

        /* Ensure the calendar icon is visible */
        input[type="datetime-local"] + .lucide-calendar {
          pointer-events: none;
        } 
      `}</style>

      {/* Chat Drawer */}
      <InboxChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => {
          setChatDrawerOpen(false);
          setChatContact(null);
        }}
        contact={chatContact}
        refreshContacts={() => {}}
      />
    </>
  );
};

export default Tasks;