import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, User, Phone } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { updateLeadTask } from '../../../services/leadService';
import { createAutoTask, createTask } from '../../../services/taskService';
import toast from 'react-hot-toast';

const AssignLeadModal = ({ 
  showDetailsModal, 
  selectedLead, 
  handleCloseModal, 
  fetchLeads, 
  currentPage, 
  itemsPerPage,
  isLeadsSelectedId,
  setLeadResponseStatusCurrent,
}) => {
  const [taskStatus, setTaskStatus] = useState('Completed');

  // Modal form state - using single variable to track the final selected status
  const [leadResponseStatus, setLeadResponseStatus] = useState('');
  const [answeredStatus, setAnsweredStatus] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  const [taskTitle, setTaskTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState(null);
  
  // Helper states to track the hierarchical selections for UI rendering
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

  // Pre-populate modal when selectedLead changes
  // Structure matches TaskDetailsModal: check currentStatus first, then kioskStatus
  useEffect(() => {
    if (selectedLead) {
      setModalRemarks(selectedLead.latestRemarks || '');
      setTaskTitle('');
      setReminderDateTime(null);
      setTaskStatus('Completed'); // Always Completed
      setAnsweredStatus('');

      // Reset demo checkboxes first
      setDemoInstallApp(false);
      setDemoEducationVideo(false);
      setDemoAnalyzeChannel(false);

      // Get current status and kiosk status
      const currentStatus = selectedLead.status || '';
      const kioskStatus = selectedLead.kioskLeadStatus || '';

      if (!currentStatus || currentStatus === '') {
        // No status set yet - check kiosk status
        if (kioskStatus === 'Demo') {
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
        } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'Real No Deposit' || kioskStatus === 'No Deposit') {
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Deposit');
          setLeadResponseStatus('Deposit');
        } else {
          // kioskLeadStatus is "Lead" or empty - no changes
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
        // Auto-select Demo if status OR kioskLeadStatus is Demo
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Demo');
        setLeadResponseStatus('Demo');
        setModalDepositStatus('');
      }
      else if (currentStatus === 'Not Deposit' || currentStatus === 'Real - Not Deposit' ||
        kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' ||
        kioskStatus === 'Real No Deposit' || kioskStatus === 'No Deposit') {
        // Auto-select Not Deposit
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Not Deposit');
        setLeadResponseStatus('Not Deposit');
      } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' ||
                kioskStatus === 'Deposit' || currentStatus === 'Deposit' ||
                currentStatus === 'Real - Deposit') {
        // Auto-select Deposit for Real, Real Deposit, or Deposit
        // Check depositStatus from lead to determine which one
        const leadDepositStatus = selectedLead.kioskDepositStatus || '';

        if (leadDepositStatus === 'Not Deposit' || leadDepositStatus === 'No Deposit') {
          // If depositStatus indicates Not Deposit, select Not Deposit
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        } else {
          // Otherwise, select Deposit (this is the true Real/Deposit case)
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Deposit');
          setLeadResponseStatus('Deposit');
        }
      } else {
        resetAllSelections();
      }
    }
  }, [selectedLead]);

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

  // Auto-enable task completion when reaching Demo or higher
  useEffect(() => {
    const kioskStatus = selectedLead?.kioskLeadStatus || '';
    
    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      return;
    }

    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    if (allowedStatuses.includes(leadResponseStatus)) {
      setTaskStatus('Completed');
    }
  }, [leadResponseStatus, selectedLead]);

  // Auto-reset to default valid selection when answeredStatus changes
  useEffect(() => {
    if (!selectedLead) return;

    const currentStatus = selectedLead.status || '';
    const kioskStatus = selectedLead.kioskLeadStatus || '';

    // For Kiosk Lead Status "Lead": only reset if status has no meaningful hierarchy value
    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      const meaningfulStatuses = ['Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
      if (meaningfulStatuses.includes(currentStatus)) {
        return; // Preserve existing selections
      }
      resetAllSelections();
      return;
    }

    // When answeredStatus changes to "Not Answered", check if current selections are now disabled
    if (answeredStatus === 'Not Answered') {
      if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit' ||
          kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
        // Don't force deposit status - let user keep their current selection
        // Both Deposit and Not Deposit should remain selectable
      } else if (kioskStatus === 'Demo') {
        if (modalHotLeadType !== 'Demo') {
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
        }
      } else if (currentStatus === 'Warm') {
        if (modalLeadType !== 'Warm' || leadResponseStatus !== 'Warm') {
          setModalLeadType('Warm');
          setLeadResponseStatus('Warm');
          setModalHotLeadType('');
          setModalDepositStatus('');
        }
      }
    }
  }, [answeredStatus, selectedLead]);

  // Reset closing state when modal opens
  useEffect(() => {
    if (showDetailsModal) {
      setIsClosing(false);
    }
  }, [showDetailsModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDetailsModal) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDetailsModal]);

  const validateModalForm = () => {
    const errors = {};
    
    if (!answeredStatus) {
      errors.answeredStatus = 'Please select Answered or Not Answered';
    }

    if (answeredStatus === 'Not Answered' && taskStatus !== 'Completed') {
      errors.taskStatus = 'Task must be marked as Completed when selecting "Not Answered"';
    }

    if (answeredStatus === 'Answered') {
      if (modalAnswered === 'Answered' && !modalInterested) {
        errors.interested = 'Please select Interested or Not Interested';
      }
      
      if (modalInterested === 'Interested' && !modalLeadType) {
        errors.leadType = 'Please select Warm Lead or Hot Lead';
      }
      
      if (modalLeadType === 'Hot' && !modalHotLeadType) {
        errors.hotLeadType = 'Please select Demo or Real';
      }
      
      if (modalHotLeadType === 'Real' && !modalDepositStatus) {
        errors.depositStatus = 'Please select Deposit or Not Deposit';
      }

      if (modalHotLeadType === 'Demo') {
        if (!demoInstallApp || !demoEducationVideo) {
          errors.demoCheckboxes = 'Please complete the first two required demo steps';
        }
      }
    }
    
    if (modalRemarks && modalRemarks.length > 500) {
      errors.remarks = 'Remarks must not exceed 500 characters';
    }
    
    return errors;
  };

  const handleModalSubmit = async () => {
    const errors = validateModalForm();
    
    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    try {
      const payload = {
        contacted: false,
        answered: false,
        interested: false,
        hot: false,
        cold: false,
        real: false,
        deposited: false,
        latestRemarks: modalRemarks,
        currentStatus: leadResponseStatus
      };

      setLeadResponseStatusCurrent(leadResponseStatus);

      if (modalHotLeadType === 'Demo') {
        payload.applicationInstalled = demoInstallApp;
        payload.educationalVideosSent = demoEducationVideo;
        payload.socialMediaLinksSent = demoAnalyzeChannel;
      }

      if (modalAnswered === 'Not Answered') {
        payload.contacted = true;
        payload.answered = false;
      } else if (modalAnswered === 'Answered') {
        payload.contacted = true;
        payload.answered = true;
        
        if (modalInterested === 'Not Interested') {
          payload.interested = false;
          payload.cold = true;
        } else if (modalInterested === 'Interested') {
          payload.interested = true;
          
          if (modalLeadType === 'Warm') {
            payload.hot = false;
            payload.cold = false;
          } else if (modalLeadType === 'Hot') {
            payload.hot = true;
            
            if (modalHotLeadType === 'Demo') {
              payload.real = false;
            } else if (modalHotLeadType === 'Real') {
              payload.real = true;
              
              if (modalDepositStatus === 'Deposit') {
                payload.deposited = true;
              } else if (modalDepositStatus === 'Not Deposit') {
                payload.deposited = false;
              }
            }
          }
        }
      }
      
      const result = await updateLeadTask(selectedLead.id, payload);
      
      if (result.success) {
        toast.success(result?.message || 'Lead status updated successfully!');
        
        const shouldCreateNewTask = ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
        
        if (shouldCreateNewTask) {
          try {
            let taskResult;
            
            if (reminderDateTime) {
              const scheduledDateISO = reminderDateTime.toISOString();
              
              const newTaskData = {
                agentId: selectedLead.agentId,
                leadId: selectedLead.id,
                salesManagerId: selectedLead.salesManagerId || undefined,
                taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`,
                taskDescription: modalRemarks.trim() || 'No additional remarks',
                taskPriority: 'Normal',
                taskScheduledDate: scheduledDateISO,
                taskStatus: 'Open',
                answerStatus: answeredStatus,
                leadRemarks: modalRemarks || '',
                leadResponseStatus: leadResponseStatus || '',
                leadStatus: leadResponseStatus || '',
              };
              
              taskResult = await createTask(newTaskData);
            } else {
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
              console.error('Failed to create task:', taskResult.message);
            }
          } catch (taskError) {
            console.error('Error creating task:', taskError);
          }
        } else {
          try {
            const taskData = {
              leadId: selectedLead?.id,
              leadStatus: leadResponseStatus?.replace(/\s+/g, '') || selectedLead?.status?.replace(/\s+/g, '') || 'Lead',
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
        
        handleClose();
        fetchLeads(currentPage, itemsPerPage);
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error.payload.message || 'Failed to update lead status');
        }
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status. Please try again');
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleCloseModal();
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
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Not Deposit': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Warm': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Hot': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Not Answered': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'Not Interested': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      '-': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const isFormValid = () => {
    if (!answeredStatus) return false;
    if (answeredStatus === 'Not Answered' && taskStatus !== 'Completed') return false;

    if (answeredStatus === 'Answered') {
      if (!modalAnswered) return false;
      
      if (modalAnswered === 'Answered') {
        if (!modalInterested) return false;
        
        if (modalInterested === 'Interested') {
          if (!modalLeadType) return false;
          
          if (modalLeadType === 'Hot') {
            if (!modalHotLeadType) return false;
            
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

  const isStatusDisabled = (statusToCheck) => {
    if (!selectedLead) return false;

    const currentStatus = selectedLead.status || '';
    const kioskStatus = selectedLead.kioskLeadStatus || '';

    // NEW REQUIREMENT: Check Answered Status-based disabling first (for Kiosk Lead Status "Lead")
    if (isUpdateStatusOptionDisabled(statusToCheck)) {
      return true;
    }

    if (currentStatus === 'Lead' || currentStatus === 'lead' ||
        kioskStatus === 'Lead' || kioskStatus === 'lead' ||
        currentStatus === '-' || kioskStatus === '-') {
      // When kioskStatus is "Lead" but status has a meaningful hierarchy value,
      // disable statuses strictly below it (current and above stay enabled)
      const meaningfulStatuses = ['Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
      if ((kioskStatus === 'Lead' || kioskStatus === 'lead') && meaningfulStatuses.includes(currentStatus)) {
        const hierarchy = ['', 'Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
        const currentIdx = hierarchy.indexOf(currentStatus);
        const checkIdx = hierarchy.indexOf(statusToCheck);
        if (checkIdx === -1) return false;
        // Allow "Not Interested" at any point when Answered is selected
        if (statusToCheck === 'Not Interested' && answeredStatus === 'Answered' && modalAnswered === 'Answered') {
          return false;
        }
        return checkIdx < currentIdx; // Disable only strictly below current
      }
      return false; // No meaningful status — don't disable anything
    }

    // "Not Interested" is always available when "Answered" is selected
    if (statusToCheck === 'Not Interested' && answeredStatus === 'Answered' && modalAnswered === 'Answered') {
      return false;
    }

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

    const currentStatusIndex = statusHierarchy.indexOf(currentStatus);
    const allowedKioskStatuses = ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'];

    if (answeredStatus === 'Not Answered' && allowedKioskStatuses.includes(kioskStatus)) {
      // Use 'Not Deposit' index for all Real/Deposit variants so both Deposit and Not Deposit are enabled as siblings
      let kioskHierarchyLevel = -1;
      if (kioskStatus === 'Demo') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Demo');
      } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
        // Use 'Not Deposit' index so both Deposit and Not Deposit are enabled as siblings
        kioskHierarchyLevel = statusHierarchy.indexOf('Not Deposit');
      } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Not Deposit');
      }

      const checkStatusIndex = statusHierarchy.indexOf(statusToCheck);

      if (checkStatusIndex !== -1 && kioskHierarchyLevel !== -1) {
        return checkStatusIndex < kioskHierarchyLevel;
      }
    }

    let effectiveStatusIndex = currentStatusIndex;

    if (kioskStatus === 'Demo') {
      const kioskIndex = statusHierarchy.indexOf('Demo');
      effectiveStatusIndex = Math.max(effectiveStatusIndex, kioskIndex);
    } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
      const kioskIndex = statusHierarchy.indexOf('Deposit');
      effectiveStatusIndex = Math.max(effectiveStatusIndex, kioskIndex);
    } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
      const kioskIndex = statusHierarchy.indexOf('Not Deposit');
      effectiveStatusIndex = Math.max(effectiveStatusIndex, kioskIndex);
    }

    const checkStatusIndex = statusHierarchy.indexOf(statusToCheck);

    if (checkStatusIndex === -1) return false;
    if (effectiveStatusIndex === -1) return false;

    const currentEffectiveStatus = statusHierarchy[effectiveStatusIndex];

    // Allow toggling between Deposit and Not Deposit regardless of current selection
    if ((statusToCheck === 'Deposit' || statusToCheck === 'Not Deposit') &&
        (currentEffectiveStatus === 'Deposit' || currentEffectiveStatus === 'Not Deposit')) {
      return false;
    }

    // Warm/Hot selection fix - ensure at least one is always enabled
    if ((statusToCheck === 'Warm' || statusToCheck === 'Hot') && modalInterested === 'Interested') {
      const warmIndex = statusHierarchy.indexOf('Warm');
      const hotIndex = statusHierarchy.indexOf('Hot');

      if (effectiveStatusIndex === warmIndex || effectiveStatusIndex === hotIndex) {
        if (effectiveStatusIndex === warmIndex) {
          return statusToCheck === 'Warm';
        }
        if (effectiveStatusIndex === hotIndex) {
          return false;
        }
      }
    }

    return checkStatusIndex <= effectiveStatusIndex;
  };

  const isReminderDateEnabled = () => {
    return ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
  };

  const isUpdateStatusDisabled = () => {
    // Disable the entire Update Status section when "Not Answered" is selected
    // EXCEPT: when kioskStatus is "Lead" and status has no meaningful hierarchy value
    if (answeredStatus === 'Not Answered') {
      const kioskStatus = selectedLead?.kioskLeadStatus || '';
      const currentStatus = selectedLead?.status || '';
      const meaningfulStatuses = ['Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
      if ((kioskStatus === 'Lead' || kioskStatus === 'lead') && !meaningfulStatuses.includes(currentStatus)) {
        return false; // Keep section enabled — individual options handled by isUpdateStatusOptionDisabled
      }
      return true;
    }
    return false;
  };

  // NEW: Helper function to check if Update Status options should be disabled based on Answered Status
  const isUpdateStatusOptionDisabled = (statusToCheck) => {
    if (!selectedLead) return false;

    const currentStatus = selectedLead.status || '';
    const kioskStatus = selectedLead.kioskLeadStatus || '';

    // Only apply this logic when Kiosk Lead Status is "Lead"
    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      // If user selected "Answered" in Answered Status section
      if (answeredStatus === 'Answered') {
        // Disable "Not Answered" option in Update Status
        if (statusToCheck === 'Not Answered') {
          return true;
        }
      }
      
      // If user selected "Not Answered" in Answered Status section
      if (answeredStatus === 'Not Answered') {
        // Disable "Answered" option in Update Status, only enable "Not Answered"
        if (statusToCheck === 'Answered') {
          return true;
        }
      }
    }

    return false;
  };

  const isFinalSelectedStatus = (statusValue) => {
    return leadResponseStatus === statusValue && leadResponseStatus !== '';
  };

  const SelectedStatusIndicator = () => (
    <div className="flex items-center gap-1 ml-auto">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
    </div>
  );

  const shouldShowNotInterestedAvailable = () => {
    if (answeredStatus !== 'Answered' || modalAnswered !== 'Answered') return false;
    
    const currentStatus = selectedLead?.status || '';
    const kioskStatus = selectedLead?.kioskLeadStatus || '';
    
    const advancedStatuses = ['Warm', 'Hot', 'Demo', 'Real', 'Deposit', 'Not Deposit', 'Real Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'];
    
    return advancedStatuses.includes(currentStatus) || advancedStatuses.includes(kioskStatus);
  };

  if (!showDetailsModal || !selectedLead) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[#1f1f1f] rounded-2xl shadow-[0_8px_50px_rgba(0,0,0,0.8)] border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Sticky */}
        <div className="sticky top-0 bg-[#262626] border-b border-gray-600 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-white">Lead Details</h2>
            <p className="text-gray-400 text-sm mt-1">{selectedLead.leadId || selectedLead.id.slice(-6)}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 text-gray-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto flex-1 modal-scrollbar">
          <div className="p-6 space-y-6">
            {/* Lead Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Lead Information
              </h3>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Name</span>
                  <span className="text-white text-xs font-medium">{selectedLead.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">ID</span>
                  <span className="text-white text-xs font-mono">{selectedLead.leadId || selectedLead.id.slice(-6)}</span>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span className="text-white text-xs font-mono">{formatPhoneDisplay(selectedLead.phone)}</span>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Email</span>
                    <span className="text-white text-xs">{selectedLead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Nationality</span>
                  <span className="text-white text-xs">{selectedLead.nationality || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Residency</span>
                  <span className="text-white text-xs">{selectedLead.residency || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Language</span>
                  <span className="text-white text-xs">{selectedLead.language || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Source</span>
                  <span className="text-white text-xs">{selectedLead.source}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Lead Task Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status === 'Deposit' || selectedLead.status === 'Not Deposit'
                      ? `Real - ${selectedLead.status}`
                      : selectedLead.status || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Kiosk Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(selectedLead.kioskLeadStatus)}`}>
                    {selectedLead.depositStatus === 'Deposit' || selectedLead.depositStatus === 'Not Deposit' || selectedLead.depositStatus === 'No Deposit'
                      ? `Real - ${selectedLead.depositStatus}`
                      : selectedLead.kioskLeadStatus || 'N/A'}
                  </span>
                </div>
              </div>
              {selectedLead.remarks && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {selectedLead.chatbotMessage?.length ? (
                    selectedLead.chatbotMessage.map((item, index) => (
                      <span key={index} className="block mb-0.5">{item}</span>
                    ))
                  ) : (
                    selectedLead.remarks || 'No remarks'
                  )}
                </p>
              )}
            </div>

            {/* Status Options */}
            <div className="border-t border-white/[0.06] pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest">Update Task</h3>
                
                {/* Date Time Picker */}
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
                      className={`px-3 py-2 pl-10 rounded-lg bg-white/[0.04] text-white border focus:border-[#BBA473]/50 focus:outline-none focus:ring-2 focus:ring-[#BBA473]/20 transition-all duration-300 text-sm ${
                        isReminderDateEnabled() ? 'cursor-pointer border-white/10' : 'cursor-not-allowed border-gray-600 opacity-50'
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

                <div className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 bg-green-500/8 border-green-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-400">Mark as Completed</p>
                      <p className="text-xs text-gray-400 mt-0.5">Task will be marked as complete</p>
                    </div>
                  </div>

                  {/* Toggle Switch - Always ON */}
                  <div className="relative inline-flex h-7 w-14 items-center rounded-full bg-green-500">
                    <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg translate-x-8" />
                  </div>
                </div>
              </div>

              {/* Answered Status Section */}
              <div className="space-y-4 mb-6">
                <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                  Answered Status <span className="text-red-400">*</span>
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    answeredStatus === 'Answered'
                      ? 'bg-[#BBA473]/10 border-[#BBA473]/40 ring-1 ring-[#BBA473]/30 cursor-pointer'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-[#BBA473]/10 hover:border-[#BBA473]/30 cursor-pointer'
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
                      ? 'bg-[#BBA473]/10 border-[#BBA473]/40 ring-1 ring-[#BBA473]/30 cursor-pointer'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-[#BBA473]/10 hover:border-[#BBA473]/30 cursor-pointer'
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
                
                {modalErrors.answeredStatus && (
                  <div className="text-red-400 text-sm animate-pulse flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{modalErrors.answeredStatus}</span>
                  </div>
                )}
                
                {answeredStatus === 'Not Answered' && (
                  <div className="mt-3 p-3 bg-orange-500/[0.08] border border-orange-500/20 rounded-xl flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-orange-400 text-sm font-medium">
                        {selectedLead && (selectedLead.kioskLeadStatus === 'Lead' || selectedLead.kioskLeadStatus === 'lead' || selectedLead.kioskLeadStatus === '-' || selectedLead.status === 'Lead' || selectedLead.status === 'lead' || selectedLead.status === '-')
                          ? 'All Status Options Enabled'
                          : selectedLead && ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'].includes(selectedLead.kioskLeadStatus || '')
                            ? 'Lead Has Not Responded'
                            : 'Update Status Disabled'}
                      </p>
                      <p className="text-orange-300 text-xs mt-1">
                        {selectedLead && (selectedLead.kioskLeadStatus === 'Lead' || selectedLead.kioskLeadStatus === 'lead' || selectedLead.kioskLeadStatus === '-' || selectedLead.status === 'Lead' || selectedLead.status === 'lead' || selectedLead.status === '-')
                          ? `Since the status is "Lead", you can select any status without restrictions in the Update Status section below. ${taskStatus === 'Completed' ? 'Toggle the Task Status above to save.' : 'Please enable the Task Completion toggle above to save.'}`
                          : selectedLead && ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'].includes(selectedLead.kioskLeadStatus || '')
                            ? `Since the Kiosk Lead Status is "${selectedLead.kioskLeadStatus}", you can select statuses at the same level or higher in the Update Status section below. ${taskStatus === 'Completed' ? 'Toggle the Task Status above to save.' : 'Please enable the Task Completion toggle above to save.'}`
                            : taskStatus === 'Completed'
                              ? 'When "Not Answered" is selected, you can only toggle the Task Status above. The Update Status section below is disabled.'
                              : 'To save with "Not Answered", please enable the Task Completion toggle above first.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Update Status Section */}
              <div className={`space-y-4 ${isUpdateStatusDisabled() ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                  Update Status
                </label>

                {/* Level 1: Answered / Not Answered */}
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                    isStatusDisabled('Answered') || isUpdateStatusDisabled()
                      ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                      ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                      : isFinalSelectedStatus('Not Answered')
                        ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                    <span className={`font-medium ${isFinalSelectedStatus('Not Answered') ? 'text-green-400' : 'text-white'}`}>Not Answered</span>
                    {isFinalSelectedStatus('Not Answered') && <SelectedStatusIndicator />}
                  </label>
                </div>

                {/* Level 2: Interested / Not Interested */}
                {modalAnswered === 'Answered' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Interested')
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : isFinalSelectedStatus('Not Interested')
                            ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                            : shouldShowNotInterestedAvailable()
                              ? 'bg-white/[0.04] hover:bg-white/[0.07] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/40 animate-pulse-border-subtle'
                              : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                      {!isLeadsSelectedId && (
                        <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                          isStatusDisabled('Warm')
                            ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                            : isFinalSelectedStatus('Warm')
                              ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                              : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                          <span className={`font-medium ${isFinalSelectedStatus('Warm') ? 'text-green-400' : 'text-white'}`}>Warm Lead</span>
                          {isFinalSelectedStatus('Warm') && <SelectedStatusIndicator />}
                        </label>
                      )}

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Hot')
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : isFinalSelectedStatus('Hot')
                            ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Demo')
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : isFinalSelectedStatus('Demo')
                            ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                        <span className={`font-medium ${isFinalSelectedStatus('Demo') ? 'text-green-400' : 'text-white'}`}>Demo</span>
                        {isFinalSelectedStatus('Demo') && <SelectedStatusIndicator />}
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Real')
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                  <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] animate-fadeIn">
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
                          className="w-5 h-5 rounded border border-white/10 bg-white/[0.04] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/20 cursor-pointer transition-all"
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
                          className="w-5 h-5 rounded border border-white/10 bg-white/[0.04] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/20 cursor-pointer transition-all"
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
                          className="w-5 h-5 rounded border border-white/10 bg-white/[0.04] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/20 cursor-pointer transition-all"
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
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : isFinalSelectedStatus('Deposit')
                            ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                        <span className={`font-medium ${isFinalSelectedStatus('Deposit') ? 'text-green-400' : 'text-white'}`}>Deposit</span>
                        {isFinalSelectedStatus('Deposit') && <SelectedStatusIndicator />}
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                        isStatusDisabled('Not Deposit')
                          ? 'bg-white/[0.02] cursor-not-allowed opacity-40 border-gray-800'
                          : isFinalSelectedStatus('Not Deposit')
                            ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)] cursor-pointer scale-[1.01]'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer border-[#BBA473]/10 hover:border-[#BBA473]/30'
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
                        <span className={`font-medium ${isFinalSelectedStatus('Not Deposit') ? 'text-green-400' : 'text-white'}`}>Not Deposit</span>
                        {isFinalSelectedStatus('Not Deposit') && <SelectedStatusIndicator />}
                      </label>
                    </div>
                    {modalErrors.depositStatus && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.depositStatus}</div>
                    )}
                  </div>
                )}

              </div>

              {/* Remarks - Always active regardless of answered status */}
              <div className="space-y-2 pt-4">
                <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
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
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white/[0.04] text-white resize-none transition-all duration-300 ${
                    modalErrors.remarks
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : 'border-white/[0.06] focus:border-[#BBA473]/50 focus:ring-[#BBA473]/20 hover:border-white/10'
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

              {/* Task Title - inside disabled wrapper */}
              <div className={`${isUpdateStatusDisabled() ? 'opacity-40 pointer-events-none' : ''}`}>
                {/* Task Title */}
                <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                  <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                    Task Title <span className="text-xs text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="taskTitle"
                    placeholder={`Default: Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`}
                    value={`Follow Up with lead ( ${leadResponseStatus || selectedLead?.status} - lead )`}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    maxLength={100}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white/[0.04] text-white transition-all duration-300 border-white/[0.06] focus:border-[#BBA473]/50 focus:ring-[#BBA473]/20 hover:border-white/10"
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
          </div>
        </div>

        {/* Action Buttons - Sticky */}
        <div className="sticky bottom-0 bg-[#262626] border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-xl font-semibold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-[0.98] border border-white/5 hover:border-white/10"
            >
              Close
            </button>
            {!isLeadsSelectedId && (
              <button
                onClick={handleModalSubmit}
                disabled={!isFormValid()}
                className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                  isFormValid()
                    ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:shadow-[#BBA473]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#BBA473]/10'
                    : 'bg-gradient-to-r from-[#6b6354] to-[#5a5447] text-gray-400 cursor-not-allowed transform-none shadow-none'
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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes pulse-border-subtle {
          0%, 100% {
            border-color: rgba(187, 164, 115, 0.15);
            box-shadow: 0 0 0 0 rgba(187, 164, 115, 0);
          }
          50% {
            border-color: rgba(187, 164, 115, 0.4);
            box-shadow: 0 0 8px 2px rgba(187, 164, 115, 0.2);
          }
        }
        
        .animate-pulse-border-subtle {
          animation: pulse-border-subtle 2.5s ease-in-out infinite;
        }

        /* Custom DatePicker Styling */
        .custom-datepicker {
          background-color: #0C0C0C !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 12px !important;
          font-family: inherit !important;
        }

        .react-datepicker {
          background-color: #0C0C0C !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 12px !important;
        }

        .react-datepicker__header {
          background-color: #0C0C0C !important;
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
          background-color: #0C0C0C;
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

        /* Modal Scrollbar */
        .modal-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(187, 164, 115, 0.15);
          border-radius: 10px;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(187, 164, 115, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AssignLeadModal;