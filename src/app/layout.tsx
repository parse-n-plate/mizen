import React from 'react';
import type { Metadata } from 'next';
import { Domine, Albert_Sans } from 'next/font/google';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/footer';
import { AdminSettingsProvider } from '@/contexts/AdminSettingsContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { ParsedRecipesProvider } from '@/contexts/ParsedRecipesContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { CommandKProvider } from '@/contexts/CommandKContext';
import { Toaster } from '@/components/ui/sonner';
import ImageProtection from '@/components/ImageProtection';
import './globals.css';

// Default fonts: Domine for headings (serif), Albert Sans for body (sans-serif)
const domine = Domine({
  variable: '--font-domine',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const albertSans = Albert_Sans({
  variable: '--font-albert',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Parse and Plate',
  description: 'Ad free recipes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${domine.variable} ${albertSans.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AdminSettingsProvider>
          <RecipeProvider>
            <ParsedRecipesProvider>
              <TimerProvider>
                <CommandKProvider>
                  <ImageProtection />
                  <Navbar />
                  {children}
                  <Footer />
                  <Toaster />
                </CommandKProvider>
              </TimerProvider>
            </ParsedRecipesProvider>
          </RecipeProvider>
        </AdminSettingsProvider>
      </body>
    </html>
  );
}
