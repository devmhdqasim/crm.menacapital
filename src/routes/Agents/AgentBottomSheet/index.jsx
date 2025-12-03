import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const AgentBottomSheet = ({ isOpen, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Use requestAnimationFrame to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDragStart = (clientY) => {
    setIsDragging(true);
    setDragStartY(clientY);
    setDragCurrentY(clientY);
  };

  const handleDragMove = (clientY) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY;
    // Only allow dragging down
    if (deltaY > 0) {
      setDragCurrentY(clientY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const deltaY = dragCurrentY - dragStartY;
    const sheetHeight = sheetRef.current?.offsetHeight || 0;
    const dragPercentage = (deltaY / sheetHeight) * 100;
    
    // Close if dragged down more than 25%
    if (dragPercentage > 25) {
      onClose();
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragStartY(0);
    setDragCurrentY(0);
  };

  // Mouse events
  const handleMouseDown = (e) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add global mouse/touch move and up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStartY, dragCurrentY]);

  if (!shouldRender) return null;

  const dragOffset = isDragging ? Math.max(0, dragCurrentY - dragStartY) : 0;

  return (
    <>
      {/* Backdrop - Smooth fade */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet - Smooth slide with drag */}
      <div
        ref={sheetRef}
        className={`absolute left-0 right-0 bottom-0 bg-[#1A1A1A] shadow-2xl border-t border-[#BBA473]/30 z-50 ${
          isDragging ? '' : 'transition-transform duration-350 ease-out'
        } ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: '100%',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          transform: isDragging ? `translateY(${dragOffset}px)` : undefined
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header with drag handle */}
          <div 
            className="sticky top-0 bg-[#1A1A1A] z-10 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-[#BBA473]/30 rounded-full" />
            </div>

            {/* Header Content */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#BBA473]/30">
              <div>
                <h2 className="text-2xl font-bold text-[#BBA473]">
                  Agent Details
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  View and manage agent information
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#2A2A2A] transition-all duration-300 text-gray-400 hover:text-white hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Sample Content */}
              <div className="bg-[#2A2A2A] border border-[#BBA473]/30 rounded-lg p-8 text-center">
                <h3 className="text-3xl font-bold text-white mb-4">
                    Agent Details
                </h3>
                <p className="text-gray-400 text-lg">
                    View and manage agent information
                </p>
              </div>

              <div className="h-20" /> {/* Bottom spacing */}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AgentBottomSheet;