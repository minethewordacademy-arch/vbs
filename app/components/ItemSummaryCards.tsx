//ItemSummaryCards.tsx
"use client";

import { useRealTime } from "./RealTimeProvider";

export default function ItemSummaryCards() {
  const { items, pledges } = useRealTime();
  if (!items) return null;

  // Compute pledged totals from pledges (in case items.pledged is out of sync)
  const pledgedTotals: { [key: string]: number } = {};
  pledges.forEach((pledge) => {
    Object.entries(pledge.items).forEach(([item, qty]) => {
      pledgedTotals[item] = (pledgedTotals[item] || 0) + qty;
    });
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {Object.entries(items).map(([name, config]) => {
        const pledged = pledgedTotals[name] || 0;
        const remaining = config.required - pledged;
        const percent = (pledged / config.required) * 100;
        return (
          <div key={name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-xl font-bold capitalize mb-2">{name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Required:</span>
                <span className="font-semibold">{config.required} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Pledged:</span>
                <span className="font-semibold text-green-600">{pledged} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="font-semibold text-orange-600">{Math.max(remaining, 0)} {config.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}