import { Fragment } from "react";
import type { Heading } from "../lib/content";

// Renders text with "\n" as line breaks.
export function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return <>{parts.map((part, i) => <Fragment key={i}>{i > 0 && <br/>}{part}</Fragment>)}</>;
}

// iOS draws some symbols (↗, ✳, …) as colour emoji unless they carry the text-style selector U+FE0E.
const EMOJI_CAPABLE = /([\u2194-\u2199\u21a9\u21aa\u2733\u2734\u2747\u2714\u2716\u2122\u2139])(?![\ufe0e\ufe0f])/g;
export const sym = (text: string) => text.replace(EMOJI_CAPABLE, "$1\ufe0e");
export const ARROW = sym("↗");

export function SectionTitle({ heading }: { heading: Heading }) {
  return <h2><Lines text={heading.text}/><span className={heading.tone}>{heading.highlight}</span></h2>;
}
