import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { updateTask, createTask, createAutoTask } from '../../../services/taskService';

const TaskDetailsModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  // Modal form state
  const [taskStatus, setTaskStatus] = useState('');
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

  // Pre-populate modal when task changes
  useEffect(() => {
    if (task) {
      setModalRemarks(task.leadRemarks || '');
      setTaskStatus(task.status || 'Completed'); // Default to Completed if Open
      setReminderDateTime(null);
      
      // Parse the current lead response status to set UI state
      const currentStatus = task.leadResponseStatus || '';
      
      if (!currentStatus || currentStatus === '') {
        // No status set yet
        resetAllSelections();
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
      } else if (currentStatus === 'Demo') {
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Demo');
        setLeadResponseStatus('Demo');
        setModalDepositStatus('');
      } else if (currentStatus === 'Not Deposit') {
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Not Deposit');
        setLeadResponseStatus('Not Deposit');
      } else if (currentStatus === 'Deposit') {
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Deposit');
        setLeadResponseStatus('Deposit');
      }
    }
  }, [task]);

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
    
    // Task status is required
    if (!taskStatus) {
      errors.taskStatus = 'Please select a task status';
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

    setIsSubmitting(true);

    try {
      // First, update the existing task
      const updateTaskData = {
        agentId: task.agentIdRaw,
        leadId: task.leadIdRaw,
        salesManagerId: task.salesManagerIdRaw || undefined,
        taskTitle: task.title,
        taskDescription: task.description,
        taskPriority: task.priority,
        taskScheduledDate: task.taskScheduledDate,
        taskStatus: taskStatus,
        leadRemarks: modalRemarks || '',
        leadResponseStatus: leadResponseStatus || '',
      };

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
          // If reminder date is set, use createTask API
          const newTaskData = {
            agentId: task.agentIdRaw,
            leadId: task.leadIdRaw,
            salesManagerId: task.salesManagerIdRaw || undefined,
            taskTitle: task.title,
            taskDescription: task.description,
            taskPriority: task.priority,
            taskScheduledDate: reminderDateTime.toISOString().split('T')[0],
            taskStatus: 'Open',
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
    if (!taskStatus) return false;
    
    // If "Answered" is selected, must complete the rest of the hierarchy
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

  // Point 3: Check if reminder date should be enabled (Warm to Deposit only)
  const isReminderDateEnabled = () => {
    return ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
  };

  // Point 5: Check if a lead response option should be disabled (previous statuses)
  const getLeadResponseStatusOrder = (status) => {
    const order = {
      '': 0,
      'Not Answered': 1,
      'Not Interested': 2,
      'Warm': 3,
      'Hot': 4,
      'Demo': 5,
      'Not Deposit': 6,
      'Deposit': 7
    };
    return order[status] || 0;
  };

  const isLeadResponseOptionDisabled = (optionStatus) => {
    const currentOrder = getLeadResponseStatusOrder(task?.leadResponseStatus || '');
    const optionOrder = getLeadResponseStatusOrder(optionStatus);
    return optionOrder < currentOrder;
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
                  <p className="text-white">{task.assignedTo}</p>
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
                  <label className="text-sm text-[#E8D5A3] font-medium">Lead Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ml-3 ${getStatusColor(task.leadStatus)}`}>
                    {task.leadStatus}
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
                      timeFormat="HH:mm"
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
                    />
                    <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                      isReminderDateEnabled() ? 'text-[#BBA473]' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Point 2: Task Status Selection - Remove "Open" & "Pending" */}
              <div className="space-y-4 mb-6">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Task Status <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <label 
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50"
                  >
                    <input
                      type="radio"
                      name="taskStatus"
                      value="Completed"
                      checked={taskStatus === 'Completed'}
                      onChange={(e) => {
                        setTaskStatus(e.target.value);
                        setModalErrors({});
                      }}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                    />
                    <span className="text-white font-medium">Completed</span>
                  </label>
                </div>
                {modalErrors.taskStatus && (
                  <div className="text-red-400 text-sm animate-pulse">{modalErrors.taskStatus}</div>
                )}
              </div>

              {/* Lead Response Status Update */}
              <div className="space-y-4">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Update Lead Response Status
                </label>

                {/* Level 1: Answered / Not Answered - Point 5: Disable previous statuses */}
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isLeadResponseOptionDisabled('Answered')
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
                      disabled={isLeadResponseOptionDisabled('Answered')}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                    />
                    <span className="text-white font-medium">Answered</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isLeadResponseOptionDisabled('Not Answered')
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
                      disabled={isLeadResponseOptionDisabled('Not Answered')}
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
                        isLeadResponseOptionDisabled('Interested')
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
                          disabled={isLeadResponseOptionDisabled('Interested')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Interested</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isLeadResponseOptionDisabled('Not Interested')
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
                          disabled={isLeadResponseOptionDisabled('Not Interested')}
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
                        isLeadResponseOptionDisabled('Warm')
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
                          disabled={isLeadResponseOptionDisabled('Warm')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Warm Lead</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isLeadResponseOptionDisabled('Hot')
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
                          disabled={isLeadResponseOptionDisabled('Hot')}
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
                        isLeadResponseOptionDisabled('Demo')
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
                          disabled={isLeadResponseOptionDisabled('Demo')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Demo</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isLeadResponseOptionDisabled('Real')
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
                          disabled={isLeadResponseOptionDisabled('Real')}
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
                        isLeadResponseOptionDisabled('Deposit')
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
                          disabled={isLeadResponseOptionDisabled('Deposit')}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:cursor-not-allowed"
                        />
                        <span className="text-white font-medium">Deposit</span>
                      </label>
                      
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isLeadResponseOptionDisabled('Not Deposit')
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
                          disabled={isLeadResponseOptionDisabled('Not Deposit')}
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
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg transform ${
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