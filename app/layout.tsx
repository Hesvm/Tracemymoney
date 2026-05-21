import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trace My Money",
  description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
  openGraph: {
    title: "Trace My Money",
    description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies.",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace My Money",
    description: "A quiet visual money-mapping workspace. Track income, expenses, savings, and goals across currencies."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
