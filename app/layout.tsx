import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Study Generator — Science Inquiry Tool',
  description: 'AI-powered diagnostic case study generator for high school science teachers. Create backward-designed patient cases that tunnel students toward biology, chemistry, neuroscience, and medical biochemistry content.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
