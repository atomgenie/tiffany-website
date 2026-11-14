import Link from "next/link";
import type { ReactNode } from "react";
import type { RichText as RichTextValue } from "@/lib/content";

export function colorClass(color?: string): string | undefined {
  if (!color || color === "default") return undefined;
  return color.endsWith("_background") ? `block-bg-${color.slice(0, -11)}` : `block-color-${color}`;
}

export function RichText({ value }: { value?: RichTextValue }) {
  if (!value?.length) return null;
  return (
    <>
      {value.map(([text, decorations = []], i) => {
        let node: ReactNode = text;
        let href: string | undefined;
        for (const [kind, arg] of decorations) {
          switch (kind) {
            case "b":
              node = <strong>{node}</strong>;
              break;
            case "i":
              node = <em>{node}</em>;
              break;
            case "s":
              node = <s>{node}</s>;
              break;
            case "_":
              node = <u>{node}</u>;
              break;
            case "c":
              node = <code className="block-inline-code">{node}</code>;
              break;
            case "h":
              node = <span className={colorClass(arg)}>{node}</span>;
              break;
            case "a":
              href = arg;
              break;
          }
        }
        if (href) {
          node = href.startsWith("/") ? (
            <Link className="block-link" href={href}>
              {node}
            </Link>
          ) : (
            <a className="block-link" href={href} target="_blank" rel="noopener noreferrer">
              {node}
            </a>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}
