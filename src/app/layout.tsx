import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import NotificationManager from "@/components/NotificationManager";
import ToastProvider from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SubSmart - 구독 관리 & 스마트 가계부",
  description: "내 구독을 한눈에 관리하고, 지출을 똑똑하게 분석하세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SubSmart",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <ThemeProvider>
          <NotificationManager>
            <ToastProvider />
            {children}
          </NotificationManager>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
