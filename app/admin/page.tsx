'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Clock,
  Phone,
  Mail,
  Trash2,
  LogOut,
  Lock,
  Eye,
  EyeOff,
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
  Settings,
  LayoutDashboard,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ScheduleManager from '@/components/ScheduleManager';
import ConfigManager from '@/components/ConfigManager';

interface AdminBooking {
  id: string;
  slotId: string;
  name: string;
  email: string;
  whatsapp: string;
  joiningPreference: string;
  slotDate: string;
  slotTime: string;
  bookedAt: string;
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminSecret');
    setPassword('');
    setAdminData(null);
  };

  const sendWhatsAppConfirmation = (booking: AdminBooking) => {
    const defaultTemplate = 'Hello {name}, your interview with LevelAxis is confirmed for {day}, {date} at {time}. We look forward to seeing you!';
    const template = config?.whatsappTemplate || defaultTemplate;
    
    // Get day name
    const dateObj = new Date(booking.slotDate);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const message = template
      .replace('{name}', booking.name)
      .replace('{day}', dayName)
      .replace('{date}', booking.slotDate)
      .replace('{time}', booking.slotTime);

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
      'Joining': booking.joiningPreference,
      'Date': booking.slotDate,
      'Time': booking.slotTime,
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
      'Joining': booking.joiningPreference,
      'Date': booking.slotDate,
      'Time': booking.slotTime,
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{adminData?.stats.total || 0}</p>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{adminData?.stats.uniqueDates || 0}</p>
                    <p className="text-sm text-gray-500">Days with Bookings</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {adminData?.bookings.filter(b => new Date(b.slotDate) >= new Date()).length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Upcoming</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, WhatsApp or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm transition-all"
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
              <div className="space-y-6">
                {Object.entries(groupedBookings || {}).map(([date, bookings]) => (
                  <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <h3 className="font-semibold text-gray-900">{date}</h3>
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{booking.name}</span>
                                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded font-medium">
                                  {booking.slotTime}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5" />
                                  {booking.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {booking.whatsapp}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Join: {booking.joiningPreference}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end md:self-center">
                            <button
                              onClick={() => sendWhatsAppConfirmation(booking)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-xs font-semibold"
                              title="Send WhatsApp Confirmation"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </button>
                            <button
                              onClick={() => handleRescheduleClick(booking)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Reschedule booking"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(booking)}
                              disabled={deletingId === booking.id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Cancel booking"
                            >
                              {deletingId === booking.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
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

      <style jsx global>{`
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
