#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');

// Normalizer: reads `data/latest.json` (produced by fetchData.js) and writes a single
// `public/data.json` artifact consumed by the frontend. Intended to be fast and idempotent.

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_DIR = path.join(__dirname, '..', 'public');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function readLatestIndex() {
  const idx = path.join(DATA_DIR, 'latest.json');
  if (!fs.existsSync(idx)) return null;
  try { return JSON.parse(fs.readFileSync(idx, 'utf8')); } catch (e) { return null; }
}

function readFileMaybe(name) {
  const f = path.join(DATA_DIR, name);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error('bad json', f); return null; }
}

function findLatest(prefix) {
  const list = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix + '-')).sort();
  return list.length ? list[list.length - 1] : null;
}

async function run() {
  const snapshot = readLatestIndex();
  const output = { generatedAt: new Date().toISOString(), population: null, budget: [], bills: [], counties: {} };

  // Try to source budget from snapshot index or fallback
  let budgetFile = snapshot?.sources?.ofm_budget?.file || findLatest('ofm_budget');
  if (budgetFile) {
    const j = readFileMaybe(budgetFile);
    if (j && Array.isArray(j.budget)) {
      output.budget = j.budget.map((b) => ({ label: b.program || b.label, value: b.amount || b.value || 0, wages: b.wages || 0, capital: b.capital || 0, equipment: b.equipment || 0 }));
    }
  }

  // LEAP bills
  let billsFile = snapshot?.sources?.leap_bills?.file || findLatest('leap_bills');
  if (billsFile) {
    const j = readFileMaybe(billsFile);
    if (j && Array.isArray(j.bills)) output.bills = j.bills;
  }

  // Census
  let censusFile = snapshot?.sources?.census?.file || findLatest('census');
  if (censusFile) {
    const j = readFileMaybe(censusFile);
    if (j && j.population_total) output.population = j.population_total;
  }

  // Counties (best-effort)
  let countiesFile = snapshot?.sources?.counties || findLatest('counties');
  if (countiesFile) {
    const j = readFileMaybe(countiesFile);
    if (j && typeof j === 'object') output.counties = j.counties || j;
  }

  // Fallback: if budget empty, try to read any budget-* file
  if (output.budget.length === 0) {
    const any = findLatest('ofm_budget') || findLatest('budget');
    if (any) {
      const j = readFileMaybe(any);
      if (j && Array.isArray(j.budget)) output.budget = j.budget;
    }
  }

  // Final output
  const outPath = path.join(OUT_DIR, 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('Wrote', outPath);
}

run().catch((err) => { console.error(err); process.exit(1); });
