<div align="center">

<br />

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗███████╗██╗      ██████╗ ██╗    ██╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝██╔════╝██║     ██╔═══██╗██║    ██║
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗█████╗  ██║     ██║   ██║██║ █╗ ██║
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║██╔══╝  ██║     ██║   ██║██║███╗██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║██║     ███████╗╚██████╔╝╚███╔███╔╝
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
```

**DS Group — Volumetric Rider Payout Intelligence Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](./LICENSE)

*An enterprise-grade logistics intelligence dashboard that translates complex volumetric payout workbooks into real-time, actionable analytics.*

</div>

---

## 📖 Overview

**DS NexusFlow** is a full-stack, production-ready analytics platform built for DS Group's last-mile delivery operations. It replaces manual Excel-based payout processing with a live, formula-accurate engine that ingests custom workbooks, computes hub-specific volumetric rider payouts, and surfaces executive-grade operational insights — all in a single, beautifully designed web interface.

> The platform mirrors DS Group's proprietary payout formula model (v2 workbook), including SKU-level volumetric calculations, fulfillment ratios, binary cancellation compensation logic, and hub-threshold gating.

---

## ✨ Features

### 📊 Executive Dashboard
Real-time KPI cards displaying total payout, active riders, fleet fulfillment rate, cancellation compensation, and delivered volume. Includes payout trend charts, order status distributions, and a top-rider leaderboard.

### 📦 SKU Breakdown Engine
Deep SKU-level analytics per order — unit volumes, delivery status classification (`Fully Delivered` / `Partially Delivered` / `Not Delivered`), bulky SKU flagging, and volume contribution percentages.

### 💰 Order Payout Calculator
Mirrors the Excel formula engine exactly:
- **Fulfillment ratio** = `totalDeliveredVolume / totalOrderVolume`
- **Binary cancellation multiplier** based on hub GPS drift threshold
- **Final payout** = `basePayout × fulfillmentRatio` (or `basePayout × cancellationMultiplier` for cancelled orders)

### 🧾 Rider Summary Module
Per-rider aggregates: daily / weekly / monthly payouts, genuine delivery attempts, failed attempts, cancellation compensation, and average fulfillment ratios — all computed from raw order data.

### ⚠️ Cancellations Intelligence
Separates `Cancelled With Valid Attempt` from `Cancelled Without Valid Attempt` using per-hub GPS drift thresholds. Configurable compensation logic per hub.

### 📥 Excel Ingestion (SheetJS)
Upload custom `.xlsx` workbooks. The parser service auto-detects DS Group sheet schemas, enriches SKU data from an internal registry, and hydrates the global Zustand store — no manual data entry required.

### ✏️ Manual Order Entry
Add, edit, and remove individual orders through a form-based UI. Fully reactive — all downstream KPIs recalculate instantly via Zustand selectors.

### ⚙️ Settings & Hub Configuration
Admin interface to configure hub-level GPS drift thresholds, base payout rates, bulky SKU volume thresholds, and reference dates. Changes propagate globally and trigger a full engine recalculation.

### 🔔 Notification System
Ephemeral, session-based notification bell with read/unread badge tracking. Fires contextual alerts for manual additions, bulk uploads, and compensation triggers.

### 🔍 Global Search & Filter
Cross-page search that filters orders and riders in real-time, with a result-count banner on the dashboard.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Routing, SSR, layout system |
| **UI Library** | React 19 | Component rendering |
| **Language** | TypeScript 5 | End-to-end type safety |
| **State** | Zustand 5 + IDB Storage | Global store with persistence |
| **Charts** | Recharts 3 | Payout trends, fulfillment, comparisons |
| **Animations** | Framer Motion 12 | Page transitions, micro-animations |
| **Icons** | Lucide React | Icon system |
| **Components** | Radix UI Primitives | Dialogs, dropdowns, tooltips, tabs |
| **Excel Parsing** | SheetJS (xlsx) | Workbook ingestion |
| **Styling** | Tailwind CSS 4 + Vanilla CSS | Design system & tokens |

---

## 📂 Project Structure

```
nexusflow/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Executive Dashboard (root)
│   ├── intro/                  # Landing / welcome page
│   ├── order-payout/           # Order-level payout table
│   ├── sku-breakdown/          # SKU-level analytics
│   ├── rider-summary/          # Per-rider aggregates
│   ├── cancellations/          # Cancellation intelligence
│   ├── manual-entry/           # Manual order management
│   ├── upload/                 # Excel workbook ingestion
│   └── settings/               # Hub & workbook configuration
│
├── components/
│   ├── charts/                 # Recharts wrappers
│   │   ├── PayoutTrendChart.tsx
│   │   ├── FulfillmentChart.tsx
│   │   └── RiderComparisonChart.tsx
│   ├── layout/                 # App shell
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── ui/                     # Reusable UI primitives
│       ├── KpiCard.tsx
│       ├── PageHeader.tsx
│       ├── StatusBadge.tsx
│       └── SearchFilterBanner.tsx
│
├── lib/                        # Core business logic
│   ├── calculations.ts         # Formula engine (mirrors Excel model)
│   ├── analytics.ts            # Snapshot & trend builders
│   ├── workbookEngine.ts       # Workbook hydration pipeline
│   ├── companyWorkbookParserService.ts  # Excel sheet parser
│   └── skuRegistry.ts          # SKU enrichment registry
│
├── store/
│   ├── useStore.ts             # Zustand global store + selectors
│   └── idbStorage.ts           # IndexedDB persistence adapter
│
├── types/
│   ├── workbook.ts             # Core domain types
│   └── index.ts                # Re-exports
│
├── data/
│   └── workbook.json           # Default workbook seed data
│
└── hooks/
    └── useSearchFilter.ts      # Global search hook
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rizzit17/NexusFlow.git
cd NexusFlow

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🧮 Payout Formula Reference

NexusFlow precisely replicates the DS Group v2 payout model:

```
SKU Level
─────────────────────────────────────────────────────────
OrderedSkuVol        = unitVolume × orderedQty
DeliveredSkuVol      = unitVolume × deliveredQty
VolumeContribPct     = deliveredSkuVol / orderDeliveredVol
SkuPayoutContrib     = basePayout × volumeContribPct

Order Level
─────────────────────────────────────────────────────────
FulfillmentRatio     = totalDeliveredVol / totalOrderVol
CancellationMult     = driftKm ≤ hubThreshold ? 1 : 0
FinalOrderPayout     = basePayout × fulfillmentRatio       (delivered/partial)
                     = basePayout × cancellationMult       (cancelled)

Fleet Level
─────────────────────────────────────────────────────────
FleetFulfillmentRate = Σ deliveredVol / Σ orderedVol       (non-cancelled)
CancellationRate     = cancelledOrders / totalOrders
```

---

## 📡 Data Flow

```
Excel Workbook (.xlsx)
        │
        ▼
 companyWorkbookParserService
        │  (sheet detection, SKU enrichment)
        ▼
   workbookEngine
        │  (formula computation pipeline)
        ▼
   Zustand Store  ◄──────── Manual Entry / Settings
        │
        ├──► Executive Dashboard   (KPIs, charts)
        ├──► Order Payout Table    (per-order breakdown)
        ├──► SKU Breakdown         (line-level analytics)
        ├──► Rider Summary         (per-rider aggregates)
        └──► Cancellations         (compensation intelligence)
```

---

## 🛣️ Roadmap

- [ ] Multi-hub workbook comparison view
- [ ] PDF / CSV export for rider payout reports
- [ ] Date-range filtering across all modules
- [ ] Role-based access control (Admin / Viewer)
- [ ] Real-time sync with backend API
- [ ] Mobile-responsive layout

---

## 👤 Author

**Rishit** — [@rizzit17](https://github.com/rizzit17)

Built for **DS Group** internal logistics operations.

---

<div align="center">

*DS NexusFlow — Turning raw delivery data into operational intelligence.*

</div>
