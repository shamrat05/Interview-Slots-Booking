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
  Users
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
        
        // Extract config from data.data
        if (data.data.config) {
          setConfig(data.data.config);
        }
        
        // Find first date that has ANY slots (to keep UI consistent)
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
    // Show all dates that have slots
    const dates = [...new Set(slots.map(s => s.date))];
    
    // Get today's date string in Bangladesh timezone
    const bdNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const todayStr = format(bdNow, 'yyyy-MM-dd');
    const tomorrowStr = format(new Date(bdNow.getTime() + 86400000), 'yyyy-MM-dd');

    return dates.map(date => ({
      date,
      displayName: format(new Date(date), 'EEE, MMM d'),
      isToday: date === todayStr,
      isTomorrow: date === tomorrowStr
    }));
  };

  const getSlotsForSelectedDate = () => {
    // Return all slots for the date, but they will be styled differently if unavailable
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
    fetchSlots(); // Refresh slots to show updated availability
  };

  const dates = getDatesForDisplay();
  const currentSlots = getSlotsForSelectedDate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available slots...</p>
        </div>
      </div>
    );
  }

  if (error && slots.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Slots</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSlots}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white font-sans text-slate-900">
      <WelcomeNotice />
      
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[100] transition-all">
        <div className="max-w-5xl mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-primary-200 rotate-3 group hover:rotate-0 transition-transform">
              <Calendar className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-heading leading-tight uppercase">LevelAxis</h1>
              <p className="text-[10px] md:text-xs font-black text-primary-500 uppercase tracking-[0.2em]">Interview Scheduler</p>
            </div>
          </div>
          
          <a
            href="/admin"
            className="text-[10px] md:text-xs font-black text-slate-400 hover:text-primary-600 transition-all px-4 py-2 hover:bg-primary-50 rounded-xl uppercase tracking-widest border border-transparent hover:border-primary-100"
          >
            Admin Access
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 md:py-16">
        {/* Modern Info Banner - Compact on Mobile */}
        <div className="relative group overflow-hidden bg-primary-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 mb-10 shadow-2xl shadow-primary-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-3xl opacity-20 -mr-32 -mt-32 transition-all group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400 rounded-full blur-2xl opacity-10 -ml-24 -mb-24" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 border border-white/10">
              <Clock className="w-6 h-6 md:w-10 md:h-10 text-white animate-pulse-soft" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-3xl font-black text-white font-heading tracking-tight mb-1 md:mb-3">Schedule Your Interview</h2>
              <p className="text-primary-100 text-[11px] md:text-base leading-relaxed max-w-2xl opacity-90">
                Each slot is <strong>{config?.slotDurationMinutes || 60} min</strong> with a <strong>{config?.breakDurationMinutes || 15}-min</strong> break. 
                Please select a time and ensure your presence.
              </p>
            </div>
          </div>
        </div>

        {/* Date Tabs - Fixed Clipping */}
        {dates.length > 0 && (
          <div className="mb-10 pt-6 px-1">
            <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-6 no-scrollbar -mt-4 pt-4">
              {dates.map((dateInfo) => (
                <button
                  key={dateInfo.date}
                  onClick={() => setSelectedDate(dateInfo.date)}
                  className={`flex-shrink-0 px-6 py-4 rounded-2xl font-black transition-all border-2 flex flex-col items-center min-w-[120px] ${
                    selectedDate === dateInfo.date
                      ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-200 -translate-y-1'
                      : 'bg-white text-slate-500 border-gray-100 hover:border-primary-200 hover:text-primary-600'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] mb-1 opacity-70">
                    {dateInfo.isToday ? 'Today' : dateInfo.isTomorrow ? 'Tomorrow' : format(new Date(dateInfo.date), 'EEEE')}
                  </span>
                  <span className="text-base">{dateInfo.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slots Grid */}
        {currentSlots.length > 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-gray-50 p-8 md:p-12 shadow-sm hover:shadow-xl transition-shadow duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 font-heading tracking-tight uppercase">
                {format(new Date(selectedDate), 'EEEE, MMMM d')}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentSlots.map((slot) => {
                const isUnavailable = slot.isBooked || slot.isPast || slot.isBlocked;
                
                const cardStyles = isUnavailable
                  ? 'bg-gray-50/50 border-gray-100 text-gray-300 cursor-not-allowed opacity-60 grayscale'
                  : 'bg-white border-gray-100 text-slate-900 hover:border-primary-500 hover:ring-4 hover:ring-primary-50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer group active:scale-95';
                
                const iconColor = isUnavailable 
                    ? 'text-gray-200' 
                    : 'text-primary-500 group-hover:scale-110 transition-transform';

                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isUnavailable}
                    className={`p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden ${cardStyles}`}
                  >
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      {!isUnavailable ? (
                        <DynamicClockIcon time={slot.startTime} className={`w-5 h-5 ${iconColor}`} />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-200" />
                      )}
                      <span className="font-black text-lg tracking-tight">
                        {slot.startTime}
                      </span>
                    </div>
                    
                    <div className={`text-[9px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full relative z-10 ${
                      isUnavailable 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-white transition-colors'
                    }`}>
                      {slot.isBooked ? 'Booked' : slot.isPast ? 'Ended' : slot.isBlocked ? 'Locked' : 'Select'}
                    </div>

                    {!isUnavailable && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No slots available</h3>
            <p className="text-slate-400 max-w-xs mx-auto">Please select another date to see available interview timings.</p>
          </div>
        )}

        {/* Real-time Stats */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
                {slots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Openings</div>
            </div>
          </div>
          
          <div className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 font-heading tracking-tight">
                {slots.filter(s => s.isBooked).length}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Interviews</div>
            </div>
          </div>
        </div>

        {/* Available Jobs Section */}
        <JobBoard />
      </main>

      {/* Modern Footer */}
      <footer className="bg-slate-900 py-16 mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">LevelAxis Career Portal v2.0</span>
          </div>
          <p className="text-slate-400 text-sm mb-2 font-medium">© {new Date().getFullYear()} LevelAxis. Engineering tomorrow's impact.</p>
          <p className="text-slate-500 text-xs">Need help? Contact our HR team at <a href="mailto:shamrat@levelaxishq.com" className="text-primary-400 hover:underline">shamrat@levelaxishq.com</a></p>
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
    </div>
  );
}