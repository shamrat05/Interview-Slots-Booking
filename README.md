# 🎯 LevelAxis Interview Scheduler

A professional, production-grade interview scheduling application built with **Next.js 14**, **Tailwind CSS**, and **Redis**. Optimized for speed, reliability, and mobile accessibility.

## 🚀 Key Features

### For Candidates
- **Dynamic Slot Selection**: Real-time availability reflecting current bookings and admin holds.
- **AM/PM Formatting**: User-friendly time display (9:00 AM – 12:00 AM).
- **Joining Intelligence**: Mandatory "Joining Preference" collection for better candidate screening.
- **Bangladesh (BD) Optimized**: Smart phone validation that automatically handles local formats.

### For Admins
- **Visual Schedule Manager**: Calendar-based interface to block/unblock slots or entire days instantly.
- **Manual Booking**: Ability to book candidates manually, even for "Held" slots.
- **Dynamic Settings**: Update work hours, slot durations, and WhatsApp templates directly from the UI.
- **Professional CRM**: Searchable candidate list with one-click WhatsApp confirmation buttons.
- **Data Export**: Professional CSV and Excel reports with clickable contact links.
- **Secure Sessions**: Persistent admin authentication that survives page refreshes.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Redis (Direct connection or Vercel KV)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Exports**: XLSX

---

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd interview-scheduler
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   # Admin Security
   ADMIN_SECRET=your_secure_password

   # Scheduler Defaults
   START_HOUR=9
   END_HOUR=24
   SLOT_DURATION_MINUTES=60
   BREAK_DURATION_MINUTES=15
   BOOKING_DAYS=14

   # Redis Configuration
   REDIS_URL="redis://default:password@host:port"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 🔒 Admin Password Management

The admin password is controlled by the `ADMIN_SECRET` environment variable.
- **To Change:** Simply update the value in your `.env.local` (local) or Vercel Dashboard (production) and redeploy/restart.
- **Persistence:** Once logged in, your session is securely stored in `sessionStorage`.

---

## 🗄️ Redis & Vercel KV Setup

This application is designed to work with any standard Redis instance or Vercel KV.

### Standard Redis (Upstash, RedisLabs, etc.)
1. Create a Redis instance.
2. Copy the connection string (format: `redis://...`).
3. Add it as `REDIS_URL` in your environment variables.

### Vercel KV
1. In your Vercel project, go to the **Storage** tab.
2. Create a new **KV** database.
3. Vercel will automatically add the necessary environment variables (`KV_URL`, `KV_REST_API_URL`, etc.). The application is pre-configured to detect these.

---

## 📦 Vercel Deployment

1. **Push your code** to GitHub.
2. **Import the project** into Vercel.
3. **Configure Environment Variables** in the Vercel Dashboard:
   - `ADMIN_SECRET`
   - `REDIS_URL` (or link your Vercel KV)
   - `START_HOUR`, `END_HOUR`, etc. (optional defaults)
4. **Deploy.** Vercel will build and host the application globally.

---

## 📄 License

© {new_date} LevelAxis. All rights reserved.  
For support or inquiries, please contact [shamrat@levelaxishq.com](mailto:shamrat@levelaxishq.com).