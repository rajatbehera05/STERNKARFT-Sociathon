import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:admin@127.0.0.1:5433/sternkraft_db?schema=public',
    },
  },
});

interface RescueSeedItem {
  id: string;
  clientIncidentId: string;
  category: 'TRAPPED_FLOOD' | 'MEDICAL_EMERGENCY' | 'COLLAPSE_HAZARD' | 'SUPPLIES_WATER' | 'OTHER';
  description: string;
  senderName: string;
  senderPhone: string;
  headcount: number;
  hasCriticalInjuries: boolean;
  hasInfantsOrElderly: boolean;
  waterLevelRising: boolean;
  locationManual: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  priorityTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  deliveryState: 'DRAFT' | 'SUBMITTED' | 'GATEWAY_RECEIVED' | 'PERSISTED_LOCALLY' | 'OPERATOR_ACKNOWLEDGED';
  operatorNotes?: string;
}

const incidentsData: RescueSeedItem[] = [
  {
    id: 'INC-0001',
    clientIncidentId: 'seed-nagpur-001',
    category: 'TRAPPED_FLOOD',
    description: 'Nag River breach: 6 family members on rooftop with 2-month-old infant. Ground floor completely submerged.',
    senderName: 'Rameshwar Wankhede',
    senderPhone: '+91 98223 41011',
    headcount: 6,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: true,
    locationManual: 'Rooftop of 2-storey house near Sitabuldi Metro Bridge, Ward 12',
    latitude: 21.1441,
    longitude: 79.0831,
    accuracyMeters: 8,
    priorityTier: 'CRITICAL',
    status: 'IN_PROGRESS',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Boat Unit Alpha en-route with life vests and infant carrier.',
  },
  {
    id: 'INC-0002',
    clientIncidentId: 'seed-nagpur-002',
    category: 'MEDICAL_EMERGENCY',
    description: 'Elderly cardiac patient with oxygen cylinder failing. Power cut in Dharampeth market area.',
    senderName: 'Dr. Sunita Deshmukh',
    senderPhone: '+91 94231 88920',
    headcount: 2,
    hasCriticalInjuries: true,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Shankar Nagar Square, 2nd Floor, Apt 204 near Shivaji Maharaj Statue',
    latitude: 21.1395,
    longitude: 79.0624,
    accuracyMeters: 6,
    priorityTier: 'CRITICAL',
    status: 'IN_PROGRESS',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Paramedic Quick Response Ambulance dispatched with portable oxygen concentrator.',
  },
  {
    id: 'INC-0003',
    clientIncidentId: 'seed-nagpur-003',
    category: 'TRAPPED_FLOOD',
    description: 'Rapid inundation near Gandhi Sagar Lake. 8 students trapped in ground floor library hostel.',
    senderName: 'Pravin Gedam',
    senderPhone: '+91 97654 32189',
    headcount: 8,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: false,
    waterLevelRising: true,
    locationManual: 'Near Raman Science Centre gate, Gandhi Sagar East bank, Mahal',
    latitude: 21.1468,
    longitude: 79.1025,
    accuracyMeters: 10,
    priorityTier: 'CRITICAL',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
    operatorNotes: 'Prioritized in active queue. Awaiting second inflatable raft.',
  },
  {
    id: 'INC-0004',
    clientIncidentId: 'seed-nagpur-004',
    category: 'COLLAPSE_HAZARD',
    description: 'Old wada brick wall cracked and tilting under heavy rainwater pressure. 5 residents inside.',
    senderName: 'Govind Rao Joshi',
    senderPhone: '+91 98901 23456',
    headcount: 5,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Kelibagh Road, near Tilak Statue, Mahal, Nagpur',
    latitude: 21.1432,
    longitude: 79.1098,
    accuracyMeters: 12,
    priorityTier: 'HIGH',
    status: 'ACKNOWLEDGED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'SDRF structural triage unit alerted for controlled evacuation.',
  },
  {
    id: 'INC-0005',
    clientIncidentId: 'seed-nagpur-005',
    category: 'SUPPLIES_WATER',
    description: 'No drinkable water and dry rations exhausted for 35 people stranded in community shelter.',
    senderName: 'Sister Teresa Memorial Trust',
    senderPhone: '+91 98600 77112',
    headcount: 35,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'St. Francis De Sales Cathedral Community Hall, Mohan Nagar, Sadar',
    latitude: 21.1592,
    longitude: 79.0834,
    accuracyMeters: 5,
    priorityTier: 'HIGH',
    status: 'IN_PROGRESS',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Relief truck #4 loaded with 100 water crates and biscuit packets dispatched.',
  },
  {
    id: 'INC-0006',
    clientIncidentId: 'seed-nagpur-006',
    category: 'TRAPPED_FLOOD',
    description: 'Ambazari lake overflow canal flooded low-lying slum. 12 individuals holding onto utility pole boundary.',
    senderName: 'Kailash Meshram',
    senderPhone: '+91 91588 44230',
    headcount: 12,
    hasCriticalInjuries: true,
    hasInfantsOrElderly: true,
    waterLevelRising: true,
    locationManual: 'Ambazari Layout, near VNIT Back Gate and overflow weir',
    latitude: 21.1275,
    longitude: 79.0498,
    accuracyMeters: 14,
    priorityTier: 'CRITICAL',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
  },
  {
    id: 'INC-0007',
    clientIncidentId: 'seed-nagpur-007',
    category: 'MEDICAL_EMERGENCY',
    description: 'Dialysis patient missed two consecutive cycles due to submerged access road in Itwari.',
    senderName: 'Abdul Rashid',
    senderPhone: '+91 93700 12890',
    headcount: 3,
    hasCriticalInjuries: true,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Grain Market Lane 4, Behind Itwari Post Office',
    latitude: 21.1542,
    longitude: 79.1189,
    accuracyMeters: 9,
    priorityTier: 'CRITICAL',
    status: 'ACKNOWLEDGED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Medical transport boat coordinated with Mayo Hospital emergency wing.',
  },
  {
    id: 'INC-0008',
    clientIncidentId: 'seed-nagpur-008',
    category: 'TRAPPED_FLOOD',
    description: 'Basement clinic submerged. Doctor and 3 patients evacuated to 1st floor staircase landing.',
    senderName: 'Dr. Vivek Agrawal',
    senderPhone: '+91 94228 11902',
    headcount: 4,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: false,
    waterLevelRising: true,
    locationManual: 'Ramdaspeth Central Avenue, near Hotel Centre Point',
    latitude: 21.1338,
    longitude: 79.0754,
    accuracyMeters: 7,
    priorityTier: 'HIGH',
    status: 'IN_PROGRESS',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Field Unit Beta assisting with portable pump and dry evacuation.',
  },
  {
    id: 'INC-0009',
    clientIncidentId: 'seed-nagpur-009',
    category: 'SUPPLIES_WATER',
    description: 'Dialysis and burn care supplies urgently needed at Government Medical College temporary field camp.',
    senderName: 'GMC Triage Desk',
    senderPhone: '+91 71227 44001',
    headcount: 50,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Medical Square, GMC Outpatient Block B Entrance',
    latitude: 21.1270,
    longitude: 79.0980,
    accuracyMeters: 4,
    priorityTier: 'HIGH',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
  },
  {
    id: 'INC-0010',
    clientIncidentId: 'seed-nagpur-010',
    category: 'TRAPPED_FLOOD',
    description: 'Civilian car stalled in 4 feet gushing underpass water. 2 occupants sitting on car roof.',
    senderName: 'Anand Shrivastav',
    senderPhone: '+91 98230 55432',
    headcount: 2,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: false,
    waterLevelRising: true,
    locationManual: 'Mankapur Railway Underpass / Koradi Road junction',
    latitude: 21.1874,
    longitude: 79.0782,
    accuracyMeters: 15,
    priorityTier: 'CRITICAL',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
  },
  {
    id: 'INC-0011',
    clientIncidentId: 'seed-nagpur-011',
    category: 'COLLAPSE_HAZARD',
    description: 'Under-construction boundary wall collapsed onto tin shed dwelling. 3 laborers lightly injured.',
    senderName: 'Sanjay Barela',
    senderPhone: '+91 99700 88219',
    headcount: 6,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Wardhaman Nagar, Central Avenue East Extension near Jain Temple',
    latitude: 21.1512,
    longitude: 79.1348,
    accuracyMeters: 11,
    priorityTier: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'First aid kits handed over. Site secured from electric poles.',
  },
  {
    id: 'INC-0012',
    clientIncidentId: 'seed-nagpur-012',
    category: 'TRAPPED_FLOOD',
    description: 'Ground floor flats waterlogged to 5 feet depth. 9 family members waiting on terrace terrace.',
    senderName: 'Mrs. Rekha Bapat',
    senderPhone: '+91 93255 67890',
    headcount: 9,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: true,
    locationManual: 'Trimurti Nagar Main Road, behind Ring Road Petrol Pump',
    latitude: 21.1182,
    longitude: 79.0494,
    accuracyMeters: 8,
    priorityTier: 'HIGH',
    status: 'IN_PROGRESS',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Boat Unit Gamma dispatched with high-capacity ropes.',
  },
  {
    id: 'INC-0013',
    clientIncidentId: 'seed-nagpur-013',
    category: 'MEDICAL_EMERGENCY',
    description: 'Pregnant woman experiencing labor contractions; water has blocked road vehicles.',
    senderName: 'Manish Tembhurne',
    senderPhone: '+91 97644 33210',
    headcount: 3,
    hasCriticalInjuries: true,
    hasInfantsOrElderly: false,
    waterLevelRising: true,
    locationManual: 'Khamla Old Basti, Lane 2, near Dr. Ambedkar Statue',
    latitude: 21.1118,
    longitude: 79.0652,
    accuracyMeters: 6,
    priorityTier: 'CRITICAL',
    status: 'IN_PROGRESS',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Emergency obstetric response team en-route via amphibious ATV.',
  },
  {
    id: 'INC-0014',
    clientIncidentId: 'seed-nagpur-014',
    category: 'SUPPLIES_WATER',
    description: 'Elderly care home with 18 senior citizens stranded without potable drinking water or diabetic medication.',
    senderName: 'Matruchhaya Old Age Home',
    senderPhone: '+91 71225 99014',
    headcount: 18,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Pratap Nagar Housing Society, Block C, near Ring Road',
    latitude: 21.1215,
    longitude: 79.0583,
    accuracyMeters: 6,
    priorityTier: 'HIGH',
    status: 'ACKNOWLEDGED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Insulin and water supplies staged at Sector Command Post #2.',
  },
  {
    id: 'INC-0015',
    clientIncidentId: 'seed-nagpur-015',
    category: 'TRAPPED_FLOOD',
    description: 'Somalwada nullah overflowing; ground floor apartment windows submerged. 4 persons trapped.',
    senderName: 'Deepak Chitnavis',
    senderPhone: '+91 98224 55198',
    headcount: 4,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: true,
    locationManual: 'Wardha Road, Behind Chhatrapati Square Metro Station, Somalwada',
    latitude: 21.0965,
    longitude: 79.0712,
    accuracyMeters: 10,
    priorityTier: 'CRITICAL',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
  },
  {
    id: 'INC-0016',
    clientIncidentId: 'seed-nagpur-016',
    category: 'SUPPLIES_WATER',
    description: 'Water filtration plant shutdown. High-rise apartment complex with 60 families needs water replenishment.',
    senderName: 'Manish Nagar RWA',
    senderPhone: '+91 94030 91823',
    headcount: 120,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: false,
    locationManual: 'Manish Nagar T-Point, SkyLine Heights Apartment, Nagpur South',
    latitude: 21.0883,
    longitude: 79.0828,
    accuracyMeters: 5,
    priorityTier: 'MEDIUM',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
  },
  {
    id: 'INC-0017',
    clientIncidentId: 'seed-nagpur-017',
    category: 'TRAPPED_FLOOD',
    description: 'Water level reached 6 feet in Pahi nullah basin. 7 individuals stranded in temple premises.',
    senderName: 'Santosh Gaikwad',
    senderPhone: '+91 96570 12345',
    headcount: 7,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: false,
    waterLevelRising: true,
    locationManual: 'Pardi Octroi Post, Bhandara Road, East Nagpur',
    latitude: 21.1495,
    longitude: 79.1552,
    accuracyMeters: 12,
    priorityTier: 'HIGH',
    status: 'ACKNOWLEDGED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Rescue craft dispatched from East Sector depot.',
  },
  {
    id: 'INC-0018',
    clientIncidentId: 'seed-nagpur-018',
    category: 'COLLAPSE_HAZARD',
    description: 'Severe erosion along Pili River bank threatening 4 shanties. Residents requesting immediate evacuation.',
    senderName: 'Bhimrao Dongre',
    senderPhone: '+91 98811 76543',
    headcount: 14,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: true,
    waterLevelRising: true,
    locationManual: 'Jaripatka Ring Road Canal Bridge, North Nagpur',
    latitude: 21.1823,
    longitude: 79.0984,
    accuracyMeters: 9,
    priorityTier: 'HIGH',
    status: 'OPEN',
    deliveryState: 'PERSISTED_LOCALLY',
  },
  {
    id: 'INC-0019',
    clientIncidentId: 'seed-nagpur-019',
    category: 'OTHER',
    description: 'Landmark report: Transformer sparked and power lines snapped into standing water.',
    senderName: 'Kishore Mahajan',
    senderPhone: '+91 94221 44556',
    headcount: 0,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: false,
    waterLevelRising: false,
    locationManual: 'Opposite High Court Bench, Civil Lines, Nagpur',
    latitude: null, // Landmark only report (demonstrating landmark triage)
    longitude: null,
    accuracyMeters: null,
    priorityTier: 'LOW',
    status: 'RESOLVED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'MSEDCL electricity grid division turned off grid feeder remotely.',
  },
  {
    id: 'INC-0020',
    clientIncidentId: 'seed-nagpur-020',
    category: 'TRAPPED_FLOOD',
    description: '2 security guards stranded on pump house roof near Futala Lake weir.',
    senderName: 'Ashok Tayade',
    senderPhone: '+91 98909 88776',
    headcount: 2,
    hasCriticalInjuries: false,
    hasInfantsOrElderly: false,
    waterLevelRising: false,
    locationManual: 'Futala Lake Promenade, Pump House #3, Telangkhedi',
    latitude: 21.1558,
    longitude: 79.0435,
    accuracyMeters: 10,
    priorityTier: 'MEDIUM',
    status: 'RESOLVED',
    deliveryState: 'OPERATOR_ACKNOWLEDGED',
    operatorNotes: 'Successfully evacuated by boat team Delta at 08:30 AM.',
  },
];

const respondersData = [
  {
    responderId: 'RESP-01',
    name: 'Inspector Vijay Chauhan',
    role: 'BOAT_CREW',
    callsign: 'Alpha-Boat-1',
    currentStatus: 'ACTIVE' as const,
    latitude: 21.1448,
    longitude: 79.0825,
    batteryPct: 88,
  },
  {
    responderId: 'RESP-02',
    name: 'SDRF Paramedic Team Beta',
    role: 'PARAMEDIC',
    callsign: 'Beta-Medic-1',
    currentStatus: 'EN_ROUTE' as const,
    latitude: 21.1390,
    longitude: 79.0630,
    batteryPct: 76,
  },
  {
    responderId: 'RESP-03',
    name: 'Drone Recon Unit Gamma',
    role: 'DRONE_OPERATOR',
    callsign: 'SkyHawk-Drone-4',
    currentStatus: 'ACTIVE' as const,
    latitude: 21.1470,
    longitude: 79.1020,
    batteryPct: 62,
  },
  {
    responderId: 'RESP-04',
    name: 'Commander Priya Sharma',
    role: 'COMMANDER',
    callsign: 'Command-HQ',
    currentStatus: 'ACTIVE' as const,
    latitude: 21.1458,
    longitude: 79.0882,
    batteryPct: 95,
  },
];

async function seed() {
  console.log('🌱 Starting database seed for STERN-X Nagpur disaster response...');

  // 1. Seed Responders
  for (const resp of respondersData) {
    await prisma.responder.upsert({
      where: { responderId: resp.responderId },
      update: {
        currentStatus: resp.currentStatus,
        latitude: resp.latitude,
        longitude: resp.longitude,
        batteryPct: resp.batteryPct,
        lastSeenAt: new Date(),
      },
      create: {
        responderId: resp.responderId,
        name: resp.name,
        role: resp.role,
        callsign: resp.callsign,
        currentStatus: resp.currentStatus,
        latitude: resp.latitude,
        longitude: resp.longitude,
        batteryPct: resp.batteryPct,
        lastSeenAt: new Date(),
      },
    });
  }
  console.log(`✅ Upserted ${respondersData.length} active emergency responders.`);

  // 2. Seed Rescue Incidents
  for (const item of incidentsData) {
    const isAcknowledged = item.status !== 'OPEN';
    await prisma.rescueIncident.upsert({
      where: { clientIncidentId: item.clientIncidentId },
      update: {
        category: item.category,
        description: item.description,
        senderName: item.senderName,
        senderPhone: item.senderPhone,
        headcount: item.headcount,
        hasCriticalInjuries: item.hasCriticalInjuries,
        hasInfantsOrElderly: item.hasInfantsOrElderly,
        waterLevelRising: item.waterLevelRising,
        locationManual: item.locationManual,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracyMeters: item.accuracyMeters,
        priorityTier: item.priorityTier,
        status: item.status,
        deliveryState: item.deliveryState,
        acknowledged: isAcknowledged,
        acknowledgedAt: isAcknowledged ? new Date() : null,
        operatorNotes: item.operatorNotes,
      },
      create: {
        id: item.id,
        clientIncidentId: item.clientIncidentId,
        category: item.category,
        description: item.description,
        senderName: item.senderName,
        senderPhone: item.senderPhone,
        headcount: item.headcount,
        hasCriticalInjuries: item.hasCriticalInjuries,
        hasInfantsOrElderly: item.hasInfantsOrElderly,
        waterLevelRising: item.waterLevelRising,
        locationManual: item.locationManual,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracyMeters: item.accuracyMeters,
        priorityTier: item.priorityTier,
        status: item.status,
        deliveryState: item.deliveryState,
        acknowledged: isAcknowledged,
        acknowledgedAt: isAcknowledged ? new Date() : null,
        operatorNotes: item.operatorNotes,
        statusHistory: {
          create: {
            previousStatus: 'OPEN',
            newStatus: item.status,
            operatorNotes: item.operatorNotes || 'Initial incident registration via gateway triage.',
          },
        },
      },
    });
  }
  console.log(`✅ Seeded ${incidentsData.length} Nagpur rescue incidents into PostgreSQL.`);

  // 3. Write offline local JSON fallback in ./backend/data/incidents.json
  const offlineJsonItems = incidentsData.map((inc) => ({
    id: inc.id,
    client_incident_id: inc.clientIncidentId,
    category: inc.category,
    description: inc.description,
    sender_name: inc.senderName,
    sender_phone: inc.senderPhone,
    headcount: inc.headcount,
    has_critical_injuries: inc.hasCriticalInjuries,
    has_infants_or_elderly: inc.hasInfantsOrElderly,
    water_level_rising: inc.waterLevelRising,
    location_manual: inc.locationManual,
    location_geo: inc.latitude !== null && inc.longitude !== null
      ? {
          latitude: inc.latitude,
          longitude: inc.longitude,
          accuracy_meters: inc.accuracyMeters,
        }
      : null,
    priority_tier: inc.priorityTier,
    status: inc.status === 'OPEN' ? 'NEW' : inc.status === 'IN_PROGRESS' ? 'RESPONDING' : inc.status,
    delivery_state: inc.deliveryState,
    created_at: new Date(Date.now() - Math.floor(Math.random() * 3600000 * 4)).toISOString(),
    updated_at: new Date().toISOString(),
    operator_notes: inc.operatorNotes || undefined,
  }));

  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const incidentsJsonPath = path.join(dataDir, 'incidents.json');
  fs.writeFileSync(incidentsJsonPath, JSON.stringify(offlineJsonItems, null, 2), 'utf-8');
  console.log(`✅ Saved ${offlineJsonItems.length} incidents to offline fallback file: ${incidentsJsonPath}`);

  // 4. Seed 20 Relief Requests in PostgreSQL for Relief Coordination Dashboard
  const reliefLocalities = [
    { name: 'Sitabuldi', lat: 21.1441, lng: 79.0831 },
    { name: 'Dharampeth', lat: 21.1458, lng: 79.0620 },
    { name: 'Mahal', lat: 21.1452, lng: 79.1065 },
    { name: 'Sadar', lat: 21.1590, lng: 79.0835 },
    { name: 'Itwari', lat: 21.1560, lng: 79.1170 },
    { name: 'Medical Square', lat: 21.1270, lng: 79.0980 },
    { name: 'Trimurti Nagar', lat: 21.1180, lng: 79.0490 },
    { name: 'Ramdaspeth', lat: 21.1340, lng: 79.0760 },
    { name: 'Civil Lines', lat: 21.1565, lng: 79.0680 },
    { name: 'Wardhaman Nagar', lat: 21.1510, lng: 79.1350 },
    { name: 'Khamla', lat: 21.1120, lng: 79.0650 },
    { name: 'Mankapur', lat: 21.1890, lng: 79.0780 },
    { name: 'Manish Nagar', lat: 21.0880, lng: 79.0830 },
    { name: 'Somalwada', lat: 21.0960, lng: 79.0710 },
    { name: 'Pardi', lat: 21.1490, lng: 79.1550 },
    { name: 'Jaripatka', lat: 21.1820, lng: 79.0980 },
    { name: 'Pratap Nagar', lat: 21.1210, lng: 79.0580 },
    { name: 'Dhantoli', lat: 21.1350, lng: 79.0860 },
    { name: 'Ambazari', lat: 21.1320, lng: 79.0430 },
    { name: 'Seminary Hills', lat: 21.1660, lng: 79.0510 },
  ];

  const categories: Array<'SAFE_WATER' | 'FOOD_NUTRITION' | 'MEDICAL_ASSISTANCE' | 'SHELTER_BEDDING' | 'HYGIENE_SANITATION' | 'CLOTHING_ESSENTIALS'> = [
    'SAFE_WATER',
    'FOOD_NUTRITION',
    'MEDICAL_ASSISTANCE',
    'SHELTER_BEDDING',
    'HYGIENE_SANITATION',
    'CLOTHING_ESSENTIALS',
  ];

  const urgencies: Array<'IMMEDIATE' | 'URGENT' | 'ELEVATED' | 'ROUTINE'> = [
    'IMMEDIATE',
    'URGENT',
    'ELEVATED',
    'ROUTINE',
  ];

  const verificationStatuses: Array<'PENDING' | 'VERIFIED' | 'CLARIFICATION_NEEDED' | 'VERIFIED'> = [
    'PENDING',
    'VERIFIED',
    'CLARIFICATION_NEEDED',
    'VERIFIED',
  ];

  for (let i = 0; i < reliefLocalities.length; i++) {
    const loc = reliefLocalities[i];
    const cat = categories[i % categories.length];
    const urgency = urgencies[i % urgencies.length];
    const vStatus = verificationStatuses[i % verificationStatuses.length];
    const reqId = `REL-2026-${String(1001 + i)}`;

    await prisma.reliefRequest.upsert({
      where: { id: reqId },
      update: {
        locality: loc.name,
        latitude: loc.lat,
        longitude: loc.lng,
        urgency: urgency,
        verificationStatus: vStatus,
        situationDescription: `Emergency relief needed for ${loc.name} flood victims. Requiring ${cat.toLowerCase().replace('_', ' ')}.`,
      },
      create: {
        id: reqId,
        requesterType: i % 2 === 0 ? 'AFFECTED_PERSON' : 'COMMUNITY_VOLUNTEER',
        requesterName: `Volunteer Group ${loc.name}`,
        contactNumber: `+91 98220 ${String(10000 + i).slice(0, 5)}`,
        locality: loc.name,
        addressOrLandmark: `Near Central Square, ${loc.name}, Nagpur`,
        latitude: loc.lat,
        longitude: loc.lng,
        isWithinNagpurBounds: true,
        peopleAffected: 5 + (i * 3),
        urgency: urgency,
        verificationStatus: vStatus,
        situationDescription: `Emergency relief needed for ${loc.name} flood victims. Requiring ${cat.toLowerCase().replace('_', ' ')}.`,
        hasImmediateHealthThreat: urgency === 'IMMEDIATE',
        items: {
          create: [
            {
              category: cat,
              name: cat === 'SAFE_WATER' ? 'Packaged 20L Water Cans' : cat === 'FOOD_NUTRITION' ? 'Ready-to-eat Ration Packets' : 'First Aid & Antiseptic Kits',
              requestedQty: 20 + i * 5,
              allocatedQty: vStatus === 'VERIFIED' ? 15 + i * 5 : 0,
              fulfilledQty: 0,
              unit: 'PACKS',
            },
          ],
        },
      },
    });
  }
  console.log(`✅ Seeded 20 Nagpur relief requests into PostgreSQL.`);
  console.log('🎉 Seeding complete successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
