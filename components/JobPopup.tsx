'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { 
  X, 
  Briefcase, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Info,
  Users,
  Trophy,
  ArrowRight
} from 'lucide-react';

interface JobPost {
  id: string;
  title: string;
  description: string;
  salary: string;
  applyLink: string;
  contactEmails: string[];
}

function JobPopupContent() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [isOpen, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchJobs();
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success && data.jobs.length > 0) {
        setJobs(data.jobs);
        
        const lastSeen = localStorage.getItem('last_job_view');
        const now = Date.now();
        const hasJobParam = searchParams.has('job');
        
        // Show if not seen in 24 hours and NOT deep-linking to a specific job
        if (!hasJobParam && (!lastSeen || (now - parseInt(lastSeen)) > (24 * 60 * 60 * 1000))) {
          setTimeout(() => {
            setIsVisible(true);
            setIsExpanded(true);
            
            // Auto close after 4 seconds
            autoCloseTimer.current = setTimeout(() => {
              handleMinimize();
            }, 4000);
          }, 1500);
        } else {
          setIsVisible(true);
          setIsMinimized(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMinimize = () => {
    setIsExpanded(false);
    setIsMinimized(true);
    localStorage.setItem('last_job_view', Date.now().toString());
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setIsMinimized(false);
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  };

  if (!isVisible || jobs.length === 0) return null;

  const job = jobs[activeJobIndex];

  return (
    <>
      {/* 1. Full Popup Modal (Expanded State) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-vercel-black/20 backdrop-blur-md transition-all duration-500">
          <div 
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in border border-primary-100"
            onMouseEnter={() => { if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current); }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 pt-12 pb-8 px-8 flex items-center overflow-hidden min-h-[160px]">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-[-30%] left-[-10%] w-48 h-48 bg-primary-400 rounded-full blur-2xl" />
              </div>

              <button 
                onClick={handleMinimize}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-5 relative z-10 w-full">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-inner group shrink-0">
                  <Trophy className="w-7 h-7 md:w-8 md:h-8 text-white transition-transform group-hover:scale-110" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-2 border border-white/10">
                    <Sparkles className="w-3 h-3 animate-pulse" /> Career Growth
                  </div>
                  <h2 className="text-xl md:text-3xl font-extrabold text-white leading-tight font-heading tracking-tight truncate md:whitespace-normal">{job.title}</h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="prose prose-slate max-w-none font-sans text-gray-600 leading-relaxed job-markdown-content">
                <ReactMarkdown>{job.description}</ReactMarkdown>
              </div>

              <div className="bg-primary-50/50 rounded-[1.5rem] p-6 md:p-8 border border-primary-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-[10px] font-bold text-primary-400 uppercase tracking-[0.2em] mb-1.5">Starting Salary</div>
                  <div className="text-2xl md:text-3xl font-black text-primary-900 font-heading">{job.salary}</div>
                </div>
                <a 
                  href={job.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-200 shadow-primary-300 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Join the Team <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              <div className="pt-2 text-center border-t border-gray-100 pt-8">
                <p className="text-base text-gray-500 font-medium mb-6">
                  "Know someone perfect for this? Refer them and help them level up!"
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg"><Info className="w-4 h-4 text-primary-500" /> Full Time</span>
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg"><Users className="w-4 h-4 text-primary-500" /> Dhaka Office</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Minimized Floating Badge - Highly Persuasive & Stylish */}
      {isMinimized && !isOpen && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[90] flex items-center justify-end">
          {/* Subtle label hint that appears on hover near the button */}
          <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-2xl shadow-xl border border-primary-50 text-[11px] font-bold text-primary-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-x-2 group-hover:translate-x-0">
            We're hiring! 🚀
          </div>
          
          <button 
            onClick={handleExpand}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white border-2 border-primary-500 rounded-2xl shadow-[0_20px_50px_rgba(2,132,199,0.2)] hover:shadow-[0_20px_60px_rgba(2,132,199,0.4)] hover:scale-110 transition-all duration-500 ease-out active:scale-95"
          >
            {/* Shimmering background effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/0 via-primary-500/10 to-primary-500/0 rounded-2xl group-hover:animate-shimmer overflow-hidden" />
            
            <div className="relative">
              <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-primary-600 group-hover:rotate-12 transition-transform duration-300" />
              {/* Pulsing notification dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm group-hover:scale-125 transition-transform" />
            </div>

            {/* "Join Us" tooltip that pops up on button hover */}
            <div className="absolute bottom-full mb-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 whitespace-nowrap shadow-xl">
              Career Openings
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </button>
        </div>
      )}

      <style jsx global>{`
        .job-markdown-content strong {
          color: #0c4a6e;
          font-weight: 800;
        }
        .job-markdown-content h1, .job-markdown-content h2, .job-markdown-content h3 {
          font-family: var(--font-outfit);
          color: #0369a1;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @keyframes scale-in {
          from { transform: scale(0.9) translateY(30px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-scale-in { animation: scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shimmer { 
          animation: shimmer 2s infinite;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          width: 50%;
          height: 100%;
        }
      `}</style>
    </>
  );
}

export default function JobPopup() {
  return (
    <Suspense fallback={null}>
      <JobPopupContent />
    </Suspense>
  );
}