import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Government High School Babi Khel',
  description: 'Official website of GHS Babi Khel — Student portal, results, timetable and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.875rem',
              fontWeight: '600',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            },
          }}
        />
      </body>
    </html>
  )
}
