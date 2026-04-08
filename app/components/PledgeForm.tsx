"use client";

import { useState, useRef, useEffect } from "react";
import { database } from "@/app/lib/firebase";
import { ref, push, runTransaction } from "firebase/database";
import { useRealTime } from "./RealTimeProvider";

export default function PledgeForm() {
  const { items, pledges } = useRealTime();
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [pledgeModes, setPledgeModes] = useState<{ [key: string]: "quantity" | "cash" }>({});
  const [cashValues, setCashValues] = useState<{ [key: string]: string }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyPledged, setShowOnlyPledged] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [exceedModal, setExceedModal] = useState<{
    itemName: string;
    remaining: number;
    unit: string;
  } | null>(null);
  
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showConfirmModal || exceedModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showConfirmModal, exceedModal]);

  const formatMoney = (value: number) =>
    `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  const validateName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!name.trim()) {
      setNameError("Full name is required.");
      return false;
    }
    if (!nameRegex.test(name)) {
      setNameError("Name should contain only letters, spaces, hyphens, or apostrophes (no numbers).");
      return false;
    }
    setNameError("");
    return true;
  };

  const validatePhone = (phoneNum: string): boolean => {
    const digitsOnly = phoneNum.replace(/\D/g, "");
    if (!phoneNum.trim()) {
      setPhoneError("Phone number is required.");
      return false;
    }
    if (digitsOnly.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits (e.g., 0712345678).");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleNameChange = (value: string) => {
    setMemberName(value);
    validateName(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    validatePhone(value);
  };

  const getRemaining = (itemName: string): number => {
    if (!items) return 0;
    const pledgedTotal = pledges.reduce(
      (sum, p) => sum + (p.items[itemName] || 0),
      0,
    );
    return Math.max(0, items[itemName].required - pledgedTotal);
  };

  const getRemainingCash = (itemName: string): number => {
    if (!items) return 0;
    const remainingQty = getRemaining(itemName);
    const unitPrice = items[itemName].unitPrice || 0;
    return remainingQty * unitPrice;
  };

  const validateQuantity = (itemName: string, qty: number): boolean => {
    const remaining = getRemaining(itemName);
    if (qty > remaining) {
      setValidationErrors((prev) => ({
        ...prev,
        [itemName]: `Cannot exceed remaining ${remaining.toFixed(2)} ${items?.[itemName]?.unit}.`,
      }));
      return false;
    }
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[itemName];
      return newErrors;
    });
    return true;
  };

  const handleModeChange = (itemName: string, mode: "quantity" | "cash") => {
    setPledgeModes((prev) => ({ ...prev, [itemName]: mode }));
    if (mode === "quantity") {
      setCashValues((prev) => ({ ...prev, [itemName]: "" }));
      setSelectedItems((prev) => ({ ...prev, [itemName]: 0 }));
    } else {
      setSelectedItems((prev) => ({ ...prev, [itemName]: 0 }));
    }
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[itemName];
      return newErrors;
    });
  };

  const handleQuantityChange = (itemName: string, value: string) => {
    const qty = parseFloat(value) || 0;
    const remaining = getRemaining(itemName);

    if (qty > remaining) {
      setExceedModal({
        itemName,
        remaining,
        unit: items?.[itemName]?.unit || "units",
      });
      return;
    }

    setSelectedItems((prev) => ({ ...prev, [itemName]: qty }));
    setPledgeModes((prev) => ({ ...prev, [itemName]: "quantity" }));
    setCashValues((prev) => ({ ...prev, [itemName]: "" }));
    validateQuantity(itemName, qty);
  };

  const handleCashChange = (itemName: string, value: string) => {
    const cash = parseFloat(value) || 0;
    const unitPrice = items?.[itemName]?.unitPrice || 0;
    const remainingCash = getRemainingCash(itemName);

    if (cash > remainingCash) {
      setExceedModal({
        itemName,
        remaining: getRemaining(itemName),
        unit: items?.[itemName]?.unit || "units",
      });
      return;
    }

    setCashValues((prev) => ({ ...prev, [itemName]: value }));
    const qty = unitPrice > 0 ? cash / unitPrice : 0;
    setSelectedItems((prev) => ({ ...prev, [itemName]: qty }));
    setPledgeModes((prev) => ({ ...prev, [itemName]: "cash" }));
    validateQuantity(itemName, qty);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateName(memberName);
    const isPhoneValid = validatePhone(phone);

    if (!isNameValid || !isPhoneValid) {
      setMessage("Please correct the errors above before submitting.");
      return;
    }

    const hasItems = Object.values(selectedItems).some((qty) => qty > 0);
    if (!hasItems) {
      setMessage("Please pledge at least one item (quantity or cash).");
      return;
    }

    const overLimit = Object.entries(selectedItems).find(([itemName, _qty]) => {
      if (_qty <= 0) return false;
      const remaining = getRemaining(itemName);
      return _qty > remaining;
    });

    if (overLimit) {
      const [itemName] = overLimit;
      const remaining = getRemaining(itemName);
      setExceedModal({
        itemName,
        remaining,
        unit: items?.[itemName]?.unit || "units",
      });
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
      setNameError("");
      setPhoneError("");
      setSelectedItems({});
      setPledgeModes({});
      setCashValues({});
      setValidationErrors({});
      setSearchTerm("");
      setShowOnlyPledged(false);
      setShowOnlyPending(false);
      
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    
    const pledgedTotal = pledges.reduce((sum, p) => sum + (p.items[name] || 0), 0);
    const remaining = items[name].required - pledgedTotal;
    const hasPledges = pledgedTotal > 0;
    const isPending = remaining > 0;
    
    if (showOnlyPledged && !hasPledges) return false;
    if (showOnlyPending && !isPending) return false;
    
    return true;
  });

  const clearAllFilters = () => {
    setSearchTerm("");
    setShowOnlyPledged(false);
    setShowOnlyPending(false);
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 space-y-5 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          ✨ Make a Pledge ✨
        </h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={memberName}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`w-full rounded-lg border-2 p-3 text-base ${
              nameError ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all`}
            required
          />
          {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`w-full rounded-lg border-2 p-3 text-base ${
              phoneError ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all`}
            required
          />
          {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
          <p className="text-gray-500 text-xs mt-1">Enter exactly 10 digits (e.g., 0712345678)</p>
        </div>

        {/* Search and filter section */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-base"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex gap-3 justify-center flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyPledged}
                onChange={(e) => setShowOnlyPledged(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-500"
              />
              With pledges
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyPending}
                onChange={(e) => setShowOnlyPending(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-500"
              />
              Pending (still needed)
            </label>
            {(searchTerm || showOnlyPledged || showOnlyPending) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                ✖ Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Filter stats */}
        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
          <span>Showing {filteredItems.length} of {Object.keys(items).length} items</span>
          {(searchTerm || showOnlyPledged || showOnlyPending) && (
            <button
              onClick={clearAllFilters}
              className="text-blue-500 hover:text-blue-700"
            >
              Reset all
            </button>
          )}
        </div>

        <div ref={itemsContainerRef} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {filteredItems.length === 0 && (
            <p className="text-gray-500 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
              No items match your filters.
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
            const isFullyPledged = remaining <= 0;

            return (
              <div
                key={name}
                className={`rounded-xl border-l-8 ${
                  isFullyPledged ? "border-l-gray-400 opacity-60" : "border-l-blue-500"
                } bg-white dark:bg-gray-800 shadow p-4`}
              >
                <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold capitalize text-gray-800 dark:text-white">
                    {name}
                  </h3>
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    Required: {config.required} {config.unit}
                  </span>
                </div>

                <div className="flex justify-between text-sm mb-1">
                  <span>📦 Pledged: {pledgedTotal.toFixed(2)} {config.unit}</span>
                  <span>🎯 Remaining: {remaining.toFixed(2)} {config.unit}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>💰 Unit: {formatMoney(unitPrice)}</span>
                  <span>💵 Remaining cash: {formatMoney(remainingCash)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(percentFilled, 100)}%` }}
                  />
                </div>

                {isFullyPledged ? (
                  <div className="text-center text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 p-2 rounded-lg">
                    ✅ Fully pledged! Thank you. Pick another item kindly
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handleModeChange(name, "quantity")}
                        className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium ${
                          currentMode === "quantity"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        📦 Quantity
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange(name, "cash")}
                        className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium ${
                          currentMode === "cash"
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        💰 Cash
                      </button>
                    </div>

                    {currentMode === "quantity" ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedItems[name] || ""}
                        onChange={(e) => handleQuantityChange(name, e.target.value)}
                        placeholder={`Quantity (max ${remaining.toFixed(2)} ${config.unit})`}
                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-base"
                      />
                    ) : (
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={cashValue}
                          onChange={(e) => handleCashChange(name, e.target.value)}
                          placeholder={`Amount (max ${formatMoney(remainingCash)})`}
                          className="w-full rounded-lg border-2 border-green-500 dark:border-green-600 bg-white dark:bg-gray-700 p-3 text-base"
                        />
                        {cashValue && unitPrice > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {(parseFloat(cashValue) / unitPrice).toFixed(2)} {config.unit}
                          </p>
                        )}
                      </div>
                    )}
                    {validationErrors[name] && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors[name]}</p>
                    )}
                  </>
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
          className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 text-lg"
        >
          {submitting ? "Submitting..." : "📝 Review & Confirm Pledge"}
        </button>
      </form>

      {exceedModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setExceedModal(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border-l-8 border-l-orange-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">⚠️</div>
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">Pledge Limit Exceeded</h3>
            </div>
            <div className="space-y-3 text-gray-700 dark:text-gray-200 mb-6">
              <p>
                You tried to pledge more than the remaining requirement for{" "}
                <strong className="capitalize">{exceedModal.itemName}</strong>.
              </p>
              <p className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg text-center">
                Only <strong>{exceedModal.remaining.toFixed(2)} {exceedModal.unit}</strong> remaining.
              </p>
              <p className="text-sm text-gray-500">💡 Please adjust your pledge or choose another item.</p>
            </div>
            <button
              onClick={() => setExceedModal(null)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all text-lg"
            >
              Got it, I&apos;ll adjust
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-purple-700 mb-4">
              Confirm Your Pledge
            </h3>
            <div className="space-y-2 mb-6 text-gray-700 dark:text-gray-200">
              <p><span className="font-bold">✨ Name:</span> {memberName}</p>
              <p><span className="font-bold">📞 Phone:</span> {phone}</p>
              <p><span className="font-bold">🎁 Items:</span></p>
              <ul className="list-disc list-inside pl-2 space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(selectedItems).map(([name, qty]) =>
                  qty > 0 ? (
                    <li key={name} className="font-medium text-sm">
                      {name}: {qty.toFixed(2)} {items?.[name]?.unit}
                      {items?.[name]?.unitPrice && ` (≈ ${formatMoney(qty * items[name].unitPrice)})`}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSubmit}
                className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-lg"
              >
                ✅ Yes
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition-all text-lg"
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