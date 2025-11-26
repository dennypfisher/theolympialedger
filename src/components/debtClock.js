export function startDebtClock(DATA, opts = {}) {
  const debtEl = document.querySelector(opts.debtEl || '#debt-clock');
  const perCapEl = document.querySelector(opts.perCapEl || '#per-capita-debt');
  if (!debtEl || !perCapEl) return;

  function getCurrentDebt() {
    const now = Date.now();
    const anchorTime = new Date(DATA.debtAnchor.date).getTime();
    const elapsedSeconds = Math.max(0, (now - anchorTime) / 1000);
    return DATA.debtAnchor.amount + (elapsedSeconds * DATA.debtAnchor.rate);
  }

  // Prefer requestAnimationFrame for smoother updates but throttle to ~10fps
  let last = 0;
  function tick(ts) {
    if (!last || ts - last > 100) {
      const currentVal = getCurrentDebt();
      debtEl.innerText = currentVal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
      const perCap = currentVal / DATA.population;
      perCapEl.innerText = perCap.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
      last = ts;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
