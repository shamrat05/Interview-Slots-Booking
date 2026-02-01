'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Clock1, Clock2, Clock3, Clock4, Clock5, Clock6, 
  Clock7, Clock8, Clock9, Clock10, Clock11, Clock12,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Lock,
  Rocket,
  CheckCircle2,
  Briefcase,
  Users,
  Sparkles
} from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import JobBoard from '@/components/JobBoard';
import WelcomeNotice from '@/components/WelcomeNotice';
import { TimeSlot } from '@/lib/types';
import { isPastSlotEnd } from '@/lib/utils';

const DynamicClockIcon = ({ time, className }: { time: string, className?: string }) => {
  const parts = time.split(':');
  let hour = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  // Round to nearest hour for the icon
  if (minutes >= 30) hour += 1;
  
  hour = hour % 12 || 12;
  
  const icons: Record<number, any> = {
    1: Clock1, 2: Clock2, 3: Clock3, 4: Clock4, 5: Clock5, 6: Clock6,
    7: Clock7, 8: Clock8, 9: Clock9, 10: Clock10, 11: Clock11, 12: Clock12
  };
  const Icon = icons[hour] || Clock;
  return <Icon className={className} />;
};

export default function Home() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/slots');
      const data = await response.json();

      if (data.success) {
        const allSlots = data.data.slots;
        setSlots(allSlots);
        
        if (data.data.config) {
          setConfig(data.data.config);
        }
        
        if (allSlots.length > 0) {
          const firstDate = allSlots[0].date;
          setSelectedDate(firstDate);
        }
      } else {
        setError(data.error || 'Failed to load slots');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const getDatesForDisplay = () => {
    const dates = [...new Set(slots.map(s => s.date))];
    const bdNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const todayStr = format(bdNow, 'yyyy-MM-dd');
    const tomorrowStr = format(new Date(bdNow.getTime() + 86400000), 'yyyy-MM-dd');

    return dates.map(date => ({
      date,
      displayName: format(new Date(date), 'MMM d'),
      isToday: date === todayStr,
      isTomorrow: date === tomorrowStr,
      dayName: format(new Date(date), 'EEEE')
    }));
  };

  const getSlotsForSelectedDate = () => {
    return slots.filter(s => s.date === selectedDate);
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isBooked || slot.isPast || slot.isBlocked) return;
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookingComplete = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    fetchSlots();
  };

  const dates = getDatesForDisplay();
  const currentSlots = getSlotsForSelectedDate();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'LevelAxis Interview Scheduler',
    'url': 'https://interview-slots-booking.vercel.app/',
    'description': 'Professional interview scheduling system for LevelAxis recruitment.',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'author': {
      '@type': 'Organization',
      'name': 'LevelAxis'
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing scheduler...</p>
        </div>
      </div>
    );
  }

  if (error && slots.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-6">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button
            onClick={fetchSlots}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-[0.98]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WelcomeNotice />
      
      {/* Refined Premium Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900 uppercase font-heading">LevelAxis</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Scheduler</p>
              </div>
            </div>
          </div>
          
          <a
            href="/admin"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary-600 transition-all px-5 py-2.5 bg-slate-50 hover:bg-white rounded-full border border-slate-200 hover:border-primary-200 hover:shadow-sm uppercase tracking-widest"
          >
            <Lock className="w-3 h-3" />
            Admin Panel
          </a>
        </div>
      </header>

      {/* Main Content with Top Padding for Fixed Header */}
      <main className="pt-28 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Step Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">Select Date</span>
          </div>
          <div className="w-8 h-0.5 bg-primary-300"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-xs sm:text-sm font-semibold text-slate-500">Pick Time</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-xs sm:text-sm font-semibold text-slate-500">Confirm</span>
          </div>
        </div>
        
        {/* Clean Hero Section */}
        <section className="mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-primary-700">Available Now</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Schedule Your <span className="text-primary-600">Interview</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 mb-6 leading-relaxed">
              Select a time that works best for you. This is a <span className="font-semibold">{config?.slotDurationMinutes || 60}-minute</span> technical interview conducted over video.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-primary-600">
                  {slots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Open Slots</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-slate-900">
                  {dates.length}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Available Days</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-bold text-slate-900">📅</div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Instant Confirm</div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
              <div className="flex gap-3">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 mb-0.5">No-show Policy</p>
                  <p className="text-xs text-amber-800">Missing your interview will result in blacklist status on your account.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Guidelines */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Before You JOIN</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-700">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Test Your Setup</p>
                    <p className="text-xs text-slate-500">Check camera, mic, and internet</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-700">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Pick a Quiet Space</p>
                    <p className="text-xs text-slate-500">Professional environment matters</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-700">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Prepare Your Materials</p>
                    <p className="text-xs text-slate-500">Have your resume and ID ready</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-700">4</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">Join Early</p>
                    <p className="text-xs text-slate-500">1 minute before your time</p>
                  </div>
                </li>
              </ul>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">Only book a slot from the options below if you can attend.</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1"> Do not book a time you cannot commit to. Failure to attend the interview will result in being blacklisted from future opportunities. </p>
              </div>
            </div>
          </div>

          {/* Middle Column: Date & Time Selection */}
          <div className="lg:col-span-2">
            {/* Date Picker */}
            {dates.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  Select Date
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {dates.map((dateInfo) => (
                    <button
                      key={dateInfo.date}
                      onClick={() => setSelectedDate(dateInfo.date)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                        selectedDate === dateInfo.date
                          ? 'border-primary-600 bg-primary-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        {dateInfo.isToday ? 'Today' : dateInfo.isTomorrow ? 'Tomorrow' : format(new Date(dateInfo.date), 'EEE')}
                      </div>
                      <div className={`text-sm font-bold ${selectedDate === dateInfo.date ? 'text-primary-700' : 'text-slate-900'}`}>
                        {dateInfo.displayName}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots */}
            {currentSlots.length > 0 ? (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  Available Times – {format(new Date(selectedDate), 'MMM d')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {currentSlots.map((slot) => {
                    const isUnavailable = slot.isBooked || slot.isPast || slot.isBlocked;
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        disabled={isUnavailable}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-center font-semibold flex flex-col items-center justify-center min-h-[100px] ${
                          isUnavailable
                            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                            : 'border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50 hover:shadow-md'
                        }`}
                      >
                        <Clock className="w-4 h-4 mb-2" />
                        <span className="text-base">{slot.startTime}</span>
                        <span className={`text-[10px] font-medium uppercase tracking-wide mt-1 px-2 py-0.5 rounded ${
                          slot.isBooked ? 'bg-red-100 text-red-700' :
                          slot.isPast ? 'bg-slate-100 text-slate-600' :
                          slot.isBlocked ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {slot.isBooked ? 'Booked' : slot.isPast ? 'Past' : slot.isBlocked ? 'Blocked' : 'Book'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">
                  {dates.length === 0 ? "Not available, come back later" : "No time slots available"}
                </p>
                {dates.length > 0 && <p className="text-sm text-slate-500">Try selecting a different date</p>}
              </div>
            )}
          </div>
        </div>

        {/* Job Openings Section - Full Width */}
        <section className="mb-12">
          <div id="job-board-section" className="w-full">
            <JobBoard />
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-xs font-semibold text-slate-900">SSL Encrypted</p>
            <p className="text-[11px] text-slate-500 mt-1">Enterprise-grade security</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs font-semibold text-slate-900">Instant Confirm</p>
            <p className="text-[11px] text-slate-500 mt-1">Real-time confirmation</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-2">📧</div>
            <p className="text-xs font-semibold text-slate-900">Email Reminder</p>
            <p className="text-[11px] text-slate-500 mt-1">Never miss your slot</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-2">🎥</div>
            <p className="text-xs font-semibold text-slate-900">Video Meeting</p>
            <p className="text-[11px] text-slate-500 mt-1">Professional interview</p>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">LevelAxis</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">World-class recruitment technology built for transparency and efficiency.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-primary-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a></li>
                <li><a href="/final-interview" className="hover:text-purple-600 transition-colors font-medium text-purple-600/80">Final Round Portal</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Support</h3>
              <p className="text-sm text-slate-600 mb-2">Have questions? We're here to help.</p>
              <a href="mailto:shamrat@levelaxishq.com" className="text-primary-600 font-medium hover:text-primary-700 transition-colors text-sm">
                shamrat@levelaxishq.com
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} LevelAxis. All rights reserved. | Based in Asia/Dhaka Timezone</p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
          onComplete={handleBookingComplete}
        />
      )}

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}