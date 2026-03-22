import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golf Edge Finder — Model vs. Market Analytics',
  description: 'Identify mispriced golf betting markets by comparing predictive model probabilities against live sportsbook odds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
