"use client";

import { useRealTime } from "./RealTimeProvider";
import { database } from "@/app/lib/firebase";
import { ref, remove } from "firebase/database";

export default function AdminPledgeTable() {
  const { pledges } = useRealTime(); // 'items' removed – was unused

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pledge? This action cannot be undone.")) return;
    try {
      const pledgeRef = ref(database, `pledges/${id}`);
      await remove(pledgeRef);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (!pledges.length) return <p className="text-gray-500">No pledges yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Phone</th>
            <th className="px-4 py-2 text-left">Items (qty)</th>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {pledges.map((pledge) => (
            <tr key={pledge.id} className="border-t dark:border-gray-700">
              <td className="px-4 py-2">{pledge.memberName}</td>
              <td className="px-4 py-2">{pledge.phone}</td>
              <td className="px-4 py-2">
                {Object.entries(pledge.items)
                  .filter(([, qty]) => qty > 0)
                  .map(([item, qty]) => `${item}: ${qty}`)
                  .join(", ")}
              </td>
              <td className="px-4 py-2">
                {new Date(pledge.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => pledge.id && handleDelete(pledge.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}