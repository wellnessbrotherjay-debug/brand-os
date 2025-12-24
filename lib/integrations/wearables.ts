"use client";

export type WearableSummary = {
  provider: "garmin" | "whoop" | "fitbit";
  lastSync: string;
  readiness: number;
};

export async function listLinkedWearables(userId: string) {
  console.info("Wearable sync placeholder for user", userId);
  const now = new Date();
  return [
    { provider: "garmin" as const, lastSync: now.toISOString(), readiness: 78 },
    {
      provider: "whoop" as const,
      lastSync: new Date(now.getTime() - 3600000).toISOString(),
      readiness: 83,
    },
  ];
}
