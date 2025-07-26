// app/layout.tsx
import '../globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Safer Attendance',
  description: 'Ensuring Safety One Class At A Time While Promoting Attendance',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
