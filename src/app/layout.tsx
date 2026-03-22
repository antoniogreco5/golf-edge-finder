import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golf Edge Finder | DG Model vs Prediction Markets',
  description: 'Find discrepancies between DataGolf model probabilities and Robinhood/Kalshi prediction market prices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise-overlay min-h-screen">
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
