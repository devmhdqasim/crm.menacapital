import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { updateTask, createTask, createAutoTask } from '../../../services/taskService';

const TaskDetailsModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  // Modal form state
  const [taskStatus, setTaskStatus] = useState('');
  const [answeredStatus, setAnsweredStatus] = useState(''); // NEW: Answered status field
  const [leadResponseStatus, setLeadResponseStatus] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  const [reminderDateTime, setReminderDateTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper states for hierarchical selections
  const [modalAnswered, setModalAnswered] = useState('');
  const [modalInterested, setModalInterested] = useState('');
  const [modalLeadType, setModalLeadType] = useState('');
  const [modalHotLeadType, setModalHotLeadType] = useState('');
  const [modalDepositStatus, setModalDepositStatus] = useState('');

  // Demo checkbox states
  const [demoInstallApp, setDemoInstallApp] = useState(false);
  const [demoEducationVideo, setDemoEducationVideo] = useState(false);
  const [demoAnalyzeChannel, setDemoAnalyzeChannel] = useState(false);

  // Animation state
  const [isClosing, setIsClosing] = useState(false);

  // Check if task is unassigned
  const isTaskUnassigned = task?.assignedTo === 'Unassigned';

  // Pre-populate modal when task changes
  useEffect(() => {
    if (task) {
      setModalRemarks(task.leadRemarks || '');
      setTaskStatus(task.status || 'Completed'); // Default to Completed if Open
      setReminderDateTime(null);
      
      // NEW: Set answered status from task (if exists, otherwise empty for user to select)
      // Check multiple possible field names from API
      const initialAnswerStatus = task.answerStatus || task.answeredStatus || '';
      console.log('🔍 Task object:', task);
      console.log('🔍 Initial answerStatus from task:', initialAnswerStatus);
      setAnsweredStatus(initialAnswerStatus);
      
      // Parse the current lead response status to set UI state
      const currentStatus = task.taskCreationStatus || '';
      const kioskStatus = task.kioskLeadStatus || ''; // Get kiosk lead status
      
      if (!currentStatus || currentStatus === '') {
        // No status set yet - but check kiosk status
        if (kioskStatus === 'Demo') {
          // Point 2: Auto-select Demo if kioskLeadStatus is Demo
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
        } else if (kioskStatus === 'Not Deposit') {
          // Point 4: Auto-select Not Deposit
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
          // Point 3: Auto-select Deposit for Real, Real Deposit, or Deposit
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Deposit');
          setLeadResponseStatus('Deposit');
        } else {
          // Point 1: kioskLeadStatus is "Lead" or empty - no changes
          resetAllSelections();
        }
      } else if (currentStatus === 'Not Answered') {
        setModalAnswered('Not Answered');
        setLeadResponseStatus('Not Answered');
        resetSubSelections();
      } else if (currentStatus === 'Not Interested') {
        setModalAnswered('Answered');
        setModalInterested('Not Interested');
        setLeadResponseStatus('Not Interested');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (currentStatus === 'Warm') {
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Warm');
        setLeadResponseStatus('Warm');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (currentStatus === 'Hot') {
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setLeadResponseStatus('Hot');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (currentStatus === 'Demo' || kioskStatus === 'Demo') {
        // Point 2: Auto-select Demo if taskCreationStatus OR kioskLeadStatus is Demo
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Demo');
        setLeadResponseStatus('Demo');
        setModalDepositStatus('');
      } else if (currentStatus === 'Not Deposit' || kioskStatus === 'Not Deposit') {
        // Point 4: Auto-select Not Deposit
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Not Deposit');
        setLeadResponseStatus('Not Deposit');
      } else if (currentStatus === 'Deposit' || kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
        // Point 3: Auto-select Deposit for Real, Real Deposit, or Deposit
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Deposit');
        setLeadResponseStatus('Deposit');
      }
    }
  }, [task]);

  // Auto-enable task completion when reaching Demo or higher
  useEffect(() => {
    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    if (allowedStatuses.includes(leadResponseStatus)) {
      setTaskStatus('Completed');
    }
  }, [leadResponseStatus]);

  const resetAllSelections = () => {
    setModalAnswered('');
    setModalInterested('');
    setModalLeadType('');
    setModalHotLeadType('');
    setModalDepositStatus('');
    setLeadResponseStatus('');
  };

  const resetSubSelections = () => {
    setModalInterested('');
    setModalLeadType('');
    setModalHotLeadType('');
    setModalDepositStatus('');
  };

  // Reset closing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const validateModalForm = () => {
    const errors = {};
    
    // Task status is required only if Completed option is enabled
    if (!taskStatus && !isTaskStatusCompletedDisabled()) {
      errors.taskStatus = 'Please select a task status';
    }
    
    // If Completed is disabled but user tries to complete without proper status
    if (isTaskStatusCompletedDisabled() && taskStatus === 'Completed') {
      errors.taskStatus = 'Task can only be completed when lead reaches Demo status or higher';
    }
    
    // NEW: Answered Status is mandatory
    if (!answeredStatus) {
      errors.answeredStatus = 'Please select Answered or Not Answered';
    }
    
    // NEW: If "Not Answered" is selected in Answered Status, cannot update Update Status
    if (answeredStatus === 'Not Answered' && modalAnswered) {
      errors.answeredStatus = 'Not Answered status cannot update Update Status. Please change Answered Status to "Answered" first.';
    }
    
    // If "Answered" is selected, must select Interested/Not Interested
    if (modalAnswered === 'Answered' && !modalInterested) {
      errors.interested = 'Please select Interested or Not Interested';
    }
    
    // If "Interested" is selected, must select Warm/Hot
    if (modalInterested === 'Interested' && !modalLeadType) {
      errors.leadType = 'Please select Warm Lead or Hot Lead';
    }
    
    // If "Hot" is selected, must select Demo/Real
    if (modalLeadType === 'Hot' && !modalHotLeadType) {
      errors.hotLeadType = 'Please select Demo or Real';
    }
    
    // If "Real" is selected, must select Deposit/Not Deposit
    if (modalHotLeadType === 'Real' && !modalDepositStatus) {
      errors.depositStatus = 'Please select Deposit or Not Deposit';
    }
    
    // If Demo is selected, first two checkboxes must be checked
    if (modalHotLeadType === 'Demo') {
      if (!demoInstallApp || !demoEducationVideo) {
        errors.demoCheckboxes = 'Please complete the first two required demo steps';
      }
    }
    
    // Validate remarks length (max 500 characters)
    if (modalRemarks && modalRemarks.length > 500) {
      errors.remarks = 'Remarks must not exceed 500 characters';
    }
    
    return errors;
  };

  const handleModalSubmit = async () => {
    // Validate form
    const errors = validateModalForm();
    
    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    // Debug: Log the answeredStatus value
    console.log('==========================================');
    console.log('📝 FORM SUBMISSION - ALL VALUES');
    console.log('==========================================');
    console.log('answeredStatus:', answeredStatus, '| Type:', typeof answeredStatus, '| Length:', answeredStatus?.length);
    console.log('taskStatus:', taskStatus);
    console.log('leadResponseStatus:', leadResponseStatus);
    console.log('modalRemarks:', modalRemarks);
    console.log('==========================================');

    setIsSubmitting(true);

    try {
      // Convert selected time from Dubai timezone to UTC for backend
      let scheduledDateISO = null;
      if (reminderDateTime) {
        // The user selects time thinking in Dubai timezone (UTC+4)
        // We need to convert this to UTC for the API
        const dubaiOffset = 4 * 60; // Dubai is UTC+4 (240 minutes)
        const userTimezoneOffset = reminderDateTime.getTimezoneOffset(); // User's local timezone offset in minutes
        
        // Adjust the date to account for Dubai timezone
        const adjustedDate = new Date(reminderDateTime.getTime() - (dubaiOffset + userTimezoneOffset) * 60000);
        scheduledDateISO = adjustedDate.toISOString();
      }

      // First, update the existing task
      const updateTaskData = {
        agentId: task.agentIdRaw,
        leadId: task.leadIdRaw,
        salesManagerId: task.salesManagerIdRaw || undefined,
        taskTitle: task.title,
        taskDescription: task.description,
        taskPriority: task.priority,
        // taskScheduledDate: scheduledDateISO,
        taskStatus: taskStatus,
        answerStatus: answeredStatus, // NEW: Include answered status in payload (using answerStatus as per API)
        leadRemarks: modalRemarks || '',
        leadResponseStatus: leadResponseStatus || '',
      };

      console.log('📤 Payload being sent to API:', updateTaskData);

      const updateResult = await updateTask(task.id, updateTaskData);

      if (!updateResult.success) {
        if (updateResult.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(updateResult.error?.payload?.message || 'Failed to update task');
        }
        setIsSubmitting(false);
        return;
      }

      // After successful update, check if we need to create a new task based on reminder date
      // Only create new task if lead response status is between Warm and Deposit
      const shouldCreateNewTask = ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
      
      if (shouldCreateNewTask) {
        let createResult;
        
        if (reminderDateTime) {
          // Convert selected time from Dubai timezone to UTC for backend
          const dubaiOffset = 4 * 60; // Dubai is UTC+4 (240 minutes)
          const userTimezoneOffset = reminderDateTime.getTimezoneOffset(); // User's local timezone offset in minutes
          
          // Adjust the date to account for Dubai timezone
          const adjustedDate = new Date(reminderDateTime.getTime() - (dubaiOffset + userTimezoneOffset) * 60000);
          const scheduledDateISO = adjustedDate.toISOString();
          
          // If reminder date is set, use createTask API
          const newTaskData = {
            agentId: task.agentIdRaw,
            leadId: task.leadIdRaw,
            salesManagerId: task.salesManagerIdRaw || undefined,
            taskTitle: task.title,
            taskDescription: task.description,
            taskPriority: task.priority,
            taskScheduledDate: scheduledDateISO,
            taskStatus: 'Open',
            answerStatus: answeredStatus, // NEW: Include answered status (using answerStatus as per API)
            leadRemarks: modalRemarks || '',
            leadResponseStatus: leadResponseStatus || '',
            leadStatus: leadResponseStatus || '', // Point 1: Add leadStatus
          };
          
          createResult = await createTask(newTaskData);
        } else {
          // If no reminder date, use createAutoTask API
          const autoTaskData = {
            leadId: task.leadIdRaw,
            leadStatus: leadResponseStatus || '', // Point 1: Add leadStatus
            taskTitle: task.title,
            taskDescription: task.description,
          };
          
          createResult = await createAutoTask(autoTaskData);
        }
        
        if (!createResult.success) {
          console.warn('Failed to create follow-up task:', createResult.message);
          // Don't show error to user, just log it
        }
      }

      toast.success('Task updated successfully!');
      handleClose();
      
      // Call the callback to refresh the task list if provided
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task. Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setModalErrors({});
    }, 300);
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+\d{1,4})(\d+)/, '$1 $2').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Pending': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[status] || colors.Open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Normal': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Medium': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Low': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[priority] || colors.Normal;
  };

  // Check if the form is valid for submission
  const isFormValid = () => {
    // Task is unassigned - cannot update
    if (isTaskUnassigned) return false;
    
    // Task status is required, but if Completed is disabled and not selected, that's okay
    if (!taskStatus && !isTaskStatusCompletedDisabled()) return false;
    
    // NEW: Answered Status is mandatory
    if (!answeredStatus) return false;
    
    // NEW: If "Not Answered" is selected, cannot proceed with Update Status
    if (answeredStatus === 'Not Answered' && modalAnswered) return false;
    
    // If "Answered" is selected in Update Status section, must complete the rest of the hierarchy
    if (modalAnswered === 'Answered') {
      if (!modalInterested) return false;
      
      if (modalInterested === 'Interested') {
        if (!modalLeadType) return false;
        
        if (modalLeadType === 'Hot') {
          if (!modalHotLeadType) return false;
          
          // If Demo is selected, first two checkboxes must be checked
          if (modalHotLeadType === 'Demo') {
            if (!demoInstallApp || !demoEducationVideo) return false;
          }
          
          if (modalHotLeadType === 'Real') {
            if (!modalDepositStatus) return false;
          }
        }
      }
    }
    
    return true;
  };

  const formatScheduledDate = (dateString) => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';

    const options = {
      timeZone: "Asia/Dubai",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  // Check if task status "Completed" should be disabled
  const isTaskStatusCompletedDisabled = () => {
    // Task status can only be completed if lead response status is Demo or higher
    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    return !allowedStatuses.includes(leadResponseStatus);
  };

  // Point 3: Check if reminder date should be enabled (Warm to Deposit only)
  const isReminderDateEnabled = () => {
    return ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
  };

  // Point 5: Check if a lead response option should be disabled (previous statuses)
  // Status hierarchy: Not Answered < Not Interested < Warm < Hot < Demo < Not Deposit < Deposit
  const isStatusDisabled = (statusToCheck) => {
    if (!task) return false;
    
    const statusHierarchy = [
      '',
      'Not Answered',
      'Not Interested', 
      'Warm',
      'Hot',
      'Demo',
      'Not Deposit',
      'Deposit'
    ];
    
    const currentStatusIndex = statusHierarchy.indexOf(task.taskCreationStatus || '');
    const kioskStatus = task.kioskLeadStatus || '';
    
    // Determine the effective status index (higher of taskCreationStatus or kioskLeadStatus)
    let effectiveStatusIndex = currentStatusIndex;
    
    // Map kiosk status to hierarchy
    if (kioskStatus === 'Demo') {
      const kioskIndex = statusHierarchy.indexOf('Demo');
      effectiveStatusIndex = Math.max(effectiveStatusIndex, kioskIndex);
    } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
      const kioskIndex = statusHierarchy.indexOf('Deposit');
      effectiveStatusIndex = Math.max(effectiveStatusIndex, kioskIndex);
    } else if (kioskStatus === 'Not Deposit') {
      const kioskIndex = statusHierarchy.indexOf('Not Deposit');
      effectiveStatusIndex = Math.max(effectiveStatusIndex, kioskIndex);
    }
    
    const checkStatusIndex = statusHierarchy.indexOf(statusToCheck);
    
    // If checking status not found, don't disable
    if (checkStatusIndex === -1) return false;
    
    // If no effective status set, don't disable anything
    if (effectiveStatusIndex === -1) return false;
    
    // Disable if the status to check is before or equal to effective status
    return checkStatusIndex <= effectiveStatusIndex;
  };

  // NEW: Check if Update Status section should be disabled
  const isUpdateStatusDisabled = () => {
    // Disable if task is unassigned
    if (isTaskUnassigned) return true;
    
    // Disable if "Not Answered" is selected in Answered Status
    if (answeredStatus === 'Not Answered') return true;
    
    return false;
  };

  if (!isOpen || !task) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Sticky */}
        <div className="sticky top-0 bg-gradient-to-r from-[#BBA473]/10 to-transparent border-b border-[#BBA473]/30 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#BBA473]">Task Details</h2>
            <p className="text-gray-400 text-sm mt-1">{task.taskId}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* NEW: Unassigned Task Warning */}
            {isTaskUnassigned && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-semibold">Unassigned Task</p>
                  <p className="text-red-300 text-xs mt-1">
                    This task is currently unassigned. Please assign this task to an agent before updating the status. All status updates are disabled until the task is assigned.
                  </p>
                </div>
              </div>
            )}

            {/* Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Task Title</label>
                <p className="text-white text-lg font-semibold">{task.title}</p>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Description</label>
                <p className="text-white">{task.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Current Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ml-3 ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <div className="space-y-2 ">
                <label className="text-sm text-[#E8D5A3] font-medium">Priority</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ml-3 ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Scheduled Date</label>
                <p className="text-white">{formatScheduledDate(task.taskScheduledDate)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Assigned To</label>
                <div>
                  <p className={`${isTaskUnassigned ? 'text-red-400 font-semibold' : 'text-white'}`}>
                    {task.assignedTo}
                  </p>
                  {task.assignedToUsername && (
                    <p className="text-gray-400 text-xs">@{task.assignedToUsername}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Information */}
            <div className="border-t border-[#BBA473]/30 pt-6">
              <h3 className="text-lg font-semibold text-[#E8D5A3] mb-4">Lead Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Lead Name
                  </label>
                  <p className="text-white">{task.leadName}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium">Lead ID</label>
                  <p className="text-white font-mono">{task.leadId}</p>
                </div>

                {task.leadPhone && (
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <p className="text-white font-mono">{formatPhoneDisplay(task.leadPhone)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium">Lead Task Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ml-3 ${getStatusColor(task.taskCreationStatus)}`}>
                    {(task.taskCreationStatus == 'Deposit' || task.taskCreationStatus == 'Not Deposit') ? `Real - ${task.taskCreationStatus}` : task.taskCreationStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Update Task Status */}
            <div className="border-t border-[#BBA473]/30 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#E8D5A3]">Update Task</h3>
                
                {/* Date Time Picker - Point 3: Only enabled for Warm to Deposit */}
                <div className="flex items-center gap-2">
                  <div className="relative flex">
                    <DatePicker
                      selected={reminderDateTime}
                      onChange={(date) => setReminderDateTime(date)}
                      showTimeSelect
                      timeFormat="h:mm aa"
                      timeIntervals={15}
                      dateFormat="MMM d, yyyy h:mm aa"
                      placeholderText="Set reminder"
                      minDate={new Date()}
                      disabled={!isReminderDateEnabled()}
                      className={`px-3 py-2 pl-10 rounded-lg bg-[#1A1A1A] text-white border-2 focus:border-[#BBA473] focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 transition-all duration-300 text-sm hover:border-[#BBA473] ${
                        isReminderDateEnabled() ? 'cursor-pointer border-[#BBA473]/30' : 'cursor-not-allowed border-gray-600 opacity-50'
                      }`}
                      calendarClassName="custom-datepicker"
                      wrapperClassName="w-full"
                      timeCaption="Time"
                    />
                    <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                      isReminderDateEnabled() ? 'text-[#BBA473]' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Task Status Toggle Switch */}
              <div className="space-y-4 mb-6">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Task Status <span className="text-red-400">*</span>
                </label>
                
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 ${
                  isTaskStatusCompletedDisabled()
                    ? 'bg-gray-900/50 border-gray-700 opacity-50'
                    : taskStatus === 'Completed'
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-[#1A1A1A] border-[#BBA473]/30 hover:border-[#BBA473]/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      taskStatus === 'Completed' 
                        ? 'bg-green-500/20' 
                        : 'bg-gray-700/50'
                    }`}>
                      <svg 
                        className={`w-5 h-5 transition-colors ${
                          taskStatus === 'Completed' 
                            ? 'text-green-400' 
                            : 'text-gray-500'
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-medium ${
                        taskStatus === 'Completed' 
                          ? 'text-green-400' 
                          : 'text-white'
                      }`}>
                        Mark as Completed
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isTaskStatusCompletedDisabled() 
                          ? 'Available at Demo status or higher' 
                          : 'Task will be marked as complete'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isTaskStatusCompletedDisabled()) {
                        setTaskStatus(taskStatus === 'Completed' ? 'Open' : 'Completed');
                        setModalErrors({});
                      }
                    }}
                    disabled={isTaskStatusCompletedDisabled()}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:ring-offset-2 focus:ring-offset-[#2A2A2A] ${
                      isTaskStatusCompletedDisabled()
                        ? 'bg-gray-700 cursor-not-allowed'
                        : taskStatus === 'Completed'
                          ? 'bg-green-500'
                          : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        taskStatus === 'Completed' ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Info message when Completed is disabled */}
                {isTaskStatusCompletedDisabled() && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-400 text-sm font-medium">Task Completion Locked</p>
                      <p className="text-blue-300 text-xs mt-1">
                        You can mark this task as completed once the lead reaches <span className="font-semibold">Demo</span> status or higher (Demo, Not Deposit, or Deposit).
                      </p>
                    </div>
                  </div>
                )}
                
                {modalErrors.taskStatus && (
                  <div className="text-red-400 text-sm animate-pulse">{modalErrors.taskStatus}</div>
                )}
              </div>

              {/* NEW: Answered Status Section */}
              <div className="space-y-4 mb-6">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Answered Status <span className="text-red-400">*</span>
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isTaskUnassigned
                      ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                      : answeredStatus === 'Answered'
                        ? 'bg-[#BBA473]/20 border-[#BBA473] ring-2 ring-[#BBA473]/50 cursor-pointer'
                        : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50 cursor-pointer'
                  }`}>
                    <input
                      type="radio"
                      name="answeredStatus"
                      value="Answered"
                      checked={answeredStatus === 'Answered'}
                      onChange={(e) => {
                        console.log('🔵 Answered Status onChange triggered:', e.target.value);
                        setAnsweredStatus(e.target.value);
                        setModalErrors({});
                      }}
                      disabled={isTaskUnassigned}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-white font-medium">Answered</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isTaskUnassigned
                      ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                      : answeredStatus === 'Not Answered'
                        ? 'bg-[#BBA473]/20 border-[#BBA473] ring-2 ring-[#BBA473]/50 cursor-pointer'
                        : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50 cursor-pointer'
                  }`}>
                    <input
                      type="radio"
                      name="answeredStatus"
                      value="Not Answered"
                      checked={answeredStatus === 'Not Answered'}
                      onChange={(e) => {
                        console.log('🔵 Answered Status onChange triggered:', e.target.value);
                        setAnsweredStatus(e.target.value);
                        setModalErrors({});
                      }}
                      disabled={isTaskUnassigned}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-white font-medium">Not Answered</span>
                  </label>
                </div>
                
                {/* Show error for Answered Status */}
                {modalErrors.answeredStatus && (
                  <div className="text-red-400 text-sm animate-pulse flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{modalErrors.answeredStatus}</span>
                  </div>
                )}
                
                {/* Show info when "Not Answered" is selected */}
                {answeredStatus === 'Not Answered' && (
                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-orange-400 text-sm font-medium">Update Status Disabled</p>
                      <p className="text-orange-300 text-xs mt-1">
                        When "Not Answered" is selected, you cannot update the status below. Please change to "Answered" to enable status updates.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead Response Status Update */}
              <div className={`space-y-4 ${isUpdateStatusDisabled() ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Update Status
                </label>

                {/* Level 1: Answered / Not Answered - Point 5: Disable previous statuses */}
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isStatusDisabled('Answered') || isUpdateStatusDisabled()
                      ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                      : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                  }`}>
                    <input
                      type="radio"
                      name="answered"
                      value="Answered"
                      checked={modalAnswered === 'Answered'}
                      onChange={(e) => {
                        setModalAnswered(e.target.value);
                        setLeadResponseStatus(leadResponseStatus === 'Not Interested' || leadResponseStatus === 'Warm' || leadResponseStatus === 'Hot' || leadResponseStatus === 'Demo' || leadResponseStatus === 'Deposit' || leadResponseStatus === 'Not Deposit' ? leadResponseStatus : '');
                        setModalInterested('');
                        setModalLeadType('');
                        setModalHotLeadType('');
                        setModalDepositStatus('');
                        setModalErrors({});
                      }}
                      disabled={isStatusDisabled('Answered') || isUpdateStatusDisabled()}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                    />
                    <span className="text-white font-medium">Answered</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isStatusDisabled('Not Answered') || isUpdateStatusDisabled()
                      ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                      : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                  }`}>
                    <input
                      type="radio"
                      name="answered"
                      value="Not Answered"
                      checked={modalAnswered === 'Not Answered' && leadResponseStatus === 'Not Answered'}
                      onChange={(e) => {
                        setModalAnswered(e.target.value);
                        setLeadResponseStatus(e.target.value);
                        setModalInterested('');
                        setModalLeadType('');
                        setModalHotLeadType('');
                        setModalDepositStatus('');
                        setModalErrors({});
                      }}
                      disabled={isStatusDisabled('Not Answered') || isUpdateStatusDisabled()}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                    />
                    <span className="text-white font-medium">Not Answered</span>
                  </label>
                </div>
                
                {/* Level 2: Interested / Not Interested */}
                {modalAnswered === 'Answered' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Interested')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="interested"
                          value="Interested"
                          checked={modalInterested === 'Interested'}
                          onChange={(e) => {
                            setModalInterested(e.target.value);
                            setLeadResponseStatus(leadResponseStatus === 'Warm' || leadResponseStatus === 'Hot' || leadResponseStatus === 'Demo' || leadResponseStatus === 'Deposit' || leadResponseStatus === 'Not Deposit' ? leadResponseStatus : '');
                            setModalLeadType('');
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Interested')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Interested</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Not Interested')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="interested"
                          value="Not Interested"
                          checked={modalInterested === 'Not Interested' && leadResponseStatus === 'Not Interested'}
                          onChange={(e) => {
                            setModalInterested(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalLeadType('');
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Not Interested')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Not Interested</span>
                      </label>
                    </div>
                    {modalErrors.interested && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.interested}</div>
                    )}
                  </div>
                )}
                
                {/* Level 3: Warm Lead / Hot Lead */}
                {modalInterested === 'Interested' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Warm')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="leadType"
                          value="Warm"
                          checked={modalLeadType === 'Warm' && leadResponseStatus === 'Warm'}
                          onChange={(e) => {
                            setModalLeadType(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Warm')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Warm Lead</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Hot')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="leadType"
                          value="Hot"
                          checked={modalLeadType === 'Hot'}
                          onChange={(e) => {
                            setModalLeadType(e.target.value);
                            setLeadResponseStatus(leadResponseStatus === 'Hot' ? 'Hot' : '');
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Hot')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Hot Lead</span>
                      </label>
                    </div>
                    {modalErrors.leadType && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.leadType}</div>
                    )}
                  </div>
                )}
                
                {/* Level 4: Demo / Real */}
                {modalLeadType === 'Hot' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Demo')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="hotLeadType"
                          value="Demo"
                          checked={modalHotLeadType === 'Demo' && leadResponseStatus === 'Demo'}
                          onChange={(e) => {
                            setModalHotLeadType(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Demo')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Demo</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Real')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="hotLeadType"
                          value="Real"
                          checked={modalHotLeadType === 'Real'}
                          onChange={(e) => {
                            setModalHotLeadType(e.target.value);
                            setLeadResponseStatus(leadResponseStatus === 'Deposit' || leadResponseStatus === 'Not Deposit' ? leadResponseStatus : '');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Real')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Real</span>
                      </label>
                    </div>
                    {modalErrors.hotLeadType && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.hotLeadType}</div>
                    )}
                  </div>
                )}
                
                {/* Demo Checkboxes */}
                {modalHotLeadType === 'Demo' && (
                  <div className="mt-4 p-4 bg-[#1A1A1A] rounded-lg border-2 border-[#BBA473]/30 animate-fadeIn">
                    <h4 className="text-[#BBA473] font-semibold mb-3 flex items-center gap-2">
                      <span className="text-sm">Demo Steps</span>
                      <span className="text-xs text-gray-400">(First 2 are required)</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={demoInstallApp}
                          onChange={(e) => {
                            setDemoInstallApp(e.target.checked);
                            setModalErrors({});
                          }}
                          className="w-5 h-5 rounded border-2 border-[#BBA473] bg-[#2A2A2A] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/50 cursor-pointer transition-all"
                        />
                        <span className="text-white group-hover:text-[#BBA473] transition-colors flex items-center gap-2">
                          <span className="font-medium">1. Install the App</span>
                          <span className="text-red-400 text-xs">*Required</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={demoEducationVideo}
                          onChange={(e) => {
                            setDemoEducationVideo(e.target.checked);
                            setModalErrors({});
                          }}
                          className="w-5 h-5 rounded border-2 border-[#BBA473] bg-[#2A2A2A] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/50 cursor-pointer transition-all"
                        />
                        <span className="text-white group-hover:text-[#BBA473] transition-colors flex items-center gap-2">
                          <span className="font-medium">2. Education Video</span>
                          <span className="text-red-400 text-xs">*Required</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={demoAnalyzeChannel}
                          onChange={(e) => setDemoAnalyzeChannel(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-[#BBA473] bg-[#2A2A2A] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/50 cursor-pointer transition-all"
                        />
                        <span className="text-white group-hover:text-[#BBA473] transition-colors flex items-center gap-2">
                          <span className="font-medium">3. Analyze Channel</span>
                          <span className="text-gray-400 text-xs">Optional</span>
                        </span>
                      </label>
                    </div>

                    {modalErrors.demoCheckboxes && (
                      <p className="text-red-400 text-sm mt-3 flex items-center gap-2 animate-pulse">
                        <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                        {modalErrors.demoCheckboxes}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Level 5: Deposit / Not Deposit */}
                {modalHotLeadType === 'Real' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Deposit')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="depositStatus"
                          value="Deposit"
                          checked={modalDepositStatus === 'Deposit' && leadResponseStatus === 'Deposit'}
                          onChange={(e) => {
                            setModalDepositStatus(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Deposit')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Deposit</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Not Deposit')
                          ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                      }`}>
                        <input
                          type="radio"
                          name="depositStatus"
                          value="Not Deposit"
                          checked={modalDepositStatus === 'Not Deposit' && leadResponseStatus === 'Not Deposit'}
                          onChange={(e) => {
                            setModalDepositStatus(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalErrors({});
                          }}
                          disabled={isStatusDisabled('Not Deposit')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Not Deposit</span>
                      </label>
                    </div>
                    {modalErrors.depositStatus && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.depositStatus}</div>
                    )}
                  </div>
                )}
                
                {/* Remarks */}
                <div className="space-y-2 pt-4">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Notes / Remarks
                  </label>
                  <textarea
                    name="modalRemarks"
                    placeholder="Add any additional notes or comments about this update..."
                    rows="4"
                    value={modalRemarks}
                    onChange={(e) => {
                      setModalRemarks(e.target.value);
                      if (modalErrors.remarks) {
                        setModalErrors({ ...modalErrors, remarks: '' });
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white resize-none transition-all duration-300 ${
                      modalErrors.remarks
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      {modalErrors.remarks && (
                        <div className="text-red-400 text-sm animate-pulse">{modalErrors.remarks}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {modalRemarks.length}/500
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Sticky */}
        <div className="sticky bottom-0 bg-[#2A2A2A] border-t border-[#BBA473]/30 p-6">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
            <button
              onClick={handleModalSubmit}
              disabled={!isFormValid() || isSubmitting}
              className={`btn-animated btn-gold flex justify-center mx-auto !max-w-64 !w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                isFormValid() && !isSubmitting
                  ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:shadow-xl hover:shadow-[#BBA473]/40 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Custom DatePicker Styling */
        .custom-datepicker {
          background-color: #2A2A2A !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 12px !important;
          font-family: inherit !important;
        }

        .react-datepicker {
          background-color: #2A2A2A !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 12px !important;
        }

        .react-datepicker__header {
          background-color: #1A1A1A !important;
          border-bottom: 1px solid rgba(187, 164, 115, 0.3) !important;
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker__day-name {
          color: #E8D5A3 !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day {
          color: #ffffff !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }

        .react-datepicker__day:hover {
          background-color: rgba(187, 164, 115, 0.2) !important;
          color: #BBA473 !important;
        }

        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list {
          background-color: #2a2a2a;
        }

        .react-datepicker__navigation--next--with-time:not(.react-datepicker__navigation--next--with-today-button) {
          width: 100%;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #BBA473 !important;
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--disabled {
          color: #666666 !important;
          opacity: 0.5 !important;
        }

        .react-datepicker__time-container {
          position: absolute;
          right: 100%;
          border: 2px solid #e8d5a33d;
          border-radius: 12px;
          border-left: 1px solid rgba(187, 164, 115, 0.3) !important;
        }

        .react-datepicker__time-list-item {
          color: #ffffff !important;
          transition: all 0.2s !important;
        }

        .react-datepicker__time-list-item:hover {
          background-color: rgba(187, 164, 115, 0.2) !important;
          color: #BBA473 !important;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #BBA473 !important;
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #BBA473 !important;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #E8D5A3 !important;
        }

        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default TaskDetailsModal;