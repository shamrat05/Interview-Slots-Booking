import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LevelAxis | Interview Scheduler',
  description: 'Book your interview slot with LevelAxis',
};

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
