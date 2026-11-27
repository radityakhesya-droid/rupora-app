import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { RuporaProvider } from '@/context/RuporaContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'RUPORA — See the market. Understand your moves.',
  description: 'Trader portofolio dan pemantauan pasar keuangan Indonesia berbasis investasi.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#356DFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${manrope.variable} ${jakarta.variable}`}>
      <body className="antialiased selection:bg-[#EAF1FF] selection:text-[#356DFF] overflow-x-hidden antialiased">
        <RuporaProvider>{children}</RuporaProvider>
      </body>
    </html>
  );
}
