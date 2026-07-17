"use client";

import { useState } from "react";
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

  // Delete all pledges state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Helper to compute pledge total
  const computePledgeTotal = (pledgeItems: {
    [key: string]: number;
  }): number => {
    if (!items) return 0;
    return Object.entries(pledgeItems).reduce((total, [itemName, qty]) => {
      const unitPrice = items[itemName]?.unitPrice || 0;
      return total + qty * unitPrice;
    }, 0);
  };

  // CSV Export Function
  const downloadPledgesAsCSV = () => {
    if (!pledges || pledges.length === 0) {
      setMessage("No pledges to export.");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    const headers = [
      "Member Name",
      "Phone",
      "Date",
      "Total (KES)",
      "Status",
      "Items (item: quantity)",
    ];
    const rows = pledges.map((pledge) => [
      pledge.memberName,
      pledge.phone,
      new Date(pledge.timestamp).toLocaleString(),
      pledge.totalAmount?.toFixed(2) ||
        computePledgeTotal(pledge.items).toFixed(2),
      pledge.paymentStatus || "pending",
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

  // Seed PDF data – updated with 2026 Camp Meeting Budget
  const seedFromPDF = async () => {
    const pdfItems = {
      // --- Catering Items ---
      beans: { required: 160, unit: "kg", unitPrice: 140 },
      eggs: { required: 25, unit: "Trays", unitPrice: 450 },
      lentils: { required: 43, unit: "kg", unitPrice: 220 },
      white_kunde: { required: 30, unit: "kg", unitPrice: 130 },
      red_kunde: { required: 40, unit: "kg", unitPrice: 140 },
      dengu: { required: 60, unit: "kg", unitPrice: 155 },
      maize_meal_flour: { required: 164, unit: "kg", unitPrice: 75 },
      brown_flour: { required: 70, unit: "kg", unitPrice: 120 },
      wheat_flour_exe: { required: 26, unit: "packet", unitPrice: 187 },
      atta_mark_1: { required: 12, unit: "packet", unitPrice: 200 },
      rice_sunrice: { required: 405, unit: "kgs", unitPrice: 160 },
      prestige_or_blue_band: { required: 6, unit: "kg", unitPrice: 400 },
      salt_kensalt: { required: 6, unit: "packet", unitPrice: 70 },
      salad_oil_golden_fry: { required: 10.5, unit: "Liters", unitPrice: 2500 },
      white_pepper: { required: 25, unit: "Jar(100g)", unitPrice: 70 },
      black_pepper: { required: 33, unit: "Jar(100g)", unitPrice: 28 },
      tomato_paste: { required: 21, unit: "Tin(3.3)", unitPrice: 100 },
      mixed_spices: { required: 2, unit: "Tin", unitPrice: 200 },
      soy_sauce: { required: 2, unit: "Bottle(750ml)", unitPrice: 245 },
      self_raising_exe: { required: 24, unit: "packet", unitPrice: 208 },
      bananas: { required: 100, unit: "kgs", unitPrice: 60 },
      garam_masala: { required: 2, unit: "Tin", unitPrice: 200 },
      vinegar_white: { required: 1, unit: "700mls", unitPrice: 350 },
      mala_milk: { required: 10, unit: "1Ltr", unitPrice: 165 },
      milk_longlife: { required: 28, unit: "ctn", unitPrice: 620 },
      bread_pieces: { required: 30, unit: "pieces", unitPrice: 140 },
      sugar: { required: 50, unit: "kg", unitPrice: 160 },
      soya_grams: { required: 1, unit: "kg", unitPrice: 450 },
      drinking_chocolate: { required: 10, unit: "Grams(200)", unitPrice: 450 },
      toothpicks: { required: 12, unit: "jar", unitPrice: 70 },
      serviettes: { required: 36, unit: "packet", unitPrice: 100 },
      foil_paper: { required: 2, unit: "rolls", unitPrice: 1500 },
      paper_towels: { required: 6, unit: "rolls", unitPrice: 120 },
      bio_gel: { required: 24, unit: "bottle", unitPrice: 170 },
      bar_soap_menengai: { required: 6, unit: "kg", unitPrice: 155 },
      detergent: { required: 3, unit: "kg", unitPrice: 245 },
      moto_sawa_gel: { required: 3, unit: "5 litre", unitPrice: 1350 },
      steel_wool: { required: 2, unit: "bale", unitPrice: 200 },
      corn_pieces: { required: 4, unit: "pieces", unitPrice: 168 },
      scotch_brite_heavy: { required: 12, unit: "pieces", unitPrice: 40 },
      spontex: { required: 2, unit: "pieces", unitPrice: 100 },
      cling_film: { required: 2, unit: "pieces", unitPrice: 750 },
      tomatoes_carton: { required: 1, unit: "carton", unitPrice: 14000 },
      onions: { required: 100, unit: "kg", unitPrice: 100 },
      dhania: { required: 1, unit: "bun", unitPrice: 300 },
      hoho: { required: 1, unit: "kg", unitPrice: 5000 },
      cabbages: { required: 72, unit: "heads", unitPrice: 50 },
      potatoes_irish: { required: 10, unit: "Debe", unitPrice: 900 },
      fresh_ginger: { required: 5, unit: "kg", unitPrice: 350 },
      fresh_garlic: { required: 5, unit: "kg", unitPrice: 400 },
      carrots: { required: 20, unit: "kg", unitPrice: 150 },
      green_peas: { required: 20, unit: "kgs", unitPrice: 250 },
      kienyeji_mboga: { required: 1, unit: "Sack", unitPrice: 18000 },
      lemons_and_chilies: { required: 1, unit: "pcs", unitPrice: 1500 },
      sweet_potatoes: { required: 30, unit: "kgs", unitPrice: 60 },
      nduma: { required: 20, unit: "kg", unitPrice: 100 },
      charcoal_bags: { required: 2, unit: "bags", unitPrice: 3000 },
      gas_cylinder: { required: 3, unit: "cylinder", unitPrice: 7500 },
      mineral_water: { required: 42, unit: "Bale", unitPrice: 350 },

      // --- Accommodation Items ---
      beds: { required: 59, unit: "pieces", unitPrice: 0 },
      duvet_blankets: { required: 67, unit: "pieces", unitPrice: 0 },
      mattresses: { required: 33, unit: "pieces", unitPrice: 0 },
    };

    const updates: Record<
      string,
      { required: number; unit: string; unitPrice: number; pledged: number }
    > = {};
    for (const [key, val] of Object.entries(pdfItems)) {
      updates[`items/${key}`] = { ...val, pledged: 0 };
    }
    await update(ref(database), updates);
    setMessage("✅ Camp Meeting 2026 budget data seeded!");
    refresh();
  };

  // Edit handlers
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

  // Delete item
  const handleDeleteItemClick = (itemName: string, itemKey: string) => {
    setItemToDelete({ name: itemName, key: itemKey });
    setShowDeleteItemModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeletingItem(true);
    try {
      const itemKey = itemToDelete.key;
      const hasPledges = pledges.some((pledge) =>
        Object.keys(pledge.items).includes(itemKey),
      );
      if (hasPledges) {
        if (
          !window.confirm(
            `⚠️ Warning: This item has existing pledges. Deleting it will remove the item from all those pledges. Continue?`,
          )
        ) {
          setShowDeleteItemModal(false);
          setDeletingItem(false);
          return;
        }
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
      const itemRef = ref(database, `items/${itemKey}`);
      await remove(itemRef);
      setMessage(`✅ Item "${itemToDelete.name}" deleted successfully.`);
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

  // Delete all pledges
  const handleDeleteAllClick = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const pledgesRef = ref(database, "pledges");
      await remove(pledgesRef);
      setMessage("✅ All pledges deleted successfully.");
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to delete all pledges.");
    } finally {
      setDeletingAll(false);
      setShowDeleteAllModal(false);
    }
  };

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
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">All Pledges</h2>
          <div className="flex gap-2">
            <button
              onClick={downloadPledgesAsCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1"
            >
              📥 Download CSV
            </button>
            <button
              onClick={handleDeleteAllClick}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1"
            >
              🗑️ Delete All
            </button>
          </div>
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

      {/* Delete All Pledges Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Delete All Pledges</h3>
            <p className="mb-2">
              Are you sure you want to delete <strong>ALL</strong> pledges?
            </p>
            <p className="text-red-600 text-sm mb-4">
              ⚠️ This action cannot be undone. All pledge records will be
              permanently removed.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmDeleteAll}
                disabled={deletingAll}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded disabled:opacity-50"
              >
                {deletingAll ? "Deleting..." : "Yes, Delete All"}
              </button>
              <button
                onClick={() => setShowDeleteAllModal(false)}
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

// Login & wrapper – FIXED: lazy initializer, no useEffect
export default function AdminClient() {
  // ✅ Use state initializer to read sessionStorage (client‑only)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Guard against server‑side rendering
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(SESSION_KEY) === "true";
    }
    return false;
  });

  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

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
