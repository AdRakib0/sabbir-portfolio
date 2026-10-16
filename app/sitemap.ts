import type { MetadataRoute } from "next";
import { blogPosts } from "@/content/blog";

// Keep this aligned with the primary public domain configured in Vercel.
const siteUrl = "https://islamsabbir.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const newestPostDate = posts[0]?.publishedAt;
  const blogLastModified = newestPostDate ? new Date(newestPostDate) : undefined;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      ...(blogLastModified ? { lastModified: blogLastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Avoid duplicate URLs if content data is accidentally repeated.
  const uniquePages = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const page of [...staticPages, ...articlePages]) {
    uniquePages.set(page.url, page);
  }

  return [...uniquePages.values()];
}
