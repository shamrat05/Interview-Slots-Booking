'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Clock,
  Clock1, Clock2, Clock3, Clock4, Clock5, Clock6,
  Clock7, Clock8, Clock9, Clock10, Clock11, Clock12,
  Phone,
  Mail,
  Trash2,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Download,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Video,
  Link,
  Settings,
  LayoutDashboard,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ScheduleManager from '@/components/ScheduleManager';
import ConfigManager from '@/components/ConfigManager';
import { isPastSlotEnd } from '@/lib/utils';
import { isSameDay } from 'date-fns';

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

interface AdminBooking {
  id: string;
  slotId: string;
  name: string;
  email: string;
  whatsapp: string;
  joiningPreference: string;
  slotDate: string;
  slotTime: string;
  slotEndTime: string;
  bookedAt: string;
  whatsappSent?: boolean;
  meetLink?: string;
}

interface AdminData {
  bookings: AdminBooking[];
  totalBookings: number;
  stats: {
    total: number;
    uniqueDates: number;
  };
}

interface GlobalConfig {
  whatsappTemplate: string;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireTyping?: boolean;
  expectedText?: string;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  requireTyping = false,
  expectedText = 'DELETE'
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
    setTypedText('');
  };

  const canConfirm = requireTyping ? typedText === expectedText : true;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        {requireTyping && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono font-bold text-red-600">{expectedText}</span> to confirm
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={expectedText}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RescheduleDialogProps {
  isOpen: boolean;
  booking: AdminBooking | null;
  availableSlots: any[];
  onConfirm: (newDate: string, newSlotId: string, newStartTime: string, newEndTime: string) => void;
  onCancel: () => void;
}

function EditBookingModal({ 
  isOpen, 
  booking, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  booking: AdminBooking | null; 
  onConfirm: (data: Partial<AdminBooking>) => Promise<void>; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    joiningPreference: ''
  });
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        name: booking.name,
        email: booking.email,
        whatsapp: booking.whatsapp,
        joiningPreference: booking.joiningPreference
      });
      setConfirmText('');
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handleSave = async () => {
    if (confirmText !== 'CONFIRM') return;
    setIsProcessing(true);
    await onConfirm(formData);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Edit Applicant Info</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Joining Preference</label>
            <input
              type="text"
              value={formData.joiningPreference}
              onChange={(e) => setFormData({ ...formData, joiningPreference: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <label className="block text-[10px] font-bold text-amber-700 uppercase mb-2">Type <span className="text-red-600">CONFIRM</span> to save changes</label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="CONFIRM"
            className="w-full px-4 py-2 border border-amber-200 rounded-lg text-sm font-mono"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold">Cancel</button>
          <button
            onClick={handleSave}
            disabled={confirmText !== 'CONFIRM' || isProcessing}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {isProcessing ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RescheduleDialog({ isOpen, booking, availableSlots, onConfirm, onCancel }: RescheduleDialogProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    if (!selectedSlot) return;

    const slot = availableSlots.find(s => s.id === selectedSlot);
    if (!slot) return;

    setIsProcessing(true);
    await onConfirm(slot.date, slot.id, slot.startTime, slot.endTime);
    setIsProcessing(false);
    setSelectedSlot('');
  };

  // Group slots by date
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Reschedule Booking</h3>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Rescheduling <span className="font-semibold">{booking.name}</span> from {booking.slotDate} {booking.slotTime}
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No slots found</p>
              <p className="text-xs text-gray-400 mt-2">Ensure slots are generated in the Schedule Manager.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-900">
                    {date}
                  </div>
                  <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(slots as any[]).map((slot) => {
                      const isBooked = slot.isBooked;
                      const isBlocked = slot.isBlocked;
                      const isSelf = slot.id === booking.slotId;
                      const isDisabled = (isBooked || isBlocked) && !isSelf;

                      return (
                        <button
                          key={slot.id}
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`px-3 py-2 text-sm rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-[60px] ${
                            selectedSlot === slot.id
                              ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold shadow-sm'
                              : isSelf
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : isDisabled
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{slot.displayTime}</span>
                          {isBooked && !isSelf && (
                            <span className="text-[10px] mt-1 text-gray-500 line-clamp-1">
                              Booked: {slot.booking?.name || 'Someone'}
                            </span>
                          )}
                          {isBlocked && !isBooked && (
                            <span className="text-[10px] mt-1 text-gray-500 italic">
                              Blocked
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-[10px] mt-1 text-blue-600 font-bold">
                              Current Slot
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || isProcessing || selectedSlot === booking.slotId}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reschedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule' | 'settings'>('bookings');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<AdminBooking | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<AdminBooking | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<any>>([]);
  const [bookingToEdit, setBookingToEdit] = useState<AdminBooking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  useEffect(() => {
    // Load dismissed notifications from local storage
    const saved = localStorage.getItem('dismissedBookings');
    if (saved) {
      try {
        setDismissedNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse dismissed bookings', e);
      }
    }
  }, []);

  const dismissNotification = (id: string) => {
    const newDismissed = [...dismissedNotifications, id];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissedBookings', JSON.stringify(newDismissed));
  };

  const clearAllNotifications = () => {
    if (!adminData) return;
    const allIds = adminData.bookings.map(b => b.id);
    setDismissedNotifications(allIds);
    localStorage.setItem('dismissedBookings', JSON.stringify(allIds));
    setShowAllNotifications(false);
  };

  const latestBookings = adminData?.bookings
    .filter(b => !dismissedNotifications.includes(b.id))
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    .slice(0, showAllNotifications ? undefined : 5) || [];

  useEffect(() => {
    // Check if already authenticated (session storage)
    const storedAuth = sessionStorage.getItem('adminAuthenticated');
    const storedSecret = sessionStorage.getItem('adminSecret');
    if (storedAuth === 'true' && storedSecret) {
      setIsAuthenticated(true);
      setPassword(storedSecret);
      // We'll call fetchBookings and fetchConfig in a separate effect or after setting password
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && password) {
      fetchBookings();
      fetchConfig();
    }
  }, [isAuthenticated, password]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/admin/config?secret=${encodeURIComponent(password)}`);
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin?secret=${encodeURIComponent(password)}`);
      const data = await response.json();

      if (data.success) {
        setAdminData(data.data);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch('/api/slots');
      const data = await response.json();
      if (data.success) {
        // Show ALL slots in the reschedule dialog (including booked/blocked ones)
        setAvailableSlots(data.data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin?secret=${encodeURIComponent(password)}`);
      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminSecret', password);
        setAdminData(data.data);
        fetchConfig();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (booking: AdminBooking) => {
    setBookingToDelete(booking);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;

    setDeletingId(bookingToDelete.id);
    try {
      const response = await fetch(
        `/api/admin?secret=${encodeURIComponent(password)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: bookingToDelete.slotDate,
            slotId: bookingToDelete.slotId
          })
        }
      );
      const data = await response.json();

      if (data.success) {
        setShowDeleteDialog(false);
        setBookingToDelete(null);
        fetchBookings();
      } else {
        alert(data.error || 'Failed to delete booking');
      }
    } catch {
      alert('Failed to delete booking');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRescheduleClick = async (booking: AdminBooking) => {
    setBookingToReschedule(booking);
    await fetchAvailableSlots();
    setShowRescheduleDialog(true);
  };

  const handleRescheduleConfirm = async (
    newDate: string,
    newSlotId: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    if (!bookingToReschedule) return;

    try {
      const response = await fetch(
        `/api/admin?secret=${encodeURIComponent(password)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldDate: bookingToReschedule.slotDate,
            oldSlotId: bookingToReschedule.slotId,
            newDate,
            newSlotId,
            newStartTime,
            newEndTime
          })
        }
      );
      const data = await response.json();

      if (data.success) {
        setShowRescheduleDialog(false);
        setBookingToReschedule(null);
        fetchBookings();
        alert('Booking rescheduled successfully!');
      } else {
        alert(data.error || 'Failed to reschedule booking');
      }
    } catch {
      alert('Failed to reschedule booking');
    }
  };

  const toggleWhatsAppSent = async (booking: AdminBooking) => {
    try {
      const response = await fetch(
        `/api/admin?secret=${encodeURIComponent(password)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: booking.slotDate,
            slotId: booking.slotId,
            whatsappSent: !booking.whatsappSent
          })
        }
      );
      const data = await response.json();

      if (data.success) {
        // Optimistic update
        setAdminData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bookings: prev.bookings.map(b => 
              b.id === booking.id ? { ...b, whatsappSent: !b.whatsappSent } : b
            )
          };
        });
      } else {
        alert(data.error || 'Failed to update WhatsApp status');
      }
    } catch {
      alert('Failed to update WhatsApp status');
    }
  };

  const generateMeetLink = async (booking: AdminBooking) => {
    try {
      const response = await fetch(
        `/api/admin?secret=${encodeURIComponent(password)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-meet',
            date: booking.slotDate,
            slotId: booking.slotId
          })
        }
      );
      const data = await response.json();

      if (data.success) {
        // Optimistic update
        setAdminData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bookings: prev.bookings.map(b => 
              b.id === booking.id ? { ...b, meetLink: data.meetLink } : b
            )
          };
        });
      } else {
        alert(data.error || 'Failed to generate Meet link');
      }
    } catch {
      alert('Failed to connect to server');
    }
  };

  const updateManualLink = async (booking: AdminBooking) => {
    const manualLink = window.prompt('Enter meeting link manually:', booking.meetLink || 'https://');
    if (manualLink === null) return; // Cancelled

    try {
      const response = await fetch(
        `/api/admin?secret=${encodeURIComponent(password)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'manual-link',
            date: booking.slotDate,
            slotId: booking.slotId,
            meetLink: manualLink
          })
        }
      );
      const data = await response.json();

      if (data.success) {
        setAdminData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bookings: prev.bookings.map(b => 
              b.id === booking.id ? { ...b, meetLink: data.meetLink } : b
            )
          };
        });
      } else {
        alert(data.error || 'Failed to save manual link');
      }
    } catch {
      alert('Failed to connect to server');
    }
  };

  const handleEditConfirm = async (updatedData: Partial<AdminBooking>) => {
    if (!bookingToEdit) return;

    try {
      const response = await fetch(
        `/api/admin?secret=${encodeURIComponent(password)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-details',
            date: bookingToEdit.slotDate,
            slotId: bookingToEdit.slotId,
            ...updatedData
          })
        }
      );
      const data = await response.json();

      if (data.success) {
        setAdminData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bookings: prev.bookings.map(b => 
              b.id === bookingToEdit.id ? { ...b, ...updatedData } : b
            )
          };
        });
        setShowEditModal(false);
        setBookingToEdit(null);
      } else {
        alert(data.error || 'Failed to update details');
      }
    } catch {
      alert('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminSecret');
    setPassword('');
    setAdminData(null);
  };

  const sendWhatsAppConfirmation = (booking: AdminBooking) => {
    const defaultTemplate = 'Hello {name}, your interview with LevelAxis is confirmed for {day}, {date} at {time}. Video Link: {link}';
    const template = config?.whatsappTemplate || defaultTemplate;
    
    // Get day name
    const dateObj = new Date(booking.slotDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const message = template
      .replace('{name}', booking.name)
      .replace('{day}', dayName)
      .replace('{date}', booking.slotDate)
      .replace('{time}', booking.slotTime)
      .replace('{link}', booking.meetLink || 'Will be shared soon');

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = booking.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const exportToCSV = () => {
    if (!adminData || adminData.bookings.length === 0) {
      alert('No bookings to export');
      return;
    }

    const csvData = adminData.bookings.map(booking => ({
      Name: booking.name,
      Email: booking.email,
      'WhatsApp': `https://wa.me/${booking.whatsapp.replace(/\D/g, '')}`,
      'WhatsApp Sent': booking.whatsappSent ? 'Yes' : 'No',
      'Joining': booking.joiningPreference,
      'Date': booking.slotDate,
      'Time': booking.slotTime,
      'Meet Link': booking.meetLink || '',
      'Booked At': new Date(booking.bookedAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `interview-bookings-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!adminData || adminData.bookings.length === 0) {
      alert('No bookings to export');
      return;
    }

    const excelData = adminData.bookings.map(booking => ({
      'Name': booking.name,
      'Email': booking.email,
      'WhatsApp': `https://wa.me/${booking.whatsapp.replace(/\D/g, '')}`,
      'WhatsApp Sent': booking.whatsappSent ? 'Yes' : 'No',
      'Joining': booking.joiningPreference,
      'Date': booking.slotDate,
      'Time': booking.slotTime,
      'Meet Link': booking.meetLink || '',
      'Booked At': new Date(booking.bookedAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

    XLSX.writeFile(wb, `interview-bookings-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filter and group bookings
  const filteredBookings = adminData?.bookings.filter(booking => {
    const search = searchTerm.toLowerCase();
    return (
      booking.name.toLowerCase().includes(search) ||
      booking.email.toLowerCase().includes(search) ||
      booking.whatsapp.toLowerCase().includes(search) ||
      booking.joiningPreference.toLowerCase().includes(search) ||
      booking.slotDate.includes(search)
    );
  }) || [];

  const groupedBookings = filteredBookings.reduce((groups, booking) => {
    if (!groups[booking.slotDate]) {
      groups[booking.slotDate] = [];
    }
    groups[booking.slotDate].push(booking);
    return groups;
  }, {} as Record<string, AdminBooking[]>);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-500 mt-2">Enter your admin password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Booking Page
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Branding - Compact on mobile */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-xl font-bold text-gray-900 truncate">LevelAxis Admin</h1>
                <p className="text-[10px] md:text-sm text-gray-500 truncate hidden xs:block">Dashboard</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Desktop Export Buttons / Mobile Icon Buttons */}
              <div className="flex items-center bg-gray-100/50 rounded-lg p-1">
                <button
                  onClick={exportToCSV}
                  disabled={!adminData || adminData.bookings.length === 0}
                  className="p-2 md:px-3 md:py-2 text-gray-600 hover:text-primary-600 hover:bg-white rounded-md transition-all disabled:opacity-50"
                  title="Export CSV"
                >
                  <FileText className="w-4 h-4 md:mr-2 md:inline" />
                  <span className="hidden md:inline text-sm font-medium">CSV</span>
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={!adminData || adminData.bookings.length === 0}
                  className="p-2 md:px-3 md:py-2 text-gray-600 hover:text-primary-600 hover:bg-white rounded-md transition-all disabled:opacity-50"
                  title="Export Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 md:mr-2 md:inline" />
                  <span className="hidden md:inline text-sm font-medium">Excel</span>
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              {/* Back to Site - Icon only on mobile */}
              <a
                href="/"
                className="p-2 md:px-3 md:py-2 text-gray-500 hover:text-gray-800 transition-colors"
                title="Back to Site"
              >
                <ArrowLeft className="w-4 h-4 md:mr-2 md:inline" />
                <span className="hidden md:inline text-sm font-medium">Site</span>
              </a>

              {/* Logout - Safe from screen edge */}
              <button
                onClick={handleLogout}
                className="ml-1 p-2 md:px-4 md:py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100 flex items-center gap-2"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-bold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        
        {/* Navigation Tabs - Scrollable on mobile */}
        <div className="flex border-b border-gray-200 mb-6 md:mb-8 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-shrink-0 px-4 md:px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-shrink-0 px-4 md:px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Availability
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-shrink-0 px-4 md:px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {activeTab === 'bookings' ? (
          <>
            {/* Stats Cards - Optimized for Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{adminData?.stats.total || 0}</p>
                    <p className="text-[10px] md:text-sm text-gray-500 truncate">Total</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{adminData?.stats.uniqueDates || 0}</p>
                    <p className="text-[10px] md:text-sm text-gray-500 truncate">Days</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                      {adminData?.bookings.filter(b => !isPastSlotEnd(b.slotDate, b.slotEndTime)).length || 0}
                    </p>
                    <p className="text-[10px] md:text-sm text-gray-500 truncate">Upcoming</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                      {adminData?.bookings.filter(b => isPastSlotEnd(b.slotDate, b.slotEndTime)).length || 0}
                    </p>
                    <p className="text-[10px] md:text-sm text-gray-500 truncate">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar - Sticky on Mobile */}
            <div className="mb-6 sticky top-[4.5rem] md:static z-20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-md md:shadow-sm transition-all text-sm"
                />
              </div>
            </div>

            {/* Bookings List */}
            {isLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : adminData?.bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500">When applicants book slots, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {Object.entries(groupedBookings || {}).map(([date, bookings]) => (
                  <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 md:w-5 h-5 text-primary-600" />
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">{date}</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] md:text-xs font-medium rounded-full">
                        {bookings.length}
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookings.map((booking) => {
                        // Calculate Status
                        const now = new Date();
                        const slotDate = new Date(booking.slotDate);
                        const [startH, startM] = booking.slotTime.split(':').map(Number);
                        const [endH, endM] = booking.slotEndTime.split(':').map(Number);
                        
                        const slotStart = new Date(slotDate);
                        slotStart.setHours(startH, startM, 0, 0);
                        
                        const slotEnd = new Date(slotDate);
                        slotEnd.setHours(endH, endM, 0, 0);

                        // Adjust logic for "Ongoing" vs "Finished" vs "Upcoming"
                        // Note: isPastSlotEnd utility already exists but we want precise "Ongoing" check
                        const isToday = isSameDay(new Date(), new Date(booking.slotDate));
                        // Simple client-side check. Ideally match server time logic, but this visual cue is fine.
                        const isOngoing = isToday && now >= slotStart && now < slotEnd;
                        const isFinished = isPastSlotEnd(booking.slotDate, booking.slotEndTime);
                        
                        let status: 'ongoing' | 'finished' | 'upcoming' = 'upcoming';
                        if (isOngoing) status = 'ongoing';
                        else if (isFinished) status = 'finished';

                        // Styles
                        const styles = {
                          ongoing: 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500',
                          finished: 'bg-gray-50 border-gray-200 opacity-75',
                          upcoming: 'bg-blue-50 border-blue-200'
                        };

                        const badgeStyles = {
                          ongoing: 'bg-emerald-100 text-emerald-700',
                          finished: 'bg-gray-200 text-gray-600',
                          upcoming: 'bg-blue-100 text-blue-700'
                        };

                        const iconColor = {
                          ongoing: 'text-emerald-600 animate-pulse',
                          finished: 'text-gray-400',
                          upcoming: 'text-blue-500'
                        };

                        return (
                          <div
                            key={booking.id}
                            className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all ${styles[status]} hover:shadow-md`}
                          >
                            {/* Header: Time & Status */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className={`flex items-center gap-1.5 font-bold text-lg ${
                                  status === 'ongoing' ? 'text-emerald-900' : 'text-gray-900'
                                }`}>
                                  <DynamicClockIcon 
                                    time={booking.slotTime} 
                                    className={`w-4 h-4 ${iconColor[status]}`} 
                                  />
                                  {booking.slotTime}
                                </div>
                                <div className="text-xs text-gray-500 font-medium ml-6">
                                  to {booking.slotEndTime}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${badgeStyles[status]}`}>
                                {status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>}
                                {status}
                              </div>
                            </div>

                            {/* Candidate Info */}
                            <div className="space-y-1">
                                <div className="font-bold text-gray-900 truncate" title={booking.name}>
                                  {booking.name}
                                </div>
                                <div className="text-xs text-gray-600 truncate flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {booking.email}
                                </div>
                                <div className="text-xs text-gray-600 truncate flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {booking.whatsapp}
                                </div>
                            </div>

                            {/* Links & Actions Section */}
                            <div className="pt-3 border-t border-gray-200/50 flex flex-col gap-2">
                                {/* Meet Link Row */}
                                <div className="flex items-center justify-between min-h-[24px]">
                                    {booking.meetLink ? (
                                      <a 
                                        href={booking.meetLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline truncate max-w-[150px]"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        Join Meet
                                      </a>
                                    ) : !isFinished ? (
                                      <button
                                        onClick={() => generateMeetLink(booking)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        Generate Link
                                      </button>
                                    ) : (
                                       <span className="text-[10px] text-gray-400 italic">No link generated</span>
                                    )}

                                    {/* Manual Link Edit */}
                                    {!isFinished && (
                                       <button
                                          onClick={() => updateManualLink(booking)}
                                          className="p-1 text-gray-400 hover:text-gray-600"
                                          title={booking.meetLink ? "Edit Link" : "Add Link Manually"}
                                        >
                                          {booking.meetLink ? <Edit className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>

                                {/* Action Buttons Row */}
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                      {/* WhatsApp Status Toggle */}
                                      <button
                                        onClick={() => toggleWhatsAppSent(booking)}
                                        className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                                          booking.whatsappSent 
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                        title={booking.whatsappSent ? "Mark as Not Sent" : "Mark as Sent"}
                                      >
                                         {booking.whatsappSent ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                      </button>
                                      
                                      {/* Send WA */}
                                      <button
                                        onClick={() => sendWhatsAppConfirmation(booking)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                                        title="Send WhatsApp Message"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setBookingToEdit(booking);
                                          setShowEditModal(true);
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                                        title="Edit Details"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleRescheduleClick(booking)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                                        title="Reschedule"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick(booking)}
                                        disabled={deletingId === booking.id}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                                        title="Cancel Booking"
                                      >
                                        {deletingId === booking.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'schedule' ? (
          <ScheduleManager adminSecret={password} />
        ) : (
          <ConfigManager adminSecret={password} />
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for ${bookingToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete Booking"
        requireTyping={true}
        expectedText="DELETE"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setBookingToDelete(null);
        }}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={showRescheduleDialog}
        booking={bookingToReschedule}
        availableSlots={availableSlots}
        onConfirm={handleRescheduleConfirm}
        onCancel={() => {
          setShowRescheduleDialog(false);
          setBookingToReschedule(null);
        }}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        isOpen={showEditModal}
        booking={bookingToEdit}
        onConfirm={handleEditConfirm}
        onCancel={() => {
          setShowEditModal(false);
          setBookingToEdit(null);
        }}
      />

      {/* Notifications Overlay - Compact "Fizzy" Style */}
      {isAuthenticated && adminData && latestBookings.length > 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">
          
          {/* Main Notification Card - Only visible when expanded or just 1 */}
          {(showAllNotifications || latestBookings.length === 1) && (
            <div className={`flex flex-col gap-2 transition-all duration-300 ${showAllNotifications ? 'max-h-[70vh] w-[280px] md:w-[320px] overflow-y-auto p-1' : 'w-[280px]'}`}>
              {latestBookings.map((booking, idx) => (
                <div 
                  key={booking.id}
                  className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-primary-100 p-3 animate-slide-up relative group transition-all ${
                    !showAllNotifications && idx > 0 ? 'hidden' : ''
                  }`}
                >
                  <button 
                    onClick={() => dismissNotification(booking.id)}
                    className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-gray-900 truncate">{booking.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {booking.slotDate} • {booking.slotTime}
                      </p>
                      <button 
                        onClick={() => {
                          setSearchTerm(booking.name);
                          setActiveTab('bookings');
                        }}
                        className="text-[9px] font-bold text-primary-600 hover:underline mt-1"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Controls - The "Fizzy" Part */}
          <div className="flex items-center gap-2">
            {latestBookings.length > 1 && !showAllNotifications && (
              <div className="flex -space-x-2 mr-1">
                {latestBookings.slice(0, 3).map((b, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-primary-500 flex items-center justify-center text-[8px] text-white font-bold shadow-sm">
                    {b.name.charAt(0)}
                  </div>
                ))}
                {latestBookings.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 font-bold shadow-sm">
                    +{latestBookings.length - 3}
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 p-1 flex items-center gap-1">
              <button 
                onClick={() => setShowAllNotifications(!showAllNotifications)}
                className="px-3 py-1 text-[10px] font-bold text-primary-600 hover:bg-primary-50 rounded-full transition-colors flex items-center gap-1"
              >
                {showAllNotifications ? 'Collapse' : `New Bookings (${latestBookings.length})`}
              </button>
              {showAllNotifications && (
                <button 
                  onClick={clearAllNotifications}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear All"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
