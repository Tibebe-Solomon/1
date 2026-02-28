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
  description: "Vynthen AI – minimalistic AI chat experience"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="no-tap-highlight">
      <head>
        <script
          type="module"
          dangerouslySetInnerHTML={{
            __html: `
              import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
              import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";

              const firebaseConfig = {
                apiKey: "AIzaSyBwCrc9wSo2xFWlNnXNiaYJtsKxNsm7D2c",
                authDomain: "vynthen-4fdd3.firebaseapp.com",
                projectId: "vynthen-4fdd3",
                storageBucket: "vynthen-4fdd3.firebasestorage.app",
                messagingSenderId: "643798998548",
                appId: "1:643798998548:web:38db67b0e4684ad8889101",
                measurementId: "G-QM5B892CNB"
              };

              const app = initializeApp(firebaseConfig);
              const analytics = getAnalytics(app);
            `
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <VynthenProvider>{children}</VynthenProvider>
      </body>
    </html>
  );
}

