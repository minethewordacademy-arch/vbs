"use client";

import { useState, useEffect } from "react";
import { database } from "@/app/lib/firebase";
import { ref, update, set, get, remove } from "firebase/database";
import { RealTimeProvider, useRealTime } from "../components/RealTimeProvider";
import ItemSummaryCards from "../components/ItemSummaryCards";
import AdminPledgeTable from "../components/AdminPledgeTable";

const ADMIN_PASSWORD = "admin@2026";
const SESSION_KEY = "admin_authenticated";

// Inner component that uses real-time data
function AdminDashboard() {
  const { items, pledges, refresh } = useRealTime();
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<{
    [key: string]: { required: number; unitPrice: number };
  }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // New item form state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemRequired, setNewItemRequired] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Confirmation modal states
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    name: string;
    key: string;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // CSV Export Function
  const downloadPledgesAsCSV = () => {
    if (!pledges || pledges.length === 0) {
      setMessage("No pledges to export.");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const headers = ["Member Name", "Phone", "Date", "Items (item: quantity)"];
    const rows = pledges.map((pledge) => [
      pledge.memberName,
      pledge.phone,
      new Date(pledge.timestamp).toLocaleString(),
      Object.entries(pledge.items)
        .filter(([, qty]) => qty > 0)
        .map(([item, qty]) => `${item}: ${qty}`)
        .join(", "),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `pledges_${new Date().toISOString().slice(0, 19)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage("✅ Pledges exported successfully!");
    setTimeout(() => setMessage(""), 2000);
  };

  // Seed PDF data (optional button)
  const seedFromPDF = async () => {
    const pdfItems = {
      rice: { required: 150, unit: "Kgs", unitPrice: 180 },
      lentils: { required: 30, unit: "Kgs", unitPrice: 240 },
      beans: { required: 20, unit: "Kgs", unitPrice: 180 },
      maize_flour: { required: 20, unit: "Kgs", unitPrice: 100 },
      dengu: { required: 15, unit: "Kgs", unitPrice: 180 },
      chapati_flour: { required: 12, unit: "Kgs", unitPrice: 100 },
      eggs: { required: 5, unit: "Trays", unitPrice: 420 },
      vegetables: { required: 1, unit: "Lot", unitPrice: 1000 },
      bread: { required: 120, unit: "Loaves", unitPrice: 60 },
      milk: { required: 200, unit: "Packets", unitPrice: 60 },
      uji_flour: { required: 5, unit: "Kgs", unitPrice: 100 },
      mandazi: { required: 30, unit: "Kgs", unitPrice: 100 },
      sugar: { required: 5, unit: "Kgs", unitPrice: 150 },
      chocolate: { required: 1, unit: "lot", unitPrice: 400 },
      cooking_oil: { required: 20, unit: "Litres", unitPrice: 300 },
      nyanya: { required: 1, unit: "Lot", unitPrice: 1000 },
      onions: { required: 1, unit: "Lot", unitPrice: 500 },
      additives: { required: 1, unit: "Lot", unitPrice: 500 },
      cabbage: { required: 1, unit: "Lot", unitPrice: 500 },
      melon: { required: 1, unit: "Lot", unitPrice: 1500 },
      ndizi: { required: 1, unit: "Lot", unitPrice: 800 },
      charcoal: { required: 1, unit: "Sack", unitPrice: 3000 },
      gas: { required: 1, unit: "Lot", unitPrice: 2400 },
      utensils_cleaning: { required: 1, unit: "Lot", unitPrice: 6000 },
      catering_labour: { required: 1, unit: "Lot", unitPrice: 10000 },
    };
    const updates: Record<
      string,
      { required: number; unit: string; unitPrice: number; pledged: number }
    > = {};
    for (const [key, val] of Object.entries(pdfItems)) {
      updates[`items/${key}`] = { ...val, pledged: 0 };
    }
    await update(ref(database), updates);
    setMessage("✅ PDF data seeded!");
    refresh();
  };

  const handleEditClick = () => {
    if (!items) return;
    const current = Object.fromEntries(
      Object.entries(items).map(([k, v]) => [
        k,
        { required: v.required, unitPrice: v.unitPrice || 0 },
      ]),
    );
    setEditedItems(current);
    setEditMode(true);
  };

  const handleRequiredChange = (itemName: string, value: string) => {
    const num = parseInt(value) || 0;
    setEditedItems((prev) => ({
      ...prev,
      [itemName]: { ...prev[itemName], required: num },
    }));
  };

  const handlePriceChange = (itemName: string, value: string) => {
    const num = parseFloat(value) || 0;
    setEditedItems((prev) => ({
      ...prev,
      [itemName]: { ...prev[itemName], unitPrice: num },
    }));
  };

  const saveRequiredQuantities = async () => {
    setSaving(true);
    setMessage("");
    try {
      const requiredUpdates: Record<string, number> = {};
      const priceUpdates: Record<string, number> = {};
      for (const [itemName, { required, unitPrice }] of Object.entries(
        editedItems,
      )) {
        requiredUpdates[`items/${itemName}/required`] = required;
        priceUpdates[`items/${itemName}/unitPrice`] = unitPrice;
      }
      await update(ref(database), { ...requiredUpdates, ...priceUpdates });
      setMessage("✅ Required quantities and prices updated.");
      setEditMode(false);
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Update failed.");
    } finally {
      setSaving(false);
      setShowSaveConfirmModal(false);
    }
  };

  const handleAddItem = async () => {
    setAddingItem(true);
    try {
      const itemKey = newItemName.trim().toLowerCase().replace(/\s+/g, "_");
      const requiredNum = parseInt(newItemRequired) || 0;
      const priceNum = parseFloat(newItemPrice) || 0;
      const itemRef = ref(database, `items/${itemKey}`);
      const snapshot = await get(itemRef);
      if (snapshot.exists()) {
        setMessage("❌ Item already exists.");
        setShowAddConfirmModal(false);
        setAddingItem(false);
        return;
      }
      await set(itemRef, {
        required: requiredNum,
        unit: newItemUnit,
        pledged: 0,
        unitPrice: priceNum,
      });
      setMessage(
        `✅ Added "${newItemName}" (${requiredNum} ${newItemUnit} @ KES ${priceNum}).`,
      );
      setNewItemName("");
      setNewItemRequired("");
      setNewItemUnit("kg");
      setNewItemPrice("");
      setShowAddItem(false);
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to add item.");
    } finally {
      setAddingItem(false);
      setShowAddConfirmModal(false);
    }
  };

  // Delete item function
  const handleDeleteItemClick = (itemName: string, itemKey: string) => {
    setItemToDelete({ name: itemName, key: itemKey });
    setShowDeleteItemModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeletingItem(true);
    try {
      const itemKey = itemToDelete.key;
      // Check if any pledge contains this item
      const hasPledges = pledges.some((pledge) =>
        Object.keys(pledge.items).includes(itemKey),
      );
      if (hasPledges) {
        // Ask for extra confirmation because pledges exist
        if (
          !window.confirm(
            `⚠️ Warning: This item has existing pledges. Deleting it will remove the item from all those pledges. Continue?`,
          )
        ) {
          setShowDeleteItemModal(false);
          setDeletingItem(false);
          return;
        }
        // Remove item from all pledges
        const updatePromises = pledges.map(async (pledge) => {
          if (pledge.items[itemKey]) {
            const newItems = { ...pledge.items };
            delete newItems[itemKey];
            const pledgeRef = ref(database, `pledges/${pledge.id}`);
            await update(pledgeRef, { items: newItems });
          }
        });
        await Promise.all(updatePromises);
      }
      // Delete the item node
      const itemRef = ref(database, `items/${itemKey}`);
      await remove(itemRef);
      setMessage(`✅ Item "${itemToDelete.name}" deleted successfully.`);
      // Exit edit mode if open
      setEditMode(false);
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to delete item.");
    } finally {
      setDeletingItem(false);
      setShowDeleteItemModal(false);
      setItemToDelete(null);
    }
  };

  // Open confirmation modals
  const openSaveConfirm = () => setShowSaveConfirmModal(true);
  const openAddConfirm = () => {
    if (!newItemName.trim()) {
      setMessage("❌ Item name is required.");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    const requiredNum = parseInt(newItemRequired) || 0;
    if (requiredNum <= 0) {
      setMessage("❌ Required quantity must be a positive number.");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    setShowAddConfirmModal(true);
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
          <button
            onClick={seedFromPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm"
          >
            📦 Seed PDF Data
          </button>
          {!editMode ? (
            <button
              onClick={handleEditClick}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm"
            >
              Edit Required & Prices
            </button>
          ) : (
            <>
              <button
                onClick={openSaveConfirm}
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
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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
            <input
              type="number"
              step="0.01"
              placeholder="Unit price (KES)"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700"
            />
            <button
              onClick={openAddConfirm}
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
                value={editedItems[name]?.required ?? config.required}
                onChange={(e) => handleRequiredChange(name, e.target.value)}
                className="border rounded px-2 py-1 w-28 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-500">{config.unit}</span>
              <input
                type="number"
                step="0.01"
                value={editedItems[name]?.unitPrice ?? config.unitPrice ?? 0}
                onChange={(e) => handlePriceChange(name, e.target.value)}
                placeholder="Unit price (KES)"
                className="border rounded px-2 py-1 w-32 dark:bg-gray-700"
              />
              <button
                onClick={() => handleDeleteItemClick(name, name)}
                className="ml-auto text-red-600 hover:text-red-800"
                aria-label="Delete item"
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <ItemSummaryCards />

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Pledges</h2>
          <button
            onClick={downloadPledgesAsCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1"
          >
            📥 Download CSV
          </button>
        </div>
        <AdminPledgeTable />
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow z-50">
          {message}
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm Changes</h3>
            <p className="mb-6">
              Are you sure you want to update the required quantities and prices
              for all items? This action cannot be undone immediately (you can
              edit again).
            </p>
            <div className="flex gap-3">
              <button
                onClick={saveRequiredQuantities}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
              >
                Yes, Save
              </button>
              <button
                onClick={() => setShowSaveConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Confirmation Modal */}
      {showAddConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Confirm New Item</h3>
            <div className="space-y-2 mb-6">
              <p>
                <strong>Name:</strong> {newItemName}
              </p>
              <p>
                <strong>Required:</strong> {newItemRequired} {newItemUnit}
              </p>
              <p>
                <strong>Unit Price:</strong> KES {parseFloat(newItemPrice) || 0}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddItem}
                disabled={addingItem}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
              >
                {addingItem ? "Adding..." : "Yes, Add Item"}
              </button>
              <button
                onClick={() => setShowAddConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {showDeleteItemModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Delete Item</h3>
            <p className="mb-2">
              Are you sure you want to delete{" "}
              <strong>“{itemToDelete.name}”</strong>?
            </p>
            {pledges.some((p) => p.items[itemToDelete.key]) && (
              <p className="text-red-600 text-sm mb-4">
                ⚠️ This item has existing pledges. Deleting it will remove the
                item from all those pledges.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmDeleteItem}
                disabled={deletingItem}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded disabled:opacity-50"
              >
                {deletingItem ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteItemModal(false)}
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

// Login & wrapper (unchanged)
export default function AdminClient() {
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
            {authError && (
              <p className="text-red-600 text-sm mb-4">{authError}</p>
            )}
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
