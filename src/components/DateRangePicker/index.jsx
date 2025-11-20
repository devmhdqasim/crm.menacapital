import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

/**
 * DateRangePicker Component
 * 
 * A reusable date range picker with dark theme styling and validation
 * 
 * @param {Object} props
 * @param {Date|string} props.startDate - Start date value
 * @param {Date|string} props.endDate - End date value
 * @param {Function} props.onStartDateChange - Callback when start date changes
 * @param {Function} props.onEndDateChange - Callback when end date changes
 * @param {string} props.startLabel - Label for start date (default: "From:")
 * @param {string} props.endLabel - Label for end date (default: "To:")
 * @param {boolean} props.showError - Show validation error
 * @param {string} props.errorMessage - Custom error message
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {string} props.dateFormat - Date format (default: "MMM dd, yyyy")
 * @param {boolean} props.isClearable - Show clear button (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "From:",
  endLabel = "To:",
  showError = false,
  errorMessage = "End date must be after start date",
  minDate = null,
  maxDate = new Date(),
  dateFormat = "MMM dd, yyyy",
  isClearable = true,
  className = "",
}) => {
  const [localError, setLocalError] = useState('');

  // Convert string dates to Date objects if needed
  const parseDate = (date) => {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
  };

  const startDateObj = parseDate(startDate);
  const endDateObj = parseDate(endDate);

  const normalizeDate = (date) => {
    if (!date) return null;
    // Prevent timezone shifting by setting fixed noon time
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  // Validate date range
  const validateDateRange = (start, end) => {
    if (start && end && start > end) {
      setLocalError(errorMessage);
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleStartDateChange = (date) => {
    const fixedDate = normalizeDate(date);
    validateDateRange(fixedDate, endDateObj);
    onStartDateChange(fixedDate);
  };
  
  const handleEndDateChange = (date) => {
    const fixedDate = normalizeDate(date);
    validateDateRange(startDateObj, fixedDate);
    onEndDateChange(fixedDate);
  };

  const displayError = showError || localError;

  return (
    <div className={`date-range-picker-container ${className}`}>
      <div className="flex items-center gap-3 bg-[#2A2A2A] p-3 rounded-lg border border-[#BBA473]/30 hover:border-[#BBA473] transition-all duration-300">
        {/* Start Date */}
        <div className="flex items-center gap-2 flex-1">
          <label className="text-[#E8D5A3] text-sm font-medium whitespace-nowrap">
            {startLabel}
          </label>
          <div className="relative flex-1">
            <DatePicker
              selected={startDateObj}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDateObj}
              endDate={endDateObj}
              minDate={minDate}
              maxDate={maxDate}
              dateFormat={dateFormat}
              isClearable={isClearable}
              placeholderText="Select start date"
              className="date-picker-input"
              calendarClassName="date-picker-calendar"
              wrapperClassName="date-picker-wrapper"
            />
            <Calendar className="absolute right-7 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BBA473] pointer-events-none" />
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-[#BBA473]/30"></div>

        {/* End Date */}
        <div className="flex items-center gap-2 flex-1">
          <label className="text-[#E8D5A3] text-sm font-medium whitespace-nowrap">
            {endLabel}
          </label>
          <div className="relative flex-1">
            <DatePicker
              selected={endDateObj}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDateObj}
              endDate={endDateObj}
              minDate={startDateObj || minDate}
              maxDate={maxDate}
              dateFormat={dateFormat}
              isClearable={isClearable}
              placeholderText="Select end date"
              className="date-picker-input"
              calendarClassName="date-picker-calendar"
              wrapperClassName="date-picker-wrapper"
            />
            <Calendar className="absolute right-7 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BBA473] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="mt-2 text-red-400 text-sm animate-pulse flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {localError || errorMessage}
        </div>
      )}

      <style jsx>{`
        /* Date Picker Wrapper */
        .date-picker-wrapper {
          width: 100%;
        }

        /* Date Picker Input */
        .date-picker-input {
          width: 100%;
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          background-color: #1A1A1A;
          border: 2px solid rgba(187, 164, 115, 0.3);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .date-picker-input:hover {
          border-color: #BBA473;
        }

        .date-picker-input:focus {
          border-color: #BBA473;
          box-shadow: 0 0 0 3px rgba(187, 164, 115, 0.1);
        }

        .date-picker-input::placeholder {
          color: #6B7280;
        }

        /* Calendar Popup */
        :global(.date-picker-calendar) {
          background-color: #1A1A1A !important;
          border: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          font-family: inherit !important;
        }

        /* Calendar Header */
        :global(.date-picker-calendar .react-datepicker__header) {
          background-color: #2A2A2A !important;
          border-bottom: 2px solid rgba(187, 164, 115, 0.3) !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
          padding-top: 1rem !important;
        }

        :global(.date-picker-calendar .react-datepicker__current-month) {
          color: #E8D5A3 !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          margin-bottom: 0.5rem !important;
        }

        :global(.date-picker-calendar .react-datepicker__day-name) {
          color: #BBA473 !important;
          font-weight: 500 !important;
          width: 2.5rem !important;
          line-height: 2.5rem !important;
        }

        /* Navigation Buttons */
        :global(.date-picker-calendar .react-datepicker__navigation) {
          top: 1rem !important;
        }

        :global(.date-picker-calendar .react-datepicker__navigation-icon::before) {
          border-color: #BBA473 !important;
          border-width: 2px 2px 0 0 !important;
        }

        :global(.date-picker-calendar .react-datepicker__navigation:hover *::before) {
          border-color: #E8D5A3 !important;
        }

        /* Calendar Days */
        :global(.date-picker-calendar .react-datepicker__day) {
          color: white !important;
          width: 2.5rem !important;
          line-height: 2.5rem !important;
          margin: 0.125rem !important;
          border-radius: 0.5rem !important;
          transition: all 0.2s ease !important;
        }

        :global(.date-picker-calendar .react-datepicker__day:hover) {
          background-color: rgba(187, 164, 115, 0.2) !important;
          color: #E8D5A3 !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--selected) {
          background: linear-gradient(135deg, #BBA473 0%, #8E7D5A 100%) !important;
          color: #000 !important;
          font-weight: 600 !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--in-range) {
          background-color: rgba(187, 164, 115, 0.3) !important;
          color: white !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--in-selecting-range) {
          background-color: rgba(187, 164, 115, 0.2) !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--range-start),
        :global(.date-picker-calendar .react-datepicker__day--range-end) {
          background: linear-gradient(135deg, #BBA473 0%, #8E7D5A 100%) !important;
          color: #000 !important;
          font-weight: 600 !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--disabled) {
          color: #4B5563 !important;
          cursor: not-allowed !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--disabled:hover) {
          background-color: transparent !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--outside-month) {
          color: #6B7280 !important;
        }

        :global(.date-picker-calendar .react-datepicker__day--today) {
          border: 2px solid #BBA473 !important;
          font-weight: 600 !important;
        }

        /* Month Container */
        :global(.date-picker-calendar .react-datepicker__month) {
          margin: 0.5rem !important;
        }

        /* Clear Button */
        :global(.date-picker-calendar .react-datepicker__close-icon::after) {
          background-color: #BBA473 !important;
          color: #000 !important;
          font-size: 1rem !important;
          padding: 0.25rem !important;
          border-radius: 50% !important;
        }

        :global(.date-picker-calendar .react-datepicker__close-icon:hover::after) {
          background-color: #E8D5A3 !important;
        }

        /* Animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default DateRangePicker;