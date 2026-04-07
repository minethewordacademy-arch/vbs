// app/components/PledgeWidget.tsx
"use client";  // because we use state and events

import { useState } from "react";

export default function PledgeWidget() {
  const [pledgeCount, setPledgeCount] = useState(0);
  const goal = 100;
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePledge = () => {
    setPledgeCount((prev) => prev + 1);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const progressPercent = (pledgeCount / goal) * 100;

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 my-4">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        💚 Community Pledges
      </h2>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress to {goal} pledges</span>
          <span>{pledgeCount} / {goal}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Pledge button with animation */}
      <button
        onClick={handlePledge}
        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        📝 Make a Pledge
      </button>

      {/* Success message (vanishes after 2s) */}
      {showSuccess && (
        <div className="mt-4 text-center text-green-600 font-medium animate-pulse">
          🎉 Thank you for your pledge!
        </div>
      )}
    </div>
  );
}