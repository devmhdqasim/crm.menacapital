import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { verifyOTP, resendOTP } from '../../services/authService'; // Update path as needed
import toast from 'react-hot-toast';


const APP_VERSION = __APP_VERSION__ || '1.0.0';

const OTPSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, 'OTP must be exactly 6 digits')
    .matches(/^[0-9]+$/, 'OTP must be only digits')
    .required('OTP is required'),
});

export default function EnterOTP({
  login,
  loginBy,
  onVerifySuccess,
  onBack,
  setCurrentStep
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    setIsLoaded(true);
    // Focus first input on load
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formik = useFormik({
    initialValues: {
      otp: '',
    },
    validationSchema: OTPSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        console.log('🔐 Verifying OTP:', { login, otp: values.otp, loginBy });
        const result = await verifyOTP(login, values.otp, loginBy);

        if (result.success) {
          toast.success('Verification Successful!', {
            style: {
              background: '#1a1a1a',
              color: '#00FF7F',
              border: '1px solid #16A249',
            },
            iconTheme: {
              primary: '#16A249',
              secondary: '#1a1a1a',
            },
          });
          // Small delay for success animation
          setTimeout(() => {
            onVerifySuccess(result.data);
          }, 500);
        } else {
          toast.error(result.message || 'Invalid OTP');
        }
      } catch (error) {
        console.error('OTP Verification Error:', error);
        toast.error(error.message || 'Verification failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleOtpChange = (index, value) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Update formik value
    const otpString = newOtpValues.join('');
    formik.setFieldValue('otp', otpString);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit if all filled
    if (otpString.length === 6 && index === 5) {
      // Optional: trigger submit automatically
      // formik.handleSubmit();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    // Handle Enter
    if (e.key === 'Enter' && formik.isValid && !isLoading) {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');

    if (pastedData) {
      const newOtpValues = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 6) newOtpValues[i] = pastedData[i];
      }
      setOtpValues(newOtpValues);
      formik.setFieldValue('otp', newOtpValues.join(''));

      // Focus appropriate input
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex].focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await resendOTP(login, loginBy);
      toast.success('OTP Resent Successfully', {
        style: {
          background: '#1a1a1a',
          color: '#00FF7F',
          border: '1px solid #16A249',
        },
        iconTheme: {
          primary: '#16A249',
          secondary: '#1a1a1a',
        },
      });
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Enhanced Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(22,162,73,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(22,162,73,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Brighter Major Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(22,162,73,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(22,162,73,0.07)_1px,transparent_1px)] bg-[size:200px_200px]"></div>

        {/* Radial Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(22,162,73,0.15),transparent_70%)]"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#16A249] rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#1C4F2A] rounded-full mix-blend-screen filter blur-[128px] opacity-5 animate-pulse" style={{ animationDuration: '7s' }}></div>
      </div>

      <div className={`w-full max-w-lg relative z-10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute -top-12 left-0 text-[#00FF7F]/80 hover:text-[#00FF7F] flex items-center gap-2 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Card Container */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-[#16A249]/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden group-hover:border-[#16A249]/40 transition-all duration-500">

          {/* Top shine border */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#16A249]/50 to-transparent opacity-50"></div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-16 flex items-end justify-center gap-[6px]">
              <div className="w-[14px] rounded-sm bg-gradient-to-t from-[#16A249] to-[#00FF7F] shadow-[0_0_10px_rgba(22,162,73,0.4)] animate-[barPulse1_2.5s_ease-in-out_infinite]" style={{ height: '65%' }} />
              <div className="w-[14px] rounded-sm bg-gradient-to-t from-[#16A249] to-[#00FF7F] shadow-[0_0_10px_rgba(22,162,73,0.4)] animate-[barPulse2_2.5s_ease-in-out_infinite]" style={{ height: '90%' }} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Verification
            </h1>
            <p className="text-[#00FF7F]/80 text-sm font-medium">
              Enter the 6-digit code sent to your email
            </p>
            <p className="text-gray-500 text-xs mt-1 truncate max-w-[250px] mx-auto">
              {login}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-8">

            {/* OTP Inputs */}
            <div className="flex justify-between gap-2">
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-xl font-bold bg-[#0f0f0f]/80 text-white rounded-lg border transition-all duration-300 focus:outline-none ${digit
                      ? 'border-[#16A249] shadow-[0_0_10px_rgba(22,162,73,0.2)]'
                      : 'border-[#16A249]/10 focus:border-[#16A249]'
                    }`}
                />
              ))}
            </div>

            {/* Error text with smooth height transition */}
            <div className={`transition-all duration-300 overflow-hidden ${formik.touched.otp && formik.errors.otp ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="text-red-400 text-xs text-center">
                {formik.errors.otp}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={isLoading || formik.values.otp.length !== 6}
              className="w-full bg-gradient-to-r from-[#16A249] to-[#1C4F2A] text-white font-bold text-lg py-4 rounded-lg hover:from-[#1EB956] hover:to-[#267A3D] disabled:from-[#0E5A28] disabled:to-[#0D3D1E] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#16A249]/20 hover:shadow-[#16A249]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </span>

              {/* Shimmer effect */}
              {!isLoading && formik.values.otp.length === 6 && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              )}
            </button>

            {/* Resend Timer */}
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-[#00FF7F] hover:text-[#00FF7F] text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <RefreshCw size={14} />
                  Resend Code
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Resend code in <span className="text-[#00FF7F] font-mono">{timer}s</span>
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[#00FF7F]/50 text-xs tracking-widest uppercase">Secured by Mena Capital</p>
          <p className="text-[#00FF7F]/30 text-[10px] tracking-wider">
            v{APP_VERSION} &middot; &copy; {new Date().getFullYear()} Mena Capital
          </p>
        </div>

      </div>
    </div>
  );
}