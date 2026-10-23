"use client";

import { useState } from "react";
import { useRealTime } from "./RealTimeProvider";
import { database } from "@/app/lib/firebase";
import { ref, remove, update } from "firebase/database";

export default function AdminPledgeTable() {
  const { pledges, items } = useRealTime();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

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

  const handleMarkPaidClick = (pledgeId: string) => {
    setPendingPaymentId(pledgeId);
    setShowPaymentModal(true);
  };

  const confirmMarkPaid = async () => {
    if (!pendingPaymentId) return;
    setProcessingPayment(true);
    try {
      await update(ref(database), { [`pledges/${pendingPaymentId}/paymentStatus`]: 'paid' });
    } catch (error) {
      console.error("Failed to update payment status:", error);
      alert("Error updating status. Try again.");
    } finally {
      setProcessingPayment(false);
      setShowPaymentModal(false);
      setPendingPaymentId(null);
    }
  };

  const cancelPayment = () => {
    setShowPaymentModal(false);
    setPendingPaymentId(null);
  };

  if (!pledges.length) return <p className="text-gray-500 dark:text-gray-400 p-4">No pledges yet.</p>;

  const computePledgeTotal = (pledgeItems: { [key: string]: number }): number => {
    if (!items || !pledgeItems) return 0;
    return Object.entries(pledgeItems).reduce((total, [itemName, qty]) => {
      const unitPrice = items[itemName]?.unitPrice || 0;
      return total + qty * unitPrice;
    }, 0);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="bg-gray-100 dark:bg-gray-700 transition-colors">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Items</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Total (KES)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {pledges.map((pledge) => {
              const safeItems = pledge.items || {};
              const totalValue = computePledgeTotal(safeItems);
              const isPaid = pledge.paymentStatus === "paid";
              return (
                <tr key={pledge.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{pledge.memberName}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{pledge.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    {Object.entries(safeItems)
                      .filter(([, qty]) => qty > 0)
                      .map(([itemName, qty]) => {
                        const unitPrice = items?.[itemName]?.unitPrice || 0;
                        const subtotal = qty * unitPrice;
                        const unit = items?.[itemName]?.unit || "units";
                        return (
                          <div key={itemName} className="mb-1 last:mb-0">
                            {itemName}: {qty.toFixed(2)} {unit} ×{" "}
                            {formatMoney(unitPrice)} ={" "}
                            <span className="font-semibold">
                              {formatMoney(subtotal)}
                            </span>
                          </div>
                        );
                      })}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                    {formatMoney(totalValue)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isPaid
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                      }`}
                    >
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                    {!isPaid && (
                      <button
                        onClick={() => handleMarkPaidClick(pledge.id!)}
                        className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(pledge.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => pledge.id && handleDeleteClick(pledge.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Deletion</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this pledge? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Payment Received</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Mark this pledge as <strong className="text-gray-900 dark:text-white">paid</strong>? This action can be undone (you can change status later if needed).
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmMarkPaid}
                disabled={processingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded disabled:opacity-50 transition-colors"
              >
                {processingPayment ? "Processing..." : "Yes, Mark as Paid"}
              </button>
              <button
                onClick={cancelPayment}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded transition-colors"
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