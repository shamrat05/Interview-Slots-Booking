import { google } from 'googleapis';
import { storage } from './slots';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/auth/callback`
);

export function getAuthUrl(adminSecret: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
    state: adminSecret // Pass secret to verify on callback
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function createCalendarEvent(booking: {
  name: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const refreshToken = await storage.getGoogleToken();
  if (!refreshToken) return null;

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: `Interview with ${booking.name}`,
    description: `Interview scheduled via LevelAxis Scheduler. Applicant: ${booking.name} (${booking.email})`,
    start: {
      dateTime: `${booking.date}T${booking.startTime}:00`,
      timeZone: 'Asia/Dhaka',
    },
    end: {
      dateTime: `${booking.date}T${booking.endTime}:00`,
      timeZone: 'Asia/Dhaka',
    },
    attendees: [{ email: booking.email }],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return {
      meetLink: response.data.hangoutLink || null,
      eventId: response.data.id || null
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const refreshToken = await storage.getGoogleToken();
  if (!refreshToken || !eventId) return false;

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}
