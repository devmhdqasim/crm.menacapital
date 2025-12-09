import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { createAutoTask } from '../../../services/taskService.js'

const TaskManagementModal = ({ 
  showReminderModal, 
  selectedLead, 
  currentStatus,
  handleCloseReminderModal 
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [latestStatus, setLatestStatus] = useState('');

  // Formik validation schema
  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Title is required')
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters'),
    description: Yup.string()
      .required('Description is required')
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must not exceed 500 characters')
  });

  // Formik form handling
  const formik = useFormik({
    initialValues: {
      title: '',
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        console.log('🔵 Creating task for lead:', selectedLead, 'latestStatus', latestStatus);
        
        // Prepare task data for API
        const taskData = {
          leadId: selectedLead?.id,
          leadStatus: latestStatus || selectedLead?.status || 'Lead',
          taskTitle: values.title,
          taskDescription: values.description
        };

        console.log('📤 Sending task data:', taskData);

        // Call the API
        const result = await createAutoTask(taskData);

        if (result.success) {
          toast.success(result.message || 'Task created successfully!');
          handleClose();
          formik.resetForm();
        } else {
          if (result.requiresAuth) {
            toast.error('Session expired. Please login again');
          } else {
            toast.error(result.message || 'Failed to create task');
          }
        }
      } catch (error) {
        console.error('Error creating task:', error);
        toast.error('Failed to create task. Please try again');
      }
    }
  });

  // Capture latest status when modal opens
  useEffect(() => {
    if (showReminderModal && currentStatus) {
      setLatestStatus(currentStatus);
      setIsClosing(false);
      formik.resetForm();
    }
  }, [showReminderModal, currentStatus]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleCloseReminderModal();
    }, 300);
  };

  if (!showReminderModal || !selectedLead) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div 
        className={`bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Sticky */}
        <div className="sticky top-0 bg-gradient-to-r from-[#BBA473]/10 to-transparent border-b border-[#BBA473]/30 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#BBA473]/20">
              <Bell className="w-6 h-6 text-[#BBA473]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#BBA473]">Set Task</h2>
              <p className="text-gray-400 text-sm mt-1">
                {selectedLead.name} • {selectedLead.leadId || selectedLead.id.slice(-6)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <form onSubmit={formik.handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm text-[#E8D5A3] font-medium block">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Follow up on proposal, Schedule demo call..."
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                  formik.touched.title && formik.errors.title
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                    : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                }`}
              />
              <div className="flex justify-between items-center">
                <div>
                  {formik.touched.title && formik.errors.title && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.title}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formik.values.title.length}/100
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="text-sm text-[#E8D5A3] font-medium block">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Add detailed notes about what needs to be done, context, or any important information..."
                rows="6"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white resize-none transition-all duration-300 ${
                  formik.touched.description && formik.errors.description
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                    : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                }`}
              />
              <div className="flex justify-between items-center">
                <div>
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.description}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formik.values.description.length}/500
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-[#BBA473]/10 border border-[#BBA473]/30 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Bell className="w-5 h-5 text-[#BBA473]" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">
                    Task will be auto created and scheduled according to the lead Status and Protocol for <span className="font-semibold text-[#BBA473]">{selectedLead.name}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Sticky */}
          <div className="sticky bottom-0 bg-[#2A2A2A] border-t border-[#BBA473]/30 p-6">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {formik.isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TaskManagementModal;