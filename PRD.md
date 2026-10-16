# Product Requirements Document (PRD)

## STERNKRAFT: Offline Emergency Communication and Rescue Coordination System

**Document Version:** 2.2.0  
**Status:** Approved for Implementation Planning  
**Target Event:** Sociathon (Overnight Hackathon)  
**Team Name:** STERNKRAFT  
**Scope:** Standalone Offline Emergency Gateway & Rescue Coordination Platform  
**Target File Path:** `PRD.md` (Project Root)

---

## Table of Contents

1. [Hackathon Problem Statement & Project Overview](#1-hackathon-problem-statement--project-overview)
2. [Target Personas, User Journeys & Pain Points](#2-target-personas-user-journeys--pain-points)
3. [Ruthlessly Streamlined Scope (MVP vs. Secondary vs. Future)](#3-ruthlessly-streamlined-scope-mvp-vs-secondary-vs-future)
4. [Project Technology Stack & Declared Dependencies](#4-project-technology-stack--declared-dependencies)
5. [Definitive Offline Architecture & Message Flow](#5-definitive-offline-architecture--message-flow)
6. [Hardware Bill of Materials (BOM) & Inventory Status](#6-hardware-bill-of-materials-bom--inventory-status)
7. [Product Experiences & Interface Specifications](#7-product-experiences--interface-specifications)
8. [Numbered Functional Requirements](#8-numbered-functional-requirements)
9. [Data Models, Enums & REST API Specifications](#9-data-models-enums--rest-api-specifications)
10. [Offline Reliability, Failure Scenarios & Truthful Delivery](#10-offline-reliability-failure-scenarios--truthful-delivery)
11. [Network Security, Access Control & Privacy](#11-network-security-access-control--privacy)
12. [Liquid-Free Hardware Demonstration Protocols](#12-liquid-free-hardware-demonstration-protocols)
13. [UI/UX, Accessibility & Component State Requirements](#13-uiux-accessibility--component-state-requirements)
14. [Test Plans & Testable Acceptance Criteria](#14-test-plans--testable-acceptance-criteria)
15. [Live 3–5 Minute Demonstration Sequence & Pitch Script](#15-live-35-minute-demonstration-sequence--pitch-script)
16. [Future Scope: Flood Monitoring & LoRa Radio Extensions](#16-future-scope-flood-monitoring--lora-radio-extensions)
17. [Implementation Roadmap](#17-implementation-roadmap)
18. [Assumptions and Genuinely Open Decisions](#18-assumptions-and-genuinely-open-decisions)

---

## 1. Hackathon Problem Statement & Project Overview

### 1.1 Hackathon Challenge Tracking
* **Target Event:** Sociathon 2026
* **Official Challenge Status:** **Pending Official Sociathon Problem Statement Release.**  
  *(Note: The official challenge prompt has not yet been formally unveiled by organizers. This PRD pre-aligns Team STERNKRAFT's technical execution around disaster resilience, humanitarian crisis response, and decentralized civic safety.)*
* **Target Domain:** Disaster Response, Resilient Civic Infrastructure, Offline Humanitarian Coordination, Flood Emergency Telemetry.

### 1.2 Core Problem Description
During severe catastrophic floods and storm surges, centralized public telecommunications infrastructure suffers catastrophic disruption:
* Backhaul fiber lines are severed, power grids trip, and local cellular base transceiver stations (BTS) exhaust their emergency battery banks within 2 to 4 hours.
* Trapped civilians stranded on rooftops, balconies, or upper building floors cannot call municipal emergency numbers (e.g., 112 or 911), cannot load web applications, and cannot transmit distress messages.
* First responders, disaster volunteers, and boat rescue units enter flooded districts without situational awareness: they lack structured visibility into where trapped groups are located, medical urgency, vulnerable individuals (infants/elderly), or whether another boat has already responded.

### 1.3 Project Concept: STERNKRAFT
STERNKRAFT is an **offline-capable emergency communication and rescue coordination system** engineered to operate with zero dependency on the public internet or cellular towers. 

The system establishes an autonomous micro-local emergency wireless area:
1. An **ESP32 microcontroller** acts as an immediate field gateway, broadcasting a localized Wi-Fi hotspot (`STERNKRAFT_EMERGENCY`).
2. Stranded individuals connect via any standard smartphone browser without installing native apps, submitting an optimized distress report (**SOS**) with triage tags, headcount, and optional location information.
3. The gateway ingests and acknowledges the packet locally with physical LED/buzzer confirmation and immediate HTTP JSON confirmation back to the phone.
4. The ESP32 relays the incident via **USB Serial** to the rescue field laptop, where operators view the incoming distress queue in real time on a high-visibility **Rescue Coordination Dashboard**, prioritizing critical victims, assigning rescue boat units, and transitioning incidents through an operational lifecycle.

---

## 2. Target Personas, User Journeys & Pain Points

### 2.1 Persona A: The Stranded Civilian ("Sender")
* **Profile:** A person trapped in a flooded domicile or structural vantage point; experiencing extreme psychological stress, battery depletion (<15%), and potentially wet, trembling hands.
* **Core Pain Points:** Cellular signal is dead; cannot notify authorities; fears signal was lost or not received; lacks technical knowledge to configure offline mesh networks; browser blocks GPS on insecure HTTP.
* **User Journey:**
  1. Detects open Wi-Fi network `STERNKRAFT_EMERGENCY` on their mobile phone and connects.
  2. Browser navigates to `http://192.168.4.1`.
  3. Selects emergency category (`Trapped / Rising Water`), confirms headcount, optionally types a landmark description (e.g., "Flat 2B, near flooded temple").
  4. Presses large "Transmit Emergency SOS" button (submission is **never blocked** by missing location).
  5. Receives clear, unambiguous confirmation screen displaying Incident Reference ID (`INC-0042`) with instructions to stay elevated and conserve device power.

### 2.2 Persona B: The Rescue Incident Commander ("Operator")
* **Profile:** First responder, NGO team lead, or national disaster relief coordinator operating on an inflatable motorized raft or temporary field command tent with a laptop or rugged tablet.
* **Core Pain Points:** Information overload combined with data vacuum; cannot differentiate between minor food supply requests and imminent medical drowning risks; duplicate dispatches waste scarce fuel and boat capacity.
* **User Journey:**
  1. Boots field station laptop connected to the ESP32 gateway via USB cable.
  2. Launches local dashboard (`http://localhost:3000`) connected to the local Express backend (`http://localhost:5000`).
  3. Receives incoming distress reports forwarded over Serial in real time.
  4. Reviews newly arrived `CRITICAL` incident (rising water, elderly stranded).
  5. Changes status from `NEW` to `ACKNOWLEDGED`, then to `RESPONDING`.
  6. Once victims are safely evacuated, updates status to `RESOLVED`, clearing the active incident from the operational queue.

---

## 3. Ruthlessly Streamlined Scope (MVP vs. Secondary vs. Future)

To guarantee a reliable, fully working prototype during an overnight hackathon, all non-essential features have been stripped from the MVP. The MVP focuses exclusively on the **core end-to-end loop**:

$$\text{Phone SOS} \longrightarrow \text{ESP32 Wi-Fi Ingestion} \longrightarrow \text{USB Serial Forwarding} \longrightarrow \text{Express Backend} \longrightarrow \text{Dashboard Display \& Status Updates}$$

### Feature Classification Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STERNKRAFT SCOPE & PRIORITIZATION MATRIX                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  [MVP] MUST-HAVE (Core Live Demonstration)                                  │
│  ├── Mobile SOS Form: Emergency category, headcount, optional location      │
│  ├── Genuinely Optional Location: Submission NEVER blocked if location empty│
│  ├── ESP32 SoftAP Ingestion: Receives HTTP POST, flashes LED confirmation   │
│  ├── Definitive Message Forwarding: ESP32 sends JSON to Laptop over Serial  │
│  ├── Express 5 Backend: Serial listener + REST endpoints for incidents      │
│  ├── Simple Local Persistence: Atomic write to local `./data/incidents.json`│
│  ├── Rescue Dashboard: High-contrast cards, 2s short-polling, detail drawer │
│  ├── Incident Lifecycle: NEW → ACKNOWLEDGED → RESPONDING → RESOLVED         │
│  ├── Truthful Multi-Stage Delivery State Tracking (Zero False Receipts)     │
│  └── Gateway Status Indicator: Laptop detects active serial connection      │
├─────────────────────────────────────────────────────────────────────────────┤
│  [SECONDARY] TIME PERMITTING (Operator Depth & Usability Polish)            │
│  ├── Common Landing Page (`/`) with Bifurcated Navigation                   │
│  ├── Simple Operator Passphrase Check in Dashboard                          │
│  ├── Operator Internal Notes Append                                         │
│  ├── Automated 100-Point Priority Scoring Formula                           │
│  ├── Sound / Audio chime on incoming CRITICAL distress alert                │
│  └── Incident Queue Text Search & Filtering by Category                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [FUTURE SCOPE] EXCLUDED FROM OVERNIGHT SPRINT (Documented Extensions)      │
│  ├── Server-Sent Events (SSE) (Overkill for overnight; 2s polling works)    │
│  ├── Client-Side Offline Buffer (`localStorage` retry queue)                │
│  ├── Dedicated Flood-Monitoring Frontend (River stage curves & gauge charts)│
│  ├── Physical LoRa Transceiver Hardware Mesh (SX1276 Long-Range Bridging)   │
│  ├── PostgreSQL (Neon) Cloud Synchronization Worker                         │
│  ├── Predictive AI/ML Flood Inundation Modeling                             │
│  └── Automated Public Alert Broadcasts (Cell Broadcast / SMS Gateways)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Project Technology Stack & Declared Dependencies

The project relies strictly on the declared dependencies in `frontend/package.json` and `backend/package.json`. Exact installed versions are resolved via `package-lock.json`.

### 4.1 Frontend Tier (`frontend/package.json`)
* **Core Framework:** React 19 (`react: ^19.3.0`, `react-dom: ^19.3.0`)
* **Language & Typings:** TypeScript (`typescript: ^7.0.2`, `@types/react: ^19.3.0`, `@types/react-dom: ^19.3.0`)
* **Build Tooling:** Vite 8 (`vite: ^8.3.4`, `@vitejs/plugin-react: ^6.1.2`)
* **Styling Engine:** Tailwind CSS v4 (`tailwindcss: ^4.3.3`, `@tailwindcss/vite: ^4.3.3`)
* **Motion & Animation:** Framer Motion (`framer-motion: ^14.2.0`)
* **Iconography:** Lucide React (`lucide-react: ^1.57.0`)
* **Development Server:** `http://localhost:3000`

### 4.2 Backend Tier (`backend/package.json`)
* **Runtime Environment:** Node.js (ES Modules, `"type": "module"`)
* **Language & Execution:** TypeScript (`typescript: ^7.0.2`, `tsx: ^4.23.15`)
* **Web Framework:** Express 5 (`express: ^5.3.0`, `@types/express: ^5.0.6`)
* **Data Validation:** Zod (`zod: ^4.6.7`)
* **Utilities & Middleware:** CORS (`cors: ^2.8.6`), Dotenv (`dotenv: ^18.0.7`), Node Types (`@types/node: ^26.6.5`)
* **Local API Server:** `http://localhost:5000` (Core probe: `GET /api/health`)

### 4.3 Firmware & Embedded Tier (`firmware/`)
* **Microcontroller Target:** ESP32 Dev Module (ESP-WROOM-32)
* **Toolchain / Framework:** Arduino Core for ESP32 / PlatformIO
* **Hardware Protocols:** Wi-Fi SoftAP (802.11 b/g/n), UART Serial Communication (115200 baud)

### 4.4 Persistence Strategy
* **Offline Demonstration (MVP):** Local atomic file storage (`./data/incidents.json`) on the rescue laptop. Zero reliance on internet connectivity.
* **Connected Mode (Future Scope):** PostgreSQL via Neon (`@neondatabase/serverless`) when internet backhaul is restored.

---

## 5. Definitive Offline Architecture & Message Flow

To eliminate architectural ambiguity, Team STERNKRAFT establishes a **single, definitive message path** for the prototype:

### 5.1 Definitive Architectural Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STERNKRAFT DEFINITIVE MESSAGE PIPELINE                   │
└─────────────────────────────────────────────────────────────────────────────┘

  [ Stranded Civilian Phone ]
         │
         │  1. Connects to 802.11 b/g/n Wi-Fi (SSID: "STERNKRAFT_EMERGENCY")
         │  2. Loads static SOS form from ESP32: http://192.168.4.1/
         │  3. Submits JSON via HTTP POST to http://192.168.4.1/api/sos
         ▼
  [ ESP32 Hardware Gateway ]
         │
         │  4. Parses JSON, flashes onboard LED / buzzer
         │  5. Immediately returns HTTP 201 ACK JSON to phone:
         │     { "success": true, "incident_id": "INC-0042", "status": "GATEWAY_RECEIVED" }
         │  6. Serializes packet into single-line JSON string
         │  7. Transmits over USB Serial (UART @ 115200 baud)
         ▼
  [ Rescue Field Station Laptop ]
         │
         ├── Serial Ingestion Listener (Reads COM port stream on host)
         ▼
  [ Express 5 Local API ] (Port 5000)
         │
         ├── 8. Ingests incident from Serial (or mock endpoint)
         ├── 9. Persists atomically to disk: `./data/incidents.json`
         ▼
  [ Rescue Coordination Dashboard ] (React 19 / Port 3000)
         │
         └── 10. Polls `GET /api/incidents` every 2.0 seconds
             11. Renders `INC-0042` card at top of active queue
             12. Operator clicks "Acknowledge" -> `PATCH /api/incidents/INC-0042/status`
```

### 5.2 Why This Definitive Path Is Chosen for the Hackathon
1. **Decoupled Security & Isolation:** Civilians on the Wi-Fi AP have zero direct network route to the operator's laptop. They cannot tamper with or access the rescue dashboard.
2. **Rock-Solid Hardware Demonstration:** In a crowded hackathon venue, Wi-Fi client-to-client routing on an ESP32 is notoriously fragile and packet-drop prone. Bridging the ESP32 to the laptop via **USB Serial** guarantees 100% transmission reliability and physical proof of hardware receipt.
3. **True Hardware Verification:** The ESP32 is not just a passive hotspot; it actively receives the HTTP request, processes it, blinks its hardware LED, and emits the serial telemetry.

---

## 6. Hardware Bill of Materials (BOM) & Inventory Status

This BOM reflects grounded project realities, distinguishing verified team inventory from bench components and unverified extensions.

| Component | Detailed Specification | Purpose in Prototype | Sourcing & Inventory Status |
| :--- | :--- | :--- | :--- |
| **Microcontroller Board** | ESP32-WROOM-32 DevKit (30/38 pin) with onboard 2.4 GHz PCB antenna & Micro-USB/USB-C | Local emergency Wi-Fi Access Point (SoftAP), DHCP server, and packet receiver | **Existing Inventory** (Team Hardware) |
| **Operator Workstation** | Laptop (x86_64, Windows/macOS/Linux) with Node.js & local Wi-Fi interface | Hosts Express 5 backend API, React 19 dashboard, and local JSON persistence | **Existing Inventory** (Team Hardware) |
| **Civilian Test Client** | Smartphone (Android or iOS) with standard 802.11 b/g/n Wi-Fi & modern browser | Demonstrates civilian SOS submission over local Wi-Fi without installed apps | **Existing Inventory** (Team Hardware) |
| **USB Data / Power Cable** | Shielded USB-A to Micro-USB (or USB-C depending on ESP32 board) | Microcontroller power delivery, flashing, and serial telemetry debugging | **Existing Inventory** (Team Hardware) |
| **Field Power Source** | 5V / 2.1A DC Portable Power Bank (USB-A output) | Autonomous portable power for ESP32 in field conditions away from AC mains | **Existing Inventory / Easily Sourced** |
| **Bench Distance Sensor** | HC-SR04 Ultrasonic Sensor (or VL53L0X Time-of-Flight module) | Simulates water-level depth variations on the bench without water | **Bench Addition (Team Hardware)** |
| **Breadboard & Jumper Wires** | Half-size solderless breadboard + Dupont jumper wires (M-to-M, M-to-F) | Prototyping connections between ESP32 and bench distance sensor | **Bench Addition (Team Hardware)** |
| **Hardware Status Indicators** | 5mm LEDs (Green, Red) + $330\Omega$ current-limiting resistors + active buzzer | Physical breadboard indicators for Wi-Fi client connection & SOS received | **Optional Bench Addition** |
| **LoRa Radio Modules** | Semtech SX1276 / SX1278 (868/915 MHz) SPI transceiver boards | Long-range radio mesh extension | **Unverified Assumption (Future Scope only; not in active prototype)** |

---

## 7. Product Experiences & Interface Specifications

### 7.1 Experience 1: Mobile SOS Interface (`/sos` or embedded root) `[MVP]`
* **Route:** `/sos` (or root `http://192.168.4.1/` on ESP32)
* **Purpose:** Minimalist, high-contrast, fault-tolerant distress submission form designed for mobile phone screens in low-battery conditions.
* **Key Components:**
  * **Emergency Category Selector:** Single-select chips with large touch targets:
    * `TRAPPED_FLOOD` (default)
    * `MEDICAL_EMERGENCY`
    * `COLLAPSE_HAZARD`
    * `SUPPLIES_WATER`
    * `OTHER`
  * **Headcount Counter:** Numerical stepper (minimum `1`, default `1`, buttons `+1`, `+5`).
  * **Critical Triage Flags (Checkboxes):**
    * `Water level is rising`
    * `Critical injury / unconscious person`
    * `Infants or elderly present`
  * **Location Input (GENUINELY OPTIONAL):**
    * *Browser Geolocation Button:* "Attempt GPS Capture" (clearly notes: *"May not be supported on unencrypted local Wi-Fi"*).
    * *Manual Location Input:* Text field with placeholder: *"E.g., 2nd floor balcony, green roof near old water tank (optional)"*.
    * *Golden Rule:* **Submission is NEVER disabled or blocked if location is left blank.**
  * **Optional Sender Info:** Name and contact number (optional).
  * **Submission Button:** Large 52px high button: **"Transmit Emergency SOS"**.
  * **Confirmation Screen:** Upon receiving HTTP 201 from ESP32, immediately replaces form with:
    * Green checkmark & Incident Reference ID (`INC-0042`).
    * Gateway receipt timestamp.
    * Safety directive: *"Keep your phone on. Stay on elevated structures. Signal received by local rescue team."*

### 7.2 Experience 2: Rescue Coordination Dashboard (`/dashboard`) `[MVP]`
* **Route:** `/dashboard` (hosted on laptop at `http://localhost:3000`)
* **Purpose:** Real-time operational command console for rescue coordinators to triage, prioritize, assign, and track distress reports.
* **Key Components:**
  * **Top Metrics Ribbon:** Total Incidents, Pending Acknowledgment, Responding, and Cleared/Resolved.
  * **Triage Queue Cards:** Live-updating list of incidents with priority badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) updating via 2.0-second short-polling.
  * **Incident Detail Drawer:**
    * Full telemetry, timestamps, headcount, and specific triage flags.
    * Manual location description (or coordinates link if captured).
    * One-tap Status Action Buttons: `Acknowledge`, `Dispatch Boat`, `Mark Resolved`.
  * **Hardware Gateway Liveness Indicator:** Shows status of the Serial / Gateway link (Connected / Disconnected).

### 7.3 Experience 3: Common Landing Page (`/`) `[SECONDARY]`
* **Route:** `/`
* **Purpose:** Informational landing page explaining the system, providing survival advice, and linking to `/sos` and `/dashboard`.

---

## 8. Numbered Functional Requirements

### 8.1 SOS Creation & Genuinely Optional Location (`/sos`)
* **FR-1.1 [MVP]:** The SOS form MUST permit submission with minimal mandatory fields: Emergency Category and Headcount.
* **FR-1.2 [MVP]:** Location data (both GPS and manual text) MUST be **genuinely optional**. Missing or denied location MUST NEVER disable or block the submit button.
* **FR-1.3 [MVP]:** The client MUST handle the browser restriction where `navigator.geolocation` is blocked on insecure HTTP contexts (`http://192.168.4.1`) without throwing uncaught exceptions or interrupting the user flow.
* **FR-1.4 [MVP]:** The SOS form MUST provide predefined emergency category selectors: `TRAPPED_FLOOD`, `MEDICAL_EMERGENCY`, `COLLAPSE_HAZARD`, `SUPPLIES_WATER`, `OTHER`.
* **FR-1.5 [MVP]:** The SOS form MUST provide rapid boolean triage flags: `has_infants_or_elderly`, `has_critical_injuries`, `water_level_rising`.
* **FR-1.6 [MVP]:** Upon pressing "Transmit SOS", the client MUST generate a client-side UUID v4 (`client_incident_id`) to ensure idempotency.
* **FR-1.7 [MVP]:** The SOS form MUST disable the submission button and display a deterministic progress indicator while the request is in-flight.
* **FR-1.8 [MVP]:** Upon receiving HTTP 201 confirmation from the gateway, the interface MUST display the confirmation view with Incident ID, timestamp, and safety instructions.

### 8.2 ESP32 Gateway Ingestion & Serial Bridging
* **FR-2.1 [MVP]:** The ESP32 MUST broadcast a Wi-Fi Access Point (SSID: `STERNKRAFT_EMERGENCY`) and assign IP addresses in the `192.168.4.x` subnet.
* **FR-2.2 [MVP]:** The ESP32 MUST expose an HTTP POST endpoint at `/api/sos` to ingest civilian distress reports.
* **FR-2.3 [MVP]:** Upon successful ingestion, the ESP32 MUST blink an onboard/external LED and emit an HTTP 201 JSON response containing the assigned `incident_id` within 500ms.
* **FR-2.4 [MVP]:** The ESP32 MUST write the complete JSON payload across USB Serial (UART @ 115200 baud) terminated with a newline character.

### 8.3 Backend API & Local Persistence
* **FR-3.1 [MVP]:** The Express backend MUST provide a health check endpoint at `GET /api/health` returning HTTP 200 with service status.
* **FR-3.2 [MVP]:** The backend MUST ingest incoming incidents from the Serial listener (or direct HTTP POST `/api/incidents` for testing/simulation).
* **FR-3.3 [MVP]:** All incoming incident payloads MUST be validated using a strict Zod schema.
* **FR-3.4 [MVP]:** Validated incidents MUST be appended atomically to a local file store (`./data/incidents.json`) before returning success.
* **FR-3.5 [MVP]:** The backend MUST provide `GET /api/incidents` to serve the active incident queue to the dashboard.
* **FR-3.6 [MVP]:** The backend MUST provide `PATCH /api/incidents/:id/status` to transition incidents through lifecycle states.

### 8.4 Rescue Dashboard & Lifecycle Management (`/dashboard`)
* **FR-4.1 [MVP]:** The dashboard MUST poll `GET /api/incidents` at a fixed 2.0-second interval to display newly arrived incidents.
* **FR-4.2 [MVP]:** Incidents MUST be displayed in a responsive high-contrast card list with distinct visual priority badges:
  * `CRITICAL`: Rising water or critical injuries reported.
  * `HIGH`: Infants/elderly present or headcount > 5.
  * `MEDIUM`: Standard flood entrapment.
  * `LOW`: Supplies/other requests.
* **FR-4.3 [MVP]:** The dashboard MUST support transitioning incident statuses strictly through:
  $$\text{NEW} \longrightarrow \text{ACKNOWLEDGED} \longrightarrow \text{RESPONDING} \longrightarrow \text{RESOLVED}$$
* **FR-4.4 [MVP]:** Selecting an incident card MUST open a detail view showing full telemetry, manual location notes, and action buttons.
* **FR-4.5 [MVP]:** The dashboard MUST display a gateway connectivity indicator showing whether the backend serial connection to the ESP32 is healthy.

### 8.5 Secondary Usability Enhancements
* **FR-5.1 [SECONDARY]:** Common Landing Page (`/`) with bifurcated routing.
* **FR-5.2 [SECONDARY]:** Operator internal notes log per incident.
* **FR-5.3 [SECONDARY]:** Simple operator passphrase check in `sessionStorage` for dashboard actions.
* **FR-5.4 [SECONDARY]:** Audio alert tone when a `CRITICAL` incident arrives.

---

## 9. Data Models, Enums & REST API Specifications

### 9.1 Core TypeScript Interfaces

```typescript
export type EmergencyCategory =
  | 'TRAPPED_FLOOD'
  | 'MEDICAL_EMERGENCY'
  | 'COLLAPSE_HAZARD'
  | 'SUPPLIES_WATER'
  | 'OTHER';

export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESOLVED';

export type DeliveryState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'GATEWAY_RECEIVED'
  | 'PERSISTED_LOCALLY'
  | 'OPERATOR_ACKNOWLEDGED';

export interface GeoLocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
}

export interface Incident {
  id: string;                      // Server assigned ID (e.g., "INC-0042")
  client_incident_id: string;      // Client-generated UUID for idempotency
  category: EmergencyCategory;
  description?: string;
  sender_name?: string;
  sender_phone?: string;
  headcount: number;
  
  // Triage flags
  has_critical_injuries: boolean;
  has_infants_or_elderly: boolean;
  water_level_rising: boolean;
  
  // Location (Genuinely Optional)
  location_manual?: string;
  location_geo?: GeoLocationData;
  
  // Priority & State
  priority_tier: PriorityTier;
  status: IncidentStatus;
  delivery_state: DeliveryState;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### 9.2 REST API Endpoints (Express 5 Backend)

#### `GET /api/health`
* **Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "sternkraft-backend",
  "mode": "OFFLINE_LOCAL",
  "gateway_connected": true,
  "timestamp": "2026-10-16T14:40:00.000Z"
}
```

#### `POST /api/incidents` (Local Ingestion / Serial Bridge)
* **Zod Validation Schema:**
```typescript
import { z } from 'zod';

export const CreateIncidentSchema = z.object({
  client_incident_id: z.string().uuid(),
  category: z.enum([
    'TRAPPED_FLOOD',
    'MEDICAL_EMERGENCY',
    'COLLAPSE_HAZARD',
    'SUPPLIES_WATER',
    'OTHER'
  ]),
  description: z.string().max(500).optional(),
  sender_name: z.string().max(100).optional(),
  sender_phone: z.string().max(30).optional(),
  headcount: z.number().int().min(1).max(100).default(1),
  has_critical_injuries: z.boolean().default(false),
  has_infants_or_elderly: z.boolean().default(false),
  water_level_rising: z.boolean().default(false),
  location_manual: z.string().max(300).optional(),
  location_geo: z.object({
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    accuracy_meters: z.number().nullable()
  }).optional()
});
```
* **Response `201 Created`:**
```json
{
  "success": true,
  "incident_id": "INC-0042",
  "client_incident_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "delivery_state": "PERSISTED_LOCALLY",
  "priority_tier": "CRITICAL",
  "received_at": "2026-10-16T14:40:01.120Z"
}
```

#### `GET /api/incidents`
* **Response `200 OK`:** Returns array of all active and resolved incidents sorted by timestamp (newest first).

#### `PATCH /api/incidents/:id/status`
* **Request Body:** `{ "status": "RESPONDING" }`
* **Response `200 OK`:** Returns updated incident object.

---

## 10. Offline Reliability, Failure Scenarios & Truthful Delivery

### 10.1 Truthful State Disambiguation
In high-stress disasters, misleading UI states cost human lives. STERNKRAFT enforces absolute fidelity across message states:

```
[ Civilian Device ]
      │
      ▼  (HTTP POST initiated)
  [ SUBMITTED ]  (In flight across local Wi-Fi)
      │
      ├── (Wi-Fi dropped / Gateway unreachable) ──► [ DELIVERY_FAILED ]
      │                                             (Explicitly tells user: "NOT YET DELIVERED")
      ▼
  [ GATEWAY_RECEIVED ] (ESP32 acknowledges packet with HTTP 201)
      │
      ▼
  [ PERSISTED_LOCALLY ] (Saved to local disk `./data/incidents.json`)
      │
      ▼
  [ OPERATOR_ACKNOWLEDGED ] (Rescue team marks "Acknowledged" on dashboard)
      │
      ▼
  [ RESOLVED ] (Rescue team confirms civilian is evacuated)
```

**System Invariant:** The client interface will **NEVER** display "Message Delivered" or "Rescuers Notified" unless a formal HTTP `201/200` confirmation containing the server-generated `incident_id` has been received back by the browser.

### 10.2 Failure Mode Matrix & Systematic Mitigations

| Failure Scenario | Root Cause | System Response & Automated Mitigation | User / Operator Visibility |
| :--- | :--- | :--- | :--- |
| **No Public Internet** | Cellular towers flooded or fiber destroyed. | System operates entirely on local subnet and USB serial; zero external network calls. | Amber badge: `Local Emergency Network (Offline Mode)`. |
| **Browser Blocks GPS** | Insecure HTTP context (`192.168.4.1`) on mobile. | Form catches geolocation error silently; leaves GPS null; user can type manual location or leave blank. | Form displays: `GPS unavailable on local Wi-Fi. Manual description is optional.` |
| **Gateway Out of Range** | Civilian moves away from ESP32 signal. | Client catches network timeout (>4s); highlights retry button. | Red warning: `Unable to reach gateway. Check Wi-Fi connection and tap Retry.` |
| **Repeated / Duplicate Submissions** | Panicked user repeatedly presses "Send SOS". | Client generates a single `client_incident_id` per draft; backend deduplicates and returns the same active incident. | Button disabled upon first click; second attempt reports: `Update received for Incident #INC-XXXX`. |
| **Dashboard Restart / Browser Crash** | Field laptop reboots or operator accidentally closes browser tab. | All incident state is read directly from `./data/incidents.json` upon restart; zero state lost. | Dashboard instantly restores full list and queue state upon launch. |

---

## 11. Network Security, Access Control & Privacy

### 11.1 Access Control for Prototype Deployment
* **Civilian Access (Frictionless):**
  * The ESP32 broadcasts SSID: `STERNKRAFT_EMERGENCY`.
  * Open Wi-Fi (no password) or a simple universal password (`emergency`) prominently printed on the physical device housing.
  * **Rate Limiting:** ESP32 firmware enforces a 30-second cooldown per client IP/MAC to prevent accidental or malicious packet flooding.
* **Operator Isolation (Physical & Network Separation):**
  * Operators do **NOT** connect over the public civilian Wi-Fi network.
  * The rescue laptop communicates with the ESP32 strictly via a **physical USB Serial connection**.
  * The Rescue Dashboard runs locally on `http://localhost:3000` on the laptop. Civilians on the Wi-Fi cannot route to or access the operator dashboard.

### 11.2 Input Sanitization & Data Minimization
* All incoming strings are trimmed and sanitized via Zod schema rules (max lengths enforced to prevent buffer overflow).
* Only strictly operational emergency data is captured. No passwords, credentials, or invasive PII are collected.

---

## 12. Liquid-Free Hardware Demonstration Protocols

### 12.1 Absolute Liquid-Free Demonstration Rule
* **CRITICAL SAFETY DIRECTIVE:** To protect computing equipment, microcontroller dev boards, and venue electrical power, **the physical demonstration MUST NOT use liquids or water under any circumstances.**
* Bringing open containers of water into the presentation booth or pouring liquid over sensors is strictly prohibited.

### 12.2 Approved Hardware Demonstration Techniques
When demonstrating physical sensor interaction or simulated flood conditions:
1. **Ultrasonic / Distance Sensor (HC-SR04 / ToF):** Demonstrate water level rise by moving a solid flat surface (e.g., a notebook, cardboard sheet, or human hand) closer to the sensor transducer mounted on a bench rig. Decreasing distance translates directly to "rising water stage" in firmware.
2. **Firmware Telemetry Test Modes:** ESP32 firmware can include a physical pushbutton or serial command that toggles between realistic bench-test profiles (e.g., `BASELINE_FLOOD`, `RAPID_SURGE`, `RECEDING_WATERS`).
3. **Synthetic Data Labeling Rule:** Any UI element, gauge, or card displaying data that does not derive from a live physical sensor read at that exact moment **MUST be prominently labeled as `[SIMULATED DATA]`**.

---

## 13. UI/UX, Accessibility & Component State Requirements

### 13.1 Mission-Critical Design Principles
* **High Contrast (WCAG 2.1 AA Compliant):** Minimum contrast ratio of 4.5:1 for standard text and 3:1 for large controls.
* **Large Touch Targets:** All interactive buttons on the mobile SOS view must measure at least **48 × 48 px** to enable reliable operation with wet, trembling, or gloved hands.
* **Readable Typography:** Utilize clean system sans-serif typography with clear hierarchical scaling.

### 13.2 Comprehensive Interface States
Every UI view and component MUST specify four comprehensive states:
1. **Loading State:** Deterministic progress indicators or skeleton blocks.
2. **Empty State:** Clear guidance (e.g., "No active distress incidents in queue. All reported sectors clear.").
3. **Error State:** Explicit human-readable problem descriptions with actionable remediation.
4. **Offline / Disconnected State:** Unambiguous status indicators indicating that cached local data is being displayed.

---

## 14. Test Plans & Testable Acceptance Criteria

### 14.1 Frontend Acceptance Criteria (SOS & Dashboard)
* **TC-FE-01 (Optional Location Submission) [MVP]:** Fill out SOS form with Category = `TRAPPED_FLOOD`, leave GPS and manual location completely blank, click "Transmit SOS". Verify submission succeeds without client validation error.
* **TC-FE-02 (HTTP Geolocation Fallback) [MVP]:** Simulate insecure HTTP context where `navigator.geolocation` is undefined. Verify that clicking "Attempt GPS Capture" shows an informational notice without crashing.
* **TC-FE-03 (Confirmation Screen Transition) [MVP]:** Verify that upon receiving HTTP 201, the form transitions to the confirmation view displaying the server-assigned `incident_id`.
* **TC-FE-04 (Dashboard Polling & Display) [MVP]:** Verify that new incidents appear in the dashboard within 2.5 seconds of backend ingestion.
* **TC-FE-05 (Status Progression) [MVP]:** Click "Acknowledge" on an incident card; verify card visually transitions to `ACKNOWLEDGED` and updates backend state.

### 14.2 Hardware & Backend Integration Criteria
* **TC-HW-01 (ESP32 SoftAP & LED) [MVP]:** Power ESP32; verify SSID `STERNKRAFT_EMERGENCY` is visible within 3 seconds. Submit POST request; verify onboard LED blinks.
* **TC-HW-02 (Serial Forwarding) [MVP]:** Verify that submitting an SOS from a mobile device results in a properly formatted JSON line emitted across USB Serial to the laptop backend.
* **TC-BE-01 (Atomic File Persistence) [MVP]:** Verify that every ingested incident is written to `./data/incidents.json` and survives backend process restart.

---

## 15. Live 3–5 Minute Demonstration Sequence & Pitch Script

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STERNKRAFT 3–5 MINUTE LIVE DEMO CHOREOGRAPHY                │
├──────┬──────────────────────┬───────────────────────────────────────────────┤
│ TIME │ ACTION               │ DEMONSTRATION SCRIPT & JUDGE VISIBILITY       │
├──────┼──────────────────────┼───────────────────────────────────────────────┤
│ 0:00 │ The Hook & Context   │ • Show laptop in Airplane Mode (no internet). │
│  -   │ (Problem)            │ • State problem: "In a flood, cell towers die.│
│ 0:45 │                      │   STERNKRAFT creates an instant offline       │
│      │                      │   emergency micro-gateway on 5V USB power."   │
├──────┼──────────────────────┼───────────────────────────────────────────────┤
│ 0:45 │ The Civilian SOS     │ • Pick up live mobile phone. Join Wi-Fi:      │
│  -   │ (Submission)         │   "STERNKRAFT_EMERGENCY" (no app installed).  │
│ 1:45 │                      │ • Open browser to gateway. Select "Trapped".  │
│      │                      │ • Highlight that location is genuinely        │
│      │                      │   optional; enter optional landmark text.     │
│      │                      │ • Tap "Transmit SOS". ESP32 LED blinks!       │
│      │                      │ • Show Confirmation View with ID: `INC-0042`. │
├──────┼──────────────────────┼───────────────────────────────────────────────┤
│ 1:45 │ Hardware Bridge &    │ • Turn to Rescue Laptop running `/dashboard`. │
│  -   │ Real-time Ingestion  │ • `INC-0042` appears in the queue via Serial. │
│ 2:45 │                      │ • Point out physical USB Serial isolation:    │
│      │                      │   civilians cannot access the command console.│
├──────┼──────────────────────┼───────────────────────────────────────────────┤
│ 2:45 │ Rescue Coordination  │ • Click `INC-0042` to open detail drawer.     │
│  -   │ (Triage & Lifecycle) │ • Transition: `NEW` -> `ACKNOWLEDGED`.        │
│ 3:45 │                      │ • Transition: `RESPONDING` (Boat dispatched). │
│      │                      │ • Transition: `RESOLVED` (Victims safe).      │
├──────┼──────────────────────┼───────────────────────────────────────────────┤
│ 3:45 │ Hardware Bench &     │ • Demonstrate liquid-free bench sensor: move  │
│  -   │ Roadmap Close        │   cardboard closer to ultrasonic transducer.  │
│ 4:30 │                      │ • Summarize Roadmap: Phase 6 Flood UI and     │
│      │                      │   Phase 7 LoRa mesh transceiver extension.    │
└──────┴──────────────────────┴───────────────────────────────────────────────┘
```

---

## 16. Future Scope: Flood Monitoring & LoRa Radio Extensions

> **Strict Scope Boundary:** The features below are **NOT** part of the MVP overnight hackathon demonstration. They represent future architectural phases and are documented to define integration contracts.

### 16.1 Separate Flood-Monitoring Frontend (Phase 6 - Future Scope)
* **Dedicated Client:** A separate administrative dashboard designed for hydrological monitoring authorities.
* **Sensor Telemetry Ingestion:** Accepts real-time ultrasonic/pressure sensor readings (`water_level_cm`, `rate_of_rise_cm_per_hr`, `battery_mv`, `signal_rssi`).
* **Time-Series Curves:** Interactive 24-hour and 7-day hydrological stage graphs compared against historical flood benchmarks.
* **4-Tier Threshold Alerting:**
  * `NORMAL (Green)`: Water level < 60% channel capacity.
  * `ADVISORY (Yellow)`: Water level 60%–79% channel capacity; moderate rate of rise.
  * `WARNING (Amber)`: Water level 80%–94% capacity; roadway inundation expected.
  * `CRITICAL / EVACUATE (Red)`: Water level $\ge$ 95% capacity; mandatory civilian evacuation.

### 16.2 Hardware LoRa Mesh Transceiver Bridging (Phase 7 - Future Scope)
* **Scope Reality:** Standard consumer smartphones **cannot** speak LoRa radio protocols directly.
* **Architecture:** Dedicated edge nodes equipped with Semtech SX1276/SX1262 transceivers connected to microcontrollers.
* **Operation:** Receives local Wi-Fi packets, condenses payloads into compact binary structs (24–48 bytes), and transmits over 868/915 MHz Chirp Spread Spectrum radio over 2–8 km distances to a central base station gateway.

---

## 17. Implementation Roadmap

```
Phase 1: PRD, Architecture & Scope Prioritization (COMPLETED)
   │
   ▼
Phase 2: MVP Frontend Development (React 19 + Vite + Tailwind CSS v4)
   ├── Mobile SOS Submission Interface (`/sos`) [MVP]
   ├── Rescue Coordination Dashboard (`/dashboard`) [MVP]
   └── Common Landing Page (`/`) [SECONDARY]
   │
   ▼
Phase 3: MVP Backend API & Local Persistence
   ├── Express 5 Routes, Zod Middleware & Serial Listener [MVP]
   └── Local JSON Atomic Persistence (`./data/incidents.json`) [MVP]
   │
   ▼
Phase 4: ESP32 Gateway Firmware Integration
   ├── SoftAP Configuration & HTTP Ingestion [MVP]
   └── USB Serial Forwarding & Bench Sensor Setup (Liquid-Free) [MVP]
   │
   ▼
Phase 5: End-to-End Offline Field Validation
   ├── Zero-WAN hardware-in-the-loop disaster simulation [MVP]
   └── Mobile-to-ESP32-to-Dashboard live verification [MVP]
   │
   ▼
Phase 6: Flood Monitoring Frontend Integration [FUTURE SCOPE]
   └── Hydrological time-series trends, warning tiers & sensor matrices
   │
   ▼
Phase 7: Long-Range LoRa Mesh Bridge [FUTURE SCOPE]
   └── Point-to-multipoint transceiver node forwarding
```

---

## 18. Assumptions and Genuinely Open Decisions

### 18.1 Assumptions
1. Disaster victims possess a smartphone with residual battery power and functional 2.4 GHz 802.11 b/g/n Wi-Fi capabilities.
2. The rescue team operates a laptop equipped with standard USB ports capable of running Node.js and reading a serial COM port.
3. The physical ESP32 gateway can be powered continuously via a standard 5V USB battery pack or laptop USB port.

### 18.2 Technical Constraints
* **Insecure HTTP Geolocation Deprecation:** Modern mobile browsers strictly forbid `navigator.geolocation` on non-HTTPS origins. Since local ESP32 IP connections (`http://192.168.4.1`) lack valid SSL certificates, GPS will be unavailable on many mobile devices. The application must treat GPS as purely opportunistic and never require it.
* **ESP32 SoftAP Connection Limits:** The ESP32 SoftAP hardware is constrained to 4–8 concurrent client connections (`max_connection = 4..8`). Connections must be short-lived HTTP bursts that disconnect immediately after receiving acknowledgment.

### 18.3 Genuinely Open Decisions (To Be Resolved During Overnight Sprint)
1. **Serial Listener Implementation:**
   * *Option A:* Built-in Node.js `serialport` package reading the USB COM port directly.
   * *Option B:* A lightweight Python/Node serial forwarder script that reads COM port and calls `POST http://localhost:5000/api/incidents`.
   * *Working Hackathon Strategy:* Provide an HTTP ingestion endpoint in Express so the dashboard can be tested immediately with simulated/curl data, while adding a simple serial bridge for live hardware integration.
2. **ESP32 Static HTML Asset Delivery:**
   * *Option A:* Embed the minimal civilian HTML/JS form directly into ESP32 C++ string constants.
   * *Option B:* Store static files in ESP32 SPIFFS / LittleFS flash storage.
   * *Working Hackathon Strategy:* Single C++ raw string literal (`R"rawliteral(...)rawliteral"`) served via ESP32 WebServer for zero filesystem flashing overhead.

---

*End of Product Requirements Document — STERNKRAFT Sociathon Project.*
