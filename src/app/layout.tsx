import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ShieldSDS — OSHA HazCom Compliance for Small Businesses",
  description:
    "Keep your safety data sheets, container labels, chemical inventory, and training records organized, current, and inspection-ready.",
  metadataBase: new URL("https://shieldsds.vercel.app"),
  openGraph: {
    title: "ShieldSDS — OSHA HazCom Compliance Made Simple",
    description:
      "SDS management, container labels, chemical inventory, employee training, and inspection readiness — all in one platform built for small businesses.",
    siteName: "ShieldSDS",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShieldSDS — OSHA HazCom Compliance Made Simple",
    description:
      "SDS management, container labels, chemical inventory, employee training, and inspection readiness — all in one platform.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
