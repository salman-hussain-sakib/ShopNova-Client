import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIAssistant from '@/components/AIAssistant';
import ThreeExperience from '@/components/ThreeExperience';

export const metadata: Metadata = {
  title: 'ShopNova — AI-Powered E-Commerce',
  description: 'Discover curated products with intelligent AI recommendations and a conversational shopping assistant.',
  icons: {
    icon: '/favicon.jpg',
    apple: '/apple-touch-icon.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col gpu-layer" suppressHydrationWarning>
        <Providers>
          <ThreeExperience />
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <AIAssistant />
        </Providers>
      </body>
    </html>
  );
}
