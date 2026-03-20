import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Study Generator — Science Inquiry Tool',
  description: 'AI-powered diagnostic case study generator for high school science teachers. Create backward-designed patient cases that tunnel students toward biology, chemistry, neuroscience, and medical biochemistry content.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
