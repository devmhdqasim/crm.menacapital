import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

// Try multiple phone formats since Firebase keys vary
const getPhoneVariants = (phone) => {
  if (!phone) return [];
  const digits = phone.replace(/\D/g, '');  // "+971501203241" → "971501203241" ✅ already correct
  const variants = new Set();
  
  variants.add(digits);                          // 971501203241
  
  if (digits.startsWith('971')) {
    variants.add('0' + digits.slice(3));         // 0501203241
    variants.add(digits.slice(3));               // 501203241
  }
  if (digits.startsWith('1') && digits.length === 11) {
    variants.add(digits);                        // 16476747433 (North America)
  }
  if (!digits.startsWith('0')) {
    variants.add('0' + digits);                  // 0971501203241
  }
  
  return [...variants];
};

export const useWhatsAppSession = (phone) => {
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!phone || !db) return;

    const phoneVariants = getPhoneVariants(phone);
    console.log('🔍 Checking Firebase for phone variants:', phoneVariants);

    const unsubscribes = [];
    let countdownInterval = null;
    let activeVariant = null;

    const startCountdown = (expiresAt) => {
      if (countdownInterval) clearInterval(countdownInterval);
      const tick = () => {
        const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
        if (diff <= 0) {
          setTimeLeft(0);
          setIsSessionOpen(false);
          clearInterval(countdownInterval);
          countdownInterval = null;
          activeVariant = null;
        } else {
          setTimeLeft(diff);
        }
      };
      tick();
      countdownInterval = setInterval(tick, 1000);
    };

    phoneVariants.forEach((variant) => {
      const sessionRef = ref(db, `whatsappSessions/${variant}`);

      const unsub = onValue(sessionRef, (snapshot) => {
        const data = snapshot.val();

        if (data && data.isOpen === true && data.sessionExpiresAt) {
          const diff = Math.floor((new Date(data.sessionExpiresAt).getTime() - Date.now()) / 1000);
          if (diff > 0) {
            activeVariant = variant;
            setIsSessionOpen(true);
            startCountdown(data.sessionExpiresAt);
          } else if (activeVariant === variant || activeVariant === null) {
            setIsSessionOpen(false);
            setTimeLeft(null);
            activeVariant = null;
          }
        } else if (activeVariant === variant || activeVariant === null) {
          setIsSessionOpen(false);
          setTimeLeft(null);
          if (countdownInterval) clearInterval(countdownInterval);
          countdownInterval = null;
          activeVariant = null;
        }
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [phone]);

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTimerColor = (seconds) => {
    if (!seconds) return null;
    const hours = seconds / 3600;
    if (hours < 1) return { text: 'text-red-400', bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/40', dot: 'bg-red-500', glow: 'shadow-red-500/20' };
    if (hours < 6) return { text: 'text-orange-400', bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/40', dot: 'bg-orange-500', glow: 'shadow-orange-500/20' };
    return { text: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/20', border: 'border-emerald-500/40', dot: 'bg-emerald-500', glow: 'shadow-emerald-500/20' };
  };

  return {
    isSessionOpen,
    timeLeft,
    formattedTimeLeft: formatTime(timeLeft),
    colors: getTimerColor(timeLeft),
  };
};