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
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyPledged, setShowOnlyPledged] = useState(false);

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
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setMessage("");

    try {
      const pledgeData = {
        memberName: memberName.trim(),
        phone: phone.trim(),
        items: selectedItems,
        timestamp: new Date().toISOString(),
      };
      const pledgesRef = ref(database, "pledges");
      await push(pledgesRef, pledgeData);

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
      setSearchTerm("");
      setShowOnlyPledged(false);
    } catch (error) {
      console.error(error);
      setMessage("❌ Error submitting pledge. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!items) return <div className="text-center py-10">Loading...</div>;

  const filteredItems = Object.entries(items).filter(([name]) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (showOnlyPledged) {
      const pledgedTotal = pledges.reduce(
        (sum, p) => sum + (p.items[name] || 0),
        0
      );
      return pledgedTotal > 0;
    }
    return true;
  });

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="relative bg-linear-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl p-6 space-y-5 border border-blue-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Decorative blob */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-linear-to-r from-blue-300 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-linear-to-r from-yellow-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-center">
          ✨ Make a Pledge ✨
        </h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all"
            required
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex-1 min-w-37.5">
            <input
              type="text"
              placeholder="🔍 Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-inner focus:border-purple-500 focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showOnlyPledged}
              onChange={(e) => setShowOnlyPledged(e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
            />
            Show only items with pledges
          </label>
        </div>

        <div className="space-y-3 max-h-105 overflow-y-auto pr-2 custom-scrollbar">
          {filteredItems.length === 0 && (
            <p className="text-gray-500 text-center py-8 bg-white/50 dark:bg-gray-800/50 rounded-xl">No items match your search.</p>
          )}
          {filteredItems.map(([name, config]) => {
            const remaining = getRemaining(name);
            const pledgedTotal = pledges.reduce(
              (sum, p) => sum + (p.items[name] || 0),
              0
            );
            const percentFilled = (pledgedTotal / config.required) * 100;
            return (
              <div
                key={name}
                className="group relative bg-linear-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-800/80 rounded-xl border-l-8 border-l-blue-500 shadow-md hover:shadow-xl transition-all duration-300 p-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <span className="text-lg font-bold capitalize bg-linear-to-r from-blue-700 to-purple-700 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                    {name}
                  </span>
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    Required: {config.required} {config.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  <span>📦 Pledged: {pledgedTotal} {config.unit}</span>
                  <span>🎯 Remaining: {Math.max(remaining, 0)} {config.unit}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentFilled, 100)}%` }}
                  ></div>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={selectedItems[name] || ""}
                  onChange={(e) => handleQuantityChange(name, e.target.value)}
                  placeholder={`Quantity in ${config.unit}`}
                  className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 focus:border-green-500 focus:ring-2 focus:ring-green-300 transition-all"
                />
              </div>
            );
          })}
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-center font-semibold ${
              message.includes("✅")
                ? "bg-green-100 text-green-800 border-l-8 border-green-500"
                : "bg-red-100 text-red-800 border-l-8 border-red-500"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="relative w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          {submitting ? "Submitting..." : "📝 Review & Confirm Pledge"}
        </button>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-linear-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-purple-700 text-center mb-4">
              Confirm Your Pledge
            </h3>
            <div className="space-y-2 mb-6 text-gray-700 dark:text-gray-200">
              <p><span className="font-bold">✨ Name:</span> {memberName}</p>
              <p><span className="font-bold">📞 Phone:</span> {phone}</p>
              <p><span className="font-bold">🎁 Items:</span></p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                {Object.entries(selectedItems).map(([name, qty]) =>
                  qty > 0 ? <li key={name} className="font-medium">{name}: <span className="text-blue-600">{qty}</span></li> : null
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSubmit}
                className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 rounded-xl shadow-md transition-all"
              >
                ✅ Yes, Submit
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-linear-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-2 rounded-xl shadow-md transition-all"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}