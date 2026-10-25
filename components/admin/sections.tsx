"use client";
import { useState } from "react";
import BlogContent from "../BlogContent";
import { slugify, type BlogPost, type Education, type Experience, type Project, type Recommendation, type Service, type Skill, type Social, type Stat, type Link } from "../../lib/content";
import { Group, HeadingFields, ImageField, ListEditor, SectionHeadingFields, StringList, Text, getIn, useEditor, type Path } from "./fields";
import styles from "./admin.module.css";

export function ProfileSection() {
  return <>
    <Group title="Profile">
      <Text path={["name"]} label="Full name" required hint="Used in the footer, page titles and as the default blog author." />
      <Text path={["headline"]} label="Professional headline" />
      <Text path={["location"]} label="Location" />
    </Group>
    <Group title="Brand">
      <Text path={["brand", "mark"]} label="Logo letter" required />
      <Text path={["brand", "title"]} label="Brand name" required />
      <Text path={["brand", "tagline"]} label="Brand tagline" wide />
    </Group>
    <ListEditor<Link> path={["nav", "links"]} label="Navigation links" itemLabel="Link" newItem={() => ({ label: "", href: "#" })}
      title={l => l.label} subtitle={l => l.href}
      render={base => <><Text path={[...base, "label"]} label="Label" required /><Text path={[...base, "href"]} label="Link" required hint="#section, /page or https://…" /></>} />
    <Group title="Navigation button">
      <Text path={["nav", "cta", "label"]} label="Label" required />
      <Text path={["nav", "cta", "href"]} label="Link" required />
    </Group>
    <Group title="Hero">
      <Text path={["hero", "greeting"]} label="Greeting" placeholder="Hi, I’m" />
      <Text path={["hero", "greetingName"]} label="Greeting name" />
      <Text path={["hero", "greetingEmoji"]} label="Greeting emoji" />
      <Text path={["hero", "eyebrow"]} label="Eyebrow" />
      <HeadingFields path={["hero", "title"]} label="Main title" />
      <Text path={["hero", "intro"]} label="Intro paragraph" required multiline rows={4} />
      <Text path={["hero", "primaryCta", "label"]} label="Primary button label" required />
      <Text path={["hero", "primaryCta", "href"]} label="Primary button link" required />
      <Text path={["hero", "secondaryCta", "label"]} label="Secondary button label" required />
      <Text path={["hero", "secondaryCta", "href"]} label="Secondary button link" required />
      <Text path={["hero", "initials"]} label="Initials" required hint="Shown in the avatar and the large monogram." />
      <Text path={["hero", "monogramCaption"]} label="Monogram caption" />
      <Text path={["hero", "captionTitle"]} label="Caption title" />
      <Text path={["hero", "captionText"]} label="Caption text" />
      <Text path={["hero", "artNote"]} label="Artwork note" />
      <Text path={["hero", "scrollNote"]} label="Scroll prompt" />
      <Text path={["hero", "nameSmall"]} label="Name line (small)" placeholder="Md Rakibul Islam" />
      <Text path={["hero", "nameLarge"]} label="Name line (large italic)" placeholder="Sabbir" />
      <StringList path={["hero", "words"]} label="Rotating giant words" itemLabel="Word" hint="Shown one at a time behind the photo wheel. Short words work best." />
    </Group>
  </>;
}

export function HeroPhotosSection() {
  return <ListEditor<{ src: string; alt: string }> path={["hero", "photos"]} label="Hero photos" itemLabel="Photo"
    hint="Portrait photos (about 3:4, e.g. 900 × 1200 px) rotate on the wheel in the hero. Use 5 or more for the smoothest loop. Until you add some, the highlight cards are shown instead."
    newItem={() => ({ src: "", alt: "" })} title={p => p.alt || "Photo"} subtitle={p => p.src}
    render={base => <><ImageField path={[...base, "src"]} label="Photo" /><Text path={[...base, "alt"]} label="Description" hint="Describe the photo for screen readers, e.g. Sabbir presenting at a student expo." wide /></>} />;
}

export function StatsSection() {
  return <ListEditor<Stat> path={["stats"]} label="Highlight cards" itemLabel="Card"
    hint="Highlight cards. They appear on the hero photo wheel until you add hero photos."
    newItem={() => ({ icon: "◆", title: "", caption: "" })} title={s => s.title} subtitle={s => s.caption}
    render={base => <><Text path={[...base, "icon"]} label="Icon" /><Text path={[...base, "title"]} label="Title" required /><Text path={[...base, "caption"]} label="Caption" wide /></>} />;
}

export function AboutSection() {
  return <>
    <SectionHeadingFields id="about" subtitle={false} />
    <Group title="About text"><StringList path={["about"]} label="Paragraphs" itemLabel="Paragraph" multiline /></Group>
  </>;
}

export function ExperienceSection() {
  return <>
    <SectionHeadingFields id="experience" />
    <ListEditor<Experience> path={["experience"]} label="Roles" itemLabel="Role"
      newItem={() => ({ role: "", company: "", period: "", category: "", description: "", bullets: [] })}
      title={x => x.role} subtitle={x => [x.company, x.period].filter(Boolean).join(" · ")}
      render={base => <>
        <Text path={[...base, "role"]} label="Job title" required />
        <Text path={[...base, "company"]} label="Organisation" required />
        <Text path={[...base, "period"]} label="Period" required placeholder="Mar 2026 — Present" />
        <Text path={[...base, "category"]} label="Category / location" />
        <Text path={[...base, "description"]} label="Summary" multiline />
        <StringList path={[...base, "bullets"]} label="Achievements" itemLabel="Bullet" multiline />
      </>} />
  </>;
}

export function EducationSection() {
  return <>
    <Group title="Label"><Text path={["education", "label"]} label="Label" placeholder="EDUCATION" /></Group>
    <ListEditor<Education> path={["education", "items"]} label="Qualifications" itemLabel="Qualification"
      newItem={() => ({ qualification: "", institution: "", location: "", status: "" })}
      title={e => e.qualification} subtitle={e => e.institution}
      render={base => <>
        <Text path={[...base, "qualification"]} label="Qualification" required wide />
        <Text path={[...base, "institution"]} label="Institution" required />
        <Text path={[...base, "location"]} label="Location" />
        <Text path={[...base, "status"]} label="Status / dates" placeholder="Expected completion 2027" />
      </>} />
  </>;
}

export function SkillsSection() {
  return <>
    <SectionHeadingFields id="services" />
    <ListEditor<Skill> path={["skillDetails"]} label="Skills" itemLabel="Skill"
      hint="Shown in the animated skills scroller. The description appears under the scroller when the skill is active."
      newItem={() => ({ name: "", desc: "" })} title={s => s.name} subtitle={s => s.desc}
      render={base => <><Text path={[...base, "name"]} label="Skill" required /><Text path={[...base, "desc"]} label="Description" multiline rows={2} /></>} />
  </>;
}

export function ProjectsSection() {
  return <>
    <SectionHeadingFields id="work" />
    <ListEditor<Project> path={["projects"]} label="Projects" itemLabel="Project"
      newItem={() => ({ title: "", category: "", description: "", artLabel: "", symbol: "↗", tags: [], linkLabel: "Discuss project", linkHref: "#contact", image: "" })}
      title={p => p.title} subtitle={p => p.category}
      render={base => <>
        <Text path={[...base, "title"]} label="Title" required />
        <Text path={[...base, "category"]} label="Category" />
        <Text path={[...base, "description"]} label="Description" multiline />
        <ImageField path={[...base, "image"]} label="Cover image (optional)" hint="Shown behind the card artwork. Leave empty to keep the default artwork only." />
        <Text path={[...base, "artLabel"]} label="Artwork label" />
        <Text path={[...base, "symbol"]} label="Artwork symbol" />
        <StringList path={[...base, "tags"]} label="Tags" itemLabel="Tag" />
        <Text path={[...base, "linkLabel"]} label="Link label" />
        <Text path={[...base, "linkHref"]} label="Link" />
      </>} />
  </>;
}

export function ServicesSection() {
  return <ListEditor<Service> path={["services"]} label="Services" itemLabel="Service"
    hint="The homepage “What I bring” section currently shows the skills scroller, so this list is stored but not displayed on the page."
    newItem={() => ({ title: "", description: "" })} title={s => s.title}
    render={base => <><Text path={[...base, "title"]} label="Title" required /><Text path={[...base, "description"]} label="Description" multiline /></>} />;
}

export function RecommendationsSection() {
  return <>
    <SectionHeadingFields id="recommendations" />
    <ListEditor<Recommendation> path={["recommendations"]} label="Recommendations" itemLabel="Recommendation"
      newItem={() => ({ name: "", role: "", date: "", text: "" })} title={r => r.name} subtitle={r => r.role}
      render={base => <>
        <Text path={[...base, "name"]} label="Name" required />
        <Text path={[...base, "date"]} label="Date" placeholder="7 July 2026" />
        <Text path={[...base, "role"]} label="Role / title" wide />
        <Text path={[...base, "text"]} label="Recommendation" required multiline rows={6} hint="Leave a blank line between paragraphs." />
      </>} />
  </>;
}

function MarkdownField({ base }: { base: Path }) {
  const { doc } = useEditor();
  const [mode, setMode] = useState<"write" | "preview">("write");
  const content: string = getIn(doc, [...base, "content"]) ?? "";
  return <div className={styles.fieldWide}>
    <div className={styles.segmented} role="tablist" aria-label="Content view">
      <button type="button" role="tab" aria-selected={mode === "write"} onClick={() => setMode("write")}>Write</button>
      <button type="button" role="tab" aria-selected={mode === "preview"} onClick={() => setMode("preview")}>Preview</button>
    </div>
    {mode === "write"
      ? <Text path={[...base, "content"]} label="Content (Markdown)" required multiline rows={18} hint="Supports ## headings, **bold**, *italic*, [links](https://…), lists, > quotes and | tables |." />
      : <div className={styles.preview}>{content.trim() ? <BlogContent content={content} /> : <p className={styles.empty}>Nothing to preview yet.</p>}</div>}
  </div>;
}

export function BlogSection() {
  const { doc, set } = useEditor();
  const categories = Array.from(new Set(doc.blog.map(p => p.category).filter(Boolean)));
  return <>
    <datalist id="blog-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
    <ListEditor<BlogPost> path={["blog"]} label="Blog posts" itemLabel="Post"
      hint="The blog lists posts newest first by date. Changing the slug of a published post changes its URL."
      newItem={() => ({ slug: "", title: "", category: categories[0] || "", publishedAt: new Date().toISOString().slice(0, 10), excerpt: "", author: doc.name, content: "" })}
      title={p => p.title} subtitle={p => [p.publishedAt, p.category].filter(Boolean).join(" · ")}
      render={(base, post) => <>
        <Text path={[...base, "title"]} label="Title" required wide onChange={v => {
          // Keep the slug in sync with the title until it is edited by hand.
          set(base, { ...post, title: v, slug: !post.slug || post.slug === slugify(post.title) ? slugify(v) : post.slug });
        }} />
        <Text path={[...base, "slug"]} label="Slug" required hint={`/blog/${post.slug || "…"}`} />
        <Text path={[...base, "category"]} label="Category" required list="blog-categories" />
        <Text path={[...base, "publishedAt"]} label="Publish date" required type="date" />
        <Text path={[...base, "author"]} label="Author" required />
        <Text path={[...base, "excerpt"]} label="Excerpt" required multiline rows={3} count={200} hint="Shown on the blog list and used as the search description." />
        <MarkdownField base={base} />
      </>} />
  </>;
}

export function ContactSection() {
  return <>
    <Group title="Contact">
      <Text path={["email"]} label="Email address" required type="email" hint="The “Let’s talk” link opens this address." />
      <Text path={["contact", "caption"]} label="Animation caption" />
    </Group>
    <Group title="Section heading">
      <Text path={["sections", "contact", "kicker"]} label="Kicker" />
      <HeadingFields path={["sections", "contact", "title"]} label="Heading" hint="The highlighted words become the email link." />
    </Group>
    <ListEditor<Social> path={["socials"]} label="Social links" itemLabel="Social link"
      newItem={() => ({ label: "", url: "https://" })} title={s => s.label} subtitle={s => s.url}
      render={base => <><Text path={[...base, "label"]} label="Label" required /><Text path={[...base, "url"]} label="URL" required type="url" /></>} />
    <Group title="Footer">
      <Text path={["footer", "copyrightName"]} label="Copyright name" required />
      <Text path={["footer", "backToTop"]} label="Back-to-top label" />
    </Group>
  </>;
}

export function SeoSection() {
  return <Group title="Search & social sharing" hint="Applies to the homepage and as the default for other pages. Blog posts use their own title and excerpt.">
    <Text path={["seo", "title"]} label="Page title" required wide count={70} />
    <Text path={["seo", "description"]} label="Meta description" required multiline rows={3} count={160} />
    <Text path={["seo", "shareDescription"]} label="Social share description" multiline rows={2} count={200} hint="Used for link previews. Falls back to the meta description." />
    <ImageField path={["seo", "image"]} label="Social preview image" hint="1200 × 630 px JPG or PNG works best." />
  </Group>;
}
