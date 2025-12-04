import React from 'react';
import { X, ChevronDown, Eye, EyeOff, RefreshCw, Upload, Calendar } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const AgentFormDrawer = ({
  drawerOpen,
  handleCloseDrawer,
  formik,
  editingAgent,
  showPassword,
  setShowPassword,
  showPassIcon,
  imagePreview,
  handleImageChange,
  removeImage,
  generatePassword,
  departments,
  branches
}) => {
  return (
    <>
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full lg:w-2/5 bg-[#1A1A1A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-[#BBA473]/30 bg-gradient-to-r from-[#BBA473]/10 to-transparent">
            <div>
              <h2 className="text-2xl font-bold text-[#BBA473]">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingAgent ? 'Update agent information' : 'Fill in the details to add a new agent'}
              </p>
            </div>
            <button
              onClick={handleCloseDrawer}
              className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Personal Information Section */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#BBA473]/30 pb-3">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.firstName && formik.errors.firstName
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.firstName}</div>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.lastName && formik.errors.lastName
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.lastName}</div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                      formik.touched.email && formik.errors.email
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                        : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                    }`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.email}</div>
                  )}
                </div>

                {/* Date of Birth with Calendar */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formik.values.dateOfBirth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                        formik.touched.dateOfBirth && formik.errors.dateOfBirth
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                      style={{
                        colorScheme: 'dark'
                      }}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                  {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.dateOfBirth}</div>
                  )}
                </div>

                {/* Phone - International */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  {!showPassIcon && (
                  <PhoneInput
                    international
                    defaultCountry="AE"
                    value={formik.values.phone}
                    onChange={(value) => formik.setFieldValue('phone', value || '')}
                    onBlur={() => formik.setFieldTouched('phone', true)}
                    className={`phone-input-custom ${
                      formik.touched.phone && formik.errors.phone
                        ? 'phone-input-error'
                        : ''
                    }`}
                  />
                )}
                  {formik.touched.phone && formik.errors.phone && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.phone}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#BBA473]/30 pb-3">
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-2">
                  <label className="text-sm text-[#E8D5A3] font-medium block">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formik.values.department}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 appearance-none ${
                        formik.touched.department && formik.errors.department
                          ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                          : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                      }`}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#BBA473] pointer-events-none" />
                  </div>
                  {formik.touched.department && formik.errors.department && (
                    <div className="text-red-400 text-sm animate-pulse">{formik.errors.department}</div>
                  )}
                </div>

                {/* Password - only for new agents */}
                {!editingAgent && (
                  <div className="space-y-2">
                    <label className="text-sm text-[#E8D5A3] font-medium block">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {!showPassIcon && (
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Enter password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`w-full px-4 py-3 pr-24 border-2 rounded-lg focus:outline-none focus:ring-2 bg-[#1A1A1A] text-white transition-all duration-300 ${
                              formik.touched.password && formik.errors.password
                                ? 'border-red-500 focus:border-red-400 focus:ring-red-500/50'
                                : 'border-[#BBA473]/30 focus:border-[#BBA473] focus:ring-[#BBA473]/50 hover:border-[#BBA473]'
                            }`}
                          />
                      )}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white focus:outline-none transition-all duration-300 hover:scale-110"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="h-7 px-2 flex items-center justify-center bg-[#BBA473] text-black rounded-md hover:bg-[#d4bc89] focus:outline-none text-xs transition-all duration-300 hover:scale-105"
                          title="Generate Password"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span>Gen</span>
                        </button>
                      </div>
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <div className="text-red-400 text-sm animate-pulse">{formik.errors.password}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2 pt-4">
                <label className="text-sm text-[#E8D5A3] font-medium block">
                  Profile Image
                </label>
                
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-[#BBA473]/30 rounded-lg p-6 text-center hover:border-[#BBA473] transition-all duration-300">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-12 h-12 text-gray-400 transition-transform duration-300 hover:scale-110" />
                      <span className="text-gray-400">Click to upload image</span>
                      <span className="text-xs text-gray-500">JPG, PNG or GIF (Max 5MB)</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-[#BBA473]"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-300 hover:scale-110 hover:rotate-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {formik.touched.image && formik.errors.image && (
                  <div className="text-red-400 text-sm animate-pulse">{formik.errors.image}</div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 sticky bottom-0 bg-[#1A1A1A] pt-4 border-t border-[#BBA473]/30">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-[#3A3A3A] text-white hover:bg-[#4A4A4A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black hover:from-[#d4bc89] hover:to-[#a69363] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#BBA473]/40 transform hover:scale-105 active:scale-95"
              >
                {formik.isSubmitting 
                  ? (editingAgent ? 'Updating...' : 'Creating...') 
                  : (editingAgent ? 'Update Agent' : 'Create Agent')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AgentFormDrawer;