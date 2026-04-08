import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Zimmerman Pledge Tracker",
    template: "%s | Zimmerman SDA Church",
  },
  description: "Support our community by pledging food items, cash, or supplies for church events and ministries.",
  keywords: ["pledge", "food drive", "community support", "Zimmerman SDA", "camp meeting", "children ministry"],
  authors: [{ name: "Zimmerman SDA Church" }],
  creator: "Zimmerman SDA Church",
  publisher: "Zimmerman SDA Church",
  metadataBase: new URL("https://vbs-red.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Zimmerman Pledge Tracker",
    description: "Support our community by pledging food items, cash, or supplies for church events and ministries.",
    url: "https://vbs-red.vercel.app",
    siteName: "Zimmerman Pledge Tracker",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zimmerman Pledge Tracker - Support our community",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zimmerman Pledge Tracker",
    description: "Support our community by pledging food items, cash, or supplies.",
    images: ["/og-image.png"],
    creator: "@zimmersda",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}