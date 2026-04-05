import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, ShoppingCart, User, Star, Gift, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useSettings } from '@/contexts/SettingsContext';

const RECENT_ACTIVITIES = [
  { name: 'Customer from Paradip', action: 'booked a Service', time: 'Just now' },
];

export function SalesTriggers() {
  const { settings } = useSettings();
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [activities, setActivities] = useState(RECENT_ACTIVITIES);
  const [activityIndex, setActivityIndex] = useState(0);
  const [showLeadMagnet, setShowLeadMagnet] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch AI Social Proof
  useEffect(() => {
    console.log("SalesTriggers Settings Sync:", {
      enabled: settings?.enableAiSocialProof,
      interval: settings?.aiSocialProofInterval
    });

    if (!settings?.enableAiSocialProof) return;

    const fetchProof = async () => {
      try {
        console.log("Fetching Social Proof...");
        const res = await fetch('/api/ai/social-proof');
        console.log("Social Proof Status:", res.status);
        const data = await res.json();
        console.log("Social Proof Data:", data);
        if (Array.isArray(data) && data.length > 0) {
          setActivities(data);
          setActivityIndex(0);
        }
      } catch (e) {
        console.error("Failed to fetch AI Social Proof");
      }
    };

    fetchProof();
  }, [settings?.enableAiSocialProof]);

  // Social Proof Rotation
  useEffect(() => {
    if (!settings?.enableAiSocialProof || isDismissed) {
      setShowSocialProof(false);
      return;
    }

    // Check session storage for dismissal
    const sessionDismissed = sessionStorage.getItem('socialProofDismissed');
    if (sessionDismissed) {
      setIsDismissed(true);
      return;
    }

    const intervalSeconds = settings?.aiSocialProofInterval || 90;
    
    // Initial show after 15s
    const firstShowTimer = setTimeout(() => setShowSocialProof(true), 15000);
    
    const rotationInterval = setInterval(() => {
      setShowSocialProof(false);
      setTimeout(() => {
        setActivityIndex((prev) => (prev + 1) % activities.length);
        setShowSocialProof(true);
      }, 1000);
    }, intervalSeconds * 1000);

    return () => {
      clearTimeout(firstShowTimer);
      clearInterval(rotationInterval);
    };
  }, [settings?.enableAiSocialProof, settings?.aiSocialProofInterval, activities.length, isDismissed]);

  // Lead Magnet Logic (Show after 30s)
  useEffect(() => {
    const leadTimer = setTimeout(() => {
      const dismissed = localStorage.getItem('leadMagnetDismissed');
      if (!dismissed) setShowLeadMagnet(true);
    }, 30000);

    return () => clearTimeout(leadTimer);
  }, []);

  const dismissSocialProof = () => {
    setShowSocialProof(false);
    setIsDismissed(true);
    sessionStorage.setItem('socialProofDismissed', 'true');
  };

  const dismissLeadMagnet = () => {
    setShowLeadMagnet(false);
    localStorage.setItem('leadMagnetDismissed', 'true');
  };

  const currentActivity = activities[activityIndex] || RECENT_ACTIVITIES[0];

  if (!settings?.enableAiSocialProof && !showLeadMagnet) return null;

  return (
    <>
      {/* 1. Floating Social Proof - Deep Blue Style */}
      <div
        className={cn(
          'fixed left-6 bottom-6 z-50 transition-all duration-700 transform',
          (showSocialProof && !isDismissed) ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        )}
      >
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-[320px] relative">
          
          {settings?.showAiCloseButton && (
            <button 
              onClick={dismissSocialProof}
              className="absolute -top-2 -right-2 h-6 w-6 bg-slate-800 border border-slate-700 text-slate-400 rounded-full flex items-center justify-center hover:text-white hover:bg-slate-700 transition-all pointer-events-auto shadow-lg"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex flex-col pr-4 overflow-hidden">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-0.5">Verified activity</p>
            <p className="text-sm font-bold text-white leading-tight truncate">
              {currentActivity.name}
            </p>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {currentActivity.action} <span className="text-[9px] text-slate-600 ml-1">• {currentActivity.time}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Lead Magnet Modal - Bottom Center Popup Style */}
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[calc(100%-48px)] max-w-lg',
          showLeadMagnet ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        )}
      >
        <div className="relative bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 p-6 sm:p-8 overflow-hidden">
          {/* Decorative Gradient */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
          
          <button 
            onClick={dismissLeadMagnet}
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 shadow-inner">
              <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 animate-bounce" />
            </div>
            
            <div className="text-center sm:text-left space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Get Your Repairs <span className="text-blue-600">Free Inspection?</span>
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Claim your professional system health audit (Valued at ₹499) absolutely FREE for your first visit.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20"
              asChild
              onClick={dismissLeadMagnet}
            >
              <a href="https://wa.me/919583839432?text=Hi, I want to book my FREE system health checkup.">
                Claim My Free Checkup
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button 
               variant="ghost" 
               className="h-12 rounded-xl text-slate-400 font-semibold"
               onClick={dismissLeadMagnet}
            >
              Maybe later
            </Button>
          </div>
          
          <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            ⚡ Offer ends in 24 hours • valid in paradip city area
          </p>
        </div>
      </div>
    </>
  );
}
