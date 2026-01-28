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
  Clock
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Joining Preference validation
    if (!formData.joiningPreference.trim()) {
      newErrors.joiningPreference = 'This field is required';
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
      newErrors.whatsapp = `Must be exactly 13 digits after + (Current digits: ${val.length - 1})`;
    } else if (!/^\+8801\d{9}$/.test(val)) {
      newErrors.whatsapp = 'Invalid format. Use +8801XXXXXXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'details') {
      if (validateStep1()) {
        setStep('confirmation');
      }
    } else if (step === 'confirmation') {
      setStep('whatsapp');
    }
  };

  const handleBack = () => {
    if (step === 'confirmation') {
      setStep('details');
    } else if (step === 'whatsapp') {
      setStep('confirmation');
    }
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
          name: formData.name.trim(),
          email: formData.email.trim(),
          whatsapp: formData.whatsapp.trim(),
          joiningPreference: formData.joiningPreference.trim(),
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
      } else {
        setErrorMessage(data.error || 'Failed to book slot');
        setStep('error');
      }
    } catch {
      setErrorMessage('Failed to connect to server. Please try again.');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Your Details</h3>
            
            {/* Slot Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-800">
                <span className="font-medium">{slot.date}</span>
                <span className="text-blue-400">•</span>
                <span>{slot.displayTime}</span>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="candidate@levelaxishq.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Joining Preference Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                When can you join if you get selected? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.joiningPreference}
                  onChange={(e) => handleInputChange('joiningPreference', e.target.value)}
                  placeholder="e.g. Immediately, 15 days notice, etc."
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.joiningPreference ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.joiningPreference && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.joiningPreference}
                </p>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Your Booking</h3>

            {/* Confirmation Message */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                Please review your details before proceeding. You will need to provide your WhatsApp number in the next step.
              </p>
            </div>

            {/* Review Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{slot.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">{slot.displayTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joining:</span>
                <span className="font-medium text-gray-900">{formData.joiningPreference}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add WhatsApp Number</h3>

            {/* WhatsApp Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-green-800 text-sm font-medium">Why do we need this?</p>
                  <p className="text-green-700 text-sm mt-1">
                    We will send interview reminders and updates to your WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.whatsapp ? (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.whatsapp}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Include country code (e.g., +880 for BD)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-4">
              Your interview has been scheduled successfully.
            </p>

            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6">
              <p className="text-[11px] text-red-700 leading-relaxed">
                <strong>Note:</strong> If you do not receive the interview link via WhatsApp at least 1 hour before your scheduled time, please contact the number or email from which you received this confirmation.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{slot.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{slot.displayTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp:</span>
                  <span className="font-medium">{formData.whatsapp}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Failed</h3>
            <p className="text-gray-600 mb-2">{errorMessage}</p>
            <p className="text-sm text-gray-500 mb-6">
              This slot may have been booked by someone else. Please try another time.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Try Another Slot
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 modal-backdrop"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Close Button */}
        {step !== 'success' && step !== 'error' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        {step !== 'success' && step !== 'error' && (
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Book Interview Slot</h2>
            <p className="text-sm text-gray-500 mt-1">Step {step === 'details' ? '1' : step === 'confirmation' ? '2' : '3'} of 3</p>
            
            {/* Progress Bar */}
            <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ 
                  width: step === 'details' ? '33%' : step === 'confirmation' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
