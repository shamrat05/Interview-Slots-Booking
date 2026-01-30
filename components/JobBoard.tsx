'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function JobBoardContent() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId && jobs.length > 0) {
      const jobExists = jobs.find(j => j.id === jobId);
      if (jobExists) {
        setExpandedJobId(jobId);
        // Direct scroll to the job section
        setTimeout(() => {
          const element = document.getElementById(`job-${jobId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Offset for sticky header
            window.scrollBy(0, -100);
          }
        }, 300);
      }
    }
  }, [searchParams, jobs]);

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

  const handleNativeShare = async (job: JobPost) => {
    const url = `${window.location.origin}?job=${job.id}`;
    const shareData = {
      title: `Career at LevelAxis | ${job.title}`,
      text: `Check out this opening for ${job.title} at LevelAxis!`,
      url: url,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return true;
        console.error('Share failed:', err);
      }
    }
    return false;
  };

  const copyToClipboard = async (jobId: string) => {
    const url = `${window.location.origin}?job=${jobId}`;
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
      setCopiedId(jobId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOptions = [
    { 
      name: 'LinkedIn', 
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
      getUrl: (url: string, title: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    { 
      name: 'Facebook', 
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    { 
      name: 'WhatsApp', 
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.516.903 3.003 1.357 4.506 1.358 5.487 0 9.951-4.469 9.955-9.958 0-2.659-1.036-5.158-2.917-7.04s-4.381-2.919-7.043-2.92c-5.488 0-9.954 4.469-9.957 9.958a9.903 9.903 0 001.448 5.079l-1.02 3.726 3.823-1.003zm11.233-7.303c-.308-.154-1.821-.898-2.103-.999-.283-.102-.49-.153-.695.154-.205.307-.795.999-.974 1.203-.179.205-.359.231-.667.077-.308-.154-1.299-.479-2.474-1.528-.915-.815-1.532-1.822-1.711-2.129-.179-.307-.019-.473.135-.626.139-.138.308-.359.461-.538.154-.18.205-.308.308-.513.102-.205.051-.385-.026-.538-.077-.154-.695-1.673-.951-2.29-.249-.603-.503-.521-.695-.531-.18-.008-.385-.01-.59-.01-.205 0-.538.077-.821.385-.282.308-1.077 1.051-1.077 2.564 0 1.513 1.103 2.974 1.256 3.179.154.205 2.17 3.313 5.257 4.645.733.317 1.306.507 1.751.649.738.234 1.411.201 1.942.122.593-.088 1.821-.744 2.077-1.461.256-.718.256-1.333.179-1.461-.077-.128-.282-.205-.59-.359z"/>
        </svg>
      ),
      getUrl: (url: string, title: string) => `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`
    }
  ];

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
          const isSharing = activeShareId === job.id;
          
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
                        
                        <div className="relative">
                          <button 
                            onClick={async () => {
                              const shared = await handleNativeShare(job);
                              if (!shared) {
                                setActiveShareId(isSharing ? null : job.id);
                              }
                            }}
                            className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                              isSharing 
                                ? 'bg-primary-50 border-primary-200 text-primary-600' 
                                : 'bg-white border-gray-100 text-gray-600 hover:border-primary-200 hover:text-primary-600 shadow-sm'
                            }`}
                          >
                            <Share2 className="w-5 h-5" />
                            Share Role
                          </button>

                          {/* Share Dropdown */}
                          {isSharing && (
                            <div className="absolute bottom-full mb-4 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 min-w-[200px] z-[50] animate-in slide-in-from-bottom-2 duration-300">
                              <div className="flex flex-col gap-1">
                                {shareOptions.map((option) => (
                                  <a
                                    key={option.name}
                                    href={option.getUrl(`${window.location.origin}?job=${job.id}`, `Check out this opening for ${job.title} at LevelAxis!`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                  >
                                    <option.icon className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                                    <span className="text-sm font-bold text-gray-600 group-hover:text-primary-900">{option.name}</span>
                                  </a>
                                ))}
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                  onClick={() => {
                                    copyToClipboard(job.id);
                                    setActiveShareId(null);
                                  }}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group text-left"
                                >
                                  {copiedId === job.id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />}
                                  <span className="text-sm font-bold text-gray-600 group-hover:text-primary-900">
                                    {copiedId === job.id ? 'Copied!' : 'Copy Link'}
                                  </span>
                                </button>
                              </div>
                              <div className="absolute top-full right-8 -translate-y-px border-8 border-transparent border-t-white" />
                            </div>
                          )}
                        </div>
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

export default function JobBoard() {
  return (
    <Suspense fallback={null}>
      <JobBoardContent />
    </Suspense>
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