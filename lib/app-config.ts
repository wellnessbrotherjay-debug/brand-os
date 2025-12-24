type AppMode = "hotel" | "gym";

const rawMode =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_MODE) ||
  (typeof process !== "undefined" && process.env.APP_MODE) ||
  "hotel";

const appMode: AppMode = rawMode === "gym" ? "gym" : "hotel";

const baseFeatures = {
  menuOrders: true,
  events: true,
  bodyScans: true,
  hr: true,
  workouts: true,
  classes: true,
  profile: true,
};

const hotelExtras = {
  pos: false,
  circuitMode: false,
  workoutBuilder: false,
  tests: false,
};

const gymExtras = {
  pos: true,
  circuitMode: true,
  workoutBuilder: true,
  tests: true,
};

const featureFlags = {
  ...(baseFeatures as const),
  ...("gym" === appMode ? gymExtras : hotelExtras),
};

export function getAppConfig() {
  return {
    mode: appMode,
    isHotel: appMode === "hotel",
    isGym: appMode === "gym",
    features: featureFlags,
  };
}

export type AppConfig = ReturnType<typeof getAppConfig>;
