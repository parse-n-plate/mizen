import type { Metadata } from "next";
import { Domine, Albert_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const domine = Domine({
  variable: "--font-domine",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const albertSans = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mizen",
  description: "Clean recipes, calm cooking.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${domine.variable} ${albertSans.variable} antialiased`}>
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
