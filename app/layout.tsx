import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trace My Money",
  description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
  openGraph: {
    title: "Trace My Money",
    description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Trace My Money" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace My Money",
    description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
    images: ["/opengraph-image.png"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Estedad:wdth,wght@75,400;75,500;75,600;75,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
