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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning // Prevents React warning from the theme script below
    >
      <head>
        {/* Script to set theme before page paints to avoid flashing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
        
        {/* Simple Branding Header */}
        <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            
            {/* Left: Church Logo/Identity */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 2h4v7h7v4h-7v9h-4v-9H3V9h7V2z" />
              </svg>
              <span className="font-bold text-lg tracking-wide text-gray-800 dark:text-gray-100">
                Zimmerman SDA
              </span>
            </div>

          </div>
        </header>

        {/* Main Content Area - flex-1 pushes footer down */}
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 mt-auto text-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Zimmerman SDA Church. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Support our mission and community programs.
          </p>
        </footer>

      </body>
    </html>
  );
}