'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Lock, 
  Unlock, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit,
  UserPlus
} from 'lucide-react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { formatTimeToAMPM } from '@/lib/utils';
import ManualBookingModal from './ManualBookingModal';

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  isBooked: boolean;
  isBlocked?: boolean;
  isPast?: boolean;
  booking?: any;
}

interface ScheduleManagerProps {
  adminSecret: string;
}

export default function ScheduleManager({ adminSecret }: ScheduleManagerProps) {
  // Get current time in Bangladesh
  const bdNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const [selectedDate, setSelectedDate] = useState<string>(format(bdNow, 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayBlockedStatus, setDayBlockedStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isProcessingDay, setIsProcessingDay] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSlotForManual, setSelectedSlotForManual] = useState<Slot | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Generate date options (next 14 days) including today
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(bdNow, i);
    return {
      value: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEE, MMM d'),
      full: format(d, 'EEEE, MMMM d, yyyy')
    };
  });

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/slots');
      const data = await response.json();
      if (data.success) {
        const filtered = data.data.slots.filter((s: Slot) => s.date === selectedDate);
        setSlots(filtered);
        setDayBlockedStatus(data.data.dayBlockedStatus || {});
      } else {
        setError(data.error || 'Failed to fetch slots');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayBlock = async () => {
    setIsProcessingDay(true);
    const isCurrentlyBlocked = dayBlockedStatus[selectedDate];
    const action = isCurrentlyBlocked ? 'unblockDay' : 'blockDay';

    try {
      const response = await fetch(`/api/admin/block-slot?secret=${encodeURIComponent(adminSecret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          action
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setDayBlockedStatus({
          ...dayBlockedStatus,
          [selectedDate]: !isCurrentlyBlocked
        });
        // Refresh slots to show visual change
        fetchSlots();
      } else {
        alert(data.error || 'Failed to update day status');
      }
    } catch (err) {
      alert('Connection error');
    } finally {
      setIsProcessingDay(false);
    }
  };

  const toggleBlock = async (slot: Slot) => {
    if (slot.isBooked) return;

    setProcessingId(slot.id);
    const action = slot.isBlocked ? 'unblock' : 'block';
    
    try {
      const response = await fetch(`/api/admin/block-slot?secret=${encodeURIComponent(adminSecret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: slot.date,
          slotId: slot.id,
          action
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update local state
        setSlots(slots.map(s => 
          s.id === slot.id ? { ...s, isBlocked: !slot.isBlocked } : s
        ));
      } else {
        alert(data.error || 'Failed to update slot');
      }
    } catch (err) {
      alert('Connection error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              Slot Availability Manager
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enable or disable specific slots for applicants.
            </p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all flex items-center gap-2 whitespace-nowrap ${
                showOnlyAvailable
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {showOnlyAvailable ? 'Showing Available' : 'Showing All Slots'}
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
            <button
              onClick={toggleDayBlock}
              disabled={isProcessingDay}
              className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all flex items-center gap-2 ${
                dayBlockedStatus[selectedDate]
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                  : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
              }`}
            >
              {isProcessingDay ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : dayBlockedStatus[selectedDate] ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Unblock Entire Day
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Block Entire Day
                </>
              )}
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
            {dateOptions.slice(0, 5).map((option) => (
              <button
                key={option.value}
                onClick={() => handleDateChange(option.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${
                  selectedDate === option.value
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="relative">
               <select 
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
               >
                 {dateOptions.map(option => (
                   <option key={option.value} value={option.value}>{option.label}</option>
                 ))}
               </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {dayBlockedStatus[selectedDate] && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">This day is fully blocked.</p>
              <p className="text-sm">No slots are visible to applicants for this date.</p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading slots for {selectedDate}...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800">Error Loading Slots</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button 
              onClick={fetchSlots}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : slots.filter(slot => !showOnlyAvailable || (!slot.isBooked && !slot.isBlocked && !slot.isPast)).length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Available Slots</h3>
            <p className="text-gray-500 mt-1 max-w-xs mx-auto">
              All slots are either booked, blocked, or in the past for this date.
            </p>
            {showOnlyAvailable && (
              <button 
                onClick={() => setShowOnlyAvailable(false)}
                className="mt-4 text-primary-600 font-bold hover:underline"
              >
                Show All Slots
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {slots
              .filter(slot => !showOnlyAvailable || (!slot.isBooked && !slot.isBlocked && !slot.isPast))
              .map((slot) => {
              const status = slot.isBooked ? 'booked' : slot.isPast ? 'passed' : slot.isBlocked ? 'blocked' : 'available';
              
              return (
                <div 
                  key={slot.id}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-32 ${
                    status === 'booked'
                      ? 'bg-blue-50 border-blue-100 opacity-80'
                      : status === 'passed'
                      ? 'bg-gray-100 border-gray-200 opacity-60'
                      : status === 'blocked'
                      ? 'bg-gray-50 border-gray-200 border-dashed'
                      : 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                        <Clock className={`w-4 h-4 ${status === 'available' ? 'text-primary-500' : 'text-gray-400'}`} />
                        {formatTimeToAMPM(slot.startTime)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimeToAMPM(slot.endTime)}
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      status === 'booked' 
                        ? 'bg-blue-100 text-blue-700' 
                        : status === 'passed'
                        ? 'bg-gray-200 text-gray-600'
                        : status === 'blocked'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {status}
                    </div>
                  </div>

                                      <div className="mt-auto">
                                      {status === 'booked' ? (
                                        <div className="text-xs text-blue-700 font-medium truncate">
                                           User: {slot.booking?.name || 'Booked'}
                                        </div>
                                      ) : status === 'passed' ? (
                                        <div className="text-xs text-gray-500 italic">
                                          Time passed
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                          <button
                                            onClick={() => toggleBlock(slot)}
                                            disabled={processingId === slot.id}
                                            className={`py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${
                                              status === 'blocked'
                                                ? 'bg-gray-800 text-white hover:bg-gray-900'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                          >
                                            {processingId === slot.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : status === 'blocked' ? (
                                              <>
                                                <Unlock className="w-3 h-3" />
                                                Unblock
                                              </>
                                            ) : (
                                              <>
                                                <Lock className="w-3 h-3" />
                                                Block
                                              </>
                                            )}
                                          </button>
                                          
                                          {(status === 'available' || status === 'blocked') && (
                                            <button
                                              onClick={() => {
                                                setSelectedSlotForManual(slot);
                                                setShowManualModal(true);
                                              }}
                                              className="py-1.5 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-primary-100 transition-colors"
                                            >
                                              <UserPlus className="w-3 h-3" />
                                              Book
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>                </div>
              );
            })}
          </div>
        )}
      </div>

      {showManualModal && selectedSlotForManual && (
        <ManualBookingModal
          slot={selectedSlotForManual}
          adminSecret={adminSecret}
          onClose={() => {
            setShowManualModal(false);
            setSelectedSlotForManual(null);
          }}
          onSuccess={() => {
            setShowManualModal(false);
            setSelectedSlotForManual(null);
            fetchSlots();
          }}
        />
      )}
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          Booked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-200 border border-gray-300 border-dashed rounded"></div>
          Blocked (Hidden from Users)
        </div>
      </div>
    </div>
  );
}
