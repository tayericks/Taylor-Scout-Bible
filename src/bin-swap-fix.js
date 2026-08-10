// Bible batch fix: make Bins & Dumpsters swap/service rows add/remove reliably.
// New rows use the location's first Prep date instead of old demo dates.
(() => {
  const firstPrep = () => window.__TS_LOCATION_FIRST_PREP__ || '';

  function rowMarkup() {
    const date = firstPrep();
    const value = date ? `${date}T06:00` : '';
    return `<div class="swap-row"><select><option>Swap</option><option>Extra Service</option></select><input type="datetime-local" value="${value}"><input placeholder="Notes"><button class="tiny remove-bin-swap" type="button" aria-label="Remove swap or service">×</button></div>`;
  }

  document.addEventListener('click', event => {
    const add = event.target.closest?.('.add-bin-swap');
    if (add) {
      event.preventDefault();
      event.stopPropagation();
      const list = add.closest('.swap-list');
      if (!list) return;
      add.insertAdjacentHTML('beforebegin', rowMarkup());
      const row = add.previousElementSibling;
      const dateInput = row?.querySelector('input[type="datetime-local"]');
      if (dateInput) {
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    const remove = event.target.closest?.('.remove-bin-swap');
    if (remove) {
      event.preventDefault();
      event.stopPropagation();
      remove.closest('.swap-row')?.remove();
      document.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, true);

  // Give existing legacy/demo swap rows the current location's Prep date.
  function normalizeExisting(root = document) {
    const prep = firstPrep();
    if (!prep) return;
    root.querySelectorAll?.('.bin-group .swap-row input[type="datetime-local"]').forEach(input => {
      const date = String(input.value || '').slice(0, 10);
      if (!date || ['2026-07-30','2026-07-31','2026-08-01','2026-08-02','2026-08-03','2026-08-04'].includes(date)) {
        const time = String(input.value || '').includes('T') ? String(input.value).slice(11) : '06:00';
        input.value = `${prep}T${time || '06:00'}`;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const row = input.closest('.swap-row');
      if (row && !row.querySelector('.remove-bin-swap')) row.insertAdjacentHTML('beforeend', '<button class="tiny remove-bin-swap" type="button" aria-label="Remove swap or service">×</button>');
    });
  }

  window.addEventListener('ts-location-schedule-ready', () => normalizeExisting(document));
  new MutationObserver(mutations => {
    for (const mutation of mutations) for (const node of mutation.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) normalizeExisting(node);
  }).observe(document.documentElement, { childList: true, subtree: true });
  queueMicrotask(() => normalizeExisting(document));
})();
