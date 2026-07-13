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
  title: "Membership — Palm Vintage Philadelphia",
  description:
    "Exclusive chauffeur membership and special event experiences at Palm Vintage, inside the Ritz-Carlton Philadelphia.",
  openGraph: {
    title: "Membership — Palm Vintage Philadelphia",
    description:
      "Exclusive chauffeur membership and special event experiences at Palm Vintage.",
    url: "https://thepalmvintage.com/membership",
    siteName: "Palm Vintage Philadelphia",
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
