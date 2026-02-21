import { useEffect, useState } from 'react';
import { X, MessageCircle, Bell, AlertTriangle, Phone } from 'lucide-react';
import { useFirebaseNotifications } from '../../context/FirebaseNotificationContext';

// Theme config per notification type
const typeThemes = {
  whatsapp: {
    bg: 'from-[#0a2e24] via-[#0f3d30] to-[#0a2e24]',
    iconBg: 'bg-[#1a6b4a]',
    iconRing: 'ring-[#25D366]/30',
    textColor: 'text-white',
    subtextColor: 'text-white/90',
    tagBg: 'bg-[#25D366]/25',
    tagText: 'text-[#5afa9e]',
    closeBg: 'bg-white/10 hover:bg-white/20',
    closeIcon: 'text-white',
    shadow: 'shadow-[#25D366]/20',
    label: 'WhatsApp',
    Icon: MessageCircle,
  },
  lead: {
    bg: 'from-[#141414] via-[#1e1e1e] to-[#141414]',
    iconBg: 'bg-gradient-to-br from-[#BBA473] to-[#8E7D5A]',
    iconRing: 'ring-[#BBA473]/30',
    textColor: 'text-white',
    subtextColor: 'text-gray-200',
    tagBg: 'bg-[#BBA473]/25',
    tagText: 'text-[#d4bc89]',
    closeBg: 'bg-white/5 hover:bg-white/10',
    closeIcon: 'text-gray-300',
    shadow: 'shadow-[#BBA473]/20',
    label: 'Lead',
    Icon: Bell,
  },
  deposit: {
    bg: 'from-[#141414] via-[#1e1e1e] to-[#141414]',
    iconBg: 'bg-gradient-to-br from-[#a855f7] to-[#7c3aed]',
    iconRing: 'ring-purple-500/30',
    textColor: 'text-white',
    subtextColor: 'text-gray-200',
    tagBg: 'bg-purple-500/25',
    tagText: 'text-purple-300',
    closeBg: 'bg-white/5 hover:bg-white/10',
    closeIcon: 'text-gray-300',
    shadow: 'shadow-purple-500/20',
    label: 'Deposit',
    Icon: Bell,
  },
  general: {
    bg: 'from-[#141414] via-[#1e1e1e] to-[#141414]',
    iconBg: 'bg-gradient-to-br from-[#BBA473] to-[#8E7D5A]',
    iconRing: 'ring-[#BBA473]/30',
    textColor: 'text-white',
    subtextColor: 'text-gray-200',
    tagBg: 'bg-[#BBA473]/25',
    tagText: 'text-[#d4bc89]',
    closeBg: 'bg-white/5 hover:bg-white/10',
    closeIcon: 'text-gray-300',
    shadow: 'shadow-[#BBA473]/20',
    label: 'Notification',
    Icon: Bell,
  },
};

function getTheme(type) {
  return typeThemes[type] || typeThemes.general;
}

export default function NotificationBanner() {
  const { latestNotification, showBanner, dismissBanner } = useFirebaseNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showBanner && latestNotification) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [showBanner, latestNotification]);

  if (!showBanner || !latestNotification) return null;

  const theme = getTheme(latestNotification.type);
  const isHighPriority = latestNotification.priority === 'high';
  const isWhatsApp = latestNotification.type === 'whatsapp';
  const IconComponent = theme.Icon;

  return (
    <div
      className={`fixed top-4 right-4 left-4 md:left-auto md:w-[440px] z-[99999] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95'
      }`}
    >
      <div
        className={`bg-gradient-to-r ${theme.bg} rounded-2xl shadow-2xl ${theme.shadow} border ${
          isWhatsApp ? 'border-[#25D366]/30' : 'border-[#BBA473]/20'
        } overflow-hidden backdrop-blur-xl`}
      >
        {/* Top accent line */}
        <div
          className={`h-[3px] w-full ${
            isWhatsApp
              ? 'bg-gradient-to-r from-transparent via-[#25D366] to-transparent'
              : isHighPriority
              ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#BBA473] to-transparent'
          }`}
        />

        <div className="px-4 py-3.5">
          <div className="flex items-start gap-3.5">
            {/* Icon with animated ring */}
            <div className="flex-shrink-0 relative">
              <div className={`absolute inset-0 rounded-xl ${theme.iconRing} ring-4 animate-ping opacity-30`} />
              <div
                className={`relative w-11 h-11 ${theme.iconBg} rounded-xl flex items-center justify-center shadow-lg`}
              >
                {isWhatsApp ? (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                ) : (
                  <IconComponent className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              {/* Type label + priority */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${theme.tagBg} ${theme.tagText}`}
                >
                  {theme.label}
                </span>
                {isHighPriority && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-500/20 text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className={`text-sm font-bold ${theme.textColor} leading-tight`}>
                {latestNotification.title}
              </h4>

              {/* Message - show up to 2 lines */}
              <p className={`text-xs ${theme.subtextColor} mt-0.5 leading-relaxed line-clamp-2`}>
                {latestNotification.message}
              </p>

              {/* WhatsApp sender info */}
              {isWhatsApp && latestNotification.senderName && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Phone className="w-3 h-3 text-[#5afa9e]/70" />
                  <span className="text-[11px] text-[#5afa9e]/80 font-medium">
                    {latestNotification.senderName}
                    {latestNotification.senderPhone && (
                      <span className="text-white/50 ml-1.5">{latestNotification.senderPhone}</span>
                    )}
                  </span>
                </div>
              )}

              {/* Timestamp */}
              {latestNotification.createdAt && (
                <span className="text-[10px] text-white/40 mt-1 block">
                  {new Date(latestNotification.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={dismissBanner}
              className={`flex-shrink-0 w-7 h-7 ${theme.closeBg} rounded-lg flex items-center justify-center transition-all duration-200 mt-0.5`}
              aria-label="Dismiss notification"
            >
              <X className={`w-3.5 h-3.5 ${theme.closeIcon}`} />
            </button>
          </div>
        </div>

        {/* Bottom progress bar - auto dismiss indicator */}
        <div className="h-[2px] w-full bg-black/20 overflow-hidden">
          <div
            className={`h-full ${isWhatsApp ? 'bg-[#25D366]' : isHighPriority ? 'bg-red-400' : 'bg-[#BBA473]'}`}
            style={{
              animation: 'shrinkWidth 8s linear forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
