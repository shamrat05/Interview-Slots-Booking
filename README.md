# Interview Scheduler

A production-grade interview slot booking website built with Next.js 14, Tailwind CSS, and serverless architecture. Deploy easily on Vercel with support for persistent storage.

## Features

### For Applicants
- 📅 **Dynamic Slot Selection**: View available interview slots for the next 3 days
- ⏰ **1-Hour Slots with Breaks**: 1-hour interview slots with 15-minute breaks between
- ✅ **Multi-Step Booking Flow**: Smooth 4-step process with validation
- 📱 **Mobile Responsive**: Works great on all device sizes
- 📱 **WhatsApp Integration**: Get reminders and updates via WhatsApp

### For Admins
- 🔐 **Secure Dashboard**: Password-protected admin panel
- 📊 **Booking Overview**: View all applicants and their details
- 🗑️ **Cancel Bookings**: Release slots for rescheduling
- 📈 **Statistics**: Quick overview of bookings and availability

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Validation**: Custom validation utilities
- **Deployment**: Vercel
- **Storage**: In-memory (demo) / Vercel KV / Supabase (production)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Vercel account (for deployment)

### Local Development

1. **Clone and install dependencies**
```bash
cd interview-scheduler
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
ADMIN_SECRET=your-secure-password
START_HOUR=9
END_HOUR=17
SLOT_DURATION_MINUTES=60
BREAK_DURATION_MINUTES=15
BOOKING_DAYS=3
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Admin Panel
Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin)

Default password: `admin123` (change in `.env.local`)

## Deployment to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/interview-scheduler.git
git push -u origin main
```

2. **Deploy on Vercel**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Add New Project"
- Import your GitHub repository
- Add environment variables in Vercel:
  - `ADMIN_SECRET`: Your secure admin password
  - `START_HOUR`: 9
  - `END_HOUR`: 17
  - `SLOT_DURATION_MINUTES`: 60
  - `BREAK_DURATION_MINUTES`: 15
  - `BOOKING_DAYS`: 3
- Click "Deploy"

### Option 2: Deploy with Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Follow the prompts to deploy.

## Production Storage

The demo uses in-memory storage which resets on server cold starts. For production use with persistent data, choose one:

### Option A: Vercel KV (Redis)

1. Create a Vercel KV database:
```bash
npx vercel kv create
```

2. Update `.env.local`:
```env
KV_URL=your-kv-url
KV_REST_API_URL=your-rest-api-url
KV_REST_API_TOKEN=your-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token
```

3. Update `lib/slots.ts` to use Redis instead of in-memory storage.

### Option B: Supabase (PostgreSQL)

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Create the bookings table:
```sql
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  slot_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, slot_id)
);

CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_slot ON bookings(date, slot_id);
```

3. Update environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Update `lib/slots.ts` to use Supabase client.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_SECRET` | Password for admin panel | `admin123` |
| `START_HOUR` | Start hour for slots (24h) | `9` |
| `END_HOUR` | End hour for slots (24h) | `17` |
| `SLOT_DURATION_MINUTES` | Duration of each interview | `60` |
| `BREAK_DURATION_MINUTES` | Break between slots | `15` |
| `BOOKING_DAYS` | Number of days to show | `3` |

### Slot Calculation Example

With default settings (9-17, 60min slots, 15min break):
- 09:00 - 10:00
- 10:15 - 11:15
- 11:30 - 12:30
- 12:45 - 13:45
- 14:00 - 15:00
- 15:15 - 16:15

## Project Structure

```
interview-scheduler/
├── app/
│   ├── api/
│   │   ├── slots/route.ts    # Slot booking API
│   │   └── admin/route.ts    # Admin management API
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main booking page
├── components/
│   └── BookingModal.tsx      # Multi-step booking modal
├── lib/
│   ├── slots.ts              # Slot generation & storage
│   ├── types.ts              # TypeScript types
│   └── validation.ts         # Form validation
├── public/                   # Static assets
├── .env.example              # Environment template
├── next.config.js            # Next.js config
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind config
└── tsconfig.json             # TypeScript config
```

## User Flow

1. **View Available Slots**: User sees slots for the next 3 days starting from tomorrow
2. **Select Time**: Click on an available time slot
3. **Enter Details**: Fill in name and email
4. **Confirmation**: Review details in confirmation step
5. **WhatsApp Number**: Add WhatsApp for reminders
6. **Book**: Submit booking with concurrency protection
7. **Success**: See confirmation with booking details

## Admin Flow

1. **Login**: Enter admin password
2. **Dashboard**: View all bookings grouped by date
3. **Manage**: Cancel bookings if needed
4. **Stats**: See booking statistics at a glance

## Validation

- **Name**: 2-100 characters, required
- **Email**: Valid email format, required
- **WhatsApp**: 10-15 digits with country code, required

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use for your projects!

## Support

For issues or questions, please open a GitHub issue or contact support@example.com.
