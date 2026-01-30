'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ExternalLink,
  Sparkles,
  Users,
  ChevronDown,
  Share2,
  Copy,
  CheckCircle2,
  Trophy,
  Briefcase
} from 'lucide-react';

interface JobPost {
  id: string;
  title: string;
  description: string;
  salary: string;
  applyLink: string;
  contactEmails: string[];
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (job: JobPost) => {
    const url = `${window.location.origin}?job=${job.id}`;
    const shareData = {
      title: `Career at LevelAxis | ${job.title}`,
      text: `Check out this opening for ${job.title} at LevelAxis!`,
      url: url,
    };

    // Prioritize Native Sharing (Android/iOS)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return; // Success
      } catch (err) {
        // If user cancelled, don't fallback to copy
        if ((err as Error).name === 'AbortError') return;
        console.error('Share failed:', err);
      }
    }

    // Fallback: Copy to clipboard (Desktop or non-supported browsers)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (copyErr) {
      console.error('Failed to copy:', copyErr);
    }
  };

  if (isLoading || jobs.length === 0) return null;

  return (
    <div className="mt-16 space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 rotate-3">
            <RocketIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 font-heading tracking-tight">Open Positions</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Join our mission</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-4 py-1.5 bg-white text-primary-700 text-[10px] font-black rounded-xl border-2 border-primary-50 uppercase tracking-widest shadow-sm">
            {jobs.length} Role{jobs.length > 1 ? 's' : ''} Available
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-2">
        {jobs.map((job) => {
          const isExpanded = expandedJobId === job.id;
          
          return (
            <div 
              key={job.id} 
              id={`job-${job.id}`}
              className={`group bg-white rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${
                isExpanded 
                  ? 'border-primary-500 shadow-[0_30px_70px_rgba(2,132,199,0.15)] ring-8 ring-primary-50/50' 
                  : 'border-gray-100 hover:border-primary-200 hover:shadow-2xl shadow-sm'
              }`}
            >
              {/* Header / Clickable Area */}
              <button
                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-4 outline-none"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 transition-all duration-700 ${
                    isExpanded ? 'bg-primary-600 text-white rotate-[15deg] scale-110 shadow-xl shadow-primary-200' : 'bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500'
                  }`}>
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-black text-xl md:text-2xl transition-colors duration-300 tracking-tight font-heading ${isExpanded ? 'text-primary-900' : 'text-gray-900 group-hover:text-primary-600'}`}>
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                        <Users className="w-3 h-3 text-primary-500" /> Dhaka Office
                      </span>
                      <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-2 py-1 bg-primary-50 rounded-lg">
                        {job.salary}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 ${
                  isExpanded ? 'bg-primary-100 text-primary-600 rotate-180' : 'bg-gray-50 text-gray-300 group-hover:bg-primary-50 group-hover:text-primary-400'
                }`}>
                  <ChevronDown className="w-6 h-6" />
                </div>
              </button>

              {/* Expandable Content */}
              <div 
                className={`transition-all duration-700 ease-in-out ${
                  isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 md:px-10 pb-10 pt-2 space-y-10">
                  {/* Markdown Content */}
                  <div className="prose prose-slate max-w-none font-sans text-gray-600 leading-[1.8] job-markdown-content border-t border-gray-50 pt-8">
                    <ReactMarkdown>{job.description}</ReactMarkdown>
                  </div>

                  {/* Action Bar - Highly Persuasive */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-600 blur-3xl opacity-[0.03] rounded-full" />
                    <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-[2rem] p-8 border border-gray-100 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest">
                          <Trophy className="w-4 h-4" />
                          Career Growth Awaits
                        </div>
                        <p className="text-gray-500 font-medium">Ready to bridge the gap between strategy and execution?</p>
                        <p className="text-xs text-gray-400 italic font-medium">"Apply yourself or refer someone capable who'd be a great fit!"</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <a 
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(2,132,199,0.3)] hover:-translate-y-1 active:translate-y-0"
                        >
                          Apply Now <ExternalLink className="w-5 h-5" />
                        </a>
                        
                        <button 
                          onClick={() => handleShare(job)}
                          className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                            copiedId === job.id 
                              ? 'bg-green-50 border-green-200 text-green-600' 
                              : 'bg-white border-gray-100 text-gray-600 hover:border-primary-200 hover:text-primary-600 shadow-sm'
                          }`}
                        >
                          {copiedId === job.id ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 animate-in zoom-in" />
                              Link Copied
                            </>
                          ) : (
                            <>
                              <Share2 className="w-5 h-5" />
                              Share Role
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .job-markdown-content strong {
          color: #0284c7;
          font-weight: 900;
          background: rgba(14, 165, 233, 0.05);
          padding: 0 4px;
          border-radius: 4px;
        }
        .job-markdown-content blockquote {
          background: #f8fafc;
          border-left: 4px solid #0ea5e9;
          padding: 1.5rem 2rem;
          border-radius: 0 1.5rem 1.5rem 0;
          font-style: normal;
          font-weight: 500;
          color: #334155;
          margin: 2rem 0;
        }
        .job-markdown-content blockquote p {
          margin: 0 !important;
        }
        .job-markdown-content ul {
          list-style-type: none;
          padding-left: 0;
          margin: 1.5rem 0;
        }
        .job-markdown-content li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }
        .job-markdown-content li::before {
          content: "";
          position: absolute;
          left: 0.5rem;
          top: 0.6rem;
          width: 6px;
          height: 6px;
          background: #0ea5e9;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
        }
        .job-markdown-content h1, .job-markdown-content h2, .job-markdown-content h3 {
          font-family: var(--font-outfit);
          color: #0f172a;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" />
      <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" />
    </svg>
  );
}