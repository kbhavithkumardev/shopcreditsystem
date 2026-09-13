import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CreditShop - Digital Credit & Shop Platform',
  description: 'Modern Credit-First Shop Management & Business Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
