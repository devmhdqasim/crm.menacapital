import React from 'react';
import { X, FileText } from 'lucide-react';

const TemplatePicker = ({ contact, onClose }) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#252525] z-10 flex flex-col animate-slideInRight">
      <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#BBA473]" />
              Send Template
            </h3>
            <p className="text-gray-400 text-sm mt-0.5">Choose a template to send to {contact.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-[#BBA473]" />
          </div>
          <h4 className="text-xl font-bold text-white mb-2">Template Picker</h4>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Send pre-approved WhatsApp template messages even outside the 24-hour window. 
            This feature is coming soon!
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-400 text-xs font-medium">
              💡 Template messages let you re-engage contacts after 24 hours have passed since their last message.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5">
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all duration-300 font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TemplatePicker;