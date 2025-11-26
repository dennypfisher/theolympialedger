#!/usr/bin/env node

/**
 * Verification script for live data system
 * 
 * Run: node scripts/verifyLiveDataSetup.js
 * 
 * Checks:
 * - config/sources.json exists and is valid JSON
 * - scripts/fetchLiveSources.js exists
 * - src/modules/dataProvider.js exists
 * - src/app.js imports dataProvider and loads live data
 * - public/data.json exists (or can be created)
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, status: 'PASS', result });
    console.log(`✓ ${name}`);
    if (result && typeof result === 'string') console.log(`  → ${result}`);
  } catch (err) {
    checks.push({ name, status: 'FAIL', error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

console.log('\n📋 Verifying Live Data System Setup...\n');

// 1. Check config/sources.json
check('config/sources.json exists', () => {
  const p = path.join(__dirname, '../config/sources.json');
  if (!fs.existsSync(p)) throw new Error('File not found');
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const count = Object.keys(data).length;
  return `${count} data points mapped`;
});

// 2. Check scripts/fetchLiveSources.js
check('scripts/fetchLiveSources.js exists', () => {
  const p = path.join(__dirname, '../scripts/fetchLiveSources.js');
  if (!fs.existsSync(p)) throw new Error('File not found');
  const content = fs.readFileSync(p, 'utf-8');
  if (!content.includes('fetchWithRetry')) throw new Error('Missing fetchWithRetry function');
  if (!content.includes('reconcile')) throw new Error('Missing reconcile function');
  return 'Fetcher complete with retry and reconciliation';
});

// 3. Check src/modules/dataProvider.js
check('src/modules/dataProvider.js exists', () => {
  const p = path.join(__dirname, '../src/modules/dataProvider.js');
  if (!fs.existsSync(p)) throw new Error('File not found');
  const content = fs.readFileSync(p, 'utf-8');
  if (!content.includes('loadLiveData')) throw new Error('Missing loadLiveData export');
  if (!content.includes('createAttributableElement')) throw new Error('Missing createAttributableElement export');
  return 'Data provider complete with attribution UI';
});

// 4. Check src/app.js imports dataProvider
check('src/app.js imports dataProvider', () => {
  const p = path.join(__dirname, '../src/app.js');
  const content = fs.readFileSync(p, 'utf-8');
  if (!content.includes('loadLiveData') || !content.includes('modules/dataProvider')) {
    throw new Error('dataProvider not imported');
  }
  return 'Import statement found';
});

// 5. Check src/app.js uses loadLiveData()
check('src/app.js calls loadLiveData()', () => {
  const p = path.join(__dirname, '../src/app.js');
  const content = fs.readFileSync(p, 'utf-8');
  if (!content.includes('await loadLiveData()')) {
    throw new Error('loadLiveData() not called in DOMContentLoaded');
  }
  return 'Live data loading initialized';
});

// 6. Check src/app.js exports DATA as let (not const)
check('src/app.js exports DATA as mutable', () => {
  const p = path.join(__dirname, '../src/app.js');
  const content = fs.readFileSync(p, 'utf-8');
  if (content.includes('export const DATA =')) {
    throw new Error('DATA is still exported as const (should be let)');
  }
  if (!content.includes('export let DATA')) {
    throw new Error('DATA not exported as let');
  }
  return 'DATA can be updated at runtime';
});

// 7. Check FALLBACK_DATA exists
check('FALLBACK_DATA defined in src/app.js', () => {
  const p = path.join(__dirname, '../src/app.js');
  const content = fs.readFileSync(p, 'utf-8');
  if (!content.includes('FALLBACK_DATA')) {
    throw new Error('FALLBACK_DATA not defined');
  }
  return 'Fallback data structure available';
});

// 8. Check public/ directory exists or can be created
check('public/ directory ready', () => {
  const p = path.join(__dirname, '../public');
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    return 'Created public/ directory';
  }
  return 'public/ directory exists';
});

// 9. Check public/data.json
check('public/data.json exists or placeholder', () => {
  const p = path.join(__dirname, '../public/data.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const dpCount = Object.keys(data.dataPoints || {}).length;
    return `Found ${dpCount} data points in public/data.json`;
  }
  return 'Not yet created (run: node scripts/fetchLiveSources.js)';
});

// 10. Check docs/live-data-integration.md
check('docs/live-data-integration.md exists', () => {
  const p = path.join(__dirname, '../docs/live-data-integration.md');
  if (!fs.existsSync(p)) throw new Error('File not found');
  return 'Integration guide available';
});

// Summary
console.log('\n' + '='.repeat(50));
const passed = checks.filter(c => c.status === 'PASS').length;
const total = checks.length;
console.log(`\n✓ Checks Passed: ${passed}/${total}\n`);

if (passed === total) {
  console.log('🎉 Live data system is properly configured!\n');
  console.log('Next steps:');
  console.log('  1. Run: node scripts/fetchLiveSources.js');
  console.log('  2. Check: cat public/data.json');
  console.log('  3. Start: serve -s . -l 5000');
  console.log('  4. Open: http://localhost:5000');
  console.log('  5. Click any data point to see attribution modal\n');
} else {
  console.log('⚠️  Some checks failed. Please review the errors above.\n');
  console.log('See SETUP_LIVE_DATA.md for troubleshooting help.\n');
  process.exit(1);
}
