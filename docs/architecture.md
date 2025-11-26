**Project Architecture**

- `index.html` — Single-page layout and markup. Uses Tailwind via CDN for rapid styling and Chart.js via CDN for charts.
- `src/` — JavaScript entry points and small modular components:
  - `src/app.js` — bootstraps UI and wires components together.
  - `src/components/debtClock.js` — live deck clock (real-time calculation from anchor timestamp).
  - `src/components/budgetChart.js` — Chart.js wrapper for budget visuals.
  - `src/components/billList.js` — renders bill list and filter.
  - `src/components/calculators.js` — citizen calculators (county share, tax receipt breakdown).
- `scripts/` — backend automation scripts (data fetchers).
- `data/` — (generated) stores fetched datasets with timestamped filenames and a `latest.json` index.

Naming conventions

- Files: `kebab-case` for file names (e.g., `budget-chart.js`).
- Components: export small functions (no large singletons). Prefer `initX` and `renderX` naming.
- DOM ids: use `kebab-case` and be explicit (e.g., `chart-budget`, `debt-clock`).

Component breakdown (expandable)

- DebtClock: accepts an anchor timestamp + rate and updates the DOM with precise calculations.
- BudgetChart: Chart.js wrapper; emits events for selection; can be replaced by D3 visualizations later.
- BillTimeline (future): D3 timeline component showing bill lifecycle; connects to bill metadata from LEAP.

Data pipeline (overview)

1. Data ingestion: scheduled jobs (GitHub Actions or cloud CRON) run `scripts/fetchData.js` to fetch from:
   - WA OFM (budget and revenue streams)
   - LEAP (bill fiscal notes and timelines)
   - US Census (population + housing)
   - County assessor/treasurer endpoints
2. Storage: store raw JSON as timestamped files in `data/` and create `latest.json` that indexes which files correspond to sources.
3. Processing: a lightweight ETL (Node or serverless) normalizes schemas and creates summarized `public/` artifacts for client consumption.
4. CDN + Cache: serve processed JSON via CDN or static hosting (Netlify, Vercel, S3 + CloudFront). Use cache-control and ETag.
5. Fallbacks: when fetches fail, frontend uses the last good snapshot recorded in `data/latest.json`.

Version control for datasets

- Commit only sanitized, public-safe snapshots to the repo if policy allows (small datasets) or push to an external storage bucket and keep pointers in the repo.
- Keep `data/` in `.gitignore` if datasets are large; instead keep `data/latest.json` and pointers.

Security and secrets

- Store API keys in GitHub Secrets and inject into workflows. The fetch script should read keys from environment variables.

Scalability notes

- Move heavy processing off the runner: use serverless functions or a small EC2/VM to run ETL and produce lightweight artifacts consumed by the SPA.
- Consider a GraphQL facade when data consumers need complex queries across multiple datasets.
