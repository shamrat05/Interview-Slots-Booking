'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, AlertCircle, Lock, ShieldCheck, Zap, Mail, Video } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import JobBoard from '@/components/JobBoard';
import WelcomeNotice from '@/components/WelcomeNotice';
import { TimeSlot } from '@/lib/types';

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
        if (data.data.config) setConfig(data.data.config);
        if (allSlots.length > 0) setSelectedDate(allSlots[0].date);
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
    }));
  };

  const getSlotsForSelectedDate = () => slots.filter(s => s.date === selectedDate);

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
    'author': { '@type': 'Organization', 'name': 'LevelAxis' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading available slots...</p>
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
            Try Again
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

      {/* Header */}
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
            Admin
          </a>
        </div>
      </header>

      <main className="pt-28 pb-16 max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <section className="mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-primary-700">
                {slots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length} slots available
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Schedule Your <span className="text-primary-600">Interview</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Pick a time that works for you. This is a <span className="font-semibold">{config?.slotDurationMinutes || 60}-minute</span> interview conducted over video call.
            </p>
          </div>
        </section>

        {/* Date & Time Selection */}
        <div className="mb-12">
          {/* Date Picker */}
          {dates.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Select a Date</h3>
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
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">
                Available Times — {selectedDate ? format(new Date(selectedDate), 'EEEE, MMM d') : ''}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {currentSlots.map((slot) => {
                  const isUnavailable = slot.isBooked || slot.isPast || slot.isBlocked;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isUnavailable}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-center font-semibold flex flex-col items-center justify-center min-h-[90px] ${
                        isUnavailable
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                          : 'border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50 hover:shadow-md'
                      }`}
                    >
                      <span className="text-base">{slot.startTime}</span>
                      <span className={`text-[10px] font-medium uppercase tracking-wide mt-1 px-2 py-0.5 rounded ${
                        slot.isBooked ? 'bg-red-100 text-red-700' :
                        slot.isPast ? 'bg-slate-100 text-slate-600' :
                        slot.isBlocked ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {slot.isBooked ? 'Booked' : slot.isPast ? 'Past' : slot.isBlocked ? 'Unavailable' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600 font-medium">
                {dates.length === 0 ? 'No slots available right now. Please check back later.' : 'No times available for this date.'}
              </p>
              {dates.length > 0 && <p className="text-sm text-slate-500 mt-1">Try selecting a different date above.</p>}
            </div>
          )}
        </div>

        {/* Job Board */}
        <section className="mb-12">
          <div id="job-board-section" className="w-full">
            <JobBoard />
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, label: 'SSL Encrypted', sub: 'Your data is safe', color: 'text-primary-600', bg: 'bg-primary-50' },
            { icon: Zap,         label: 'Instant Confirm', sub: 'Booking confirmed live', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Mail,        label: 'Email Details', sub: 'Sent right after booking', color: 'text-sky-600', bg: 'bg-sky-50' },
            { icon: Video,       label: 'Video Interview', sub: 'Google Meet link provided', color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(({ icon: Icon, label, sub, color, bg }) => (
            <div key={label} className="bg-white rounded-lg border border-slate-200 p-4 text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xs font-semibold text-slate-900">{label}</p>
              <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
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
              <p className="text-sm text-slate-600 leading-relaxed">Recruitment platform built for transparency and efficiency.</p>
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
            <p>© {new Date().getFullYear()} LevelAxis. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
    </div>
  );
}
