import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { createLead } from '../../../services/leadService';
import toast from 'react-hot-toast';

// Validation Schema
const leadValidationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  phone: Yup.string()
    .required('Phone number is required')
    .matches(/^\+\d{1,4}\s\d{1,14}$/, 'Invalid phone number format'),
  email: Yup.string()
    .email('Invalid email address'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Must be at least 18 years old', function(value) {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return value <= cutoff;
    }),
  nationality: Yup.string(),
  residency: Yup.string(),
  language: Yup.string(),
  source: Yup.string(),
  remarks: Yup.string().max(500, 'Remarks must not exceed 500 characters'),
});

const LeadFormDrawer = ({ 
  drawerOpen, 
  handleCloseDrawer, 
  editingLead, 
  fetchLeads, 
  currentPage, 
  itemsPerPage,
  isLeadsSelectedId 
}) => {
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const countryCodes = [
    { code: 'ae', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'sa', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'pk', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
    { code: 'in', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'gb', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'us', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'eg', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
    { code: 'jo', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
    { code: 'kw', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
    { code: 'qa', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  ];

  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);

  const nationalities = ['Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Australian', 'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Canadian', 'Chinese', 'Colombian', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Italian', 'Japanese', 'Jordanian', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nigerian', 'Norwegian', 'Pakistani', 'Palestinian', 'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Saudi', 'Singaporean', 'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Syrian', 'Thai', 'Turkish', 'Ukrainian', 'Yemeni'];

  const residencies = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Pakistan', 'India', 'Egypt', 'Jordan', 'Lebanon', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'];

  const languages = ['English', 'Arabic', 'Urdu', 'Hindi', 'French', 'Spanish', 'German', 'Chinese (Mandarin)', 'Russian', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Turkish', 'Persian (Farsi)', 'Bengali', 'Tamil', 'Telugu', 'Malayalam'];

  const sources = ['Website', 'Social Media (Facebook)', 'Social Media (Instagram)', 'Social Media (LinkedIn)', 'Social Media (Twitter)', 'Google Ads', 'Referral', 'Walk-in', 'Phone Call', 'Email Campaign', 'Exhibition/Event', 'WhatsApp', 'Agent', 'Partner', 'Other'];

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      residency: '',
      language: '',
      source: '',
      remarks: '',
    },
    validationSchema: leadValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Format phone number for API (remove spaces)
        const phoneNumber = values.phone.replace(/\s/g, '');
        
        // Prepare lead data for API
        const leadData = {
          leadName: values.name,
          leadEmail: values.email,
          leadPhoneNumber: phoneNumber,
          leadResidency: values.residency,
          leadPreferredLanguage: values.language,
          leadDateOfBirth: values.dateOfBirth,
          leadNationality: values.nationality,
          leadDescription: values.remarks,
          leadSource: values.source,
          leadStatus: "Not Assigned", // Default status for new leads
        };

        const result = await createLead(leadData);

        if (result.success) {
          toast.success(result.message || 'Lead created successfully!');

          resetForm();
          handleCloseDrawer();
          // Refresh the lead list
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again!');
          } else {
            toast.error(result.error.payload.message || 'Failed to create lead');
          }
        }
      } catch (error) {
        console.error('Error creating lead:', error);
        toast.error('Failed to create lead. Please try again');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Reset form when drawer is closed or editingLead changes
  useEffect(() => {
    if (!drawerOpen) {
      formik.resetForm();
    }
  }, [drawerOpen]);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full lg:w-2/5 bg-[#1A1A1A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        drawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Drawer Header */}
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

        {/* Drawer Form */}
        <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div className="grid space-y-4">
              <h3 className="text-lg font-semibold text-[#E8D5A3] border-b border-[#BBA473]/30 pb-2">
                Lead Information
              </h3>

              {/* Full Name */}
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

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Email Address 
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                    formik.touched.email && formik.errors.email
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                  }`}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.email}</div>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
              {!isLeadsSelectedId && (
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
              )}
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="h-full px-3 py-3 border-2 border-[#BBA473]/30 rounded-lg bg-[#1A1A1A] hover:border-[#BBA473] transition-all duration-300 flex items-center gap-2 min-w-[100px]"
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span className="text-white text-sm">{selectedCountry.dialCode}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-full mt-2 left-0 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg shadow-xl z-10 min-w-[280px] max-h-60 overflow-y-auto">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                              const phoneWithoutCode = formik.values.phone.replace(/^\+\d{1,4}\s/, '');
                              formik.setFieldValue('phone', `${country.dialCode} ${phoneWithoutCode}`);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-[#3A3A3A] transition-colors flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <div className="flex-1">
                              <div className="text-white text-sm">{country.name}</div>
                              <div className="text-gray-400 text-xs">{country.dialCode}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    name="phone"
                    placeholder="50 123 4567"
                    value={formik.values.phone.replace(/^\+\d{1,4}\s/, '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      formik.setFieldValue('phone', `${selectedCountry.dialCode} ${value}`);
                    }}
                    onBlur={formik.handleBlur}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.phone && formik.errors.phone
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                </div>
                {formik.touched.phone && formik.errors.phone && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.phone}</div>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2 relative">
                <label className="text-sm text-[#E8D5A3] font-medium block">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                    formik.touched.dateOfBirth && formik.errors.dateOfBirth
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.dateOfBirth}</div>
                )}
              </div>

              {/* Nationality */}
              <div className="relative space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Nationality
                </label>
                <select
                  name="nationality"
                  value={formik.values.nationality}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                    formik.touched.nationality && formik.errors.nationality
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                  }`}
                >
                  <option value="">Select Nationality</option>
                  {nationalities.map((nationality) => (
                    <option key={nationality} value={nationality}>{nationality}</option>
                  ))}
                </select>
                {formik.touched.nationality && formik.errors.nationality && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.nationality}</div>
                )}
                <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Residency */}
              <div className="relative space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Country of Residency
                </label>
                <select
                  name="residency"
                  value={formik.values.residency}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                    formik.touched.residency && formik.errors.residency
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                  }`}
                >
                  <option value="">Select Residency</option>
                  {residencies.map((residency) => (
                    <option key={residency} value={residency}>{residency}</option>
                  ))}
                </select>
                {formik.touched.residency && formik.errors.residency && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.residency}</div>
                )}
                <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Language */}
              <div className="relative space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Preferred Language
                </label>
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
                {formik.touched.language && formik.errors.language && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.language}</div>
                )}
                <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Source */}
              <div className="relative space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Lead Source
                </label>
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
                {formik.touched.source && formik.errors.source && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.source}</div>
                )}
                <ChevronDown className="leads-chevron-icon absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Remarks
                </label>
              {!isLeadsSelectedId && (
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
              )}
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

          {/* Submit Buttons */}
          <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30">
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
            >
              {formik.isSubmitting 
                ? (editingLead ? 'Updating Lead...' : 'Creating Lead...') 
                : (editingLead ? 'Update Lead' : 'Create Lead')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormDrawer;