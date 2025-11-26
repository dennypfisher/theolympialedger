#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');

// Live multi-source fetcher with reconciliation and audit trail
// Fetches from OFM, Census, LEAP, Treasury, BEA, and other official sources
// Implements weighted averaging and confidence scoring

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'sources.json'), 'utf8'));
const OUT_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Simple fetch with retry
async function fetchWithRetry(url, opts = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, { timeout: 15000, ...opts });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`Fetch ${url} attempt ${i + 1} failed:`, err.message);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`All retries exhausted for ${url}`);
}

// Attempt to fetch from a source and handle various formats
async function fetchSource(source) {
  if (!source.apiUrl) {
    console.log(`Skipping ${source.id} (no API URL)`);
    return null;
  }

  try {
    console.log(`Fetching ${source.id} from ${source.apiUrl}`);
    let data = await fetchWithRetry(source.apiUrl, { headers: { 'Accept': 'application/json' } });

    // Navigate to field if specified
    if (source.field) {
      const parts = source.field.split('.');
      for (const part of parts) {
        data = data[part];
        if (!data) throw new Error(`Field ${source.field} not found`);
      }
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      value: data,
      weight: source.weight,
      timestamp: new Date().toISOString(),
      success: true
    };
  } catch (err) {
    console.error(`Error fetching ${source.id}:`, err.message);
    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      value: null,
      weight: source.weight,
      error: err.message,
      timestamp: new Date().toISOString(),
      success: false
    };
  }
}

// Reconcile multiple source values
function reconcile(dataPoint, results) {
  const successful = results.filter(r => r.success && r.value != null);
  if (successful.length === 0) {
    return { value: null, sources: results, method: 'none', confidence: 0 };
  }

  const method = dataPoint.reconciliation?.method || 'weighted-average';

  let reconciled;
  if (method === 'weighted-average' || method === 'average') {
    const totalWeight = successful.reduce((s, r) => s + r.weight, 0);
    const avg = successful.reduce((s, r) => {
      const val = typeof r.value === 'number' ? r.value : parseFloat(r.value);
      return s + (val * r.weight);
    }, 0) / totalWeight;
    reconciled = avg;
  } else if (method === 'max-confidence') {
    // pick highest weight
    const best = successful.sort((a, b) => b.weight - a.weight)[0];
    reconciled = best.value;
  } else if (method === 'direct') {
    // take first successful value
    reconciled = successful[0].value;
  } else {
    reconciled = successful[0].value;
  }

  // Confidence: ratio of successful fetches
  const confidence = (successful.length / results.filter(r => r.value !== undefined).length) || 0;

  return { value: reconciled, sources: results, method, confidence };
}

async function run() {
  const output = {
    fetchedAt: new Date().toISOString(),
    dataPoints: {},
    auditTrail: []
  };

  // Fetch all data points
  for (const [key, dataPoint] of Object.entries(CONFIG.dataSources)) {
    console.log(`\n=== Fetching ${key} ===`);

    const results = await Promise.all(
      dataPoint.sources.map(source => fetchSource(source))
    );

    const reconciled = reconcile(dataPoint, results);

    output.dataPoints[key] = {
      description: dataPoint.description,
      unit: dataPoint.unit,
      value: reconciled.value,
      confidence: reconciled.confidence,
      method: reconciled.method,
      timestamp: new Date().toISOString(),
      sources: reconciled.sources.map(r => ({
        id: r.sourceId,
        name: r.sourceName,
        url: r.sourceUrl,
        success: r.success,
        error: r.error || null,
        value: r.value
      }))
    };

    output.auditTrail.push({
      dataPoint: key,
      timestamp: new Date().toISOString(),
      confidence: reconciled.confidence,
      method: reconciled.method,
      sourceCount: dataPoint.sources.length,
      successCount: results.filter(r => r.success).length
    });

    console.log(`✓ ${key}: ${reconciled.value} (confidence: ${(reconciled.confidence * 100).toFixed(1)}%)`);
  }

  // Write output
  const outPath = path.join(PUBLIC_DIR, 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✓ Wrote ${outPath}`);

  // Also write a timestamped snapshot for archiving
  const snapshot = path.join(OUT_DIR, `snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(snapshot, JSON.stringify(output, null, 2));
  console.log(`✓ Archived snapshot to ${snapshot}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
