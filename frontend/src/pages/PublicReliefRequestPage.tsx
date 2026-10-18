import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Phone,
  Copy,
  Clock,
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { AppRoute } from '../types';
import { ReliefCategory } from '../types/relief';
import { reliefApi, PublicReliefRequestInput } from '../services/reliefApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface PublicReliefRequestPageProps {
  onNavigate: (route: AppRoute) => void;
}

interface ItemDraft {
  id: string;
  category: ReliefCategory;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

const CATEGORY_DEFINITIONS: Array<{
  id: ReliefCategory;
  label: string;
  description: string;
  defaultItem: string;
  defaultUnit: string;
  icon: string;
}> = [
  {
    id: 'FOOD_NUTRITION',
    label: 'Food & Nutrition',
    description: 'Dry rations, cooked meals, baby food, ready-to-eat packets',
    defaultItem: 'Dry Ration Food Packets (Rice, Dal, Biscuits)',
    defaultUnit: 'packets',
    icon: '🍲',
  },
  {
    id: 'SAFE_WATER',
    label: 'Safe Drinking Water',
    description: 'Packaged drinking water, 20L cans, water purification tablets',
    defaultItem: '20L Drinking Water Cans',
    defaultUnit: 'cans (20L)',
    icon: '💧',
  },
  {
    id: 'SHELTER_BEDDING',
    label: 'Shelter & Bedding',
    description: 'Waterproof tarpaulins, plastic sheets, sleeping mats, blankets',
    defaultItem: 'Waterproof Heavy-Duty Tarpaulins',
    defaultUnit: 'units',
    icon: '⛺',
  },
  {
    id: 'MEDICAL_ASSISTANCE',
    label: 'Medical Assistance',
    description: 'First aid kits, chronic medication, insulin, ORS, antiseptics',
    defaultItem: 'Emergency First Aid & ORS Rehydration Kits',
    defaultUnit: 'kits',
    icon: '🩺',
  },
  {
    id: 'HYGIENE_SANITATION',
    label: 'Hygiene & Sanitation',
    description: 'Sanitary pads, antiseptic soap, chlorine, diapers, toothbrushes',
    defaultItem: 'Sanitary Napkins & Disinfectant Hygiene Kits',
    defaultUnit: 'packs',
    icon: '🧼',
  },
  {
    id: 'CLOTHING_ESSENTIALS',
    label: 'Clothing & Blankets',
    description: 'Warm blankets, dry clothes, raincoats, protective footwear',
    defaultItem: 'Thermal Blankets & Dry Clothing Sets',
    defaultUnit: 'sets',
    icon: '🧥',
  },
  {
    id: 'RESCUE_EVACUATION',
    label: 'Rescue / Evacuation',
    description: 'Inflatable boat extraction, life jackets, stranded elderly/infant evacuation',
    defaultItem: 'Immediate Inflatable Boat Extraction from Flooded Area',
    defaultUnit: 'persons',
    icon: '🚨',
  },
  {
    id: 'OTHER_ESSENTIALS',
    label: 'Other Urgent Relief',
    description: 'Flashlights, power banks, baby diapers, emergency ropes',
    defaultItem: 'Emergency Solar Lanterns / Flashlights with Batteries',
    defaultUnit: 'units',
    icon: '📦',
  },
];

// Nagpur geographic bounds validation
function isWithinNagpur(lat: number, lng: number): boolean {
  return lat >= 20.95 && lat <= 21.32 && lng >= 78.85 && lng <= 79.35;
}

// Custom Leaflet map picker pin
const pinIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `<div style="
    background: #dc2626;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(220, 38, 38, 0.4);
    border: 2px solid white;
  ">
    <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map event listener component to handle click-to-pick
function MapClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map center synchronizer
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map]);
  return null;
}

export const PublicReliefRequestPage: React.FC<PublicReliefRequestPageProps> = ({
  onNavigate,
}) => {
  // Form State
  const [requesterName, setRequesterName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [organization, setOrganization] = useState('');

  // Location
  const [locality, setLocality] = useState('Sitabuldi / Civil Lines');
  const [addressOrLandmark, setAddressOrLandmark] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 21.1458,
    lng: 79.0882,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Situation & People
  const [peopleAffected, setPeopleAffected] = useState<number>(4);
  const [hasImmediateHealthThreat, setHasImmediateHealthThreat] = useState(false);
  const [situationDescription, setSituationDescription] = useState('');

  // Items
  const [items, setItems] = useState<ItemDraft[]>([
    {
      id: 'item-1',
      category: 'SAFE_WATER',
      name: '20L Drinking Water Cans',
      quantity: 4,
      unit: 'cans (20L)',
      notes: 'Clean drinking water needed immediately for family',
    },
    {
      id: 'item-2',
      category: 'FOOD_NUTRITION',
      name: 'Dry Ration Food Packets (Rice, Dal, Biscuits)',
      quantity: 4,
      unit: 'packets',
      notes: 'No electricity or cooking gas available',
    },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    trackingId: string;
    receivedAt: string;
    status: string;
    locality: string;
    peopleAffected: number;
    itemsCount: number;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? 'Location access denied. Please click on the map or type your address.'
            : 'Unable to retrieve your location. Please select on the map.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Add Item
  const handleAddItem = (category?: ReliefCategory) => {
    const selectedCat = category || 'FOOD_NUTRITION';
    const catDef = CATEGORY_DEFINITIONS.find((c) => c.id === selectedCat)!;
    const newItem: ItemDraft = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: selectedCat,
      name: catDef.defaultItem,
      quantity: 2,
      unit: catDef.defaultUnit,
      notes: '',
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('Please keep at least one relief item in your request.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Update Item
  const handleUpdateItem = (id: string, field: keyof ItemDraft, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (field === 'category') {
          const catDef = CATEGORY_DEFINITIONS.find((c) => c.id === value);
          return {
            ...i,
            category: value,
            name: catDef ? catDef.defaultItem : i.name,
            unit: catDef ? catDef.defaultUnit : i.unit,
          };
        }
        return { ...i, [field]: value };
      })
    );
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!addressOrLandmark.trim()) {
      setErrorMessage('Please provide an address or nearest recognizable landmark.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one relief item to your request.');
      return;
    }

    for (const item of items) {
      if (!item.name.trim() || item.quantity <= 0) {
        setErrorMessage('All items must have a valid description and quantity greater than zero.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: PublicReliefRequestInput = {
        requesterName: requesterName.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        organization: organization.trim() || undefined,
        category: items[0]?.category || 'OTHER_ESSENTIALS',
        locality: locality.trim() || 'Nagpur Central',
        addressOrLandmark: addressOrLandmark.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        peopleAffected: Math.max(1, peopleAffected),
        hasImmediateHealthThreat,
        situationDescription:
          situationDescription.trim() || 'Public emergency relief request submitted via web portal.',
        items: items.map((it) => ({
          category: it.category,
          name: it.name.trim(),
          requestedQty: Number(it.quantity),
          unit: it.unit.trim() || 'units',
          notes: it.notes.trim() || undefined,
        })),
      };

      const result = await reliefApi.submitPublicRequest(payload);

      setSubmittedData({
        trackingId: result.trackingId,
        receivedAt: result.receivedAt,
        status: result.status,
        locality,
        peopleAffected,
        itemsCount: items.length,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Unable to submit relief request. Please verify connection and retry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submittedData?.trackingId) {
      navigator.clipboard.writeText(submittedData.trackingId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const withinNagpur = isWithinNagpur(coords.lat, coords.lng);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f4f9fd] via-[#eef6fc] to-[#f8fafc] text-slate-800 flex flex-col justify-between">
      {/* Navigation */}
      <Navbar currentRoute="/request-relief" onNavigate={onNavigate} />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        {/* SUCCESS CONFIRMATION STATE */}
        {submittedData ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden animate-scale-up">
            {/* Top Success Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mb-3 border-2 border-white/40 shadow-inner">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Emergency Relief Request Registered
              </h1>
              <p className="mt-2 text-sm sm:text-base text-emerald-100 max-w-xl mx-auto">
                Your request has been successfully committed to the database and entered into the
                priority triage queue.
              </p>
            </div>

            {/* Tracking ID & Summary Details */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Prominent Tracking Card */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Official Tracking ID
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-wider">
                    {submittedData.trackingId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                    title="Copy Tracking ID"
                  >
                    {copiedId ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Copied!
                      </span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Save this Tracking ID to track verification, inventory allocation, and dispatch.
                </p>
              </div>

              {/* Status & Triage Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    Current Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-base font-bold text-amber-950">
                      PENDING VERIFICATION
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Queued for field operator verification to assess local safety & dispatch routes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Location Area
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    {submittedData.locality}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Coordinates recorded & mapped to Nagpur relief zones.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    People in Need
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>{submittedData.peopleAffected} individuals</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {submittedData.itemsCount} relief item categories requested.
                  </p>
                </div>
              </div>

              {/* What Happens Next Card */}
              <div className="p-4 bg-sky-50 border border-sky-200/90 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 space-y-1">
                  <p className="font-bold text-sm">Next Steps in Relief Coordination:</p>
                  <p>
                    1. <strong>Verification:</strong> Emergency response operators inspect
                    incoming reports to group requests by neighborhood and avoid duplicate delivery.
                  </p>
                  <p>
                    2. <strong>Inventory Matching:</strong> Verified supplies are reserved from
                    Nagpur central storage hubs (Sitabuldi, Kalamna, or GMCH).
                  </p>
                  <p>
                    3. <strong>Field Dispatch:</strong> Rescue boats, NDRF/SDRF teams, and relief
                    vehicles are assigned for delivery.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem('focus_relief_request_id', submittedData.trackingId);
                    onNavigate('/rescue/relief');
                  }}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-blue-600/20"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>View on Relief Dashboard</span>
                </button>
                <button
                  onClick={() => onNavigate('/track-relief')}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Track Status with ID</span>
                </button>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setItems([
                      {
                        id: 'item-new',
                        category: 'SAFE_WATER',
                        name: '20L Drinking Water Cans',
                        quantity: 4,
                        unit: 'cans (20L)',
                        notes: '',
                      },
                    ]);
                  }}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  Submit Another
                </button>
                <button
                  onClick={() => onNavigate('/')}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MAIN FORM VIEW */
          <div className="space-y-6">
            {/* Page Header */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold tracking-wide uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                Nagpur Disaster Response Network
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Request Emergency Relief
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Need food, drinking water, shelter, medical assistance, or other essential supplies?
                Submit your details below. Field response operators verify incoming requests and
                coordinate direct dispatch from local depots.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-medium animate-shake">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. RELIEF CATEGORIES QUICK ADD */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-red-600" />
                      <span>1. Select Relief Categories Needed</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click any category below to quickly add it to your request list.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CATEGORY_DEFINITIONS.map((cat) => {
                    const isAlreadyAdded = items.some((i) => i.category === cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => handleAddItem(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isAlreadyAdded
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-2xs'
                            : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="text-xl mb-1">{cat.icon}</div>
                        <div className="text-xs font-bold leading-tight">{cat.label}</div>
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {cat.defaultItem}
                        </div>
                        <div className="mt-2 text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Add Item</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Items List */}
                <div className="mt-6 border-t border-slate-100 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Requested Supplies List ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItem()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Item</span>
                    </button>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="w-full sm:w-1/4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Category
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'category', e.target.value as ReliefCategory)
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                        >
                          {CATEGORY_DEFINITIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Specific Item Description
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          placeholder="e.g. 20L Water Cans or Baby Formula"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="w-full sm:w-24">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          placeholder="cans, packets"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors self-end sm:self-center cursor-pointer mt-1 sm:mt-4"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. NUMBER OF PEOPLE & SITUATION DETAILS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>2. People Needing Assistance & Situation</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Estimated Number of People in Need *
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPeopleAffected((prev) => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        required
                        value={peopleAffected}
                        onChange={(e) =>
                          setPeopleAffected(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-28 py-2 px-3 text-center text-lg font-extrabold bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setPeopleAffected((prev) => prev + 1)}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-500 font-medium">
                        individuals (infants, adults, seniors)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Vulnerability & Health Status
                    </label>
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/70 cursor-pointer hover:bg-amber-100/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={hasImmediateHealthThreat}
                        onChange={(e) => setHasImmediateHealthThreat(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 mt-0.5"
                      />
                      <div className="text-xs text-amber-950">
                        <span className="font-bold">Immediate Health Threat / Critical Vulnerability</span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Check if infants, injured persons, pregnant mothers, elderly individuals,
                          or people without essential life-saving medication are trapped.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Situation Description / Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={situationDescription}
                    onChange={(e) => setSituationDescription(e.target.value)}
                    placeholder="Describe flood water level, accessibility (e.g. stranded on 1st floor, boat needed), specific medical conditions, or nearest dry landmark..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 3. LOCATION & NAGPUR OPENSTREETMAP */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <span>3. Location in Nagpur (Interactive Map)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click directly on the map or drag the pin to pinpoint the exact relief destination.
                    </p>
                  </div>

                  {/* Geolocation Trigger */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-300/80 disabled:opacity-50"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>{gpsLoading ? 'Acquiring GPS...' : 'Use Current Device Location'}</span>
                  </button>
                </div>

                {gpsError && (
                  <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    {gpsError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Neighborhood / Ward / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Sitabuldi, Dharampeth, Sadar, Kalamna, Pardi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Street Address or Nearest Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressOrLandmark}
                      onChange={(e) => setAddressOrLandmark(e.target.value)}
                      placeholder="e.g. Near Zero Mile Metro, Plot 14, Opposite Water Tank"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Leaflet Map Picker Container */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner h-[280px] sm:h-[340px]">
                  <MapContainer
                    center={[coords.lat, coords.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickPicker
                      onPick={(lat, lng) =>
                        setCoords({
                          lat: parseFloat(lat.toFixed(6)),
                          lng: parseFloat(lng.toFixed(6)),
                        })
                      }
                    />
                    <MapUpdater center={[coords.lat, coords.lng]} />
                    <Marker
                      position={[coords.lat, coords.lng]}
                      icon={pinIcon}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const pos = marker.getLatLng();
                          setCoords({
                            lat: parseFloat(pos.lat.toFixed(6)),
                            lng: parseFloat(pos.lng.toFixed(6)),
                          });
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="block text-slate-900">Delivery Destination</strong>
                          <span className="text-slate-600">
                            {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>

                  {/* Coordinates overlay badge on the map */}
                  <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-mono text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Lat: {coords.lat.toFixed(5)}</span>
                    <span className="text-slate-300">|</span>
                    <span>Lng: {coords.lng.toFixed(5)}</span>
                  </div>
                </div>

                {/* Manual Coordinate Override & Boundary Indicator */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Fine-tune coordinates:</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={coords.lat}
                      onChange={(e) =>
                        setCoords((prev) => ({
                          ...prev,
                          lat: parseFloat(e.target.value) || prev.lat,
                        }))
                      }
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-center font-mono text-xs"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={coords.lng}
                      onChange={(e) =>
                        setCoords((prev) => ({
                          ...prev,
                          lng: parseFloat(e.target.value) || prev.lng,
                        }))
                      }
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-center font-mono text-xs"
                      placeholder="Longitude"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {withinNagpur ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Within Nagpur Relief Zone
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Outside standard municipal zone
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. OPTIONAL CONTACT INFORMATION */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-indigo-600" />
                    <span>4. Contact Information (Optional)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    If phone service is operational, providing a phone number helps field delivery
                    teams verify arrival. You can also leave this blank if you prefer anonymity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Name / Representative
                    </label>
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="e.g. Ramesh Patil (Optional)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="e.g. +91 98230 XXXXX"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Organization / Shelter Name
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Community Relief Hall (Optional)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. SUBMIT ACTION & VERIFICATION NOTICE */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Protected Triage & Verification Workflow</span>
                  </div>
                  <h3 className="text-lg font-bold">Ready to Dispatch Emergency Notice?</h3>
                  <p className="text-xs text-slate-300 max-w-lg">
                    Upon submission, your request is immediately logged with status{' '}
                    <strong className="text-amber-300">PENDING</strong>. Nagpur relief operators
                    review and match inventory from local warehouses before vehicle deployment.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onNavigate('/')}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Transmitting to Database...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Relief Request</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
