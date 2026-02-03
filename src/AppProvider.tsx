import { store } from '@/shared/store';
import { Theme } from '@radix-ui/themes';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { Wrench, Sparkles, ArrowRight } from 'lucide-react';

// Animated Loading Component

function LoadingFallback() {
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

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Animated Logo Container */}
        <div className="relative">
          {/* Outer Ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-[#BBA473]/20 animate-ping" style={{ animationDuration: '2s' }}></div>
          
          {/* Middle Ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-t-[#BBA473] border-r-[#BBA473]/50 border-b-[#BBA473]/20 border-l-[#BBA473]/50 animate-spin"></div>
          
          {/* Inner Glow */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BBA473]/30 to-[#8E7D5A]/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BBA473] to-[#8E7D5A] animate-pulse shadow-lg shadow-[#BBA473]/50"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white tracking-tight animate-fadeIn">
            Save In Gold
          </h2>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-[#BBA473]/80 text-sm font-medium uppercase tracking-widest animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            Loading your experience
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Professional "We're Working On It" Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState("Checking connection...");

  React.useEffect(() => {
    console.log(error, 'error in AppProvider.tsx')

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    // Status text rotation
    const messages = [
      "Checking connection...",
      "Verifying components...",
      "Almost ready...",
    ];
    let index = 0;
    const statusInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      setStatusText(messages[index]);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, []);

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

      {/* Main Content */}
      <div className="w-full max-w-2xl relative z-10 animate-slideUp">
        {/* Card Container */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-[#BBA473]/20 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          
          {/* Top shine border */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#BBA473]/50 to-transparent opacity-50"></div>

          {/* Icon - Tools Working */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#BBA473]/20 rounded-full blur-xl animate-pulse"></div>
              
              {/* Icon container */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#BBA473]/20 to-[#8E7D5A]/20 border-2 border-[#BBA473]/30 flex items-center justify-center">
                <Wrench className="w-12 h-12 text-[#BBA473] animate-wiggle" />
                
                {/* Sparkles */}
                <Sparkles className="w-5 h-5 text-[#BBA473] absolute -top-2 -right-2 animate-pulse" />
                <Sparkles className="w-4 h-4 text-[#BBA473] absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              We're On It!
            </h1>
            <p className="text-[#BBA473]/90 text-lg md:text-xl font-medium">
              Just a quick moment while we fine-tune things
            </p>
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
              Our system is performing some optimizations to give you the best experience.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 space-y-3">
            <div className="w-full h-2 bg-[#0f0f0f]/80 rounded-full overflow-hidden border border-[#BBA473]/10">
              <div 
                className="h-full bg-gradient-to-r from-[#BBA473] via-[#d4b886] to-[#BBA473] rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect on progress bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            
            {/* Status text */}
            <p className="text-center text-[#BBA473]/70 text-sm transition-all duration-300">
              {statusText}
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#0f0f0f]/60 border border-[#BBA473]/10 rounded-lg p-4 text-center group hover:border-[#BBA473]/30 transition-all duration-300">
              <div className="w-3 h-3 rounded-full bg-[#BBA473] mx-auto mb-2 animate-pulse"></div>
              <p className="text-white text-sm font-medium">System Check</p>
              <p className="text-gray-500 text-xs mt-1">Running</p>
            </div>
            
            <div className="bg-[#0f0f0f]/60 border border-[#BBA473]/10 rounded-lg p-4 text-center group hover:border-[#BBA473]/30 transition-all duration-300">
              <div className="w-3 h-3 rounded-full bg-[#BBA473] mx-auto mb-2 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <p className="text-white text-sm font-medium">Loading Data</p>
              <p className="text-gray-500 text-xs mt-1">In Progress</p>
            </div>
            
            <div className="bg-[#0f0f0f]/60 border border-[#BBA473]/10 rounded-lg p-4 text-center group hover:border-[#BBA473]/30 transition-all duration-300">
              <div className="w-3 h-3 rounded-full bg-[#BBA473]/50 mx-auto mb-2 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <p className="text-white text-sm font-medium">Finalizing</p>
              <p className="text-gray-500 text-xs mt-1">Pending</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={resetErrorBoundary}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#BBA473] to-[#8E7D5A] text-black font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg shadow-[#BBA473]/20 hover:shadow-[#BBA473]/40 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </button>
            
            <p className="text-gray-500 text-xs mt-4">
              Taking longer than expected? 
              <button 
                onClick={() => globalThis.location.assign(globalThis.location.origin)}
                className="text-[#BBA473] hover:text-[#d4b886] ml-1 underline underline-offset-2 transition-colors"
              >
                Refresh the page
              </button>
            </p>
          </div>

          {/* Decorative elements */}
          <div className="flex items-center justify-center gap-2 pt-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#BBA473]/50"></div>
            <div className="w-2 h-2 rounded-full bg-[#BBA473] animate-pulse"></div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#BBA473]/50"></div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8">
          <p className="text-[#BBA473]/60 text-xs tracking-widest uppercase">
            Powered by Save In Gold
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Provider store={store}>
        <Theme
          accentColor="mint"
          grayColor="gray"
          panelBackground="solid"
          scaling="100%"
          radius="full"
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Router>{children}</Router>
          </ErrorBoundary>
        </Theme>
      </Provider>
    </React.Suspense>
  );
}