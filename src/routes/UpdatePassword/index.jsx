import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Lock, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { changePassword, getUserInfo } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required')
    .min(8, 'Password must be at least 8 characters'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .test('different-from-current', 'New password must be different from current password', function(value) {
      return value !== this.parent.currentPassword;
    }),
  confirmPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
});

export default function ChangePassword() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setIsLoaded(true);
    
    // Get user info from localStorage
    const userInfo = getUserInfo();
    if (userInfo && userInfo.email) {
      setUserEmail(userInfo.email);
    } else {
      toast.error('Please login first');
      navigate('/login');
    }
  }, [navigate]);

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: ChangePasswordSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      
      try {
        console.log('🔵 Submitting password change...');
        
        const result = await changePassword(
          userEmail,
          values.currentPassword,
          values.newPassword
        );

        if (result.success) {
          console.log('✅ Password changed successfully');
          toast.success(result.message || 'Password changed successfully!');
          setShowSuccessModal(true);
          
          // Reset form
          formik.resetForm();
          
          // Redirect after 3 seconds
          setTimeout(() => {
            setShowSuccessModal(false);
            navigate('/dashboard');
          }, 3000);
        } else {
          console.error('❌ Password change failed:', result.message);
          toast.error(result.message || 'Failed to change password');
        }
      } catch (error) {
        console.error('❌ Error changing password:', error);
        toast.error('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Weak', color: 'bg-orange-500' },
      { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, label: 'Good', color: 'bg-blue-500' },
      { strength: 5, label: 'Strong', color: 'bg-green-500' },
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(formik.values.newPassword);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { label: 'One special character', test: (pwd) => /[@$!%*?&]/.test(pwd) },
  ];

  const isButtonDisabled = !formik.isValid || !formik.dirty || isSubmitting;

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BBA473]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#8E7D5A]/5 rounded-full blur-3xl"></div>
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 text-gray-400 hover:text-[#BBA473] transition-all duration-300 group ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
          style={{ transitionDelay: '100ms' }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span>Back</span>
        </button>

        {/* Logo */}
        <div className={`mb-8 transition-all duration-700 delay-150 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <div className="absolute inset-0 bg-[#a38239] rounded transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#BBA473]/50"></div>
              <div className="absolute bottom-0 left-0 w-5 h-5 bg-[#1A1A1A] rounded-tl-lg transition-all duration-300"></div>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-medium text-white transition-all duration-300 group-hover:text-[#E8D5A3]">Save In GOLD</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className={`mb-8 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 rounded-xl border border-[#BBA473]/30">
              <Lock className="w-6 h-6 text-[#BBA473]" />
            </div>
            <h1 className="text-4xl font-bold text-white">Change Password</h1>
          </div>
          <p className="text-gray-400 ml-[60px]">Create a new secure password for your account</p>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className={`space-y-6 transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Current Password */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <label htmlFor="currentPassword" className="block text-[#E8D5A3] font-medium text-lg mb-3 transition-colors duration-300">
              Current Password
            </label>
            <div className="relative group">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setFocusedField(null);
                }}
                onFocus={() => setFocusedField('currentPassword')}
                className={`w-full px-4 py-4 pr-12 border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none text-lg transition-all duration-300 placeholder-gray-500 ${
                  formik.touched.currentPassword && formik.errors.currentPassword
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                    : 'border-[#BBA473] focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 hover:border-[#d4bc89] hover:shadow-lg hover:shadow-[#BBA473]/20'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  focusedField === 'currentPassword' ? 'text-[#BBA473] scale-110' : 'text-gray-400 group-hover:text-[#d4bc89]'
                }`}
              >
                {showCurrentPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
              <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#BBA473] to-[#d4bc89] transition-all duration-300 ${
                focusedField === 'currentPassword' ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            {formik.touched.currentPassword && formik.errors.currentPassword && (
              <div className="text-red-400 text-sm mt-2 animate-pulse flex items-center gap-2">
                <X className="w-4 h-4" />
                {formik.errors.currentPassword}
              </div>
            )}
          </div>

          {/* New Password */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <label htmlFor="newPassword" className="block text-[#E8D5A3] font-medium text-lg mb-3 transition-colors duration-300">
              New Password
            </label>
            <div className="relative group">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setFocusedField(null);
                }}
                onFocus={() => setFocusedField('newPassword')}
                className={`w-full px-4 py-4 pr-12 border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none text-lg transition-all duration-300 placeholder-gray-500 ${
                  formik.touched.newPassword && formik.errors.newPassword
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                    : 'border-[#BBA473] focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 hover:border-[#d4bc89] hover:shadow-lg hover:shadow-[#BBA473]/20'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  focusedField === 'newPassword' ? 'text-[#BBA473] scale-110' : 'text-gray-400 group-hover:text-[#d4bc89]'
                }`}
              >
                {showNewPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
              <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#BBA473] to-[#d4bc89] transition-all duration-300 ${
                focusedField === 'newPassword' ? 'w-full' : 'w-0'
              }`}></div>
            </div>

            {/* Password Strength Indicator */}
            {formik.values.newPassword && (
              <div className="mt-3 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Password Strength:</span>
                  <span className={`text-sm font-semibold ${
                    passwordStrength.strength <= 2 ? 'text-red-400' :
                    passwordStrength.strength === 3 ? 'text-yellow-400' :
                    passwordStrength.strength === 4 ? 'text-blue-400' :
                    'text-green-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-700'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {formik.values.newPassword && (
              <div className="mt-3 space-y-2 animate-fadeIn">
                {passwordRequirements.map((req, index) => {
                  const isValid = req.test(formik.values.newPassword);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                        isValid ? 'text-green-400' : 'text-gray-500'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isValid ? 'bg-green-500' : 'bg-gray-700'
                      }`}>
                        {isValid && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {formik.touched.newPassword && formik.errors.newPassword && (
              <div className="text-red-400 text-sm mt-2 animate-pulse flex items-center gap-2">
                <X className="w-4 h-4" />
                {formik.errors.newPassword}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <label htmlFor="confirmPassword" className="block text-[#E8D5A3] font-medium text-lg mb-3 transition-colors duration-300">
              Confirm New Password
            </label>
            <div className="relative group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setFocusedField(null);
                }}
                onFocus={() => setFocusedField('confirmPassword')}
                className={`w-full px-4 py-4 pr-12 border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none text-lg transition-all duration-300 placeholder-gray-500 ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                    : 'border-[#BBA473] focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 hover:border-[#d4bc89] hover:shadow-lg hover:shadow-[#BBA473]/20'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  focusedField === 'confirmPassword' ? 'text-[#BBA473] scale-110' : 'text-gray-400 group-hover:text-[#d4bc89]'
                }`}
              >
                {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
              <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#BBA473] to-[#d4bc89] transition-all duration-300 ${
                focusedField === 'confirmPassword' ? 'w-full' : 'w-0'
              }`}></div>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <div className="text-red-400 text-sm mt-2 animate-pulse flex items-center gap-2">
                <X className="w-4 h-4" />
                {formik.errors.confirmPassword}
              </div>
            )}
            {formik.values.confirmPassword && !formik.errors.confirmPassword && formik.values.confirmPassword === formik.values.newPassword && (
              <div className="text-green-400 text-sm mt-2 flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4" />
                Passwords match
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isButtonDisabled}
            className="w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-semibold text-lg py-4 rounded-lg hover:from-[#d4bc89] hover:to-[#a69363] disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Change Password
                </>
              )}
            </span>
            {!isButtonDisabled && (
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            )}
          </button>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-2 pt-4 opacity-0 animate-fadeIn" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#BBA473]"></div>
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-pulse"></div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#BBA473]"></div>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#2A2A2A] rounded-xl shadow-2xl border border-[#BBA473]/30 p-8 max-w-md w-full transform animate-scaleIn">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Password Changed!</h2>
              <p className="text-gray-400">
                Your password has been successfully updated. You will be redirected shortly.
              </p>
              <div className="w-full bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-progress {
          animation: progress 3s linear;
        }
      `}</style>
    </div>
  );
}