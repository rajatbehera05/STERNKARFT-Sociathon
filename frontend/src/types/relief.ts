export type RequesterType =
  | 'AFFECTED_PERSON'
  | 'FIELD_RESPONDER'
  | 'SHELTER_COORDINATOR'
  | 'RELIEF_OPERATOR';

export type ReliefCategory =
  | 'FOOD_NUTRITION'
  | 'SAFE_WATER'
  | 'SHELTER_BEDDING'
  | 'MEDICAL_ASSISTANCE'
  | 'HYGIENE_SANITATION'
  | 'CLOTHING_ESSENTIALS'
  | 'RESCUE_EVACUATION'
  | 'OTHER_ESSENTIALS';

export type UrgencyLevel = 'IMMEDIATE' | 'URGENT' | 'ELEVATED' | 'ROUTINE';

export type VerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'CLARIFICATION_NEEDED';

export type FulfilmentStatus =
  | 'UNMET'
  | 'PARTIALLY_MET'
  | 'ALLOCATED'
  | 'DELIVERED';

export interface RequestItem {
  id: string;
  category: ReliefCategory;
  name: string;
  requestedQty: number;
  allocatedQty: number;
  fulfilledQty: number;
  unit: string;
  notes?: string;
}

export interface ReliefLocation {
  locality: string;
  addressOrLandmark: string;
  latitude: number;
  longitude: number;
  isWithinNagpurBounds: boolean;
}

export interface ReliefRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  requesterType: RequesterType;
  requesterName?: string;
  contactNumber?: string;
  organization?: string;
  location: ReliefLocation;
  peopleAffected: number;
  items: RequestItem[];
  hasImmediateHealthThreat: boolean;
  situationDescription: string;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
  urgency: UrgencyLevel;
  urgencyReason: string;
  operatorNotes?: string;
}

export type ResourceCategory = ReliefCategory;

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'DEPLETED';

export interface ResourceInventoryItem {
  id: string;
  name: string;
  category: ResourceCategory;
  totalStock: number;
  reservedStock: number;
  unit: string;
  storageLocation: string; // e.g., 'Sitabuldi Central Depot', 'GMCH Medical Storage', 'Kalamna Hub'
  lastVerifiedAt: string;
  reorderThreshold: number;
}

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export interface DeliveryAllocation {
  id: string;
  requestId: string;
  requestItemId: string;
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  allocatedQty: number;
  unit: string;
  originLocation: string;
  destinationLocation: string;
  deliveryStatus: DeliveryStatus;
  assignedResponder?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DashboardMetrics {
  totalRequests: number;
  awaitingVerification: number;
  immediateNeeds: number;
  verifiedUnmetNeeds: number;
  resourceShortages: number;
  deliveriesInProgress: number;
}
