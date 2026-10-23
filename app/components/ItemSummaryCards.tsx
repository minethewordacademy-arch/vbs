"use client";

import { useRealTime } from "./RealTimeProvider";

interface ItemSummaryCardsProps {
  searchTerm?: string;
}

export default function ItemSummaryCards({ searchTerm = "" }: ItemSummaryCardsProps) {
  const { items, pledges } = useRealTime();
  if (!items) return null;

  const pledgedTotals: { [key: string]: number } = {};
  pledges.forEach((pledge) => {
    if (pledge.items && typeof pledge.items === 'object') {
      Object.entries(pledge.items).forEach(([item, qty]) => {
        pledgedTotals[item] = (pledgedTotals[item] || 0) + qty;
      });
    }
  });

  const formatMoney = (value: number) =>
    `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  const filteredEntries = Object.entries(items).filter(([name]) => {
    if (!searchTerm.trim()) return true;
    return name.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  if (filteredEntries.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No items match your search.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {filteredEntries.map(([name, config]) => {
        const pledged = pledgedTotals[name] || 0;
        const remaining = config.required - pledged;
        const percent = (pledged / config.required) * 100;
        const unitPrice = config.unitPrice || 0;
        const totalValue = config.required * unitPrice;
        const remainingCash = remaining * unitPrice;

        return (
          <div key={name} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-300">
            <h3 className="text-xl font-bold capitalize mb-2 text-gray-800 dark:text-white">{name}</h3>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Required:</span>
                <span className="font-semibold">{config.required} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Unit Price:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(unitPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">{formatMoney(totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pledged:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{pledged.toFixed(2)} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining (qty):</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">{Math.max(remaining, 0).toFixed(2)} {config.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining (cash):</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatMoney(Math.max(remainingCash, 0))}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(percent, 100)}%` }}></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}