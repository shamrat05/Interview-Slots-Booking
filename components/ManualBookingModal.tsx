'use client';

import { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';

interface ManualBookingModalProps {
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    displayTime: string;
  };
  adminSecret: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualBookingModal({ slot, adminSecret, onClose, onSuccess }: ManualBookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '+88',
    joiningPreference: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp is required';
    if (!formData.joiningPreference.trim()) newErrors.joiningPreference = 'Joining preference is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          secret: adminSecret
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setApiError(data.error || 'Failed to create booking');
      }
    } catch {
      setApiError('Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-600 text-white">
          <h2 className="text-lg font-bold">Manual Booking</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm flex flex-col gap-1 border border-gray-200">
             <div className="flex items-center gap-2 text-gray-700">
               <Calendar className="w-4 h-4" />
               <span className="font-semibold">{slot.date}</span>
             </div>
             <div className="flex items-center gap-2 text-gray-700">
               <Clock className="w-4 h-4" />
               <span>{slot.displayTime}</span>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Full Name"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="candidate@levelaxishq.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Preference</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.joiningPreference}
                onChange={(e) => setFormData({ ...formData, joiningPreference: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="e.g. Immediately, 15 days notice, etc."
              />
            </div>
            {errors.joiningPreference && <p className="text-xs text-red-500 mt-1">{errors.joiningPreference}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="+8801XXXXXXXXX"
              />
            </div>
            {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>}
          </div>

          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Book Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
