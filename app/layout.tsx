import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VynthenProvider } from "../context/VynthenContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Vynthen AI",
  description: "Vynthen AI – minimalistic, fast, intelligent AI assistant.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "Vynthen AI",
    description: "Fast, intelligent AI — your personal assistant.",
    siteName: "Vynthen AI",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Vynthen AI" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynthen AI",
    description: "Fast, intelligent AI — your personal assistant.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="no-tap-highlight">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <VynthenProvider>{children}</VynthenProvider>
      </body>
    </html>
  );
}
