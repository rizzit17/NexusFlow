# 🌊 DS NexusFlow

<div align="center">
  <p><strong>Enterprise-Grade Logistics Intelligence & Payout Operations Dashboard</strong></p>
</div>

---

## 📖 Overview

**NexusFlow** is a high-performance, scalable analytics platform tailored for the DS Group. It bridges the gap between complex logistical data and actionable intelligence. By translating intricate, volumetric rider payout logic into a fast, intuitive web experience, NexusFlow empowers operations teams to manage payouts, ingest Excel reports seamlessly, and visualize operational analytics in real-time.

Built with a premium, minimalist UI, NexusFlow guarantees an executive-grade user experience that is both mathematically accurate and visually stunning.

## ✨ Key Features

- **📊 Advanced Operational Analytics**: Interactive, high-performance data visualizations powered by Recharts (e.g., SKU Breakdowns, Cancellation tracking).
- **📑 Excel Intelligence**: Seamless ingestion and parsing of complex `.xlsx` operational files using SheetJS.
- **💰 Dynamic Payout Engine**: Real-time calculation and translation of volumetric rider payout logic directly in the browser.
- **⚡ Executive-Grade UI**: A premium, minimalist interface built with modern web standards, adhering to DS Group's design aesthetics.
- **🗃️ State Mastery**: Centralized, robust state management utilizing Zustand for seamless cross-module data flow.
- **🔒 Type-Safe Architecture**: End-to-end TypeScript implementation ensuring a rigorous, scalable, and production-ready codebase.

## 🛠️ Technology Stack

- **Framework**: [Next.js (React)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Data Ingestion**: [SheetJS](https://sheetjs.com/)
- **Styling**: CSS (Custom Minimalist Theme)

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18.17 or newer) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rizzit17/NexusFlow.git
   cd NexusFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

## 📁 Project Structure

```text
nexusflow/
├── app/                  # Next.js App Router (Pages, Layouts)
│   ├── sku-breakdown/    # SKU Analytics Module
│   └── globals.css       # Core Design Tokens & Styles
├── components/           # Reusable UI & Chart Components
│   ├── ui/               # Base UI elements (StatusBadges, etc.)
│   └── charts/           # Recharts Visualizations
├── lib/                  # Core Business Logic & Math Engine
│   ├── calculations.ts   # Payout & Volumetric Algorithms
│   └── mockData.ts       # Development Data Models
└── public/               # Static Assets
```

## 🤝 Contributing

This platform is architected for DS Group. When contributing, please ensure all new features maintain the strict TypeScript typing, adhere to the established minimalist UI guidelines, and include adequate component-level documentation.

## 📄 License

All rights reserved. © 2026 DS Group.
