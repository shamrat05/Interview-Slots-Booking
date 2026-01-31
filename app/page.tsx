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
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-heading">LevelAxis</h1>
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
        
        {/* World Class Hero Banner */}
        <section className="relative mb-10 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-64 h-64 bg-primary-200 rounded-full blur-[100px] opacity-15 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-64 h-64 bg-indigo-200 rounded-full blur-[100px] opacity-15 pointer-events-none"></div>
          
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-950/50 flex flex-col md:flex-row items-center gap-6 md:gap-8 border border-white/10">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-5 h-5 bg-green-400/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">System Ready • Asia/Dhaka</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-white font-heading tracking-tight mb-3 leading-tight">
                Book Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Interview</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-lg mb-3">
                <span className="text-slate-200 font-semibold">{config?.slotDurationMinutes || 60} mins</span> technical interview. Select your preferred date & time below.
              </p>
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-2.5 mb-4 max-w-lg shadow-md">
                <div className="flex gap-2 items-start">
                  <span className="text-lg mt-0 shrink-0">⚠️</span>
                  <div className="min-w-0">
                    <p className="text-red-100 text-[11px] sm:text-xs font-bold leading-tight">No-show Policy</p>
                    <p className="text-red-100 text-[10px] sm:text-xs opacity-90 leading-snug">Failing to join will result in blacklist status.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 group hover:bg-white/10 transition-colors">
                  <div className="w-6 h-6 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-3 h-3 text-primary-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Duration</p>
                    <p className="text-[10px] text-white font-bold">{config?.slotDurationMinutes || 60} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 group hover:bg-white/10 transition-colors">
                  <div className="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Free Slots</p>
                    <p className="text-[10px] text-white font-bold">{slots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 group hover:bg-white/10 transition-colors">
                  <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Secure</p>
                    <p className="text-[10px] text-white font-bold">SSL Protected</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:flex w-full sm:w-auto shrink-0 flex-col items-center bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg shadow-slate-950/50">
              <div className="w-12 h-12 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 mb-2">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-bold text-sm mb-1">Get Started</p>
              <p className="text-slate-400 text-[11px] font-medium mb-3 text-center">Easy 3-step booking process</p>
              <div className="text-[10px] text-primary-300 font-bold uppercase tracking-widest">Asia/Dhaka</div>
            </div>
          </div>
        </section>

        {/* Date Selection - Sophisticated Chips */}
        {dates.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl border border-primary-500/30 w-fit">
              <div className="w-8 h-8 bg-primary-500/40 rounded-lg flex items-center justify-center border border-primary-400/60">
                <Calendar className="w-4 h-4 text-primary-200" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">Select Date</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3 ml-0.5">Choose a date that works best for you. All times shown in Bangladesh Standard Time.</p>
            
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
              {dates.map((dateInfo) => (
                <button
                  key={dateInfo.date}
                  onClick={() => setSelectedDate(dateInfo.date)}
                  className={`flex-shrink-0 px-4 sm:px-5 py-3 rounded-lg sm:rounded-xl transition-all duration-300 border-2 flex flex-col items-center min-w-[110px] relative group text-center ${
                    selectedDate === dateInfo.date
                      ? 'bg-slate-700 border-primary-500 text-white shadow-xl shadow-primary-500/20'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {selectedDate === dateInfo.date && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary-500 rounded-full"></div>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${selectedDate === dateInfo.date ? 'text-primary-400' : 'text-slate-500'}`}>
                    {dateInfo.isToday ? 'Today' : dateInfo.isTomorrow ? 'Tomorrow' : format(new Date(dateInfo.date), 'EEEE')}
                  </span>
                  <span className="text-lg font-bold tracking-tight">{dateInfo.displayName}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Time Slots Grid - Elevated Cards */}
        <section>
          {currentSlots.length > 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 h-10 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-slate-100">
                    <Clock className="w-4 h-4 sm:w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Available Times</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{format(new Date(selectedDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">{currentSlots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length} Free</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 ml-0.5 bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-700 font-medium">💡 Click on any time slot to reserve. You'll receive instant confirmation with the video meeting link!</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {currentSlots.map((slot) => {
                  const isUnavailable = slot.isBooked || slot.isPast || slot.isBlocked;
                  
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isUnavailable}
                      className={`group relative p-3 sm:p-4 rounded-lg sm:rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[140px] ${
                        isUnavailable
                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60'
                          : 'bg-white border-slate-200 text-slate-900 hover:border-primary-500 hover:ring-8 hover:ring-primary-50 hover:shadow-2xl hover:-translate-y-2'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3 relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all duration-500 ${
                          isUnavailable ? 'bg-slate-100 text-slate-300' : 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white'
                        }`}>
                          <DynamicClockIcon time={slot.startTime} className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter">
                          {slot.startTime}
                        </span>
                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border transition-all duration-500 ${
                          slot.isBooked ? 'bg-red-50 text-red-400 border-red-100' : 
                          slot.isPast ? 'bg-slate-100 text-slate-400 border-slate-200' : 
                          slot.isBlocked ? 'bg-amber-50 text-amber-400 border-amber-100' : 
                          'bg-primary-50 text-primary-600 border-primary-100 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600'
                        }`}>
                          {slot.isBooked ? 'Reserved' : slot.isPast ? 'Expired' : slot.isBlocked ? 'Unavailable' : 'Book Now'}
                        </div>
                      </div>

                      {!isUnavailable && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-10 sm:p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Calendar className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">No Slots Available</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">Select another date from above.</p>
            </div>
          )}
        </section>

        {/* Interview Tips Section */}
        <section className="mt-12 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl border border-primary-200 p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-sm font-bold">💡</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2">Interview Tips</h3>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5">
                <li>✓ Join 5 minutes early via the meeting link you'll receive</li>
                <li>✓ Use a quiet place with good internet connection</li>
                <li>✓ Have your resume and ID ready</li>
                <li>✓ Check your camera and microphone before starting</li>
              </ul>
            </div>
          </div>
        </section>
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 sm:w-14 h-14 bg-green-50 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-all duration-500 border border-green-100 relative z-10">
              <CheckCircle2 className="w-6 h-6 sm:w-7 h-7 text-green-500" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                {slots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Slots</div>
            </div>
          </div>
          
          <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 sm:w-14 h-14 bg-primary-50 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:-rotate-6 transition-all duration-500 border border-primary-100 relative z-10">
              <Users className="w-6 h-6 sm:w-7 h-7 text-primary-500" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                {slots.filter(s => s.isBooked).length}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booked</div>
            </div>
          </div>
        </section>

        {/* Security & Assurance Footer Info */}
        <section className="mt-12 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-black text-primary-600 mb-1">🔒</div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">SSL Encrypted</p>
            </div>
            <div>
              <div className="text-xl font-black text-primary-600 mb-1">✓</div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Instant Confirmation</p>
            </div>
            <div>
              <div className="text-xl font-black text-primary-600 mb-1">📧</div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Email Reminder</p>
            </div>
            <div>
              <div className="text-xl font-black text-primary-600 mb-1">🎥</div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Video Interview</p>
            </div>
          </div>
        </section>

        {/* Available Jobs - Injected Section */}
        <div className="mt-12" id="job-board-section">
          <JobBoard />
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="bg-slate-900 pt-12 sm:pt-16 pb-6 mt-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Calendar className="w-3 h-3 text-white" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight font-heading">LevelAxis</h2>
              </div>
              <p className="text-slate-400 text-xs max-w-xs leading-relaxed">World-class recruitment technology. Fast, fair, and transparent interview scheduling.</p>
            </div>
            <div className="text-sm">
              <p className="text-slate-500 text-xs mb-2 font-semibold">Questions?</p>
              <a href="mailto:shamrat@levelaxishq.com" className="text-white font-bold hover:text-primary-400 transition-colors text-xs">
                shamrat@levelaxishq.com
              </a>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-500">
            <p>© {new Date().getFullYear()} LevelAxis. All rights reserved. | Asia/Dhaka Timezone</p>
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