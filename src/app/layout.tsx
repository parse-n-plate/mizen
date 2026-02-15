import React from 'react';
import type { Metadata } from 'next';
import { Domine, Albert_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import AppShell from '@/components/ui/AppShell';
import { AdminSettingsProvider } from '@/contexts/AdminSettingsContext';
import { RecipeProvider } from '@/contexts/RecipeContext';
import { ParsedRecipesProvider } from '@/contexts/ParsedRecipesContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { CommandKProvider } from '@/contexts/CommandKContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { PrototypeLabProvider } from '@/contexts/PrototypeLabContext';
import { AdminPrototypingPanel } from '@/components/ui/admin-prototyping-panel';
import { Toaster } from '@/components/ui/sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Agentation } from 'agentation';
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
  icons: {
    // Standard favicons for browsers
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    // Apple touch icon for iOS devices
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    // Note: Android icons are configured in site.webmanifest
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${domine.variable} ${albertSans.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AdminSettingsProvider>
            <RecipeProvider>
              <ParsedRecipesProvider>
                <TimerProvider>
                  <CommandKProvider>
                    <SidebarProvider>
                      <PrototypeLabProvider>
                        <ImageProtection />
                        <AppShell>{children}</AppShell>
                        <Toaster />
                        <SpeedInsights />
                        {process.env.NODE_ENV === 'development' && <Agentation />}
                        {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') && <AdminPrototypingPanel />}
                      </PrototypeLabProvider>
                    </SidebarProvider>
                  </CommandKProvider>
                </TimerProvider>
              </ParsedRecipesProvider>
            </RecipeProvider>
          </AdminSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
