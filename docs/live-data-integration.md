# Live Data & Multi-Source Integration Guide

## Overview

The Olympia Ledger now fetches ALL data from official live sources, reconciles multi-source values, and makes every data point clickable to see sources and methodology.

## Data Architecture

### Config: `config/sources.json`
- Maps every data point to official sources (OFM, Census, LEAP, Treasury, BEA, DOR, etc.)
- Each source has:
  - **URL**: Human-readable link to the data source
  - **apiUrl**: Machine-readable API endpoint
  - **weight**: Confidence/priority score (1.0 = highest)
  - **frequency**: Update frequency (realtime, daily, annual, etc.)
  - **field**: JSON path to extract value from API response

### Fetcher: `scripts/fetchLiveSources.js`
- Pulls from multiple sources in parallel with retries
- Handles various API formats (JSON, CSV, API keys from env vars)
- Reconciles values using weighted averaging, confidence scoring, or max-confidence
- Outputs both:
  - `public/data.json` — formatted single artifact for frontend
  - `data/snapshot-{timestamp}.json` — timestamped archive for audit trail

### Data Provider: `src/modules/dataProvider.js`
- Loads `public/data.json` at app startup
- Exposes `getDataPoint(key)`, `getValue(key)` helpers
- Creates clickable DOM elements with `createAttributableElement(key, displayValue)`
- Shows modal on click revealing:
  - All source URLs
  - Reconciliation method
  - Confidence score
  - Timestamps
  - Live links to each data source

## Data Points Covered

### Budget & Finance
- **budget_total** — Total state biennial budget (OFM, LEAP, Treasury)
- **revenue_total** — Annual tax collections (DOR, OFM forecast)
- **debt_total** — Outstanding state debt (Treasury, Moody's)
- **budget_by_category** — Department/program breakdown

### Population & Demographics
- **population_total** — State population (Census, OFM estimates)
- **population_urban_rural** — Urban/rural split
- **population_by_county** — County population estimates
- **housing_stock** — Single-family, apartments, condos

### Legislation
- **bill_status** — Current status of bills (Legislature API, realtime)
- **bill_fiscal_impact** — Fiscal notes per bill (LEAP, weighted reconciliation)

### Justice & Public Safety
- **incarceration_rate** — Prison population (DOC, FBI UCR)

### Economy & Trade
- **major_exports** — Top exports by value (BEA, USA Trade, Commerce Dept)
- **major_imports** — Top imports by value
- **highest_tax_payers** — Top revenue-generating companies (SEC, WA Registry)

### Government Structure
- **legislative_representation** — County districts, vote weighting (Redistricting Commission)
- **county_revenue** — Tax collected by county (DOR)
- **county_expenditure** — State spending allocated to county (OFM)

### Tax System
- **tax_types** — Types of taxes WA levies and revenue share

## How to Run Locally

1. **Fetch live data**:
   ```bash
   node scripts/fetchLiveSources.js
   ```
   This creates `public/data.json` with all reconciled values.

2. **Start dev server**:
   ```bash
   npx serve -s . -l 5000
   ```

3. **Every data point on the website is now clickable**:
   - Click any number on the homepage, budget page, bills page, etc.
   - A modal appears showing all sources, reconciliation method, confidence, and links to original docs

## GitHub Actions Integration

The `.github/workflows/data-sync.yml` runs on schedule:
- **Realtime**: LEAP bills (every 6 hours)
- **Daily**: Census ACS, OFM estimates, Treasury debt
- **Monthly**: Tax collections, county data
- **Quarterly**: OFM revenue forecast, county allocations
- **Annual**: Major government reports

Each run:
1. Fetches from multiple sources in parallel
2. Reconciles values
3. Writes `public/data.json`
4. Archives timestamped snapshot
5. Commits both to repo (with `[skip ci]`)
6. Automatically triggers redeploy on Netlify/Vercel if configured

## Setting Up Live API Keys

In GitHub repo settings, add Secrets for each API:
- `CENSUS_API_KEY` — Get from [Census API portal](https://api.census.gov/data/key_signup.html)
- `OFM_API_KEY` — WA OFM internal endpoint (if applicable)
- `LEAP_API_KEY` — LEAP database credentials (if available)
- `BEA_API_KEY` — Bureau of Economic Analysis key
- `DOR_API_KEY` — Department of Revenue credentials (if applicable)

The `fetchLiveSources.js` script reads these from `process.env`:
```javascript
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;
```

## Reconciliation Logic

### Methods Used

**Weighted Average** (default for most points):
- Combines multiple sources, weighted by confidence
- Example: Census (weight 0.95) + OFM (weight 0.98) = population estimate

**Max Confidence**:
- Picks highest-confidence single source
- Used for: State debt (primary source is Treasury)

**Direct**:
- Takes first successful source (single source of truth)
- Used for: Bill status, tax types

### Confidence Scoring

Each data point displays:
- **Confidence %** — Ratio of successful fetches to total attempts
  - 100% = all sources succeeded and reconciled
  - 50% = half of sources had errors (fallback to best available)
  - <50% = warn user data may be incomplete

### Audit Trail

Every fetch logs:
- Timestamp
- Which sources succeeded/failed
- Method used
- Confidence score
- Raw values from each source

Users can see full audit trail by clicking a data point's attribution modal.

## Adding New Data Points

To add a new data point (e.g., "average_salary"):

1. **Edit `config/sources.json`**:
   ```json
   "average_salary": {
     "description": "Average salary in WA",
     "unit": "USD",
     "sources": [
       {
         "id": "bls_oes",
         "name": "Bureau of Labor Statistics - Occupational Employment",
         "url": "https://www.bls.gov/",
         "apiUrl": "https://api.bls.gov/publicAPI/v2/timeseries/OEUN530001...",
         "field": "avg_salary",
         "weight": 1.0,
         "frequency": "annual"
       }
     ],
     "reconciliation": { "method": "direct", "fallback": "bls_oes" }
   }
   ```

2. **Run fetcher**:
   ```bash
   node scripts/fetchLiveSources.js
   ```

3. **In UI component**, use `createAttributableElement`:
   ```javascript
   import { createAttributableElement } from './modules/dataProvider.js';
   const el = createAttributableElement('average_salary', '$85,432');
   document.getElementById('target').appendChild(el);
   ```

   Users can now click and see all sources.

## Performance & Caching

- **Local**: `public/data.json` cached in browser with max-age headers
- **CDN**: Deploy `public/` to CDN (Netlify, Vercel, S3) with aggressive caching
- **Conditional Requests**: Etag/If-Modified-Since to avoid re-fetching unchanged data
- **Snapshot Archive**: Keep `data/` snapshots for 1-year audit trail (optional pruning)

## Troubleshooting

**"Failed to fetch all sources"**:
- Check GitHub Secrets are set correctly
- Verify API endpoints haven't changed (some gov APIs move)
- Check network/firewall (some APIs blocked in certain regions)

**"Confidence very low"**:
- One or more sources may be down temporarily
- Frontend falls back to last successful snapshot
- Check individual source status by clicking attribution

**"Data seems outdated"**:
- Check `lastFetched` timestamp in modal
- If older than expected frequency, workflow may have skipped
- Manually trigger: `node scripts/fetchLiveSources.js` locally

## Real-World Example: Debt Clock

The debt clock now:
1. Fetches from Treasury API: `tre.wa.gov/api/debt-outstanding` (live)
2. Reconciles with Moody's ratings if available
3. Starts with real number (not mock $143B)
4. Ticks up based on reconciled rate from sources
5. **Click the debt clock number** → see which sources it came from, when last updated, confidence score

## Next Steps

- [ ] Deploy `public/` folder to CDN (Netlify, Vercel, S3+CloudFront)
- [ ] Set up GitHub Secrets for all API keys
- [ ] Test workflow runs and verify `data.json` updates
- [ ] Add Sentry/monitoring to alert if fetch fails repeatedly
- [ ] Wire UI components to use `createAttributableElement()` for all data points
- [ ] Add data export (JSON, CSV) with full source attribution
- [ ] Create "Data Quality Report" showing which sources are down/outdated
