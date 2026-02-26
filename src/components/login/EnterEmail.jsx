import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, Shield, Zap, Globe } from 'lucide-react';
import logo from '../../assets/images/logo.svg';

const APP_VERSION = __APP_VERSION__ || '1.0.0';

const LoginSchema = Yup.object().shape({
  login: Yup.string()
    .required('Email or Username is required')
    .test('valid-login', 'Invalid email or username format', function (value) {
      if (!value) return false;

      // 1. Check if it's a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) return true;

      // 2. If not email, validate username prefix
      const allowedPrefixes = ['br', 'sm', 'sa', 'ev', 'ad'];
      const lowerValue = value.toLowerCase();
      const hasValidPrefix = allowedPrefixes.some(prefix => lowerValue.startsWith(prefix));

      if (!hasValidPrefix) {
        return this.createError({
          message: 'Username must start with BR, SM, SA, EV, or AD'
        });
      }

      // 3. Validate username format (alphanumeric, underscore, hyphen, 3-30 chars)
      // Note: We already checked the prefix, so just ensure the rest is valid chars
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(value)) {
        return this.createError({
          message: 'Invalid username format (3-30 characters)'
        });
      }

      return true;
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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Enhanced Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(187,164,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(187,164,115,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Brighter Major Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(187,164,115,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(187,164,115,0.07)_1px,transparent_1px)] bg-[size:200px_200px]"></div>

        {/* Radial Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(187,164,115,0.15),transparent_70%)]"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#BBA473] rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8E7D5A] rounded-full mix-blend-screen filter blur-[128px] opacity-5 animate-pulse" style={{ animationDuration: '7s' }}></div>
      </div>

      <div className={`w-full max-w-lg relative z-10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* Card Container */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-[#BBA473]/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden group-hover:border-[#BBA473]/40 transition-all duration-500">

          {/* Top shine border */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#BBA473]/50 to-transparent opacity-50"></div>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={logo} alt="SaveInGold Logo" className="h-16 w-auto object-contain" />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-[#BBA473]/60 text-[10px] font-semibold uppercase tracking-[0.25em] mb-4">
              SIG CRM Portal
            </p>
            <p className="text-[#BBA473]/80 text-sm font-medium uppercase tracking-widest">
              Enter your email or username
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">

            {/* Email/Username Field */}
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
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`w-full px-4 py-4 bg-[#0f0f0f]/80 text-white rounded-lg border transition-all duration-300 placeholder-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${formik.touched.login && formik.errors.login
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-[#BBA473]/10 focus:border-[#BBA473] hover:border-[#BBA473]/30'
                  }`}
                placeholder=" "
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <label
                htmlFor="login"
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${isFocused || formik.values.login
                    ? '-top-2.5 text-xs bg-[#1a1a1a] px-1 text-[#BBA473]'
                    : 'top-4 text-gray-500'
                  }`}
              >
                Email or Username
              </label>

              {/* Error text with smooth height transition */}
              <div className={`transition-all duration-300 overflow-hidden ${formik.touched.login && formik.errors.login ? 'max-h-10 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="text-red-400 text-xs ml-1">
                  {formik.errors.login}
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={isButtonDisabled}
              className="btn-animated btn-gold flex justify-center mx-auto !max-w-64 !w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
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
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
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

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap opacity-0 animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-1.5 text-[#BBA473]/50 text-[10px] uppercase tracking-wider">
            <Shield size={10} />
            <span>Encrypted</span>
          </div>
          <div className="w-px h-3 bg-[#BBA473]/20"></div>
          <div className="flex items-center gap-1.5 text-[#BBA473]/50 text-[10px] uppercase tracking-wider">
            <Zap size={10} />
            <span>Real-time</span>
          </div>
          <div className="w-px h-3 bg-[#BBA473]/20"></div>
          <div className="flex items-center gap-1.5 text-[#BBA473]/50 text-[10px] uppercase tracking-wider">
            <Globe size={10} />
            <span>WhatsApp Ready</span>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6 space-y-2 opacity-0 animate-fadeIn" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <p className="text-[#BBA473]/50 text-xs tracking-widest uppercase">Secured by Save In Gold</p>
          <p className="text-[#BBA473]/30 text-[10px] tracking-wider">
            v{APP_VERSION} &middot; &copy; {new Date().getFullYear()} Save In Gold
          </p>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}