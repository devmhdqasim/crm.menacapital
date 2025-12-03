import React from 'react';
import { X, ChevronDown } from 'lucide-react';

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
  handleStatusUpdate
}) => {
  if (!showRowModal || !selectedLead) return null;

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'New': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Contacted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Qualified': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Unqualified': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'No Deposit': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const showStatusTab = selectedLead.agentId === currentUserId;
  const isLeadsSelectedId = false; // This should come from props if needed

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        {/* Modal Header - Sticky */}
        <div className="sticky top-0 z-10 bg-[#2A2A2A] flex items-center justify-between p-6 border-b border-[#BBA473]/30">
          <div>
            <h3 className="text-xl font-bold text-[#BBA473]">
              {showStatusTab ? 'Lead Details' : 'Assign Lead'}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {showStatusTab ? selectedLead.leadId || selectedLead.id.slice(-6) : 'Assign this lead to an agent'}
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-lg hover:bg-[#3A3A3A] transition-all duration-300 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Lead Info - Always visible */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#BBA473]/20">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Lead Name:</span>
                <p className="text-white font-medium mt-1">{selectedLead.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Phone:</span>
                <p className="text-white font-medium mt-1">{formatPhoneDisplay(selectedLead.phone)}</p>
              </div>
              <div>
                <span className="text-gray-400">Nationality:</span>
                <p className="text-white font-medium mt-1">{selectedLead.nationality}</p>
              </div>
              <div>
                <span className="text-gray-400">Language:</span>
                <p className="text-white font-medium mt-1">{selectedLead.language}</p>
              </div>
              <div className='flex items-center gap-2'>
                <span className="text-gray-400 mb-0">Status:</span>
                <p className="flex items-center gap-2 mt-1">
                  {selectedLead?.kioskLeadStatus ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(selectedLead.kioskLeadStatus)}`}>
                    {selectedLead?.kioskLeadStatus} {selectedLead.depositStatus && `- ${selectedLead.depositStatus}`}
                  </span> : ''}
                  {selectedLead.status ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>: ''}
                </p>
              </div>
            </div>
            
            {selectedLead.remarks && (
              <div className="mt-3 pt-3 border-t border-[#BBA473]/20">
                <span className="text-gray-400 text-sm">Kiosk Remarks:</span>
                <p className="text-white text-sm mt-1 leading-relaxed">{selectedLead.remarks}</p>
              </div>
            )}
          </div>

          {/* Tabs - Only show if lead is assigned to sales manager */}
          {showStatusTab && (
            <div className="flex border-b border-[#BBA473]/30">
              <button
                onClick={() => setActiveModalTab('assign')}
                className={`flex-1 px-6 py-3 font-medium transition-all duration-300 ${
                  activeModalTab === 'assign'
                    ? 'bg-[#BBA473]/10 text-[#BBA473] border-b-2 border-[#BBA473]'
                    : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
                }`}
              >
                Assign Lead
              </button>
              <button
                onClick={() => setActiveModalTab('status')}
                className={`flex-1 px-6 py-3 font-medium transition-all duration-300 ${
                  activeModalTab === 'status'
                    ? 'bg-[#BBA473]/10 text-[#BBA473] border-b-2 border-[#BBA473]'
                    : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
                }`}
              >
                Update Status
              </button>
            </div>
          )}

          {/* Assign Tab Content */}
          {(!showStatusTab || activeModalTab === 'assign') && (
            <>
              {/* Assign to Self Switch */}
              <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#BBA473]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Assign to Yourself
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Toggle to quickly assign this lead to yourself
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignToSelf(!assignToSelf)}
                    disabled={assigningLead}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed ${
                      assignToSelf ? 'bg-[#BBA473]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        assignToSelf ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Agent Selection */}
              <div className="relative space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Select Agent <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedAgentForLead}
                    onChange={(e) => setSelectedAgentForLead(e.target.value)}
                    disabled={assigningLead || assignToSelf}
                    className={`w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473] disabled:opacity-50 disabled:cursor-not-allowed ${
                      assignToSelf ? 'opacity-50' : ''
                    }`}
                  >
                    <option value="">Choose agent...</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName} ({agent.username}) - {agent.department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute bg-[#1a1a1a] right-1 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {/* Status Tab Content */}
          {showStatusTab && activeModalTab === 'status' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E8D5A3]">Update Status</h3>
              
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
                      )}
                      
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
                    {modalErrors.leadType && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.leadType}</div>
                    )}
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
                    {modalErrors.hotLeadType && (
                      <div className="text-red-400 text-sm animate-pulse">{modalErrors.hotLeadType}</div>
                    )}
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-[#BBA473]/30">
          <button
            onClick={handleCloseModal}
            disabled={assigningLead}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {(!showStatusTab || activeModalTab === 'assign') ? (
            <button
              onClick={handleAssignAgent}
              disabled={assigningLead || (!assignToSelf && !selectedAgentForLead) || !hasAssignmentChanged()}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigningLead ? 'Assigning...' : 'Assign'}
            </button>
          ) : (
            <button
              onClick={handleStatusUpdate}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
            >
              Update
            </button>
          )}
        </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SalesManagerAssignLeadModal;