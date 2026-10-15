import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../../../content/blog";
import BlogContent from "../../../components/BlogContent";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return blogPosts.map(post => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = blogPosts.find(item => item.slug === params.slug);
  if (!post) return { title: "Article not found | Sabbir" };
  return { title: `${post.title} | Md Rakibul Islam Sabbir`, description: post.excerpt };
}

export default function BlogArticlePage({ params }: Props) {
  const post = blogPosts.find(item => item.slug === params.slug);
  if (!post) notFound();
  const published = new Date(post.publishedAt + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return <main className="wrap blog-shell">
    <header className="nav">
      <Link className="brand-lockup" href="/"><span className="brand">S<span>.</span></span><span className="brand-copy"><b>RAKIBUL ISLAM SABBIR</b><small>MARKETING · TECHNOLOGY · GROWTH</small></span></Link>
      <nav className="links" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#about">About</Link><Link href="/#experience">Experience</Link><Link href="/#work">Projects</Link><Link href="/blog" className="active">Blog</Link><Link href="/#contact">Contact</Link></nav>
      <Link className="nav-cta" href="/#contact">Let’s connect ↗</Link>
    </header>
    <article className="blog-article">
      <Link href="/blog" className="blog-back">← Back to all articles</Link>
      <header className="blog-article-header">
        <div className="kicker">{post.category.toUpperCase()} · 2026 EDITION</div>
        <h1>{post.title}</h1>
        <p className="blog-article-excerpt">{post.excerpt}</p>
        <div className="blog-article-byline"><span className="person-mark">RS</span><span><b>{post.author}</b><small>{published} · Educational guide</small></span></div>
      </header>
      <div className="blog-article-rule"/>
      <BlogContent content={post.content} />
      <div className="blog-article-end"><span>END OF ARTICLE</span><Link href="/blog">Explore more articles ↗</Link></div>
    </article>
    <footer className="footer blog-footer"><Link className="brand" href="/">S<span>.</span></Link><span>© {new Date().getFullYear()} Md Rakibul Islam Sabbir</span><div className="footer-socials"><a href="https://www.linkedin.com/in/islamsabbir/" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://www.facebook.com/md.rakibul.islam.sabbir.2025" target="_blank" rel="noreferrer">Facebook ↗</a></div><Link href="/">Back to portfolio ↑</Link></footer>
  </main>;
}
