'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Rocket,
  Info
} from 'lucide-react';

export default function WelcomeNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('welcome_accepted');
    if (!hasAccepted) {
      // Small delay for entrance effect
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('welcome_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-primary-900/40 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-primary-100">
        {/* Urgent Header */}
        <div className="bg-amber-50 p-8 flex items-center gap-4 border-b border-amber-100">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0 rotate-3">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-900 font-heading tracking-tight uppercase">Important Notice</h2>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Please read carefully</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 bg-primary-50 rounded-full flex items-center justify-center mt-1">
                <CheckCircle2 className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Only proceed if you have received an <strong className="text-primary-900">official shortlist email</strong> from LevelAxis.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 bg-red-50 rounded-full flex items-center justify-center mt-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Choose a schedule you <strong className="text-red-600 uppercase">must attain</strong>. No-shows will be permanently blacklisted from future opportunities.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center mt-1">
                <Rocket className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic">
                Check the very bottom of this page for our <strong className="text-amber-700">Open Positions</strong> to apply or share with qualified friends!
              </p>
            </div>
          </div>

          <button
            onClick={handleAccept}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-200 hover:-translate-y-1 active:translate-y-0"
          >
            I Understand & Agree <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            LevelAxis Talent Acquisition Team
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
