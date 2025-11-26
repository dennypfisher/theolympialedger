export function initCalculators(DATA) {
  const countyBtn = document.querySelector('button[onclick="APP.calcCounty()"]') || document.querySelector('#county-select + button');
  const taxBtn = document.querySelector('button[onclick="APP.calcTax()"]') || document.querySelector('#purchase-amount + button');

  // Wire up based on element ids present in markup
  const countySelect = document.getElementById('county-select');
  if (countySelect) {
    const btn = document.querySelector('button[onclick="APP.calcCounty()"]');
    if (btn) btn.addEventListener('click', () => calcCounty(DATA));
  }

  const purchaseInput = document.getElementById('purchase-amount');
  if (purchaseInput) {
    const btn = document.querySelector('button[onclick="APP.calcTax()"]');
    if (btn) btn.addEventListener('click', () => calcTax(DATA));
  }
}

export function calcCounty(DATA) {
  const name = document.getElementById('county-select').value;
  if (!name) return;
  const pop = DATA.counties[name];
  const share = pop / DATA.population;
  const nowDebt = getCurrentDebt(DATA);
  const debtShare = nowDebt * share;
  const perCap = nowDebt / DATA.population;
  document.getElementById('county-share-val').innerText = (debtShare / 1_000_000_000).toFixed(2) + ' Billion';
  document.getElementById('county-percap-val').innerText = perCap.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  document.getElementById('county-result').classList.remove('hidden');
}

export function calcTax(DATA) {
  const val = parseFloat(document.getElementById('purchase-amount').value);
  if (!val) return;
  const tax = val * 0.065;
  const totalBudget = DATA.budget.reduce((a, b) => a + b.value, 0);
  const rEdu = DATA.budget.find((d) => d.label === 'Education').value / totalBudget;
  const rHHS = DATA.budget.find((d) => d.label === 'Human Services').value / totalBudget;
  const rSafe = DATA.budget.find((d) => d.label === 'Public Safety').value / totalBudget;
  document.getElementById('rec-total').innerText = val.toFixed(2);
  document.getElementById('rec-tax').innerText = tax.toFixed(2);
  document.getElementById('rec-edu').innerText = (tax * rEdu).toFixed(2);
  document.getElementById('rec-hhs').innerText = (tax * rHHS).toFixed(2);
  document.getElementById('rec-safe').innerText = (tax * rSafe).toFixed(2);
  document.getElementById('rec-other').innerText = (tax * (1 - rEdu - rHHS - rSafe)).toFixed(2);
  document.getElementById('receipt-result').classList.remove('hidden');
}

function getCurrentDebt(DATA) {
  const now = Date.now();
  const anchorTime = new Date(DATA.debtAnchor.date).getTime();
  const elapsedSeconds = Math.max(0, (now - anchorTime) / 1000);
  return DATA.debtAnchor.amount + elapsedSeconds * DATA.debtAnchor.rate;
}
