import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Education Marketing, Student Recruitment & Career Pathways",
  description:
    "Articles and practical resources on education marketing, international student recruitment, agency partnerships, Australian trade qualifications, career pathways and skills assessment.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Blog | Education Marketing, Student Recruitment & Career Pathways",
    description:
      "Practical insights on education marketing, international student recruitment and Australian trade career pathways.",
    url: "/blog",
  },
};

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
