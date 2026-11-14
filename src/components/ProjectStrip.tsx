"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition } from "react";
import type { Media } from "@/lib/content";

export type StripCard = {
  slug: string;
  number: string;
  name: string;
  cover?: Media;
  coverFocus: number;
};

/** Horizontal, swipeable row of project covers. Arrow buttons for mouse users. */
export function ProjectStrip({ cards }: { cards: StripCard[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="strip">
      <div className="strip-track" ref={track}>
        {cards.map((card) => {
          const ratio = card.cover?.width && card.cover.height ? card.cover.width / card.cover.height : 1.3;
          return (
            <Link
              key={card.slug}
              href={`/projets/${card.slug}`}
              className="strip-tile"
              style={{ aspectRatio: String(Math.min(Math.max(ratio, 0.8), 1.6)) }}
            >
              {card.cover?.width && card.cover.height ? (
                <ViewTransition name={`cover-${card.slug}`} share="morph" default="none">
                  <Image
                    src={card.cover.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 80vw, 480px"
                    style={{ objectPosition: `center ${card.coverFocus * 100}%` }}
                  />
                </ViewTransition>
              ) : null}
              <span className="strip-label">
                <b>{card.number}</b>
                {card.name}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="strip-controls">
        <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label="Projets précédents">
          ←
        </button>
        <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label="Projets suivants">
          →
        </button>
      </div>
    </div>
  );
}
