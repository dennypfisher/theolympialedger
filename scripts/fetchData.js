#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');

// Simple data fetcher with caching + versioned backups.
// This script is intentionally generic: add real endpoints and API keys via ENV.

const OUT_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const endpoints = {
  // Replace these placeholders with real API endpoints and add any needed headers/auth
  ofm_budget: process.env.OFM_BUDGET_URL || 'https://api.mock/wa/ofm/budget',
  leap_bills: process.env.LEAP_BILLS_URL || 'https://api.mock/wa/leap/bills',
  census: process.env.CENSUS_API_URL || 'https://api.mock/census/wa',
  legislature: process.env.LEGISLATURE_API_URL || 'https://api.mock/leg/wa'
};

async function fetchJson(url, opts = {}) {
  // Node 18+ provides global fetch
  let attempts = 0;
  while (attempts < 3) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      attempts += 1;
      console.error(`fetch ${url} failed (${attempts}):`, err.message);
      await new Promise((r) => setTimeout(r, 1000 * attempts));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function run() {
  const snapshot = { fetchedAt: new Date().toISOString(), sources: {} };

  for (const [key, url] of Object.entries(endpoints)) {
    try {
      console.log('Fetching', key, url);
      const json = await fetchJson(url, { headers: { 'Accept': 'application/json' } });
      const fileName = `${key}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const fullPath = path.join(OUT_DIR, fileName);
      fs.writeFileSync(fullPath, JSON.stringify(json, null, 2));
      snapshot.sources[key] = { file: fileName, ok: true };
    } catch (err) {
      console.error(`Error fetching ${key}:`, err.message);
      // fallback: reuse last successful file for this key
      const last = findLatestFile(key);
      if (last) {
        console.log(`Using cached ${last}`);
        snapshot.sources[key] = { file: last, ok: false, error: err.message };
      } else {
        snapshot.sources[key] = { file: null, ok: false, error: err.message };
      }
    }
  }

  // write latest index
  const latestPath = path.join(OUT_DIR, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));
  console.log('Snapshot written to', latestPath);
}

function findLatestFile(prefix) {
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.startsWith(prefix + '-')).sort();
  return files.length ? files[files.length - 1] : null;
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
