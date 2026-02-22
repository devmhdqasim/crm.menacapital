import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Send, Loader2, ChevronDown, ChevronUp, ChevronRight, RefreshCw, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWatiTemplates, sendWatiTemplateMessage } from '../../../services/inboxService';

const TemplatePicker = ({ contact, onClose, setMessages, refreshContacts }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [variableGroups, setVariableGroups] = useState({ header: [], body: [], buttons: [] });
  const [isSending, setIsSending] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [selectingIndex, setSelectingIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await getWatiTemplates();
      if (result.success) {
        const templatesList = result.data?.messageTemplates || result.templates || [];
        const activeTemplates = templatesList.filter(
          t => t.status !== 'DELETED' && t.status !== 'REJECTED'
        );
        setTemplates(activeTemplates);
        const uniqueCategories = [...new Set(activeTemplates.map(t => t.category || 'UNCATEGORIZED'))];
        setCategories(uniqueCategories);
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

  const extractVariablesFromText = (text) => {
    if (!text) return [];
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(regex)];
    return matches.map(match => match[1]);
  };

  const extractAllVariables = (template) => {
    const result = { header: [], body: [], buttons: [] };

    if (template.components && Array.isArray(template.components)) {
      template.components.forEach(component => {
        const type = (component.type || '').toUpperCase();
        const text = component.text || '';
        const vars = extractVariablesFromText(text);

        if (type === 'HEADER') {
          result.header = vars;
        } else if (type === 'BODY') {
          result.body = vars;
        } else if (type === 'BUTTONS') {
          if (component.buttons && Array.isArray(component.buttons)) {
            component.buttons.forEach(btn => {
              const btnUrl = btn.url || '';
              const btnText = btn.text || '';
              result.buttons.push(...extractVariablesFromText(btnUrl));
              result.buttons.push(...extractVariablesFromText(btnText));
            });
          }
          result.buttons.push(...vars);
        }
      });
    } else {
      const body = template.body || template.text || '';
      result.body = extractVariablesFromText(body);
    }

    // Deduplicate within each group
    result.header = [...new Set(result.header)];
    result.body = [...new Set(result.body)];
    result.buttons = [...new Set(result.buttons)];

    return result;
  };

  const getAllVariablesList = (template) => {
    const all = extractAllVariables(template);
    const allVars = [...all.header, ...all.body, ...all.buttons];
    return [...new Set(allVars)].sort((a, b) => parseInt(a) - parseInt(b));
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
    const groups = extractAllVariables(template);
    // Use component-prefixed keys to avoid deduplication across groups
    const initialParams = {};
    groups.header.forEach(v => { initialParams[`header_${v}`] = ''; });
    groups.body.forEach(v => { initialParams[`body_${v}`] = ''; });
    groups.buttons.forEach(v => { initialParams[`button_${v}`] = ''; });
    setParamValues(initialParams);
    setVariableGroups(groups);
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
      // Build sequential parameters in order: header → body → buttons
      // Wati API expects customParams numbered 1..N across all components
      const orderedKeys = [
        ...variableGroups.header.map(v => `header_${v}`),
        ...variableGroups.body.map(v => `body_${v}`),
        ...variableGroups.buttons.map(v => `button_${v}`),
      ];
      const parameters = orderedKeys.map((key, idx) => ({
        name: selectedTemplate.customParams?.[idx]?.paramName || String(idx + 1),
        value: paramValues[key],
      }));

      const templateName = selectedTemplate.elementName || selectedTemplate.name;
      const result = await sendWatiTemplateMessage(contact.phone, templateName, parameters);

      if (result.success) {
        // Add the template message to the chat immediately
        if (setMessages) {
          const previewText = getPreviewText(selectedTemplate);
          const templateMessage = {
            id: `template-${Date.now()}`,
            text: previewText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            sortTimestamp: Date.now(),
            status: 'sent',
            type: 'template',
            isTemplate: true,
          };
          setMessages(prev => [...prev, templateMessage]);
        }

        if (refreshContacts) {
          refreshContacts();
        }

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
    // Body variables use body_ prefix in paramValues
    variableGroups.body.forEach(key => {
      const value = paramValues[`body_${key}`] || `{{${key}}}`;
      body = body.replace(`{{${key}}}`, value);
    });
    return body;
  };

  const getStatusBadge = (status) => {
    const upperStatus = (status || '').toUpperCase();
    if (upperStatus === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
          <CheckCircle className="w-2.5 h-2.5" />
          Approved
        </span>
      );
    }
    if (upperStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          <AlertCircle className="w-2.5 h-2.5" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
        {status}
      </span>
    );
  };

  const filteredTemplates = templates.filter(t => {
    const name = (t.elementName || t.name || '').toLowerCase();
    const body = getTemplateBody(t).toLowerCase();
    const category = (t.category || 'UNCATEGORIZED');
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || body.includes(query);
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

    return matchesSearch && matchesCategory;
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
          {!selectedTemplate && (
            <button
              onClick={fetchTemplates}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300 disabled:opacity-50"
              title="Refresh templates"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Search & Category Filter - only when no template is selected */}
        {!selectedTemplate && (
          <div className="mt-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#BBA473] transition-all"
              />
            </div>
            {categories.length > 1 && (
              <div className="relative w-36">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#BBA473] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}
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
              onClick={() => { setSelectedTemplate(null); setParamValues({}); setVariableGroups({ header: [], body: [], buttons: [] }); }}
              className="text-sm text-[#BBA473] hover:text-[#d4bc89] transition-colors"
            >
              &larr; Back to templates
            </button>

            {/* Template name */}
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Template</p>
                  <p className="text-white font-semibold">{selectedTemplate.elementName || selectedTemplate.name}</p>
                </div>
                {getStatusBadge(selectedTemplate.status)}
              </div>
            </div>

            {/* Parameter inputs */}
            {Object.keys(paramValues).length > 0 && (
              <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#BBA473]/20 space-y-4">
                <p className="text-sm font-semibold text-white">Fill in variables</p>
                {variableGroups.header.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-[#BBA473] font-medium">Header Variables</p>
                    {variableGroups.header.map(key => (
                      <div key={`header-${key}`}>
                        <label className="block text-xs text-gray-400 mb-1">Header {`{{${key}}}`}</label>
                        <input
                          type="text"
                          value={paramValues[`header_${key}`] || ''}
                          onChange={(e) => setParamValues(prev => ({ ...prev, [`header_${key}`]: e.target.value }))}
                          placeholder={`Enter value for header {{${key}}}`}
                          className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#BBA473] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {variableGroups.body.length > 0 && (
                  <div className="space-y-2">
                    {(variableGroups.header.length > 0 || variableGroups.buttons.length > 0) && (
                      <p className="text-xs text-[#BBA473] font-medium">Body Variables</p>
                    )}
                    {variableGroups.body.map(key => (
                      <div key={`body-${key}`}>
                        <label className="block text-xs text-gray-400 mb-1">Body {`{{${key}}}`}</label>
                        <input
                          type="text"
                          value={paramValues[`body_${key}`] || ''}
                          onChange={(e) => setParamValues(prev => ({ ...prev, [`body_${key}`]: e.target.value }))}
                          placeholder={`Enter value for body {{${key}}}`}
                          className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#BBA473] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {variableGroups.buttons.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-[#BBA473] font-medium">Button Variables</p>
                    {variableGroups.buttons.map(key => (
                      <div key={`btn-${key}`}>
                        <label className="block text-xs text-gray-400 mb-1">Button {`{{${key}}}`}</label>
                        <input
                          type="text"
                          value={paramValues[`button_${key}`] || ''}
                          onChange={(e) => setParamValues(prev => ({ ...prev, [`button_${key}`]: e.target.value }))}
                          placeholder={`Enter value for button {{${key}}}`}
                          className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#BBA473] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
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
              {searchQuery || selectedCategory !== 'all' ? 'No templates found' : 'No templates available'}
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'No templates available in your Wati account.'}
            </p>
          </div>
        ) : (
          /* Template list */
          <div className="space-y-2">
            {filteredTemplates.map((template, index) => {
              const body = getTemplateBody(template);
              const vars = getAllVariablesList(template);
              const isExpanded = expandedTemplate === index;
              const isApproved = (template.status || '').toUpperCase() === 'APPROVED';
              const isSelecting = selectingIndex === index;

              return (
                <div
                  key={template.id || template.elementName || index}
                  className={`bg-[#2A2A2A] rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer
                    ${isSelecting
                      ? 'ring-2 ring-[#BBA473] scale-[0.98] bg-[#BBA473]/10 border-[#BBA473]'
                      : isApproved
                        ? 'border-[#BBA473]/20 hover:border-[#BBA473]/50 hover:shadow-lg hover:shadow-[#BBA473]/10 active:scale-[0.99]'
                        : 'border-gray-600/30 hover:border-gray-500/40'
                    }`}
                  onClick={() => {
                    if (isApproved) {
                      setSelectingIndex(index);
                      setTimeout(() => {
                        handleSelectTemplate(template);
                        setSelectingIndex(null);
                      }, 300);
                    } else {
                      setExpandedTemplate(isExpanded ? null : index);
                    }
                  }}
                >
                  {/* Template header row */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-semibold text-sm truncate">
                          {template.elementName || template.name}
                        </p>
                        {getStatusBadge(template.status)}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {template.category || 'MARKETING'} {vars.length > 0 && `· ${vars.length} variable${vars.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {isApproved ? (
                        <ChevronRight className={`w-4 h-4 text-[#BBA473] transition-transform duration-300 ${isSelecting ? 'translate-x-1' : ''}`} />
                      ) : (
                        isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>

                  {/* Expanded preview (only for non-approved templates) */}
                  {isExpanded && !isApproved && (
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
              onClick={() => { setSelectedTemplate(null); setParamValues({}); setVariableGroups({ header: [], body: [], buttons: [] }); }}
              className="flex-1 px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-xl transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSendTemplate}
              disabled={isSending || (selectedTemplate.status || '').toUpperCase() !== 'APPROVED'}
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
