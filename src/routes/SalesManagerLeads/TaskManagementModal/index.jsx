import React, { useState, useEffect } from 'react';
import { Bell, X, FileText } from 'lucide-react';
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showReminderModal) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showReminderModal]);

  if (!showReminderModal || !selectedLead) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-[#1f1f1f] rounded-2xl shadow-[0_8px_50px_rgba(0,0,0,0.8)] border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Sticky */}
        <div className="sticky top-0 bg-[#262626] border-b border-gray-600 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#BBA473]/10">
              <FileText className="w-4 h-4 text-[#BBA473]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Set Task</h2>
              <p className="text-gray-500 text-xs font-mono">
                {selectedLead.name} • {selectedLead.leadId || selectedLead.id.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 text-gray-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <form onSubmit={formik.handleSubmit} className="overflow-y-auto flex-1 modal-scrollbar">
          <div className="p-6 space-y-5">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Follow up on proposal, Schedule demo call..."
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white/[0.04] text-white text-sm transition-all duration-300 placeholder-gray-600 ${
                  formik.touched.title && formik.errors.title
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/30'
                    : 'border-white/[0.06] focus:border-[#BBA473]/50 focus:ring-[#BBA473]/20 hover:border-white/10'
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
              <label className="text-[10px] text-[#BBA473]/60 font-semibold uppercase tracking-widest block">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Add detailed notes about what needs to be done, context, or any important information..."
                rows="5"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white/[0.04] text-white text-sm resize-none transition-all duration-300 placeholder-gray-600 ${
                  formik.touched.description && formik.errors.description
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/30'
                    : 'border-white/[0.06] focus:border-[#BBA473]/50 focus:ring-[#BBA473]/20 hover:border-white/10'
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
            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Bell className="w-4 h-4 text-[#BBA473]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    Task will be auto created and scheduled according to the lead Status and Protocol for <span className="font-semibold text-[#BBA473]">{selectedLead.name}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Sticky */}
          <div className="sticky bottom-0 bg-[#262626] border-t border-white/[0.06] px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 hover:border-white/10"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black transition-all duration-300 shadow-lg shadow-[#BBA473]/10 hover:shadow-[#BBA473]/25 transform hover:scale-[1.02] active:scale-[0.98] disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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

        /* Modal Scrollbar */
        .modal-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(187, 164, 115, 0.15);
          border-radius: 10px;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(187, 164, 115, 0.3);
        }
      `}</style>
    </div>
  );
};

export default TaskManagementModal;
