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
  metadataBase: new URL("https://countdown-00-git-main-aketarasiromes-projects.vercel.app"),
  title: "Life Countdown",
  description: "Visualize how you spend the remaining hours of the year.",
  openGraph: {
    title: "Life Countdown",
    description: "Visualize how you spend the remaining hours of the year.",
    url: "/",
    siteName: "Life Countdown",
    images: [
      {
        url: "/ogp.png",
        width: 1200,
        height: 630,
        alt: "Life Countdown dashboard",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Countdown",
    description: "Visualize how you spend the remaining hours of the year.",
    images: ["/ogp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}