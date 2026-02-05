import React, { useState, useEffect } from 'react';
import { X, Search, Send, FileText, AlertCircle, CheckCircle, RefreshCw, Eye, Filter, ChevronDown, Users, User, ChevronLeft, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWatiTemplates, sendWatiTemplateMessage } from '../../../services/inboxService';

const InboxTemplateManager = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Send template state (merged into detail view)
  const [sendMode, setSendMode] = useState('single'); // 'single' or 'bulk'
  const [recipientPhone, setRecipientPhone] = useState('');
  const [templateParams, setTemplateParams] = useState({});
  const [isSending, setIsSending] = useState(false);

  // Bulk send state
  const [bulkFilterStatus, setBulkFilterStatus] = useState('all');
  const [bulkFilterAgent, setBulkFilterAgent] = useState('all');
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Calculate estimated recipients
  useEffect(() => {
    if (sendMode === 'bulk') {
      const getEstimatedCount = () => {
        const mockCounts = {
          'all': 150,
          'contacted': 45,
          'interested': 30,
          'hot': 15,
          'cold': 25,
          'demo': 20,
          'real': 15,
        };
        return mockCounts[bulkFilterStatus] || 0;
      };
      setEstimatedRecipients(getEstimatedCount());
    }
  }, [sendMode, bulkFilterStatus, bulkFilterAgent]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      // Reset state on open to ensure fresh start
      setSelectedTemplate(null);
      setRecipientPhone('');
      setTemplateParams({});
      setSendMode('single');
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, templates]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await getWatiTemplates();
      if (result.success && result.data) {
        const templatesList = result.data.messageTemplates || result.templates || result.data || [];
        const activeTemplates = templatesList.filter(t =>
          t.status !== 'DELETED' && t.status !== 'REJECTED'
        );
        setTemplates(activeTemplates);
        const uniqueCategories = [...new Set(activeTemplates.map(t => t.category || 'UNCATEGORIZED'))];
        setCategories(uniqueCategories);
      } else {
        toast.error(result.message || 'Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => (t.category || 'UNCATEGORIZED') === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        (t.elementName || '').toLowerCase().includes(query) ||
        (t.body || '').toLowerCase().includes(query) ||
        (t.category || '').toLowerCase().includes(query)
      );
    }
    setFilteredTemplates(filtered);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setSendMode('single');
    // Extract parameters
    if (template.customParams && template.customParams.length > 0) {
      const params = {};
      template.customParams.forEach((param, index) => {
        params[index] = {
          name: param.paramName,
          value: '',
          placeholder: param.paramValue || '',
        };
      });
      setTemplateParams(params);
    } else {
      const paramMatches = (template.body || '').match(/\{\{(\d+)\}\}/g);
      if (paramMatches) {
        const uniqueParams = [...new Set(paramMatches)];
        const params = {};
        uniqueParams.forEach((match, index) => {
          const paramNum = match.match(/\d+/)[0];
          params[index] = {
            name: paramNum,
            value: '',
            placeholder: '',
          };
        });
        setTemplateParams(params);
      } else {
        setTemplateParams({});
      }
    }
  };

  const handleBackToList = () => {
    setSelectedTemplate(null);
    setRecipientPhone('');
    setTemplateParams({});
    setSendMode('single');
  };

  const handleSendTemplateMessage = async () => {
    if (!recipientPhone.trim() && sendMode === 'single') {
      toast.error('Please enter recipient phone number');
      return;
    }

    if (!selectedTemplate) return;

    // Validate parameters
    const requiredParams = Object.keys(templateParams);
    const missingParams = requiredParams.filter(key => {
      const param = templateParams[key];
      return typeof param === 'object' ? !param.value?.trim() : !param?.trim();
    });

    if (missingParams.length > 0) {
      toast.error('Please fill in all template parameters');
      return;
    }

    setIsSending(true);
    try {
      const formattedParams = Object.keys(templateParams)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => {
          const param = templateParams[key];
          if (typeof param === 'object') {
            return { name: param.name, value: param.value };
          }
          return { name: key, value: param };
        });

      const result = await sendWatiTemplateMessage(
        recipientPhone,
        selectedTemplate.elementName,
        formattedParams
      );

      if (result.success) {
        toast.success('Template message sent successfully!');
        handleBackToList(); // Go back to list after success
      } else {
        toast.error(result.message || 'Failed to send template message');
      }
    } catch (error) {
      console.error('Error sending template:', error);
      toast.error('Failed to send template message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'APPROVED': { color: 'green', label: 'Approved' },
      'PENDING': { color: 'yellow', label: 'Pending' },
      'REJECTED': { color: 'red', label: 'Rejected' },
    };
    const statusInfo = statusMap[status] || { color: 'gray', label: status };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
        statusInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
          statusInfo.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
        {statusInfo.color === 'green' && <CheckCircle className="w-3 h-3" />}
        {statusInfo.color === 'yellow' && <AlertCircle className="w-3 h-3" />}
        {statusInfo.label}
      </span>
    );
  };

  const renderTemplatePreview = (template, params) => {
    let text = template.body || '';
    Object.keys(params).forEach((key, idx) => {
      const param = params[key];
      const value = typeof param === 'object' ? (param.value || `{{${idx + 1}}}`) : (param || `{{${key}}}`);
      text = text.replace(
        new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'),
        `<span class="text-[#BBA473] font-semibold bg-[#BBA473]/10 px-1 rounded">${value}</span>`
      );
    });
    return text;
  };

  const renderTemplateText = (text) => {
    if (!text) return '';
    return text.replace(/\{\{(\d+)\}\}/g, '<span class="text-[#BBA473] font-semibold">{{$1}}</span>');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className={`bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col border border-[#BBA473]/30 pointer-events-auto transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Container - Using Relative Positioning for Cross-Fade */}
          <div className="relative flex-1 overflow-hidden flex flex-col rounded-2xl">

            {/* === View 1: Template List (Cross-fade) === */}
            <div
              className={`absolute inset-0 flex flex-col transition-all duration-300 ease-in-out ${selectedTemplate ? 'opacity-0 pointer-events-none scale-[0.98]' : 'opacity-100 scale-100 z-10'}`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                        <FileText className="w-5 h-5 text-black" />
                      </div>
                      Template Manager
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">View and send WhatsApp message templates</p>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-6 border-b border-[#BBA473]/20 flex-shrink-0">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                    />
                  </div>
                  <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 appearance-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={fetchTemplates}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#BBA473]/20 border-t-[#BBA473]"></div>
                    <span className="text-gray-400 mt-4">Loading templates...</span>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg">No templates found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters' : 'No templates are available'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id || template.elementName}
                        onClick={() => handleSelectTemplate(template)}
                        className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20 hover:border-[#BBA473]/40 transition-all duration-300 hover:shadow-lg group flex flex-col h-full cursor-pointer hover:scale-[1.01]"
                      >
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-base truncate group-hover:text-[#BBA473] transition-colors">{template.elementName}</h3>
                            <p className="text-gray-400 text-xs mt-1">{template.category || 'UNCATEGORIZED'}</p>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(template.status)}</div>
                        </div>
                        <div className="bg-[#1A1A1A] rounded-lg p-3 mb-3 border border-[#BBA473]/10 flex-1">
                          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: renderTemplateText(template.body) }} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
                          <span className="flex items-center gap-1">
                            <span className="text-[#BBA473]">🌐</span>
                            {template.language?.text || template.language?.key || 'N/A'}
                          </span>
                          <div className="flex-1"></div>
                          <span className="text-[#BBA473] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Configure & Send <ArrowLeft className="w-4 h-4 rotate-180" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* === View 2: Detail & Send (Cross-fade) === */}
            <div
              className={`absolute inset-0 flex flex-col bg-[#1A1A1A] transition-all duration-300 ease-in-out ${selectedTemplate ? 'opacity-100 scale-100 z-20' : 'opacity-0 pointer-events-none scale-[1.02] z-0'}`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBackToList}
                      className="p-2 rounded-lg bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] transition-all duration-300 group"
                    >
                      <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#BBA473]" />
                        Configure Template
                      </h2>
                      <p className="text-gray-400 text-sm mt-0.5 max-w-md truncate">
                        {selectedTemplate?.elementName}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content Split: Left (Preview) and Right (Config) */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                {/* Left Column: Template Details & Live Preview */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-b lg:border-b-0 lg:border-r border-[#BBA473]/20 bg-[#1A1A1A]/30">
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Live Preview</label>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedTemplate?.status)}
                      </div>
                    </div>

                    {/* Phone Preview Box */}
                    <div className="bg-[#1A1A1A] rounded-2xl min-h-[200px] p-6 border-2 border-[#BBA473]/20 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Users className="w-32 h-32" />
                      </div>

                      {selectedTemplate && (
                        <>
                          {selectedTemplate.header && selectedTemplate.header.text && (
                            <div className="mb-4 pb-4 border-b border-[#BBA473]/10">
                              <p className="text-[#BBA473] font-bold text-lg">{selectedTemplate.header.text}</p>
                            </div>
                          )}

                          <div className="prose prose-invert max-w-none">
                            <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: renderTemplatePreview(selectedTemplate, templateParams) }}
                            />
                          </div>

                          {selectedTemplate.footer && (
                            <div className="mt-4 pt-4 border-t border-[#BBA473]/10">
                              <p className="text-gray-500 text-sm italic">{selectedTemplate.footer}</p>
                            </div>
                          )}

                          {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                            <div className="mt-4 flex flex-col gap-2">
                              {selectedTemplate.buttons.map((btn, idx) => (
                                <div key={idx} className="w-full py-2.5 bg-[#2A2A2A] rounded-lg text-center text-[#BBA473] text-sm font-semibold border border-[#BBA473]/20 shadow-sm">
                                  {btn.parameter?.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-blue-400 font-semibold text-sm">Pro Tip</p>
                        <p className="text-blue-300/80 text-xs mt-1 leading-relaxed">
                          Variables are highlighted in gold. Ensure they are filled correctly before sending.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Configuration Form */}
                <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col bg-[#2A2A2A]/50 backdrop-blur-sm z-20">
                  <div className="flex-1 overflow-y-auto custom-scrollbar relative">

                    {/* Sticky Tabs */}
                    <div className="sticky top-0 z-30 bg-[#2A2A2A] border-b border-[#BBA473]/20 p-4 shadow-md bg-opacity-95 backdrop-blur-md">
                      <div className="bg-[#1A1A1A] p-1 rounded-xl flex gap-1 border border-[#BBA473]/10">
                        <button
                          onClick={() => setSendMode('single')}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${sendMode === 'single' ? 'bg-[#2A2A2A] text-[#BBA473] shadow-md' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                          <User className="w-4 h-4" /> Single
                        </button>
                        <button
                          onClick={() => setSendMode('bulk')}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${sendMode === 'bulk' ? 'bg-[#2A2A2A] text-[#BBA473] shadow-md' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                          <Users className="w-4 h-4" /> Bulk
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Recipient Input */}
                      {sendMode === 'single' ? (
                        <div className="animate-fadeIn">
                          <label className="text-gray-300 text-sm font-medium mb-2 block">Recipient Phone Number</label>
                          <input
                            type="tel"
                            placeholder="e.g., +971501234567"
                            value={recipientPhone}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9+]*$/.test(val)) setRecipientPhone(val);
                            }}
                            className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fadeIn">
                          {/* Bulk Filters */}
                          <div className="relative">
                            <label className="text-gray-300 text-sm font-medium mb-2 block">Filter by Status</label>
                            <div className="relative">
                              <select
                                value={bulkFilterStatus}
                                onChange={(e) => setBulkFilterStatus(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-[#BBA473]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white appearance-none cursor-pointer"
                              >
                                <option value="all">All Contacts</option>
                                <option value="contacted">Contacted</option>
                                <option value="interested">Interested</option>
                                <option value="hot">Hot Lead</option>
                                <option value="cold">Cold Lead</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                            </div>
                          </div>
                          <div className="p-4 bg-[#BBA473]/10 rounded-xl border border-[#BBA473]/20 flex items-center justify-between">
                            <div>
                              <span className="text-[#BBA473] font-semibold block">Estimated Reach</span>
                              <span className="text-xs text-gray-400">Contacts matching filters</span>
                            </div>
                            <span className="text-3xl font-bold text-white">{estimatedRecipients}</span>
                          </div>
                        </div>
                      )}

                      {/* Parameters Input */}
                      {Object.keys(templateParams).length > 0 && (
                        <div className="animate-fadeIn">
                          <label className="text-gray-300 text-sm font-medium mb-3 block flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[#BBA473]/20 flex items-center justify-center text-[#BBA473] text-xs">📝</div>
                            Template Variables
                          </label>
                          <div className="space-y-3 bg-[#1A1A1A] p-4 rounded-xl border border-[#BBA473]/10">
                            {Object.keys(templateParams).sort((a, b) => parseInt(a) - parseInt(b)).map((paramKey) => {
                              const param = templateParams[paramKey];
                              const paramName = typeof param === 'object' ? param.name : paramKey;
                              const paramValue = typeof param === 'object' ? param.value : param;
                              return (
                                <div key={paramKey}>
                                  <label className="text-xs text-gray-500 mb-1 ml-1 block font-mono">Variable {parseInt(paramKey) + 1} ({paramName})</label>
                                  <input
                                    type="text"
                                    placeholder={`Enter value`}
                                    value={paramValue}
                                    onChange={(e) => setTemplateParams({
                                      ...templateParams,
                                      [paramKey]: typeof param === 'object' ? { ...param, value: e.target.value } : e.target.value
                                    })}
                                    className="w-full px-4 py-2.5 border border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#2A2A2A] text-white text-sm"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Send Footer */}
                  <div className="p-6 border-t border-[#BBA473]/30 bg-[#1A1A1A] flex-shrink-0 z-30">
                    {selectedTemplate?.status === 'APPROVED' ? (
                      <button
                        onClick={handleSendTemplateMessage}
                        disabled={isSending || (sendMode === 'single' && !recipientPhone)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] hover:shadow-xl hover:scale-[1.02]"
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" /> Send Message
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full py-4 bg-gray-700/30 text-gray-400 rounded-xl text-center font-medium border border-gray-600/30">
                        Template not approved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default InboxTemplateManager;