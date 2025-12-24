"use client";

import { useEffect, useState } from "react";

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function useGreetingClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return {
    now,
    timeLabel: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    greeting: getGreeting(now),
  };
}

export { getGreeting };
