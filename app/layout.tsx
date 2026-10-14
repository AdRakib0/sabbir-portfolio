import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Md Rakibul Islam Sabbir | Portfolio", description: "Marketing, technology and career pathways." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
