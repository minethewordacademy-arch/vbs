"use client";

import { useState } from "react";
import { database } from "@/app/lib/firebase";
import { ref, push, runTransaction } from "firebase/database";
import { useRealTime } from "./RealTimeProvider";

export default function PledgeForm() {
  const { items, pledges } = useRealTime();
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const getRemaining = (itemName: string): number => {
    if (!items) return 0;
    const pledgedTotal = pledges.reduce(
      (sum, p) => sum + (p.items[itemName] || 0),
      0
    );
    return items[itemName].required - pledgedTotal;
  };

  const handleQuantityChange = (itemName: string, value: string) => {
    const qty = parseInt(value) || 0;
    setSelectedItems((prev) => ({ ...prev, [itemName]: qty }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !phone.trim()) {
      setMessage("Name and phone are required.");
      return;
    }
    const hasItems = Object.values(selectedItems).some((qty) => qty > 0);
    if (!hasItems) {
      setMessage("Please pledge at least one item.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      // 1. Save the pledge record
      const pledgeData = {
        memberName: memberName.trim(),
        phone: phone.trim(),
        items: selectedItems,
        timestamp: new Date().toISOString(),
      };
      const pledgesRef = ref(database, "pledges");
      await push(pledgesRef, pledgeData);

      // 2. Update each item's pledged total using a transaction (prevents race conditions)
      await Promise.all(
        Object.entries(selectedItems).map(async ([itemName, qty]) => {
          if (qty <= 0) return;
          const itemRef = ref(database, `items/${itemName}/pledged`);
          await runTransaction(itemRef, (currentPledged) => {
            // If currentPledged is null, initialize to 0
            return (currentPledged || 0) + qty;
          });
        })
      );

      setMessage("✅ Pledge submitted successfully!");
      setMemberName("");
      setPhone("");
      setSelectedItems({});
    } catch (error) {
      console.error(error);
      setMessage("❌ Error submitting pledge. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!items) return <div className="text-center py-10">Loading...</div>;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        Make a Pledge
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name *
        </label>
        <input
          type="text"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone Number *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Items to Pledge
        </label>
        {Object.entries(items).map(([name, config]) => {
          const remaining = getRemaining(name);
          const pledgedTotal = pledges.reduce(
            (sum, p) => sum + (p.items[name] || 0),
            0
          );
          return (
            <div key={name} className="border rounded-lg p-3 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold capitalize">{name}</span>
                <span className="text-sm text-gray-500">
                  Required: {config.required} {config.unit}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  Already pledged: {pledgedTotal} {config.unit}
                </span>
                <span>Remaining: {Math.max(remaining, 0)} {config.unit}</span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={selectedItems[name] || ""}
                onChange={(e) => handleQuantityChange(name, e.target.value)}
                placeholder={`Quantity in ${config.unit}`}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          );
        })}
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.includes("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Pledge"}
      </button>
    </form>
  );
}