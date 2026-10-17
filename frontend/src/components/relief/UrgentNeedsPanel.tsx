import {
  Clock,
  MapPin,
  ArrowRight,
  Layers,
  AlertOctagon,
  Users,
  Truck,
} from 'lucide-react';
import {
  ReliefRequest,
  ResourceInventoryItem,
  DeliveryAllocation,
} from '../../types/relief';

interface UrgentNeedsPanelProps {
  requests: ReliefRequest[];
  inventory: ResourceInventoryItem[];
  deliveries: DeliveryAllocation[];
  onSelectRequest: (request: ReliefRequest) => void;
  onOpenDetails: (request: ReliefRequest) => void;
}

export const UrgentNeedsPanel: React.FC<UrgentNeedsPanelProps> = ({
  requests,
  inventory,
  deliveries,
  onSelectRequest,
  onOpenDetails,
}) => {
  // 1. Verified Immediate & Urgent requests with remaining unmet quantities
  const verifiedUrgentUnmet = requests.filter((r) => {
    if (r.verificationStatus !== 'VERIFIED') return false;
    if (r.urgency !== 'IMMEDIATE' && r.urgency !== 'URGENT') return false;
    const hasUnmet = r.items.some((i) => i.requestedQty > i.fulfilledQty);
    return hasUnmet;
  });

  // 2. Unverified reports waiting in queue
  const pendingQueue = requests.filter((r) => r.verificationStatus === 'PENDING');

  // 3. Cluster identification: count verified requests per locality in Nagpur
  const clusterCounts = requests
    .filter((r) => r.verificationStatus === 'VERIFIED')
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.location.locality] = (acc[r.location.locality] || 0) + 1;
      return acc;
    }, {});

  const concentratedLocalities = Object.entries(clusterCounts)
    .filter(([_, count]) => count >= 2)
    .map(([loc, count]) => ({ locality: loc, count }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Urgent Unmet Needs Triage
            </h3>
            <span className="text-[10px] text-slate-400">
              Actionable Nagpur Priorities
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800">
          {verifiedUrgentUnmet.length} Active
        </span>
      </div>

      <div className="p-4 overflow-y-auto space-y-4 max-h-[580px]">
        {/* Concentrated Hotspot Notice if multiple verified in same area */}
        {concentratedLocalities.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>Concentrated Relief Demand Detected</span>
            </div>
            <div className="text-[11.5px] text-amber-800">
              {concentratedLocalities.map((c) => (
                <span key={c.locality} className="inline-block mr-2">
                  • <strong>{c.locality}</strong> ({c.count} verified requests)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section A: Verified Immediate & Urgent Unmet Needs */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Verified Unmet Needs ({verifiedUrgentUnmet.length})</span>
            <span className="text-[10px] text-slate-400">Click to focus map</span>
          </div>

          {verifiedUrgentUnmet.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No verified urgent unmet needs at this moment.
            </div>
          ) : (
            <div className="space-y-2.5">
              {verifiedUrgentUnmet.map((req) => {
                // Find items that still have unmet quantity
                const unmetItems = req.items.filter(
                  (i) => i.requestedQty > i.fulfilledQty
                );

                return (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all bg-white cursor-pointer group space-y-2"
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors">
                          {req.id}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            req.urgency === 'IMMEDIATE'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </div>

                      <span className="text-[10.5px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{req.peopleAffected} pers.</span>
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{req.location.locality}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[240px]">
                          {req.location.addressOrLandmark}
                        </span>
                      </div>
                    </div>

                    {/* Unmet Items */}
                    <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
                      {unmetItems.map((item) => {
                        const remaining = Math.max(0, item.requestedQty - item.fulfilledQty);

                        // Find matching available stock
                        const matchingRes = inventory.filter(
                          (r) =>
                            r.category === item.category ||
                            r.name.toLowerCase().includes(item.name.toLowerCase().slice(0, 5))
                        );
                        const totalAvailable = matchingRes.reduce(
                          (acc, r) => acc + Math.max(0, r.totalStock - r.reservedStock),
                          0
                        );
                        const isShortage = totalAvailable < remaining;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100"
                          >
                            <span className="truncate max-w-[140px] font-medium text-slate-800" title={item.name}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-red-600">
                                {remaining} {item.unit}
                              </span>
                              {isShortage ? (
                                <span className="text-[9.5px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                  {totalAvailable === 0 ? 'No Stock' : `Avail: ${totalAvailable}`}
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action shortcut */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 italic text-[10px]">
                        {req.urgencyReason.slice(0, 40)}...
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(req);
                        }}
                        className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Triage & Match</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section B: Awaiting Verification Queue */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Awaiting Verification Queue ({pendingQueue.length})</span>
            <span className="text-[10px] text-amber-600 font-semibold">Unverified</span>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              Verification queue is empty.
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingQueue.map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{req.id}</span>
                      <span className="text-slate-500 font-normal">• {req.location.locality}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                      {req.items.map((i) => `${i.name} (${i.requestedQty})`).join(', ')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(req);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-[10.5px] font-bold cursor-pointer shrink-0"
                  >
                    Verify
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section C: Allocations Awaiting Delivery */}
        {deliveries.filter((d) => d.deliveryStatus !== 'DELIVERED').length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Allocations In Dispatch ({deliveries.filter((d) => d.deliveryStatus !== 'DELIVERED').length})</span>
              <span className="text-[10px] text-sky-600 font-semibold">Active Fleet</span>
            </div>

            <div className="space-y-1.5">
              {deliveries
                .filter((d) => d.deliveryStatus !== 'DELIVERED')
                .map((del) => (
                  <div
                    key={del.id}
                    className="p-2 rounded-xl border border-sky-200/80 bg-sky-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-sky-600" />
                        <span>{del.resourceName}</span>
                        <span className="font-mono text-sky-700">({del.allocatedQty} {del.unit})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        To: {del.destinationLocation}
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-sky-100 text-sky-800">
                      {del.deliveryStatus.replace('_', ' ')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
