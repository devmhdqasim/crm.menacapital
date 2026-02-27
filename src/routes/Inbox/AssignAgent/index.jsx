import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllUsers } from '../../../services/teamService';
import { assignLeadToAgent } from '../../../services/leadService';
import toast from 'react-hot-toast';

const AssignAgent = ({ contact, refreshContacts }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers(1, 100);
      if (result.success && result.data) {
        const salesAgents = result.data.filter(
          (user) =>
            user.roleName === 'Agent' ||
            user.roleName === 'Sales Manager' ||
            user.role === 'Agent' ||
            user.role === 'Sales Manager'
        );
        setAgents(salesAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (agent) => {
    if (!contact?.id || !agent?._id) return;

    setAssigning(agent._id);
    try {
      const result = await assignLeadToAgent(contact.id, agent._id);
      if (result.success) {
        toast.success(`Chat assigned to ${agent.firstName} ${agent.lastName}`);
        if (refreshContacts) refreshContacts();
      } else {
        toast.error(result.message || 'Failed to assign chat');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign chat');
    } finally {
      setAssigning(null);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const fullName = `${agent.firstName || ''} ${agent.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const currentAgentId = contact?.agentId || contact?.leadAgentId || null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader2 className="w-10 h-10 text-[#BBA473] animate-spin mb-3" />
        <span className="text-gray-400 text-sm">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Current Assignment */}
      <div className="bg-[#2A2A2A] rounded-xl border border-[#BBA473]/20 p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Currently Assigned</p>
        {currentAgentId ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center text-black font-bold text-sm">
              {(() => {
                const assigned = agents.find((a) => a._id === currentAgentId);
                return assigned ? assigned.firstName?.[0]?.toUpperCase() : '?';
              })()}
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {(() => {
                  const assigned = agents.find((a) => a._id === currentAgentId);
                  return assigned ? `${assigned.firstName} ${assigned.lastName}` : (contact.agent || 'Unknown Agent');
                })()}
              </p>
              <p className="text-gray-400 text-xs">
                {(() => {
                  const assigned = agents.find((a) => a._id === currentAgentId);
                  return assigned?.roleName || 'Agent';
                })()}
              </p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Not assigned to any agent</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] border border-[#BBA473]/20 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#BBA473]/50 transition-colors"
        />
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
          Available Agents ({filteredAgents.length})
        </p>
        {filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchQuery ? 'No agents match your search' : 'No agents available'}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredAgents.map((agent) => {
              const isCurrentAgent = agent._id === currentAgentId;
              const isAssigning = assigning === agent._id;
              return (
                <button
                  key={agent._id}
                  onClick={() => !isCurrentAgent && !isAssigning && handleAssign(agent)}
                  disabled={isCurrentAgent || isAssigning}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isCurrentAgent
                      ? 'bg-[#BBA473]/10 border border-[#BBA473]/30 cursor-default'
                      : 'bg-[#2A2A2A] border border-transparent hover:border-[#BBA473]/30 hover:bg-[#2A2A2A]/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isCurrentAgent
                      ? 'bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] text-black'
                      : 'bg-[#1A1A1A] text-[#BBA473] border border-[#BBA473]/30'
                  }`}>
                    {agent.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrentAgent ? 'text-[#BBA473]' : 'text-white'}`}>
                      {agent.firstName} {agent.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{agent.roleName || 'Agent'}</p>
                  </div>
                  {isAssigning ? (
                    <Loader2 className="w-4 h-4 text-[#BBA473] animate-spin flex-shrink-0" />
                  ) : isCurrentAgent ? (
                    <span className="text-xs text-[#BBA473] font-medium flex-shrink-0">Assigned</span>
                  ) : (
                    <UserCheck className="w-4 h-4 text-gray-500 group-hover:text-[#BBA473] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignAgent;
