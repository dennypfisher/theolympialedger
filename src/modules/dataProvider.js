// Data provider with live source loading and attribution
// Every data point on the site now links back to its sources

let LIVE_DATA = null;
let LIVE_METADATA = null;

export async function loadLiveData() {
  try {
    const res = await fetch('/public/data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    LIVE_DATA = await res.json();
    LIVE_METADATA = LIVE_DATA;
    return LIVE_DATA;
  } catch (err) {
    console.warn('Failed to load live data:', err.message);
    return null;
  }
}

export function getDataPoint(key) {
  if (!LIVE_DATA || !LIVE_DATA.dataPoints) return null;
  return LIVE_DATA.dataPoints[key];
}

export function getValue(key) {
  const dp = getDataPoint(key);
  return dp ? dp.value : null;
}

// Create an attributable display value with click handler
export function createAttributableElement(dataPointKey, displayValue, opts = {}) {
  const dp = getDataPoint(dataPointKey);
  if (!dp) return createSimpleSpan(displayValue);

  const span = document.createElement('span');
  span.className = opts.className || 'data-point';
  span.setAttribute('data-point', dataPointKey);
  span.setAttribute('role', 'button');
  span.setAttribute('tabindex', '0');
  span.setAttribute('title', `Click to see sources for ${dataPointKey}`);
  span.innerText = displayValue;

  span.style.cursor = 'pointer';
  span.style.borderBottom = '2px dashed #10b981';
  span.style.textDecoration = 'underline';

  span.addEventListener('click', () => showAttribution(dataPointKey, dp));
  span.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') showAttribution(dataPointKey, dp);
  });

  return span;
}

function createSimpleSpan(text) {
  const span = document.createElement('span');
  span.innerText = text;
  return span;
}

// Show source attribution modal
function showAttribution(dataPointKey, dataPoint) {
  // Check if modal already exists and close it
  const existing = document.getElementById('attribution-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'attribution-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-11/12 max-h-96 overflow-y-auto">
      <div class="sticky top-0 bg-gray-900 text-white p-4 flex justify-between items-center">
        <h2 class="text-lg font-bold">${dataPointKey}</h2>
        <button onclick="document.getElementById('attribution-modal')?.remove()" class="text-2xl">&times;</button>
      </div>
      
      <div class="p-4 space-y-4">
        <div>
          <div class="text-xs text-gray-500 uppercase font-bold">Current Value</div>
          <div class="text-2xl font-mono font-bold text-gray-900">${formatValue(dataPoint.value, dataPoint.unit)}</div>
          <div class="text-xs text-gray-500 mt-1">Updated: ${new Date(dataPoint.timestamp).toLocaleString()}</div>
        </div>

        <div>
          <div class="text-xs text-gray-500 uppercase font-bold mb-2">Reconciliation</div>
          <div class="space-y-1 text-sm">
            <div><span class="font-bold">Method:</span> ${dataPoint.method}</div>
            <div><span class="font-bold">Confidence:</span> ${(dataPoint.confidence * 100).toFixed(1)}%</div>
            <div><span class="font-bold">Description:</span> ${dataPoint.description}</div>
          </div>
        </div>

        <div>
          <div class="text-xs text-gray-500 uppercase font-bold mb-2">Data Sources</div>
          <div class="space-y-3">
            ${dataPoint.sources.map(source => `
              <div class="border border-gray-200 p-3 rounded-md bg-gray-50">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-bold text-sm text-gray-900">${source.name}</div>
                    <div class="text-xs text-gray-600 mt-1">${source.id}</div>
                    ${source.success ? `<div class="text-xs text-green-700 font-bold mt-1">✓ Value: ${formatValue(source.value, dataPoint.unit)}</div>` : `<div class="text-xs text-red-700 font-bold mt-1">✗ Error: ${source.error || 'unknown'}</div>`}
                  </div>
                  <a href="${source.url}" target="_blank" rel="noopener" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">View Source →</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function formatValue(val, unit) {
  if (!val) return 'N/A';
  if (unit === 'USD') {
    return (Math.abs(val) >= 1e9)
      ? `$${(val / 1e9).toFixed(2)}B`
      : (Math.abs(val) >= 1e6)
        ? `$${(val / 1e6).toFixed(2)}M`
        : `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  if (unit === 'persons' || unit === 'count') {
    return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (unit === 'percent') {
    return `${(val * 100).toFixed(2)}%`;
  }
  return String(val);
}

export function formatCurrency(val) {
  if (!val) return '$0';
  if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatNumber(val) {
  if (!val) return '0';
  return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatPercent(val) {
  if (!val) return '0%';
  return `${(val * 100).toFixed(2)}%`;
}
