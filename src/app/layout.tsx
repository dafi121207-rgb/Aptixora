import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ToastProvider } from '@/context/toast-context';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aptixora — Platform Operasional UMKM',
  description:
    'Satu platform untuk digitalisasi Barbershop, Salon, dan Laundry. Booking real-time, Kanban, laporan, dan antrean pintar dalam satu aplikasi.',
  openGraph: {
    title: 'Aptixora — Platform Operasional UMKM',
    description:
      'Digitalisasi bisnis UMKM Anda: Barbershop, Salon, Laundry. Booking, Kanban, antrean pintar.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${sans.variable} ${display.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
