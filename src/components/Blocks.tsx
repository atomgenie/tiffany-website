import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { PaperclipIcon } from "@/components/icons";
import { colorClass, RichText } from "@/components/RichText";
import type { Block, BlockDisplay, Media } from "@/lib/content";

function cx(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

/** Width style shared by images, videos and PDFs: `display.width` in px, else the full content width. */
function mediaWidth(display: BlockDisplay | undefined, natural?: number | null): CSSProperties {
  if (display?.fullWidth || display?.pageWidth) return { width: "100%" };
  const width = display?.width ?? natural;
  return width ? { width, maxWidth: "100%" } : { width: "100%" };
}

function Figure({ block, children }: { block: Block; children: ReactNode }) {
  const align = block.display?.align ?? "center";
  return (
    <figure className={cx("block-asset", `block-align-${align}`)}>
      {children}
      {block.caption?.length ? (
        <figcaption className="block-caption">
          <RichText value={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}

function ImageBlock({ block }: { block: Block }) {
  const media = block.media as Media;
  const style = mediaWidth(block.display, media.width);
  const displayWidth = typeof style.width === "number" ? style.width : 1200;
  const alt = block.caption?.map(([t]) => t).join("") ?? "";
  return (
    <Figure block={block}>
      <div className="block-image" style={style}>
        {media.width && media.height ? (
          <Image
            src={media.src}
            alt={alt}
            width={media.width}
            height={media.height}
            sizes={`(max-width: 900px) 100vw, ${displayWidth}px`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.src} alt={alt} loading="lazy" />
        )}
      </div>
    </Figure>
  );
}

function VideoBlock({ block }: { block: Block }) {
  const { width, height } = block.display ?? {};
  const style = mediaWidth(block.display);
  if (block.youtube) {
    return (
      <Figure block={block}>
        <div className="block-embed" style={{ ...style, aspectRatio: width && height ? `${width} / ${height}` : "16 / 9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${block.youtube}?rel=0`}
            title={block.title || "YouTube"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </Figure>
    );
  }
  return (
    <Figure block={block}>
      <video className="block-video" style={style} src={block.media?.src} controls playsInline preload="metadata" />
    </Figure>
  );
}

function PdfBlock({ block }: { block: Block }) {
  const src = block.media?.src ?? "";
  const name = block.title || src.split("/").pop();
  return (
    <Figure block={block}>
      <div className="block-pdf" style={mediaWidth(block.display)}>
        <iframe src={`${src}#navpanes=0&view=FitH`} title={name} style={{ height: block.display?.height ?? 720 }} loading="lazy" />
        <a className="block-pdf-link" href={src} target="_blank" rel="noopener noreferrer">
          <PaperclipIcon />
          <span>{name}</span>
        </a>
      </div>
    </Figure>
  );
}

function FileBlock({ block }: { block: Block }) {
  return (
    <a className="block-file" href={block.media?.src} target="_blank" rel="noopener noreferrer">
      <PaperclipIcon />
      <span className="block-file-title">{block.title}</span>
    </a>
  );
}

function BlockView({ block }: { block: Block }) {
  const color = colorClass(block.color);
  const children = block.children?.length ? <Blocks blocks={block.children} /> : null;

  switch (block.type) {
    case "text":
      return (
        <>
          <div className={cx("block-text", color)}>
            <RichText value={block.rich} />
            {!block.rich?.length && " "}
          </div>
          {children && <div className="block-indent">{children}</div>}
        </>
      );
    case "header":
      return <h2 className={cx("block-h1", color)}><RichText value={block.rich} /></h2>;
    case "sub_header":
      return <h3 className={cx("block-h2", color)}><RichText value={block.rich} /></h3>;
    case "sub_sub_header":
      return <h4 className={cx("block-h3", color)}><RichText value={block.rich} /></h4>;
    case "quote":
      return (
        <blockquote className={cx("block-quote", block.size === "large" && "block-quote-large", color)}>
          <RichText value={block.rich} />
          {children}
        </blockquote>
      );
    case "bulleted_list":
    case "numbered_list":
      return (
        <li className={color}>
          <RichText value={block.rich} />
          {children}
        </li>
      );
    case "callout":
      return (
        <div className={cx("block-callout", color ?? "block-callout-plain")}>
          {block.icon ? <span className="block-callout-emoji">{block.icon}</span> : null}
          <div className="block-callout-body">
            {block.rich?.length ? <div className="block-text"><RichText value={block.rich} /></div> : null}
            {children}
          </div>
        </div>
      );
    case "divider":
      return <hr className="block-divider" />;
    case "column_list": {
      const columns = block.children ?? [];
      const gaps = columns.length - 1;
      return (
        <div className="block-columns">
          {columns.map((column, i) => (
            <div
              key={i}
              className="block-column"
              style={{ "--column-width": `calc((100% - ${gaps} * var(--column-gap)) * ${column.ratio ?? 1 / columns.length})` } as CSSProperties}
            >
              <Blocks blocks={column.children ?? []} />
            </div>
          ))}
        </div>
      );
    }
    case "image":
      return <ImageBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "pdf":
      return <PdfBlock block={block} />;
    case "file":
      return <FileBlock block={block} />;
    default:
      return null;
  }
}

/** Renders a list of blocks, grouping consecutive list items into <ul>/<ol>. Static content: index keys are fine. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "bulleted_list" || block.type === "numbered_list") {
      const items: Block[] = [];
      while (blocks[i]?.type === block.type) items.push(blocks[i++]);
      i--;
      const List = block.type === "bulleted_list" ? "ul" : "ol";
      out.push(
        <List key={i} className={`block-list block-list-${List}`} start={List === "ol" ? block.start : undefined}>
          {items.map((item, j) => (
            <BlockView key={j} block={item} />
          ))}
        </List>,
      );
    } else {
      out.push(<BlockView key={i} block={block} />);
    }
  }
  return <>{out}</>;
}
