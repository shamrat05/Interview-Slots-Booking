'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, AlertCircle, CheckCircle, Clock, Calendar, Video, ShieldCheck } from 'lucide-react';

interface GlobalConfig {
  startHour: number;
  endHour: number;
  slotDurationMinutes: number;
  breakDurationMinutes: number;
  numberOfDays: number;
  whatsappTemplate: string;
}

interface ConfigManagerProps {
  adminSecret: string;
}

export default function ConfigManager({ adminSecret }: ConfigManagerProps) {
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    fetchConfig();
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch(`/api/admin/config?secret=${encodeURIComponent(adminSecret)}`);
      const data = await response.json();
      if (data.success && data.isGoogleConnected) {
        setIsGoogleConnected(true);
      }
    } catch (err) {
      console.error('Failed to check google status');
    }
  };

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/config?secret=${encodeURIComponent(adminSecret)}`);
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        setError(data.error || 'Failed to fetch configuration');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/config?secret=${encodeURIComponent(adminSecret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary-600" />
          Global Scheduler Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure how interview slots are generated across all dates.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Working Hours
            </h3>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Hour (24h format)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={config.startHour}
                onChange={(e) => setConfig({ ...config, startHour: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">End Hour (24h format)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={config.endHour}
                onChange={(e) => setConfig({ ...config, endHour: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Slot Durations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Slot Logic
            </h3>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Slot Duration (minutes)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={config.slotDurationMinutes}
                onChange={(e) => setConfig({ ...config, slotDurationMinutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Break Duration (minutes)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={config.breakDurationMinutes}
                onChange={(e) => setConfig({ ...config, breakDurationMinutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Visibility & Communication
            </h3>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Number of Days to Show</label>
              <input
                type="number"
                min="1"
                max="30"
                value={config.numberOfDays}
                onChange={(e) => setConfig({ ...config, numberOfDays: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">WhatsApp Message Template</label>
              <textarea
                value={config.whatsappTemplate}
                onChange={(e) => setConfig({ ...config, whatsappTemplate: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
                placeholder="Hello {name}, your interview is at {time}..."
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Available placeholders: <span className="font-mono text-primary-600">{`{name}`}</span>, <span className="font-mono text-primary-600">{`{day}`}</span>, <span className="font-mono text-primary-600">{`{date}`}</span>, <span className="font-mono text-primary-600">{`{time}`}</span>, <span className="font-mono text-primary-600">{`{link}`}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Google Calendar Integration */}
        <div className="pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-primary-600" />
                Google Calendar Integration
              </h3>
              {isGoogleConnected ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  <ShieldCheck className="w-3 h-3" />
                  CONNECTED
                </span>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                  NOT CONNECTED
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Automatically create Google Calendar events with Google Meet links for every new booking. 
              The link will be available as <span className="font-mono font-bold text-primary-600">{`{link}`}</span> in your WhatsApp template.
            </p>

            {isGoogleConnected ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to disconnect Google Calendar?')) {
                    const res = await fetch(`/api/admin/config?secret=${encodeURIComponent(adminSecret)}`, { method: 'DELETE' });
                    if (res.ok) setIsGoogleConnected(false);
                  }
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                Disconnect Google Account
              </button>
            ) : (
              <a
                href={`/api/admin/auth/google?secret=${encodeURIComponent(adminSecret)}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Connect Google Calendar
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Configuration saved successfully! Changes will take effect immediately.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Configuration
            </>
          )}
        </button>
      </form>

      <div className="px-6 py-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Note:</strong> Changing these settings will regenerate all time slots. 
          Bookings that were already made will remain in the database but might not align with new slot timings if you change the durations significantly.
        </p>
      </div>
    </div>
  );
}

function Info({ className, ...props }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
