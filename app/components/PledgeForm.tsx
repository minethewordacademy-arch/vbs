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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  // Called when user clicks "Submit" – shows modal instead of direct submit
  const handleFormSubmit = (e: React.FormEvent) => {
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
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setMessage("");

    try {
      // 1. Save pledge record
      const pledgeData = {
        memberName: memberName.trim(),
        phone: phone.trim(),
        items: selectedItems,
        timestamp: new Date().toISOString(),
      };
      const pledgesRef = ref(database, "pledges");
      await push(pledgesRef, pledgeData);

      // 2. Update pledged totals using transactions
      await Promise.all(
        Object.entries(selectedItems).map(async ([itemName, qty]) => {
          if (qty <= 0) return;
          const itemRef = ref(database, `items/${itemName}/pledged`);
          await runTransaction(itemRef, (currentPledged) => {
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
    <>
      <form
        onSubmit={handleFormSubmit}
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
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <span className="font-semibold capitalize">{name}</span>
                  <span className="text-sm text-gray-500">
                    Required: {config.required} {config.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Pledged: {pledgedTotal} {config.unit}</span>
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
          {submitting ? "Submitting..." : "Review & Confirm"}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Your Pledge</h3>
            <div className="space-y-2 mb-6">
              <p><strong>Name:</strong> {memberName}</p>
              <p><strong>Phone:</strong> {phone}</p>
              <p><strong>Items:</strong></p>
              <ul className="list-disc list-inside pl-2">
                {Object.entries(selectedItems).map(([name, qty]) =>
                  qty > 0 ? <li key={name}>{name}: {qty}</li> : null
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
              >
                Yes, Submit
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}