"use client";

import { useState, useEffect } from "react";
import { database } from "@/app/lib/firebase";
import { ref, update, set, get } from "firebase/database";
import { RealTimeProvider, useRealTime } from "../components/RealTimeProvider";
import ItemSummaryCards from "../components/ItemSummaryCards";
import AdminPledgeTable from "../components/AdminPledgeTable";

const ADMIN_PASSWORD = "admin@2026";
const SESSION_KEY = "admin_authenticated";

// Inner component that uses real-time data
function AdminDashboard() {
  const { items, refresh } = useRealTime();
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<{ [key: string]: number }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // New item form state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemRequired, setNewItemRequired] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [addingItem, setAddingItem] = useState(false);

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

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      setMessage("❌ Item name is required.");
      return;
    }
    const itemKey = newItemName.trim().toLowerCase().replace(/\s+/g, "_");
    const requiredNum = parseInt(newItemRequired) || 0;
    if (requiredNum <= 0) {
      setMessage("❌ Required quantity must be a positive number.");
      return;
    }
    setAddingItem(true);
    try {
      const itemRef = ref(database, `items/${itemKey}`);
      const snapshot = await get(itemRef);
      if (snapshot.exists()) {
        setMessage("❌ Item already exists.");
        return;
      }
      await set(itemRef, {
        required: requiredNum,
        unit: newItemUnit,
        pledged: 0,
      });
      setMessage(`✅ Added "${newItemName}" (${requiredNum} ${newItemUnit}).`);
      setNewItemName("");
      setNewItemRequired("");
      setNewItemUnit("kg");
      setShowAddItem(false);
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to add item.");
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Item Summary</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm"
          >
            + Add New Item
          </button>
          {!editMode ? (
            <button
              onClick={handleEditClick}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm"
            >
              Edit Required
            </button>
          ) : (
            <>
              <button
                onClick={saveRequiredQuantities}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow">
          <h3 className="font-semibold mb-3">Add New Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Item name (e.g., Maize Flour)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700"
            />
            <input
              type="number"
              placeholder="Required quantity"
              value={newItemRequired}
              onChange={(e) => setNewItemRequired(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="liters">liters</option>
              <option value="pieces">pieces</option>
              <option value="bags">bags</option>
            </select>
            <button
              onClick={handleAddItem}
              disabled={addingItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
            >
              {addingItem ? "Adding..." : "Add Item"}
            </button>
          </div>
        </div>
      )}

      {editMode && items && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
          {Object.entries(items).map(([name, config]) => (
            <div key={name} className="flex flex-wrap items-center gap-4">
              <label className="w-28 font-semibold capitalize">{name}</label>
              <input
                type="number"
                value={editedItems[name]}
                onChange={(e) => handleRequiredChange(name, e.target.value)}
                className="border rounded px-2 py-1 w-28 dark:bg-gray-700"
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
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow z-50">
          {message}
        </div>
      )}
    </>
  );
}

// Login & wrapper – same as before (unchanged)
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700"
              autoFocus
            />
            {authError && <p className="text-red-600 text-sm mb-4">{authError}</p>}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
        <RealTimeProvider>
          <AdminDashboard />
        </RealTimeProvider>
      </div>
    </div>
  );
}