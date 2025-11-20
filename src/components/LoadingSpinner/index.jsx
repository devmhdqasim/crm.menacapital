import React from 'react';

/**
 * LoadingSpinner Component
 * Beautiful animated spinner for loading states
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...',
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-[#BBA473] z-50'
    : 'flex items-center justify-center w-full h-full min-h-[200px]';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div
            className={`${sizeClasses[size]} border-4 border-[#8E7D5A]/30 border-t-[#8E7D5A] rounded-full animate-spin`}
          />
          
          {/* Inner pulse */}
          <div
            className={`absolute inset-0 m-auto ${
              size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-6 h-6' : 'w-8 h-8'
            } bg-[#8E7D5A]/20 rounded-full animate-pulse`}
          />
        </div>

        {/* Loading message */}
        {message && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-[#685A3D] font-medium text-sm animate-pulse">
              {message}
            </p>
            {/* Animated dots */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#8E7D5A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#8E7D5A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#8E7D5A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * PageTransition Component
 * Smooth fade-in animation for page content
 */
export const PageTransition = ({ children }) => {
  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
};

/**
 * SkeletonLoader Component
 * Placeholder skeleton for content loading
 */
export const SkeletonLoader = ({ type = 'page' }) => {
  
  // Full page skeleton with cards
  if (type === 'page') {
    return (
      <div className="p-6 space-y-6 animate-fadeIn">
        {/* Page Header Skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-20 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Table skeleton
  if (type === 'table') {
    return (
      <div className="p-6 animate-fadeIn">
        {/* Table Header */}
        <div className="mb-4 space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
            </div>
          </div>
          
          {/* Table Rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4 border-b border-gray-100">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-4 flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Form skeleton
  if (type === 'form') {
    return (
      <div className="p-6 animate-fadeIn">
        {/* Form Header */}
        <div className="mb-6 space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
            </div>
          ))}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard skeleton
  if (type === 'dashboard') {
    return (
      <div className="p-6 space-y-6 animate-fadeIn">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Card skeleton (default)
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-20 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
};

/**
 * RouteLoadingFallback Component
 * Shows skeleton loader instead of spinner - keeps sidebar/header visible
 * This is used as Suspense fallback for route changes
 */
export const RouteLoadingFallback = ({ type = 'page' }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SkeletonLoader type={type} />
    </div>
  );
};

/**
 * ComponentLoadingFallback Component
 * Smaller loading indicator for component-level suspense
 */
export const ComponentLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner 
        size="medium" 
        message="Loading..." 
      />
    </div>
  );
};

/**
 * InlineLoader Component
 * Small inline spinner for buttons and small components
 */
export const InlineLoader = ({ message = '' }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-4 h-4 border-2 border-[#8E7D5A]/30 border-t-[#8E7D5A] rounded-full animate-spin" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;