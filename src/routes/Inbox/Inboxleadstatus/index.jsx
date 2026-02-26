import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { updateLeadTask } from '../../../services/leadService';
import { createAutoTask, createTask } from '../../../services/taskService';
import toast from 'react-hot-toast';

const InboxLeadStatus = ({ contact, refreshContacts }) => {
  const [taskStatus, setTaskStatus] = useState('');
  const [leadResponseStatus, setLeadResponseStatus] = useState('');
  const [answeredStatus, setAnsweredStatus] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  const [taskTitle, setTaskTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState(null);
  
  const [modalAnswered, setModalAnswered] = useState('');
  const [modalInterested, setModalInterested] = useState('');
  const [modalLeadType, setModalLeadType] = useState('');
  const [modalHotLeadType, setModalHotLeadType] = useState('');
  const [modalDepositStatus, setModalDepositStatus] = useState('');

  const [demoInstallApp, setDemoInstallApp] = useState(false);
  const [demoEducationVideo, setDemoEducationVideo] = useState(false);
  const [demoAnalyzeChannel, setDemoAnalyzeChannel] = useState(false);

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

  useEffect(() => {
    if (contact) {
      setModalRemarks(contact.latestRemarks || '');
      setTaskTitle('');
      setReminderDateTime(null);
      setTaskStatus('');
      
      setDemoInstallApp(false);
      setDemoEducationVideo(false);
      setDemoAnalyzeChannel(false);
      
      const currentStatus = contact.status || '';
      const kioskStatus = contact.kioskLeadStatus || '';

      // Set initial answered status based on contact data
      if (contact.contacted && contact.answered) {
        setAnsweredStatus('Answered');
      } else if (contact.contacted && !contact.answered) {
        setAnsweredStatus('Not Answered');
      } else {
        setAnsweredStatus('');
      }

      if (!currentStatus || currentStatus === '') {
        if (kioskStatus === 'Demo') {
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
          setDemoInstallApp(true);
          setDemoEducationVideo(true);
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
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Demo');
        setLeadResponseStatus('Demo');
        setModalDepositStatus('');
        setDemoInstallApp(true);
        setDemoEducationVideo(true);
      } else if (currentStatus === 'Not Deposit' || currentStatus === 'Real - Not Deposit' || 
        kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || 
        kioskStatus === 'Real No Deposit' || kioskStatus === 'No Deposit') {
        setModalAnswered('Answered');
        setModalInterested('Interested');
        setModalLeadType('Hot');
        setModalHotLeadType('Real');
        setModalDepositStatus('Not Deposit');
        setLeadResponseStatus('Not Deposit');
      } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || 
        kioskStatus === 'Deposit' || currentStatus === 'Deposit' || 
        currentStatus === 'Real - Deposit') {
        const leadDepositStatus = contact.kioskDepositStatus || '';
        
        if (leadDepositStatus === 'Not Deposit' || leadDepositStatus === 'No Deposit') {
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        } else {
          setModalAnswered('Answered');
          setModalInterested('Interested');
          setModalLeadType('Hot');
          setModalHotLeadType('Real');
          setModalDepositStatus('Deposit');
          setLeadResponseStatus('Deposit');
        }
      }
    }
  }, [contact]);

  useEffect(() => {
    const kioskStatus = contact?.kioskLeadStatus || '';
    
    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      return;
    }

    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    if (allowedStatuses.includes(leadResponseStatus)) {
      setTaskStatus('Completed');
    }
  }, [leadResponseStatus, contact]);

  useEffect(() => {
    if (!contact) return;

    const kioskStatus = contact.kioskLeadStatus || '';

    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      resetAllSelections();
      return;
    }

    if (answeredStatus === 'Not Answered') {
      if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
        if (modalDepositStatus === 'Not Deposit') {
          setModalDepositStatus('Deposit');
          setLeadResponseStatus('Deposit');
        }
      } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
        if (modalDepositStatus === 'Deposit') {
          setModalDepositStatus('Not Deposit');
          setLeadResponseStatus('Not Deposit');
        }
      } else if (kioskStatus === 'Demo') {
        if (modalHotLeadType !== 'Demo') {
          setModalHotLeadType('Demo');
          setLeadResponseStatus('Demo');
          setModalDepositStatus('');
        }
      }
    }
  }, [answeredStatus, contact]);

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
      
      const result = await updateLeadTask(contact.id, payload);
      
      if (result.success) {
        toast.success(result?.message || 'Lead status updated successfully!');
        
        const shouldCreateNewTask = ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
        
        if (shouldCreateNewTask) {
          try {
            let taskResult;
            
            if (reminderDateTime) {
              const scheduledDateISO = reminderDateTime.toISOString();
              
              const newTaskData = {
                agentId: contact.agentId,
                leadId: contact.id,
                salesManagerId: contact.salesManagerId || undefined,
                taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || contact?.status} - lead )`,
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
                leadId: contact.id,
                leadStatus: leadResponseStatus || '',
                taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || contact?.status} - lead )`,
                taskDescription: modalRemarks.trim() || 'No additional remarks',
                taskStatus: 'Completed',
              };
              
              taskResult = await createAutoTask(autoTaskData);
            }

            if (taskResult.success) {
              toast.success(taskResult.message || 'Task created successfully!');
            }
          } catch (taskError) {
            console.error('Error creating task:', taskError);
          }
        } else {
          try {
            const taskData = {
              leadId: contact?.id,
              leadStatus: leadResponseStatus?.replace(/\s+/g, '') || contact?.status?.replace(/\s+/g, '') || 'Lead',
              taskTitle: taskTitle.trim() || `Follow Up with lead ( ${leadResponseStatus || contact?.status} - lead )`,
              taskDescription: modalRemarks.trim() || 'No additional remarks',
              taskStatus: 'Completed',
            };

            const taskResult = await createAutoTask(taskData);

            if (taskResult.success) {
              toast.success(taskResult.message || 'Task created successfully!');
            }
          } catch (taskError) {
            console.error('Error creating task:', taskError);
          }
        }
        
        if (refreshContacts) {
          refreshContacts();
        }
      } else {
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          toast.error(result.error?.payload?.message || 'Failed to update lead status');
        }
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status. Please try again');
    }
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+\d{1,4})(\d+)/, '$1 $2').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const isFormValid = () => {
    if (!answeredStatus) return false;
    if (answeredStatus === 'Not Answered' && taskStatus !== 'Completed') return false;

    if (answeredStatus === 'Answered') {
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

  const isUpdateStatusOptionDisabled = (statusToCheck) => {
    if (!contact) return false;

    const kioskStatus = contact.kioskLeadStatus || '';

    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      if (answeredStatus === 'Answered') {
        if (statusToCheck === 'Not Answered') {
          return true;
        }
      }
      
      if (answeredStatus === 'Not Answered') {
        if (statusToCheck === 'Answered') {
          return true;
        }
      }
    }

    return false;
  };

  const isStatusDisabled = (statusToCheck) => {
    if (!contact) return false;

    const currentStatus = contact.status || '';
    const kioskStatus = contact.kioskLeadStatus || '';

    if (isUpdateStatusOptionDisabled(statusToCheck)) {
      return true;
    }

    if (currentStatus === 'Lead' || currentStatus === 'lead' || 
        kioskStatus === 'Lead' || kioskStatus === 'lead' || 
        currentStatus === '-' || kioskStatus === '-') {
      return false;
    }

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
      let kioskHierarchyLevel = -1;
      if (kioskStatus === 'Demo') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Demo');
      } else if (kioskStatus === 'Real' || kioskStatus === 'Real Deposit' || kioskStatus === 'Deposit') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Deposit');
      } else if (kioskStatus === 'Not Deposit' || kioskStatus === 'Real Not Deposit' || kioskStatus === 'No Deposit' || kioskStatus === 'Real No Deposit') {
        kioskHierarchyLevel = statusHierarchy.indexOf('Not Deposit');
      }

      const checkStatusIndex = statusHierarchy.indexOf(statusToCheck);

      if (checkStatusIndex !== -1 && kioskHierarchyLevel !== -1) {
        // FIX: Warm/Hot - only disable Warm, keep Hot enabled
        if ((statusToCheck === 'Warm' || statusToCheck === 'Hot') && kioskHierarchyLevel >= statusHierarchy.indexOf('Warm')) {
          return statusToCheck === 'Warm';
        }
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

    if ((statusToCheck === 'Deposit' || statusToCheck === 'Not Deposit') &&
        (currentEffectiveStatus === 'Deposit' || currentEffectiveStatus === 'Not Deposit')) {
      return false;
    }

    // FIX: Warm/Hot selection - ensure at least one is always enabled
    // When effective status is at Warm level or above, disable Warm (lower) but keep Hot enabled
    if ((statusToCheck === 'Warm' || statusToCheck === 'Hot') && modalInterested === 'Interested') {
      const warmIndex = statusHierarchy.indexOf('Warm');

      if (effectiveStatusIndex >= warmIndex) {
        return statusToCheck === 'Warm';
      }
    }

    return checkStatusIndex <= effectiveStatusIndex;
  };

  const isTaskStatusCompletedDisabled = () => {
    const kioskStatus = contact?.kioskLeadStatus || '';
    if (kioskStatus === 'Lead' || kioskStatus === 'lead') {
      return false;
    }

    if (answeredStatus === 'Not Answered') {
      return false;
    }

    const allowedStatuses = ['Demo', 'Not Deposit', 'Deposit'];
    return !allowedStatuses.includes(leadResponseStatus);
  };

  const isReminderDateEnabled = () => {
    return ['Warm', 'Hot', 'Demo', 'Not Deposit', 'Deposit'].includes(leadResponseStatus);
  };

  const isUpdateStatusDisabled = () => {
    return false;
  };

  const isFinalSelectedStatus = (statusValue) => {
    return leadResponseStatus === statusValue && leadResponseStatus !== '';
  };

  const shouldShowNotInterestedAvailable = () => {
    if (answeredStatus !== 'Answered' || modalAnswered !== 'Answered') return false;
    
    const currentStatus = contact?.status || '';
    const kioskStatus = contact?.kioskLeadStatus || '';
    
    const advancedStatuses = ['Warm', 'Hot', 'Demo', 'Real', 'Deposit', 'Not Deposit', 'Real Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'];
    
    return advancedStatuses.includes(currentStatus) || advancedStatuses.includes(kioskStatus);
  };

  const SelectedStatusIndicator = () => (
    <div className="flex items-center gap-1 ml-auto">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
    </div>
  );

  if (!contact) return null;

  return (
    <div className="overflow-y-auto flex-1">
      <div className="p-6 space-y-6">
        {/* Basic Information - Simple Card Style */}
        <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl p-5 border border-[#BBA473]/30 shadow-lg">
          <h3 className="text-[#E8D5A3] text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#E8D5A3] font-medium">Full Name</label>
              <p className="text-white text-lg">{contact.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#E8D5A3] font-medium">Phone Number</label>
              <p className="text-white text-lg font-mono">{formatPhoneDisplay(contact.phone)}</p>
            </div>

            {contact.email && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Email</label>
                <p className="text-white">{contact.email}</p>
              </div>
            )}

            {contact.nationality && contact.nationality !== '-' && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Nationality</label>
                <p className="text-white">{contact.nationality}</p>
              </div>
            )}

            {contact.residency && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Residency</label>
                <p className="text-white">{contact.residency}</p>
              </div>
            )}

            {contact.language && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Preferred Language</label>
                <p className="text-white">{contact.language}</p>
              </div>
            )}

            {contact.source && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Source</label>
                <p className="text-white">{contact.source}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-[#E8D5A3] font-medium">Current Status</label>
              <p className="text-white">{contact.status || 'N/A'}</p>
            </div>

            {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Kiosk Lead Status</label>
                <p className="text-white">{contact.kioskLeadStatus}</p>
              </div>
            )}

            {contact.depositStatus && (
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Deposit Status</label>
                <p className="text-white">{contact.depositStatus}</p>
              </div>
            )}
          </div>

          {(contact.remarks || contact.latestRemarks) && (
            <div className="space-y-2 mt-4 pt-4 border-t border-[#BBA473]/20">
              <label className="text-sm text-[#E8D5A3] font-medium">
                {contact.chatbotMessage?.length ? 'Chatbot Message' : 'Kiosk Remarks'}
              </label>
              {contact.chatbotMessage?.length ? (
                contact.chatbotMessage.map((item, index) => (
                  <p key={index} className="text-white mb-0.5">{item}</p>
                ))
              ) : (
                <p className="text-white">{contact.remarks || contact.latestRemarks || 'No remarks'}</p>
              )}
            </div>
          )}
        </div>

        {/* Status Options - IMPROVED HEADER */}
        <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-xl border border-[#BBA473]/30 shadow-lg overflow-hidden">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-[#BBA473]/20 via-[#BBA473]/10 to-transparent border-b border-[#BBA473]/30 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#BBA473]/20 rounded-lg">
                  <svg className="w-5 h-5 text-[#BBA473]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#E8D5A3]">Update Lead Status</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Track and manage lead progress</p>
                </div>
              </div>
              
              {/* Date Time Picker */}
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

          {/* Content */}
          <div className="p-5 space-y-6">
            {/* Task Status Toggle Switch */}
            <div className="space-y-4">
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

            {/* Answered Status Section */}
            <div className="space-y-4">
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
              
              {modalErrors.answeredStatus && (
                <div className="text-red-400 text-sm animate-pulse flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{modalErrors.answeredStatus}</span>
                </div>
              )}
              
              {answeredStatus === 'Not Answered' && (
                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-400 text-sm font-medium">
                      {contact && (contact.kioskLeadStatus === 'Lead' || contact.kioskLeadStatus === 'lead' || contact.kioskLeadStatus === '-' || contact.status === 'Lead' || contact.status === 'lead' || contact.status === '-')
                        ? 'All Status Options Enabled'
                        : contact && ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'].includes(contact.kioskLeadStatus || '')
                          ? 'Lead Has Not Responded'
                          : 'Update Status Disabled'}
                    </p>
                    <p className="text-orange-300 text-xs mt-1">
                      {contact && (contact.kioskLeadStatus === 'Lead' || contact.kioskLeadStatus === 'lead' || contact.kioskLeadStatus === '-' || contact.status === 'Lead' || contact.status === 'lead' || contact.status === '-')
                        ? `Since the status is "Lead", you can select any status without restrictions in the Update Status section below. ${taskStatus === 'Completed' ? 'Toggle the Task Status above to save.' : 'Please enable the Task Completion toggle above to save.'}`
                        : contact && ['Demo', 'Real', 'Real Deposit', 'Deposit', 'Not Deposit', 'Real Not Deposit', 'No Deposit', 'Real No Deposit'].includes(contact.kioskLeadStatus || '')
                          ? `Since the Kiosk Lead Status is "${contact.kioskLeadStatus}", you can select statuses at the same level or higher in the Update Status section below. ${taskStatus === 'Completed' ? 'Toggle the Task Status above to save.' : 'Please enable the Task Completion toggle above to save.'}`
                          : taskStatus === 'Completed'
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
                Lead Response Status
              </label>
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
                
                <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                  isStatusDisabled('Not Answered')
                    ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                    : isFinalSelectedStatus('Not Answered')
                      ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                      : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                }`}>
                  <input
                    type="radio"
                    name="answered"
                    value="Not Answered"
                    checked={modalAnswered === 'Not Answered' && leadResponseStatus === 'Not Answered'}
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
                    
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                      isStatusDisabled('Not Interested')
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                        : isFinalSelectedStatus('Not Interested')
                          ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                          : shouldShowNotInterestedAvailable()
                            ? 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50 animate-pulse-border-subtle'
                            : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer border-[#BBA473]/20 hover:border-[#BBA473]/50'
                    }`}>
                      <input
                        type="radio"
                        name="interested"
                        value="Not Interested"
                        checked={modalInterested === 'Not Interested' && leadResponseStatus === 'Not Interested'}
                        disabled={isStatusDisabled('Not Interested')}
                        onChange={(e) => {
                          setModalInterested(e.target.value);
                          setLeadResponseStatus(e.target.value);
                          setModalLeadType('');
                          setModalHotLeadType('');
                          setModalDepositStatus('');
                          setModalErrors({});
                        }}
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
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                      isStatusDisabled('Warm')
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                        : isFinalSelectedStatus('Warm')
                          ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                    }`}>
                      <input
                        type="radio"
                        name="leadType"
                        value="Warm"
                        checked={modalLeadType === 'Warm' && leadResponseStatus === 'Warm'}
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
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
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
                          setLeadResponseStatus(leadResponseStatus === 'Hot' ? 'Hot' : '');
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
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                        : isFinalSelectedStatus('Demo')
                          ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                    }`}>
                      <input
                        type="radio"
                        name="hotLeadType"
                        value="Demo"
                        checked={modalHotLeadType === 'Demo' && leadResponseStatus === 'Demo'}
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
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
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
                          setLeadResponseStatus(leadResponseStatus === 'Deposit' || leadResponseStatus === 'Not Deposit' ? leadResponseStatus : '');
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
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                      isStatusDisabled('Deposit')
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                        : isFinalSelectedStatus('Deposit')
                          ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                    }`}>
                      <input
                        type="radio"
                        name="depositStatus"
                        value="Deposit"
                        checked={modalDepositStatus === 'Deposit' && leadResponseStatus === 'Deposit'}
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
                        ? 'bg-gray-800/50 cursor-not-allowed opacity-50 border-gray-700'
                        : isFinalSelectedStatus('Not Deposit')
                          ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30 cursor-pointer scale-[1.02]'
                          : 'bg-[#1A1A1A] hover:bg-[#3A3A3A] border-[#BBA473]/20 hover:border-[#BBA473]/50'
                    }`}>
                      <input
                        type="radio"
                        name="depositStatus"
                        value="Not Deposit"
                        checked={modalDepositStatus === 'Not Deposit' && leadResponseStatus === 'Not Deposit'}
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
                  value={modalRemarks}
                  onChange={(e) => {
                    setModalRemarks(e.target.value);
                    if (modalErrors.remarks) {
                      setModalErrors({ ...modalErrors, remarks: '' });
                    }
                  }}
                  style={{ height: '124px' }}
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
                  placeholder={`Default: Follow Up with lead ( ${leadResponseStatus || contact?.status} - lead )`}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    Default: Follow Up with lead ( {leadResponseStatus || contact?.status} - lead )
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

      {/* Action Button - Sticky */}
      <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-[#BBA473]/30 p-4">
        <button
          onClick={handleModalSubmit}
          disabled={!isFormValid()}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg transform ${
            isFormValid()
              ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] hover:shadow-xl hover:shadow-[#BBA473]/40 hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          Save Changes
        </button>
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
            border-color: rgba(187, 164, 115, 0.3);
            box-shadow: 0 0 0 0 rgba(187, 164, 115, 0);
          }
          50% {
            border-color: rgba(187, 164, 115, 0.6);
            box-shadow: 0 0 8px 2px rgba(187, 164, 115, 0.2);
          }
        }
        
        .animate-pulse-border-subtle {
          animation: pulse-border-subtle 2.5s ease-in-out infinite;
        }

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

export default InboxLeadStatus;