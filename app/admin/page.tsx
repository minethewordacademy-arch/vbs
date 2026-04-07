"use client";

import { useState, useEffect } from "react";
import { database } from "@/app/lib/firebase";
import { ref, update } from "firebase/database";
import { RealTimeProvider, useRealTime } from "../components/RealTimeProvider";
import ItemSummaryCards from "../components/ItemSummaryCards";
import AdminPledgeTable from "../components/AdminPledgeTable";

const ADMIN_PASSWORD = "admin@2026";
const SESSION_KEY = "admin_authenticated";

// Inner component that uses real-time data (must be inside provider)
function AdminDashboard() {
  const { items, refresh } = useRealTime();
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<{ [key: string]: number }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleEditClick = () => {
    if (!items) return;
    const current = Object.fromEntries(
      Object.entries(items).map(([k, v]) => [k, v.required])
    );
    setEditedItems(current);
    setEditMode(true);
  };

  const handleRequiredChange = (itemName: string, value: string) => {
    const num = parseInt(value) || 0;
    setEditedItems((prev) => ({ ...prev, [itemName]: num }));
  };

  const saveRequiredQuantities = async () => {
    setSaving(true);
    setMessage("");
    try {
      const updates: Record<string, number> = {};
      for (const [itemName, newRequired] of Object.entries(editedItems)) {
        updates[`items/${itemName}/required`] = newRequired;
      }
      await update(ref(database), updates);
      setMessage("✅ Required quantities updated.");
      setEditMode(false);
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Item Summary</h2>
        {!editMode ? (
          <button
            onClick={handleEditClick}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
          >
            Edit Required Quantities
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={saveRequiredQuantities}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {editMode && items && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
          {Object.entries(items).map(([name, config]) => (
            <div key={name} className="flex items-center gap-4">
              <label className="w-24 font-semibold capitalize">{name}</label>
              <input
                type="number"
                value={editedItems[name]}
                onChange={(e) => handleRequiredChange(name, e.target.value)}
                className="border rounded px-2 py-1 w-32 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-500">{config.unit}</span>
            </div>
          ))}
        </div>
      )}

      <ItemSummaryCards />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">All Pledges</h2>
        <AdminPledgeTable />
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow">
          {message}
        </div>
      )}
    </>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-red-600 text-sm mb-4">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard – Pledge Tracker</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Logout
          </button>
        </div>

        {/* Wrap the dashboard with RealTimeProvider */}
        <RealTimeProvider>
          <AdminDashboard />
        </RealTimeProvider>
      </div>
    </div>
  );
}