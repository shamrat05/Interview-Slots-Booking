'use client';

import { useState } from 'react';
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
  CalendarDays
} from 'lucide-react';

interface BookingModalProps {
  slot: TimeSlot;
  onClose: () => void;
  onComplete: () => void;
}

type BookingStep = 'details' | 'confirmation' | 'whatsapp' | 'success' | 'error';

export default function BookingModal({ slot, onClose, onComplete }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('details');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '+8801',
    joiningPreference: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name is too short';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.joiningPreference.trim()) {
      newErrors.joiningPreference = 'Please specify your joining timeline';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWhatsApp = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const val = formData.whatsapp.trim();

    if (!val) {
      newErrors.whatsapp = 'WhatsApp number is required';
    } else if (!val.startsWith('+8801')) {
      newErrors.whatsapp = 'Must start with +8801';
    } else if (val.length !== 14) {
      newErrors.whatsapp = 'Must be exactly 13 digits after +';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'details') {
      if (validateStep1()) setStep('confirmation');
    } else if (step === 'confirmation') {
      setStep('whatsapp');
    }
  };

  const handleBack = () => {
    if (step === 'confirmation') setStep('details');
    else if (step === 'whatsapp') setStep('confirmation');
  };

  const handleSubmit = async () => {
    if (!validateWhatsApp()) return;

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
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Personal Details</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Professional information required.</p>
            </div>
            
            <div className="bg-primary-50/50 border border-primary-100 rounded-xl sm:rounded-3xl p-2.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-12 h-12 bg-white rounded-lg sm:rounded-2xl flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
                  <CalendarDays className="w-4 h-4 sm:w-6 h-6 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] sm:text-[10px] font-black text-primary-600 uppercase tracking-widest">Scheduled</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{slot.date} @ {slot.startTime}</p>
                </div>
              </div>
              <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-primary-600 text-white text-[7px] sm:text-[10px] font-bold rounded-lg uppercase tracking-tighter shadow-lg shadow-primary-100 shrink-0">
                Live
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-0.5">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                    <User className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your name"
                    className={`w-full pl-8 sm:pl-12 pr-3 py-2 sm:py-4 bg-slate-50 border-2 rounded-lg sm:rounded-[1.25rem] outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-400 text-sm ${
                      errors.name ? 'border-red-100 focus:border-red-400' : 'border-slate-50 focus:border-primary-500 focus:bg-white focus:shadow-lg focus:shadow-primary-100'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest ml-2">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-0.5">Work Email</label>
                <div className="relative group">
                  <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                    <Mail className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@domain.com"
                    className={`w-full pl-8 sm:pl-12 pr-3 py-2 sm:py-4 bg-slate-50 border-2 rounded-lg sm:rounded-[1.25rem] outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-400 text-sm ${
                      errors.email ? 'border-red-100 focus:border-red-400' : 'border-slate-50 focus:border-primary-500 focus:bg-white focus:shadow-lg focus:shadow-primary-100'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest ml-2">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ml-0.5">Joining Timeline</label>
                <div className="relative group">
                  <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                    <Clock className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.joiningPreference}
                    onChange={(e) => handleInputChange('joiningPreference', e.target.value)}
                    placeholder="e.g. Immediate, 1 Month Notice"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-[1.25rem] outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-400 ${
                      errors.joiningPreference ? 'border-red-100 focus:border-red-400' : 'border-slate-50 focus:border-primary-500 focus:bg-white focus:shadow-xl focus:shadow-primary-100'
                    }`}
                  />
                </div>
                {errors.joiningPreference && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-4 mt-1">{errors.joiningPreference}</p>}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-2.5 sm:py-5 bg-slate-900 text-white rounded-lg sm:rounded-[1.25rem] font-bold hover:bg-primary-600 transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 group shadow-lg sm:shadow-2xl shadow-slate-900/10 hover:shadow-primary-500/20 active:scale-[0.98] text-sm sm:text-base"
            >
              Review Booking
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Final Verification</h3>
              <p className="text-sm text-slate-500 font-medium">Please ensure all details are correct.</p>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4 border border-slate-100">
              {[
                { label: 'Candidate', value: formData.name },
                { label: 'Work Email', value: formData.email },
                { label: 'Date', value: slot.date },
                { label: 'Session Time', value: slot.startTime },
                { label: 'Notice Period', value: formData.joiningPreference },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <span className="text-sm font-bold text-slate-800">{item.value}</span>
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
                onClick={handleNext}
                className="flex-[2] py-4 bg-primary-600 text-white rounded-[1.25rem] font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-200"
              >
                Confirm & Next
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Communication</h3>
              <p className="text-sm text-slate-500 font-medium">Add WhatsApp for interview links and reminders.</p>
            </div>

            <div className="bg-green-50/50 border border-green-100 rounded-[2rem] p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-green-100 shadow-sm shrink-0">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-green-800 font-medium leading-relaxed">
                We'll send the Google Meet invitation directly to your WhatsApp 1 hour before the session.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-[1.25rem] outline-none transition-all duration-300 font-medium text-slate-900 ${
                    errors.whatsapp ? 'border-red-100 focus:border-red-400' : 'border-slate-50 focus:border-green-500 focus:bg-white focus:shadow-xl focus:shadow-green-50'
                  }`}
                />
              </div>
              {errors.whatsapp && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-4 mt-1">{errors.whatsapp}</p>}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-[1.25rem] font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-green-600 text-white rounded-[1.25rem] font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-100 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securing Slot...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Book Interview
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
              <div className="absolute inset-0 bg-green-500 blur-[60px] opacity-20 animate-pulse"></div>
              <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto relative z-10 shadow-2xl shadow-green-200">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Booking Secured!</h3>
              <p className="text-slate-500 font-medium">Your interview has been officially scheduled.</p>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 text-left space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmation ID</span>
                <span className="text-xs font-mono font-bold text-primary-600">LA-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
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

            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex gap-3 items-center">
              <AlertCircle className="w-5 h-5 text-primary-600 shrink-0" />
              <p className="text-[10px] text-primary-800 font-bold uppercase tracking-wider text-left leading-relaxed">
                Check WhatsApp 1 hour before for the meeting link.
              </p>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-primary-600 transition-all shadow-xl active:scale-[0.98]"
            >
              Back to Home
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
              onClick={() => window.location.reload()}
              className="w-full py-5 bg-primary-600 text-white rounded-[1.5rem] font-bold hover:bg-primary-700 transition-all"
            >
              Retry Booking
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

        {step !== 'success' && step !== 'error' && (
          <div className="px-4 sm:px-8 pt-2 sm:pt-3 pb-2">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`h-1 rounded-full transition-all duration-500 flex-1 ${
                    (step === 'details' && s === 1) || (step === 'confirmation' && s <= 2) || (step === 'whatsapp' && s <= 3)
                      ? 'bg-primary-600' 
                      : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="px-4 sm:px-8 py-3 sm:py-4 pb-20 sm:pb-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
