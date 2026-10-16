# STERNKRAFT-Sociathon

[![Project Status](https://img.shields.io/badge/status-pre--hackathon%20setup-blue)](#)
[![Team](https://img.shields.io/badge/team-STERNKRAFT-orange)](#)

Repository for **Team STERNKRAFT** competing in **Sociathon**. This project combines an end-user software application with a physical IoT hardware model.

---

## 1. Repository Structure

```text
STERN-X/
├── README.md          # Team info, project overview, setup & workflow guide
├── .gitignore         # Secret hygiene, build outputs, and multi-stack ignores
├── docs/
│   └── PRD.md         # Primary specification & hackathon requirements
├── frontend/          # Web or client application interface
├── backend/           # Core API, business logic, ingestion & data handling
└── firmware/          # Microcontroller firmware, sensor/actuator drivers & telemetry
```

### Folder Responsibilities
- **`docs/`**: Houses [`PRD.md`](docs/PRD.md), the single source of truth for the project. Architecture, user flows, and evaluation criteria are defined here once the problem statement is unveiled.
- **`frontend/`**: Client interface for user interaction, device telemetry visualization, and controls.
- **`backend/`**: Server-side logic, API endpoints, database persistence, and hardware-cloud communication bridges.
- **`firmware/`**: Embedded software running on microcontrollers (sensor acquisition, actuator control, network communication).

---

## 2. Getting Started

> **Note:** The official problem statement has not yet been announced. The tech stack and hardware dependencies will be finalized once the problem statement and PRD are locked.

### Prerequisites (To be finalized)
Once dependencies are selected, detailed setup steps for each layer will be documented here:
- **Frontend Setup:** Navigate to `frontend/` and follow layer-specific runtime commands.
- **Backend Setup:** Navigate to `backend/` and initialize virtual environment or runtime modules.
- **Firmware Setup:** Navigate to `firmware/` and configure microcontroller toolchain/IDE (e.g., PlatformIO / Arduino).

---

## 3. Collaboration & Git Workflow

To ensure smooth parallel development across hardware and software sub-teams during a fast-paced hackathon:

### Branching Convention
- `main`: Production-ready code only. Keep the main branch stable and deployable.
- Feature branches: Branch off `main` using descriptive naming:
  - `feat/frontend-<feature-name>`
  - `feat/backend-<feature-name>`
  - `feat/firmware-<feature-name>`
  - `docs/<doc-update>`
- Create Pull Requests (PRs) into `main` and test locally before merging.

### Security & Secret Hygiene (CRITICAL)
- **Never commit credentials:** Do NOT commit API keys, database URLs, Wi-Fi credentials, or private certificates.
- **Environment files:** Real `.env` or hardware secret headers (`secrets.h`) are strictly ignored by `.gitignore`.
- **Environment templates:** Always commit safe `.env.example` templates showing required environment variable keys without sensitive values.