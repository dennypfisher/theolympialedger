// budgetChart.js - small wrapper around Chart.js (global `Chart` from CDN)
export function initBudgetChart(DATA, opts = {}) {
  const canvasId = opts.canvasId || 'chart-budget';
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof window.Chart !== 'function') return null;

  const ctx = canvas.getContext('2d');
  const colors = ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'];

  // Build default total dataset (in billions)
  const labels = DATA.budget.map((d) => d.label);
  const totalData = DATA.budget.map((d) => d.value / 1_000_000_000);

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Budget (Billions)', data: totalData, backgroundColor: colors, borderWidth: 1, borderColor: '#022c22' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { x: { stacked: false }, y: { stacked: false } },
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          document.dispatchEvent(new CustomEvent('budget:select', { detail: { index } }));
        }
      }
    }
  };

  const chart = new Chart(ctx, config);

  function setType(type = 'bar') {
    if (type === 'pie') return; // pie is handled by a separate component

    if (type === 'stacked') {
      // Create stacked datasets for wages / capital / equipment
      const wages = DATA.budget.map((d) => d.wages / 1_000_000_000);
      const capital = DATA.budget.map((d) => d.capital / 1_000_000_000);
      const equipment = DATA.budget.map((d) => d.equipment / 1_000_000_000);

      chart.config.type = 'bar';
      chart.data.datasets = [
        { label: 'Wages (B)', data: wages, backgroundColor: '#064e3b' },
        { label: 'Capital (B)', data: capital, backgroundColor: '#10b981' },
        { label: 'Equipment (B)', data: equipment, backgroundColor: '#34d399' }
      ];
      chart.options.scales.x.stacked = true;
      chart.options.scales.y.stacked = true;
    } else {
      // default: single total bar
      chart.config.type = 'bar';
      chart.data.datasets = [{ label: 'Budget (Billions)', data: DATA.budget.map((d) => d.value / 1_000_000_000), backgroundColor: colors }];
      chart.options.scales.x.stacked = false;
      chart.options.scales.y.stacked = false;
    }

    chart.update();
  }

  return { chart, setType };
}
