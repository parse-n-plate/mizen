import React from "react";
import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {Separator} from "@/components/ui/separator";
import Navbar from "@/components/ui/Navbar";
import {RecipeProvider} from "@/contexts/RecipeContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parse and Plate",
  description: "Ad free recipes",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
    <RecipeProvider>
      <Navbar/>
      <Separator/>
      {children}
    </RecipeProvider>
    </body>
    </html>
  );
}
