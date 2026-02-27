import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
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
      setTaskStatus('Completed'); // Always Completed
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

      console.log('🔍 PRE-POPULATION: currentStatus =', JSON.stringify(currentStatus), '| kioskStatus =', JSON.stringify(kioskStatus), '| kioskDepositStatus =', JSON.stringify(task.kioskDepositStatus));

      if (!currentStatus || currentStatus === '') {
        // No status set yet - but check kiosk status
        if (kioskStatus === 'Demo') {
          setAnsweredStatus('Answered');
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
        } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'Real No Deposit' || kioskStatus === 'No Deposit') {
          setAnsweredStatus('Answered');
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
          setAnsweredStatus('Answered');
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
        setAnsweredStatus('Not Answered');
        setModalAnswered('Not Answered');
        setLeadResponseStatus('Not Answered');
        resetSubSelections();
      } else if (currentStatus === 'Not Interested') {
        setAnsweredStatus('Answered');
        setModalAnswered('Answered');
        setModalInterested('Not Interested');
        setLeadResponseStatus('Not Interested');
        setModalLeadType('');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (currentStatus === 'Warm') {
        setAnsweredStatus('Answered');
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Warm');
        setLeadResponseStatus('Warm');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (currentStatus === 'Hot') {
        setAnsweredStatus('Answered');
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setLeadResponseStatus('Hot');
        setModalHotLeadType('');
        setModalDepositStatus('');
      } else if (currentStatus === 'Demo' || kioskStatus === 'Demo') {
        setAnsweredStatus('Answered');
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Demo');
        setLeadResponseStatus('Demo');
        setModalDepositStatus('');
      } else if (currentStatus === 'Not Deposit' || currentStatus === 'Real - Not Deposit' ||
        kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' ||
        kioskStatus === 'Real No Deposit' || kioskStatus === 'No Deposit') {
        console.log('🔍 PRE-POP: Entered NOT DEPOSIT branch');
        setAnsweredStatus('Answered');
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Not Deposit');
        setLeadResponseStatus('Not Deposit');
      } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' ||
          kioskStatus === 'Deposit' || currentStatus === 'Deposit' ||
          currentStatus === 'Real - Deposit') {
        const leadDepositStatus = task.kioskDepositStatus || '';
        console.log('🔍 PRE-POP: Entered DEPOSIT branch. leadDepositStatus =', JSON.stringify(leadDepositStatus));
        if (leadDepositStatus === 'Not Deposit' || leadDepositStatus === 'No Deposit') {
          setAnsweredStatus('Answered');
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        } else {
          setAnsweredStatus('Answered');
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Deposit');
          setLeadResponseStatus('Deposit');
        }
      }
    }
  }, [task]);

  // Auto-enable task completion when reaching Demo or higher
  useEffect(() => {
    const kioskStatus = task?.kioskLeadStatus || '';
    
    // For "Lead" status, don't auto-enable - but still allow manual control
    // For all other statuses, maintain existing auto-enable behavior
    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      return; // Skip auto-enable for Lead status
    }

    // Original logic for all other statuses
    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    if (allowedStatuses.includes(leadResponseStatus)) {
      setTaskStatus('Completed');
    }
  }, [leadResponseStatus, task]);

  // Auto-reset to default valid selection when answeredStatus changes and current selection becomes disabled
  useEffect(() => {
    if (!task) return;

    const currentStatus = task.taskCreationStatus || '';
    const kioskStatus = task.kioskLeadStatus || '';

    // For Kiosk Lead Status "Lead": only reset if taskCreationStatus has no meaningful hierarchy value
    // If taskCreationStatus is e.g. "Warm", preserve those selections so the modal starts from Warm
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
      // Map kiosk status to determine what should be selected
      if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit' ||
          kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
        // Don't force deposit status - let user keep their current selection
        // Both Deposit and Not Deposit should remain selectable
      } else if (kioskStatus === 'Demo') {
        // Demo level - ensure Demo is selected
        if (modalHotLeadType !== 'Demo') {
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
        }
      } else if (currentStatus === 'Warm') {
        // Warm level - ensure Warm is selected
        if (modalLeadType !== 'Warm' || leadResponseStatus !== 'Warm') {
          setModalLeadType('Warm');
          setLeadResponseStatus('Warm');
          setModalHotLeadType('');
          setModalDepositStatus('');
        }
      }
    }
  }, [answeredStatus, task]);

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

    // Task status is always Completed — no validation needed

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
      // If "Answered" is selected in Update Status section, must select Interested/Not Interested
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

    // NEW: Answered Status is mandatory
    if (!answeredStatus) return false;

    // MODIFIED: Only validate Update Status if "Answered" is selected in Answered Status
    if (answeredStatus === 'Answered') {
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


  // Point 3: Check if reminder date should be enabled (Warm to Deposit only)
  const isReminderDateEnabled = () => {
    return ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
  };

  // Helper to determine if "Not Interested" should show special availability indicator
const shouldShowNotInterestedAvailable = () => {
  if (answeredStatus !== 'Answered' || modalAnswered !== 'Answered') return false;
  
  const currentStatus = task?.taskCreationStatus || '';
  const kioskStatus = task?.kioskLeadStatus || '';
  
  // List of statuses that are beyond "Not Interested"
  const advancedStatuses = ['Warm', 'Hot', 'Demo', 'Real', 'Deposit', 'Not Deposit', 'Real Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'];
  
  return advancedStatuses.includes(currentStatus) || advancedStatuses.includes(kioskStatus);
};

// NEW: Helper function to check if Update Status options should be disabled based on Answered Status
const isUpdateStatusOptionDisabled = (statusToCheck) => {
  if (!task) return false;

  const currentStatus = task.taskCreationStatus || '';
  const kioskStatus = task.kioskLeadStatus || '';

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

  // Point 5: Check if a lead response option should be disabled (previous statuses)
  // Status hierarchy: Not Answered < Not Interested < Warm < Hot < Demo < Not Deposit < Deposit
  const isStatusDisabled = (statusToCheck) => {
    if (!task) return false;

    const currentStatus = task.taskCreationStatus || '';
    const kioskStatus = task.kioskLeadStatus || '';

    // NEW REQUIREMENT: Check Answered Status-based disabling first (for Kiosk Lead Status "Lead")
    if (isUpdateStatusOptionDisabled(statusToCheck)) {
      return true;
    }

    // If Lead Task Status or Kiosk Lead Status is "Lead", check if taskCreationStatus has a real hierarchy value
    if (currentStatus === 'Lead' || currentStatus === 'lead' ||
        kioskStatus === 'Lead' || kioskStatus === 'lead' ||
        currentStatus === '-' || kioskStatus === '-') {
      // When kioskStatus is "Lead" but taskCreationStatus has a meaningful hierarchy value,
      // disable statuses strictly below it (current and above stay enabled)
      const meaningfulStatuses = ['Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
      if ((kioskStatus === 'Lead' || kioskStatus === 'lead') && meaningfulStatuses.includes(currentStatus)) {
        const hierarchy = ['', 'Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
        const currentIdx = hierarchy.indexOf(currentStatus);
        const checkIdx = hierarchy.indexOf(statusToCheck);
        if (checkIdx === -1) return false; // Unknown status, don't disable
        // Allow "Not Interested" at any point when Answered is selected
        if (statusToCheck === 'Not Interested' && answeredStatus === 'Answered' && modalAnswered === 'Answered') {
          return false;
        }
        return checkIdx < currentIdx; // Disable only strictly below current
      }
      return false; // No meaningful status — don't disable anything
    }

    // SPECIAL RULE: "Not Interested" is always available when "Answered" is selected in Answered Status
// This allows users to mark leads as "Not Interested" at any point in the journey
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

    // List of kiosk statuses that should allow sibling selection when "Not Answered" is selected
    const allowedKioskStatuses = ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'];

    // NEW REQUIREMENT: If user selects "Not Answered" and kiosk status is in allowed list,
    // allow selecting sibling statuses at the same level
    if (answeredStatus === 'Not Answered' && allowedKioskStatuses.includes(kioskStatus)) {
      // Map kiosk status to its hierarchy level
      // Use 'Not Deposit' index for all Real/Deposit variants so both Deposit and Not Deposit are enabled as siblings
      let kioskHierarchyLevel = -1;
      if (kioskStatus === 'Demo') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Demo');
      } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Not Deposit');
      } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Not Deposit');
      }

      const checkStatusIndex = statusHierarchy.indexOf(statusToCheck);

      // Allow selecting statuses at the same level (siblings) or higher
      // Disable only statuses that are strictly lower than the kiosk status level
      if (checkStatusIndex !== -1 && kioskHierarchyLevel !== -1) {
        return checkStatusIndex < kioskHierarchyLevel;
      }
    }

    // Determine the effective status index (higher of taskCreationStatus or kioskLeadStatus)
    let effectiveStatusIndex = currentStatusIndex;

    // Map kiosk status to hierarchy
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

    // If checking status not found, don't disable
    if (checkStatusIndex === -1) return false;

    // If no effective status set, don't disable anything
    if (effectiveStatusIndex === -1) return false;

    // Get current effective status
    const currentEffectiveStatus = statusHierarchy[effectiveStatusIndex];

// CRITICAL FIX: Special handling for Deposit/Not Deposit mutual exclusivity
// Always allow toggling between Deposit and Not Deposit regardless of current selection
// This fixes both issues where users couldn't switch between these sibling statuses
if ((statusToCheck === 'Deposit' || statusToCheck === 'Not Deposit') && 
    (currentEffectiveStatus === 'Deposit' || currentEffectiveStatus === 'Not Deposit')) {
  return false;
}

    // ✅ FIX: Warm/Hot selection - ensure at least one is always enabled
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

    // Disable if the status to check is before or equal to effective status
    return checkStatusIndex <= effectiveStatusIndex;
  };

  // MODIFIED: Update Status section should be disabled if task is unassigned OR if "Not Answered" is selected
  // BUT NOT when kiosk status is at certain levels (handled by isStatusDisabled)
  const isUpdateStatusDisabled = () => {
    // Disable if task is unassigned
    if (isTaskUnassigned) return true;

    // Disable the entire Update Status section when "Not Answered" is selected
    // EXCEPT: when kioskStatus is "Lead" and taskCreationStatus has no meaningful hierarchy value
    // (e.g. "Assigned") — in that case keep the section enabled so the user can select "Not Answered"
    if (answeredStatus === 'Not Answered') {
      const kioskStatus = task?.kioskLeadStatus || '';
      const currentStatus = task?.taskCreationStatus || '';
      const meaningfulStatuses = ['Not Answered', 'Not Interested', 'Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'];
      if ((kioskStatus === 'Lead' || kioskStatus === 'lead') && !meaningfulStatuses.includes(currentStatus)) {
        return false; // Keep section enabled — individual options handled by isUpdateStatusOptionDisabled
      }
      return true;
    }

    return false;
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !task) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      onClick={handleClose}
    >
      <div
        className={`bg-[#1f1f1f] rounded-2xl shadow-[0_8px_50px_rgba(0,0,0,0.8)] border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Sticky */}
        <div className="sticky top-0 bg-[#262626] border-b border-gray-600 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#BBA473]/10">
              <FileText className="w-4 h-4 text-[#BBA473]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Task Details</h2>
              <p className="text-gray-500 text-xs font-mono">{task.taskId}</p>
            </div>
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
          <div className="p-6 space-y-5">
            {/* NEW: Unassigned Task Warning */}
            {isTaskUnassigned && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-semibold">Unassigned Task</p>
                  <p className="text-red-300/80 text-xs mt-1">
                    This task is currently unassigned. Please assign this task to an agent before updating the status. All status updates are disabled until the task is assigned.
                  </p>
                </div>
              </div>
            )}

            {/* Task Information */}
            <div className="space-y-3">
              <div>
                <p className="text-white text-base font-semibold">{task.title}</p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{task.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Priority</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Scheduled</span>
                  <span className="text-white text-xs font-medium">{formatScheduledDate(task.taskScheduledDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Assigned</span>
                  <span className={`text-xs font-medium ${isTaskUnassigned ? 'text-red-400' : 'text-white'}`}>
                    {task.assignedTo}
                    {task.assignedToUsername && <span className="text-gray-500 ml-1">@{task.assignedToUsername}</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Information */}
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Lead Information
              </h3>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Name</span>
                  <span className="text-white text-xs font-medium">{task.leadName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">ID</span>
                  <span className="text-white text-xs font-mono">{task.leadId}</span>
                </div>
                {task.leadPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span className="text-white text-xs font-mono">{formatPhoneDisplay(task.leadPhone)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Task Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(task.taskCreationStatus)}`}>
                    {(task.taskCreationStatus == 'Deposit' || task.taskCreationStatus == 'Not Deposit') ? `Real - ${task.taskCreationStatus}` : task.taskCreationStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Kiosk Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(task.kioskLeadStatus)}`}>
                    {(task.kioskDepositStatus == 'Deposit' || task.kioskDepositStatus == 'Not Deposit' || task.kioskDepositStatus == 'No Deposit') ? `Real - ${task.kioskDepositStatus}` : task.kioskLeadStatus}
                  </span>
                </div>
              </div>
              {task.leadDescription && (
                <p className="text-gray-400 text-sm">{task.leadDescription}</p>
              )}
            </div>

            {/* Update Task Status */}
            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Update Task
                </h3>

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
                      className={`px-3 py-2 pl-10 rounded-lg bg-white/[0.04] text-white border focus:border-[#BBA473] focus:outline-none focus:ring-2 focus:ring-[#BBA473]/30 transition-all duration-300 text-sm hover:border-[#BBA473]/50 ${isReminderDateEnabled() ? 'cursor-pointer border-white/10' : 'cursor-not-allowed border-gray-700 opacity-40'
                        }`}
                      calendarClassName="custom-datepicker"
                      wrapperClassName="w-full"
                      timeCaption="Time"
                    />
                    <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isReminderDateEnabled() ? 'text-[#BBA473]' : 'text-gray-600'
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

              {/* NEW: Answered Status Section */}
              <div className="space-y-3 mb-6">
                <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                  Answered Status <span className="text-red-400">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border ${isTaskUnassigned
                    ? 'bg-white/[0.02] cursor-not-allowed opacity-50 border-gray-800'
                    : answeredStatus === 'Answered'
                      ? 'bg-[#BBA473]/10 border-[#BBA473]/40 cursor-pointer'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/10 cursor-pointer'
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

                  <label className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border ${isTaskUnassigned
                    ? 'bg-white/[0.02] cursor-not-allowed opacity-50 border-gray-800'
                    : answeredStatus === 'Not Answered'
                      ? 'bg-[#BBA473]/10 border-[#BBA473]/40 cursor-pointer'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/10 cursor-pointer'
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

                {/* MODIFIED: Updated info message when "Not Answered" is selected */}
                {answeredStatus === 'Not Answered' && (
                  <div className="mt-3 p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-orange-400 text-sm font-medium">
                        {task && (task.kioskLeadStatus === 'Lead' || task.kioskLeadStatus === 'lead' || task.kioskLeadStatus === '-' || task.taskCreationStatus === 'Lead' || task.taskCreationStatus === 'lead' || task.taskCreationStatus === '-')
                          ? 'All Status Options Enabled'
                          : task && ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'].includes(task.kioskLeadStatus || '')
                            ? 'Lead Has Not Responded'
                            : 'Update Status Disabled'}
                      </p>
                      <p className="text-orange-300 text-xs mt-1">
                        {task && (task.kioskLeadStatus === 'Lead' || task.kioskLeadStatus === 'lead' || task.kioskLeadStatus === '-' || task.taskCreationStatus === 'Lead' || task.taskCreationStatus === 'lead' || task.taskCreationStatus === '-')
                          ? `Since the status is "Lead", you can select any status without restrictions in the Update Status section below. ${taskStatus === 'Completed' ? 'Toggle the Task Status above to save.' : 'Please enable the Task Completion toggle above to save.'}`
                          : task && ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'].includes(task.kioskLeadStatus || '')
                            ? `Since the Kiosk Lead Status is "${task.kioskLeadStatus}", you can select statuses at the same level or higher in the Update Status section below. ${taskStatus === 'Completed' ? 'Toggle the Task Status above to save.' : 'Please enable the Task Completion toggle above to save.'}`
                            : taskStatus === 'Completed'
                              ? 'When "Not Answered" is selected, you can only toggle the Task Status above. The Update Status section below is disabled.'
                              : 'To save with "Not Answered", please enable the Task Completion toggle above first.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead Response Status Update */}
              <div className={`space-y-3 ${isUpdateStatusDisabled() ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                  Update Status
                </label>

                {/* Level 1: Answered / Not Answered - Point 5: Disable previous statuses */}
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Answered') || isUpdateStatusDisabled()
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

                  <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Not Answered') || isUpdateStatusDisabled()
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
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Interested')
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

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Not Interested')
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
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Warm')
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

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Hot')
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
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Demo')
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

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Real')
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
                      <span className="text-xs">Demo Steps</span>
                      <span className="text-[10px] text-gray-500">(First 2 required)</span>
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
                          className="w-5 h-5 rounded border border-white/10 bg-white/[0.04] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/30 cursor-pointer transition-all"
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
                          className="w-5 h-5 rounded border border-white/10 bg-white/[0.04] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/30 cursor-pointer transition-all"
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
                          className="w-5 h-5 rounded border border-white/10 bg-white/[0.04] checked:bg-[#BBA473] checked:border-[#BBA473] focus:ring-2 focus:ring-[#BBA473]/30 cursor-pointer transition-all"
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
                {console.log('🔍 RENDER STATE: answeredStatus=', answeredStatus, '| modalAnswered=', modalAnswered, '| modalInterested=', modalInterested, '| modalLeadType=', modalLeadType, '| modalHotLeadType=', modalHotLeadType, '| modalDepositStatus=', modalDepositStatus, '| leadResponseStatus=', leadResponseStatus)}
                {modalHotLeadType === 'Real' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Deposit')
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

                      <label className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${isStatusDisabled('Not Deposit')
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
                  rows="3"
                  value={modalRemarks}
                  onChange={(e) => {
                    setModalRemarks(e.target.value);
                    if (modalErrors.remarks) {
                      setModalErrors({ ...modalErrors, remarks: '' });
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white/[0.04] text-white text-sm resize-none transition-all duration-300 placeholder-gray-600 ${modalErrors.remarks
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/30'
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
            </div>
          </div>
        </div>

        {/* Action Buttons - Sticky */}
        <div className="sticky bottom-0 bg-[#262626] border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full flex-1 px-4 py-3 rounded-xl font-semibold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 hover:border-white/10"
            >
              Close
            </button>
            <button
              onClick={handleModalSubmit}
              disabled={!isFormValid() || isSubmitting}
              className={`max-w-full btn-animated btn-gold flex justify-center mx-auto !w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold py-3 rounded-xl disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/10 hover:shadow-[#BBA473]/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${isFormValid() && !isSubmitting
                ? 'cursor-pointer'
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

        @keyframes pulse-border-subtle {
    0%, 100% {
      border-color: rgba(187, 164, 115, 0.15);
      box-shadow: 0 0 0 0 rgba(187, 164, 115, 0);
    }
    50% {
      border-color: rgba(187, 164, 115, 0.4);
      box-shadow: 0 0 12px 2px rgba(187, 164, 115, 0.1);
    }
  }

  .animate-pulse-border-subtle {
    animation: pulse-border-subtle 2.5s ease-in-out infinite;
  }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
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

        /* Custom DatePicker Styling */
        .custom-datepicker {
          background-color: #0C0C0C !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          font-family: inherit !important;
        }

        .react-datepicker {
          background-color: #0C0C0C !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
        }

        .react-datepicker__header {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
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
          border: 1px solid rgba(187, 164, 115, 0.2);
          border-radius: 12px;
          border-left: 1px solid rgba(187, 164, 115, 0.15) !important;
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