'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Clock1, Clock2, Clock3, Clock4, Clock5, Clock6, 
  Clock7, Clock8, Clock9, Clock10, Clock11, Clock12,
  AlertCircle, Loader2, ArrowRight, ShieldCheck, Mail, Phone, Lock
} from 'lucide-react';
import FinalBookingModal from '@/components/FinalBookingModal';
import { TimeSlot } from '@/lib/types';

const DynamicClockIcon = ({ time, className }: { time: string, className?: string }) => {
  const parts = time.split(':');
  let hour = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (minutes >= 30) hour += 1;
  hour = hour % 12 || 12;
  const icons: Record<number, any> = {
    1: Clock1, 2: Clock2, 3: Clock3, 4: Clock4, 5: Clock5, 6: Clock6,
    7: Clock7, 8: Clock8, 9: Clock9, 10: Clock10, 11: Clock11, 12: Clock12
  };
  const Icon = icons[hour] || Clock;
  return <Icon className={className} />;
};

export default function FinalInterviewPage() {
  const [step, setStep] = useState<'verify' | 'slots'>('verify');
  const [identifier, setIdentifier] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch('/api/final-interview/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();

      if (data.success) {
        setUserData(data.data);
        setStep('slots');
        fetchSlots();
      } else {
        setVerifyError(data.error || 'Verification failed');
      }
    } catch {
      setVerifyError('Connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const response = await fetch('/api/slots');
      const data = await response.json();
      if (data.success) {
        // Filter for ONLY final round slots that are available
        const finalSlots = data.data.slots.filter((s: TimeSlot) => s.isFinalRound && !s.isBooked && !s.isBlocked && !s.isPast);
        setSlots(finalSlots);
        if (finalSlots.length > 0) {
          setSelectedDate(finalSlots[0].date);
        }
      }
    } catch (e) {
      console.error('Failed to load slots', e);
    } finally {
      setIsLoadingSlots(false);
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

  const dates = getDatesForDisplay();
  const currentSlots = getSlotsForSelectedDate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-lg shadow-slate-900/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase font-heading">LevelAxis</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Round Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16 max-w-2xl mx-auto px-6">
        
        {step === 'verify' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Access Final Interview</h1>
              <p className="text-lg text-slate-500 max-w-md mx-auto">Please verify your identity using the email or phone number you used previously.</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email or WhatsApp</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email or +8801..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-purple-500 focus:bg-white focus:shadow-xl focus:shadow-purple-100 transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                {verifyError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{verifyError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !identifier.trim()}
                  className="w-full py-5 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Identity
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome, {userData.name}</h2>
                <p className="text-sm text-slate-500 font-medium">Select a slot for your final evaluation.</p>
              </div>
              <button 
                onClick={() => { setStep('verify'); setIdentifier(''); setUserData(null); }}
                className="text-xs font-bold text-purple-600 hover:underline"
              >
                Log Out
              </button>
            </div>

            {isLoadingSlots ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-500">Checking availability...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Slots Available</h3>
                <p className="text-slate-500 text-sm">
                  There are currently no final round slots open. Please contact HR or check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Date Picker */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dates.map((dateInfo) => (
                    <button
                      key={dateInfo.date}
                      onClick={() => setSelectedDate(dateInfo.date)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                        selectedDate === dateInfo.date
                          ? 'border-purple-600 bg-purple-50 shadow-md transform scale-105'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {dateInfo.isToday ? 'Today' : dateInfo.isTomorrow ? 'Tomorrow' : format(new Date(dateInfo.date), 'EEE')}
                      </div>
                      <div className={`text-sm font-bold ${selectedDate === dateInfo.date ? 'text-purple-700' : 'text-slate-900'}`}>
                        {dateInfo.displayName}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Time Slots */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Available Times
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {currentSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => { setSelectedSlot(slot); setShowBookingModal(true); }}
                        className="group bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center min-h-[110px]"
                      >
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-600 transition-colors duration-300">
                          <DynamicClockIcon time={slot.startTime} className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-purple-700">{slot.startTime}</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">BD Time</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showBookingModal && selectedSlot && userData && (
        <FinalBookingModal
          slot={selectedSlot}
          preFilledData={userData}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
          onComplete={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
            setStep('verify'); // Reset flow
            alert('Final Interview Scheduled Successfully!');
          }}
        />
      )}
    </div>
  );
}
