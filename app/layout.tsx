import '../global.css';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Safer Attendance - Complete School Safety & Attendance Management',
  description: 'School safety platform with attendance, emergency response, and parent communication.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${montserrat.variable} font-montserrat bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`}>
        {children}
      </body>
    </html>
  )
}
