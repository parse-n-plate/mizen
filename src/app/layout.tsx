import type { Metadata } from "next";
import { Domine, Albert_Sans } from "next/font/google";
import { Agentation } from "agentation";
import { AppShell } from "@/components/AppShell";
import { developerFeedbackToolsEnabled } from "@/lib/features";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSync } from "@/components/ThemeSync";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/* eslint-disable @next/next/no-img-element */

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
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#242424" media="(prefers-color-scheme: dark)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('mizen:core-app-seen')==='true'&&sessionStorage.getItem('mizen:splash-seen')!=='true'){document.documentElement.dataset.earlySplash='true'}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${domine.variable} ${albertSans.variable} antialiased`}>
        <div id="mizen-early-splash" aria-hidden="true">
          <div className="mizen-early-splash-scale">
            <div className="mizen-early-splash-icons">
              <div className="mizen-early-splash-icon mizen-early-splash-icon-0">
                <div className="mizen-early-splash-clip">
                  <img
                    alt=""
                    draggable={false}
                    src="/assets/splash/tomato.png"
                    className="mizen-early-splash-img mizen-early-splash-img-tomato"
                  />
                </div>
              </div>
              <div className="mizen-early-splash-icon mizen-early-splash-icon-1">
                <img
                  alt=""
                  draggable={false}
                  src="/assets/splash/tomato-slice.png"
                  className="mizen-early-splash-img mizen-early-splash-img-slice"
                />
              </div>
              <div className="mizen-early-splash-icon mizen-early-splash-icon-2">
                <div className="mizen-early-splash-clip">
                  <img
                    alt=""
                    draggable={false}
                    src="/assets/splash/tomato-half.png"
                    className="mizen-early-splash-img mizen-early-splash-img-half"
                  />
                </div>
              </div>
              <div className="mizen-early-splash-icon mizen-early-splash-icon-3">
                <div className="mizen-early-splash-clip">
                  <img
                    alt=""
                    draggable={false}
                    src="/assets/splash/pan.png"
                    className="mizen-early-splash-img mizen-early-splash-img-pan"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
        <ThemeSync />
        <Toaster />
        {process.env.NODE_ENV === "development" && developerFeedbackToolsEnabled && (
          <Agentation endpoint="http://localhost:4747" />
        )}
      </body>
    </html>
  );
}
