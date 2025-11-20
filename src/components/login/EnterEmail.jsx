import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail, User } from 'lucide-react';
import { logoutUser } from '../../services/authService'

const LoginSchema = Yup.object().shape({
  login: Yup.string()
    .required('Email or Username is required')
    .test('email-or-username', 'Please enter a valid email or username', function(value) {
      if (!value) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
      return emailRegex.test(value) || usernameRegex.test(value);
    }),
});

export default function EnterEmailOrUsername({ setLogin, setLoginBy, setIsBranchLogin, onNext }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputType, setInputType] = useState('email');
  const [isBranchMember, setIsBranchMember] = useState(false);
  const [isBranchUsernameEmail, setIsBranchUsernameEmail] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
    setIsBranchMember(false)
    logoutUser()
  }, []);

  const formik = useFormik({
    initialValues: { login: '' },
    validationSchema: LoginSchema,
    onSubmit: (values) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(values.login);
      const loginBy = isEmail ? 'email' : 'username';

      setLogin(values.login);
      setLoginBy(loginBy);

      console.log('Branch Member:', isBranchMember);

      onNext?.();
    },
  });

  useEffect(() => {
    if (formik.values.login) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(formik.values.login);
      setInputType(isEmail ? 'email' : 'username');
      
      // Check if username starts with BR or br (case insensitive)
      if (!isEmail && formik.values.login.toLowerCase().startsWith('br')) {
        setIsBranchMember(true);
        setIsBranchLogin(true);
      } else if (!isEmail) {
        setIsBranchMember(false);
        setIsBranchLogin(false);
      } else {
        // If it's an email, reset branch member status
        setIsBranchMember(false);
        setIsBranchLogin(false);
      }
    } else {
      setIsBranchMember(false);
      setIsBranchLogin(false);
    }
  }, [formik.values.login, setIsBranchLogin]);

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
      setIsBranchUsernameEmail(shouldHide);
    };
    
    callRefreshAuthAgain();
    
    
    const interval = setInterval(callRefreshAuthAgain, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const isButtonDisabled = !formik.isValid || !formik.values.login;

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Logo */}
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

        {/* Heading */}
        <h1 className={`text-4xl font-bold text-white mb-8 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          Welcome back!
        </h1>

        {/* Form */}
        <div className={`space-y-6 transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Email or Username */}
          <div className="transform transition-all duration-300 hover:scale-[1.01]">
            <label htmlFor="login" className="block text-[#E8D5A3] font-medium text-lg mb-3 transition-colors duration-300">
              Email Address or Username
            </label>
            <div className="relative group">
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
                className={`w-full px-4 py-4 pr-12 border-2 bg-[#2e2e2e] text-white rounded-lg focus:outline-none text-lg transition-all duration-300 placeholder-gray-500 ${
                  formik.touched.login && formik.errors.login
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                    : 'border-[#BBA473] focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 hover:border-[#d4bc89] hover:shadow-lg hover:shadow-[#BBA473]/20'
                }`}
                placeholder="Enter email or username"
              />
              <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${isFocused ? 'text-[#BBA473] scale-110' : 'text-gray-400 group-hover:text-[#d4bc89]'}`}>
                {inputType === 'email' ? <Mail size={22} /> : <User size={22} />}
              </div>
              <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#BBA473] to-[#d4bc89] transition-all duration-300 ${isFocused ? 'w-full' : 'w-0'}`}></div>
            </div>
            {formik.touched.login && formik.errors.login && (
              <div className="text-red-400 text-sm mt-2 animate-pulse">
                {formik.errors.login}
              </div>
            )}
            <p className="text-gray-400 text-sm mt-2">
              You can sign in with your email address or username
            </p>
          </div>

          {/* Branch Member Switch */}
          <div className={`flex items-center justify-between bg-[#2e2e2e] px-4 py-3 rounded-lg border transition-all duration-300 ${
            isBranchMember 
              ? 'border-[#BBA473] shadow-lg shadow-[#BBA473]/30' 
              : 'border-[#BBA473]/40 hover:border-[#BBA473]/70'
          }`}>
            <span className={`font-medium text-sm sm:text-base transition-all duration-300 ${
              isBranchMember ? 'text-[#d4bc89]' : 'text-[#E8D5A3]'
            }`}>
              Login as Branch Member
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isBranchMember}
                onChange={() => {
                  setIsBranchMember(!isBranchMember)
                  setIsBranchLogin(!isBranchMember)
                }}
              />
              <div className="w-12 h-6 bg-gray-500 rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1A1A1A] after:border-[#BBA473] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#BBA473] peer-checked:to-[#8E7D5A]"></div>
            </label>
          </div>

          {!isBranchUsernameEmail && (
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={isButtonDisabled}
              className="w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-semibold text-lg py-4 rounded-lg hover:from-[#d4bc89] hover:to-[#a69363] disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 relative overflow-hidden group"
            >
              <span className="relative z-10">Continue</span>
              {!isButtonDisabled && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-2 pt-4 opacity-0 animate-fadeIn" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#BBA473]"></div>
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-pulse"></div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#BBA473]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}