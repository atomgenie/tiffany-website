/**
 * Shape of the project content in src/content/projets/*.json (see the `edit-content` skill).
 */

/** Rich text: a list of [text, decorations?] segments. Decorations: ["b"] bold (green keyword), ["i"], ["s"], ["_"],
 * ["c"] code, ["a", href] link, ["h", color] color. */
export type RichSegment = [string, ([string] | [string, string])[]?];
export type RichText = RichSegment[];

/** A file under public/: src is its URL path, width/height its pixel size (required for images). */
export type Media = { src: string; width?: number | null; height?: number | null };

export type BlockDisplay = {
  /** Display width in px (images, videos, PDFs); omitted = full content width. */
  width?: number;
  height?: number;
  fullWidth?: boolean;
  pageWidth?: boolean;
  align?: "left" | "center" | "right";
};

export type Block = {
  type: string;
  color?: string;
  rich?: RichText;
  children?: Block[];
  /** File size shown next to PDFs and files ("26,1 Mo"); "large" on a quote. */
  size?: string;
  start?: number;
  icon?: string;
  ratio?: number;
  title?: string;
  caption?: RichText;
  display?: BlockDisplay;
  media?: Media;
  youtube?: string;
};
