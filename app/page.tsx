'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Clock1, Clock2, Clock3, Clock4, Clock5, Clock6, 
  Clock7, Clock8, Clock9, Clock10, Clock11, Clock12,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Lock 
} from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { TimeSlot } from '@/lib/types';
import { isPastSlotEnd } from '@/lib/utils';

const DynamicClockIcon = ({ time, className }: { time: string, className?: string }) => {
  const hour = parseInt(time.split(':')[0], 10) % 12 || 12;
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">LevelAxis</h1>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-widest">Interview Scheduler</p>
            </div>
          </div>
          <a
            href="/admin"
            className="text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors px-3 py-1.5 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200"
          >
            Admin Login
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Interview Details</h3>
              <p className="text-sm text-blue-700 mt-1">
                Each interview slot is <strong>{config?.slotDurationMinutes || 60} minutes</strong> with a <strong>{config?.breakDurationMinutes || 15}-minute break</strong> between slots.
                Please choose a convenient time from the available options below.
              </p>
            </div>
          </div>
        </div>

        {/* Date Tabs */}
        {dates.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((dateInfo, index) => (
                <button
                  key={dateInfo.date}
                  onClick={() => setSelectedDate(dateInfo.date)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedDate === dateInfo.date
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {dateInfo.displayName}
                  {dateInfo.isToday && (
                    <span className="block text-xs opacity-75 mt-0.5">Today</span>
                  )}
                  {dateInfo.isTomorrow && !dateInfo.isToday && (
                    <span className="block text-xs opacity-75 mt-0.5">Tomorrow</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slots Grid */}
        {currentSlots.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {format(new Date(selectedDate), 'EEEE, MMMM d')}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentSlots.map((slot) => {
                const isUnavailable = slot.isBooked || slot.isPast || slot.isBlocked;
                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isUnavailable}
                    className={`p-4 rounded-lg border-2 font-medium transition-all ${
                      isUnavailable
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {slot.isBooked ? (
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                      ) : slot.isBlocked ? (
                        <Lock className="w-4 h-4 text-gray-400" />
                      ) : (
                        <DynamicClockIcon 
                          time={slot.startTime} 
                          className={`w-4 h-4 ${slot.isPast ? 'text-gray-400' : 'text-primary-500'}`} 
                        />
                      )}
                      <span>{slot.startTime}</span>
                    </div>
                    {isUnavailable && (
                      <div className="mt-2 text-[10px] uppercase tracking-wider font-bold">
                        {slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : 'Unavailable'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No slots available</h3>
            <p className="text-gray-500">No slots available for the selected date.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {slots.filter(s => !s.isBooked && !s.isBlocked && !s.isPast).length}
            </div>
            <div className="text-sm text-gray-500">Available Slots</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-600">
              {slots.filter(s => s.isBooked).length}
            </div>
            <div className="text-sm text-gray-500">Booked Slots</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} LevelAxis. All rights reserved.</p>
          <p className="mt-1">Need help? Contact us at shamrat@levelaxishq.com</p>
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
