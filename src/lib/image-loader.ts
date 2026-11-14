/**
 * next/image loader for the static export (STATIC_EXPORT=1, see next.config.ts).
 * There is no image optimizer at runtime, so each <Image> points at a pre-resized WebP:
 * /projets/x/photo.jpg at 640 px → /_img/projets/x/photo.jpg.640.webp
 * scripts/export-static.mjs finds these URLs in the exported HTML and generates the files.
 */
export default function staticImageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  return `/_img${src}.${width}.webp`;
}
