# Setup Live Data System

## Quick Start

### 1. Create `public/` directory
```bash
mkdir -p public
```

### 2. Create initial `public/data.json` with mock structure
```bash
node scripts/fetchLiveSources.js
```

This will:
- Fetch from all sources in `config/sources.json`
- Reconcile multi-source values
- Write to `public/data.json`
- Archive timestamped snapshot to `data/`
- Log results to console

### 3. Verify file was created
```bash
ls -lh public/data.json
cat public/data.json | head -50
```

Expected output: JSON with all 17 data points, reconciled values, sources, timestamps, confidence scores, and audit trails.

### 4. Start local dev server
```bash
npm install -g serve
serve -s . -l 5000
```

Navigate to `http://localhost:5000`

### 5. Test live data loading
- Open browser dev console (`F12`)
- Should see: `✓ Live data loaded successfully`
- All data should be from `public/data.json`, not mock

### 6. Test attribution UI
- Click on any number on the page (debt clock, revenue indicator, population, budget amounts)
- A modal should appear showing:
  - The data value
  - All sources that contributed to that value
  - Reconciliation method (weighted-average, max-confidence, etc.)
  - Confidence score (% of sources that succeeded)
  - Timestamps when data was last fetched
  - Direct links to each source's website

## Production Setup

### 1. Deploy to GitHub
```bash
git add -A
git commit -m "chore: enable live multi-source data with attribution"
git push origin main
```

### 2. Set GitHub Secrets
In repo settings → Secrets and variables → Actions, add:

- `CENSUS_API_KEY`: From https://api.census.gov/data/key_signup.html
- `OFM_API_KEY`: Contact WA OFM or use public endpoint
- `LEAP_BILLS_URL`: LEAP database endpoint (contact WA Legislature)
- `BEA_API_KEY`: From https://apps.bea.gov/api/signup (Bureau of Economic Analysis)
- `MOODY_API_KEY`: Moody's research API (if available)
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions

### 3. Deploy frontend to Netlify/Vercel
Push to GitHub, and your hosting will auto-deploy.

### 4. Verify GitHub Actions workflow
- Go to repo → Actions
- Find `Data Sync` workflow
- Manually trigger: click "Run workflow"
- Check that:
  - `scripts/fetchLiveSources.js` ran successfully
  - `public/data.json` was created/updated
  - Commit `[skip ci] Update public/data.json` was made

The workflow will run on schedule (daily 06:00 UTC), and your site's data will update automatically.

## Testing Locally Without API Keys

If you don't have API keys, you can still test the system:

1. **Create mock `public/data.json`**:
   ```bash
   cat > public/data.json << 'EOF'
   {
     "lastFetched": "2024-01-15T14:30:00Z",
     "dataPoints": {
       "population_total": {
         "value": 7950000,
         "unit": "people",
         "confidence": 0.98,
         "method": "weighted-average",
         "sources": [
           {
             "id": "census_2020",
             "name": "US Census 2020",
             "url": "https://www.census.gov",
             "value": 7964000,
             "weight": 0.98,
             "success": true,
             "timestamp": "2024-01-15T14:25:00Z"
           }
         ]
       },
       "debt_total": {
         "value": 143000000000,
         "unit": "USD",
         "confidence": 0.95,
         "method": "direct",
         "sources": [
           {
             "id": "wa_treasury",
             "name": "WA State Treasurer",
             "url": "https://tre.wa.gov",
             "value": 143000000000,
             "weight": 1.0,
             "success": true,
             "timestamp": "2024-01-15T14:30:00Z"
           }
         ]
       }
     }
   }
   EOF
   ```

2. **Start server**:
   ```bash
   serve -s . -l 5000
   ```

3. **Verify in browser**:
   - Navigate to `http://localhost:5000`
   - Open DevTools console: should say `✓ Live data loaded successfully`
   - Click on any numbers to see attribution modal

## Troubleshooting

### "Failed to load live data"
- Check `public/data.json` exists
- Check file is valid JSON: `cat public/data.json | jq .`
- Check browser console for specific error
- Fallback to hardcoded FALLBACK_DATA should work

### "Confidence very low" in attribution modal
- One or more data sources may be failing
- Check `scripts/fetchLiveSources.js` logs for details
- Try running fetcher manually: `node scripts/fetchLiveSources.js`
- Check that API endpoints in `config/sources.json` are correct

### "API endpoint not found" when running fetcher
- Some APIs may have changed URLs
- Update `config/sources.json` with correct URLs
- Reference official API documentation

### "Cannot find module './modules/dataProvider.js'"
- Check file exists: `ls -l src/modules/dataProvider.js`
- Check import path is correct in `src/app.js`
- Restart dev server

## Next Steps

1. **Replace placeholder API endpoints** in `config/sources.json` with real URLs
2. **Test each API** with sample requests to ensure they work
3. **Set up GitHub Secrets** with real API credentials
4. **Deploy** to Netlify/Vercel
5. **Monitor** the data sync workflow and reconciliation confidence scores
6. **Add missing data points** (e.g., employment data, housing costs, etc.)
7. **Create public API** so other services can use your reconciled data

## Architecture Reminder

```
User clicks data point
         ↓
dataProvider.createAttributableElement() shows modal
         ↓
Modal displays:
  - Reconciled value from public/data.json
  - All sources that contributed
  - Weights and confidence scores
  - Links to original sources
  - Last fetch timestamp
         ↓
GitHub Actions runs on schedule (daily)
         ↓
scripts/fetchLiveSources.js fetches all sources
         ↓
Reconciles multi-source values (weighted-average, etc.)
         ↓
Writes public/data.json (single source of truth)
         ↓
Frontend auto-updates with live data
```

## Further Reading

- `docs/live-data-integration.md` — Complete integration guide
- `docs/architecture.md` — System architecture overview
- `config/sources.json` — Data point mappings and API endpoints
- `scripts/fetchLiveSources.js` — Live fetcher with reconciliation logic
- `src/modules/dataProvider.js` — Frontend data loading and attribution UI
