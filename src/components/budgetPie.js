export function initBudgetPie(DATA, opts = {}) {
  const id = opts.canvasId || 'chart-budget-pie';
  const canvas = document.getElementById(id);
  if (!canvas || typeof window.Chart !== 'function') return null;

  const ctx = canvas.getContext('2d');
  const labels = DATA.budget.map((d) => d.label);
  const values = DATA.budget.map((d) => d.value);
  const colors = ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'];

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } },
      onClick: (evt, elems) => {
        if (elems.length) {
          const index = elems[0].index;
          document.dispatchEvent(new CustomEvent('budget:select', { detail: { index } }));
        }
      }
    }
  });

  // helper to toggle visibility
  return {
    chart,
    show() { canvas.classList.remove('hidden'); chart.resize(); },
    hide() { canvas.classList.add('hidden'); }
  };
}
