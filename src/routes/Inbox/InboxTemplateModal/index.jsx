import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Image, Video, FileIcon, Link, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const InboxTemplateModal = ({ isOpen, onClose }) => {
  const [templateData, setTemplateData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en',
    header: {
      type: 'NONE',
      text: '',
      mediaUrl: '',
    },
    body: '',
    footer: '',
    buttons: [],
    variables: [],
  });

  const [showVariableHelper, setShowVariableHelper] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Prevent body scroll when modal is open
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

  // Real-time validation
  useEffect(() => {
    const errors = {};
    
    if (touched.name && !templateData.name.trim()) {
      errors.name = 'Template name is required';
    } else if (touched.name && !/^[a-z0-9_]+$/.test(templateData.name)) {
      errors.name = 'Only lowercase letters, numbers, and underscores';
    }
    
    if (touched.body && !templateData.body.trim()) {
      errors.body = 'Message body is required';
    } else if (touched.body && templateData.body.length > 1024) {
      errors.body = 'Body exceeds 1024 characters';
    }
    
    if (templateData.header.type === 'TEXT') {
      if (touched.headerText && !templateData.header.text.trim()) {
        errors.headerText = 'Header text is required';
      } else if (touched.headerText && templateData.header.text.length > 60) {
        errors.headerText = 'Header exceeds 60 characters';
      }
    }
    
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(templateData.header.type)) {
      if (touched.mediaUrl && !templateData.header.mediaUrl.trim()) {
        errors.mediaUrl = 'Media URL is required';
      }
    }
    
    if (touched.footer && templateData.footer.length > 60) {
      errors.footer = 'Footer exceeds 60 characters';
    }
    
    setValidationErrors(errors);
  }, [templateData, touched]);

  const categories = [
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'AUTHENTICATION', label: 'Authentication' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'en_US', label: 'English (US)' },
    { value: 'en_GB', label: 'English (GB)' },
    { value: 'ar', label: 'Arabic' },
    { value: 'es', label: 'Spanish' },
    { value: 'pt_BR', label: 'Portuguese (Brazil)' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'ru', label: 'Russian' },
    { value: 'hi', label: 'Hindi' },
    { value: 'id', label: 'Indonesian' },
    { value: 'tr', label: 'Turkish' },
  ];

  const headerTypes = [
    { value: 'NONE', label: 'No Header', icon: null },
    { value: 'TEXT', label: 'Text', icon: FileText },
    { value: 'IMAGE', label: 'Image', icon: Image },
    { value: 'VIDEO', label: 'Video', icon: Video },
    { value: 'DOCUMENT', label: 'Document', icon: FileIcon },
  ];

  const buttonTypes = [
    { value: 'QUICK_REPLY', label: 'Quick Reply' },
    { value: 'CALL_TO_ACTION', label: 'Call to Action' },
  ];

  const actionTypes = [
    { value: 'PHONE_NUMBER', label: 'Phone Number' },
    { value: 'URL', label: 'URL' },
  ];

  const handleInputChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHeaderChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      header: {
        ...prev.header,
        [field]: value,
        // Reset mediaUrl when changing to TEXT or NONE
        ...(field === 'type' && (value === 'TEXT' || value === 'NONE') ? { mediaUrl: '' } : {}),
        // Reset text when changing to media types
        ...(field === 'type' && value !== 'TEXT' && value !== 'NONE' ? { text: '' } : {}),
      },
    }));
  };

  const addButton = () => {
    if (templateData.buttons.length >= 3) {
      toast.error('Maximum 3 buttons allowed');
      return;
    }

    setTemplateData(prev => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        {
          id: Date.now(),
          type: 'QUICK_REPLY',
          text: '',
          actionType: 'URL',
          actionValue: '',
        },
      ],
    }));
  };

  const removeButton = (id) => {
    setTemplateData(prev => ({
      ...prev,
      buttons: prev.buttons.filter(btn => btn.id !== id),
    }));
  };

  const handleButtonChange = (id, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      buttons: prev.buttons.map(btn =>
        btn.id === id
          ? {
              ...btn,
              [field]: value,
              // Reset action fields when changing button type
              ...(field === 'type' && value === 'QUICK_REPLY' ? { actionType: '', actionValue: '' } : {}),
            }
          : btn
      ),
    }));
  };

  const extractVariables = (text) => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(regex)];
    return matches.map(match => parseInt(match[1]));
  };

  const countVariables = () => {
    const bodyVars = extractVariables(templateData.body);
    const headerVars = templateData.header.type === 'TEXT' ? extractVariables(templateData.header.text) : [];
    return {
      body: bodyVars.length,
      header: headerVars.length,
      total: bodyVars.length + headerVars.length,
    };
  };

  const validateTemplate = () => {
    const errors = [];

    // Name validation
    if (!templateData.name.trim()) {
      errors.push('Template name is required');
    } else if (!/^[a-z0-9_]+$/.test(templateData.name)) {
      errors.push('Template name must be lowercase letters, numbers, and underscores only');
    }

    // Body validation
    if (!templateData.body.trim()) {
      errors.push('Template body is required');
    } else if (templateData.body.length > 1024) {
      errors.push('Template body must not exceed 1024 characters');
    }

    // Header validation
    if (templateData.header.type === 'TEXT' && !templateData.header.text.trim()) {
      errors.push('Header text is required when header type is TEXT');
    } else if (templateData.header.type === 'TEXT' && templateData.header.text.length > 60) {
      errors.push('Header text must not exceed 60 characters');
    }

    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(templateData.header.type) && !templateData.header.mediaUrl.trim()) {
      errors.push(`Media URL is required for ${templateData.header.type.toLowerCase()} header`);
    }

    // Footer validation
    if (templateData.footer && templateData.footer.length > 60) {
      errors.push('Footer must not exceed 60 characters');
    }

    // Button validation
    templateData.buttons.forEach((btn, index) => {
      if (!btn.text.trim()) {
        errors.push(`Button ${index + 1} text is required`);
      } else if (btn.text.length > 25) {
        errors.push(`Button ${index + 1} text must not exceed 25 characters`);
      }

      if (btn.type === 'CALL_TO_ACTION') {
        if (!btn.actionValue.trim()) {
          errors.push(`Button ${index + 1} action value is required`);
        }
        if (btn.actionType === 'PHONE_NUMBER' && !/^\+\d{1,15}$/.test(btn.actionValue)) {
          errors.push(`Button ${index + 1} phone number must be in format +1234567890`);
        }
        if (btn.actionType === 'URL' && !btn.actionValue.startsWith('https://')) {
          errors.push(`Button ${index + 1} URL must start with https://`);
        }
      }
    });

    // Variable validation
    const varCounts = countVariables();
    const bodyVars = extractVariables(templateData.body);
    const headerVars = templateData.header.type === 'TEXT' ? extractVariables(templateData.header.text) : [];
    
    // Check for sequential numbering
    const allVars = [...headerVars, ...bodyVars].sort((a, b) => a - b);
    for (let i = 0; i < allVars.length; i++) {
      if (allVars[i] !== i + 1) {
        errors.push('Variables must be numbered sequentially starting from {1}');
        break;
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateTemplate();
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error, { duration: 4000 }));
      return;
    }

    // TODO: Integrate with Wati API in next chat
    console.log('Template data to submit:', templateData);
    
    toast.success('Template validation passed! API integration coming next.', {
      duration: 3000,
    });
    
    // Don't close modal yet - will close after successful API call
  };

  const handleReset = () => {
    setTemplateData({
      name: '',
      category: 'MARKETING',
      language: 'en',
      header: {
        type: 'NONE',
        text: '',
        mediaUrl: '',
      },
      body: '',
      footer: '',
      buttons: [],
      variables: [],
    });
    toast.success('Template reset');
  };

  const insertVariable = (field) => {
    const currentText = field === 'body' ? templateData.body : templateData.header.text;
    const currentVars = extractVariables(currentText);
    const nextVarNumber = currentVars.length > 0 ? Math.max(...currentVars) + 1 : 1;
    const newVariable = `{{${nextVarNumber}}}`;
    
    if (field === 'body') {
      setTemplateData(prev => ({
        ...prev,
        body: prev.body + newVariable,
      }));
    } else {
      setTemplateData(prev => ({
        ...prev,
        header: {
          ...prev.header,
          text: prev.header.text + newVariable,
        },
      }));
    }
  };

  if (!isOpen) return null;

  const varCounts = countVariables();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="bg-gradient-to-br from-[#1A1A1A] to-[#252525] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#BBA473]/30 transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-b border-[#BBA473]/30 p-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] flex items-center justify-center">
                <FileText className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create WhatsApp Template</h2>
                <p className="text-sm text-gray-400">Design your message template for Wati</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)] custom-scrollbar">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#BBA473]"></div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Template Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={templateData.name}
                      onChange={(e) => handleInputChange('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                      placeholder="my_template_name"
                      className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        validationErrors.name ? 'border-red-500' : 'border-[#BBA473]/30 focus:border-[#BBA473]'
                      }`}
                    />
                    {validationErrors.name ? (
                      <p className="text-xs text-red-400 mt-1">{validationErrors.name}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={templateData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 appearance-none cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={templateData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 appearance-none cursor-pointer"
                      >
                        {languages.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#BBA473]"></div>
                  Header (Optional)
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Header Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {headerTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => handleHeaderChange('type', type.value)}
                          className={`p-3 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                            templateData.header.type === type.value
                              ? 'border-[#BBA473] bg-[#BBA473]/10 text-[#BBA473]'
                              : 'border-[#BBA473]/30 bg-[#1A1A1A] text-gray-400 hover:border-[#BBA473]/50'
                          }`}
                        >
                          {Icon && <Icon className="w-5 h-5" />}
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {templateData.header.type === 'TEXT' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Header Text <span className="text-red-400">*</span>
                      </label>
                      <button
                        onClick={() => insertVariable('header')}
                        className="text-xs text-[#BBA473] hover:text-[#d4bc89] transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Variable
                      </button>
                    </div>
                    <input
                      type="text"
                      value={templateData.header.text}
                      onChange={(e) => handleHeaderChange('text', e.target.value)}
                      placeholder="Enter header text (max 60 chars)"
                      maxLength={60}
                      className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Use {'{1}'}, {'{2}'} for variables</p>
                      <p className="text-xs text-gray-500">{templateData.header.text.length}/60</p>
                    </div>
                  </div>
                )}

                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(templateData.header.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Media URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={templateData.header.mediaUrl}
                      onChange={(e) => handleHeaderChange('mediaUrl', e.target.value)}
                      placeholder="https://example.com/media.jpg"
                      className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Public URL to your {templateData.header.type.toLowerCase()} file
                    </p>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#BBA473]"></div>
                    Message Body <span className="text-red-400">*</span>
                  </h3>
                  <button
                    onClick={() => setShowVariableHelper(!showVariableHelper)}
                    className="text-xs text-[#BBA473] hover:text-[#d4bc89] transition-colors flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Variable Guide
                  </button>
                </div>

                {showVariableHelper && (
                  <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-400 mb-2 font-semibold">Variable Usage Guide:</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Use {'{1}'}, {'{2}'}, {'{3}'} etc. for dynamic content</li>
                      <li>• Variables must be numbered sequentially starting from {'{1}'}</li>
                      <li>• Example: "Hello {'{1}'}, your order {'{2}'} is ready!"</li>
                      <li>• You can use up to 100 variables per template</li>
                    </ul>
                  </div>
                )}

                <div className="mb-2">
                  <button
                    onClick={() => insertVariable('body')}
                    className="mb-2 text-sm text-[#BBA473] hover:text-[#d4bc89] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variable
                  </button>
                </div>

                <textarea
                  value={templateData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, body: true }))}
                  placeholder="Enter your message body here... Use {1}, {2} for variables"
                  rows={6}
                  maxLength={1024}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 bg-[#1A1A1A] text-white transition-all duration-300 resize-none ${
                    validationErrors.body ? 'border-red-500' : 'border-[#BBA473]/30 focus:border-[#BBA473]'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  {validationErrors.body ? (
                    <p className="text-xs text-red-400">{validationErrors.body}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Variables: {varCounts.body} in body
                    </p>
                  )}
                  <p className="text-xs text-gray-500">{templateData.body.length}/1024</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#BBA473]"></div>
                  Footer (Optional)
                </h3>
                <input
                  type="text"
                  value={templateData.footer}
                  onChange={(e) => handleInputChange('footer', e.target.value)}
                  placeholder="Add a footer text (max 60 chars)"
                  maxLength={60}
                  className="w-full px-4 py-2.5 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Small text at the bottom of your message</p>
                  <p className="text-xs text-gray-500">{templateData.footer.length}/60</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="bg-[#2A2A2A] rounded-xl p-5 border border-[#BBA473]/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#BBA473]"></div>
                    Buttons (Optional)
                  </h3>
                  <button
                    onClick={addButton}
                    disabled={templateData.buttons.length >= 3}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg text-sm font-semibold transition-all duration-300 hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Button
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-4">Maximum 3 buttons allowed</p>

                <div className="space-y-4">
                  {templateData.buttons.map((button, index) => (
                    <div key={button.id} className="bg-[#1A1A1A] rounded-lg p-4 border border-[#BBA473]/20">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-white">Button {index + 1}</span>
                        <button
                          onClick={() => removeButton(button.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Button Type and Text in one line */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Button Type</label>
                            <div className="relative">
                              <select
                                value={button.type}
                                onChange={(e) => handleButtonChange(button.id, 'type', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#2A2A2A] text-white transition-all duration-300 appearance-none cursor-pointer text-sm"
                              >
                                {buttonTypes.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                              Button Text <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={button.text}
                              onChange={(e) => handleButtonChange(button.id, 'text', e.target.value)}
                              placeholder="Click here"
                              maxLength={25}
                              className="w-full px-3 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#2A2A2A] text-white transition-all duration-300 text-sm"
                            />
                          </div>
                        </div>

                        {button.type === 'CALL_TO_ACTION' && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#BBA473]/10">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1.5">Action Type</label>
                              <div className="relative">
                                <select
                                  value={button.actionType}
                                  onChange={(e) => handleButtonChange(button.id, 'actionType', e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#2A2A2A] text-white transition-all duration-300 appearance-none cursor-pointer text-sm"
                                >
                                  {actionTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                {button.actionType === 'PHONE_NUMBER' ? 'Phone Number' : 'URL'} <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={button.actionValue}
                                onChange={(e) => handleButtonChange(button.id, 'actionValue', e.target.value)}
                                placeholder={button.actionType === 'PHONE_NUMBER' ? '+1234567890' : 'https://example.com'}
                                className="w-full px-3 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#2A2A2A] text-white transition-all duration-300 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-5 border border-blue-500/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                  Template Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Total Variables</p>
                    <p className="text-white font-semibold text-lg">{varCounts.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Body Length</p>
                    <p className="text-white font-semibold text-lg">{templateData.body.length}/1024</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Buttons</p>
                    <p className="text-white font-semibold text-lg">{templateData.buttons.length}/3</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Category</p>
                    <p className="text-white font-semibold text-lg">{templateData.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] border-t border-[#BBA473]/30 p-6 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#3A3A3A] text-white rounded-lg font-semibold transition-all duration-300 hover:bg-[#4A4A4A] border border-[#BBA473]/20"
            >
              Reset
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#3A3A3A] text-white rounded-lg font-semibold transition-all duration-300 hover:bg-[#4A4A4A] border border-[#BBA473]/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black rounded-lg font-semibold transition-all duration-300 hover:from-[#d4bc89] hover:to-[#a69363] shadow-lg hover:shadow-xl"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1A1A;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #BBA473 0%, #8E7D5A 100%);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #d4bc89 0%, #a69363 100%);
        }
      `}</style>
    </>
  );
};

export default InboxTemplateModal;