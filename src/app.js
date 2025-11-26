import { startDebtClock } from './components/debtClock.js';
import { initBudgetChart } from './components/budgetChart.js';
import { initBudgetPie } from './components/budgetPie.js';
import { initLineChart } from './components/lineChart.js';
import { initBillTimeline } from './components/billTimeline.js';
import { renderBills } from './components/billList.js';
import { initCalculators, calcCounty, calcTax } from './components/calculators.js';

// --- LIVE DATA (loaded from public/data.json via scraping) ---
export let DATA = null;

// --- FALLBACK DATA (used if live data fails to load) ---
const FALLBACK_DATA = {
  budget_total: {
    description: 'Fallback budget data',
    value: 'Data unavailable',
    source: 'N/A'
  },
  population_total: {
    description: 'Fallback population data',
    value: 'Data unavailable',
    source: 'N/A'
  }
};

// Fetch live data from public/data.json
async function loadLiveData() {
  try {
    const response = await fetch('/public/data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('⚠ Failed to load live data, using fallback:', err);
    return FALLBACK_DATA;
  }
}

// Small, focused helpers for DOM navigation
function bindNav() {
  const btns = document.querySelectorAll('.nav-btn');
  const mobileToggle = document.getElementById('mobile-toggle');

  btns.forEach((btn) => btn.addEventListener('click', (e) => nav(e.target.dataset.target)));

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const navEl = document.querySelector('nav');
      navEl.classList.toggle('hidden');
    });
  }
}

export function nav(targetId) {
  document.querySelectorAll('.page').forEach((p) => p.classList.add('hidden'));
  const el = document.getElementById(`page-${targetId}`);
  if (el) el.classList.remove('hidden');
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.target === targetId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// wire up search box
function bindSearch() {
  const input = document.getElementById('global-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim();
    const res = document.getElementById('search-results');
    if (!q || q.length < 2) { res.classList.add('hidden'); return; }
    const hits = DATA.bills.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()) || b.id.toLowerCase().includes(q.toLowerCase()));
    res.innerHTML = '';
    res.classList.remove('hidden');
    if (hits.length === 0) {
      res.innerHTML = '<div class="text-xs text-gray-500 italic p-2">No records found.</div>';
      return;
    }
    hits.forEach((b) => {
      const d = document.createElement('div');
      d.className = 'p-2 bg-white border border-gray-300 text-sm hover:bg-gray-50 cursor-pointer';
      d.innerHTML = `<strong>${b.id}</strong>: ${b.title}`;
      d.onclick = () => { nav('bills'); input.value = ''; res.classList.add('hidden'); };
      res.appendChild(d);
    });
  });
}

// Budget detail updater listens for custom event 'budget:select'
function bindBudgetDetail() {
  document.addEventListener('budget:select', (ev) => {
    const index = ev.detail?.index;
    if (index == null) return;
    const item = DATA.budget[index];
    const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    document.getElementById('budget-detail-name').innerText = item.label;
    document.getElementById('budget-detail-amount').innerText = fmt(item.value);
    document.getElementById('budget-detail-wages').innerText = fmt(item.wages);
    document.getElementById('budget-detail-capital').innerText = fmt(item.capital);
    document.getElementById('budget-detail-equip').innerText = fmt(item.equipment);
  });
}

// Kickoff
document.addEventListener('DOMContentLoaded', async () => {
  // Load live data
  DATA = await loadLiveData();
  console.log('✓ Data loaded:', DATA);

  // Verify DATA is available before proceeding
  if (!DATA) {
    console.error('✗ No data available, cannot initialize app');
    return;
  }

  bindNav();
  bindSearch();
  bindBudgetDetail();

  // Start live debt clock
  startDebtClock(DATA, { debtEl: '#debt-clock', perCapEl: '#per-capita-debt' });

  // Initialize charts (Chart.js loaded via CDN in index.html)
  const barChart = initBudgetChart(DATA, { canvasId: 'chart-budget' });
  const pie = initBudgetPie(DATA, { canvasId: 'chart-budget-pie' });
  const ts = initLineChart(DATA, { canvasId: 'chart-timeseries' });

  // Chart controls: Bar / Stacked / Pie
  const btnBar = document.getElementById('chart-type-bar');
  const btnStacked = document.getElementById('chart-type-stacked');
  const btnPie = document.getElementById('chart-type-pie');

  let currentChartMode = 'bar'; // 'bar' | 'stacked' | 'pie'
  let currentView = 'total'; // 'total' | 'percapita'

  function setActiveBtn(active) {
    [btnBar, btnStacked, btnPie].forEach((b) => b && b.classList.remove('bg-gray-800', 'text-white'));
    if (active === 'bar') btnBar && btnBar.classList.add('bg-gray-800', 'text-white');
    if (active === 'stacked') btnStacked && btnStacked.classList.add('bg-gray-800', 'text-white');
    if (active === 'pie') btnPie && btnPie.classList.add('bg-gray-800', 'text-white');
  }

  function updateChartData() {
    const chartObj = barChart; // may be null
    if (!chartObj || !chartObj.chart) return;
    const chart = chartObj.chart;

    if (currentChartMode === 'pie') {
      // pie handled separately
      pie && pie.show && pie.show();
      chart.canvas.classList.add('hidden');
      return;
    }

    // show bar/chart canvas
    pie && pie.hide && pie.hide();
    chart.canvas.classList.remove('hidden');

    if (currentChartMode === 'stacked') {
      const factor = currentView === 'total' ? 1 / 1_000_000_000 : 1 / DATA.population;
      const wages = DATA.budget.map((d) => d.wages * factor);
      const capital = DATA.budget.map((d) => d.capital * factor);
      const equipment = DATA.budget.map((d) => d.equipment * factor);
      chart.config.type = 'bar';
      chart.data.datasets = [
        { label: currentView === 'total' ? 'Wages (B)' : 'Wages per citizen', data: wages, backgroundColor: '#064e3b' },
        { label: currentView === 'total' ? 'Capital (B)' : 'Capital per citizen', data: capital, backgroundColor: '#10b981' },
        { label: currentView === 'total' ? 'Equipment (B)' : 'Equipment per citizen', data: equipment, backgroundColor: '#34d399' }
      ];
      chart.options.scales.x.stacked = true;
      chart.options.scales.y.stacked = true;
      chart.update();
      return;
    }

    // default bar (totals or per-capita)
    const factor = currentView === 'total' ? 1 / 1_000_000_000 : 1 / DATA.population;
    chart.config.type = 'bar';
    chart.data.datasets = [{ label: currentView === 'total' ? 'Budget (B)' : 'Dollars per citizen', data: DATA.budget.map((d) => d.value * factor), backgroundColor: DATA.budget.map((_, i) => ['#064e3b','#065f46','#047857','#059669','#10b981','#34d399','#6ee7b7'][i % 7]) }];
    chart.options.scales.x.stacked = false;
    chart.options.scales.y.stacked = false;
    chart.update();
  }

  if (btnBar) btnBar.addEventListener('click', () => { currentChartMode = 'bar'; setActiveBtn('bar'); updateChartData(); });
  if (btnStacked) btnStacked.addEventListener('click', () => { currentChartMode = 'stacked'; setActiveBtn('stacked'); updateChartData(); });
  if (btnPie) btnPie.addEventListener('click', () => { currentChartMode = 'pie'; setActiveBtn('pie'); updateChartData(); });

  // initialize default active
  setActiveBtn('bar');

  // Expose some helpers used by inline handlers in `index.html`
  window.APP = window.APP || {};
  window.APP.toggleBudgetView = (mode) => {
    currentView = mode === 'percapita' ? 'percapita' : 'total';
    updateChartData();
  };
  window.APP.renderBills = () => renderBills(DATA, { containerId: 'bills-list', filterId: 'bill-filter', countId: 'bill-count' });

  // Small timeline for bills
  initBillTimeline(DATA, { containerId: 'bill-timeline' });

  // Render bills list
  renderBills(DATA, { containerId: 'bills-list', filterId: 'bill-filter', countId: 'bill-count' });

  // Wire calculators
  initCalculators(DATA);

  // expose calc helpers to global APP for existing inline onclick handlers
  window.APP = window.APP || {};
  window.APP.calcCounty = () => calcCounty(DATA);
  window.APP.calcTax = () => calcTax(DATA);
});

// Export nav into global APP for backward-compatible inline calls used in markup
window.APP = window.APP || {};
window.APP.nav = nav;
