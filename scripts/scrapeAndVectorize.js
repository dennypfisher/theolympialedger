#!/usr/bin/env node
"use strict";

const https = require('https');
const fs = require('fs');
const path = require('path');

// Output directories
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Helper to save JSON
function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved: ${filePath}`);
}

// Simple HTTPS GET request
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

// Scrape and vectorize data
async function scrapeAndVectorize() {
  const metadata = {
    fetchedAt: new Date().toISOString(),
    dataPoints: {},
  };

  // Example: Scrape budget data
  try {
    console.log('Fetching budget data...');
    const budgetUrl = 'https://fiscal.wa.gov/BudgetBasics/BudgetOverview.aspx';
    const html = await fetch(budgetUrl);

    // Extract relevant data (basic example: raw HTML)
    metadata.dataPoints.budget_total = {
      description: 'Total state biennial budget (scraped)',
      value: html.slice(0, 500), // Save first 500 characters as a placeholder
      source: budgetUrl,
    };
  } catch (err) {
    console.error('Error fetching budget data:', err.message);
  }

  // Example: Scrape population data
  try {
    console.log('Fetching population data...');
    const populationUrl = 'https://www.census.gov/quickfacts/WA';
    const html = await fetch(populationUrl);

    // Extract relevant data (basic example: raw HTML)
    metadata.dataPoints.population_total = {
      description: 'Total Washington state population (scraped)',
      value: html.slice(0, 500), // Save first 500 characters as a placeholder
      source: populationUrl,
    };
  } catch (err) {
    console.error('Error fetching population data:', err.message);
  }

  // Save metadata
  const outputPath = path.join(PUBLIC_DIR, 'data.json');
  saveJSON(outputPath, metadata);
}

scrapeAndVectorize().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});