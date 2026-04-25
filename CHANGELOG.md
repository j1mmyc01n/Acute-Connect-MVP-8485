# Acute Connect — Changelog

## v4.0.1 — Architecture Verification & Documentation Update
### Verified
- ✅ All system modules properly created and functional
- ✅ Overseer Dashboard fully operational with real-time telemetry
- ✅ Location Rollout System complete with automated deployment
- ✅ Documentation synchronized with actual implementation

### Documentation
- Updated TODO.md to reflect completed state
- Clarified all features in Location Rollout System
- Verified FILE_STRUCTURE_MAP.md matches actual file tree

---

## v4.0.0 — Full Stack PWA Restructure
### Major Changes
- 🏗️ **Complete Modular Architecture**
  - Split monolithic files into organized folder structure
  - Separated concerns: pages, features, components, services
  - Improved maintainability and scalability

- 🎯 **Overseer Dashboard** (renamed from SysAdmin Dashboard)
  - High-tech Network Operations Center (NOC) interface
  - Real-time animated SVG gauges for all locations
  - Live system telemetry and health monitoring
  - Location-specific status cards with needle gauges
  - Simulated real-time data throughput metrics
  - Event stream logging

- 🚀 **Location Rollout System** — Complete rebuild
  - **Infrastructure Setup**: GitHub, Netlify, Supabase credentials
  - **Care Type Selection**: Mental health, domestic violence, crisis support, substance abuse, youth services, general care
  - **Automated Tailoring**: Deployment tasks adapt to care type (e.g., mental health gets psychiatrist network integration)
  - **User Provisioning**: Create admin and staff accounts per location
  - **Phase Pipeline**: Planning → IT Setup → Training → Testing → Live (visual progress tracking)
  - **Contact Management**: Key stakeholders tracking with CRUD operations
  - **Compliance Tracking**: Regulatory and safety checkpoints
  - **Live Deployment Terminal**: Real-time logs during setup with simulated deployment process
  - **Template System**: Uses Acute Care platform as base template for all new locations
  - **Local Storage**: Rollout data persisted locally for offline access

### Fixed
- ✅ Location management (renamed from Care Centres)
- ✅ All client profiles fully editable
- ✅ CRM requests no longer stuck
- ✅ Proper folder structure for scalability
- ✅ Module export errors resolved

---

## v3.0.1
### Added
- ✅ SysAdmin Super Dashboard (Nexus Layout) with live gauges
- ✅ Real-time data simulation and animation

## v3.0.0
### Added
- Location Rollout Module (basic version)
- Client Profile Card with event logs
- Care Team Access Control

### Fixed
- CRM clients from CRN requests
- PDF reports formatting

---

## v2.9.2
### Added
- Multi-Centre Check-In Management

## v2.9.1
### Fixed
- PDF reports, CRN Requests workflow

## v2.8.0
### Added
- GitHub AI Agent Panel

## v2.7.0
### Added
- AI Code Fixer
- Location Rollout Manager (prototype)

## v2.6.0
### Added
- PWA support
- OTP login
- Heat Map
- Crisis Analytics
- Bulk Offboarding

## v2.5.0
### Added
- Care team assignment
- Crisis analytics
- Provider & Sponsor join pages

## v2.0.0
### Added
- Jax AI assistant
- Authentication system
- CRM and Triage
- Clinical Reports
- Dark mode