import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'digi-carts Admin',
  description: 'digi-carts Admin Dashboard',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50">{children}</body>
    </html>
  );
}
