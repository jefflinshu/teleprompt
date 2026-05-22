import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TelePrompt — Free Online Teleprompter with Voice Tracking",
  description:
    "Free browser-based teleprompter with real-time voice tracking. Auto-scroll follows your pace, highlights text as you read. Built for livestreaming and speeches.",
  keywords: [
    "teleprompter",
    "voice tracking teleprompter",
    "online prompter",
    "auto scroll teleprompter",
    "speech recognition prompter",
    "livestream teleprompter",
    "free teleprompter",
    "video recording prompter",
    "public speaking tool",
    "mirror teleprompter",
  ],
  openGraph: {
    title: "TelePrompt — Free Online Teleprompter with Voice Tracking",
    description:
      "Free browser-based teleprompter with real-time voice tracking. Auto-scroll follows your pace, highlights text as you read. Built for livestreaming and speeches.",
    siteName: "TelePrompt",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TelePrompt — Free Online Teleprompter with Voice Tracking",
    description:
      "Free browser-based teleprompter with real-time voice tracking. Auto-scroll follows your pace, highlights text as you read. Built for livestreaming and speeches.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "production" && (
          <Script
            async
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
