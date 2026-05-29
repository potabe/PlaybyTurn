import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/context/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://urturn.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "UrTurn — Smart Sports Session Organizer",
    template: "%s | UrTurn",
  },
  description:
    "Organize your racket and paddle sports sessions effortlessly. Automated matchmaking, live score tracking, and shareable spectator views for Padel, Badminton, Tennis, and Table Tennis.",
  keywords: [
    "padel", "badminton", "tennis", "table tennis",
    "sports organizer", "match scheduler", "americano", "session tracker",
  ],
  authors: [{ name: "UrTurn" }],
  creator: "UrTurn",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UrTurn",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "UrTurn",
    title: "UrTurn — Smart Sports Session Organizer",
    description:
      "Stop calculating, start playing. Automated matchmaking, live score tracking, and real-time spectator views for Padel, Badminton, Tennis, and Table Tennis.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "UrTurn — Smart Sports Session Organizer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UrTurn — Smart Sports Session Organizer",
    description: "Stop calculating, start playing. Smart session organizer for racket sports.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>
              <TooltipProvider>
                <OfflineBanner />
                {children}
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
