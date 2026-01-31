'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/lib/types';
import { 
  X, 
  User, 
  Mail, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  Banknote,
  Briefcase
} from 'lucide-react';

interface FinalBookingModalProps {
  slot: TimeSlot;
  preFilledData: {
    name: string;
    email: string;
    whatsapp: string;
    joiningPreference: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

type BookingStep = 'details' | 'confirmation' | 'success' | 'error';

export default function FinalBookingModal({ slot, preFilledData, onClose, onComplete }: FinalBookingModalProps) {
  const [step, setStep] = useState<BookingStep>('details');
  const [formData, setFormData] = useState({
    name: preFilledData.name,
    email: preFilledData.email,
    whatsapp: preFilledData.whatsapp,
    joiningPreference: preFilledData.joiningPreference,
    currentCtc: '',
    expectedCtc: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.currentCtc.trim()) {
      newErrors.currentCtc = 'Current CTC is required';
    }
    if (!formData.expectedCtc.trim()) {
      newErrors.expectedCtc = 'Expected CTC is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'details') {
      if (validateStep1()) setStep('confirmation');
    }
  };

  const handleBack = () => {
    if (step === 'confirmation') setStep('details');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await response.json();
      if (data.success) setStep('success');
      else {
        setErrorMessage(data.error || 'Booking failed');
        setStep('error');
      }
    } catch {
      setErrorMessage('Server connection lost');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Final Round Details</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Please provide your professional expectations.</p>
            </div>
            
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl sm:rounded-3xl p-2.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-12 h-12 bg-white rounded-lg sm:rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm shrink-0">
                  <CalendarDays className="w-4 h-4 sm:w-6 h-6 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] sm:text-[10px] font-black text-purple-600 uppercase tracking-widest">Final Interview</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{slot.date} @ {slot.startTime}</p>
                </div>
              </div>
              <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-purple-600 text-white text-[7px] sm:text-[10px] font-bold rounded-lg uppercase tracking-tighter shadow-lg shadow-purple-100 shrink-0">
                Decision Round
              </div>
            </div>

            <div className="space-y-3">
              {/* Read Only Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Name</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-600 font-medium truncate">
                    {formData.name}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Contact</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-600 font-medium truncate">
                    {formData.whatsapp}
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest ml-0.5">Notice Period</label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-600 font-medium">
                    {formData.joiningPreference}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-0.5">Current CTC (Monthly/Yearly)</label>
                <div className="relative group">
                  <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Banknote className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.currentCtc}
                    onChange={(e) => handleInputChange('currentCtc', e.target.value)}
                    placeholder="e.g. 50k BDT/Month"
                    className={`w-full pl-8 sm:pl-12 pr-3 py-2 sm:py-4 bg-slate-50 border-2 rounded-lg sm:rounded-[1.25rem] outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-400 text-sm ${
                      errors.currentCtc ? 'border-red-100 focus:border-red-400' : 'border-slate-50 focus:border-purple-500 focus:bg-white focus:shadow-lg focus:shadow-purple-100'
                    }`}
                  />
                </div>
                {errors.currentCtc && <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest ml-2">{errors.currentCtc}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-0.5">Expected CTC</label>
                <div className="relative group">
                  <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Sparkles className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.expectedCtc}
                    onChange={(e) => handleInputChange('expectedCtc', e.target.value)}
                    placeholder="e.g. 70k BDT/Month"
                    className={`w-full pl-8 sm:pl-12 pr-3 py-2 sm:py-4 bg-slate-50 border-2 rounded-lg sm:rounded-[1.25rem] outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-400 text-sm ${
                      errors.expectedCtc ? 'border-red-100 focus:border-red-400' : 'border-slate-50 focus:border-purple-500 focus:bg-white focus:shadow-lg focus:shadow-purple-100'
                    }`}
                  />
                </div>
                {errors.expectedCtc && <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest ml-2">{errors.expectedCtc}</p>}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-2.5 sm:py-5 bg-slate-900 text-white rounded-lg sm:rounded-[1.25rem] font-bold hover:bg-purple-600 transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 group shadow-lg sm:shadow-2xl shadow-slate-900/10 hover:shadow-purple-500/20 active:scale-[0.98] text-sm sm:text-base"
            >
              Review Application
              <ArrowRight className="w-4 h-4 sm:w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-sm">
                <ShieldCheck className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">One Last Check</h3>
              <p className="text-sm text-slate-500 font-medium">Confirm your details for the final round.</p>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4 border border-slate-100">
              {[
                { label: 'Candidate', value: formData.name },
                { label: 'Current CTC', value: formData.currentCtc },
                { label: 'Expected CTC', value: formData.expectedCtc },
                { label: 'Notice Period', value: formData.joiningPreference },
                { label: 'Interview Time', value: `${slot.date} at ${slot.startTime}` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <span className="text-sm font-bold text-slate-800 text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-[1.25rem] font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-purple-600 text-white rounded-[1.25rem] font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-[60px] opacity-20 animate-pulse"></div>
              <div className="w-24 h-24 bg-purple-500 rounded-[2.5rem] flex items-center justify-center mx-auto relative z-10 shadow-2xl shadow-purple-200">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Final Round Confirmed</h3>
              <p className="text-slate-500 font-medium">Good luck! We've sent the details to your WhatsApp.</p>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 text-left space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</span>
                <span className="text-xs font-mono font-bold text-purple-600">FINAL-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                <span className="text-sm font-bold text-slate-800">{slot.date}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                <span className="text-sm font-bold text-slate-800">{slot.startTime} (BD Time)</span>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-purple-600 transition-all shadow-xl active:scale-[0.98]"
            >
              Finish
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Oops! Failed</h3>
              <p className="text-slate-500 font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setStep('details')}
              className="w-full py-5 bg-purple-600 text-white rounded-[1.5rem] font-bold hover:bg-purple-700 transition-all"
            >
              Try Again
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] w-full sm:max-w-lg max-h-[90vh] sm:max-h-auto overflow-y-auto border border-slate-100 animate-in slide-in-from-bottom-4 duration-300">
        {step !== 'success' && step !== 'error' && (
          <div className="sticky top-0 right-0 z-10 flex justify-end pt-3 sm:pt-4 pr-3 sm:pr-4 bg-white/95 backdrop-blur-sm">
            <button
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="px-4 sm:px-8 py-3 sm:py-4 pb-20 sm:pb-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
