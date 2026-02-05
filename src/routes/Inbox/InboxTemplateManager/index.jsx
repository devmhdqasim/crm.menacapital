import React, { useState, useEffect } from 'react';
import { X, Search, Send, FileText, AlertCircle, CheckCircle, RefreshCw, Eye, Filter, ChevronDown, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWatiTemplates, sendWatiTemplateMessage } from '../../../services/inboxService';

const InboxTemplateManager = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  
  // Send template modal state
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

  // Calculate estimated recipients based on filters (placeholder - will need actual API integration)
  useEffect(() => {
    if (sendMode === 'bulk') {
      // This is a placeholder - you should replace with actual API call to get count
      // For now, showing a mock calculation
      const getEstimatedCount = () => {
        // Mock data - replace with actual API call
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

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isOpen || selectedTemplate || showSendModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedTemplate, showSendModal]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, templates]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await getWatiTemplates();
      
      console.log('📋 Templates API result:', result);
      
      if (result.success && result.data) {
        // Wati returns templates in messageTemplates array
        const templatesList = result.data.messageTemplates || result.templates || result.data || [];
        
        console.log('📋 Raw templates list:', templatesList);
        
        // Filter out DELETED templates and only show APPROVED templates
        const activeTemplates = templatesList.filter(t => 
          t.status !== 'DELETED' && t.status !== 'REJECTED'
        );
        
        console.log('✅ Active templates:', activeTemplates);
        
        setTemplates(activeTemplates);
        
        // Extract unique categories from active templates
        const uniqueCategories = [...new Set(activeTemplates.map(t => t.category || 'UNCATEGORIZED'))];
        setCategories(uniqueCategories);
        
        if (activeTemplates.length === 0) {
          toast.info('No active templates found. Templates must be APPROVED to appear here.');
        }
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

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => (t.category || 'UNCATEGORIZED') === selectedCategory);
    }

    // Filter by search query
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

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleSendTemplate = (template) => {
    setSelectedTemplate(template);
    setShowSendModal(true);
    setSendMode('single'); // Reset to single mode
    
    // Extract parameters from template body ({{1}}, {{2}}, etc.)
    const paramMatches = (template.body || '').match(/\{\{(\d+)\}\}/g);
    if (paramMatches) {
      const params = {};
      paramMatches.forEach(match => {
        const paramNum = match.match(/\d+/)[0];
        params[paramNum] = '';
      });
      setTemplateParams(params);
    } else {
      setTemplateParams({});
    }
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setRecipientPhone('');
    setTemplateParams({});
    setSendMode('single');
    setBulkFilterStatus('all');
    setBulkFilterAgent('all');
  };

  const handleSendTemplateMessage = async () => {
    if (!recipientPhone.trim()) {
      toast.error('Please enter recipient phone number');
      return;
    }

    if (!selectedTemplate) {
      toast.error('No template selected');
      return;
    }

    // Validate all parameters are filled
    const requiredParams = Object.keys(templateParams);
    const missingParams = requiredParams.filter(key => !templateParams[key].trim());
    
    if (missingParams.length > 0) {
      toast.error('Please fill in all template parameters');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendWatiTemplateMessage(
        recipientPhone,
        selectedTemplate.elementName,
        Object.values(templateParams)
      );

      if (result.success) {
        toast.success('Template message sent successfully!');
        setShowSendModal(false);
        setRecipientPhone('');
        setTemplateParams({});
        setSelectedTemplate(null);
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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
        statusInfo.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
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

  // Function to render template with actual parameter values
  const renderTemplatePreview = (template, params) => {
    let text = template.body || '';
    
    // Replace parameters with actual values or placeholders
    Object.keys(params).forEach(key => {
      const value = params[key] || `{{${key}}}`;
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `<span class="text-[#BBA473] font-semibold bg-[#BBA473]/10 px-1 rounded">${value}</span>`);
    });
    
    return text;
  };

  const renderTemplateText = (text) => {
    if (!text) return '';
    // Highlight parameters in template text
    return text.replace(/\{\{(\d+)\}\}/g, '<span class="text-[#BBA473] font-semibold">{{$1}}</span>');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Main Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}>
        <div 
          className={`bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-[#BBA473]/30 pointer-events-auto transition-all duration-300 ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-black" />
                  </div>
                  Template Manager
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  View and send WhatsApp message templates
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-[#BBA473]/20">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates by name or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                />
              </div>

              {/* Category Filter */}
              <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchTemplates}
                disabled={isLoading}
                className="px-4 py-2.5 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                Total: <span className="text-white font-semibold">{templates.length}</span>
              </span>
              <span className="text-gray-400">
                Showing: <span className="text-white font-semibold">{filteredTemplates.length}</span>
              </span>
            </div>
          </div>

          {/* Templates List */}
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
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No templates are available in your Wati account'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id || template.elementName}
                    className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20 hover:border-[#BBA473]/40 transition-all duration-300 hover:shadow-lg group flex flex-col h-full"
                  >
                    {/* Template Header */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base truncate group-hover:text-[#BBA473] transition-colors">
                          {template.elementName}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                          {template.category || 'UNCATEGORIZED'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(template.status)}
                      </div>
                    </div>

                    {/* Template Header Preview (if exists) */}
                    {template.header && template.header.type > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 bg-[#1A1A1A]/50 rounded-lg px-3 py-2 border border-[#BBA473]/10">
                          <span className="text-[#BBA473] text-xs font-semibold">
                            📎 {template.header.headerTypeString}
                          </span>
                          {template.header.text && (
                            <span className="text-gray-400 text-xs truncate">
                              {template.header.text}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Template Content Preview */}
                    <div className="bg-[#1A1A1A] rounded-lg p-3 mb-3 border border-[#BBA473]/10 flex-1">
                      <p 
                        className="text-gray-300 text-sm leading-relaxed line-clamp-4"
                        dangerouslySetInnerHTML={{ 
                          __html: renderTemplateText(template.body) 
                        }}
                      />
                    </div>

                    {/* Template Footer Preview (if exists) */}
                    {template.footer && (
                      <div className="mb-3">
                        <p className="text-gray-500 text-xs italic">
                          {template.footer}
                        </p>
                      </div>
                    )}

                    {/* Buttons Preview (if exists) */}
                    {template.buttons && template.buttons.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {template.buttons.slice(0, 2).map((btn, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] rounded text-xs text-[#BBA473] border border-[#BBA473]/20">
                            🔘 {btn.parameter?.text}
                          </span>
                        ))}
                        {template.buttons.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 bg-[#1A1A1A] rounded text-xs text-gray-400">
                            +{template.buttons.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Template Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="text-[#BBA473]">🌐</span>
                        {template.language?.text || template.language?.key || 'N/A'}
                      </span>
                      {/* Count parameters */}
                      {(() => {
                        const paramCount = (template.body || '').match(/\{\{\d+\}\}/g)?.length || 0;
                        return paramCount > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-[#BBA473]">📝</span>
                            {paramCount} parameter{paramCount > 1 ? 's' : ''}
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleViewTemplate(template)}
                        className="flex-1 px-3 py-2 bg-[#BBA473]/10 hover:bg-[#BBA473]/20 text-[#BBA473] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {template.status === 'APPROVED' && (
                        <button
                          onClick={() => handleSendTemplate(template)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Bottom Spacer for better UX */}
              <div className="h-8"></div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && !showSendModal && (
        <div className={`fixed inset-0 z-60 flex items-center justify-center p-4 transition-opacity duration-300 ${
          selectedTemplate ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedTemplate(null)}
          />
          <div 
            className={`bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden relative z-10 border border-[#BBA473]/30 flex flex-col transition-all duration-300 ${
              selectedTemplate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-xl font-bold text-white truncate">{selectedTemplate.elementName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedTemplate.status)}
                    <span className="text-gray-400 text-sm">
                      {selectedTemplate.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Template Header Section */}
              {selectedTemplate.header && selectedTemplate.header.type > 0 && (
                <div>
                  <label className="text-gray-400 text-sm font-semibold mb-2 block flex items-center gap-2">
                    <span className="text-[#BBA473]">📎</span>
                    Header ({selectedTemplate.header.headerTypeString})
                  </label>
                  <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#BBA473]/20">
                    {selectedTemplate.header.text && (
                      <p className="text-white font-semibold mb-2">{selectedTemplate.header.text}</p>
                    )}
                    {selectedTemplate.header.link && (
                      <div className="mt-2">
                        <a 
                          href={selectedTemplate.header.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 text-[#BBA473] hover:text-[#d4bc89] text-sm transition-colors"
                        >
                          <span>View {selectedTemplate.header.headerTypeString}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Template Body */}
              <div>
                <label className="text-gray-400 text-sm font-semibold mb-2 block flex items-center gap-2">
                  <span className="text-[#BBA473]">💬</span>
                  Message Body
                </label>
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#BBA473]/20">
                  <p 
                    className="text-white leading-relaxed whitespace-pre-wrap text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: renderTemplateText(selectedTemplate.body) 
                    }}
                  />
                </div>
              </div>

              {/* Footer Section */}
              {selectedTemplate.footer && (
                <div>
                  <label className="text-gray-400 text-sm font-semibold mb-2 block flex items-center gap-2">
                    <span className="text-[#BBA473]">📄</span>
                    Footer
                  </label>
                  <div className="bg-[#2A2A2A] rounded-lg p-3 border border-[#BBA473]/20">
                    <p className="text-gray-300 text-sm italic">{selectedTemplate.footer}</p>
                  </div>
                </div>
              )}

              {/* Buttons Section */}
              {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm font-semibold mb-2 block flex items-center gap-2">
                    <span className="text-[#BBA473]">🔘</span>
                    Buttons ({selectedTemplate.buttons.length})
                  </label>
                  <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#BBA473]/20 space-y-2">
                    {selectedTemplate.buttons.map((btn, idx) => (
                      <div key={idx} className="bg-[#1A1A1A] rounded-lg p-3 border border-[#BBA473]/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">{btn.parameter?.text}</p>
                            {btn.type && (
                              <p className="text-gray-500 text-xs mt-1">Type: {btn.type}</p>
                            )}
                          </div>
                        </div>
                        {btn.parameter?.url && (
                          <a 
                            href={btn.parameter.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#BBA473] hover:text-[#d4bc89] text-xs mt-2 inline-flex items-center gap-1 transition-colors"
                          >
                            <span className="truncate">{btn.parameter.url}</span>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Language */}
                {selectedTemplate.language && (
                  <div>
                    <label className="text-gray-400 text-sm font-semibold mb-2 block">Language</label>
                    <div className="bg-[#2A2A2A] rounded-lg p-3 border border-[#BBA473]/20">
                      <p className="text-white text-sm">{selectedTemplate.language.text || selectedTemplate.language.key}</p>
                    </div>
                  </div>
                )}

                {/* Parameters Count */}
                {(() => {
                  const paramCount = (selectedTemplate.body || '').match(/\{\{\d+\}\}/g)?.length || 0;
                  return paramCount > 0 ? (
                    <div>
                      <label className="text-gray-400 text-sm font-semibold mb-2 block">Parameters</label>
                      <div className="bg-[#2A2A2A] rounded-lg p-3 border border-[#BBA473]/20">
                        <p className="text-white text-sm">{paramCount} parameter{paramCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Action Footer */}
            {selectedTemplate.status === 'APPROVED' && (
              <div className="sticky bottom-0 bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5 rounded-b-2xl">
                <button
                  onClick={() => handleSendTemplate(selectedTemplate)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <Send className="w-5 h-5" />
                  Send This Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Template Modal */}
      {showSendModal && selectedTemplate && (
        <div className={`fixed inset-0 z-60 flex items-center justify-center p-4 transition-opacity duration-300 ${
          showSendModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleCloseSendModal}
          />
          <div 
            className={`bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-3xl relative z-10 border border-[#BBA473]/30 transition-all duration-300 ${
              showSendModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-xl font-bold text-white">Send Template Message</h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedTemplate.elementName}</p>
                </div>
                <button
                  onClick={handleCloseSendModal}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setSendMode('single')}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                    sendMode === 'single'
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black shadow-lg'
                      : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Single Recipient
                </button>
                <button
                  onClick={() => setSendMode('bulk')}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                    sendMode === 'bulk'
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black shadow-lg'
                      : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Bulk Send
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] min-h-[400px] overflow-y-auto custom-scrollbar">
              {/* Template Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#BBA473]" />
                    Live Template Preview
                  </label>
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="text-[#BBA473] hover:text-[#d4bc89] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Expand Preview
                  </button>
                </div>
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#BBA473]/20">
                  {selectedTemplate.header && selectedTemplate.header.text && (
                    <div className="mb-3 pb-3 border-b border-[#BBA473]/10">
                      <p className="text-[#BBA473] text-sm font-semibold">{selectedTemplate.header.text}</p>
                    </div>
                  )}
                  <p 
                    className="text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: renderTemplatePreview(selectedTemplate, templateParams) 
                    }}
                  />
                  {selectedTemplate.footer && (
                    <div className="mt-3 pt-3 border-t border-[#BBA473]/10">
                      <p className="text-gray-500 text-xs italic">{selectedTemplate.footer}</p>
                    </div>
                  )}
                  {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#BBA473]/10 flex flex-wrap gap-2">
                      {selectedTemplate.buttons.map((btn, idx) => (
                        <div key={idx} className="px-3 py-1.5 bg-[#1A1A1A] rounded-lg text-xs text-[#BBA473] border border-[#BBA473]/20">
                          {btn.parameter?.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Single Recipient Form */}
              {sendMode === 'single' && (
                <>
                  <div>
                    <label className="text-gray-400 text-sm font-semibold mb-2 block">
                      Recipient Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., +971501234567"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +971 for UAE)</p>
                  </div>
                </>
              )}

              {/* Bulk Send Form */}
              {sendMode === 'bulk' && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-400 text-sm font-semibold">Bulk Send</p>
                        <p className="text-blue-300/80 text-xs mt-1">
                          This will send the template to all leads matching your filters. Use with caution.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filter Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm font-semibold mb-2 block">Filter by Status</label>
                      <select
                        value={bulkFilterStatus}
                        onChange={(e) => setBulkFilterStatus(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                      >
                        <option value="all">All Statuses</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="hot">Hot Leads</option>
                        <option value="cold">Cold Leads</option>
                        <option value="demo">Demo</option>
                        <option value="real">Real</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm font-semibold mb-2 block">Estimated Recipients</label>
                      <div className="bg-[#2A2A2A] rounded-lg p-3 border border-[#BBA473]/20 flex items-center justify-between">
                        <span className="text-white font-semibold text-lg">{estimatedRecipients} leads</span>
                        <span className="text-xs text-gray-500 bg-[#1A1A1A] px-2 py-1 rounded">
                          {bulkFilterStatus === 'all' ? 'All statuses' : bulkFilterStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Template Parameters */}
              {Object.keys(templateParams).length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm font-semibold mb-3 block">
                    Template Parameters * <span className="text-xs text-gray-500 font-normal">(Values update live in preview)</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(templateParams).sort((a, b) => parseInt(a) - parseInt(b)).map((paramKey) => (
                      <div key={`param-${paramKey}`}>
                        <label className="text-gray-300 text-xs mb-1 block">
                          Parameter {paramKey}
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter value for parameter ${paramKey}`}
                          value={templateParams[paramKey]}
                          onChange={(e) => setTemplateParams({
                            ...templateParams,
                            [paramKey]: e.target.value
                          })}
                          className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 text-sm font-semibold">24-Hour Messaging Window</p>
                    <p className="text-yellow-300/80 text-xs mt-1">
                      {sendMode === 'single' 
                        ? 'Template messages can only be sent if the recipient has messaged you first or within 24 hours of their last message.'
                        : 'Template messages will only be sent to contacts who have messaged you within the last 24 hours.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-5 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseSendModal}
                  className="flex-1 px-4 py-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-lg transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTemplateMessage}
                  disabled={isSending || (sendMode === 'single' && !recipientPhone.trim())}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] hover:from-[#d4bc89] hover:to-[#a69363] text-black rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {sendMode === 'single' ? 'Send Template' : 'Send to All'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-300 ${
          showPreviewModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowPreviewModal(false)}
          />
          <div 
            className={`bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 border border-[#BBA473]/30 transition-all duration-300 ${
              showPreviewModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-5 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-xl font-bold text-white">Full Template Preview</h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedTemplate.elementName}</p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Phone-like preview container */}
              <div className="bg-[#0A0A0A] rounded-3xl p-4 shadow-2xl border-4 border-[#2A2A2A] max-w-md mx-auto">
                {/* Phone header */}
                <div className="bg-[#1A1A1A] rounded-t-2xl px-4 py-3 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">WhatsApp Business</p>
                      <p className="text-gray-500 text-xs">Online</p>
                    </div>
                  </div>
                </div>

                {/* Message bubble - Scrollable */}
                <div className="bg-[#1A1A1A] rounded-b-2xl p-4 max-h-[500px] overflow-y-auto custom-scrollbar-dark">
                  <div className="bg-[#005C4B] rounded-lg rounded-tl-none p-4 shadow-lg">
                    {/* Header */}
                    {selectedTemplate.header && selectedTemplate.header.type > 0 && (
                      <div className="mb-3 pb-3 border-b border-white/10">
                        {selectedTemplate.header.text && (
                          <p className="text-white font-bold text-sm">{selectedTemplate.header.text}</p>
                        )}
                        {selectedTemplate.header.type === 3 && selectedTemplate.header.link && (
                          <div className="mt-2 bg-black/20 rounded p-2 text-xs text-white/80">
                            📷 Image attached
                          </div>
                        )}
                        {selectedTemplate.header.type === 4 && selectedTemplate.header.link && (
                          <div className="mt-2 bg-black/20 rounded p-2 text-xs text-white/80">
                            📄 Document attached
                          </div>
                        )}
                      </div>
                    )}

                    {/* Body */}
                    <p 
                      className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ 
                        __html: renderTemplatePreview(selectedTemplate, templateParams).replace(/class=/g, 'className=')
                      }}
                    />

                    {/* Footer */}
                    {selectedTemplate.footer && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/60 text-xs break-words">{selectedTemplate.footer}</p>
                      </div>
                    )}

                    {/* Buttons */}
                    {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {selectedTemplate.buttons.map((btn, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-center cursor-pointer transition-colors"
                          >
                            <p className="text-white text-sm font-medium break-words">{btn.parameter?.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <span className="text-white/50 text-xs">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-4 rounded-b-2xl flex-shrink-0">
              <p className="text-center text-gray-500 text-xs">
                This is how your template will appear in WhatsApp
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1A1A;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #BBA473 0%, #8E7D5A 100%);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #d4bc89 0%, #a69363 100%);
        }

        /* Dark scrollbar for message preview */
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .z-60 {
          z-index: 60;
        }

        .z-\\[70\\] {
          z-index: 70;
        }

        /* Smooth transitions for modals */
        .modal-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Backdrop blur animation */
        @supports (backdrop-filter: blur(10px)) {
          .backdrop-blur-md {
            backdrop-filter: blur(12px);
          }
        }
      `}</style>
    </>
  );
};

export default InboxTemplateManager;