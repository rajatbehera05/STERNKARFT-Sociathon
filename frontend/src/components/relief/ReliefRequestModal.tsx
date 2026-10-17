import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  MapPin,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Users,
  Compass,
} from 'lucide-react';
import {
  ReliefRequest,
  RequesterType,
  ReliefCategory,
  UrgencyLevel,
  RequestItem,
} from '../../types/relief';
import {
  NAGPUR_LANDMARKS,
  CATEGORY_OPTIONS,
  isCoordinateWithinNagpur,
} from '../../data/reliefDemoData';
import { NagpurReliefMap } from './NagpurReliefMap';

interface ReliefRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: ReliefRequest) => void;
}

interface ItemDraft {
  id: string;
  category: ReliefCategory;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

export const ReliefRequestModal: React.FC<ReliefRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  // Auto-generate request ID
  const [autoId] = useState(() => `REQ-NGP-${Math.floor(100 + Math.random() * 900)}`);

  // Form Fields
  const [requesterType, setRequesterType] = useState<RequesterType>('AFFECTED_PERSON');
  const [requesterName, setRequesterName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [organization, setOrganization] = useState('');

  // Location
  const [locality, setLocality] = useState('Sitabuldi / Civil Lines');
  const [addressOrLandmark, setAddressOrLandmark] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 21.1466,
    lng: 79.0827,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);

  // People & Situation
  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [hasImmediateHealthThreat, setHasImmediateHealthThreat] = useState(false);
  const [situationDescription, setSituationDescription] = useState('');

  // Urgency
  const [urgency, setUrgency] = useState<UrgencyLevel>('URGENT');
  const [urgencyReason, setUrgencyReason] = useState('Initial field assessment upon submission.');

  // Items Requested
  const [items, setItems] = useState<ItemDraft[]>([
    {
      id: 'draft-item-1',
      category: 'SAFE_WATER',
      name: 'Drinking water (20L Jerry Cans)',
      quantity: 10,
      unit: 'cans (20L)',
      notes: '',
    },
  ]);

  // Validation & Submission State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Landmark Shortcut selection
  const handleSelectLandmark = (landmark: typeof NAGPUR_LANDMARKS[0]) => {
    setLocality(landmark.locality);
    setAddressOrLandmark(landmark.name);
    setCoords({ lat: landmark.lat, lng: landmark.lng });
  };

  // Add Item
  const handleAddItem = () => {
    const defaultCat = CATEGORY_OPTIONS[0];
    setItems((prev) => [
      ...prev,
      {
        id: `draft-item-${Date.now()}`,
        category: defaultCat.category,
        name: defaultCat.sampleItems[0],
        quantity: 5,
        unit: 'units',
        notes: '',
      },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update Item field
  const handleUpdateItem = (id: string, updates: Partial<ItemDraft>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If category changed, update default item name
          if (updates.category && updates.category !== item.category) {
            const catDef = CATEGORY_OPTIONS.find((c) => c.category === updates.category);
            if (catDef && catDef.sampleItems.length > 0) {
              updated.name = catDef.sampleItems[0];
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validations
    if (!locality.trim() && !addressOrLandmark.trim()) {
      setValidationError('Please provide a locality or landmark address in Nagpur.');
      return;
    }

    if (peopleAffected < 1) {
      setValidationError('People affected must be at least 1 person.');
      return;
    }

    if (items.length === 0) {
      setValidationError('Please specify at least one relief item.');
      return;
    }

    for (const item of items) {
      if (!item.name.trim()) {
        setValidationError('Each requested item must have a name.');
        return;
      }
      if (item.quantity <= 0 || isNaN(item.quantity)) {
        setValidationError(`Quantity for "${item.name}" must be greater than 0.`);
        return;
      }
    }

    const isWithinBounds = isCoordinateWithinNagpur(coords.lat, coords.lng);

    const convertedItems: RequestItem[] = items.map((item, index) => ({
      id: `item-${autoId.toLowerCase()}-${index + 1}`,
      category: item.category,
      name: item.name,
      requestedQty: Number(item.quantity),
      allocatedQty: 0,
      fulfilledQty: 0,
      unit: item.unit || 'units',
      notes: item.notes,
    }));

    const newRequest: ReliefRequest = {
      id: autoId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requesterType,
      requesterName: requesterName.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      organization: organization.trim() || undefined,
      location: {
        locality: locality.trim(),
        addressOrLandmark: addressOrLandmark.trim() || locality.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        isWithinNagpurBounds: isWithinBounds,
      },
      peopleAffected,
      items: convertedItems,
      hasImmediateHealthThreat,
      situationDescription:
        situationDescription.trim() ||
        `Relief request logged from ${locality}. Emergency assistance needed for ${peopleAffected} people.`,
      verificationStatus: 'PENDING', // All new requests start as Pending Verification
      urgency,
      urgencyReason: urgencyReason.trim() || 'Assessed during initial intake.',
      operatorNotes: isWithinBounds
        ? 'Incoming emergency intake. Awaiting verification triage.'
        : 'Warning: Reported coordinates are outside standard Nagpur bounds. Cross-verification required.',
    };

    setIsSuccess(true);
    setTimeout(() => {
      onSubmit(newRequest);
      onClose();
    }, 900);
  };

  const isWithinNagpur = isCoordinateWithinNagpur(coords.lat, coords.lng);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Request Emergency Relief</h2>
                <span className="font-mono text-[11px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
                  {autoId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nagpur Municipal Relief Intake & Coordination Network
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

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Relief Request Logged</h3>
            <p className="text-sm text-slate-600 max-w-md">
              Request <strong>{autoId}</strong> has been added to the Nagpur live map and verification queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            {/* Validation Banner */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Section 1: Requester Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>1. Requester Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requester Role *
                  </label>
                  <select
                    value={requesterType}
                    onChange={(e) => setRequesterType(e.target.value as RequesterType)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
                  >
                    <option value="AFFECTED_PERSON">Affected Person (Citizen / Civilian)</option>
                    <option value="FIELD_RESPONDER">Field Responder (NDRF / Civil Defense)</option>
                    <option value="SHELTER_COORDINATOR">Shelter Coordinator (Camp Lead)</option>
                    <option value="RELIEF_OPERATOR">Relief Operator (NGO / Hospital Team)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="e.g., Rajesh Kolhe"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Radio (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g., +91 98230 00000"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {(requesterType === 'SHELTER_COORDINATOR' || requesterType === 'FIELD_RESPONDER') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Camp / Shelter / Unit Name
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Sadar Primary School Relief Shelter #2"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>

            {/* Section 2: Real Nagpur Location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>2. Nagpur Location & Geotag</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{showMapPicker ? 'Close Map View' : 'Pin On Real Nagpur Map'}</span>
                </button>
              </div>

              {/* Quick Landmark Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Quick Select Common Nagpur Emergency Locations:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {NAGPUR_LANDMARKS.slice(0, 6).map((lm) => (
                    <button
                      key={lm.name}
                      type="button"
                      onClick={() => handleSelectLandmark(lm)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {lm.locality}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Locality / Ward *
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g., Mahal Old City, Dharampeth"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address, Shelter or Landmark *
                  </label>
                  <input
                    type="text"
                    value={addressOrLandmark}
                    onChange={(e) => setAddressOrLandmark(e.target.value)}
                    placeholder="e.g., Near Gandhi Gate, Community Hall #2"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Coordinates Preview & Out-of-bounds flag */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Map Coordinates:</span>
                  <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                    {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
                  </span>
                </div>

                {isWithinNagpur ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Within Nagpur Service Area</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Outside Nagpur Municipal Service Bounds</span>
                  </span>
                )}
              </div>

              {/* Embedded Interactive Map in Picker Mode */}
              {showMapPicker && (
                <div className="mt-2 space-y-1">
                  <div className="text-[11px] text-slate-500">
                    Click anywhere on the map or drag the pin to set the exact coordinates:
                  </div>
                  <NagpurReliefMap
                    requests={[]}
                    selectedRequest={null}
                    onSelectRequest={() => {}}
                    isPickerMode={true}
                    pickerCoords={coords}
                    onPickCoords={(newCoords) => setCoords(newCoords)}
                    className="h-64 sm:h-72"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Headcount & Situation */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>3. Situation Assessment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    People Affected *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={peopleAffected}
                    onChange={(e) => setPeopleAffected(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Urgency Tier
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-semibold outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="IMMEDIATE">IMMEDIATE (Threat to Life / Severe)</option>
                    <option value="URGENT">URGENT (Critical Needs Soon)</option>
                    <option value="ELEVATED">ELEVATED (Timely Assistance Needed)</option>
                    <option value="ROUTINE">ROUTINE (Standard Distribution)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasImmediateHealthThreat}
                      onChange={(e) => setHasImmediateHealthThreat(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-xs font-bold text-red-700">
                      Immediate Health / Life Threat
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Rationale
                </label>
                <input
                  type="text"
                  value={urgencyReason}
                  onChange={(e) => setUrgencyReason(e.target.value)}
                  placeholder="e.g., Trapped family with rising water level / High number of infants."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Situation Description
                </label>
                <textarea
                  rows={2}
                  value={situationDescription}
                  onChange={(e) => setSituationDescription(e.target.value)}
                  placeholder="Describe current physical conditions, access routes, or special vulnerabilities..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Section 4: Requested Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>4. Requested Items & Supplies</span>
                </h3>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  <span>Add Another Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const catDef = CATEGORY_OPTIONS.find((c) => c.category === item.category);

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 uppercase">
                          Item #{index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        {/* Category */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) =>
                              handleUpdateItem(item.id, {
                                category: e.target.value as ReliefCategory,
                              })
                            }
                            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 font-medium"
                          >
                            {CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt.category} value={opt.category}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Item Name / Preset */}
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                            placeholder="e.g., Drinking water, Tarpaulins"
                            list={`presets-${item.id}`}
                            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800"
                            required
                          />
                          <datalist id={`presets-${item.id}`}>
                            {catDef?.sampleItems.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, {
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 font-semibold"
                            required
                          />
                        </div>

                        {/* Unit */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value })}
                            placeholder="packets, kits"
                            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                All submitted requests enter <strong>Pending Verification</strong>.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Submit Relief Request</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
