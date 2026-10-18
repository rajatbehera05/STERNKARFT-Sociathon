import { getPrismaClient, isPrismaActive } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreatePublicRequestInput {
  category: string;
  items: Array<{
    name: string;
    requestedQty: number;
    unit: string;
    notes?: string;
  }>;
  peopleAffected: number;
  situationDescription: string;
  locality: string;
  addressOrLandmark: string;
  latitude: number;
  longitude: number;
  requesterName?: string;
  contactNumber?: string;
  alternateNumber?: string;
  organization?: string;
  hasImmediateHealthThreat?: boolean;
}

export class ReliefService {
  private ensureDbActive() {
    if (!isPrismaActive()) {
      throw new AppError(
        'PostgreSQL database is currently unavailable. Relief operations require active PostgreSQL connection.',
        503
      );
    }
    return getPrismaClient();
  }

  /**
   * Generates a unique, human-readable Relief Request ID (e.g. REL-2026-1042)
   */
  private async generateUniqueRequestId(): Promise<string> {
    const prisma = this.ensureDbActive();
    const currentYear = new Date().getFullYear();

    for (let attempts = 0; attempts < 10; attempts++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const candidateId = `REL-${currentYear}-${randomSuffix}`;
      const existing = await prisma.reliefRequest.findUnique({
        where: { id: candidateId },
      });
      if (!existing) return candidateId;
    }

    return `REL-${currentYear}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Public Relief Request intake
   * Validates input, sets initial status to PENDING, and saves to PostgreSQL.
   */
  async createPublicRequest(input: CreatePublicRequestInput) {
    // 1. Rigorous server-side validation
    if (!input.situationDescription || input.situationDescription.trim().length < 5) {
      throw new AppError('A clear description of the emergency situation is required (minimum 5 characters).', 400);
    }

    if (!input.locality || input.locality.trim().length < 2) {
      throw new AppError('Locality or neighborhood name is required.', 400);
    }

    if (!input.addressOrLandmark || input.addressOrLandmark.trim().length < 3) {
      throw new AppError('Specific street address, relief shelter, or landmark is required.', 400);
    }

    if (
      typeof input.latitude !== 'number' ||
      typeof input.longitude !== 'number' ||
      isNaN(input.latitude) ||
      isNaN(input.longitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new AppError('Valid geographic coordinates (latitude and longitude) must be selected on the map.', 400);
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new AppError('At least one essential relief item must be requested.', 400);
    }

    for (const item of input.items) {
      if (!item.name || item.name.trim().length === 0) {
        throw new AppError('Every requested item must specify a valid name.', 400);
      }
      if (!item.requestedQty || item.requestedQty <= 0) {
        throw new AppError(`Quantity for "${item.name}" must be greater than zero.`, 400);
      }
      if (!item.unit || item.unit.trim().length === 0) {
        throw new AppError(`Unit of measurement for "${item.name}" is required.`, 400);
      }
    }

    const prisma = this.ensureDbActive();

    const peopleAffected = Math.max(1, Math.floor(input.peopleAffected || 1));

    // Normalize category to Prisma enum
    const validCategories = [
      'FOOD_NUTRITION',
      'SAFE_WATER',
      'SHELTER_BEDDING',
      'MEDICAL_ASSISTANCE',
      'HYGIENE_SANITATION',
      'CLOTHING_ESSENTIALS',
      'RESCUE_EVACUATION',
      'OTHER_ESSENTIALS',
    ];

    const categoryEnum = validCategories.includes(input.category)
      ? (input.category as any)
      : 'OTHER_ESSENTIALS';

    // Generate unique request ID
    const requestId = await this.generateUniqueRequestId();

    // Determine urgency level: if medical or immediate health threat, elevate to IMMEDIATE
    const hasImmediateThreat = Boolean(input.hasImmediateHealthThreat || categoryEnum === 'MEDICAL_ASSISTANCE');
    const urgency = hasImmediateThreat ? 'IMMEDIATE' : 'URGENT';
    const urgencyReason = hasImmediateThreat
      ? 'Citizen reported immediate health threat or medical emergency.'
      : 'Public emergency intake awaiting operator verification.';

    // Check bounds for Nagpur (~21.00 - 21.28 N, 78.95 - 79.25 E)
    const isWithinNagpur =
      input.latitude >= 20.85 &&
      input.latitude <= 21.45 &&
      input.longitude >= 78.8 &&
      input.longitude <= 79.4;

    // 2. Persist in PostgreSQL using Prisma transaction
    const savedRequest = await prisma.reliefRequest.create({
      data: {
        id: requestId,
        requesterType: 'AFFECTED_PERSON',
        requesterName: input.requesterName?.trim() || null,
        contactNumber: input.contactNumber?.trim() || null,
        alternateNumber: input.alternateNumber?.trim() || null,
        organization: input.organization?.trim() || null,
        locality: input.locality.trim(),
        addressOrLandmark: input.addressOrLandmark.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
        isWithinNagpurBounds: isWithinNagpur,
        peopleAffected,
        hasImmediateHealthThreat: hasImmediateThreat,
        situationDescription: input.situationDescription.trim(),
        verificationStatus: 'PENDING',
        verificationReason: 'Public civilian submission. Awaiting municipal telephone or field verification.',
        urgency,
        urgencyReason,
        items: {
          create: input.items.map((i) => ({
            category: (i as any).category && validCategories.includes((i as any).category)
              ? (i as any).category
              : categoryEnum,
            name: i.name.trim(),
            requestedQty: Number(i.requestedQty),
            allocatedQty: 0,
            fulfilledQty: 0,
            unit: i.unit.trim(),
            notes: i.notes?.trim() || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return {
      success: true,
      requestId: savedRequest.id,
      verificationStatus: savedRequest.verificationStatus,
      submittedAt: savedRequest.createdAt.toISOString(),
      locality: savedRequest.locality,
      peopleAffected: savedRequest.peopleAffected,
      itemsCount: savedRequest.items.length,
      itemsSummary: savedRequest.items
        .map((i) => `${i.name} (${i.requestedQty} ${i.unit})`)
        .join(', '),
      message:
        'Your relief request has been securely recorded in the Nagpur municipal coordination system. An operator will review and verify your request.',
    };
  }

  /**
   * Safe public request tracking
   * Returns high-level confirmation status without exposing exact GPS coordinates
   * or personal details of requesters to prevent abuse.
   */
  async trackPublicRequest(requestId: string, contactPhone?: string) {
    const prisma = this.ensureDbActive();

    const record = await prisma.reliefRequest.findUnique({
      where: { id: requestId.trim() },
      include: {
        items: true,
      },
    });

    if (!record) {
      throw new AppError(
        `No relief request found matching ID "${requestId}". Please check the ID or contact the relief helpline.`,
        404
      );
    }

    // Optional phone number check if provided for extra privacy verification
    if (contactPhone && record.contactNumber) {
      const cleanInput = contactPhone.replace(/\D/g, '');
      const cleanStored = record.contactNumber.replace(/\D/g, '');
      if (cleanInput.length >= 6 && !cleanStored.includes(cleanInput)) {
        throw new AppError('The phone number provided does not match the record for this request ID.', 403);
      }
    }

    const totalRequested = record.items.reduce((s, i) => s + i.requestedQty, 0);
    const totalFulfilled = record.items.reduce((s, i) => s + i.fulfilledQty, 0);

    let statusSummary = 'Pending Verification';
    let statusExplanation = 'Your request has been received and is waiting for field or telephone verification by relief operators.';

    if (record.verificationStatus === 'VERIFIED') {
      if (totalFulfilled >= totalRequested && totalRequested > 0) {
        statusSummary = 'Supplies Delivered';
        statusExplanation = 'Requested relief supplies have been confirmed as delivered to your location.';
      } else if (totalFulfilled > 0) {
        statusSummary = 'Partially Fulfilled';
        statusExplanation = 'A portion of your supplies has been delivered. Remaining items are in preparation.';
      } else {
        statusSummary = 'Verified & In Triage';
        statusExplanation = 'Your request has been verified by the rescue team and is queued for resource allocation from Nagpur depots.';
      }
    } else if (record.verificationStatus === 'CLARIFICATION_NEEDED') {
      statusSummary = 'Clarification Needed';
      statusExplanation = 'The response team needs additional details to locate or fulfill your request.';
    } else if (record.verificationStatus === 'REJECTED') {
      statusSummary = 'Not Accepted';
      statusExplanation = record.verificationReason || 'Request could not be validated or duplicate report resolved.';
    }

    return {
      requestId: record.id,
      submittedAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      locality: record.locality,
      verificationStatus: record.verificationStatus,
      statusSummary,
      statusExplanation,
      items: record.items.map((i) => ({
        name: i.name,
        requestedQty: i.requestedQty,
        fulfilledQty: i.fulfilledQty,
        unit: i.unit,
      })),
    };
  }

  /**
   * Protected: Retrieves all relief requests for authorized operators
   */
  async getAllRequests(filters?: {
    verificationStatus?: string;
    urgency?: string;
    locality?: string;
  }) {
    const prisma = this.ensureDbActive();

    // First, check if database is empty. If empty, seed initial records.
    const count = await prisma.reliefRequest.count();
    if (count === 0) {
      await this.seedInitialDatabase();
    }

    const where: any = {};
    if (filters?.verificationStatus && filters.verificationStatus !== 'ALL') {
      where.verificationStatus = filters.verificationStatus;
    }
    if (filters?.urgency && filters.urgency !== 'ALL') {
      where.urgency = filters.urgency;
    }
    if (filters?.locality && filters.locality !== 'ALL') {
      where.locality = { contains: filters.locality, mode: 'insensitive' };
    }

    const records = await prisma.reliefRequest.findMany({
      where,
      include: {
        items: true,
        deliveries: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.mapRequestToFrontendModel(r));
  }

  /**
   * Protected: Updates verification status
   */
  async updateVerification(
    requestId: string,
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CLARIFICATION_NEEDED',
    reason?: string,
    operatorNotes?: string
  ) {
    const prisma = this.ensureDbActive();

    const updated = await prisma.reliefRequest.update({
      where: { id: requestId },
      data: {
        verificationStatus: status,
        verificationReason: reason || null,
        operatorNotes: operatorNotes || undefined,
        updatedAt: new Date(),
      },
      include: {
        items: true,
        deliveries: true,
      },
    });

    return this.mapRequestToFrontendModel(updated);
  }

  /**
   * Protected: Updates urgency level with mandatory justification
   */
  async updateUrgency(
    requestId: string,
    urgency: 'IMMEDIATE' | 'URGENT' | 'ELEVATED' | 'ROUTINE',
    reason: string
  ) {
    const prisma = this.ensureDbActive();

    if (!reason || reason.trim().length < 4) {
      throw new AppError('An operator justification is required when adjusting urgency level.', 400);
    }

    const updated = await prisma.reliefRequest.update({
      where: { id: requestId },
      data: {
        urgency,
        urgencyReason: reason.trim(),
        updatedAt: new Date(),
      },
      include: {
        items: true,
        deliveries: true,
      },
    });

    return this.mapRequestToFrontendModel(updated);
  }

  /**
   * Protected: Retrieves municipal inventory
   */
  async getInventory() {
    const prisma = this.ensureDbActive();

    const count = await prisma.reliefInventoryItem.count();
    if (count === 0) {
      await this.seedInitialDatabase();
    }

    const items = await prisma.reliefInventoryItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      totalStock: i.totalStock,
      reservedStock: i.reservedStock,
      unit: i.unit,
      storageLocation: i.storageLocation,
      reorderThreshold: i.reorderThreshold,
      lastVerifiedAt: i.lastVerifiedAt.toISOString(),
    }));
  }

  /**
   * Protected: Adds or updates stock in inventory
   */
  async addOrUpdateInventory(data: {
    id?: string;
    name: string;
    category: string;
    totalStock: number;
    unit: string;
    storageLocation: string;
    reorderThreshold?: number;
  }) {
    const prisma = this.ensureDbActive();

    if (data.id) {
      const updated = await prisma.reliefInventoryItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category as any,
          totalStock: Number(data.totalStock),
          unit: data.unit,
          storageLocation: data.storageLocation,
          reorderThreshold: Number(data.reorderThreshold ?? 10),
          lastVerifiedAt: new Date(),
        },
      });
      return updated;
    }

    const created = await prisma.reliefInventoryItem.create({
      data: {
        name: data.name,
        category: data.category as any,
        totalStock: Number(data.totalStock),
        reservedStock: 0,
        unit: data.unit,
        storageLocation: data.storageLocation,
        reorderThreshold: Number(data.reorderThreshold ?? 10),
      },
    });
    return created;
  }

  /**
   * Protected: Retrieves active deliveries
   */
  async getDeliveries() {
    const prisma = this.ensureDbActive();

    const deliveries = await prisma.reliefDelivery.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return deliveries.map((d) => ({
      id: d.id,
      requestId: d.requestId,
      requestItemId: d.requestItemId,
      resourceId: d.resourceId,
      resourceName: d.resourceName,
      category: d.category,
      allocatedQty: d.allocatedQty,
      unit: d.unit,
      originLocation: d.originLocation,
      destinationLocation: d.destinationLocation,
      assignedResponder: d.assignedResponder || undefined,
      deliveryStatus: d.deliveryStatus,
      notes: d.notes || undefined,
      dispatchedAt: d.dispatchedAt?.toISOString(),
      deliveredAt: d.deliveredAt?.toISOString(),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  /**
   * Protected: Creates allocation from depot to request item
   */
  async createAllocation(input: {
    requestId: string;
    requestItemId: string;
    resourceId: string;
    allocatedQty: number;
    assignedResponder?: string;
    notes?: string;
  }) {
    const prisma = this.ensureDbActive();

    return await prisma.$transaction(async (tx) => {
      const inventory = await tx.reliefInventoryItem.findUnique({
        where: { id: input.resourceId },
      });
      if (!inventory) throw new AppError('Specified resource was not found in inventory.', 404);

      const request = await tx.reliefRequest.findUnique({
        where: { id: input.requestId },
        include: { items: true },
      });
      if (!request) throw new AppError('Relief request not found.', 404);

      const item = request.items.find((i) => i.id === input.requestItemId);
      if (!item) throw new AppError('Request item not found.', 404);

      const available = inventory.totalStock - inventory.reservedStock;
      if (input.allocatedQty > available) {
        throw new AppError(
          `Insufficient stock available. Requested ${input.allocatedQty} ${inventory.unit}, but only ${available} ${inventory.unit} are unreserved.`,
          400
        );
      }

      // 1. Reserve stock
      await tx.reliefInventoryItem.update({
        where: { id: input.resourceId },
        data: { reservedStock: inventory.reservedStock + input.allocatedQty },
      });

      // 2. Update item allocated quantity
      await tx.reliefRequestItem.update({
        where: { id: input.requestItemId },
        data: { allocatedQty: item.allocatedQty + input.allocatedQty },
      });

      // 3. Create delivery record
      const deliveryId = `DEL-${Date.now().toString().slice(-6)}`;
      const delivery = await tx.reliefDelivery.create({
        data: {
          id: deliveryId,
          requestId: input.requestId,
          requestItemId: input.requestItemId,
          resourceId: input.resourceId,
          resourceName: inventory.name,
          category: inventory.category,
          allocatedQty: input.allocatedQty,
          unit: inventory.unit,
          originLocation: inventory.storageLocation,
          destinationLocation: `${request.locality} (${request.addressOrLandmark})`,
          assignedResponder: input.assignedResponder?.trim() || 'Nagpur Disaster Response Unit',
          deliveryStatus: 'ASSIGNED',
          notes: input.notes?.trim() || null,
        },
      });

      return delivery;
    });
  }

  /**
   * Protected: Advances delivery lifecycle
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: 'ASSIGNED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED'
  ) {
    const prisma = this.ensureDbActive();

    return await prisma.$transaction(async (tx) => {
      const delivery = await tx.reliefDelivery.findUnique({
        where: { id: deliveryId },
      });
      if (!delivery) throw new AppError('Delivery record not found.', 404);

      const isBecomingDelivered = status === 'DELIVERED' && delivery.deliveryStatus !== 'DELIVERED';

      if (isBecomingDelivered) {
        // Fulfill quantities on item and deduct total stock
        await tx.reliefRequestItem.update({
          where: { id: delivery.requestItemId },
          data: {
            fulfilledQty: { increment: delivery.allocatedQty },
          },
        });

        await tx.reliefInventoryItem.update({
          where: { id: delivery.resourceId },
          data: {
            totalStock: { decrement: delivery.allocatedQty },
            reservedStock: { decrement: delivery.allocatedQty },
          },
        });
      }

      const updated = await tx.reliefDelivery.update({
        where: { id: deliveryId },
        data: {
          deliveryStatus: status,
          dispatchedAt: status === 'IN_TRANSIT' ? new Date() : undefined,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          updatedAt: new Date(),
        },
      });

      return updated;
    });
  }

  /**
   * Converts a Prisma ReliefRequest to the frontend ReliefRequest interface
   */
  private mapRequestToFrontendModel(r: any) {
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      requesterType: r.requesterType,
      requesterName: r.requesterName || undefined,
      contactNumber: r.contactNumber || undefined,
      organization: r.organization || undefined,
      location: {
        locality: r.locality,
        addressOrLandmark: r.addressOrLandmark,
        latitude: r.latitude,
        longitude: r.longitude,
        isWithinNagpurBounds: r.isWithinNagpurBounds,
      },
      peopleAffected: r.peopleAffected,
      items: (r.items || []).map((i: any) => ({
        id: i.id,
        category: i.category,
        name: i.name,
        requestedQty: i.requestedQty,
        allocatedQty: i.allocatedQty,
        fulfilledQty: i.fulfilledQty,
        unit: i.unit,
        notes: i.notes || undefined,
      })),
      hasImmediateHealthThreat: r.hasImmediateHealthThreat,
      situationDescription: r.situationDescription,
      verificationStatus: r.verificationStatus,
      verificationReason: r.verificationReason || undefined,
      urgency: r.urgency,
      urgencyReason: r.urgencyReason,
      operatorNotes: r.operatorNotes || undefined,
    };
  }

  /**
   * Seeds initial municipal Nagpur demonstration dataset into PostgreSQL
   */
  private async seedInitialDatabase() {
    const prisma = this.ensureDbActive();

    // 1. Initial Inventory
    const inventorySeed = [
      { id: 'res-wtr-01', name: 'Packaged Drinking Water (20L Cans)', category: 'SAFE_WATER', totalStock: 450, reservedStock: 75, unit: 'cans', storageLocation: 'Sitabuldi Central Depot', reorderThreshold: 50 },
      { id: 'res-wtr-02', name: 'Water Purification Tablets (Packs of 50)', category: 'SAFE_WATER', totalStock: 1200, reservedStock: 150, unit: 'packs', storageLocation: 'Kalamna Hub', reorderThreshold: 200 },
      { id: 'res-med-01', name: 'Emergency Trauma & First Aid Kits', category: 'MEDICAL_ASSISTANCE', totalStock: 80, reservedStock: 30, unit: 'kits', storageLocation: 'GMCH Medical Depot', reorderThreshold: 25 },
      { id: 'res-med-02', name: 'ORS Packets (Oral Rehydration)', category: 'MEDICAL_ASSISTANCE', totalStock: 2500, reservedStock: 400, unit: 'sachets', storageLocation: 'GMCH Medical Depot', reorderThreshold: 300 },
      { id: 'res-fod-01', name: 'Ready-to-Eat Dry Meal Packets', category: 'FOOD_NUTRITION', totalStock: 1800, reservedStock: 380, unit: 'meal packs', storageLocation: 'Sitabuldi Central Depot', reorderThreshold: 250 },
      { id: 'res-fod-02', name: 'Baby Food Formula & Porridge', category: 'FOOD_NUTRITION', totalStock: 120, reservedStock: 45, unit: 'tins', storageLocation: 'Sadar Relief Storage', reorderThreshold: 30 },
      { id: 'res-shl-01', name: 'Waterproof Tarpaulin Sheets (15x12 ft)', category: 'SHELTER_BEDDING', totalStock: 220, reservedStock: 80, unit: 'tarps', storageLocation: 'Kalamna Hub', reorderThreshold: 40 },
      { id: 'res-shl-02', name: 'Emergency Blankets & Sleeping Mats', category: 'SHELTER_BEDDING', totalStock: 350, reservedStock: 120, unit: 'sets', storageLocation: 'Sitabuldi Central Depot', reorderThreshold: 60 },
      { id: 'res-rsc-01', name: 'Inflatable Life Jackets & Rescue Vests', category: 'RESCUE_EVACUATION', totalStock: 95, reservedStock: 25, unit: 'vests', storageLocation: 'Nagpur Fire & Rescue HQ', reorderThreshold: 20 },
      { id: 'res-hyg-01', name: 'Family Hygiene & Antiseptic Care Packs', category: 'HYGIENE_SANITATION', totalStock: 280, reservedStock: 60, unit: 'packs', storageLocation: 'Sadar Relief Storage', reorderThreshold: 50 },
    ];

    for (const inv of inventorySeed) {
      await prisma.reliefInventoryItem.upsert({
        where: { id: inv.id },
        update: {},
        create: {
          id: inv.id,
          name: inv.name,
          category: inv.category as any,
          totalStock: inv.totalStock,
          reservedStock: inv.reservedStock,
          unit: inv.unit,
          storageLocation: inv.storageLocation,
          reorderThreshold: inv.reorderThreshold,
        },
      });
    }

    // 2. Initial Demonstration Requests
    const requestsSeed = [
      {
        id: 'REQ-NGP-101',
        requesterType: 'SHELTER_COORDINATOR',
        requesterName: 'Anil Deshmukh',
        contactNumber: '+91 98230 44120',
        organization: 'Mahal Community Center Relief Camp',
        locality: 'Mahal Old City',
        addressOrLandmark: 'Near Gandhi Gate, Community Hall #2',
        latitude: 21.1442,
        longitude: 79.1065,
        isWithinNagpurBounds: true,
        peopleAffected: 65,
        hasImmediateHealthThreat: false,
        situationDescription: 'Shelter holding 65 displaced residents from low-lying wards. Safe water delivered; urgent need for infant care packs and dry meal replenishment.',
        verificationStatus: 'VERIFIED' as const,
        verificationReason: 'Verified on-site by Ward 14 relief inspector.',
        urgency: 'URGENT' as const,
        urgencyReason: 'High headcount of elderly and infants with dwindling clean water and baby supplies.',
        operatorNotes: 'Partial water delivery fulfilled. Ready-to-eat meal allocation assigned to Sitabuldi Central Depot.',
        items: [
          { category: 'SAFE_WATER' as const, name: 'Drinking water (20L Jerry Cans)', requestedQty: 50, allocatedQty: 25, fulfilledQty: 25, unit: 'cans' },
          { category: 'FOOD_NUTRITION' as const, name: 'Ready-to-eat meals', requestedQty: 180, allocatedQty: 180, fulfilledQty: 0, unit: 'meal packs' },
        ],
      },
      {
        id: 'REQ-NGP-102',
        requesterType: 'FIELD_RESPONDER',
        requesterName: 'Captain S. Patil (SDRF Unit 4)',
        contactNumber: '+91 94221 00987',
        organization: 'Nagpur SDRF Boat Squad B',
        locality: 'Medical Square / Ajni',
        addressOrLandmark: 'Behind GMCH Trauma Ward, Waterlogged Lowland Colony',
        latitude: 21.1278,
        longitude: 79.0984,
        isWithinNagpurBounds: true,
        peopleAffected: 18,
        hasImmediateHealthThreat: true,
        situationDescription: 'Water accumulation reached ground floor level. 4 senior citizens diabetic and 2 bedridden patients require immediate medical trauma evacuation and glucose/ORS supplies.',
        verificationStatus: 'VERIFIED' as const,
        verificationReason: 'Direct radio confirmation from SDRF Unit 4 on-scene boat commander.',
        urgency: 'IMMEDIATE' as const,
        urgencyReason: 'Threat to human life: Bedridden patients stranded with contaminated water rising.',
        operatorNotes: 'Assigned to Boat Squad B and GMCH Trauma Ambulance #3.',
        items: [
          { category: 'RESCUE_EVACUATION' as const, name: 'Evacuation boats & Life vests', requestedQty: 18, allocatedQty: 18, fulfilledQty: 18, unit: 'people' },
          { category: 'MEDICAL_ASSISTANCE' as const, name: 'Trauma kits & sterile bandages', requestedQty: 6, allocatedQty: 6, fulfilledQty: 6, unit: 'kits' },
        ],
      },
      {
        id: 'REQ-NGP-103',
        requesterType: 'AFFECTED_PERSON',
        requesterName: 'Sunita Gaikwad',
        contactNumber: '+91 98902 33411',
        locality: 'Dharampeth',
        addressOrLandmark: 'West High Court Road, Near Coffee House Chowk',
        latitude: 21.1415,
        longitude: 79.0620,
        isWithinNagpurBounds: true,
        peopleAffected: 28,
        hasImmediateHealthThreat: false,
        situationDescription: 'Basement flooding in 3 adjacent residential complexes. 28 residents on 1st floor terraces. Drinking water supply cut off.',
        verificationStatus: 'PENDING' as const,
        verificationReason: 'Telephone verification call attempted; awaiting callback from resident representative.',
        urgency: 'ELEVATED' as const,
        urgencyReason: 'Water supply cut off for 24h, moderate headcount awaiting municipal delivery.',
        operatorNotes: 'Awaiting secondary confirmation before dispatching Kalamna tanker.',
        items: [
          { category: 'SAFE_WATER' as const, name: 'Drinking water (20L Jerry Cans)', requestedQty: 30, allocatedQty: 0, fulfilledQty: 0, unit: 'cans' },
          { category: 'FOOD_NUTRITION' as const, name: 'Dry ration or food packets', requestedQty: 50, allocatedQty: 0, fulfilledQty: 0, unit: 'packets' },
        ],
      },
    ];

    for (const r of requestsSeed) {
      await prisma.reliefRequest.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          requesterType: r.requesterType,
          requesterName: r.requesterName,
          contactNumber: r.contactNumber,
          organization: r.organization,
          locality: r.locality,
          addressOrLandmark: r.addressOrLandmark,
          latitude: r.latitude,
          longitude: r.longitude,
          isWithinNagpurBounds: r.isWithinNagpurBounds,
          peopleAffected: r.peopleAffected,
          hasImmediateHealthThreat: r.hasImmediateHealthThreat,
          situationDescription: r.situationDescription,
          verificationStatus: r.verificationStatus,
          verificationReason: r.verificationReason,
          urgency: r.urgency,
          urgencyReason: r.urgencyReason,
          operatorNotes: r.operatorNotes,
          items: {
            create: r.items.map((i) => ({
              category: i.category as any,
              name: i.name,
              requestedQty: i.requestedQty,
              allocatedQty: i.allocatedQty,
              fulfilledQty: i.fulfilledQty,
              unit: i.unit,
            })),
          },
        },
      });
    }
  }
}

export const reliefService = new ReliefService();
