"use client";

import { useRealTime } from "./RealTimeProvider";

export default function ItemSummaryCards() {
  const { items, pledges } = useRealTime();
  if (!items) return null;

  const pledgedTotals: { [key: string]: number } = {};
  pledges.forEach((pledge) => {
    Object.entries(pledge.items).forEach(([item, qty]) => {
      pledgedTotals[item] = (pledgedTotals[item] || 0) + qty;
    });
  });

  const formatMoney = (value: number) =>
    `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {Object.entries(items).map(([name, config]) => {
        const pledged = pledgedTotals[name] || 0;
        const remaining = config.required - pledged;
        const percent = (pledged / config.required) * 100;
        const unitPrice = config.unitPrice || 0;
        const totalValue = config.required * unitPrice;
        const remainingCash = remaining * unitPrice;

        return (
          <div key={name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-xl font-bold capitalize mb-2">{name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Required:</span>
                <span className="font-semibold">{config.required} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Unit Price:</span>
                <span className="font-semibold text-blue-600">{formatMoney(unitPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-semibold text-purple-600">{formatMoney(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pledged:</span>
                <span className="font-semibold text-green-600">{pledged.toFixed(2)} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining (qty):</span>
                <span className="font-semibold text-orange-600">{Math.max(remaining, 0).toFixed(2)} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining (cash):</span>
                <span className="font-semibold text-red-600">{formatMoney(Math.max(remainingCash, 0))}</span>
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