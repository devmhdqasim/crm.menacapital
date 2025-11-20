import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

export default function ForgotPasswordForm({ setCurrentStep }) {
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: EmailSchema,
    onSubmit: (values) => {
      console.log('Form submitted:', values);
      // Add your forgot password logic here
      toast.success('Password reset link sent to your email!');
    },
  });

  const isButtonDisabled = !formik.isValid || !formik.values.email;

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center gap-1">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-[#BBA473] rounded"></div>
              <div className="absolute bottom-0 left-0 w-5 h-5 bg-[#1A1A1A] rounded-tl-lg"></div>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-light text-white">Save In GOLD</span>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Forgot Password
        </h1>
        <p className="text-lg font-normal text-[#E8D5A3]/70 mb-8">
          A password reset link will be sent to your email
        </p>

        {/* Form */}
        <div className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-[#E8D5A3] font-medium text-lg mb-3">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-4 pr-12 border-2 border-[#BBA473] bg-[#2e2e2e] text-white rounded-lg focus:outline-none focus:border-[#d4bc89] focus:ring-2 focus:ring-[#BBA473]/50 text-lg transition-colors placeholder-gray-500"
                placeholder="Enter your email"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={22} />
              </div>
            </div>
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-400 text-sm mt-2">
                {formik.errors.email}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={formik.handleSubmit}
            disabled={isButtonDisabled}
            className="w-full bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-semibold text-lg py-4 rounded-lg hover:from-[#d4bc89] hover:to-[#a69363] disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            Send Link
          </button>

          {/* Back to Login Link */}
          <div className="text-center">
            <span className="text-[#E8D5A3] text-lg">Back to </span>
            <span
              onClick={() => setCurrentStep('email')}
              className="text-[#BBA473] hover:text-[#d4bc89] font-medium text-lg transition-colors cursor-pointer"
            >
              Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}