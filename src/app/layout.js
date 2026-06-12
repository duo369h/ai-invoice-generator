import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "./lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata = {
  title: {
    default: "InvoiceAI — Free AI Invoice & Receipt Generator for Freelancers",
    template: "%s | InvoiceAI",
  },
  description:
    "Create professional invoices and receipts in seconds with AI. Paste plain text, get structured documents. Export clean PDFs. Built for freelancers, contractors, and small businesses worldwide.",
  keywords: [
    "invoice generator",
    "receipt generator",
    "AI invoice",
    "freelancer invoice",
    "free invoice tool",
    "PDF invoice",
    "online invoice maker",
    "invoice creator",
    "receipt maker",
    "billing software",
    "freelance billing",
    "contractor invoice",
  ],
  authors: [{ name: "InvoiceAI Team" }],
  creator: "InvoiceAI",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "InvoiceAI — Free AI Invoice & Receipt Generator",
    description:
      "Create professional invoices and receipts in seconds with AI. Paste text, get structured documents. Export PDFs. Free for freelancers.",
    url: siteUrl,
    siteName: "InvoiceAI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoiceAI — Free AI Invoice & Receipt Generator",
    description:
      "Create professional invoices and receipts in seconds with AI. Free for freelancers and small businesses.",
  },
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
