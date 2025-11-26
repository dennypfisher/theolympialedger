import { startDebtClock } from './components/debtClock.js';
import { initBudgetChart } from './components/budgetChart.js';
import { initBudgetPie } from './components/budgetPie.js';
import { initLineChart } from './components/lineChart.js';
import { initBillTimeline } from './components/billTimeline.js';
import { renderBills } from './components/billList.js';
import { initCalculators, calcCounty, calcTax } from './components/calculators.js';
import { loadLiveData, getValue } from './modules/dataProvider.js';

// --- LIVE DATA (loaded from public/data.json via multi-source fetcher) ---
// Will be populated by DOMContentLoaded after calling loadLiveData()
export let DATA = null;

// --- FALLBACK DATA (used if live data fails to load) ---
const FALLBACK_DATA = {
  population: 7950000,
  debtAnchor: { date: '2024-01-01T00:00:00', amount: 143000000000, rate: 221.96 },
  budget: [
    { label: 'Education', value: 42000000000, wages: 22000000000, capital: 8000000000, equipment: 2000000000 },
    { label: 'Human Services', value: 31000000000, wages: 15000000000, capital: 3000000000, equipment: 1500000000 },
    { label: 'Transportation', value: 17000000000, wages: 3000000000, capital: 9000000000, equipment: 1000000000 },
    { label: 'Public Safety', value: 9000000000, wages: 6000000000, capital: 1000000000, equipment: 500000000 },
    { label: 'Gov Ops', value: 6500000000, wages: 3000000000, capital: 500000000, equipment: 200000000 },
    { label: 'Environment', value: 3000000000, wages: 1000000000, capital: 800000000, equipment: 100000000 },
    { label: 'Other', value: 5000000000, wages: 1800000000, capital: 800000000, equipment: 200000000 }
  ],
  bills: [
    { id: 'HB-1042', title: 'Housing Density Bonus', status: 'Enacted', impact: 12000000, desc: 'Increases density in urban zones.' },
    { id: 'SB-9000', title: 'Ferry Infrastructure Bond', status: 'Introduced', impact: -200000000, desc: 'Authorizes bonds for fleet repair.' },
    { id: 'HB-1110', title: 'Missing Middle Housing', status: 'Passed Not Signed', impact: 5000000, desc: 'Legalizes duplexes statewide.' },
    { id: 'SB-5599', title: 'Youth Services Funding', status: 'Enacted', impact: -45000000, desc: 'Expands shelter access.' },
    { id: 'HB-1240', title: 'Public Safety Regulation', status: 'Enacted', impact: -2000000, desc: 'Firearm restrictions.' }
  ],
  counties: { King: 2300000, Pierce: 950000, Snohomish: 850000, Spokane: 550000, Clark: 520000, Thurston: 300000, Yakima: 260000 }
};

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
  // Load live data from public/data.json (multi-source reconciled)
  // Falls back to FALLBACK_DATA if fetch fails
  try {
    DATA = await loadLiveData();
    console.log('✓ Live data loaded successfully', DATA);
  } catch (err) {
    console.warn('⚠ Failed to load live data, using fallback:', err);
    DATA = FALLBACK_DATA;
  }

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
