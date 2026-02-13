import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWatiTemplates, sendWatiTemplateMessage } from '../../../services/inboxService';

const TemplatePicker = ({ contact, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await getWatiTemplates();
      if (result.success) {
        const approvedTemplates = (result.templates || []).filter(
          t => t.status === 'approved' || t.status === 'APPROVED'
        );
        setTemplates(approvedTemplates);
      } else {
        toast.error(result.message || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const extractVariables = (text) => {
    if (!text) return [];
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(regex)];
    return matches.map(match => match[1]);
  };

  const getTemplateBody = (template) => {
    if (template.body) return template.body;
    if (template.components) {
      const bodyComponent = template.components.find(c => c.type === 'BODY' || c.type === 'body');
      return bodyComponent?.text || '';
    }
    return template.text || '';
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    const body = getTemplateBody(template);
    const vars = extractVariables(body);
    const initialParams = {};
    vars.forEach(v => { initialParams[v] = ''; });
    setParamValues(initialParams);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !contact) return;

    const varKeys = Object.keys(paramValues);
    const hasEmptyParams = varKeys.some(k => !paramValues[k].trim());
    if (hasEmptyParams && varKeys.length > 0) {
      toast.error('Please fill in all template variables');
      return;
    }

    setIsSending(true);
    try {
      const parameters = varKeys.map(key => ({
        name: key,
        value: paramValues[key],
      }));

      const templateName = selectedTemplate.elementName || selectedTemplate.name;
      const result = await sendWatiTemplateMessage(contact.phone, templateName, parameters);

      if (result.success) {
        toast.success('Template message sent!');
        onClose();
      } else {
        toast.error(result.message || 'Failed to send template');
      }
    } catch (error) {
      console.error('Error sending template:', error);
      toast.error('Failed to send template message');
    } finally {
      setIsSending(false);
    }
  };

  const getPreviewText = (template) => {
    let body = getTemplateBody(template);
    Object.keys(paramValues).forEach(key => {
      const value = paramValues[key] || `{{${key}}}`;
      body = body.replace(`{{${key}}}`, value);
    });
    return body;
  };

  const filteredTemplates = templates.filter(t => {
    const name = (t.elementName || t.name || '').toLowerCase();
    const body = getTemplateBody(t).toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || body.includes(query);
  });

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#252525] z-10 flex flex-col animate-slideInRight">
      {/* Header */}
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
              {selectedTemplate ? 'Configure Template' : 'Send Template'}
            </h3>
            <p className="text-gray-400 text-sm mt-0.5">
              {selectedTemplate
                ? `Sending to ${contact.name}`
                : `Choose a template to send to ${contact.name}`}
            </p>
          </div>
        </div>

        {/* Search - only when no template is selected */}
        {!selectedTemplate && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#BBA473] transition-all"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-[#BBA473] animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading templates...</p>
          </div>
        ) : selectedTemplate ? (
          /* Template configuration view */
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={() => { setSelectedTemplate(null); setParamValues({}); }}
              className="text-sm text-[#BBA473] hover:text-[#d4bc89] transition-colors"
            >
              &larr; Back to templates
            </button>

            {/* Template name */}
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20">
              <p className="text-xs text-gray-400 mb-1">Template</p>
              <p className="text-white font-semibold">{selectedTemplate.elementName || selectedTemplate.name}</p>
            </div>

            {/* Parameter inputs */}
            {Object.keys(paramValues).length > 0 && (
              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20 space-y-3">
                <p className="text-sm font-semibold text-white">Fill in variables</p>
                {Object.keys(paramValues).sort((a, b) => parseInt(a) - parseInt(b)).map(key => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">Variable {`{{${key}}}`}</label>
                    <input
                      type="text"
                      value={paramValues[key]}
                      onChange={(e) => setParamValues(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter value for {{${key}}}`}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#BBA473] transition-all"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20">
              <p className="text-xs text-gray-400 mb-2">Preview</p>
              <div className="bg-gradient-to-r from-[#005C4B] to-[#128C7E] rounded-xl px-4 py-3 text-white text-sm leading-relaxed whitespace-pre-wrap">
                {getPreviewText(selectedTemplate)}
              </div>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-[#BBA473]" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'No templates found' : 'No approved templates'}
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {searchQuery
                ? 'Try a different search term.'
                : 'No approved templates available in your Wati account.'}
            </p>
          </div>
        ) : (
          /* Template list */
          <div className="space-y-2">
            {filteredTemplates.map((template, index) => {
              const body = getTemplateBody(template);
              const vars = extractVariables(body);
              const isExpanded = expandedTemplate === index;

              return (
                <div
                  key={template.id || template.elementName || index}
                  className="bg-[#2A2A2A] rounded-xl border border-[#BBA473]/20 overflow-hidden hover:border-[#BBA473]/40 transition-all"
                >
                  {/* Template header row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedTemplate(isExpanded ? null : index)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {template.elementName || template.name}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {template.category || 'MARKETING'} {vars.length > 0 && `· ${vars.length} variable${vars.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(template);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg text-xs font-semibold hover:from-[#d4bc89] hover:to-[#a69363] transition-all"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#BBA473]/10 pt-3">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-4 flex-shrink-0">
        {selectedTemplate ? (
          <div className="flex gap-3">
            <button
              onClick={() => { setSelectedTemplate(null); setParamValues({}); }}
              className="flex-1 px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTemplate}
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-xl transition-all font-semibold hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Template
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all font-semibold"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplatePicker;
