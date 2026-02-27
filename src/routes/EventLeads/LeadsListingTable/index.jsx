import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Clock, X } from 'lucide-react';

const LeadsListingTable = ({
  leads,
  loading,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  tabs,
  statusFilter,
  setStatusFilter,
  kioskMembers,        // For branch leads
  eventMembers,        // For event leads
  selectedKioskMemberFilter,
  selectedEventMemberFilter,  // For event leads
  setSelectedKioskMemberFilter,
  setSelectedEventMemberFilter,  // For event leads
  leadSources = [],    // For lead sources filter
  selectedLeadSourceFilter,
  setSelectedLeadSourceFilter,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalLeads,
  onEdit,
  onDelete,
  isEventLeads = false,  // Flag to determine if showing event leads
}) => {
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [showAssignedLeadModal, setShowAssignedLeadModal] = useState(false);
  const [assignedLeadMessage, setAssignedLeadMessage] = useState('');
  const [isBranchUsernameEmail, setIsBranchUsernameEmail] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const perPageOptions = [10, 20, 30, 50, 100];

  // Determine which members to show based on lead type
  const members = isEventLeads ? eventMembers : kioskMembers;
  const selectedMemberFilter = isEventLeads ? selectedEventMemberFilter : selectedKioskMemberFilter;
  const setSelectedMemberFilter = isEventLeads ? setSelectedEventMemberFilter : setSelectedKioskMemberFilter;
  const memberLabel = isEventLeads ? 'Event Member' : 'Kiosk Member';
  const membersLabel = isEventLeads ? 'Exhibition Lead' : 'Kiosk Members';

  // Check if lead is assigned to an agent
  const isLeadAssigned = (lead) => {
    return lead.leadAgentId && lead.leadAgentId !== null && lead.leadAgentId !== undefined && lead.leadAgentId !== '';
  };

  // Get agent name from lead
  const getAgentName = (lead) => {
    if (lead.leadAgentData && typeof lead.leadAgentData === 'object') {
      return `${lead.leadAgentData.firstName || ''} ${lead.leadAgentData.lastName || ''}`.trim() || 'an agent';
    }
    return 'an agent';
  };

  const handleEdit = (lead) => {
    if (isLeadAssigned(lead)) {
      const agentName = getAgentName(lead);
      setAssignedLeadMessage(`This lead is currently assigned to ${agentName} and cannot be edited.`);
      setShowAssignedLeadModal(true);
      return;
    }
    onEdit(lead);
  };

  const handleDelete = (lead) => {
    if (isLeadAssigned(lead)) {
      const agentName = getAgentName(lead);
      setAssignedLeadMessage(`This lead is currently assigned to ${agentName} and cannot be deleted.`);
      setShowAssignedLeadModal(true);
      return;
    }
    setLeadToDelete(lead);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    await onDelete(leadToDelete.id);
    setShowDeleteConfirmModal(false);
    setLeadToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setLeadToDelete(null);
  };

  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const showingFrom = totalLeads > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingTo = Math.min((currentPage - 1) * itemsPerPage + leads.length, totalLeads);

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    
    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
    
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2027-03-20';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsBranchUsernameEmail(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+\d{1,4})(\d+)/, '$1 $2').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  // Read eventSource from userInfo in localStorage
  const eventSource = (() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.eventSource || '';
    } catch {
      return '';
    }
  })();

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Demo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Real': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Not Deposit': 'bg-red-500/20 text-red-400 border-red-500/30',
      'No Deposit': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

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

  // Get the appropriate lead status based on lead type
  const getLeadStatus = (lead) => {
    // if (isEventLeads) {
    //   return lead.eventLeadStatus;
    // } else {
      return lead.kioskLeadStatus;
    // }
  };

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 overflow-x-auto animate-fadeIn">
        <div className="flex gap-2 border-b border-[#BBA473]/30 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery('');
              }}
              className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[#BBA473] text-[#BBA473] bg-[#BBA473]/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Member Filter */}
      {activeTab === membersLabel && (
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <label className="text-[#E8D5A3] font-medium text-sm whitespace-nowrap">
              Filter by {memberLabel}:
            </label>
            <div className="relative w-full max-w-xs">
            {!isBranchUsernameEmail && (
              <select
                value={selectedMemberFilter}
                onChange={(e) => setSelectedMemberFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
              >
                <option value="">All {membersLabel}</option>
                {members && members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            )}
              <ChevronDown className="absolute right-1 top-1/2 bg-[#1a1a1a] transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Lead Sources Filter */}
      {activeTab === 'Lead Sources' && (
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <label className="text-[#E8D5A3] font-medium text-sm whitespace-nowrap">
              Filter by Lead Source:
            </label>
            <div className="relative w-full max-w-xs">
              <select
                value={selectedLeadSourceFilter}
                onChange={(e) => setSelectedLeadSourceFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[#BBA473]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BBA473]/50 focus:border-[#BBA473] bg-[#1A1A1A] text-white transition-all duration-300 hover:border-[#BBA473]"
              >
                <option value="">All Lead Sources</option>
                {leadSources && leadSources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1/2 bg-[#1a1a1a] transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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
            placeholder="Search"
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
          <table className="w-full">
            <thead className="bg-[#1A1A1A] border-b border-[#BBA473]/30">
              <tr>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Lead ID</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Phone</th>
                {!isBranchUsernameEmail && (
                  <>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Language</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Nationality</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Source</th>
                    <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Status</th>
                  </>
                )}
                <th className="text-left px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase whitespace-nowrap tracking-wider">Created At</th>
                <th className="text-center px-6 py-4 text-[#E8D5A3] font-semibold text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BBA473]/10">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-[#3A3A3A] transition-all duration-300 group"
                  >
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{lead.leadId || lead.id.slice(-6) || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium capitalize text-white group-hover:text-[#BBA473] transition-colors duration-300">
                        {lead.name}
                      </span>
                    </td>
                    {!isBranchUsernameEmail && (
                      <>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{formatPhoneDisplay(lead.phone)}</td>
                    <td className="px-6 py-4 text-gray-300">{lead.language}</td>
                    </>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getNationalityFlag(lead.nationality) && (
                          <span className="text-xl">{getNationalityFlag(lead.nationality)}</span>
                        )}
                        <span className="text-gray-300">{lead.nationality || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{eventSource == 'Ramadan' ? eventSource : lead?.leadSourceName}</td>
                    <td className="flex items-center gap-1.5 px-6 py-4">
                      {/* { */}
                      {/* {getLeadStatus(lead)} */}
                      {lead?.kioskLeadStatus
                       ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead?.kioskLeadStatus)}`}>
                          {lead?.kioskLeadStatus} {lead.depositStatus && `- ${lead.depositStatus}`}
                       </span> : ''}
                      {/* {lead.status ? <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>: ''} */}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{convertToDubaiTime(lead.createdAt)}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {!isBranchUsernameEmail && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="p-2 rounded-lg bg-[#BBA473]/20 text-[#BBA473] hover:bg-[#BBA473] hover:text-black transition-all duration-300 hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                {!isBranchUsernameEmail && (
                  <span className="text-sm">{itemsPerPage} per page</span>
                )}
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

      {/* Assigned Lead Modal */}
      {showAssignedLeadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#BBA473] mb-2">
                  Cannot Modify Assigned Lead
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {assignedLeadMessage}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAssignedLeadModal(false)}
                className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#BBA473] mb-2">
                  Delete Lead
                </h3>
                <p className="text-gray-300 leading-relaxed mb-1">
                  Are you sure you want to delete this lead?
                </p>
                {leadToDelete && (
                  <div className="mt-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#BBA473]/20">
                    <p className="text-white capitalize font-semibold">{leadToDelete.name}</p>
                    <p className="text-gray-400 text-sm">{formatPhoneDisplay(leadToDelete.phone)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-6 py-2.5 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 active:scale-95"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

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
      `}</style>
    </>
  );
};

export default LeadsListingTable;