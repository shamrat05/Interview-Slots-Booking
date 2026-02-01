import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: {
    default: 'LevelAxis | Interview Scheduler - Book Your Professional Interview',
    template: '%s | LevelAxis'
  },
  description: 'Streamline your recruitment process with LevelAxis Interview Scheduler. Book, manage, and track your interview slots efficiently with our modern booking system.',
  keywords: ['interview scheduler', 'booking system', 'LevelAxis', 'recruitment tool', 'interview slots', 'job interview', 'scheduling software', 'technical interview', 'LevelAxis HQ'],
  authors: [{ name: 'LevelAxis' }],
  creator: 'LevelAxis',
  publisher: 'LevelAxis',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://interview-slots-booking.vercel.app/'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LevelAxis | Interview Scheduler - Book Your Professional Interview',
    description: 'Book your interview slot with LevelAxis. The most efficient way to manage your interview schedule for professional growth.',
    url: 'https://interview-slots-booking.vercel.app/',
    siteName: 'LevelAxis Interview Scheduler',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LevelAxis Interview Scheduler',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LevelAxis | Interview Scheduler',
    description: 'Book your interview slot with LevelAxis efficiently and professionally.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'googlea08b6067f166eadc',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
