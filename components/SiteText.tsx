import { Fragment } from "react";
import type { Heading } from "../lib/content";

// Renders text with "\n" as line breaks.
export function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return <>{parts.map((part, i) => <Fragment key={i}>{i > 0 && <br/>}{part}</Fragment>)}</>;
}

export function SectionTitle({ heading }: { heading: Heading }) {
  return <h2><Lines text={heading.text}/><span className={heading.tone}>{heading.highlight}</span></h2>;
}
