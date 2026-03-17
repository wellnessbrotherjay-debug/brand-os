export type SystemFeature = {
  title: string;
  description: string;
  href: string;
  studios?: ('studio-a' | 'studio-b')[]; // Optional: if omitted, shown in both
};

export const systemFeatures: SystemFeature[] = [
  {
    title: "Gym TV Display",
    description: "Full lineup view for every gym station",
    href: "/display-tv",
    studios: ["studio-a", "studio-b"],
  },
  {
    title: "Gym HRM Wall",
    description: "Real-time heart rate monitoring for the floor",
    href: "/hrm-tv",
    studios: ["studio-a", "studio-b"],
  },
  {
    title: "Gym Timer Display",
    description: "Large-format timer for the workout stage",
    href: "/display-timer",
    studios: ["studio-a", "studio-b"],
  },
  {
    title: "Tablet Station Display",
    description: "Trainer tablet control (Single Exercise)",
    href: "/display-tablet/1",
    studios: ["studio-a"],
  },
  {
    title: "Studio B Split Display",
    description: "Horizontal split-screen station control",
    href: "/display-tablet/1",
    studios: ["studio-b"],
  },
  {
    title: "Room Workout Screen",
    description: "In-room guided workout experience for guests",
    href: "/tv/workout",
    studios: ["studio-a"],
  },
  {
    title: "Workout Builder",
    description: "Create and assign exercises to stations",
    href: "/builder",
  },
  {
    title: "Venue Manager",
    description: "Add venues, logos, and brand colors",
    href: "/venues",
  },
  {
    title: "HRM Management",
    description: "Heart rate monitor control center",
    href: "/hrm-management",
    studios: ["studio-a"],
  },
  {
    title: "Setup Console",
    description: "Configure stations, equipment, and branding",
    href: "/setup",
  },
];


export function getFeaturesForStudio(studioId: string): SystemFeature[] {
  return systemFeatures.filter(
    (f) => !f.studios || f.studios.includes(studioId as any)
  );
}
