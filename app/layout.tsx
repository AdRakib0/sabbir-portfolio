import type { Metadata } from "next";
import "./globals.css";
import siteJson from "../content/site.json";
import type { SiteContent } from "../lib/content";

const { seo, name } = (siteJson as SiteContent);
const shareDescription = seo.shareDescription || seo.description;
const images = seo.image ? [{ url: seo.image }] : undefined;

const siteUrl = "https://islamsabbir.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seo.title,
    template: `%s | ${name}`,
  },
  description: seo.description,
  applicationName: `${name} Portfolio`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: name,
    title: seo.title,
    description: shareDescription,
    locale: "en_AU",
    images,
  },
  twitter: {
    card: seo.image ? "summary_large_image" : "summary",
    title: seo.title,
    description: shareDescription,
    images,
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
