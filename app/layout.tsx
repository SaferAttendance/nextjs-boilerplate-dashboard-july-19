// app/layout.tsx
import 'app/globals.css';
import type { ReactNode } from 'react';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Safer Attendance',
  description: 'Ensuring Safety One Class At A Time While Promoting Attendance',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-montserrat antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
