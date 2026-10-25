"use client";
import siteJson from "../content/site.json";
import SkillScroller from "../components/SkillScroller";
import HeroCinematic from "../components/HeroCinematic";
import ProjectsDeck from "../components/ProjectsDeck";
import ContactConnection from "../components/ContactConnection";
import RecommendationsMarquee from "../components/RecommendationsMarquee";
import { ARROW, Lines, SectionTitle, sym } from "../components/SiteText";
import type { SiteContent } from "../lib/content";
const site = siteJson as SiteContent;
const floatCards = ["card-strategy", "card-tech", "card-learning"];
export default function Home(){
const {hero,sections:sec}=site;
return <main className="wrap" id="home">
<header className="nav"><a className="brand-lockup" href="#home"><span className="brand">{site.brand.mark}<span>.</span></span><span className="brand-copy"><b>{site.brand.title}</b><small>{site.brand.tagline}</small></span></a><nav className="links">{site.nav.links.map(l=><a key={l.label+l.href} href={l.href}>{l.label}</a>)}</nav><a className="nav-cta" href={site.nav.cta.href}>{sym(site.nav.cta.label)}</a></header>
<HeroCinematic hero={hero} stats={site.stats} location={site.location}/>
<section id="about"><div className="kicker">{sec.about.kicker}</div><div className="about"><SectionTitle heading={sec.about.title}/><div>{site.about.map((p,i)=><p key={i}>{p}</p>)}</div></div></section>
<section id="experience"><div className="kicker">{sec.experience.kicker}</div><div className="section-heading"><SectionTitle heading={sec.experience.title}/>{sec.experience.subtitle&&<p>{sec.experience.subtitle}</p>}</div><div className="timeline">{site.experience.map((x,i)=><article className="role" key={x.company+x.role}><span className="number">0{i+1}</span><div><small>{x.period} · {x.category}</small><h3>{x.role}</h3><div className="company">{x.company}</div><p>{x.description}</p><ul>{x.bullets.map((b)=><li key={b}>{b}</li>)}</ul></div><span className="arrow">{ARROW}</span></article>)}</div>{site.education.items.length>0&&<div className="education-line"><span>{site.education.label}</span>{site.education.items.map(e=><div key={e.qualification+e.institution}><b>{e.qualification}</b><small>{[e.institution,e.location,e.status].filter(Boolean).join(" · ")}</small></div>)}</div>}</section>
<ProjectsDeck projects={site.projects} kicker={sec.work.kicker} heading={<SectionTitle heading={sec.work.title}/>} subtitle={sec.work.subtitle}/>
<section id="services"><div className="kicker">{sec.services.kicker}</div><div className="section-heading"><SectionTitle heading={sec.services.title}/>{sec.services.subtitle&&<p>{sec.services.subtitle}</p>}</div><div className="solar-art" aria-hidden="true"><span className="solar-orbit solar-orbit-a"><i/></span><span className="solar-orbit solar-orbit-b"><i/></span><span className="solar-orbit solar-orbit-c"><i/></span><span className="solar-core"><i/></span><span className="solar-glint"/></div><SkillScroller items={site.skillDetails} /></section>
<section id="recommendations"><div className="kicker">{sec.recommendations.kicker}</div><div className="section-heading"><SectionTitle heading={sec.recommendations.title}/>{sec.recommendations.subtitle&&<p>{sec.recommendations.subtitle}</p>}</div><RecommendationsMarquee items={site.recommendations}/></section>
<ContactConnection kicker={sec.contact.kicker} contact={site.contact} email={site.email} socials={site.socials} status={site.contact.status}/>
<footer className="footer"><a className="brand" href="#home">{site.brand.mark}<span>.</span></a><span>© {new Date().getFullYear()}{" "+site.footer.copyrightName}</span><div className="footer-socials">{site.socials.map(s=><a key={s.label+s.url} href={s.url} target="_blank" rel="noreferrer">{`${s.label} ${ARROW}`}</a>)}</div><a href="#home">{site.footer.backToTop}</a></footer></main>}
