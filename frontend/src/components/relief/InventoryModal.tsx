import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Warehouse,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  ResourceInventoryItem,
  ResourceCategory,
} from '../../types/relief';
import { CATEGORY_OPTIONS } from '../../data/reliefDemoData';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItem?: ResourceInventoryItem | null;
  onSave: (item: Partial<ResourceInventoryItem> & { id?: string; incomingQty?: number }) => void;
}

const STORAGE_LOCATIONS = [
  'Nagpur Central Warehouse (Sitabuldi)',
  'GMCH Medical Depot',
  'Kalamna Logistics Terminal Hub',
  'Sadar Red Cross Warehouse',
  'Hingna Disaster Reserve',
  'Nagpur Fire & Rescue Station (Civil Lines)',
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  existingItem,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(existingItem);

  // Form Fields
  const [name, setName] = useState(existingItem?.name || '');
  const [category, setCategory] = useState<ResourceCategory>(
    existingItem?.category || 'FOOD_NUTRITION'
  );
  const [totalStock, setTotalStock] = useState<number>(existingItem?.totalStock || 100);
  const [incomingQty, setIncomingQty] = useState<number>(0);
  const [unit, setUnit] = useState(existingItem?.unit || 'units');
  const [storageLocation, setStorageLocation] = useState(
    existingItem?.storageLocation || STORAGE_LOCATIONS[0]
  );
  const [reorderThreshold, setReorderThreshold] = useState<number>(
    existingItem?.reorderThreshold || 25
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Resource name is required.');
      return;
    }

    if (!isEditing && totalStock < 0) {
      setError('Initial stock cannot be negative.');
      return;
    }

    if (isEditing && incomingQty < 0) {
      setError('Incoming quantity cannot be negative.');
      return;
    }

    if (isEditing && existingItem) {
      onSave({
        id: existingItem.id,
        totalStock: existingItem.totalStock + incomingQty,
        incomingQty,
        storageLocation,
        reorderThreshold,
        lastVerifiedAt: new Date().toISOString(),
      });
    } else {
      const newId = `RES-NGP-${Math.floor(20 + Math.random() * 80)}`;
      onSave({
        id: newId,
        name: name.trim(),
        category,
        totalStock,
        reservedStock: 0,
        unit: unit.trim() || 'units',
        storageLocation,
        reorderThreshold,
        lastVerifiedAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isEditing ? 'Record Incoming Stock' : 'Add Relief Resource'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Nagpur Municipal Emergency Inventory
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isEditing && existingItem ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-sm">{existingItem.name}</div>
              <div className="text-slate-500 text-[11px]">
                {existingItem.storageLocation} • Currently: {existingItem.totalStock} {existingItem.unit} (Available: {existingItem.totalStock - existingItem.reservedStock})
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resource / Supply Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Water purification tablets, Blankets"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="packets, cans (20L), kits"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Quantity Controls */}
          {isEditing ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Incoming Shipment Quantity (+ to Total Stock)
              </label>
              <input
                type="number"
                min={0}
                value={incomingQty}
                onChange={(e) => setIncomingQty(parseInt(e.target.value) || 0)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                New Total Stock will be: {(existingItem?.totalStock || 0) + incomingQty} {existingItem?.unit}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Total Stock *
                </label>
                <input
                  type="number"
                  min={0}
                  value={totalStock}
                  onChange={(e) => setTotalStock(parseInt(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reorder Alert Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  value={reorderThreshold}
                  onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                />
              </div>
            </div>
          )}

          {/* Storage Depot Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nagpur Storage Location Depot
            </label>
            <select
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
            >
              {STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Update Stock' : 'Add Resource'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
