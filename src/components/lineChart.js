// Simple revenue vs expenditure timeseries (mock data)
export function initLineChart(DATA, opts = {}) {
  const id = opts.canvasId || 'chart-timeseries';
  const canvas = document.getElementById(id);
  if (!canvas || typeof window.Chart !== 'function') return null;

  // Build mock historic series (10 points) from budget totals
  const years = Array.from({ length: 10 }, (_, i) => 2016 + i);
  // Mock revenue grows slightly, expenditures follow budget sum with noise
  const baseRevenue = 40_000_000_000;
  const revenue = years.map((y, i) => Math.round(baseRevenue * Math.pow(1.03, i) / 1_000_000)); // in millions
  const expenditure = years.map((y, i) => Math.round((DATA.budget.reduce((a, b) => a + b.value, 0) * Math.pow(1.02, i)) / 1_000_000));

  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years.map(String),
      datasets: [
        { label: 'Revenue (M)', data: revenue, borderColor: '#065f46', backgroundColor: 'rgba(6,95,70,0.08)', tension: 0.2 },
        { label: 'Expenditure (M)', data: expenditure, borderColor: '#9a3412', backgroundColor: 'rgba(154,52,18,0.08)', tension: 0.2 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  return chart;
}
