"use client";

import { useState } from "react";
import { database } from "@/app/lib/firebase";
import { ref, push, runTransaction } from "firebase/database";
import { useRealTime } from "./RealTimeProvider";

export default function PledgeForm() {
  const { items, pledges } = useRealTime();
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>(
    {},
  );
  const [pledgeModes, setPledgeModes] = useState<{
    [key: string]: "quantity" | "cash";
  }>({});
  const [cashValues, setCashValues] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyPledged, setShowOnlyPledged] = useState(false);

  const formatMoney = (value: number) =>
    `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  const getRemaining = (itemName: string): number => {
    if (!items) return 0;
    const pledgedTotal = pledges.reduce(
      (sum, p) => sum + (p.items[itemName] || 0),
      0,
    );
    return items[itemName].required - pledgedTotal;
  };

  const getRemainingCash = (itemName: string): number => {
    if (!items) return 0;
    const remainingQty = getRemaining(itemName);
    const unitPrice = items[itemName].unitPrice || 0;
    return remainingQty * unitPrice;
  };

  const handleModeChange = (itemName: string, mode: "quantity" | "cash") => {
    setPledgeModes((prev) => ({ ...prev, [itemName]: mode }));
    // Clear the other input when switching
    if (mode === "quantity") {
      setCashValues((prev) => ({ ...prev, [itemName]: "" }));
      setSelectedItems((prev) => ({ ...prev, [itemName]: 0 }));
    } else {
      setSelectedItems((prev) => ({ ...prev, [itemName]: 0 }));
    }
  };

  const handleQuantityChange = (itemName: string, value: string) => {
    const qty = parseFloat(value) || 0;
    setSelectedItems((prev) => ({ ...prev, [itemName]: qty }));
    // Clear cash mode for this item
    setPledgeModes((prev) => ({ ...prev, [itemName]: "quantity" }));
    setCashValues((prev) => ({ ...prev, [itemName]: "" }));
  };

  const handleCashChange = (itemName: string, value: string) => {
    const cash = parseFloat(value) || 0;
    setCashValues((prev) => ({ ...prev, [itemName]: value }));
    // Convert cash to quantity (if unitPrice exists)
    const unitPrice = items?.[itemName]?.unitPrice || 0;
    const qty = unitPrice > 0 ? cash / unitPrice : 0;
    setSelectedItems((prev) => ({ ...prev, [itemName]: qty }));
    setPledgeModes((prev) => ({ ...prev, [itemName]: "cash" }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !phone.trim()) {
      setMessage("Name and phone are required.");
      return;
    }
    const hasItems = Object.values(selectedItems).some((qty) => qty > 0);
    if (!hasItems) {
      setMessage("Please pledge at least one item (quantity or cash).");
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
        }),
      );

      setMessage("✅ Pledge submitted successfully!");
      setMemberName("");
      setPhone("");
      setSelectedItems({});
      setPledgeModes({});
      setCashValues({});
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
        0,
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
        {/* Decorative blobs... (keep as before) */}
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

        {/* Search & filter (unchanged) */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 transition-all text-base"
            />
          </div>
          <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              checked={showOnlyPledged}
              onChange={(e) => setShowOnlyPledged(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
            />
            Show only items with pledges
          </label>
        </div>

        <div className="space-y-3 max-h-105 overflow-y-auto pr-2 custom-scrollbar">
          {filteredItems.length === 0 && (
            <p className="text-gray-500 text-center py-8 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              No items match your search.
            </p>
          )}
          {filteredItems.map(([name, config]) => {
            const remaining = getRemaining(name);
            const remainingCash = getRemainingCash(name);
            const pledgedTotal = pledges.reduce(
              (sum, p) => sum + (p.items[name] || 0),
              0,
            );
            const percentFilled = (pledgedTotal / config.required) * 100;
            const unitPrice = config.unitPrice || 0;
            const currentMode = pledgeModes[name] || "quantity";
            const cashValue = cashValues[name] || "";

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

                {/* Progress & remaining info */}
                <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  <span>
                    📦 Pledged: {pledgedTotal.toFixed(2)} {config.unit}
                  </span>
                  <span>
                    🎯 Remaining: {Math.max(remaining, 0).toFixed(2)}{" "}
                    {config.unit}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>💰 Unit price: {formatMoney(unitPrice)}</span>
                  <span>💵 Remaining cash: {formatMoney(remainingCash)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 my-2">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentFilled, 100)}%` }}
                  ></div>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange(name, "quantity")}
                    className={`text-xs px-2 py-1 rounded ${
                      currentMode === "quantity"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Pledge Quantity
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange(name, "cash")}
                    className={`text-xs px-2 py-1 rounded ${
                      currentMode === "cash"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Pledge Cash (KES)
                  </button>
                </div>

                {/* Input field based on mode */}
                {currentMode === "quantity" ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedItems[name] || ""}
                    onChange={(e) => handleQuantityChange(name, e.target.value)}
                    placeholder={`Quantity in ${config.unit}`}
                    className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 focus:border-green-500 focus:ring-2 focus:ring-green-300 transition-all"
                  />
                ) : (
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cashValue}
                      onChange={(e) => handleCashChange(name, e.target.value)}
                      placeholder="Amount in KES"
                      className="w-full rounded-lg border-2 border-green-500 dark:border-green-600 bg-white dark:bg-gray-900 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all"
                    />
                    {cashValue && unitPrice > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ≈ {(parseFloat(cashValue) / unitPrice).toFixed(2)}{" "}
                        {config.unit}
                      </p>
                    )}
                  </div>
                )}
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
          <div className="bg-linear-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-purple-700 text-center mb-4">
              Confirm Your Pledge
            </h3>
            <div className="space-y-2 mb-6 text-gray-700 dark:text-gray-200">
              <p>
                <span className="font-bold">✨ Name:</span> {memberName}
              </p>
              <p>
                <span className="font-bold">📞 Phone:</span> {phone}
              </p>
              <p>
                <span className="font-bold">🎁 Items:</span>
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                {Object.entries(selectedItems).map(([name, qty]) =>
                  qty > 0 ? (
                    <li key={name} className="font-medium">
                      {name}: {qty.toFixed(2)} {items?.[name]?.unit}
                      {items?.[name]?.unitPrice &&
                        ` (≈ ${formatMoney(qty * items[name].unitPrice)})`}
                    </li>
                  ) : null,
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
