// Shared content types and validation, used by the public site, the admin editor and the publish API.

export type Link = { label: string; href: string };
export type Heading = { text: string; highlight: string; tone: "green" | "muted" };
export type SectionHeading = { kicker: string; title: Heading; subtitle: string };
export type Experience = { role: string; company: string; period: string; category: string; description: string; bullets: string[] };
export type Education = { qualification: string; institution: string; location: string; status: string };
export type Skill = { name: string; desc: string };
export type Project = { title: string; category: string; description: string; artLabel: string; symbol: string; tags: string[]; linkLabel: string; linkHref: string; image: string;
  role: string; year: string; tools: string; audience: string; challenge: string; did: string[];
  results: { value: string; label: string }[]; gallery: { src: string; alt: string }[]; extraLabel: string; extraHref: string };
export type Service = { title: string; description: string };
export type Recommendation = { name: string; role: string; date: string; text: string };
export type Stat = { icon: string; title: string; caption: string };
export type Social = { label: string; url: string };

export type SiteContent = {
  name: string;
  headline: string;
  email: string;
  location: string;
  brand: { mark: string; title: string; tagline: string };
  nav: { links: Link[]; cta: Link };
  hero: {
    greeting: string; greetingName: string; greetingEmoji: string; eyebrow: string; title: Heading; intro: string;
    primaryCta: Link; secondaryCta: Link; initials: string; captionTitle: string; captionText: string;
    monogramCaption: string; artNote: string; scrollNote: string;
    words: string[]; photos: { src: string; alt: string }[]; nameSmall: string; nameLarge: string;
  };
  stats: Stat[];
  sections: Record<"about" | "experience" | "work" | "services" | "recommendations" | "contact", SectionHeading>;
  about: string[];
  experience: Experience[];
  education: { label: string; items: Education[] };
  skillDetails: Skill[];
  projects: Project[];
  services: Service[];
  recommendations: Recommendation[];
  contact: { caption: string };
  socials: Social[];
  footer: { copyrightName: string; backToTop: string };
  seo: { title: string; description: string; shareDescription: string; image: string };
};

export type BlogPost = { slug: string; title: string; category: string; publishedAt: string; excerpt: string; author: string; content: string };

export type ValidationError = { path: string; message: string };

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// Walks a value with a small schema: "s" = required string, "o" = optional string, "a" = string array,
// [schema] = array of objects, {..} = nested object.
type Schema = "s" | "o" | "a" | Schema[] | { [key: string]: Schema };

const heading: Schema = { text: "o", highlight: "o", tone: "s" };
const section: Schema = { kicker: "o", title: heading, subtitle: "o" };
const link: Schema = { label: "s", href: "s" };

const siteSchema: Schema = {
  name: "s", headline: "o", email: "s", location: "o",
  brand: { mark: "s", title: "s", tagline: "o" },
  nav: { links: [link], cta: link },
  hero: {
    greeting: "o", greetingName: "o", greetingEmoji: "o", eyebrow: "o", title: { text: "s", highlight: "o", tone: "s" }, intro: "s",
    primaryCta: link, secondaryCta: link, initials: "s", captionTitle: "o", captionText: "o",
    monogramCaption: "o", artNote: "o", scrollNote: "o",
    words: "a", photos: [{ src: "s", alt: "o" }], nameSmall: "o", nameLarge: "o",
  },
  stats: [{ icon: "o", title: "s", caption: "o" }],
  sections: { about: section, experience: section, work: section, services: section, recommendations: section, contact: section },
  about: "a",
  experience: [{ role: "s", company: "s", period: "s", category: "o", description: "o", bullets: "a" }],
  education: { label: "o", items: [{ qualification: "s", institution: "s", location: "o", status: "o" }] },
  skillDetails: [{ name: "s", desc: "o" }],
  projects: [{ title: "s", category: "o", description: "o", artLabel: "o", symbol: "o", tags: "a", linkLabel: "o", linkHref: "o", image: "o",
    role: "o", year: "o", tools: "o", audience: "o", challenge: "o", did: "a", results: [{ value: "s", label: "o" }], gallery: [{ src: "s", alt: "o" }], extraLabel: "o", extraHref: "o" }],
  services: [{ title: "s", description: "o" }],
  recommendations: [{ name: "s", role: "o", date: "o", text: "s" }],
  contact: { caption: "o" },
  socials: [{ label: "s", url: "s" }],
  footer: { copyrightName: "s", backToTop: "o" },
  seo: { title: "s", description: "s", shareDescription: "o", image: "o" },
};

function walk(value: unknown, schema: Schema, path: string, errors: ValidationError[]) {
  if (schema === "s" || schema === "o") {
    if (typeof value !== "string") errors.push({ path, message: "Must be text." });
    else if (schema === "s" && !value.trim()) errors.push({ path, message: "Required." });
    return;
  }
  if (schema === "a") {
    if (!Array.isArray(value) || value.some(v => typeof v !== "string")) errors.push({ path, message: "Must be a list of text." });
    return;
  }
  if (Array.isArray(schema)) {
    if (!Array.isArray(value)) { errors.push({ path, message: "Must be a list." }); return; }
    value.forEach((item, i) => walk(item, schema[0], `${path}.${i}`, errors));
    return;
  }
  if (!isObj(value)) { errors.push({ path, message: "Missing section." }); return; }
  for (const key of Object.keys(schema)) walk(value[key], schema[key], path ? `${path}.${key}` : key, errors);
}

export function validateSite(site: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  walk(site, siteSchema, "", errors);
  if (errors.length || !isObj(site)) return errors;
  const s = site as SiteContent;
  if (!EMAIL_PATTERN.test(s.email)) errors.push({ path: "email", message: "Enter a valid email address." });
  const tones = (h: Heading, path: string) => { if (h.tone !== "green" && h.tone !== "muted") errors.push({ path: path + ".tone", message: "Choose green or muted." }); };
  tones(s.hero.title, "hero.title");
  for (const key of Object.keys(s.sections) as (keyof SiteContent["sections"])[]) tones(s.sections[key].title, `sections.${key}.title`);
  s.socials.forEach((x, i) => { if (!/^(https?:|mailto:|\/)/.test(x.url)) errors.push({ path: `socials.${i}.url`, message: "Use a full https:// link." }); });
  return errors;
}

export function validateBlog(posts: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  walk(posts, [{ slug: "s", title: "s", category: "s", publishedAt: "s", excerpt: "s", author: "s", content: "s" }], "blog", errors);
  if (errors.length || !Array.isArray(posts)) return errors;
  const seen = new Set<string>();
  (posts as BlogPost[]).forEach((p, i) => {
    if (!SLUG_PATTERN.test(p.slug)) errors.push({ path: `blog.${i}.slug`, message: "Use lowercase letters, numbers and dashes only." });
    else if (seen.has(p.slug)) errors.push({ path: `blog.${i}.slug`, message: "Another post already uses this slug." });
    seen.add(p.slug);
    if (!DATE_PATTERN.test(p.publishedAt) || isNaN(new Date(p.publishedAt + "T12:00:00").getTime())) errors.push({ path: `blog.${i}.publishedAt`, message: "Use a valid date." });
  });
  return errors;
}

export function slugify(text: string) {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
