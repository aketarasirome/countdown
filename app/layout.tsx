import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://countdown-00.vercel.app"),
  title: {
    default: "Countdown Clock",
    template: "%s | Countdown Clock",
  },
  description: "Countdown clock visualizing how you spend the remaining hours of the year."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}