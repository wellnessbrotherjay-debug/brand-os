"use client";

import { useEffect } from "react";
import { storage, type WorkoutSetup } from "@/lib/workout-engine/storage";
import { getFontClasses, getFontFamilies } from "@/lib/workout-engine/branding";

const CSS_VARIABLES = [
  ["--font-heading", "heading"],
  ["--font-body", "body"],
  ["--font-numeric", "numeric"],
] as const;

export default function BrandFontInitializer() {
  useEffect(() => {
    let activeClasses: string[] = [];

    const applyFonts = (setup: WorkoutSetup | null) => {
      const classes = getFontClasses(setup?.fonts);
      const families = getFontFamilies(setup?.fonts);

      const target = document.body;
      const root = document.documentElement;

      if (!target || !root) return;

      if (activeClasses.length) {
        target.classList.remove(...activeClasses);
      }

      const nextClasses = [
        classes.heading.className,
        classes.body.className,
        classes.numeric.className,
        classes.heading.variable,
        classes.body.variable,
        classes.numeric.variable,
      ];

      target.classList.add(...nextClasses);
      activeClasses = nextClasses;

      CSS_VARIABLES.forEach(([key, familyKey]) => {
        const family = families[familyKey as keyof typeof families];
        if (family) {
          root.style.setProperty(key, family);
        }
      });
    };

    applyFonts(storage.getSetup());

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<WorkoutSetup>).detail ?? storage.getSetup();
      applyFonts(detail ?? storage.getSetup());
    };

    window.addEventListener("workoutSetupUpdated", handleUpdate);

    return () => {
      window.removeEventListener("workoutSetupUpdated", handleUpdate);
      if (activeClasses.length) {
        document.body.classList.remove(...activeClasses);
      }
    };
  }, []);

  return null;
}
