"use client";

import { useState, useEffect } from "react";

export default function DateTimeDisplay() {
  // Initialize as null so server & first client render match perfectly
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set the time immediately once mounted on the client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTime(new Date());

    // Then update every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // On server render & first client render, show a stable placeholder
  if (!currentTime) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono tracking-wide h-4">
        Loading time...
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono tracking-wide">
      {currentTime.toLocaleDateString("en-KE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}{" "}
      at{" "}
      {currentTime.toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </div>
  );
}