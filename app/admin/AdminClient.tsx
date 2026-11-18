"use client";

import { useState, useEffect } from "react";
import { database } from "@/app/lib/firebase";
import { ref, update, set, get, remove } from "firebase/database";
import { RealTimeProvider, useRealTime } from "../components/RealTimeProvider";
import ItemSummaryCards from "../components/ItemSummaryCards";
import AdminPledgeTable from "../components/AdminPledgeTable";
import { ItemsMap } from "@/app/types";

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

  // Search state for filtering items
  const [itemSearchTerm, setItemSearchTerm] = useState("");

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

  // Seed PDF data – matched to Zimmerman Pathfinder Camporee 2026
const seedFromPDF = async () => {
  const pdfItems = {
    uji_flour_wimbi: { required: 30, unit: "Kgs", unitPrice: 250 },
    milk: { required: 4, unit: "Crates", unitPrice: 6500 }, // Total: 26,000 KSH
    rice: { required: 150, unit: "Kgs", unitPrice: 180 },
    chapati_flour: { required: 50, unit: "Packets", unitPrice: 190 },
    ugali_flour: { required: 10, unit: "Packets (100kg)", unitPrice: 1700 }, // Total: 17,000 KSH
    beans: { required: 105, unit: "Kgs", unitPrice: 171 }, // Total: 18,000 KSH (@ 170/kg approx)
    lentils_kamande: { required: 100, unit: "Kgs", unitPrice: 80 }, // Total: 8,000 KSH (100kg @ 80)
    nderu: { required: 40, unit: "Kgs", unitPrice: 90 }, // Total: 3,600 KSH (40kg @ 90)
    sosi_soya: { required: 1, unit: "Bulk", unitPrice: 4000 },
    eggs: { required: 10, unit: "Crates", unitPrice: 1920 },
    pasta: { required: 20, unit: "Kgs", unitPrice: 400 },
    bread: { required: 280, unit: "Packets", unitPrice: 93 }, // Total: 26,000 KSH (~92.86 per packet)
    sweet_potatoes: { required: 1, unit: "Sack", unitPrice: 5000 },
    nduma: { required: 1, unit: "Sack", unitPrice: 6000 },
    irish_potatoes: { required: 2, unit: "Sacks", unitPrice: 9000 },
    green_maize: { required: 1, unit: "Sack", unitPrice: 2000 },
    cabbage: { required: 1, unit: "Bulk", unitPrice: 2800 },
    greens: { required: 8, unit: "Lots", unitPrice: 2000 },
    mala: { required: 40, unit: "Packets", unitPrice: 100 },
    fruits: { required: 4000, unit: "Pcs", unitPrice: 6.75 }, // Total: 27,000 KSH
    mandazi_flour: { required: 36, unit: "Packets", unitPrice: 190 },
    sugar: { required: 30, unit: "Kgs", unitPrice: 100 }, // Total: 3,000 KSH
    chocolate: { required: 1, unit: "Bulk", unitPrice: 2000 },
    soya: { required: 1, unit: "Bulk", unitPrice: 400 },
    onions: { required: 4, unit: "Nets", unitPrice: 625 }, // Total: 2,500 KSH
    tomatoes: { required: 2, unit: "Crates", unitPrice: 4830 }, // Total: 9,660 KSH
    carrots: { required: 1, unit: "Bulk", unitPrice: 3000 },
    garlic: { required: 1, unit: "Bulk", unitPrice: 4000 },
    salt: { required: 1, unit: "Bulk", unitPrice: 1000 },
    french_beans: { required: 1, unit: "Bulk", unitPrice: 2000 },
    cooking_oil: { required: 60, unit: "Liters", unitPrice: 250 }, // Total: 15,000 KSH
    charcoal: { required: 2, unit: "Sacks", unitPrice: 5000 }, // Total: 10,000 KSH
    gas: { required: 4, unit: "Mekos", unitPrice: 1750 }, // Total: 7,000 KSH
    jiko: { required: 1, unit: "Bulk", unitPrice: 8000 },
    soap_and_detergents: { required: 1, unit: "Bulk", unitPrice: 4000 },
    drinking_water: { required: 35, unit: "Crates", unitPrice: 200 },
    soda_drinks: { required: 100, unit: "Pcs", unitPrice: 100 },
  };

    const newItems: Record<
      string,
      { required: number; unit: string; unitPrice: number; pledged: number }
    > = {};
    for (const [key, val] of Object.entries(pdfItems)) {
      newItems[key] = { ...val, pledged: 0 };
    }

    try {
      await set(ref(database, "items"), newItems);
      setMessage("✅ Camporee 2026 budget data seeded successfully! (Old data removed)");
      refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to seed data.");
    }
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
      const hasPledges = pledges.some((pledge) => pledge.items && pledge.items[itemKey]);
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
          if (pledge.items && pledge.items[itemKey]) {
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

  // Filter items based on search term
  const getFilteredItems = (): ItemsMap => {
    if (!items) return {};
    if (!itemSearchTerm.trim()) return items;
    const term = itemSearchTerm.toLowerCase().trim();
    const filtered: ItemsMap = {};
    Object.entries(items).forEach(([key, value]) => {
      if (key.toLowerCase().includes(term)) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  const filteredItems = getFilteredItems();

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Item Summary</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            + Add New Item
          </button>
          <button
            onClick={seedFromPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            📦 Seed PDF Data
          </button>
          {!editMode ? (
            <button
              onClick={handleEditClick}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
            >
              Edit Required & Prices
            </button>
          ) : (
            <>
              <button
                onClick={openSaveConfirm}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow border border-gray-200 dark:border-gray-700 transition-colors">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Add New Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Item name (e.g., Maize Flour)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Required quantity"
              value={newItemRequired}
              onChange={(e) => setNewItemRequired(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="border rounded px-2 py-1 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
              className="border rounded px-2 py-1 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={openAddConfirm}
              disabled={addingItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              {addingItem ? "Adding..." : "Add Item"}
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search items..."
          value={itemSearchTerm}
          onChange={(e) => setItemSearchTerm(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
        />
        {itemSearchTerm && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {Object.keys(filteredItems).length} of {Object.keys(items || {}).length} items
          </span>
        )}
      </div>

      {editMode && items && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3 shadow border border-gray-200 dark:border-gray-700 transition-colors">
          {Object.keys(filteredItems).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No items match your search.</p>
          ) : (
            Object.entries(filteredItems).map(([name, config]) => (
              <div key={name} className="flex flex-wrap items-center gap-4">
                <label className="w-28 font-semibold capitalize text-gray-800 dark:text-gray-200">{name}</label>
                <input
                  type="number"
                  value={editedItems[name]?.required ?? config.required}
                  onChange={(e) => handleRequiredChange(name, e.target.value)}
                  className="border rounded px-2 py-1 w-28 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">{config.unit}</span>
                <input
                  type="number"
                  step="0.01"
                  value={editedItems[name]?.unitPrice ?? config.unitPrice ?? 0}
                  onChange={(e) => handlePriceChange(name, e.target.value)}
                  placeholder="Unit price (KES)"
                  className="border rounded px-2 py-1 w-32 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
                <button
                  onClick={() => handleDeleteItemClick(name, name)}
                  className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  aria-label="Delete item"
                >
                  🗑️ Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <ItemSummaryCards searchTerm={itemSearchTerm} />

      <div className="mt-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Pledges</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={downloadPledgesAsCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors"
            >
              📥 Download CSV
            </button>
            <button
              onClick={handleDeleteAllClick}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors"
            >
              🗑️ Delete All
            </button>
          </div>
        </div>
        <AdminPledgeTable />
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded shadow z-50 border border-gray-600">
          {message}
        </div>
      )}

      {/* Modals */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Changes</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to update the required quantities and prices
              for all items? This action cannot be undone immediately (you can
              edit again).
            </p>
            <div className="flex gap-3">
              <button
                onClick={saveRequiredQuantities}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-colors"
              >
                Yes, Save
              </button>
              <button
                onClick={() => setShowSaveConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm New Item</h3>
            <div className="space-y-2 mb-6 text-gray-700 dark:text-gray-300">
              <p><strong>Name:</strong> {newItemName}</p>
              <p><strong>Required:</strong> {newItemRequired} {newItemUnit}</p>
              <p><strong>Unit Price:</strong> KES {parseFloat(newItemPrice) || 0}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddItem}
                disabled={addingItem}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-colors"
              >
                {addingItem ? "Adding..." : "Yes, Add Item"}
              </button>
              <button
                onClick={() => setShowAddConfirmModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteItemModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Item</h3>
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <strong>“{itemToDelete.name}”</strong>?
            </p>
            {pledges.some((p) => p.items && p.items[itemToDelete.key]) && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                ⚠️ This item has existing pledges. Deleting it will remove the
                item from all those pledges.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmDeleteItem}
                disabled={deletingItem}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded disabled:opacity-50 transition-colors"
              >
                {deletingItem ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteItemModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete All Pledges</h3>
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <strong>ALL</strong> pledges?
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">
              ⚠️ This action cannot be undone. All pledge records will be
              permanently removed.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmDeleteAll}
                disabled={deletingAll}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded disabled:opacity-50 transition-colors"
              >
                {deletingAll ? "Deleting..." : "Yes, Delete All"}
              </button>
              <button
                onClick={() => setShowDeleteAllModal(false)}
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

export default function AdminClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(SESSION_KEY) === "true";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(stored);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {authError && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">{authError}</p>
            )}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
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