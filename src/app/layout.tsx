import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golf Edge Finder — Model vs. Market Analytics',
  description: 'Compare predictive model probabilities against live sportsbook pricing to identify value in golf betting markets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
