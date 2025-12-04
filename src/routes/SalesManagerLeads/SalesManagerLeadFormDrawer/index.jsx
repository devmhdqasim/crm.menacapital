import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, ChevronDown, Search } from 'lucide-react';
import { createLead, updateLead, assignLeadToAgent } from '../../../services/leadService';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import toast from 'react-hot-toast';

const leadValidationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  phone: Yup.string()
    .required('Phone number is required')
    .test('valid-phone', 'Invalid phone number', function(value) {
      if (!value) return false;
      try {
        return isValidPhoneNumber(value);
      } catch {
        return false;
      }
    }),
  nationality: Yup.string(),
  language: Yup.string()
    .required('Preferred language is required'),
  source: Yup.string().required('Source is required'),
  status: Yup.string()
    .required('Status is required'),
  depositStatus: Yup.string()
    .when('status', {
      is: 'Real',
      then: (schema) => schema.required('Deposit status is required when status is Real'),
      otherwise: (schema) => schema.notRequired(),
    }),
  kioskMember: Yup.string().required('Kiosk Team is required'),
  remarks: Yup.string().max(500, 'Remarks must not exceed 500 characters'),
});

const SalesManagerLeadFormDrawer = ({
  drawerOpen,
  handleCloseDrawer,
  editingLead,
  fetchLeads,
  currentPage,
  itemsPerPage,
  kioskMembers,
  currentUserId
}) => {
  const [countries, setCountries] = useState([]);
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [assignToSelfOnCreate, setAssignToSelfOnCreate] = useState(false);

  const statusOptions = ['Lead', 'Demo', 'Real'];
  const depositStatusOptions = ['Deposit', 'No Deposit'];
  const languages = ['English', 'Arabic', 'Urdu', 'Hindi', 'French', 'Spanish', 'German', 'Chinese (Mandarin)', 'Russian', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Turkish', 'Persian (Farsi)', 'Bengali', 'Tamil', 'Telugu', 'Malayalam'];
  const sources = ['Kiosk'];

  const fetchCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,demonyms');
      const data = await response.json();
      
      const countryList = data
        .map(country => {
          const demonym = country.demonyms?.eng?.common || country.name.common;
          return demonym;
        })
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
      const uniqueCountries = [...new Set(countryList)];
      setCountries(uniqueCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([
        'Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Australian', 
        'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Canadian', 
        'Chinese', 'Colombian', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Filipino', 
        'Finnish', 'French', 'German', 'Greek', 'Indian', 'Indonesian', 'Iranian', 
        'Iraqi', 'Irish', 'Italian', 'Japanese', 'Jordanian', 'Kenyan', 'Korean', 
        'Kuwaiti', 'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nigerian', 
        'Norwegian', 'Pakistani', 'Palestinian', 'Polish', 'Portuguese', 'Qatari', 
        'Romanian', 'Russian', 'Saudi', 'Singaporean', 'South African', 'Spanish', 
        'Sri Lankan', 'Swedish', 'Swiss', 'Syrian', 'Thai', 'Turkish', 'Ukrainian', 'Yemeni'
      ]);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(nationalitySearch.toLowerCase())
  );

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      nationality: '',
      language: '',
      source: 'Kiosk',
      status: '',
      depositStatus: '',
      kioskMember: '',
      remarks: '',
    },
    validationSchema: leadValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (editingLead && !hasFormChanged) {
          toast.info('No changes detected');
          setSubmitting(false);
          return;
        }

        const phoneNumber = values.phone.replace(/\s/g, '');
        
        const leadData = {
          leadName: values.name,
          leadPhoneNumber: phoneNumber,
          leadPreferredLanguage: values.language,
          leadNationality: values.nationality,
          leadDescription: values.remarks,
          leadSource: values.source,
          kioskLeadStatus: values.status,
          leadSourceId: values.kioskMember,
          depositStatus: values.depositStatus,
        };

        let result;
        
        if (editingLead) {
          result = await updateLead(editingLead.id, leadData);
          
          if (result.success) {
            const wasAssignedToSelf = editingLead.agentId === currentUserId;
            const shouldBeAssignedToSelf = assignToSelfOnCreate;
            
            if (wasAssignedToSelf !== shouldBeAssignedToSelf) {
              if (shouldBeAssignedToSelf) {
                await assignLeadToAgent(editingLead.id, currentUserId);
              }
            }
          }
        } else {
          result = await createLead(leadData);
          
          if (result.success && assignToSelfOnCreate && result.data && result.data._id) {
            await assignLeadToAgent(result.data._id, currentUserId);
          }
        }

        if (result.success) {
          toast.success(result.message || (editingLead ? 'Lead updated successfully!' : 'Lead created successfully!'));
          resetForm();
          handleCloseDrawer();
          setAssignToSelfOnCreate(false);
          setHasFormChanged(false);
          setInitialFormValues(null);
          setNationalitySearch('');
          setShowNationalityDropdown(false);
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
          } else {
            toast.error(result.error.payload.message || (editingLead ? 'Failed to update lead' : 'Failed to create lead'));
          }
        }
      } catch (error) {
        console.error(editingLead ? 'Error updating lead:' : 'Error creating lead:', error);
        toast.error(editingLead ? 'Failed to update lead. Please try again' : 'Failed to create lead. Please try again');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (editingLead) {
      const formValues = {
        name: editingLead.name || '',
        phone: editingLead.phone || '',
        nationality: editingLead.nationality || '',
        language: editingLead.language || '',
        source: editingLead.source || 'Kiosk',
        status: editingLead.kioskLeadStatus || '',
        depositStatus: editingLead.depositStatus || '',
        kioskMember: editingLead.leadSourceId ? editingLead.leadSourceId._id : '',
        remarks: editingLead.remarks || '',
      };
      
      formik.setValues(formValues);
      setInitialFormValues(formValues);
      setHasFormChanged(false);
      setAssignToSelfOnCreate(editingLead.agentId === currentUserId);
    }
  }, [editingLead]);

  useEffect(() => {
    if (editingLead && initialFormValues) {
      const currentValues = JSON.stringify(formik.values);
      const initialValues = JSON.stringify(initialFormValues);
      const switchChanged = assignToSelfOnCreate !== (editingLead.agentId === currentUserId);
      setHasFormChanged(currentValues !== initialValues || switchChanged);
    } else if (!editingLead) {
      setHasFormChanged(true);
    }
  }, [formik.values, editingLead, initialFormValues, assignToSelfOnCreate]);

  const getNationalityDisplayText = () => {
    if (formik.values.nationality) {
      return formik.values.nationality;
    }
    return 'Select Nationality';
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full lg:w-2/5 bg-[#1A1A1A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        drawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#BBA473]/30 bg-gradient-to-r from-[#BBA473]/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-[#BBA473]">
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {editingLead ? 'Update lead information' : 'Fill in the details to create a new lead'}
            </p>
          </div>
          <button
            onClick={handleCloseDrawer}
            className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="flex-1 flex flex-col overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid space-y-4">
              <h3 className="text-lg font-semibold text-[#E8D5A3] border-b border-[#BBA473]/30 pb-2">
                Lead Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.name}</div>
                  )}
                </div>

                <div className="relative space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Preferred Language <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="language"
                      value={formik.values.language}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.language && formik.errors.language
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Language</option>
                      {languages.map((language) => (
                        <option key={language} value={language}>{language}</option>
                      ))}
                    </select>
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {formik.touched.language && formik.errors.language && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.language}</div>
                  )}
                </div>

                <div className="relative space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formik.values.status}
                      onChange={(e) => {
                        formik.handleChange(e);
                        if (e.target.value !== 'Real') {
                          formik.setFieldValue('depositStatus', '');
                        }
                      }}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.status && formik.errors.status
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Status</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {formik.touched.status && formik.errors.status && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.status}</div>
                  )}
                </div>

                {formik.values.status === 'Real' && (
                  <div className="relative space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Deposit Status <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="depositStatus"
                        value={formik.values.depositStatus}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                          formik.touched.depositStatus && formik.errors.depositStatus
                            ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                            : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                        }`}
                      >
                        <option value="">Select Deposit Status</option>
                        {depositStatusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDown className="leads-chevron-icon absolute right-3 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {formik.touched.depositStatus && formik.errors.depositStatus && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.depositStatus}</div>
                    )}
                  </div>
                )}

                <div className="relative space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Kiosk Team <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="kioskMember"
                      value={formik.values.kioskMember}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.kioskMember && formik.errors.kioskMember
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Kiosk Member</option>
                      {kioskMembers.map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {formik.touched.kioskMember && formik.errors.kioskMember && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.kioskMember}</div>
                  )}
                </div>

                <div className="relative space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Nationality
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowNationalityDropdown(!showNationalityDropdown)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 cursor-pointer flex items-center justify-between ${
                        formik.touched.nationality && formik.errors.nationality
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 hover:border-[#BBA473]'
                      }`}
                    >
                      <span className={formik.values.nationality ? 'text-white' : 'text-gray-400'}>
                        {getNationalityDisplayText()}
                      </span>
                      <div className="flex items-center gap-2">
                        {formik.values.nationality && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              formik.setFieldValue('nationality', '');
                              setNationalitySearch('');
                            }}
                            className="p-1 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-300"
                            title="Clear nationality"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    
                    {showNationalityDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-[#2A2A2A] border-2 border-[#BBA473]/30 rounded-lg shadow-xl max-h-64 overflow-hidden">
                        <div className="p-2 border-b border-[#BBA473]/30">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Search nationality..."
                              value={nationalitySearch}
                              onChange={(e) => setNationalitySearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-9 pr-3 py-2 bg-[#1A1A1A] border border-[#BBA473]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#BBA473]"
                            />
                          </div>
                        </div>
                        
                        <div className="overflow-y-auto max-h-52">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                              <div
                                key={country}
                                onClick={() => {
                                  formik.setFieldValue('nationality', country);
                                  setShowNationalityDropdown(false);
                                  setNationalitySearch('');
                                }}
                                className={`px-4 py-2 cursor-pointer transition-colors ${
                                  formik.values.nationality === country
                                    ? 'bg-[#BBA473]/20 text-[#BBA473]'
                                    : 'text-white hover:bg-[#3A3A3A]'
                                }`}
                              >
                                {country}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-400 text-sm text-center">
                              No nationalities found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {formik.touched.nationality && formik.errors.nationality && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.nationality}</div>
                  )}
                </div>

                <div className="relative space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Lead Source
                  </label>
                  <div className="relative">
                    <select
                      name="source"
                      value={formik.values.source}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.source && formik.errors.source
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Source</option>
                      {sources.map((source) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                    <ChevronDown className="leads-chevron-icon absolute right-3 top-2/4 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {formik.touched.source && formik.errors.source && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.source}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  international
                  defaultCountry="AE"
                  value={formik.values.phone}
                  onChange={(value) => formik.setFieldValue('phone', value || '')}
                  onBlur={() => formik.setFieldTouched('phone', true)}
                  className={`phone-input-custom ${
                    formik.touched.phone && formik.errors.phone
                      ? 'phone-input-error'
                      : ''
                  }`}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.phone}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  placeholder="Add any additional notes or comments about this lead..."
                  rows="4"
                  value={formik.values.remarks}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white resize-none transition-all duration-300 ${
                    formik.touched.remarks && formik.errors.remarks
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                  }`}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {formik.touched.remarks && formik.errors.remarks && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.remarks}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formik.values.remarks.length}/500
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30 mt-auto">
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting || (editingLead && !hasFormChanged)}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              {formik.isSubmitting 
                ? (editingLead ? 'Updating Lead...' : 'Creating Lead...') 
                : (editingLead ? 'Update Lead' : 'Create Lead')
              }
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .phone-input-custom .PhoneInputInput {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid rgba(187, 164, 115, 0.3);
          border-radius: 0.5rem;
          background-color: #1A1A1A;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .phone-input-custom .PhoneInputInput:hover {
          border-color: #BBA473;
        }

        .phone-input-custom .PhoneInputInput:focus {
          border-color: #BBA473;
          ring: 2px;
          ring-color: rgba(187, 164, 115, 0.5);
        }

        .phone-input-error .PhoneInputInput {
          border-color: #ef4444;
        }

        .phone-input-error .PhoneInputInput:focus {
          border-color: #f87171;
          ring-color: rgba(239, 68, 68, 0.5);
        }

        .phone-input-custom .PhoneInputCountry {
          margin-right: 0.5rem;
          padding: 0.5rem;
          background-color: #1A1A1A;
          border: 2px solid rgba(187, 164, 115, 0.3);
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }

        .phone-input-custom .PhoneInputCountry:hover {
          border-color: #BBA473;
        }

        .phone-input-custom .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .phone-input-custom .PhoneInputCountrySelectArrow {
          color: #BBA473;
          opacity: 0.8;
          margin-left: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SalesManagerLeadFormDrawer;