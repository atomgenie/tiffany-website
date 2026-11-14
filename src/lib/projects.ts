import type { Block, Media } from "@/lib/content";
import leGoutDuVietnam from "@/content/projets/le-gout-du-vietnam.json";
import pretARecolter from "@/content/projets/pret-a-recolter.json";
import lePotagerGourmand from "@/content/projets/le-potager-gourmand.json";
import trainworld from "@/content/projets/trainworld.json";
import laRetirada from "@/content/projets/la-retirada.json";
import museum from "@/content/projets/museum.json";
import textileDeFoire from "@/content/projets/textile-de-foire.json";
import recherchesPlastiques from "@/content/projets/recherches-plastiques.json";
import entreOmbreEtLumiere from "@/content/projets/entre-ombre-et-lumiere-2023.json";
import bibliothequesWebToPrint from "@/content/projets/bibliotheques-web-to-print-2023.json";
import sleepStud from "@/content/projets/sleep-stud-2023.json";
import stageAgencePlaymaker from "@/content/projets/stage-agence-playmaker-2023.json";
import thisIsNotALoveSong from "@/content/projets/this-is-not-a-love-song-2022.json";
import utkFace from "@/content/projets/utk-face-2022.json";
import respire from "@/content/projets/respire-2022.json";
import respire2 from "@/content/projets/respire-2-2022.json";
import abondance from "@/content/projets/abondance-2022.json";

/**
 * One JSON file per project in src/content/projets/, its media in public/projets/<slug>/.
 * This list sets the order on the site, and so the numbers 01, 02… Add a new project here.
 */
const entries = [
  leGoutDuVietnam,
  pretARecolter,
  lePotagerGourmand,
  trainworld,
  laRetirada,
  museum,
  textileDeFoire,
  recherchesPlastiques,
  entreOmbreEtLumiere,
  bibliothequesWebToPrint,
  sleepStud,
  stageAgencePlaymaker,
  thisIsNotALoveSong,
  utkFace,
  respire,
  respire2,
  abondance,
] as unknown as ProjectEntry[];

type ProjectEntry = {
  /** URL: /projets/<slug>. Same as the JSON file name. */
  slug: string;
  name: string;
  subtitle?: string;
  year?: number;
  context?: string;
  cover?: Media;
  /** Vertical focus of the cover when cropped, 0 = top, 1 = bottom. */
  coverFocus?: number;
  links?: { label: string; href: string }[];
  blocks: Block[];
};

export type Project = Omit<ProjectEntry, "coverFocus" | "links"> & {
  number: string;
  coverFocus: number;
  links: { label: string; href: string }[];
  /** Giant initial at the end of the page, as in the PDF ("R" for La Retirada, "V" for Vietnam). */
  letter: string;
};

/** Initial of the last meaningful word: "Le goût du Vietnam" → V, "Textile de foire" → f. */
function initial(name: string): string {
  const words = name.split(/[\s’']+/).filter((w) => /^\p{L}{4,}/u.test(w));
  return (words.at(-1) ?? name).charAt(0);
}

export const projects: Project[] = entries.map((p, i) => ({
  ...p,
  number: String(i + 1).padStart(2, "0"),
  coverFocus: p.coverFocus ?? 0.5,
  links: p.links ?? [],
  letter: initial(p.name),
}));

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function nextProject(project: Project): Project {
  return projects[(projects.indexOf(project) + 1) % projects.length];
}
