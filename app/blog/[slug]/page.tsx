import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../../../content/blog";
import siteJson from "../../../content/site.json";
import { ARROW } from "../../../components/SiteText";
import type { SiteContent } from "../../../lib/content";

const site = siteJson as SiteContent;
import BlogContent from "../../../components/BlogContent";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return blogPosts.map(post => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = blogPosts.find(item => item.slug === params.slug);
  if (!post) return { title: "Article not found", robots: { index: false, follow: true } };
  const keywordsByCategory: Record<string, string[]> = {
    "Career Pathways": [
      "Australian trade career pathways",
      "Australian trade qualifications",
      "TRA Job Ready Program",
      "Job Ready Program requirements",
      "ANZSCO occupation codes",
      "Provisional Skills Assessment",
      "Australian VET qualifications",
      "trade skills assessment Australia",
    ],
    "Education Marketing": [
      "education marketing",
      "international student recruitment",
      "education agent partnerships",
      "student recruitment campaigns",
    ],
    "Student Visas": [
      "Australian student visa information",
      "international student guidance",
      "Australian migration information",
    ],
  };
  const keywords = [
    post.title,
    post.category,
    "Md Rakibul Islam Sabbir",
    ...(keywordsByCategory[post.category] ?? []),
  ];
  return {
    title: post.title,
    description: post.excerpt,
    keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: new Date(post.publishedAt).toISOString(),
      authors: [post.author],
      url: `/blog/${post.slug}`,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default function BlogArticlePage({ params }: Props) {
  const post = blogPosts.find(item => item.slug === params.slug);
  if (!post) notFound();
  const published = new Date(post.publishedAt + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return <main className="wrap blog-shell">
    <header className="nav">
      <Link className="brand-lockup" href="/"><span className="brand">{site.brand.mark}<span>.</span></span><span className="brand-copy"><b>{site.brand.title}</b><small>{site.brand.tagline}</small></span></Link>
      <nav className="links" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#about">About</Link><Link href="/#experience">Experience</Link><Link href="/#work">Projects</Link><Link href="/blog" className="active">Blog</Link><Link href="/#contact">Contact</Link></nav>
      <Link className="nav-cta" href="/#contact">Let’s connect {ARROW}</Link>
    </header>
    <article className="blog-article">
      <Link href="/blog" className="blog-back">← Back to all articles</Link>
      <header className="blog-article-header">
        <div className="kicker">{post.category.toUpperCase()} · {post.publishedAt.slice(0, 4)} EDITION</div>
        <h1>{post.title}</h1>
        <p className="blog-article-excerpt">{post.excerpt}</p>
        <div className="blog-article-byline"><span className="person-mark">RS</span><span><b>{post.author}</b><small>{published} · Educational guide</small></span></div>
      </header>
      <div className="blog-article-rule"/>
      <BlogContent content={post.content} />
      <div className="blog-article-end"><span>END OF ARTICLE</span><Link href="/blog">Explore more articles {ARROW}</Link></div>
    </article>
    <footer className="footer blog-footer"><Link className="brand" href="/">{site.brand.mark}<span>.</span></Link><span>© {new Date().getFullYear()}{" "+site.footer.copyrightName}</span><div className="footer-socials">{site.socials.map(s => <a key={s.label + s.url} href={s.url} target="_blank" rel="noreferrer">{`${s.label} ${ARROW}`}</a>)}</div><Link href="/">Back to portfolio ↑</Link></footer>
  </main>;
}
