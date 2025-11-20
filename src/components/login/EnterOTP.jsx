import React, { useState, useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from "react-router-dom";
import { verifyOTP, resendOTP } from '../../services/authService'; // Update path as needed
import { Loader2 } from 'lucide-react';

const OTPSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, 'OTP must be 6 digits')
    .matches(/^[0-9]+$/, 'OTP must contain only numbers')
    .required('OTP is required'),
});

export default function OTPForm({ email, onVerifySuccess }) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formik = useFormik({
    initialValues: {
      otp: '',
    },
    validationSchema: OTPSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        console.log('Verifying OTP:', values.otp);
        
        // Call OTP verification API
        const result = await verifyOTP(email, values.otp);

        if (result.success) {
          console.log('OTP verified successfully:', result.data);
          setSuccessMessage('OTP verified successfully!');
          
          // Call success callback if provided
          if (onVerifySuccess) {
            onVerifySuccess(result.data);
          }
          
          // Navigate to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          // Show error message
          setErrorMessage(result.message || 'Invalid OTP. Please try again.');
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Update formik value
    const otpString = newOtp.join('');
    formik.setFieldValue('otp', otpString);

    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1].focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        formik.setFieldValue('otp', newOtp.join(''));
      }
    }
    // Handle left arrow
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    // Handle right arrow
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    // Only allow numbers
    if (!/^[0-9]+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    // Fill remaining slots with empty strings
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    
    setOtp(newOtp);
    formik.setFieldValue('otp', pastedData);
    
    // Clear error when user pastes
    if (errorMessage) {
      setErrorMessage('');
    }
    
    // Focus on the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex].focus();
    } else {
      inputRefs.current[5].focus();
    }
  };

  const handleResend = async () => {
    if (canResend && !isResending) {
      setIsResending(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        console.log('Resending OTP to:', email);
        
        // Call resend OTP API
        const result = await resendOTP(email);

        if (result.success) {
          console.log('OTP resent successfully');
          setSuccessMessage('OTP has been resent to your email!');
          setResendTimer(60);
          setCanResend(false);
          
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          formik.setFieldValue('otp', '');
          inputRefs.current[0].focus();

          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          setErrorMessage(result.message || 'Failed to resend OTP. Please try again.');
        }
      } catch (error) {
        console.error('Resend OTP error:', error);
        setErrorMessage('Failed to resend OTP. Please try again.');
      } finally {
        setIsResending(false);
      }
    }
  };

  const isButtonDisabled = otp.join('').length !== 6 || !formik.isValid || isLoading;

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#BBA473] rounded-full opacity-5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#BBA473] rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* Logo with Animation */}
        <div className={`mb-12 transition-all duration-700 delay-150 ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
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

        {/* Heading with Animation */}
        <h1 className={`text-4xl font-bold text-white mb-3 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          Enter verification code
        </h1>
        
        {/* Subtitle with Animation */}
        <p className={`text-[#E8D5A3]/70 text-lg mb-8 transition-all duration-700 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          We've sent a 6-digit code to {email}
        </p>

        {/* Form with Animation */}
        <div className={`space-y-6 transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-pulse">
              {errorMessage}
            </div>
          )}

          {/* OTP Input Fields */}
          <div>
            <label className="block text-[#E8D5A3] font-medium text-lg mb-4 transition-colors duration-300">
              Verification Code
            </label>
            <div className="flex gap-3 justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  disabled={isLoading}
                  className={`w-14 h-14 text-center text-2xl font-semibold border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed ${
                    focusedIndex === index 
                      ? 'border-[#d4bc89] ring-2 ring-[#BBA473]/50 scale-110 shadow-lg shadow-[#BBA473]/30' 
                      : digit 
                        ? 'border-[#BBA473] scale-105'
                        : 'border-[#BBA473] hover:border-[#d4bc89] hover:scale-105'
                  } ${
                    (formik.touched.otp && formik.errors.otp) || errorMessage
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                      : ''
                  }`}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            {formik.touched.otp && formik.errors.otp && (
              <div className="text-red-400 text-sm mt-3 animate-pulse">
                {formik.errors.otp}
              </div>
            )}
          </div>

          {/* Submit Button with Enhanced Animations */}
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={isButtonDisabled}
            className="w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-semibold text-lg py-4 rounded-lg hover:from-[#d4bc89] hover:to-[#a69363] disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </span>
            
            {/* Shimmer effect */}
            {!isButtonDisabled && !isLoading && (
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            )}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            {!canResend ? (
              <p className="text-[#E8D5A3]/70 text-lg transition-all duration-300">
                Resend code in <span className="font-semibold text-[#BBA473] inline-block transition-all duration-300 animate-pulse">{resendTimer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || isLoading}
                className="text-[#BBA473] hover:text-[#d4bc89] font-medium text-lg transition-all duration-300 inline-block hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {isResending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Resending...
                  </>
                ) : (
                  'Resend Code'
                )}
              </button>
            )}
          </div>

          {/* Additional decorative elements */}
          <div className="flex items-center justify-center gap-2 pt-4 opacity-0 animate-fadeIn" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#BBA473]"></div>
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-pulse"></div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#BBA473]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}