import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  PackageCheck,
  AlertTriangle,
  Warehouse,
  Truck,
} from 'lucide-react';
import {
  ReliefRequest,
  ResourceInventoryItem,
} from '../../types/relief';

interface ResourceMatchingModalProps {
  request: ReliefRequest | null;
  isOpen: boolean;
  onClose: () => void;
  inventory: ResourceInventoryItem[];
  onConfirmAllocation: (
    requestId: string,
    itemId: string,
    resourceId: string,
    allocatedQty: number,
    assignedResponder?: string,
    notes?: string
  ) => void;
}

export const ResourceMatchingModal: React.FC<ResourceMatchingModalProps> = ({
  request,
  isOpen,
  onClose,
  inventory,
  onConfirmAllocation,
}) => {
  if (!isOpen || !request) return null;

  // Selected item to allocate
  const [selectedItemId, setSelectedItemId] = useState<string>(
    request.items[0]?.id || ''
  );
  const selectedItem = request.items.find((i) => i.id === selectedItemId);

  // Allocation Inputs
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [allocateQty, setAllocateQty] = useState<number>(0);
  const [assignedResponder, setAssignedResponder] = useState('Nagpur Municipal Relief Van #1');
  const [notes, setNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Filter matching inventory resources for the selected item
  const matchingResources = inventory.filter((res) => {
    if (!selectedItem) return false;
    // Category match or name similarity
    return (
      res.category === selectedItem.category ||
      res.name.toLowerCase().includes(selectedItem.name.toLowerCase().slice(0, 5))
    );
  });

  const selectedResource = inventory.find((r) => r.id === selectedResourceId);
  const availableStock = selectedResource
    ? Math.max(0, selectedResource.totalStock - selectedResource.reservedStock)
    : 0;

  const remainingNeeded = selectedItem
    ? Math.max(0, selectedItem.requestedQty - selectedItem.fulfilledQty - selectedItem.allocatedQty)
    : 0;

  const handleSelectResource = (res: ResourceInventoryItem) => {
    setSelectedResourceId(res.id);
    const available = Math.max(0, res.totalStock - res.reservedStock);
    // Auto-fill optimal allocation: min(remainingNeeded, available)
    setAllocateQty(Math.min(remainingNeeded, available));
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!selectedItem) return;

    if (request.verificationStatus !== 'VERIFIED') {
      setFeedbackMessage({
        type: 'error',
        text: 'Only verified relief requests can be allocated emergency inventory.',
      });
      return;
    }

    if (!selectedResourceId) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please select an inventory resource to allocate.',
      });
      return;
    }

    if (allocateQty <= 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Allocated quantity must be greater than 0.',
      });
      return;
    }

    if (allocateQty > availableStock) {
      setFeedbackMessage({
        type: 'error',
        text: `Cannot allocate ${allocateQty} units. Only ${availableStock} units are unreserved in ${selectedResource?.storageLocation}.`,
      });
      return;
    }

    if (allocateQty > remainingNeeded) {
      setFeedbackMessage({
        type: 'error',
        text: `Allocated quantity (${allocateQty}) exceeds remaining unmet need (${remainingNeeded}).`,
      });
      return;
    }

    onConfirmAllocation(
      request.id,
      selectedItem.id,
      selectedResourceId,
      allocateQty,
      assignedResponder.trim() || undefined,
      notes.trim() || undefined
    );

    setFeedbackMessage({
      type: 'success',
      text: `Successfully allocated ${allocateQty} ${selectedItem.unit} from ${selectedResource?.storageLocation}. Assigned to delivery queue!`,
    });

    // Reset allocation input
    setAllocateQty(0);
    setSelectedResourceId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Request-to-Resource Matching</h2>
                <span className="font-mono text-[11px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
                  {request.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Destination: {request.location.locality} ({request.location.addressOrLandmark})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Feedback Banner */}
          {feedbackMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{feedbackMessage.text}</span>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="font-bold underline text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Verification check warning if not verified */}
          {request.verificationStatus !== 'VERIFIED' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-bold">
                  Request Not Verified ({request.verificationStatus.replace('_', ' ')})
                </strong>
                Under standard disaster coordination protocols, inventory cannot be reserved or dispatched until the incident is verified by an operator.
              </div>
            </div>
          )}

          {/* Step 1: Select which item of the request to allocate */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Select Requested Item to Fulfill
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {request.items.map((item) => {
                const remaining = Math.max(0, item.requestedQty - item.fulfilledQty - item.allocatedQty);
                const isSelected = item.id === selectedItemId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setSelectedResourceId('');
                      setAllocateQty(0);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-300/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.category.replace('_', ' ')}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                      <span className="text-slate-500">Unmet Needed:</span>
                      <span className={`font-mono font-bold ${remaining > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {remaining} {item.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Compatible Inventory in Nagpur Depots */}
          {selectedItem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Compatible Nagpur Storage Depots & Available Stock
                </label>
                <span className="text-[11px] text-slate-500">
                  Category: <strong>{selectedItem.category.replace('_', ' ')}</strong>
                </span>
              </div>

              {matchingResources.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    No inventory items found matching category &quot;{selectedItem.category}&quot;. Please record incoming supplies in the Inventory tab.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {matchingResources.map((res) => {
                    const avail = Math.max(0, res.totalStock - res.reservedStock);
                    const isShortage = avail < remainingNeeded;
                    const isSelected = res.id === selectedResourceId;

                    return (
                      <div
                        key={res.id}
                        onClick={() => handleSelectResource(res)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-300/50'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{res.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Warehouse className="w-3 h-3 text-slate-400" />
                              <span>{res.storageLocation}</span>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {res.id}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Total</span>
                            <span className="font-mono font-medium">{res.totalStock}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Reserved</span>
                            <span className="font-mono text-amber-700 font-medium">{res.reservedStock}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Available</span>
                            <span className={`font-mono font-bold ${avail > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {avail} {res.unit}
                            </span>
                          </div>
                        </div>

                        {isShortage && avail > 0 && (
                          <div className="mt-1.5 text-[10.5px] text-amber-700 font-medium">
                            Partial stock: {remainingNeeded - avail} shortage
                          </div>
                        )}
                        {avail === 0 && (
                          <div className="mt-1.5 text-[10.5px] text-red-600 font-bold">
                            Stock depleted at this depot
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Allocation Quantity & Dispatch Form */}
          {selectedResource && (
            <form onSubmit={handleAllocate} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Confirm Allocation & Assign Logistics
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Quantity to Allocate ({selectedItem?.unit}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={availableStock}
                    value={allocateQty}
                    onChange={(e) => setAllocateQty(parseInt(e.target.value) || 0)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Max available: {availableStock}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Assigned Field Unit / Transporter
                  </label>
                  <input
                    type="text"
                    value={assignedResponder}
                    onChange={(e) => setAssignedResponder(e.target.value)}
                    placeholder="e.g., Nagpur Municipal Relief Van #2, NDRF Boat Team"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dispatch Notes / Waybill
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Immediate dispatch via Central Ave route."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Allocating will reserve <strong>{allocateQty}</strong> units and generate a delivery tracking task.
                </div>

                <button
                  type="submit"
                  disabled={allocateQty <= 0 || request.verificationStatus !== 'VERIFIED'}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span>Confirm Allocation & Dispatch</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Nagpur Request-to-Resource Matching Workspace
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </motion.div>
    </div>
  );
};
