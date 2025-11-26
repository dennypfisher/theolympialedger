// Lightweight D3 timeline showing bill lifecycle points
export function initBillTimeline(DATA, opts = {}) {
  const id = opts.containerId || 'bill-timeline';
  const el = document.getElementById(id);
  if (!el || typeof window.d3 === 'undefined') return null;

  // Normalize items to timeline entries
  const items = DATA.bills.map((b, i) => ({
    id: b.id,
    title: b.title,
    status: b.status,
    index: i,
    date: new Date(2025, i % 12, (i + 1) * 2)
  }));

  // Simple horizontal timeline
  el.innerHTML = '';
  const width = el.clientWidth || 800;
  const height = 120;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', height);

  const x = d3.scaleTime()
    .domain(d3.extent(items, d => d.date))
    .range([40, width - 40]);

  // timeline line
  svg.append('line').attr('x1', 40).attr('x2', width - 40).attr('y1', height / 2).attr('y2', height / 2).attr('stroke', '#ccc');

  const node = svg.selectAll('g.node').data(items).enter().append('g').attr('class', 'node').attr('transform', d => `translate(${x(d.date)}, ${height/2})`);

  node.append('circle').attr('r', 12).attr('fill', d => d.status.includes('Enacted') ? '#065f46' : d.status.includes('Passed') ? '#10b981' : '#f59e0b');
  node.append('text').attr('y', 28).attr('text-anchor', 'middle').attr('font-size', 11).text(d => d.id);

  node.on('click', (ev, d) => {
    // Scroll to bills list and highlight
    const list = document.getElementById('bills-list');
    if (!list) return;
    const item = Array.from(list.children).find(ch => ch.innerText.includes(d.id));
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      item.classList.add('ring', 'ring-emerald-300');
      setTimeout(() => item.classList.remove('ring', 'ring-emerald-300'), 2200);
    }
  });

  return svg.node();
}
