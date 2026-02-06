import React, { useState, useEffect } from 'react';
import { X, UserPlus, Clock, AlertCircle } from 'lucide-react';
import { createAutoTask, createTask } from '../../../services/taskService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const SalesManagerAssignLeadModal = ({ 
  showRowModal,
  selectedLead,
  handleCloseModal,
  agents,
  assignToSelf,
  setAssignToSelf,
  selectedAgentForLead,
  setSelectedAgentForLead,
  assigningLead,
  handleAssignAgent,
  hasAssignmentChanged,
  activeModalTab,
  setActiveModalTab,
  currentUserId,
  leadResponseStatus,
  setLeadResponseStatus,
  modalRemarks,
  setModalRemarks,
  modalErrors,
  setModalErrors,
  modalAnswered,
  setModalAnswered,
  modalInterested,
  setModalInterested,
  modalLeadType,
  setModalLeadType,
  modalHotLeadType,
  setModalHotLeadType,
  modalDepositStatus,
  setModalDepositStatus,
  handleStatusUpdate,
  onOpenTaskModal,
  demoInstallApp,
  setDemoInstallApp,
  demoEducationVideo,
  setDemoEducationVideo,
  demoAnalyzeChannel,
  setDemoAnalyzeChannel,
}) => {
  const [taskStatus, setTaskStatus] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState(null);
  const [answeredStatus, setAnsweredStatus] = useState(''); // NEW: Answered status field

  // Reset closing state when modal opens
  useEffect(() => {
    if (showRowModal) {
      setIsClosing(false);
    }
  }, [showRowModal]);

  // Pre-populate modal when selectedLead changes
  useEffect(() => {
    if (selectedLead && activeModalTab === 'status') {
      setModalRemarks(selectedLead.latestRemarks || '');
      setTaskTitle('');
      setReminderDateTime(null);
      setTaskStatus(''); // Reset task status
      setAnsweredStatus(''); // Reset answered status
      
      // Reset demo checkboxes first
      setDemoInstallApp(false);
      setDemoEducationVideo(false);
      setDemoAnalyzeChannel(false);
      
      // Determine the current status based on boolean flags
      if (!selectedLead.contacted) {
        // Lead hasn't been contacted yet - no selections
        setModalAnswered('');
        setModalInterested('');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
        setLeadResponseStatus('');
      } else if (selectedLead.contacted && !selectedLead.answered) {
        // Contacted but not answered
        setModalAnswered('Not Answered');
        setLeadResponseStatus('Not Answered');
        setModalInterested('');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (selectedLead.contacted && selectedLead.answered && !selectedLead.interested) {
        // Answered but not interested (cold lead)
        setModalAnswered('Answered');
        setModalInterested('Not Interested');
        setLeadResponseStatus('Not Interested');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (selectedLead.contacted && selectedLead.answered && selectedLead.interested) {
        // Answered and interested
        setModalAnswered('Answered');
        setModalInterested('Interested');
        
        if (!selectedLead.hot) {
          // Warm lead
          setModalLeadType('Warm');
          setLeadResponseStatus('Warm');
          setModalHotLeadType('');
          setModalDepositStatus('');
        } else if (selectedLead.hot) {
          // Hot lead
          setModalLeadType('Hot');
          
          if (selectedLead.demo && !selectedLead.real) {
            // Demo account - set demo checkboxes based on lead data
            setModalHotLeadType('Demo');
            setLeadResponseStatus('Demo');
            setModalDepositStatus('');
            
            // ✅ FIX: Set demo checkboxes from lead data
            setDemoInstallApp(selectedLead.applicationInstalled || false);
            setDemoEducationVideo(selectedLead.educationalVideosSent || false);
            setDemoAnalyzeChannel(selectedLead.socialMediaLinksSent || false);
          } else if (selectedLead.real) {
            // Real account
            setModalHotLeadType('Real');
            setLeadResponseStatus('Real');
            
            if (selectedLead.deposited) {
              setModalDepositStatus('Deposit');
              setLeadResponseStatus('Deposit');
            } else {
              setModalDepositStatus('Not Deposit');
              setLeadResponseStatus('Not Deposit');
            }
          } else {
            // Hot lead but no demo or real yet
            setLeadResponseStatus('Hot');
            setModalHotLeadType('');
            setModalDepositStatus('');
          }
        }
      }
    }
  }, [selectedLead, activeModalTab]);

  // Auto-enable task completion when reaching Demo or higher
  useEffect(() => {
    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    if (allowedStatuses.includes(leadResponseStatus)) {
      setTaskStatus('Completed');
    }
  }, [leadResponseStatus]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleCloseModal();
    }, 300);
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
      'Not Deposit': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Warm': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Hot': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Not Answered': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'Not Interested': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'Assigned': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'New': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Not Assigned': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Validation function for status form
  const validateStatusForm = () => {
    const errors = {};
    
    // NEW: Answered Status is mandatory
    if (!answeredStatus) {
      errors.answeredStatus = 'Please select Answered or Not Answered';
    }

    // NEW: When "Not Answered" is selected, task must be marked as "Completed"
    if (answeredStatus === 'Not Answered' && taskStatus !== 'Completed') {
      errors.taskStatus = 'Task must be marked as Completed when selecting "Not Answered"';
    }

    // MODIFIED: Only validate Update Status if "Answered" is selected in Answered Status
    if (answeredStatus === 'Answered') {
      // Validate that a response status is selected
      if (!leadResponseStatus) {
        errors.answered = 'Please complete the status selection';
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
    }
    
    // Validate remarks length (max 500 characters)
    if (modalRemarks && modalRemarks.length > 500) {
      errors.remarks = 'Remarks must not exceed 500 characters';
    }
    
    return errors;
  };

  // Check if the status form is valid for submission
  const isStatusFormValid = () => {
    // NEW: Answered Status is mandatory
    if (!answeredStatus) return false;

    // When "Not Answered" is selected, task must be marked as "Completed" to enable submit
    if (answeredStatus === 'Not Answered' && taskStatus !== 'Completed') return false;

    // MODIFIED: Only validate Update Status if "Answered" is selected in Answered Status
    if (answeredStatus === 'Answered') {
      // Must have a base selection
      if (!modalAnswered) return false;
      
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
    }
    
    return true;
  };

  // Helper function to check if a status option should be disabled
  // Status hierarchy: Not Answered < Not Interested < Warm < Hot < Demo < Real < Not Deposit < Deposit
  const isStatusDisabled = (statusToCheck) => {
    if (!selectedLead) return false;
    
    const statusHierarchy = [
      'Not Answered',
      'Not Interested', 
      'Warm',
      'Hot',
      'Demo',
      'Real',
      'Not Deposit',
      'Deposit'
    ];
    
    const currentStatusIndex = statusHierarchy.indexOf(selectedLead.status);
    const checkStatusIndex = statusHierarchy.indexOf(statusToCheck);
    
    // If current status not found or checking status not found, don't disable
    if (currentStatusIndex === -1 || checkStatusIndex === -1) return false;
    
    // Disable if the status to check is before or equal to current status
    return checkStatusIndex <= currentStatusIndex;
  };

  // Check if reminder date should be enabled (Warm to Deposit only)
  const isReminderDateEnabled = () => {
    return ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
  };

  // Check if task status "Completed" should be disabled
  const isTaskStatusCompletedDisabled = () => {
    // Task status can only be completed if lead response status is Demo or higher
    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    return !allowedStatuses.includes(leadResponseStatus);
  };

  // MODIFIED: Update Status section should be disabled if "Not Answered" is selected
  const isUpdateStatusDisabled = () => {
    return answeredStatus === 'Not Answered';
  };

  // Helper function to check if a status is the final selected status
  const isFinalSelectedStatus = (statusValue) => {
    return leadResponseStatus === statusValue && leadResponseStatus !== '';
  };

  // Helper component for the selected status indicator
  const SelectedStatusIndicator = () => (
    <div className="flex items-center gap-1 ml-auto">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
    </div>
  );

  const handleStatusUpdateWithValidation = async () => {
    // Validate form
    const errors = validateStatusForm();
    
    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    try {
      // Call the parent's handleStatusUpdate
      await handleStatusUpdate();
      
      // After successful lead update, create task based on reminder date and status
      // Only create new task if lead response status is between Warm and Deposit
      const shouldCreateNewTask = ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
      
      if (shouldCreateNewTask) {
        try {
          let taskResult;
          
          if (reminderDateTime) {
            // Convert to ISO string for backend - this ensures proper timezone handling
            const scheduledDateISO = reminderDateTime.toISOString();
            
            // If reminder date is set, use createTask API
            const newTaskData = {
              agentId: selectedLead.agentId,
              leadId: selectedLead.id,
              salesManagerId: selectedLead.salesManagerId || undefined,
              taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`,
              taskDescription: modalRemarks.trim() || 'No additional remarks',
              taskPriority: 'Normal',
              taskScheduledDate: scheduledDateISO,
              taskStatus: 'Open',
              answerStatus: answeredStatus, // NEW: Include answered status
              leadRemarks: modalRemarks || '',
              leadResponseStatus: leadResponseStatus || '',
              leadStatus: leadResponseStatus || '',
            };
            
            taskResult = await createTask(newTaskData);
          } else {
            // If no reminder date, use createAutoTask API
            const autoTaskData = {
              leadId: selectedLead.id,
              leadStatus: leadResponseStatus || '',
              taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`,
              taskDescription: modalRemarks.trim() || 'No additional remarks',
              taskStatus: 'Completed',
            };
            
            taskResult = await createAutoTask(autoTaskData);
          }

          if (taskResult.success) {
            toast.success(taskResult.message || 'Task created successfully!');
          } else {
            // Don't show error for task creation failure, just log it
            console.error('Failed to create task:', taskResult.message);
          }
        } catch (taskError) {
          console.error('Error creating task:', taskError);
        }
      } else {
        // For statuses below Warm, create completed auto task
        try {
          const taskData = {
            leadId: selectedLead?.id,
            leadStatus: leadResponseStatus || selectedLead?.status || 'Lead',
            taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`,
            taskDescription: modalRemarks.trim() || 'No additional remarks',
            taskStatus: 'Completed',
          };

          const taskResult = await createAutoTask(taskData);

          if (taskResult.success) {
            toast.success(taskResult.message || 'Task created successfully!');
          } else {
            console.error('Failed to create task:', taskResult.message);
          }
        } catch (taskError) {
          console.error('Error creating task:', taskError);
        }
      }
    } catch (error) {
      console.error('Error in status update:', error);
    }
  };

  if (!showRowModal || !selectedLead) return null;

  const isAssignedToCurrentUser = selectedLead.agentId === currentUserId;

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
            <h2 className="text-2xl font-bold text-[#BBA473]">Lead Details</h2>
            <p className="text-gray-400 text-sm mt-1">{selectedLead.leadId || selectedLead.id?.slice(-6)}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs for Assign/Status */}
        {isAssignedToCurrentUser && (
          <div className="sticky top-[88px] bg-[#2A2A2A] border-b border-[#BBA473]/30 flex z-10">
            <button
              onClick={() => setActiveModalTab('assign')}
              className={`flex-1 px-6 py-3 font-semibold transition-all duration-300 ${
                activeModalTab === 'assign'
                  ? 'bg-[#BBA473]/20 text-[#BBA473] border-b-2 border-[#BBA473]'
                  : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
              }`}
            >
              Assign Lead
            </button>
            <button
              onClick={() => setActiveModalTab('status')}
              className={`flex-1 px-6 py-3 font-semibold transition-all duration-300 ${
                activeModalTab === 'status'
                  ? 'bg-[#BBA473]/20 text-[#BBA473] border-b-2 border-[#BBA473]'
                  : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
              }`}
            >
              Update Status
            </button>
          </div>
        )}

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Full Name</label>
                <p className="text-white text-lg">{selectedLead.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Phone Number</label>
                <p className="text-white text-lg font-mono">{formatPhoneDisplay(selectedLead.phone)}</p>
              </div>
              {selectedLead.email && (
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium">Email</label>
                  <p className="text-white">{selectedLead.email}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Nationality</label>
                <p className="text-white">{selectedLead.nationality || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Preferred Language</label>
                <p className="text-white">{selectedLead.language || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Assigned Agent</label>
                <p className="text-white">{selectedLead.agent || 'Not Assigned'}</p>
              </div>
              
              {/* All Status Fields */}
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Status</label>
                <p className="text-white">{selectedLead.status || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Kiosk Lead Status</label>
                <p className="text-white">{selectedLead.kioskLeadStatus || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Deposit Status</label>
                <p className="text-white">{selectedLead.depositStatus || 'N/A'}</p>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm text-[#E8D5A3] font-medium">
                  {selectedLead.chatbotMessage && Array.isArray(selectedLead.chatbotMessage) && selectedLead.chatbotMessage.length ? 'Chatbot Message' : 'Kiosk Remarks'}
                </label>
                {selectedLead.chatbotMessage && Array.isArray(selectedLead.chatbotMessage) && selectedLead.chatbotMessage.length ? (
                  selectedLead.chatbotMessage.map((item, _index) => (
                    <p key={_index} className="text-white mb-0.5">{item}</p>
                  ))
                ) : (
                  <p className="text-white">{selectedLead.remarks || 'No remarks'}</p>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {activeModalTab === 'assign' && (
              <div className="border-t border-[#BBA473]/30 pt-6 space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-[#E8D5A3] mb-4">Assign Lead to Agent</h3>
                
                {/* Assign to Self Checkbox */}
                <label className="flex items-center gap-3 p-4 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                  <input
                    type="checkbox"
                    checked={assignToSelf}
                    onChange={(e) => {
                      setAssignToSelf(e.target.checked);
                      if (e.target.checked) {
                        setSelectedAgentForLead('');
                      }
                    }}
                    className="w-5 h-5 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#BBA473]" />
                    <span className="text-white font-medium">Assign to myself</span>
                  </div>
                </label>

                {/* Agent Selection Dropdown */}
                {!assignToSelf && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Select Agent
                    </label>
                    <select
                      value={selectedAgentForLead}
                      onChange={(e) => setSelectedAgentForLead(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
                    >
                      <option value="">Choose an agent...</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.fullName} ({agent.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'status' && (
              <div className="border-t border-[#BBA473]/30 pt-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#E8D5A3]">Update Status</h3>
                
                {/* Date Time Picker - Only enabled for Warm to Deposit */}
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
                    answeredStatus === 'Answered'
                      ? 'bg-[#BBA473]/20 border-[#BBA473] ring-2 ring-[#BBA473]/50 cursor-pointer'
                      : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50 cursor-pointer'
                  }`}>
                    <input
                      type="radio"
                      name="answeredStatus"
                      value="Answered"
                      checked={answeredStatus === 'Answered'}
                      onChange={(e) => {
                        setAnsweredStatus(e.target.value);
                        setModalErrors({});
                      }}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-white font-medium">Answered</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    answeredStatus === 'Not Answered'
                      ? 'bg-[#BBA473]/20 border-[#BBA473] ring-2 ring-[#BBA473]/50 cursor-pointer'
                      : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50 cursor-pointer'
                  }`}>
                    <input
                      type="radio"
                      name="answeredStatus"
                      value="Not Answered"
                      checked={answeredStatus === 'Not Answered'}
                      onChange={(e) => {
                        setAnsweredStatus(e.target.value);
                        setModalErrors({});
                      }}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 cursor-pointer"
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
                
                {/* MODIFIED: Updated info message when "Not Answered" is selected */}
                {answeredStatus === 'Not Answered' && (
                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-orange-400 text-sm font-medium">Update Status Disabled</p>
                      <p className="text-orange-300 text-xs mt-1">
                        {taskStatus === 'Completed' 
                          ? 'When "Not Answered" is selected, you can only toggle the Task Status above. The Update Status section below is disabled.'
                          : 'To save with "Not Answered", please enable the Task Completion toggle above first.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

                {/* Level 1: Answered / Not Answered */}
                <div className={`space-y-4 ${isUpdateStatusDisabled() ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Update Status
                </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                      <input
                        type="radio"
                        name="answered"
                        value="Answered"
                        checked={modalAnswered === 'Answered'}
                        onChange={(e) => {
                          setModalAnswered(e.target.value);
                          setLeadResponseStatus('');
                          setModalInterested('');
                          setModalLeadType('');
                          setModalHotLeadType('');
                          setModalDepositStatus('');
                          setModalErrors({});
                        }}
                        className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                      />
                      <span className="text-white font-medium">Answered</span>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                      isStatusDisabled('Not Answered')
                        ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                        : isFinalSelectedStatus('Not Answered')
                          ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                    }`}>
                      <input
                        type="radio"
                        name="answered"
                        value="Not Answered"
                        checked={modalAnswered === 'Not Answered'}
                        disabled={isStatusDisabled('Not Answered')}
                        onChange={(e) => {
                          setModalAnswered(e.target.value);
                          setLeadResponseStatus(e.target.value);
                          setModalInterested('');
                          setModalLeadType('');
                          setModalHotLeadType('');
                          setModalDepositStatus('');
                          setModalErrors({});
                        }}
                        className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={`font-medium ${isFinalSelectedStatus('Not Answered') ? 'text-green-400' : 'text-white'}`}>Not Answered</span>
                      {isFinalSelectedStatus('Not Answered') && <SelectedStatusIndicator />}
                    </label>
                  </div>
                  {modalErrors.answered && (
                    <div className="text-red-400 text-sm animate-pulse">{modalErrors.answered}</div>
                  )}
                  
                  {/* Level 2: Interested / Not Interested */}
                  {modalAnswered === 'Answered' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                          <input
                            type="radio"
                            name="interested"
                            value="Interested"
                            checked={modalInterested === 'Interested'}
                            onChange={(e) => {
                              setModalInterested(e.target.value);
                              setLeadResponseStatus('');
                              setModalLeadType('');
                              setModalHotLeadType('');
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                          />
                          <span className="text-white font-medium">Interested</span>
                        </label>
                        
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Not Interested')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : isFinalSelectedStatus('Not Interested')
                              ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                              : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="interested"
                            value="Not Interested"
                            checked={modalInterested === 'Not Interested'}
                            disabled={isStatusDisabled('Not Interested')}
                            onChange={(e) => {
                              setModalInterested(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalLeadType('');
                              setModalHotLeadType('');
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`font-medium ${isFinalSelectedStatus('Not Interested') ? 'text-green-400' : 'text-white'}`}>Not Interested</span>
                          {isFinalSelectedStatus('Not Interested') && <SelectedStatusIndicator />}
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
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Warm')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : isFinalSelectedStatus('Warm')
                              ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                              : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="leadType"
                            value="Warm"
                            checked={modalLeadType === 'Warm'}
                            disabled={isStatusDisabled('Warm')}
                            onChange={(e) => {
                              setModalLeadType(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalHotLeadType('');
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`font-medium ${isFinalSelectedStatus('Warm') ? 'text-green-400' : 'text-white'}`}>Warm Lead</span>
                          {isFinalSelectedStatus('Warm') && <SelectedStatusIndicator />}
                        </label>
                        
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Hot')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : isFinalSelectedStatus('Hot')
                              ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                              : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="leadType"
                            value="Hot"
                            checked={modalLeadType === 'Hot'}
                            disabled={isStatusDisabled('Hot')}
                            onChange={(e) => {
                              setModalLeadType(e.target.value);
                              setLeadResponseStatus('');
                              setModalHotLeadType('');
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`font-medium ${isFinalSelectedStatus('Hot') ? 'text-green-400' : 'text-white'}`}>Hot Lead</span>
                          {isFinalSelectedStatus('Hot') && <SelectedStatusIndicator />}
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
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Demo')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : isFinalSelectedStatus('Demo')
                              ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                              : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="hotLeadType"
                            value="Demo"
                            checked={modalHotLeadType === 'Demo'}
                            disabled={isStatusDisabled('Demo')}
                            onChange={(e) => {
                              setModalHotLeadType(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`font-medium ${isFinalSelectedStatus('Demo') ? 'text-green-400' : 'text-white'}`}>Demo</span>
                          {isFinalSelectedStatus('Demo') && <SelectedStatusIndicator />}
                        </label>
                        
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Real')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="hotLeadType"
                            value="Real"
                            checked={modalHotLeadType === 'Real'}
                            disabled={isStatusDisabled('Real')}
                            onChange={(e) => {
                              setModalHotLeadType(e.target.value);
                              setLeadResponseStatus('');
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className="text-white font-medium">Real</span>
                        </label>
                      </div>
                      {modalErrors.hotLeadType && (
                        <div className="text-red-400 text-sm animate-pulse">{modalErrors.hotLeadType}</div>
                      )}
                    </div>
                  )}
                  
                  {/* Demo Checkboxes - Show only when Demo is selected */}
                  {modalHotLeadType === 'Demo' && (
                    <div className="mt-4 p-4 bg-[#1A1A1A] rounded-lg border-2 border-[#BBA473]/30 animate-fadeIn">
                      <h4 className="text-[#BBA473] font-semibold mb-3 flex items-center gap-2">
                        <span className="text-sm">Demo Steps</span>
                        <span className="text-xs text-gray-400">(First 2 are required)</span>
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Install App - Required */}
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

                        {/* Education Video - Required */}
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

                        {/* Analyze Channel - Optional */}
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

                      {/* Error message for demo checkboxes */}
                      {modalErrors.demoCheckboxes && (
                        <p className="text-red-400 text-sm mt-3 flex items-center gap-2 animate-pulse">
                          <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          {modalErrors.demoCheckboxes}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Level 5: Deposited / Not Deposited */}
                  {modalHotLeadType === 'Real' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Deposit')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : isFinalSelectedStatus('Deposit')
                              ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                              : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="depositStatus"
                            value="Deposit"
                            checked={modalDepositStatus === 'Deposit'}
                            disabled={isStatusDisabled('Deposit')}
                            onChange={(e) => {
                              setModalDepositStatus(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`font-medium ${isFinalSelectedStatus('Deposit') ? 'text-green-400' : 'text-white'}`}>Deposit</span>
                          {isFinalSelectedStatus('Deposit') && <SelectedStatusIndicator />}
                        </label>
                        
                        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                          isStatusDisabled('Not Deposit')
                            ? 'bg-[#1A1A1A]/50 opacity-50 cursor-not-allowed border-[#BBA473]/10'
                            : isFinalSelectedStatus('Not Deposit')
                              ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                              : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                        }`}>
                          <input
                            type="radio"
                            name="depositStatus"
                            value="Not Deposit"
                            checked={modalDepositStatus === 'Not Deposit'}
                            disabled={isStatusDisabled('Not Deposit')}
                            onChange={(e) => {
                              setModalDepositStatus(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`font-medium ${isFinalSelectedStatus('Not Deposit') ? 'text-green-400' : 'text-white'}`}>Not Deposit</span>
                          {isFinalSelectedStatus('Not Deposit') && <SelectedStatusIndicator />}
                        </label>
                      </div>
                      {modalErrors.depositStatus && (
                        <div className="text-red-400 text-sm animate-pulse">{modalErrors.depositStatus}</div>
                      )}
                    </div>
                  )}
                  
                  {/* Remarks / Notes */}
                  <div className="space-y-2 pt-4">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Notes / Remarks
                    </label>
                    <textarea
                      name="modalRemarks"
                      placeholder="Add any additional notes or comments about this status update..."
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

                  {/* Task Title */}
                  <div className="space-y-2 pt-4 border-t border-[#BBA473]/20">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Task Title <span className="text-xs text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="taskTitle"
                      placeholder={`Default: Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`}
                      value={`Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        Default: Follow Up with lead ( {leadResponseStatus || selectedLead?.status} - lead )
                      </p>
                      <div className="text-xs text-gray-500">
                        {taskTitle.length}/100
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Sticky */}
        <div className="sticky bottom-0 bg-[#2A2A2A] border-t border-[#BBA473]/30 p-6">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Close
            </button>
            
            {activeModalTab === 'assign' && (
              <button
                onClick={handleAssignAgent}
                disabled={assigningLead || !hasAssignmentChanged()}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {assigningLead ? 'Assigning...' : 'Assign Lead'}
              </button>
            )}
            
            {activeModalTab === 'status' && (
              <button
                onClick={handleStatusUpdateWithValidation}
                disabled={!isStatusFormValid()}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg transform ${
                  isStatusFormValid()
                    ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:shadow-xl hover:shadow-[#BBA473]/40 hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body{
          background-color: #000;
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

export default SalesManagerAssignLeadModal;