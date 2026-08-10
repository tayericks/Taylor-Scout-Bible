// Keeps Bible planner dates anchored to the selected location's Calendar schedule.
import { configured, getShowId, getLocationId, getSession, loadCalendarDocument, loadBible } from './supabase.js';

const LEGACY_DATES = new Set(['2026-07-30','2026-07-31','2026-08-01','2026-08-02','2026-08-03','2026-08-04']);
let firstPrep = '';
let activeLocationId = getLocationId();
let shouldDefaultVendorDates = false;

function calendarEvents(payload) {
  return Array.isArray(payload?.events) ? payload.events : Array.isArray(payload?.data?.events) ? payload.data.events : [];
}

function eventForLocation(events, locationId) {
  if (!locationId) return null;
  return events.find(e => e && e.eventType !== 'note' && (e.sharedLocationId === locationId || e.locationId === locationId)) || null;
}

function currentBibleRecord(store) {
  const q = new URLSearchParams(location.search);
  const requestedBibleId = q.get('bibleId');
  if (requestedBibleId && store?.bibles?.[requestedBibleId]) return store.bibles[requestedBibleId];
  const requestedLocationId = q.get('locationId') || activeLocationId;
  return Object.values(store?.bibles || {}).find(r => requestedLocationId && (r?.locationId === requestedLocationId || r?.location?.id === requestedLocationId)) || null;
}

function recordHasVendorScheduling(record) {
  if (!record) return false;
  if (record.vendorEditors && Object.keys(record.vendorEditors).length) return true;
  if (Array.isArray(record.values) && record.values.some(x => x && (x.type === 'date' || x.type === 'datetime-local') && x.value)) return true;
  return false;
}

function applyVendorDateDefaults(root = document) {
  if (!firstPrep || !shouldDefaultVendorDates) return;
  root.querySelectorAll?.('.vendor-card input[type="date"], .vendor-card input[type="datetime-local"], .vendor-planner-shell input[type="date"], .vendor-planner-shell input[type="datetime-local"]').forEach(input => {
    const value = String(input.value || '');
    const datePart = value.slice(0, 10);
    if (datePart && !LEGACY_DATES.has(datePart)) return;
    if (input.type === 'datetime-local') {
      const time = value.includes('T') ? value.slice(11) : '06:00';
      input.value = `${firstPrep}T${time || '06:00'}`;
    } else {
      input.value = firstPrep;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function primeLocationSchedule() {
  if (!configured) return;
  const showId = getShowId();
  if (!showId) return;
  try {
    const session = await getSession();
    if (!session) return;
    const [calendarDoc, bibleDoc] = await Promise.all([loadCalendarDocument(showId), loadBible(showId)]);
    const calendarPayload = calendarDoc?.payload || calendarDoc || {};
    try { localStorage.setItem('taylorScoutCalendarV5', JSON.stringify(calendarPayload)); } catch {}

    const store = bibleDoc?.payload || null;
    const record = currentBibleRecord(store);
    activeLocationId = activeLocationId || record?.locationId || record?.location?.id || '';
    const event = eventForLocation(calendarEvents(calendarPayload), activeLocationId);
    firstPrep = event?.prepStart || '';
    shouldDefaultVendorDates = Boolean(firstPrep) && !recordHasVendorScheduling(record);
    window.__TS_LOCATION_FIRST_PREP__ = firstPrep;
    window.__TS_DEFAULT_VENDOR_DATES__ = shouldDefaultVendorDates;
  } catch (err) {
    console.warn('Could not prime Bible location schedule', err);
  }
}

await primeLocationSchedule();

const observer = new MutationObserver(mutations => {
  if (!firstPrep || !shouldDefaultVendorDates) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) applyVendorDateDefaults(node);
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
queueMicrotask(() => applyVendorDateDefaults(document));
