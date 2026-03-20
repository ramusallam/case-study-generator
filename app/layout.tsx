import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Study Generator',
  description: 'Generate editable, classroom-ready diagnostic case studies for high school science teachers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
