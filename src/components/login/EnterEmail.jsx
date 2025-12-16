import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2 } from 'lucide-react';

const LoginSchema = Yup.object().shape({
  login: Yup.string()
    .required('Email or Username is required')
    .test('valid-login', 'Invalid email or username format', function(value) {
      if (!value) return false;
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) return true;
      
      // Username validation (alphanumeric, underscore, hyphen, 3-30 chars)
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      return usernameRegex.test(value);
    }),
});

export default function EnterEmailOrUsername({ 
  setLogin, 
  setLoginBy, 
  setIsBranchLogin,
  setIsEventLogin,
  onNext 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formik = useFormik({
    initialValues: {
      login: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      
      const loginValue = values.login.trim();
      
      // Determine if it's email or username
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(loginValue);
      const loginType = isEmail ? 'email' : 'username';
      
      // One-liner to check for branch (BR) or event (EV) login
      const upperLogin = loginValue.toUpperCase();
      const isBranch = upperLogin.startsWith('BR');
      const isEvent = upperLogin.startsWith('EV');
      
      console.log('🔍 Login Detection:', {
        login: loginValue,
        loginType,
        isBranch,
        isEvent,
        isEmail
      });
      
      // Set login states
      setLogin(loginValue);
      setLoginBy(loginType);
      setIsBranchLogin(isBranch);
      setIsEventLogin(isEvent);
      
      // Small delay for better UX
      setTimeout(() => {
        setIsLoading(false);
        onNext();
      }, 300);
    },
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && formik.isValid && !isLoading) {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  const isButtonDisabled = !formik.isValid || isLoading || !formik.values.login.trim();

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 relative overflow-hidden">
      
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
        <h1 className={`text-4xl font-bold text-white mb-4 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          Welcome Back
        </h1>
        
        {/* Subtitle */}
        <p className={`text-gray-400 text-lg mb-8 transition-all duration-700 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          Enter your email or username to continue
        </p>

        {/* Form with Animation */}
        <div className={`space-y-6 transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          
          {/* Email/Username Field */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <label htmlFor="login" className="block text-[#E8D5A3] font-medium text-lg mb-3 transition-colors duration-300">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="login"
                name="login"
                value={formik.values.login}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`w-full px-4 py-4 border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none text-lg transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formik.touched.login && formik.errors.login
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                    : 'border-[#BBA473] focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 hover:border-[#d4bc89] hover:shadow-lg hover:shadow-[#BBA473]/20'
                }`}
                placeholder="Enter your email or username"
                autoComplete="username"
              />
              
              {/* Animated underline effect */}
              <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#BBA473] to-[#d4bc89] transition-all duration-300 ${isFocused ? 'w-full' : 'w-0'}`}></div>
            </div>
            
            {formik.touched.login && formik.errors.login && (
              <div className="text-red-400 text-sm mt-2 animate-pulse">
                {formik.errors.login}
              </div>
            )}
          </div>

          {/* Continue Button */}
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
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </span>
            
            {/* Shimmer effect */}
            {!isButtonDisabled && !isLoading && (
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            )}
          </button>

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