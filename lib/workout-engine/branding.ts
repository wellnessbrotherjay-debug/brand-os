import { Inter, Montserrat, Orbitron, Rajdhani } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const FONT_OPTIONS = {
  orbitron: { id: "orbitron", label: "Orbitron", font: orbitron },
  inter: { id: "inter", label: "Inter", font: inter },
  rajdhani: { id: "rajdhani", label: "Rajdhani", font: rajdhani },
  montserrat: { id: "montserrat", label: "Montserrat", font: montserrat },
} as const;

export type FontKey = keyof typeof FONT_OPTIONS;

export interface FontSettings {
  heading: FontKey;
  body: FontKey;
  numeric: FontKey;
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  heading: "orbitron",
  body: "inter",
  numeric: "orbitron",
};

export function resolveFontSettings(fonts?: Partial<FontSettings> | null): FontSettings {
  return {
    heading: fonts?.heading ?? DEFAULT_FONT_SETTINGS.heading,
    body: fonts?.body ?? DEFAULT_FONT_SETTINGS.body,
    numeric: fonts?.numeric ?? DEFAULT_FONT_SETTINGS.numeric,
  };
}

export function getFontConfig(fonts?: Partial<FontSettings> | null) {
  const settings = resolveFontSettings(fonts);
  return {
    heading: FONT_OPTIONS[settings.heading].font,
    body: FONT_OPTIONS[settings.body].font,
    numeric: FONT_OPTIONS[settings.numeric].font,
  };
}

export function getFontFamilies(fonts?: Partial<FontSettings> | null) {
  const config = getFontConfig(fonts);
  return {
    heading: config.heading.style.fontFamily,
    body: config.body.style.fontFamily,
    numeric: config.numeric.style.fontFamily,
  };
}

export function getFontClasses(fonts?: Partial<FontSettings> | null) {
  const config = getFontConfig(fonts);
  return {
    heading: { className: config.heading.className, variable: config.heading.variable },
    body: { className: config.body.className, variable: config.body.variable },
    numeric: { className: config.numeric.className, variable: config.numeric.variable },
  };
}
