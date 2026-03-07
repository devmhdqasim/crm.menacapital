import React from 'react';
import { Mail, Globe, User, Calendar, Phone, Bell, Tag, X, CheckCircle, ShieldBan, AlertOctagon, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileSidebar = ({
  contact,
  contactTags,
  setContactTags,
  newTag,
  setNewTag,
  showTagInput,
  setShowTagInput,
  setShowReminderModal,
  isBlocked = false,
  isSpam = false,
  onToggleBlock,
  onToggleSpam,
}) => {
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone;
  };

  const handleAddTag = () => {
    if (!newTag.trim() || contactTags.includes(newTag.trim())) {
      if (contactTags.includes(newTag.trim())) {
        toast.error('Tag already exists');
      }
      return;
    }

    const updatedTags = [...contactTags, newTag.trim()];
    setContactTags(updatedTags);
    localStorage.setItem(`tags_${contact.id}`, JSON.stringify(updatedTags));
    setNewTag('');
    setShowTagInput(false);
    toast.success('Tag added');
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = contactTags.filter(t => t !== tagToRemove);
    setContactTags(updatedTags);
    localStorage.setItem(`tags_${contact.id}`, JSON.stringify(updatedTags));
    toast.success('Tag removed');
  };

  return (
    <div className="w-80 bg-[#1A1A1A] border-l border-[#BBA473]/30 flex flex-col animate-slideInRight overflow-hidden">
      {/* Profile Header */}
      <div className="p-5 border-b border-[#BBA473]/20 flex-shrink-0">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-4xl font-bold text-white">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{capitalizeWords(contact.name)}</h3>
          <p className="text-sm text-gray-400">{formatPhoneDisplay(contact.phone)}</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
        {/* Contact Info */}
        <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Contact Info</h4>
          <div className="space-y-3">
            {contact.email && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#BBA473]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-white truncate">{contact.email}</p>
                </div>
              </div>
            )}
            {contact.nationality && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-[#BBA473]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs">Nationality</p>
                  <p className="text-white truncate">{contact.nationality}</p>
                </div>
              </div>
            )}
            {contact.source && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-base">📍</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs">Source</p>
                  <p className="text-white truncate">{contact.source}</p>
                </div>
              </div>
            )}
            {contact.agent && contact.agent !== 'Not Assigned' && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#BBA473]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-xs">Assigned Agent</p>
                  <p className="text-white truncate">{capitalizeWords(contact.agent)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#BBA473]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#BBA473]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs">First Contact</p>
                <p className="text-white">{new Date(contact.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tags</h4>
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-[#BBA473] hover:text-[#d4bc89] text-xs font-medium transition-colors"
            >
              {showTagInput ? '✕ Cancel' : '+ Add'}
            </button>
          </div>

          {showTagInput && (
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Enter tag..."
                autoFocus
                className="flex-1 px-3 py-1.5 text-sm bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white focus:outline-none focus:border-[#BBA473]"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-1.5 bg-[#BBA473] text-black rounded-lg text-sm font-medium hover:bg-[#d4bc89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}

          {contactTags.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No tags yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contactTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#BBA473]/10 text-[#BBA473] rounded-full text-xs font-medium border border-[#BBA473]/20 group hover:bg-[#BBA473]/20 transition-all"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status Badge */}
        {contact.kioskLeadStatus && contact.kioskLeadStatus !== '-' && (
          <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Status</h4>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${contact.kioskLeadStatus === 'Demo'
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : contact.kioskLeadStatus === 'Real'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
              <CheckCircle className="w-3 h-3" />
              {contact.kioskLeadStatus}
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-4 h-4" />
              Call Contact
            </button>
            {/* <button
              onClick={() => setShowReminderModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
            >
              <Bell className="w-4 h-4" />
              Set Follow-up
            </button> */}
          </div>
        </div>

        {/* Block & Spam */}
        <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/10">
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Contact Controls</h4>
          <div className="space-y-2">
            {onToggleBlock && (
              <button
                onClick={onToggleBlock}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                  isBlocked
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                }`}
              >
                {isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
                {isBlocked ? 'Unblock Contact' : 'Block Contact'}
              </button>
            )}
            {onToggleSpam && (
              <button
                onClick={onToggleSpam}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                  isSpam
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                    : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20'
                }`}
              >
                {isSpam ? <ShieldOff className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                {isSpam ? 'Remove from Spam' : 'Mark as Spam'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;