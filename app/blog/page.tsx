"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { blogPosts } from "../../content/blog";
import siteJson from "../../content/site.json";
import { ARROW } from "../../components/SiteText";
import type { SiteContent } from "../../lib/content";

const site = siteJson as SiteContent;

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const [page, setPage] = useState(1);
  const categories = ["All topics", ...Array.from(new Set(blogPosts.map(post => post.category)))];
  const filtered = useMemo(() => blogPosts
    .filter(post => category === "All topics" || post.category === category)
    .filter(post => (post.title + " " + post.excerpt + " " + post.category + " " + post.content).toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), [query, category]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function updateQuery(value: string) { setQuery(value); setPage(1); }
  function updateCategory(value: string) { setCategory(value); setPage(1); }

  return <main className="wrap blog-shell">
    <header className="nav">
      <Link className="brand-lockup" href="/"><span className="brand">{site.brand.mark}<span>.</span></span><span className="brand-copy"><b>{site.brand.title}</b><small>{site.brand.tagline}</small></span></Link>
      <nav className="links" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#about">About</Link><Link href="/#experience">Experience</Link><Link href="/#work">Projects</Link><Link href="/blog" aria-current="page" className="active">Blog</Link><Link href="/#contact">Contact</Link></nav>
      <Link className="nav-cta" href="/#contact">Let’s connect {ARROW}</Link>
    </header>

    <section className="blog-hero">
      <div className="kicker">WRITING / NOTES / RESOURCES</div>
      <h1>Education, recruitment &amp; <span className="green">career pathways.</span></h1>
      <p>Practical insights on education marketing, international student recruitment, education agent partnerships, Australian trade qualifications and career pathways.</p>
      <div className="blog-controls">
        <label className="blog-search"><span aria-hidden="true">⌕</span><input aria-label="Search articles" value={query} onChange={event => updateQuery(event.target.value)} placeholder="Search articles..." /></label>
        <label className="blog-category"><span className="sr-only">Filter by category</span><select value={category} onChange={event => updateCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="blog-results-count">{filtered.length} {filtered.length === 1 ? "ARTICLE" : "ARTICLES"}{query ? " MATCHING YOUR SEARCH" : " IN THE JOURNAL"}</div>
    </section>

    {visible.length ? <section className="blog-card-grid" aria-label="Blog articles">
      {visible.map((post, index) => <article className="blog-card" key={post.slug}>
        <div className="blog-card-art"><span className="blog-card-index">ARTICLE / {String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</span><div className="blog-art-orbit orbit-one"/><div className="blog-art-orbit orbit-two"/><div className="blog-art-core">S<span>.</span></div><span className="blog-card-art-label">{post.category.toUpperCase()}</span></div>
        <div className="blog-card-body"><div className="blog-card-meta"><span>{post.category}</span><time dateTime={post.publishedAt}>{new Date(post.publishedAt + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</time></div><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link className="blog-read-link" href={`/blog/${post.slug}`}>Read article <span>{ARROW}</span></Link></div>
      </article>)}
    </section> : <div className="blog-empty"><h2>No articles found</h2><p>Try another search term or choose a different category.</p><button className="btn" onClick={() => { updateQuery(""); updateCategory("All topics"); }}>Clear filters</button></div>}

    {pageCount > 1 && <nav className="blog-pagination" aria-label="Blog pages"><button className="btn" disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Previous</button><span>PAGE {page} OF {pageCount}</span><button className="btn" disabled={page === pageCount} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next →</button></nav>}
    <footer className="footer blog-footer"><Link className="brand" href="/">{site.brand.mark}<span>.</span></Link><span>© {new Date().getFullYear()}{" "+site.footer.copyrightName}</span><div className="footer-socials">{site.socials.map(s => <a key={s.label + s.url} href={s.url} target="_blank" rel="noreferrer">{`${s.label} ${ARROW}`}</a>)}</div><Link href="/">Back to portfolio ↑</Link></footer>
  </main>;
}
