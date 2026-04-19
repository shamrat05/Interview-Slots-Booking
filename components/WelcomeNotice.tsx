'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight, Info } from 'lucide-react';

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

        {/* Header */}
        <div className="bg-amber-50/50 p-10 flex items-center gap-6 border-b border-amber-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
          <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-200 shrink-0 rotate-3 relative z-10">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-amber-900 tracking-tight font-heading uppercase leading-none mb-1">Before You Book</h2>
            <p className="text-xs text-amber-700">Please read carefully</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="flex gap-5">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mt-0.5 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-primary-600" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm">For shortlisted candidates only</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Please proceed only if you have received an <span className="text-primary-600 font-semibold">official confirmation email</span> from our team.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mt-0.5 border border-slate-100">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm">Only book if you can attend</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Missing your scheduled interview without notice will result in being removed from future opportunities at LevelAxis.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mt-0.5 border border-slate-100">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold text-sm">Exploring open roles?</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Scroll to the bottom of the page to view current job openings and apply directly.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleAccept}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-primary-600 transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 hover:shadow-primary-500/20 active:scale-[0.98] group"
            >
              Understood, Continue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
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
