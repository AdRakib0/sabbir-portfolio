import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://islamsabbir.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Md Rakibul Islam Sabbir | Education Marketing & Student Recruitment",
    template: "%s | Md Rakibul Islam Sabbir",
  },
  description:
    "Explore the portfolio of Md Rakibul Islam Sabbir, an education marketing and international student recruitment professional focused on education partnerships, digital campaigns, Australian trade career pathways and practical resources.",
  applicationName: "Md Rakibul Islam Sabbir Portfolio",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Md Rakibul Islam Sabbir",
    title: "Md Rakibul Islam Sabbir | Education Marketing & Student Recruitment",
    description:
      "Education marketing, international student recruitment, agency partnerships, digital campaigns and Australian trade career pathway resources.",
    locale: "en_AU",
  },
  twitter: {
    card: "summary",
    title: "Md Rakibul Islam Sabbir | Education Marketing & Student Recruitment",
    description:
      "Portfolio and insights on education marketing, international student recruitment and Australian trade career pathways.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
