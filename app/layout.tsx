import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieNotice from "./components/CookieNotice";
import BeforeUnloadHandler from "./components/BeforeUnloadHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marek's Strava App",
  description: "Webb apps for Strava enthusiasts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const KEY = 'topten-segments-theme';
                const saved = localStorage.getItem(KEY);
                const dark = saved === 'dark';
                document.documentElement.classList.toggle('dark', dark);
              } catch {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BeforeUnloadHandler>{children}</BeforeUnloadHandler>
        <CookieNotice />
      </body>
    </html>
  );
}
