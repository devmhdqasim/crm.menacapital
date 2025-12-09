import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateLeadTask } from '../../../services/leadService';
import toast from 'react-hot-toast';

const AssignLeadModal = ({ 
  showDetailsModal, 
  selectedLead, 
  handleCloseModal, 
  fetchLeads, 
  currentPage, 
  itemsPerPage,
  isLeadsSelectedId,
  onOpenReminderModal,
  setLeadResponseStatusCurrent,
}) => {
  // Modal form state - using single variable to track the final selected status
  const [leadResponseStatus, setLeadResponseStatus] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  
  // Helper states to track the hierarchical selections for UI rendering
  const [modalAnswered, setModalAnswered] = useState('');
  const [modalInterested, setModalInterested] = useState('');
  const [modalLeadType, setModalLeadType] = useState('');
  const [modalHotLeadType, setModalHotLeadType] = useState('');
  const [modalDepositStatus, setModalDepositStatus] = useState('');

  // Animation state
  const [isClosing, setIsClosing] = useState(false);

  // Pre-populate modal when selectedLead changes
  useEffect(() => {
    if (selectedLead) {
      setModalRemarks(selectedLead.latestRemarks || '');
      
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
            // Demo account
            setModalHotLeadType('Demo');
            setLeadResponseStatus('Demo');
            setModalDepositStatus('');
          } else if (selectedLead.real) {
            // Real account
            setModalHotLeadType('Real');
            
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
  }, [selectedLead]);

  // Reset closing state when modal opens
  useEffect(() => {
    if (showDetailsModal) {
      setIsClosing(false);
    }
  }, [showDetailsModal]);

  const validateModalForm = () => {
    const errors = {};
    
    // Validate that a response status is selected
    if (!leadResponseStatus) {
      errors.answered = 'Please complete the status selection';
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

    try {
      // Initialize all flags as false
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

      setLeadResponseStatusCurrent(leadResponseStatus)

      // Set flags based on the user's selections
      if (modalAnswered === 'Not Answered') {
        // Only contacted is true, everything else stays false
        payload.contacted = true;
        payload.answered = false;
      } else if (modalAnswered === 'Answered') {
        payload.contacted = true;
        payload.answered = true;
        
        if (modalInterested === 'Not Interested') {
          // Contacted, answered, but not interested (cold lead)
          payload.interested = false;
          payload.cold = true;
        } else if (modalInterested === 'Interested') {
          payload.interested = true;
          
          if (modalLeadType === 'Warm') {
            // Warm lead - interested but not hot
            payload.hot = false;
            payload.cold = false;
          } else if (modalLeadType === 'Hot') {
            payload.hot = true;
            
            if (modalHotLeadType === 'Demo') {
              // Hot lead with demo account
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
      
      // Call API to update lead task
      const result = await updateLeadTask(
        selectedLead.id,
        payload
      );
      
      if (result.success) {
        toast.success(result?.message || 'Lead status updated successfully!');
        
        // Close this modal with animation
        handleClose();
        
        // Open reminder modal after a short delay
        setTimeout(() => {
          onOpenReminderModal(selectedLead);
        }, 300);
        
        // Refresh leads
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
      'Not Deposit': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (!showDetailsModal || !selectedLead) return null;

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
            <p className="text-gray-400 text-sm mt-1">{selectedLead.leadId || selectedLead.id.slice(-6)}</p>
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
                <label className="text-sm text-[#E8D5A3] font-medium">Residency</label>
                <p className="text-white">{selectedLead.residency || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Preferred Language</label>
                <p className="text-white">{selectedLead.language || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Source</label>
                <p className="text-white">{selectedLead.source}</p>
              </div>
              {!isLeadsSelectedId && (
                <div className="flex items-center gap-3 space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium mb-0">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs whitespace-nowrap font-semibold border ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                </div>
              )}
              {selectedLead.remarks ? (<div className="space-y-2 col-span-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Kiosk Remarks</label>
                <p className="text-white">{selectedLead.remarks}</p>
              </div>) : ''}
            </div>

            {/* Status Options */}
            <div className="border-t border-[#BBA473]/30 pt-6">
              <h3 className="text-lg font-semibold text-[#E8D5A3] mb-4">Update Status</h3>
              
              {/* Level 1: Answered / Not Answered */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                    <input
                      type="radio"
                      name="answered"
                      value="Answered"
                      checked={modalAnswered === 'Answered'}
                      onChange={(e) => {
                        setModalAnswered(e.target.value);
                        setLeadResponseStatus(e.target.value);
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
                  
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                    <input
                      type="radio"
                      name="answered"
                      value="Not Answered"
                      checked={modalAnswered === 'Not Answered'}
                      onChange={(e) => {
                        setModalAnswered(e.target.value);
                        setLeadResponseStatus(e.target.value);
                        setModalInterested('');
                        setModalLeadType('');
                        setModalHotLeadType('');
                        setModalDepositStatus('');
                        setModalErrors({});
                      }}
                      className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                    />
                    <span className="text-white font-medium">Not Answered</span>
                  </label>
                </div>
                {modalErrors.answered && (
                  <div className="text-red-400 text-sm animate-pulse">{modalErrors.answered}</div>
                )}
                
                {/* Level 2: Interested / Not Interested (shown if Answered) */}
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
                            setLeadResponseStatus(e.target.value);
                            setModalLeadType('');
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Interested</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                        <input
                          type="radio"
                          name="interested"
                          value="Not Interested"
                          checked={modalInterested === 'Not Interested'}
                          onChange={(e) => {
                            setModalInterested(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalLeadType('');
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Not Interested</span>
                      </label>
                    </div>
                    {modalErrors.interested && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.interested}</div>
                    )}
                  </div>
                )}
                
                {/* Level 3: Warm Lead / Hot Lead (shown if Interested) */}
                {modalInterested === 'Interested' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                    {!isLeadsSelectedId && (
                      <>
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                          <input
                            type="radio"
                            name="leadType"
                            value="Warm"
                            checked={modalLeadType === 'Warm'}
                            onChange={(e) => {
                              setModalLeadType(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalHotLeadType('');
                              setModalDepositStatus('');
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                          />
                          <span className="text-white font-medium">Warm Lead</span>
                        </label>
                      </>
                    )}
                      
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                        <input
                          type="radio"
                          name="leadType"
                          value="Hot"
                          checked={modalLeadType === 'Hot'}
                          onChange={(e) => {
                            setModalLeadType(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalHotLeadType('');
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Hot Lead</span>
                      </label>
                    </div>
                    {modalErrors.leadType && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.leadType}</div>
                    )}
                  </div>
                )}
                
                {/* Level 4: Demo / Real (shown if Hot Lead) */}
                {modalLeadType === 'Hot' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                        <input
                          type="radio"
                          name="hotLeadType"
                          value="Demo"
                          checked={modalHotLeadType === 'Demo'}
                          onChange={(e) => {
                            setModalHotLeadType(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Demo</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                        <input
                          type="radio"
                          name="hotLeadType"
                          value="Real"
                          checked={modalHotLeadType === 'Real'}
                          onChange={(e) => {
                            setModalHotLeadType(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalDepositStatus('');
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Real</span>
                      </label>
                    </div>
                    {modalErrors.hotLeadType && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.hotLeadType}</div>
                    )}
                  </div>
                )}
                
                {/* Level 5: Deposited / Not Deposited (shown if Real) */}
                {modalHotLeadType === 'Real' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                        <input
                          type="radio"
                          name="depositStatus"
                          value="Deposit"
                          checked={modalDepositStatus === 'Deposit'}
                          onChange={(e) => {
                            setModalDepositStatus(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Deposit</span>
                      </label>
                      
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                        <input
                          type="radio"
                          name="depositStatus"
                          value="Not Deposit"
                          checked={modalDepositStatus === 'Not Deposit'}
                          onChange={(e) => {
                            setModalDepositStatus(e.target.value);
                            setLeadResponseStatus(e.target.value);
                            setModalErrors({});
                          }}
                          className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                        />
                        <span className="text-white font-medium">Not Deposit</span>
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
              </div>
            </div>
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
            {!isLeadsSelectedId && (
              <button
                onClick={handleModalSubmit}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
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
      `}</style>
    </div>
  );
};

export default AssignLeadModal;