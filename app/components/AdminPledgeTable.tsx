"use client";

import { useState } from "react";
import { useRealTime } from "./RealTimeProvider";
import { database } from "@/app/lib/firebase";
import { ref, remove } from "firebase/database";

export default function AdminPledgeTable() {
  const { pledges, items } = useRealTime(); // also get items for unit prices
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatMoney = (value: number) =>
    `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const pledgeRef = ref(database, `pledges/${pendingDeleteId}`);
      await remove(pledgeRef);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setPendingDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPendingDeleteId(null);
  };

  if (!pledges.length) return <p className="text-gray-500">No pledges yet.</p>;

  // Helper to compute total pledge value
  const computePledgeTotal = (pledgeItems: { [key: string]: number }): number => {
    if (!items) return 0;
    return Object.entries(pledgeItems).reduce((total, [itemName, qty]) => {
      const unitPrice = items[itemName]?.unitPrice || 0;
      return total + qty * unitPrice;
    }, 0);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Items (qty × unit price)</th>
              <th className="px-4 py-2 text-left">Total (KES)</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pledges.map((pledge) => {
              const totalValue = computePledgeTotal(pledge.items);
              return (
                <tr key={pledge.id} className="border-t dark:border-gray-700">
                  <td className="px-4 py-2">{pledge.memberName}</td>
                  <td className="px-4 py-2">{pledge.phone}</td>
                  <td className="px-4 py-2">
                    {Object.entries(pledge.items)
                      .filter(([, qty]) => qty > 0)
                      .map(([itemName, qty]) => {
                        const unitPrice = items?.[itemName]?.unitPrice || 0;
                        const subtotal = qty * unitPrice;
                        const unit = items?.[itemName]?.unit || "units";
                        return (
                          <div key={itemName} className="text-sm">
                            {itemName}: {qty.toFixed(2)} {unit} × {formatMoney(unitPrice)} ={" "}
                            <span className="font-medium">{formatMoney(subtotal)}</span>
                          </div>
                        );
                      })}
                  </td>
                  <td className="px-4 py-2 font-bold text-green-600">
                    {formatMoney(totalValue)}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(pledge.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => pledge.id && handleDeleteClick(pledge.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label="Delete pledge"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this pledge? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={cancelDelete}
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