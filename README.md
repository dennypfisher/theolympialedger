# The Olympia Ledger — Washington State Fiscal Transparency Dashboard

**No mock data.** Every number links to live official sources. Citizens click any data point to see sources, methodology, and reconciliation logic.

## Quick Start

### 1. Verify Setup
```bash
node scripts/verifyLiveDataSetup.js
```

Expected output: `✓ Checks Passed: 10/10` (all green)

### 2. Start Dev Server
```bash
npx serve -s . -l 5000
```

### 3. Open in Browser
Navigate to `http://localhost:5000`

**Click any number on the page** (debt clock, population, budget) to see:
- Where the data came from (official sources)
- When it was last updated
- Confidence score (% of sources that succeeded)
- Reconciliation method (weighted-average, max-confidence, etc.)
- Direct links to each source's website

## What This Is

The Olympia Ledger is a **fiscal transparency dashboard** for Washington State built on these principles:

1. **No Mock Data** — Every data point fetches from official sources (US Census, OFM, Treasury, LEAP, etc.)
2. **Multi-Source Reconciliation** — When multiple sources disagree, we use weighted averaging + confidence scoring
3. **Full Attribution** — Users can click any number and trace it back to its sources
4. **Automatic Updates** — GitHub Actions fetches live data daily
5. **Transparent Methodology** — Users see exactly how numbers are calculated and combined

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Official Sources (US Census, OFM, Treasury, LEAP, etc.) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │  scripts/fetchLiveSources.js │
        │  (fetches, reconciles, audit) │
        └──────────────────┬───────────┘
                           │
                           ↓
            ┌──────────────────────────┐
            │   public/data.json       │
            │ (single source of truth) │
            └──────────────┬───────────┘
                           │
                           ↓
              ┌─────────────────────────────┐
              │ Frontend (index.html)       │
              │ dataProvider.js (loads data)│
              │ Shows attribution modals    │
              └─────────────────────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │ User clicks  │
                    │ data point   │
                    └──────┬───────┘
                           │
                           ↓
                    ┌──────────────────────────┐
                    │ Modal shows all sources  │
                    │ + reconciliation logic   │
                    │ + confidence score       │
                    │ + links to originals     │
                    └──────────────────────────┘
```

## Features

### 📊 Interactive Visualizations
- **Budget Chart** — Bar, stacked, pie chart views (per-capita or total)
- **Debt Clock** — Real-time state debt ticker with live rate
- **Bill Timeline** — Legislative timeline with fiscal impacts
- **Revenue/Expenditure** — Department breakdown charts

### 🔗 Data Attribution
- Click any number → modal shows all sources
- See confidence scores (% of successful fetches)
- View reconciliation method (weighted-average, max-confidence, etc.)
- Direct links to each source's website

### 🔄 Automatic Updates
- GitHub Actions fetches live data daily (06:00 UTC)
- Reconciles multi-source values
- Commits to repo (triggers redeploy on Netlify/Vercel)
- Archives timestamped snapshots for audit trail

### 📝 Data Points Covered
- State budget (OFM, LEAP, Treasury)
- Population (US Census 2020, ACS, OFM estimates)
- State debt (WA Treasury, Moody's)
- Tax revenue (Dept of Revenue, OFM forecast)
- Bills & fiscal notes (LEAP, WA Legislature)
- Housing stock (Census ACS)
- Incarceration (DOC, FBI UCR)
- Exports/Imports (BEA, USA Trade)
- County-level population & spending allocation

## Project Structure

```
.
├── index.html                              # Main page layout
├── src/
│   ├── app.js                             # App entry (loads live data from dataProvider)
│   ├── components/
│   │   ├── debtClock.js                   # Real-time debt ticker
│   │   ├── budgetChart.js                 # Chart.js budget visualization
│   │   ├── budgetPie.js, lineChart.js     # Additional charts
│   │   └── billList.js, billTimeline.js   # Bill rendering
│   └── modules/
│       └── dataProvider.js                 # Loads live data, shows attribution
├── scripts/
│   ├── fetchLiveSources.js                 # Multi-source fetcher + reconciliation
│   ├── verifyLiveDataSetup.js             # Setup verification script
│   └── fetchData.js, normalizeData.js     # Legacy fetchers (optional)
├── config/
│   └── sources.json                        # Master registry (17 data points, 40+ APIs)
├── public/
│   └── data.json                           # Live reconciled data artifact
├── data/
│   └── snapshot-*.json                     # Timestamped backups (audit trail)
├── docs/
│   ├── architecture.md                     # System architecture
│   ├── live-data-integration.md            # Live data setup guide
│   └── ux.md                               # UX notes & roadmap
└── .github/workflows/
    └── data-sync.yml                       # Scheduled GitHub Actions workflow
```

## Getting Started (Development)

### Prerequisites
- Node.js >= 18
- Git

### Installation

```bash
git clone https://github.com/your-org/theolympialedger.git
cd theolympialedger
npm install
```

### Run Locally

```bash
# Start dev server
npx serve -s . -l 5000

# In another terminal, fetch live data
node scripts/fetchLiveSources.js

# Monitor the data sync workflow
node scripts/verifyLiveDataSetup.js
```

Visit `http://localhost:5000` and click any data point to see attribution.

### Production Setup

See **[SETUP_LIVE_DATA.md](./SETUP_LIVE_DATA.md)** for:
- GitHub Secrets configuration
- API endpoint validation
- Deploying to Netlify/Vercel
- Monitoring data sync health

## Development Roadmap

- [ ] Add more data points (employment, housing affordability, transportation, education metrics)
- [ ] Build data export (JSON, CSV with full attribution)
- [ ] Create "Data Quality Report" dashboard (source health, reconciliation confidence trends)
- [ ] Add real-time API tier for high-frequency data (stock market exposures, daily debt ticker)
- [ ] Public API endpoint so other services can consume reconciled WA fiscal data
- [ ] Mobile app (React Native)
- [ ] Historical time-series analysis and forecasting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Verify live data system: `node scripts/verifyLiveDataSetup.js`
4. Commit changes (`git commit -m 'feat: add live source for X'`)
5. Push to branch (`git push origin feature/your-feature`)
6. Open a Pull Request

## Data Sources

This project reconciles data from:
- **US Census Bureau** — Population, housing, demographics (2020 Decennial + ACS)
- **OFM** — State budget, revenue forecasts, population estimates
- **LEAP** — Fiscal notes on legislation
- **WA Treasury** — State debt, bond issuance
- **Dept of Revenue** — Tax collections and forecasts
- **DOC** — Incarceration data
- **BEA** — State exports/imports
- **WA Legislature API** — Bill status, voting records
- **County Assessors** — Property valuations, county-level spending

## License

[MIT License](./LICENSE) — Feel free to use and adapt for your state/organization.

## Questions?

See **[docs/live-data-integration.md](./docs/live-data-integration.md)** for technical deep-dives on:
- How multi-source reconciliation works
- Adding new data points
- Troubleshooting failed API connections
- Monitoring data quality and confidence scores

---

**Built for transparency.** Every number, every time.
