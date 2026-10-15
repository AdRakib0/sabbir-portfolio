"use client";

import React from "react";

function inline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function BlogContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1].trim().replace(/^\|/, ""))) {
      const rows: string[][] = [];
      rows.push(line.replace(/^\||\|$/g, "").split("|").map(cell => cell.trim()));
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim()));
        i++;
      }
      blocks.push(<div className="blog-table-wrap" key={blocks.length}><table className="blog-table"><thead><tr>{rows[0].map((cell, n) => <th key={n}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, ri) => <tr key={ri}>{rows[0].map((_, ci) => <td key={ci}>{inline(row[ci] || "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (line.startsWith("### ")) { blocks.push(<h3 key={blocks.length}>{inline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={blocks.length}>{inline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("# ")) { blocks.push(<h2 key={blocks.length}>{inline(line.slice(2))}</h2>); i++; continue; }
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) { quote.push(lines[i].trim().slice(2)); i++; }
      blocks.push(<blockquote key={blocks.length}>{quote.map((q, n) => <p key={n}>{inline(q)}</p>)}</blockquote>);
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push(lines[i].trim().slice(2)); i++; }
      blocks.push(<ul key={blocks.length}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) { items.push(lines[i].trim().replace(/^\d+\. /, "")); i++; }
      blocks.push(<ol key={blocks.length}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</ol>);
      continue;
    }
    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |>|[-*] |\d+\. |\|)/.test(lines[i].trim())) {
      paragraph.push(lines[i].trim());
      i++;
    }
    blocks.push(<p key={blocks.length}>{paragraph.map(inline).reduce<React.ReactNode[]>((acc, value, n) => n ? [...acc, " ", ...value] : value, [])}</p>);
  }
  return <div className="blog-prose">{blocks}</div>;
}
