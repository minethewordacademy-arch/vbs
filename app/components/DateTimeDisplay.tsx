"use client";

import { useState, useEffect } from "react";

export default function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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