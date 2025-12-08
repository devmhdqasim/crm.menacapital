import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';

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
  onOpenTaskModal
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Reset closing state when modal opens
  useEffect(() => {
    if (showRowModal) {
      setIsClosing(false);
    }
  }, [showRowModal]);

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

  const handleStatusUpdateWithTask = async () => {
    // Call the original status update function
    await handleStatusUpdate();
    
    // If status update was successful, close this modal and open task modal
    // The success is handled in the parent component, so we'll trigger the task modal there
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
                <label className="text-sm text-[#E8D5A3] font-medium">Residency</label>
                <p className="text-white">{selectedLead.residency || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Preferred Language</label>
                <p className="text-white">{selectedLead.language || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Assigned Agent</label>
                <p className="text-white">{selectedLead.agent || 'Not Assigned'}</p>
              </div>
              <div className="flex items-center gap-3 space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium mb-0">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs whitespace-nowrap font-semibold border ${getStatusColor(selectedLead.status)}`}>
                  {selectedLead.status}
                </span>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm text-[#E8D5A3] font-medium">Kiosk Remarks</label>
                <p className="text-white">{selectedLead.remarks || 'No remarks'}</p>
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
                    </div>
                  )}
                  
                  {/* Level 3: Warm Lead / Hot Lead */}
                  {modalInterested === 'Interested' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                          <input
                            type="radio"
                            name="leadType"
                            value="Warm Lead"
                            checked={modalLeadType === 'Warm Lead'}
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
                        
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                          <input
                            type="radio"
                            name="leadType"
                            value="Hot Lead"
                            checked={modalLeadType === 'Hot Lead'}
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
                    </div>
                  )}
                  
                  {/* Level 4: Demo / Real */}
                  {modalLeadType === 'Hot Lead' && (
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
                    </div>
                  )}
                  
                  {/* Level 5: Deposited / Not Deposited */}
                  {modalHotLeadType === 'Real' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                          <input
                            type="radio"
                            name="depositStatus"
                            value="Deposited"
                            checked={modalDepositStatus === 'Deposited'}
                            onChange={(e) => {
                              setModalDepositStatus(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                          />
                          <span className="text-white font-medium">Deposited</span>
                        </label>
                        
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#3A3A3A] cursor-pointer transition-all duration-300 border border-[#BBA473]/20 hover:border-[#BBA473]/50">
                          <input
                            type="radio"
                            name="depositStatus"
                            value="Not Deposited"
                            checked={modalDepositStatus === 'Not Deposited'}
                            onChange={(e) => {
                              setModalDepositStatus(e.target.value);
                              setLeadResponseStatus(e.target.value);
                              setModalErrors({});
                            }}
                            className="w-4 h-4 text-[#BBA473] focus:ring-[#BBA473] focus:ring-2"
                          />
                          <span className="text-white font-medium">Not Deposited</span>
                        </label>
                      </div>
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
                onClick={() => {
                  // Call parent's handleStatusUpdate which will handle the API call
                  // and then trigger the task modal
                  handleStatusUpdate();
                  
                  // After a short delay (to allow for API success), open task modal
                  setTimeout(() => {
                    if (onOpenTaskModal) {
                      handleClose();
                      setTimeout(() => {
                        onOpenTaskModal(selectedLead);
                      }, 300);
                    }
                  }, 500);
                }}
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

export default SalesManagerAssignLeadModal;