
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Trophy, Sparkles } from 'lucide-react';

const steps = [
  {
    title: "Welcome to your Dashboard",
    content: "We've built this command center to help you manage every detail of your special day with ease. Let's take a quick tour!",
    target: "header",
    position: "bottom"
  },
  {
    title: "Dashboard Overview",
    content: "This is your home base. From here, you can see recent activities and quick stats at a glance.",
    target: "sidebar-dashboard",
    position: "right"
  },
  {
    title: "Analytics & Progress",
    content: "Get a bird's eye view of your wedding progress, RSVP statuses, and gift contributions here.",
    target: "sidebar-analytics",
    position: "right"
  },
  {
    title: "Guest Management",
    content: "Keep track of your RSVPs, group guests (Family, Friends, VIPs), and manage their details all in one place.",
    target: "sidebar-guests",
    position: "right"
  },
  {
    title: "Check-In Scanner",
    content: "On the big day, use this tool to scan guest QR codes and manage their arrival in real-time.",
    target: "sidebar-checkin",
    position: "right"
  },
  {
    title: "Seating Chart",
    content: "Design your floor plan and assign guests to tables using our interactive drag-and-drop tool.",
    target: "sidebar-seating",
    position: "right"
  },
  {
    title: "Digital Invitations",
    content: "Design beautiful email invitations and send them directly to your guests with personalized RSVP codes.",
    target: "sidebar-design",
    position: "right"
  },
  {
    title: "Photo Gallery",
    content: "Manage your wedding photos and allow guests to upload their own highlights from the public site.",
    target: "sidebar-gallery",
    position: "right"
  },
  {
    title: "Website Content",
    content: "Easily update the text and stories on your public wedding website using our intuitive CMS tools.",
    target: "sidebar-content",
    position: "right"
  },
  {
    title: "Wedding Schedule",
    content: "Organize the timeline of events, from the morning prep to the final dance. This populates your public programme.",
    target: "sidebar-schedule",
    position: "right"
  },
  {
    title: "Song Requests",
    content: "See what your guests are dying to hear on the dance floor! Manage their Spotify-powered requests here.",
    target: "sidebar-songs",
    position: "right"
  },
  {
    title: "Guestbook Well Wishes",
    content: "Read and moderate the beautiful messages your guests leave for you in the digital guestbook.",
    target: "sidebar-guestbook",
    position: "right"
  },
  {
    title: "Gift Registry",
    content: "Manage your gift ideas and cash funds. Monitor what's been reserved in real-time.",
    target: "sidebar-gifts",
    position: "right"
  },
  {
    title: "Email Templates",
    content: "Customize the automated emails for RSVPs, thank-yous, and special announcements.",
    target: "sidebar-emails",
    position: "right"
  },
  {
    title: "System Settings",
    content: "Manage security, 2FA, and general application preferences to keep your information safe.",
    target: "sidebar-settings",
    position: "right"
  },
  {
    title: "Need help again?",
    content: "You can restart this tour at any time by clicking this icon in the header. Congratulations on your planning journey!",
    target: "header-restart",
    position: "bottom"
  }
];

export default function AdminTutorial({ onComplete, isRestarted = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const isCompleted = localStorage.getItem('admin-tutorial-complete');
    if (!isCompleted || isRestarted) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRestarted]);

  useEffect(() => {
    if (isVisible) {
      // First, try to scroll the element into view instantly
      const step = steps[currentStep];
      const el = document.getElementById(step.target);
      if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
      }

      // Then update coordinates after a small frame delay to ensure scroll finished (even if synchronous)
      const timer = requestAnimationFrame(() => {
        updateCoords();
      });
      
      window.addEventListener('resize', updateCoords);
      return () => {
          window.removeEventListener('resize', updateCoords);
          cancelAnimationFrame(timer);
      };
    }
  }, [isVisible, currentStep]);

  const updateCoords = () => {
    const step = steps[currentStep];
    const el = document.getElementById(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only set coords if they are valid numbers
      if (!isNaN(rect.top) && !isNaN(rect.left)) {
        setCoords({
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
        });
      }
    } else {
      setCoords(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('admin-tutorial-complete', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  const getBoxStyle = () => {
    if (!coords) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 24;
    let top = coords.top;
    let left = coords.left;

    if (step.position === 'right') {
      left = coords.right + padding;
      top = coords.top + (coords.height / 2);
      return { top, left, transform: 'translateY(-50%)' };
    }
    
    if (step.position === 'bottom') {
      top = coords.bottom + padding;
      left = coords.left + (coords.width / 2);
      
      // Keep within horizontal bounds
      const viewportWidth = window.innerWidth;
      const boxWidth = 384; // max-w-sm
      if (left + (boxWidth/2) > viewportWidth - 20) {
          left = viewportWidth - (boxWidth/2) - 20;
      }
      if (left - (boxWidth/2) < 20) {
          left = (boxWidth/2) + 20;
      }

      return { top, left, transform: 'translateX(-50%)' };
    }

    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop with spotlight effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={handleComplete}
        style={{
            clipPath: coords ? `polygon(0% 0%, 0% 100%, ${coords.left - 4}px 100%, ${coords.left - 4}px ${coords.top - 4}px, ${coords.right + 4}px ${coords.top - 4}px, ${coords.right + 4}px ${coords.bottom + 4}px, ${coords.left - 4}px ${coords.bottom + 4}px, ${coords.left - 4}px 100%, 100% 100%, 100% 0%)` : 'none'
        }}
      />

      <motion.div
        layout
        ref={boxRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={getBoxStyle()}
        className="absolute w-[calc(100%-48px)] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border-2 border-[#A67B5B]/30"
      >
        <div className="h-1.5 w-full bg-stone-100">
          <motion.div 
            className="h-full bg-[#A67B5B]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#A67B5B]/10 flex items-center justify-center">
                {currentStep === steps.length - 1 ? (
                    <Trophy className="w-5 h-5 text-[#A67B5B]" />
                ) : (
                    <span className="text-[#A67B5B] font-bold text-base">{currentStep + 1}</span>
                )}
                </div>
                {currentStep === 0 && (
                    <span className="bg-[#A67B5B]/10 text-[#A67B5B] text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">New Feature</span>
                )}
            </div>
            <button 
              onClick={handleComplete}
              className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-stone-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[100px]"
            >
              <h3 className="text-xl font-semibold text-[#4A3F35] mb-2 flex items-center gap-2">
                {step.title}
                {currentStep === 0 && <Sparkles className="w-4 h-4 text-[#A67B5B]" />}
              </h3>
              <p className="text-[#8B7B6B] text-sm leading-relaxed">
                {step.content}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
            <div className="flex gap-1.5">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`p-1.5 rounded-lg transition-all ${
                  currentStep === 0 
                    ? 'text-stone-300' 
                    : 'text-[#8B7B6B] hover:bg-stone-50'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-[#A67B5B] text-white px-4 py-2 rounded-lg hover:bg-[#8B5E3C] transition-all shadow-md shadow-[#A67B5B]/20 font-medium text-sm"
              >
                {currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={handleComplete}
              className="text-xs text-stone-400 hover:text-[#A67B5B] transition-colors font-medium px-2"
            >
              Skip Tour
            </button>
          </div>
        </div>
        
        {/* Triangle pointer */}
        {coords && step.position === 'right' && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-[8px] border-y-transparent border-r-[8px] border-r-white" />
        )}
        {coords && step.position === 'bottom' && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-x-[8px] border-x-transparent border-b-[8px] border-b-white" />
        )}
      </motion.div>
    </div>
  );
}
