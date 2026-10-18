import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Truck,
  Plus,
  Search,
  Eye,
  Warehouse,
  ChevronRight,
  RefreshCw,
  Database,
} from 'lucide-react';
import {
  ReliefRequest,
  ResourceInventoryItem,
  DeliveryAllocation,
  DashboardMetrics,
  UrgencyLevel,
  VerificationStatus,
  DeliveryStatus,
} from '../types/relief';
import { AppRoute } from '../types';
import {
  INITIAL_RELIEF_REQUESTS,
  INITIAL_RESOURCE_INVENTORY,
  INITIAL_DELIVERIES,
  CATEGORY_OPTIONS,
} from '../data/reliefDemoData';
import { reliefApi } from '../services/reliefApi';
import { NagpurReliefMap } from '../components/relief/NagpurReliefMap';
import { ReliefRequestModal } from '../components/relief/ReliefRequestModal';
import { RequestDetailModal } from '../components/relief/RequestDetailModal';
import { ResourceMatchingModal } from '../components/relief/ResourceMatchingModal';
import { InventoryModal } from '../components/relief/InventoryModal';
import { UrgentNeedsPanel } from '../components/relief/UrgentNeedsPanel';

interface ReliefCoordinationPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export const ReliefCoordinationPage: React.FC<ReliefCoordinationPageProps> = () => {
  // Live State synced with backend PostgreSQL
  const [requests, setRequests] = useState<ReliefRequest[]>(INITIAL_RELIEF_REQUESTS);
  const [inventory, setInventory] = useState<ResourceInventoryItem[]>(
    INITIAL_RESOURCE_INVENTORY
  );
  const [deliveries, setDeliveries] = useState<DeliveryAllocation[]>(
    INITIAL_DELIVERIES
  );
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Synchronize with PostgreSQL on mount & interval
  const loadData = async () => {
    setIsLoadingBackend(true);
    try {
      const [requestsRes, inventoryRes, deliveriesRes] = await Promise.allSettled([
        reliefApi.getRequests(),
        reliefApi.getInventory(),
        reliefApi.getDeliveries(),
      ]);

      if (requestsRes.status === 'fulfilled' && requestsRes.value && requestsRes.value.length > 0) {
        const backendRequests = requestsRes.value;
        setRequests(backendRequests);

        // Check if there is a newly submitted request to focus
        const focusRequestId = sessionStorage.getItem('focus_relief_request_id');
        if (focusRequestId) {
          sessionStorage.removeItem('focus_relief_request_id');
          const target = backendRequests.find((r) => r.id === focusRequestId);
          if (target) {
            setSelectedRequest(target);
          }
        } else {
          setSelectedRequest((prev) => {
            if (!prev || prev.id.startsWith('REQ-NGP-DEMO') || prev.id === INITIAL_RELIEF_REQUESTS[0].id) {
              return backendRequests[0];
            }
            const exists = backendRequests.find((r) => r.id === prev.id);
            return exists || backendRequests[0];
          });
        }
        setIsDbConnected(true);
      }

      if (inventoryRes.status === 'fulfilled' && inventoryRes.value && inventoryRes.value.length > 0) {
        setInventory(inventoryRes.value);
      }

      if (deliveriesRes.status === 'fulfilled' && deliveriesRes.value && deliveriesRes.value.length > 0) {
        setDeliveries(deliveriesRes.value);
      }
    } catch (err) {
      console.warn('PostgreSQL fetch fallback to local state:', err);
    } finally {
      setIsLoadingBackend(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // 3s live polling
    return () => clearInterval(interval);
  }, []);

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'VERIFICATION' | 'INVENTORY' | 'DELIVERIES'
  >('OVERVIEW');

  // Map / Table mobile view toggle
  const [mobileView, setMobileView] = useState<'MAP' | 'LIST'>('MAP');

  // Selected request for map focus and detail modal
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequest | null>(
    INITIAL_RELIEF_REQUESTS[0]
  );
  const [modalRequest, setModalRequest] = useState<ReliefRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Request Modal State
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  // Matching Workspace Modal State
  const [matchingRequest, setMatchingRequest] = useState<ReliefRequest | null>(null);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);

  // Inventory Modal State
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<ResourceInventoryItem | null>(null);

  // Search and Filter States for Request Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [filterVerification, setFilterVerification] = useState<string>('ALL');
  const [filterFulfilment, setFilterFulfilment] = useState<string>('ALL');

  // Search and Filter for Inventory Tab
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('ALL');

  // Dynamic Dashboard Metrics Calculation
  const metrics: DashboardMetrics = useMemo(() => {
    const totalRequests = requests.length;
    const awaitingVerification = requests.filter(
      (r) => r.verificationStatus === 'PENDING'
    ).length;

    // Immediate needs: verified requests with IMMEDIATE urgency that have remaining unmet items
    const immediateNeeds = requests.filter((r) => {
      if (r.verificationStatus !== 'VERIFIED' || r.urgency !== 'IMMEDIATE') return false;
      return r.items.some((i) => i.requestedQty > i.fulfilledQty);
    }).length;

    // Verified unmet needs: all verified requests with remaining items
    const verifiedUnmetNeeds = requests.filter((r) => {
      if (r.verificationStatus !== 'VERIFIED') return false;
      return r.items.some((i) => i.requestedQty > i.fulfilledQty);
    }).length;

    // Resource shortages: inventory items with available stock <= 0 or below reorder threshold
    const resourceShortages = inventory.filter(
      (item) => item.totalStock - item.reservedStock <= item.reorderThreshold
    ).length;

    // Deliveries in progress: status not DELIVERED
    const deliveriesInProgress = deliveries.filter(
      (d) => d.deliveryStatus !== 'DELIVERED'
    ).length;

    return {
      totalRequests,
      awaitingVerification,
      immediateNeeds,
      verifiedUnmetNeeds,
      resourceShortages,
      deliveriesInProgress,
    };
  }, [requests, inventory, deliveries]);

  // Request Submission Handler
  const handleCreateRequest = async (newRequest: ReliefRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
    setSelectedRequest(newRequest);
    try {
      await reliefApi.submitPublicRequest({
        requesterName: newRequest.requesterName,
        contactNumber: newRequest.contactNumber,
        organization: newRequest.organization,
        locality: newRequest.location.locality,
        addressOrLandmark: newRequest.location.addressOrLandmark,
        latitude: newRequest.location.latitude,
        longitude: newRequest.location.longitude,
        peopleAffected: newRequest.peopleAffected,
        hasImmediateHealthThreat: newRequest.hasImmediateHealthThreat,
        situationDescription: newRequest.situationDescription,
        items: newRequest.items.map((i) => ({
          category: i.category,
          name: i.name,
          requestedQty: i.requestedQty,
          unit: i.unit,
          notes: i.notes,
        })),
      });
      loadData();
    } catch (err) {
      console.warn('Backend sync error creating request:', err);
    }
  };

  // Verification Update Handler
  const handleUpdateVerification = async (
    requestId: string,
    status: VerificationStatus,
    reason?: string
  ) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            verificationStatus: status,
            verificationReason: reason || r.verificationReason,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    try {
      await reliefApi.verifyRequest(requestId, status, reason);
    } catch (err) {
      console.warn('Backend sync error verifying request:', err);
    }
  };

  // Urgency Update Handler
  const handleUpdateUrgency = async (
    requestId: string,
    urgency: UrgencyLevel,
    reason: string
  ) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            urgency,
            urgencyReason: reason,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    try {
      await reliefApi.updateUrgency(requestId, urgency, reason);
    } catch (err) {
      console.warn('Backend sync error updating urgency:', err);
    }
  };

  // Allocation Confirmation Handler (from matching workspace)
  const handleConfirmAllocation = async (
    requestId: string,
    itemId: string,
    resourceId: string,
    allocatedQty: number,
    assignedResponder?: string,
    notes?: string
  ) => {
    const resource = inventory.find((r) => r.id === resourceId);
    const targetRequest = requests.find((r) => r.id === requestId);
    const targetItem = targetRequest?.items.find((i) => i.id === itemId);

    if (!resource || !targetRequest || !targetItem) return;

    // 1. Reserve inventory stock (Available stock = Total - Reserved)
    setInventory((prev) =>
      prev.map((r) => {
        if (r.id === resourceId) {
          return {
            ...r,
            reservedStock: r.reservedStock + allocatedQty,
            lastVerifiedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // 2. Update request item's allocated quantity
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            items: r.items.map((i) => {
              if (i.id === itemId) {
                return {
                  ...i,
                  allocatedQty: i.allocatedQty + allocatedQty,
                };
              }
              return i;
            }),
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // 3. Create Delivery tracking task
    const newDelivery: DeliveryAllocation = {
      id: `DEL-NGP-${Math.floor(100 + Math.random() * 900)}`,
      requestId,
      requestItemId: itemId,
      resourceId,
      resourceName: resource.name,
      category: resource.category,
      allocatedQty,
      unit: targetItem.unit,
      originLocation: resource.storageLocation,
      destinationLocation: `${targetRequest.location.locality} (${targetRequest.location.addressOrLandmark})`,
      deliveryStatus: 'ASSIGNED',
      assignedResponder: assignedResponder || 'Nagpur Disaster Quick Response Unit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
    };

    setDeliveries((prev) => [newDelivery, ...prev]);

    try {
      await reliefApi.allocateResources({
        requestId,
        requestItemId: itemId,
        resourceId,
        quantity: allocatedQty,
        notes,
      });
      loadData();
    } catch (err) {
      console.warn('Backend sync error allocating resources:', err);
    }
  };

  // Delivery Status Progression Handler
  const handleAdvanceDelivery = async (deliveryId: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery || delivery.deliveryStatus === 'DELIVERED') return;

    let nextStatus: DeliveryStatus = 'PREPARING';
    if (delivery.deliveryStatus === 'ASSIGNED') nextStatus = 'PREPARING';
    else if (delivery.deliveryStatus === 'PREPARING') nextStatus = 'IN_TRANSIT';
    else if (delivery.deliveryStatus === 'IN_TRANSIT') nextStatus = 'DELIVERED';

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          return {
            ...d,
            deliveryStatus: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );

    // If delivered: fulfill the request item and release reserved inventory stock
    if (nextStatus === 'DELIVERED') {
      // 1. Update Request Item
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id === delivery.requestId) {
            return {
              ...r,
              items: r.items.map((i) => {
                if (i.id === delivery.requestItemId) {
                  return {
                    ...i,
                    fulfilledQty: i.fulfilledQty + delivery.allocatedQty,
                    allocatedQty: Math.max(0, i.allocatedQty - delivery.allocatedQty),
                  };
                }
                return i;
              }),
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        })
      );

      // 2. Update Inventory: deduct total stock and release reserved stock
      setInventory((prev) =>
        prev.map((res) => {
          if (res.id === delivery.resourceId) {
            return {
              ...res,
              totalStock: Math.max(0, res.totalStock - delivery.allocatedQty),
              reservedStock: Math.max(0, res.reservedStock - delivery.allocatedQty),
              lastVerifiedAt: new Date().toISOString(),
            };
          }
          return res;
        })
      );
    }

    try {
      await reliefApi.updateDeliveryStatus(deliveryId, nextStatus);
    } catch (err) {
      console.warn('Backend sync error advancing delivery:', err);
    }
  };

  // Inventory Add / Update Handler
  const handleSaveInventory = (itemData: Partial<ResourceInventoryItem> & { id?: string; incomingQty?: number }) => {
    if (itemData.id && inventory.some((i) => i.id === itemData.id)) {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id === itemData.id) {
            return {
              ...item,
              ...itemData,
              totalStock: itemData.totalStock ?? item.totalStock,
            };
          }
          return item;
        })
      );
    } else {
      const newItem: ResourceInventoryItem = {
        id: itemData.id || `RES-NGP-${Math.floor(100 + Math.random() * 900)}`,
        name: itemData.name || 'Emergency Supply',
        category: itemData.category || 'FOOD_NUTRITION',
        totalStock: itemData.totalStock || 50,
        reservedStock: 0,
        unit: itemData.unit || 'units',
        storageLocation: itemData.storageLocation || 'Nagpur Central Warehouse (Sitabuldi)',
        lastVerifiedAt: new Date().toISOString(),
        reorderThreshold: itemData.reorderThreshold || 20,
      };
      setInventory((prev) => [newItem, ...prev]);
    }
  };

  // Filtered Requests for the Table
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Category filter
      if (
        filterCategory !== 'ALL' &&
        !r.items.some((i) => i.category === filterCategory)
      ) {
        return false;
      }

      // Urgency filter
      if (filterUrgency !== 'ALL' && r.urgency !== filterUrgency) {
        return false;
      }

      // Verification filter
      if (
        filterVerification !== 'ALL' &&
        r.verificationStatus !== filterVerification
      ) {
        return false;
      }

      // Fulfilment filter
      if (filterFulfilment !== 'ALL') {
        const totalReq = r.items.reduce((sum, i) => sum + i.requestedQty, 0);
        const totalFul = r.items.reduce((sum, i) => sum + i.fulfilledQty, 0);
        if (filterFulfilment === 'DELIVERED' && totalFul < totalReq) return false;
        if (filterFulfilment === 'UNMET' && totalFul > 0) return false;
        if (filterFulfilment === 'PARTIALLY_MET' && (totalFul === 0 || totalFul >= totalReq)) return false;
      }

      // Search query filter (ID, locality, address, item names)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = r.id.toLowerCase().includes(q);
        const matchLoc = r.location.locality.toLowerCase().includes(q);
        const matchAddr = r.location.addressOrLandmark.toLowerCase().includes(q);
        const matchItems = r.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchId && !matchLoc && !matchAddr && !matchItems) return false;
      }

      return true;
    });
  }, [
    requests,
    filterCategory,
    filterUrgency,
    filterVerification,
    filterFulfilment,
    searchQuery,
  ]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (
        inventoryCategoryFilter !== 'ALL' &&
        item.category !== inventoryCategoryFilter
      ) {
        return false;
      }
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventory, inventoryCategoryFilter, inventorySearch]);

  return (
    <div className="space-y-6">
      {/* 1. Operations Notice & Database Sync Banner */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>
            <strong>NAGPUR RELIEF COORDINATION GRID:</strong> Geospatial emergency relief operations centered on Nagpur (21.1458°N, 79.0882°E).
          </span>
          {isDbConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-300 font-mono text-[10px]">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>POSTGRESQL LIVE</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              <Database className="w-3 h-3 text-slate-400" />
              <span>CACHED DATA</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={isLoadingBackend}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackend ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsNewRequestModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Intake</span>
          </button>
        </div>
      </div>

      {/* 2. Command Center Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Requests */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Requests
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.totalRequests}
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">Nagpur Response Zone</div>
        </div>

        {/* Metric 2: Awaiting Verification */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Awaiting Verification
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {metrics.awaitingVerification}
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">Pending field triage</div>
        </div>

        {/* Metric 3: Immediate Needs */}
        <div className="p-4 bg-white rounded-2xl border border-red-200/80 bg-red-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
            Immediate Needs
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {metrics.immediateNeeds}
          </div>
          <div className="text-[10.5px] text-red-700/80 mt-0.5">Threat to life/health</div>
        </div>

        {/* Metric 4: Verified Unmet Needs */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
            Verified Unmet Needs
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">
            {metrics.verifiedUnmetNeeds}
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">Awaiting resources</div>
        </div>

        {/* Metric 5: Resource Shortages */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
            Resource Shortages
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {metrics.resourceShortages}
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">Items below threshold</div>
        </div>

        {/* Metric 6: Deliveries In Progress */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Deliveries Active
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {metrics.deliveriesInProgress}
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">En route or preparing</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Map & Requests
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'VERIFICATION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Verification Queue</span>
            {metrics.awaitingVerification > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-mono">
                {metrics.awaitingVerification}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'INVENTORY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resource Inventory
          </button>

          <button
            onClick={() => setActiveTab('DELIVERIES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DELIVERIES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Delivery Tracking</span>
            {metrics.deliveriesInProgress > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">
                {metrics.deliveriesInProgress}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Map / List Toggle for Overview Tab */}
        {activeTab === 'OVERVIEW' && (
          <div className="lg:hidden flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setMobileView('MAP')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                mobileView === 'MAP'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setMobileView('LIST')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                mobileView === 'LIST'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Needs & Table
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: OVERVIEW (MAP + URGENT NEEDS + REQUESTS TABLE) */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top Row: Real Nagpur Live Map (Left) + Urgent Needs Triage Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Nagpur Map: 7 cols on desktop */}
            <div
              className={`lg:col-span-7 xl:col-span-8 flex flex-col ${
                mobileView === 'LIST' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <NagpurReliefMap
                requests={requests}
                selectedRequest={selectedRequest}
                onSelectRequest={(req) => setSelectedRequest(req)}
                onOpenDetails={(req) => {
                  setModalRequest(req);
                  setIsDetailModalOpen(true);
                }}
                className="h-[500px] lg:h-[560px]"
              />
            </div>

            {/* Urgent Unmet Needs Panel: 5 cols on desktop */}
            <div
              className={`lg:col-span-5 xl:col-span-4 flex flex-col ${
                mobileView === 'MAP' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <UrgentNeedsPanel
                requests={requests}
                inventory={inventory}
                deliveries={deliveries}
                onSelectRequest={(req) => {
                  setSelectedRequest(req);
                  if (window.innerWidth < 1024) setMobileView('MAP');
                }}
                onOpenDetails={(req) => {
                  setModalRequest(req);
                  setIsDetailModalOpen(true);
                }}
              />
            </div>
          </div>

          {/* Bottom Section: Search, Filters & Recent Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recent Relief Requests
                </h3>
                <p className="text-xs text-slate-500">
                  Click any request to focus its marker on the Nagpur map or triage supplies.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewRequestModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Relief</span>
                </button>
              </div>
            </div>

            {/* Search & Multi-Attribute Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
              {/* Text Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, locality, item..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium"
              >
                <option value="ALL">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Urgency Filter */}
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium"
              >
                <option value="ALL">All Urgency Levels</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="URGENT">Urgent</option>
                <option value="ELEVATED">Elevated</option>
                <option value="ROUTINE">Routine</option>
              </select>

              {/* Verification Filter */}
              <select
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium"
              >
                <option value="ALL">All Verification States</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending Verification</option>
                <option value="CLARIFICATION_NEEDED">Needs Clarification</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Fulfilment Filter */}
              <select
                value={filterFulfilment}
                onChange={(e) => setFilterFulfilment(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium"
              >
                <option value="ALL">All Fulfilment States</option>
                <option value="UNMET">Unmet Needs</option>
                <option value="PARTIALLY_MET">Partially Met</option>
                <option value="DELIVERED">Fully Delivered</option>
              </select>
            </div>

            {/* Requests Table */}
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Nagpur Locality</th>
                    <th className="py-2.5 px-3">Category & Items</th>
                    <th className="py-2.5 px-2 text-center">People</th>
                    <th className="py-2.5 px-2">Urgency</th>
                    <th className="py-2.5 px-2">Verification</th>
                    <th className="py-2.5 px-2">Fulfilment</th>
                    <th className="py-2.5 px-3">Reported</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No requests match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isSelected = selectedRequest?.id === req.id;
                      const totalReq = req.items.reduce((s, i) => s + i.requestedQty, 0);
                      const totalFul = req.items.reduce((s, i) => s + i.fulfilledQty, 0);
                      const totalRem = Math.max(0, totalReq - totalFul);

                      return (
                        <tr
                          key={req.id}
                          onClick={() => setSelectedRequest(req)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-50/60 font-medium' : ''
                          }`}
                        >
                          {/* Request ID */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {req.id}
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">
                              {req.location.locality}
                            </div>
                            <div className="text-[10.5px] text-slate-500 truncate max-w-[150px]" title={req.location.addressOrLandmark}>
                              {req.location.addressOrLandmark}
                            </div>
                          </td>

                          {/* Category & Items */}
                          <td className="py-3 px-3">
                            <div className="text-[11px] font-semibold text-slate-700">
                              {req.items.map((i) => i.name).join(', ')}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {totalRem} {req.items[0]?.unit || 'units'} unmet
                            </div>
                          </td>

                          {/* People */}
                          <td className="py-3 px-2 text-center font-mono font-semibold text-slate-700">
                            {req.peopleAffected}
                          </td>

                          {/* Urgency */}
                          <td className="py-3 px-2">
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                req.urgency === 'IMMEDIATE'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : req.urgency === 'URGENT'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : req.urgency === 'ELEVATED'
                                  ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {req.urgency}
                            </span>
                          </td>

                          {/* Verification */}
                          <td className="py-3 px-2">
                            <span
                              className={`text-[10px] font-bold ${
                                req.verificationStatus === 'VERIFIED'
                                  ? 'text-emerald-700'
                                  : req.verificationStatus === 'PENDING'
                                  ? 'text-amber-700'
                                  : req.verificationStatus === 'CLARIFICATION_NEEDED'
                                  ? 'text-purple-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {req.verificationStatus.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Fulfilment */}
                          <td className="py-3 px-2">
                            {totalRem === 0 ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                Delivered
                              </span>
                            ) : totalFul > 0 ? (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                                Partial ({totalFul}/{totalReq})
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                Unmet
                              </span>
                            )}
                          </td>

                          {/* Time */}
                          <td className="py-3 px-3 font-mono text-[10.5px] text-slate-500">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalRequest(req);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                                title="View Details & Triage"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {req.verificationStatus === 'VERIFIED' && totalRem > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMatchingRequest(req);
                                    setIsMatchingModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded cursor-pointer"
                                  title="Match with available resources"
                                >
                                  Match
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === 'VERIFICATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Incoming Requests Verification Queue
              </h3>
              <p className="text-xs text-slate-500">
                Field reports awaiting telephone confirmation or physical inspection before municipal resource allocation.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold font-mono">
              {metrics.awaitingVerification} Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {requests
              .filter((r) => r.verificationStatus === 'PENDING')
              .map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{req.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        {req.urgency}
                      </span>
                      <span className="text-xs text-slate-500">
                        • {req.requesterType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-semibold">
                      Location: {req.location.locality} ({req.location.addressOrLandmark})
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Requested Supplies:</strong>{' '}
                      {req.items.map((i) => `${i.name} (${i.requestedQty} ${i.unit})`).join(' • ')}
                    </div>

                    <p className="text-[11px] text-slate-500 italic max-w-xl">
                      &quot;{req.situationDescription}&quot;
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateVerification(req.id, 'VERIFIED', 'Verified by operator.')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify Request</span>
                    </button>

                    <button
                      onClick={() => {
                        setModalRequest(req);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Examine Details
                    </button>
                  </div>
                </div>
              ))}

            {metrics.awaitingVerification === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                No unverified requests in the queue. All reported incidents have been reviewed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RESOURCE INVENTORY */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nagpur Municipal Disaster Resource Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Available Stock = Total Stock − Reserved Stock. Real-time depletion across Nagpur depots.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingInventoryItem(null);
                setIsInventoryModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource / Supplies</span>
            </button>
          </div>

          {/* Filters for Inventory */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search resources or storage depot..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              value={inventoryCategoryFilter}
              onChange={(e) => setInventoryCategoryFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium"
            >
              <option value="ALL">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Inventory Table */}
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Resource Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-2 text-center">Total Stock</th>
                  <th className="py-2.5 px-2 text-center">Reserved</th>
                  <th className="py-2.5 px-2 text-center">Available Stock</th>
                  <th className="py-2.5 px-3">Nagpur Storage Depot</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const available = Math.max(0, item.totalStock - item.reservedStock);
                  const isDepleted = available === 0;
                  const isLow = available <= item.reorderThreshold && !isDepleted;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium text-slate-800">
                        {item.totalStock} {item.unit}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-amber-700 font-medium">
                        {item.reservedStock}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-black text-slate-900">
                        <span
                          className={
                            isDepleted
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }
                        >
                          {available} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.storageLocation}</span>
                      </td>
                      <td className="py-3 px-2">
                        {isDepleted ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            Depleted
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setEditingInventoryItem(item);
                            setIsInventoryModalOpen(true);
                          }}
                          className="px-2 py-1 text-sky-700 hover:text-sky-900 font-bold text-xs cursor-pointer hover:bg-sky-50 rounded"
                        >
                          + Add Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY TRACKING */}
      {activeTab === 'DELIVERIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Relief Dispatch & Delivery Lifecyle
              </h3>
              <p className="text-xs text-slate-500">
                Assigned → Preparing → In Transit → Delivered. Confirming delivery marks request items fulfilled and updates inventory counts.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold font-mono">
              {deliveries.length} Total Allocations
            </span>
          </div>

          <div className="space-y-3">
            {deliveries.map((del) => {
              const isDelivered = del.deliveryStatus === 'DELIVERED';

              return (
                <div
                  key={del.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{del.id}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        (Ref: {del.requestId})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          del.deliveryStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : del.deliveryStatus === 'IN_TRANSIT'
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : del.deliveryStatus === 'PREPARING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {del.deliveryStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800">
                      <strong>Cargo:</strong>{' '}
                      <span className="font-semibold text-slate-900">{del.resourceName}</span> (
                      <span className="font-mono font-bold text-sky-700">
                        {del.allocatedQty} {del.unit}
                      </span>
                      )
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <strong>From:</strong> {del.originLocation}
                      </div>
                      <div>
                        <strong>Destination:</strong> {del.destinationLocation}
                      </div>
                    </div>

                    {del.assignedResponder && (
                      <div className="text-[11px] text-slate-500">
                        <strong>Assigned Unit:</strong> {del.assignedResponder}
                      </div>
                    )}
                  </div>

                  {/* Lifecycle Control */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isDelivered ? (
                      <button
                        onClick={() => handleAdvanceDelivery(del.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5 text-sky-400" />
                        <span>
                          {del.deliveryStatus === 'ASSIGNED'
                            ? 'Start Preparing'
                            : del.deliveryStatus === 'PREPARING'
                            ? 'Dispatch In-Transit'
                            : 'Confirm Delivered'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Delivery Fulfilled</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emergency Request Modal */}
      <ReliefRequestModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Operator Details & Triage Modal */}
      <RequestDetailModal
        request={modalRequest}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateVerification={handleUpdateVerification}
        onUpdateUrgency={handleUpdateUrgency}
        onOpenMatching={(req) => {
          setMatchingRequest(req);
          setIsMatchingModalOpen(true);
        }}
      />

      {/* Request-to-Resource Matching Workspace Modal */}
      <ResourceMatchingModal
        request={matchingRequest}
        isOpen={isMatchingModalOpen}
        onClose={() => setIsMatchingModalOpen(false)}
        inventory={inventory}
        onConfirmAllocation={handleConfirmAllocation}
      />

      {/* Inventory Add / Edit Modal */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        existingItem={editingInventoryItem}
        onSave={handleSaveInventory}
      />
    </div>
  );
};
