'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Rocket,
  ShieldAlert,
  Info,
  BadgeCheck
} from 'lucide-react';

export default function WelcomeNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('welcome_accepted');
    if (!hasAccepted) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('welcome_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-700">
      <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden animate-scale-in border border-slate-100">
        {/* Authoritative Header */}
        <div className="bg-amber-50/50 p-10 flex items-center gap-6 border-b border-amber-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
          <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-200 shrink-0 rotate-3 relative z-10">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-amber-900 tracking-tight font-heading uppercase leading-none mb-2">Protocol Notice</h2>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Candidate Guidelines v2.0</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="flex gap-5 group">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mt-0.5 border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                <BadgeCheck className="w-5 h-5 text-primary-600" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm">Shortlisted Candidates Only</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Please proceed only if you have received an <span className="text-primary-600 font-bold underline decoration-primary-200 underline-offset-2">official confirmation email</span> from our Talent Acquisition team.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mt-0.5 border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm">Attendance Commitment</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Chosen slots are <span className="text-red-600 font-bold uppercase tracking-tighter">mandatory</span>. Unexcused absence will result in permanent exclusion from all future LevelAxis opportunities.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mt-0.5 border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                <Rocket className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm">Open Opportunities</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Not shortlisted? Explore our <span className="text-amber-700 font-bold">Open Positions</span> at the bottom of the page to apply or refer top-tier talent.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleAccept}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-primary-600 transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 hover:shadow-primary-500/20 active:scale-[0.98] group"
            >
              Confirm & Enter Portal 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-8">
              LevelAxis Engineering Excellence
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.9) translateY(40px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
