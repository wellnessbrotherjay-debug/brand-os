"use client";

export type LiveHeartRateSample = {
  id: string;
  participantName: string;
  heartRate: number;
  zone: number;
  timestamp: number;
};

type Subscriber = (sample: LiveHeartRateSample) => void;

export function subscribeHeartRate(callback: Subscriber) {
  const interval = setInterval(() => {
    const sample: LiveHeartRateSample = {
      id: crypto.randomUUID(),
      participantName: ["Nadia", "Kai", "Jordan", "Amari"][Math.floor(Math.random() * 4)],
      heartRate: 120 + Math.floor(Math.random() * 60),
      zone: 2 + Math.floor(Math.random() * 3),
      timestamp: Date.now(),
    };
    callback(sample);
  }, 2500);

  return () => clearInterval(interval);
}
