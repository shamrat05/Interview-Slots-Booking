import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interview Scheduler | Book Your Slot',
  description: 'Book your interview slot easily and efficiently. Choose from available time slots and schedule your interview.',
  keywords: ['interview', 'scheduler', 'booking', 'slot', 'appointment'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {children}
      </body>
    </html>
  )
}
