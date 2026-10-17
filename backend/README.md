# STERN-X Unified Backend Foundation

Unified backend foundation serving both **ReQNet Rescue Communication** and **DisasterSense Flood Monitoring** with clean logical domain separation, standardized exclusively on **PostgreSQL (Prisma ORM)**.

---

## 1. Technology Stack

- **Runtime**: Node.js v20+ (tested on Node v24.11.0 on Windows)
- **Language**: TypeScript with Native ES Modules (`"type": "module"`)
- **HTTP Engine**: Express 5.x
- **Schema & Environment Validation**: Zod
- **Database**: PostgreSQL 18 on `localhost:5433` (Target DB: `sternkraft_db`)
- **ORM & Data Layer**: Prisma ORM (sole database access layer)
- **Security**: Granular CORS origin whitelisting & Centralized Error Middleware
- **Testing**: Vitest & Supertest

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts           # Environment schema validation & typed config
│   ├── db/
│   │   └── prisma.ts        # Singleton Prisma client & active PostgreSQL round-trip health verification
│   ├── middleware/
│   │   ├── errorHandler.ts  # Centralized error handler with Zod/syntax parsing
│   │   ├── notFound.ts      # Structured 404 handler for unmatched routes
│   │   └── validate.ts      # Reusable request validation middleware
│   ├── routes/
│   │   ├── health.ts        # GET /api/health endpoint
│   │   ├── flood.ts         # /api/flood/* endpoints
│   │   ├── rescue.ts        # /api/rescue/* endpoints
│   │   └── index.ts         # Central API router with modular mounts
│   ├── services/
│   │   ├── floodService.ts  # Hydrological telemetry & flood alert business logic (Prisma)
│   │   └── rescueService.ts # Triage priority & rescue coordination logic (Prisma)
│   ├── app.ts               # Express application configuration & middleware setup
│   ├── server.ts            # HTTP server startup & graceful shutdown lifecycle
│   └── index.ts             # Module re-exports
├── tests/
│   ├── health.test.ts       # Health endpoint, CORS, and 404 integration tests
│   ├── flood.test.ts        # Flood telemetry, alerts, and threshold tests
│   └── rescue.test.ts       # SOS ingestion, priority, and state machine tests
├── prisma/
│   └── schema.prisma        # Authoritative PostgreSQL schema models
├── .env.example             # Complete environment variable template
├── package.json             # NPM dependencies and run scripts
├── tsconfig.json            # NodeNext ES module compiler options
├── vitest.config.ts         # Vitest runner configuration
└── README.md                # Backend architecture & documentation
```

---

## 3. Quick Start (Windows)

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- PostgreSQL 18 Service running on `localhost:5433`

### Setup Environment
```powershell
# In backend/
copy .env.example .env
```
In `.env`, set your local PostgreSQL password:
```env
DATABASE_URL="postgresql://postgres:<YOUR_POSTGRESQL_PASSWORD>@localhost:5433/sternkraft_db?schema=public"
```

### Safe Database Setup Command
```powershell
# Generate Prisma Client
npm run prisma:generate

# Push database schema to local PostgreSQL (creates sternkraft_db tables safely)
npm run prisma:push
```

### Run Tests
```powershell
npm test
```

### Run Development Server
```powershell
npm run dev
```
The server will start listening on `http://localhost:5001`.

---

## 4. API Endpoints

### Health Check: `GET /api/health`
Checks server vitality, PostgreSQL connectivity via live `$queryRaw` round-trip query, and ready modules.

**Sample Request**:
```bash
curl -X GET http://localhost:5001/api/health
```

**Sample Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "service": "sternx-unified-backend",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-10-17T00:00:00.000Z",
  "uptime_seconds": 42,
  "database": {
    "type": "postgres",
    "connected": true,
    "latency_ms": 2
  },
  "mode": "POSTGRESQL",
  "gateway_connected": true,
  "modules": {
    "reqnet_rescue": "ready",
    "disastersense_flood": "ready"
  }
}
```
