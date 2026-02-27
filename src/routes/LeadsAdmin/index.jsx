// Updated Lead Management Component

import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Search, Plus, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, X, UserPlus, Eye, Clock } from 'lucide-react';
import { getAllLeads, createLead, updateLead, deleteLead } from '../../services/leadService';
import { getAllUsers } from '../../services/teamService';
import { Calendar } from 'lucide-react';
import DateRangePicker from '../../components/DateRangePicker';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { getDashboardStatsByFilter } from '../../services/dashboardService';

// Validation Schema - Updated to match reference
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
  email: Yup.string()
    .email('Invalid email address'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future'),
  nationality: Yup.string(),
  residency: Yup.string(),
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

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [leadsCount, setLeadsCount] = useState({})
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isLeadsDrawerOpen, setIsLeadsDrawerOpen] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [interestedSubTab, setInterestedSubTab] = useState('Hot');
  const [hotLeadsSubTab, setHotLeadsSubTab] = useState('Real');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [kioskMembers, setKioskMembers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState(null);

  const tabs = ['All', 'Real', 'Demo'];

  const interestedSubTabs = ['Warm ( Silent Leads )', 'Hot'];
  const hotLeadsSubTabs = ['Real', 'Demo'];
  const perPageOptions = [10, 20, 30, 50, 100];
  const filterOptions = ['Active Deposits', 'Not Active Deposits'];
  const statusOptions = ['Lead', 'Demo', 'Real'];
  const depositStatusOptions = ['Deposit', 'No Deposit'];

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

  const residencies = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Pakistan', 'India', 'Egypt', 'Jordan', 'Lebanon', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Other'];

  const languages = ['English', 'Arabic', 'Urdu', 'Hindi', 'French', 'Spanish', 'German', 'Chinese (Mandarin)', 'Russian', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Turkish', 'Persian (Farsi)', 'Bengali', 'Tamil', 'Telugu', 'Malayalam'];

  const sources = ['Kiosk'];

  // Fetch countries from REST Countries API
  const fetchCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
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

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(nationalitySearch.toLowerCase())
  );

  // Fetch kiosk members from API
  const fetchKioskMembers = async () => {
    try {
      const result = await getAllUsers(1, 100);
      if (result.success && result.data) {
        const kioskMembersData = result.data.filter(user => 
          user.roleName === 'Kiosk Member'
        );
        const transformedKioskMembers = kioskMembersData.map((user) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        }));
        setKioskMembers(transformedKioskMembers);
      }
    } catch (error) {
      console.error('Error fetching kiosk members:', error);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    
    try {
      const result = await getDashboardStatsByFilter(startDateStr, endDateStr);
      
      if (result.success && result.data) {
        // Save crmCategorySummary to context
        if (result.data.crmCategorySummary) {
          localStorage.setItem('leadsCount', JSON.stringify(result.data.crmCategorySummary))
          localStorage.setItem('leadsAgentCount', JSON.stringify(result.data.crmAgentCategorySummary))
        }
        
        console.log('✅ Dashboard data loaded:', result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(result.error.payload.message || 'Failed to fetch dashboard data');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads from API
  const fetchLeads = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
      
      // Determine status filter based on activeTab
      const statusParam = activeTab === 'All' ? '' : activeTab;
      
      const result = await getAllLeads(
        page, 
        limit, 
        startDateStr, 
        endDateStr,
        debouncedSearchQuery,  // Use debounced search query
        statusParam            // Pass status filter to API
      );
      
      if (result.success && result.data) {
        const transformedLeads = result.data.map((lead) => ({
          id: lead._id,
          leadId: lead.leadId,
          name: lead.leadName,
          email: lead.leadEmail,
          phone: lead.leadPhoneNumber,
          dateOfBirth: lead.leadDateOfBirth,
          nationality: lead.leadNationality,
          residency: lead.leadResidency,
          language: lead.leadPreferredLanguage,
          source: `${lead.leadSourceId.length > 0 ? `${lead.leadSourceId.at(-1).firstName} ${lead.leadSourceId.at(-1).lastName}`: "-"}`,
          leadSourceId: lead.leadSourceId.at(-1),
          remarks: lead.leadDescription || '',
          status: lead.leadStatus ?? '-',
          kioskLeadStatus: lead.kioskLeadStatus ?? '-',
          depositStatus: lead.depositStatus || '',
          createdAt: lead.createdAt,
        }));
        
        setLeads(transformedLeads);
        setTotalLeads(result.metadata?.total || 0);
        fetchDashboardData()
      } else {
        console.error('Failed to fetch leads:', result.message);
        if (result.requiresAuth) {
          toast.error('Session expired. Please login again');
        } else {
          // toast.error(result.message || 'Failed to fetch leads');
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Please try again');
    } finally {
      setLoading(false);
    }
  };


  // Debouncing effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Load leads on component mount
  useEffect(() => {
    setIsLoaded(true);
    fetchCountries();
    fetchKioskMembers();
  }, []);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeTab]);

  // Fetch leads when page, filters, or dates change
  useEffect(() => {
    fetchLeads(currentPage, itemsPerPage);
  }, [startDate, endDate, currentPage, itemsPerPage, debouncedSearchQuery, activeTab]);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      residency: '',
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
        const phoneNumber = values.phone.replace(/\s/g, '');
        
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
          leadStatus: "Not Assigned",
          kioskLeadStatus: values.status,
          leadSourceId: values.kioskMember,
          depositStatus: values.depositStatus,
        };

        let result;
        
        if (editingLead) {
          result = await updateLead(editingLead.id, leadData);
        } else {
          result = await createLead(leadData);
        }

        if (result.success) {
          toast.success(result.message || `Lead ${editingLead ? 'updated' : 'created'} successfully!`);
          resetForm();
          setDrawerOpen(false);
          setEditingLead(null);
          setHasFormChanged(false);
          setInitialFormValues(null);
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
          } else {
            toast.error(result.error.payload.message || `Failed to ${editingLead ? 'update' : 'create'} lead`);
          }
        }
      } catch (error) {
        console.error('Error submitting lead:', error);
        toast.error(`Failed to ${editingLead ? 'update' : 'create'} lead. Please try again.`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // useEffect to detect form changes
  useEffect(() => {
    if (editingLead && initialFormValues) {
      const currentValues = JSON.stringify(formik.values);
      const initialValues = JSON.stringify(initialFormValues);
      setHasFormChanged(currentValues !== initialValues);
    } else if (!editingLead) {
      setHasFormChanged(true);
    }
  }, [formik.values, editingLead, initialFormValues]);

  // No frontend filtering needed - all handled by API
  const filteredLeads = leads;

  // Pagination calculations based on API metadata
  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const currentLeads = filteredLeads;
  const showingFrom = totalLeads > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min((currentPage - 1) * itemsPerPage + leads.length, totalLeads);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handlePerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setShowPerPageDropdown(false);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3);
      } else if (currentPage >= totalPages - 1) {
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }
    return pages;
  };

  const handleEdit = (lead) => {
    const formValues = {
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      dateOfBirth: lead.dateOfBirth || '',
      nationality: lead.nationality || '',
      residency: lead.residency || '',
      language: lead.language || '',
      source: lead.source || 'Kiosk',
      status: lead.kioskLeadStatus || '',
      depositStatus: lead.depositStatus || '',
      kioskMember: lead.leadSourceId ? lead.leadSourceId._id : '',
      remarks: lead.remarks || '',
    };
    
    formik.setValues(formValues);
    setInitialFormValues(formValues);
    setHasFormChanged(false);
    setEditingLead(lead);
    setDrawerOpen(true);
    setShowActionsDropdown(null);
  };

  const handleDelete = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const result = await deleteLead(leadId);
        
        if (result.success) {
          toast.success(result.message || 'Lead deleted successfully!');
          fetchLeads(currentPage, itemsPerPage);
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
          } else {
            toast.error(result.error.payload.message || 'Failed to delete lead');
          }
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead. Please try again');
      }
      setShowActionsDropdown(null);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingLead(null);
    formik.resetForm();
    setNationalitySearch('');
    setShowNationalityDropdown(false);
    setHasFormChanged(false);
    setInitialFormValues(null);
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+\d{1,4})(\d+)/, '$1 $2').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Not Deposit': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    
    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
  
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2027-03-21';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsLeadsDrawerOpen(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  function convertToDubaiTime(utcDateString) {
    const date = new Date(utcDateString);
  
    if (isNaN(date)) return false;
  
    const options = {
      timeZone: "Asia/Dubai",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
  
    const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);
  
    return formatted.replace(",", "");
  }

  // Get display text for nationality field
  const getNationalityDisplayText = () => {
    if (formik.values.nationality) {
      return formik.values.nationality;
    }
    return 'Select Nationality';
  };

  // Helper function to get flag emoji from nationality/country name
  const getNationalityFlag = (nationality) => {
    if (!nationality) return '';
    
    const countryNameToCode = {
      'Afghan': 'AF', 'Afghanistan': 'AF',
      'Albanian': 'AL', 'Albania': 'AL',
      'Algerian': 'DZ', 'Algeria': 'DZ',
      'American': 'US', 'United States': 'US', 'United States of America': 'US',
      'Andorran': 'AD', 'Andorra': 'AD',
      'Angolan': 'AO', 'Angola': 'AO',
      'Antiguan': 'AG', 'Antigua and Barbuda': 'AG',
      'Argentinian': 'AR', 'Argentine': 'AR', 'Argentina': 'AR',
      'Armenian': 'AM', 'Armenia': 'AM',
      'Australian': 'AU', 'Australia': 'AU',
      'Austrian': 'AT', 'Austria': 'AT',
      'Azerbaijani': 'AZ', 'Azerbaijan': 'AZ',
      'Bahamian': 'BS', 'Bahamas': 'BS',
      'Bahraini': 'BH', 'Bahrain': 'BH',
      'Bangladeshi': 'BD', 'Bangladesh': 'BD',
      'Barbadian': 'BB', 'Barbados': 'BB',
      'Belarusian': 'BY', 'Belarus': 'BY',
      'Belgian': 'BE', 'Belgium': 'BE',
      'Belizean': 'BZ', 'Belize': 'BZ',
      'Beninese': 'BJ', 'Benin': 'BJ',
      'Bhutanese': 'BT', 'Bhutan': 'BT',
      'Bolivian': 'BO', 'Bolivia': 'BO',
      'Bosnian': 'BA', 'Bosnia and Herzegovina': 'BA',
      'Botswanan': 'BW', 'Botswana': 'BW',
      'Brazilian': 'BR', 'Brazil': 'BR',
      'British': 'GB', 'United Kingdom': 'GB',
      'Bruneian': 'BN', 'Brunei': 'BN',
      'Bulgarian': 'BG', 'Bulgaria': 'BG',
      'Burkinabe': 'BF', 'Burkina Faso': 'BF',
      'Burmese': 'MM', 'Myanmar': 'MM',
      'Burundian': 'BI', 'Burundi': 'BI',
      'Cambodian': 'KH', 'Cambodia': 'KH',
      'Cameroonian': 'CM', 'Cameroon': 'CM',
      'Canadian': 'CA', 'Canada': 'CA',
      'Cape Verdean': 'CV', 'Cape Verde': 'CV',
      'Central African': 'CF', 'Central African Republic': 'CF',
      'Chadian': 'TD', 'Chad': 'TD',
      'Chilean': 'CL', 'Chile': 'CL',
      'Chinese': 'CN', 'China': 'CN',
      'Colombian': 'CO', 'Colombia': 'CO',
      'Comoran': 'KM', 'Comoros': 'KM',
      'Congolese': 'CG', 'Republic of the Congo': 'CG', 'Congo': 'CG',
      'Costa Rican': 'CR', 'Costa Rica': 'CR',
      'Croatian': 'HR', 'Croatia': 'HR',
      'Cuban': 'CU', 'Cuba': 'CU',
      'Cypriot': 'CY', 'Cyprus': 'CY',
      'Czech': 'CZ', 'Czechia': 'CZ', 'Czech Republic': 'CZ',
      'Danish': 'DK', 'Denmark': 'DK',
      'Djiboutian': 'DJ', 'Djibouti': 'DJ',
      'Dominican': 'DO', 'Dominican Republic': 'DO',
      'Dutch': 'NL', 'Netherlands': 'NL',
      'Ecuadorian': 'EC', 'Ecuador': 'EC',
      'Egyptian': 'EG', 'Egypt': 'EG',
      'Emirati': 'AE', 'United Arab Emirates': 'AE', 'UAE': 'AE',
      'Equatorial Guinean': 'GQ', 'Equatorial Guinea': 'GQ',
      'Eritrean': 'ER', 'Eritrea': 'ER',
      'Estonian': 'EE', 'Estonia': 'EE',
      'Eswatini': 'SZ', 'Swazi': 'SZ',
      'Ethiopian': 'ET', 'Ethiopia': 'ET',
      'Fijian': 'FJ', 'Fiji': 'FJ',
      'Filipino': 'PH', 'Philippines': 'PH',
      'Finnish': 'FI', 'Finland': 'FI',
      'French': 'FR', 'France': 'FR',
      'Gabonese': 'GA', 'Gabon': 'GA',
      'Gambian': 'GM', 'Gambia': 'GM',
      'Georgian': 'GE', 'Georgia': 'GE',
      'German': 'DE', 'Germany': 'DE',
      'Ghanaian': 'GH', 'Ghana': 'GH',
      'Greek': 'GR', 'Greece': 'GR',
      'Grenadian': 'GD', 'Grenada': 'GD',
      'Guatemalan': 'GT', 'Guatemala': 'GT',
      'Guinean': 'GN', 'Guinea': 'GN',
      'Guyanese': 'GY', 'Guyana': 'GY',
      'Haitian': 'HT', 'Haiti': 'HT',
      'Honduran': 'HN', 'Honduras': 'HN',
      'Hungarian': 'HU', 'Hungary': 'HU',
      'Icelandic': 'IS', 'Iceland': 'IS',
      'Indian': 'IN', 'India': 'IN',
      'Indonesian': 'ID', 'Indonesia': 'ID',
      'Iranian': 'IR', 'Iran': 'IR',
      'Iraqi': 'IQ', 'Iraq': 'IQ',
      'Irish': 'IE', 'Ireland': 'IE',
      'Israeli': 'IL', 'Israel': 'IL',
      'Italian': 'IT', 'Italy': 'IT',
      'Ivorian': 'CI', 'Ivory Coast': 'CI',
      'Jamaican': 'JM', 'Jamaica': 'JM',
      'Japanese': 'JP', 'Japan': 'JP',
      'Jordanian': 'JO', 'Jordan': 'JO',
      'Kazakh': 'KZ', 'Kazakhstan': 'KZ',
      'Kenyan': 'KE', 'Kenya': 'KE',
      'Kiribati': 'KI',
      'Korean': 'KR', 'South Korea': 'KR',
      'Kuwaiti': 'KW', 'Kuwait': 'KW',
      'Kyrgyz': 'KG', 'Kyrgyzstan': 'KG',
      'Laotian': 'LA', 'Laos': 'LA',
      'Latvian': 'LV', 'Latvia': 'LV',
      'Lebanese': 'LB', 'Lebanon': 'LB',
      'Liberian': 'LR', 'Liberia': 'LR',
      'Libyan': 'LY', 'Libya': 'LY',
      'Liechtensteiner': 'LI', 'Liechtenstein': 'LI',
      'Lithuanian': 'LT', 'Lithuania': 'LT',
      'Luxembourgish': 'LU', 'Luxembourg': 'LU',
      'Macedonian': 'MK', 'North Macedonia': 'MK',
      'Malagasy': 'MG', 'Madagascar': 'MG',
      'Malawian': 'MW', 'Malawi': 'MW',
      'Malaysian': 'MY', 'Malaysia': 'MY',
      'Maldivian': 'MV', 'Maldives': 'MV',
      'Malian': 'ML', 'Mali': 'ML',
      'Maltese': 'MT', 'Malta': 'MT',
      'Marshallese': 'MH', 'Marshall Islands': 'MH',
      'Mauritanian': 'MR', 'Mauritania': 'MR',
      'Mauritian': 'MU', 'Mauritius': 'MU',
      'Mexican': 'MX', 'Mexico': 'MX',
      'Micronesian': 'FM', 'Micronesia': 'FM',
      'Moldovan': 'MD', 'Moldova': 'MD',
      'Monacan': 'MC', 'Monaco': 'MC',
      'Mongolian': 'MN', 'Mongolia': 'MN',
      'Montenegrin': 'ME', 'Montenegro': 'ME',
      'Moroccan': 'MA', 'Morocco': 'MA',
      'Mozambican': 'MZ', 'Mozambique': 'MZ',
      'Namibian': 'NA', 'Namibia': 'NA',
      'Nauruan': 'NR', 'Nauru': 'NR',
      'Nepalese': 'NP', 'Nepal': 'NP',
      'New Zealander': 'NZ', 'New Zealand': 'NZ',
      'Nicaraguan': 'NI', 'Nicaragua': 'NI',
      'Nigerian': 'NG', 'Nigeria': 'NG',
      'Nigerien': 'NE', 'Niger': 'NE',
      'North Korean': 'KP', 'North Korea': 'KP',
      'Norwegian': 'NO', 'Norway': 'NO',
      'Omani': 'OM', 'Oman': 'OM',
      'Pakistani': 'PK', 'Pakistan': 'PK',
      'Palauan': 'PW', 'Palau': 'PW',
      'Palestinian': 'PS', 'Palestine': 'PS',
      'Panamanian': 'PA', 'Panama': 'PA',
      'Papua New Guinean': 'PG', 'Papua New Guinea': 'PG',
      'Paraguayan': 'PY', 'Paraguay': 'PY',
      'Peruvian': 'PE', 'Peru': 'PE',
      'Polish': 'PL', 'Poland': 'PL',
      'Portuguese': 'PT', 'Portugal': 'PT',
      'Qatari': 'QA', 'Qatar': 'QA',
      'Romanian': 'RO', 'Romania': 'RO',
      'Russian': 'RU', 'Russia': 'RU',
      'Rwandan': 'RW', 'Rwanda': 'RW',
      'Saint Lucian': 'LC', 'Saint Lucia': 'LC',
      'Salvadoran': 'SV', 'El Salvador': 'SV',
      'Samoan': 'WS', 'Samoa': 'WS',
      'San Marinese': 'SM', 'San Marino': 'SM',
      'Saudi': 'SA', 'Saudi Arabia': 'SA', 'Saudi Arabian': 'SA',
      'Senegalese': 'SN', 'Senegal': 'SN',
      'Serbian': 'RS', 'Serbia': 'RS',
      'Seychellois': 'SC', 'Seychelles': 'SC',
      'Sierra Leonean': 'SL', 'Sierra Leone': 'SL',
      'Singaporean': 'SG', 'Singapore': 'SG',
      'Slovak': 'SK', 'Slovakia': 'SK',
      'Slovenian': 'SI', 'Slovenia': 'SI',
      'Somali': 'SO', 'Somalia': 'SO',
      'South African': 'ZA', 'South Africa': 'ZA',
      'South Korean': 'KR',
      'South Sudanese': 'SS', 'South Sudan': 'SS',
      'Spanish': 'ES', 'Spain': 'ES',
      'Sri Lankan': 'LK', 'Sri Lanka': 'LK',
      'Sudanese': 'SD', 'Sudan': 'SD',
      'Surinamese': 'SR', 'Suriname': 'SR',
      'Swedish': 'SE', 'Sweden': 'SE',
      'Swiss': 'CH', 'Switzerland': 'CH',
      'Syrian': 'SY', 'Syria': 'SY',
      'Taiwanese': 'TW', 'Taiwan': 'TW',
      'Tajik': 'TJ', 'Tajikistan': 'TJ',
      'Tanzanian': 'TZ', 'Tanzania': 'TZ',
      'Thai': 'TH', 'Thailand': 'TH',
      'Togolese': 'TG', 'Togo': 'TG',
      'Tongan': 'TO', 'Tonga': 'TO',
      'Trinidadian': 'TT', 'Trinidad and Tobago': 'TT',
      'Tunisian': 'TN', 'Tunisia': 'TN',
      'Turkish': 'TR', 'Turkey': 'TR',
      'Turkmen': 'TM', 'Turkmenistan': 'TM',
      'Tuvaluan': 'TV', 'Tuvalu': 'TV',
      'Ugandan': 'UG', 'Uganda': 'UG',
      'Ukrainian': 'UA', 'Ukraine': 'UA',
      'Uruguayan': 'UY', 'Uruguay': 'UY',
      'Uzbek': 'UZ', 'Uzbekistan': 'UZ',
      'Vanuatuan': 'VU', 'Vanuatu': 'VU',
      'Vatican': 'VA', 'Vatican City': 'VA',
      'Venezuelan': 'VE', 'Venezuela': 'VE',
      'Vietnamese': 'VN', 'Vietnam': 'VN',
      'Yemeni': 'YE', 'Yemen': 'YE',
      'Zambian': 'ZM', 'Zambia': 'ZM',
      'Zimbabwean': 'ZW', 'Zimbabwe': 'ZW'
    };

    const countryCode = countryNameToCode[nationality];
    if (!countryCode) return '';

    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  useEffect(() => {
    const leads =  JSON.parse(localStorage.getItem('leadsCount'))
    setLeadsCount(leads)
  }, [leads, startDate, endDate, activeTab, localStorage.getItem('leadsCount')])

  return (
    <>
      <div className={`min-h-screen bg-[#1A1A1A] text-white p-6 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] bg-clip-text text-transparent">
                Lead Management
              </h1>
              <p className="text-gray-400 mt-2">Manage and track your Save In Gold mobile application leads</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if(!isLeadsDrawerOpen) {
                    setEditingLead(null);
                    formik.resetForm();
                    setHasFormChanged(true);
                    setInitialFormValues(null);
                    setDrawerOpen(true);
                  }
                }}
                className="btn-animated btn-gold w-fit bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ml-auto"
              >
                {/* <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <UserPlus className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" /> */}
                <span className="inline-block">Add New Lead</span>
                </button>

              {/* Date Range Filter */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                maxDate={new Date()}
                isClearable={true}
              />
              </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto animate-fadeIn">
          <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  // Clear search when switching tabs
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
                className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                {tab}
                {leadsCount?.[tab?.replace(/\s+/g, '')] ? (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                    {leadsCount?.[tab?.replace(/\s+/g, '')]}
                  </span>
                ): ''}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-tabs for Interested and Filter Select */}
        {activeTab === 'Interested' && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                {interestedSubTabs.map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setInterestedSubTab(subTab)}
                    className={`px-5 py-2 font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      interestedSubTab === subTab
                        ? 'bg-[#BBA473] text-black'
                        : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#3A3A3A] border border-[#BBA473]/30'
                    }`}
                  >
                    {subTab}
                    {leadsCount?.[subTab?.replace(/\s+/g, '')] ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                        {leadsCount?.[subTab?.replace(/\s+/g, '')]}
                      </span>
                    ): ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

            {/* Sub-tabs for Hot Leads and Filter Select */}
        {interestedSubTab === 'Hot' && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                {hotLeadsSubTabs.map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => setHotLeadsSubTab(subTab)}
                    className={`px-5 py-2 font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      hotLeadsSubTab === subTab
                        ? 'bg-[#BBA473] text-black'
                        : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#3A3A3A] border border-[#BBA473]/30'
                    }`}
                  >
                    {subTab}
                    {leadsCount?.[subTab?.replace(/\s+/g, '')] ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                        {leadsCount?.[subTab?.replace(/\s+/g, '')]}
                      </span>
                    ): ''}
                  </button>
                ))}
              </div>

              {/* Filter Select */}
              <div className="w-full lg:w-64">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
                >
                  <option value="">Select Filter</option>
                  {filterOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 animate-fadeIn">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, nationality, residency, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden border border-[#BBA473]/20 animate-fadeIn">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full ">
              <thead className="bg-[#1A1A1A] border-b border-[#BBA473]/30">
                <tr>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Lead ID</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Nationality</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Source</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Created At</th>
                  <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBA473]/10">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BBA473]"></div>
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentLeads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  currentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#3A3A3A] transition-all duration-300 group"
                    >
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{lead.leadId || lead.id.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white group-hover:text-[#BBA473] transition-colors duration-300">
                            {lead.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(lead.phone)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getNationalityFlag(lead.nationality) && (
                            <span className="text-xl">{getNationalityFlag(lead.nationality)}</span>
                          )}
                          <span className="text-gray-300">{lead.nationality || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{lead.source}</td>
                      {!isLeadsDrawerOpen && (
                        <td className="flex items-center gap-1.5 px-6 py-4">
                          {lead?.kioskLeadStatus ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.kioskLeadStatus)}`}>
                            {lead?.kioskLeadStatus} {lead.depositStatus && `- ${lead.depositStatus}`}
                          </span> : ''}
                          {lead.status ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>: ''}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm">{convertToDubaiTime(lead.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Updated to show proper counts */}
          <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#BBA473]/30 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{showingFrom}</span> to{' '}
                <span className="text-white font-semibold">{showingTo}</span> of{' '}
                <span className="text-white font-semibold">{totalLeads}</span> entries
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPerPageDropdown(!showPerPageDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30"
                >
                  <span className="text-sm">{itemsPerPage} per page</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showPerPageDropdown && (
                  <div className="absolute bottom-full mb-2 right-0 bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg shadow-xl z-10 min-w-[150px]">
                    {perPageOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => handlePerPageChange(option)}
                        className={`w-full px-4 py-2 text-left hover:bg-[#3A3A3A] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          option === itemsPerPage ? 'bg-[#BBA473]/20 text-[#BBA473]' : 'text-white'
                        }`}
                      >
                        {option} per page
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473] disabled:hover:border-[#BBA473]/30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {currentPage > 2 && totalPages > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473]"
                  >
                    1
                  </button>
                  {currentPage > 3 && <span className="text-gray-400">...</span>}
                </>
              )}

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 border ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black border-[#BBA473] font-semibold shadow-lg'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] border-[#BBA473]/30 hover:border-[#BBA473]'
                  }`}
                >
                  {page}
                </button>
              ))}

              {currentPage < totalPages - 1 && totalPages > 3 && (
                <>
                  {currentPage < totalPages - 2 && <span className="text-gray-400">...</span>}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473]"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-[#BBA473]/30 hover:border-[#BBA473] disabled:hover:border-[#BBA473]/30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
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
          <form onSubmit={formik.handleSubmit} className="flex-1 flex flex-col overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="grid space-y-4">
                <h3 className="text-lg font-semibold text-[#E8D5A3] border-b border-[#BBA473]/30 pb-2">
                  Lead Information
                </h3>

                {/* Two Column Grid - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Language */}
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
                      <ChevronDown className="leads-chevron-icon absolute right-3 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {formik.touched.language && formik.errors.language && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.language}</div>
                    )}
                  </div>

                  {/* Status */}
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
                      <ChevronDown className="leads-chevron-icon absolute right-3 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {formik.touched.status && formik.errors.status && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.status}</div>
                    )}
                  </div>

                  {/* Deposit Status - Shows only when Status is "Real" */}
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
                        <ChevronDown className="leads-chevron-icon absolute right-3 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {formik.touched.depositStatus && formik.errors.depositStatus && (
                        <div className="text-red-400 text-sm animate-pulse">{formik.errors.depositStatus}</div>
                      )}
                    </div>
                  )}

                  {/* Kiosk Member */}
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
                      <ChevronDown className="leads-chevron-icon absolute right-3 -translate-y-2/4 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {formik.touched.kioskMember && formik.errors.kioskMember && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.kioskMember}</div>
                    )}
                  </div>

                  {/* Nationality - Custom Searchable Dropdown with Clear Button */}
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
                          {/* Search Input */}
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
                          
                          {/* Options List */}
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

                  {/* Source */}
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

                {/* Phone Number - Full Width */}
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

                {/* Remarks - Full Width */}
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

            {/* Submit Buttons */}
            <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30 mt-auto">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              {!isLeadsDrawerOpen && (
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
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        body{
          background-color: #000;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Custom Phone Input Styles */
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
    </>
  );
};

export default LeadManagement;