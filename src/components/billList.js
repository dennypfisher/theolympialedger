export function renderBills(DATA, opts = {}) {
  const containerId = opts.containerId || 'bills-list';
  const filterId = opts.filterId || 'bill-filter';
  const countId = opts.countId || 'bill-count';

  const container = document.getElementById(containerId);
  const filter = document.getElementById(filterId);
  const count = document.getElementById(countId);
  if (!container) return;

  function draw() {
    const val = filter ? filter.value : 'All';
    const filtered = DATA.bills.filter((b) => val === 'All' || b.status === val);
    container.innerHTML = '';
    if (count) count.innerText = filtered.length;
    filtered.forEach((b) => {
      const el = document.createElement('div');
      el.className = 'ledger-card hover:shadow-md transition-shadow flex justify-between items-start';
      el.innerHTML = `
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-gray-500">${b.id}</span>
            <span class="px-2 py-0.5 bg-gray-200 text-gray-800 text-[0.6rem] uppercase tracking-wider font-bold rounded-sm">${b.status}</span>
          </div>
          <h4 class="font-bold text-lg text-gray-900">${b.title}</h4>
          <p class="text-sm text-gray-600 font-serif mt-1">${b.desc}</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500 uppercase tracking-widest">Est. Impact</div>
          <div class="font-mono font-bold ${b.impact < 0 ? 'text-red-600' : 'text-emerald-700'}">
            ${b.impact < 0 ? '-' : '+'}${Math.abs(b.impact / 1000000).toFixed(1)}M
          </div>
        </div>
      `;
      container.appendChild(el);
    });
  }

  if (filter) filter.addEventListener('change', draw);
  draw();
}
