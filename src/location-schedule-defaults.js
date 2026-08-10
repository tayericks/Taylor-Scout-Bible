// Keeps Bible planner dates anchored to the selected location's Calendar schedule.
import { configured, getShowId, getLocationId, getSession, loadCalendarDocument, loadBible, loadLocations } from './supabase.js';

const LEGACY_DATES = new Set(['2026-07-30','2026-07-31','2026-08-01','2026-08-02','2026-08-03','2026-08-04']);
let firstPrep = '';
let activeLocationId = getLocationId();

function norm(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function calendarEvents(payload) {
  return Array.isArray(payload?.events) ? payload.events : Array.isArray(payload?.data?.events) ? payload.data.events : [];
}

function currentBibleRecord(store) {
  const q = new URLSearchParams(location.search);
  const requestedBibleId = q.get('bibleId');
  if (requestedBibleId && store?.bibles?.[requestedBibleId]) return store.bibles[requestedBibleId];
  const requestedLocationId = q.get('locationId') || activeLocationId;
  return Object.values(store?.bibles || {}).find(r => requestedLocationId && (r?.locationId === requestedLocationId || r?.location?.id === requestedLocationId)) || null;
}

function eventForLocation(events, locationId, record, locationRecord) {
  if (!Array.isArray(events)) return null;
  const exact = events.find(e => e && e.eventType !== 'note' && (e.sharedLocationId === locationId || e.locationId === locationId));
  if (exact) return exact;

  const names = new Set([
    norm(record?.locationName),
    norm(record?.location?.location_name),
    norm(record?.location?.name),
    norm(locationRecord?.location_name),
    norm(record?.logistics?.set?.name)
  ].filter(Boolean));
  const sets = new Set([
    norm(record?.setName),
    norm(record?.location?.set_name),
    norm(locationRecord?.set_name)
  ].filter(Boolean));
  const episode = norm(record?.episodeName || record?.episode || locationRecord?.episode_name || locationRecord?.episode_id);

  return events.find(e => {
    if (!e || e.eventType === 'note') return false;
    const eventName = norm(e.location || e.locationName || e.physicalLocation || e.addressName);
    const eventSet = norm(e.set || e.setName);
    const eventEpisode = norm(e.episode);
    const nameMatch = eventName && names.has(eventName);
    const setMatch = eventSet && sets.has(eventSet);
    const episodeOkay = !episode || !eventEpisode || episode === eventEpisode;
    return episodeOkay && (nameMatch || setMatch);
  }) || null;
}

function scheduleFromEvent(event) {
  if (!event) return null;
  const nested = event.schedule || {};
  return {
    prepStart: event.prepStart || nested.prep_start || nested.prepStart || '',
    prepEnd: event.prepEnd || nested.prep_end || nested.prepEnd || event.prepStart || nested.prep_start || '',
    holdStart: event.holdStart || nested.hold_start || nested.holdStart || '',
    holdEnd: event.holdEnd || nested.hold_end || nested.holdEnd || event.holdStart || nested.hold_start || '',
    shootStart: event.shootStart || nested.shoot_start || nested.shootStart || '',
    shootEnd: event.shootEnd || nested.shoot_end || nested.shootEnd || event.shootStart || nested.shoot_start || '',
    strikeStart: event.strikeStart || nested.strike_start || nested.strikeStart || '',
    strikeEnd: event.strikeEnd || nested.strike_end || nested.strikeEnd || event.strikeStart || nested.strike_start || ''
  };
}

function scheduleFromLocationRow(row) {
  const s = row?.metadata?.schedule;
  if (!s) return null;
  return {
    prepStart: s.prep_start || s.prepStart || '',
    prepEnd: s.prep_end || s.prepEnd || s.prep_start || '',
    holdStart: s.hold_start || s.holdStart || '',
    holdEnd: s.hold_end || s.holdEnd || s.hold_start || '',
    shootStart: s.shoot_start || s.shootStart || '',
    shootEnd: s.shoot_end || s.shootEnd || s.shoot_start || '',
    strikeStart: s.strike_start || s.strikeStart || '',
    strikeEnd: s.strike_end || s.strikeEnd || s.strike_start || ''
  };
}

function applyVendorDateDefaults(root = document) {
  if (!firstPrep) return;
  root.querySelectorAll?.('.vendor-card input[type="date"], .vendor-card input[type="datetime-local"], .vendor-planner-shell input[type="date"], .vendor-planner-shell input[type="datetime-local"], .security-planner-backdrop input[type="date"], .security-planner-backdrop input[type="datetime-local"], .security-planner-modal-backdrop input[type="date"], .security-planner-modal-backdrop input[type="datetime-local"]').forEach(input => {
    const value = String(input.value || '');
    const datePart = value.slice(0, 10);
    // Preserve real user-entered/current-location dates. Only initialize blanks or old demo dates.
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
    const [calendarDoc, bibleDoc, locations] = await Promise.all([loadCalendarDocument(showId), loadBible(showId), loadLocations(showId)]);
    const calendarPayload = calendarDoc?.payload || calendarDoc || {};
    try { localStorage.setItem('taylorScoutCalendarV5', JSON.stringify(calendarPayload)); } catch {}

    const store = bibleDoc?.payload || null;
    const record = currentBibleRecord(store);
    activeLocationId = activeLocationId || record?.locationId || record?.location?.id || '';
    const locationRecord = (locations || []).find(x => x.id === activeLocationId) || null;
    const event = eventForLocation(calendarEvents(calendarPayload), activeLocationId, record, locationRecord);

    let schedule = scheduleFromEvent(event);
    if (!schedule || !schedule.prepStart) {
      const targetName = norm(locationRecord?.location_name || record?.locationName || record?.location?.location_name || record?.logistics?.set?.name);
      const targetSet = norm(locationRecord?.set_name || record?.setName || record?.location?.set_name);
      const scheduledSibling = (locations || []).find(row => row.id !== activeLocationId && row.metadata?.schedule && ((targetName && norm(row.location_name) === targetName) || (targetSet && norm(row.set_name) === targetSet)));
      schedule = scheduleFromLocationRow(scheduledSibling) || scheduleFromLocationRow(locationRecord) || schedule || {};
    }

    firstPrep = schedule.prepStart || '';
    window.__TS_LOCATION_FIRST_PREP__ = firstPrep;
    window.__TS_DEFAULT_VENDOR_DATES__ = Boolean(firstPrep);
    window.__TS_LOCATION_SCHEDULE__ = schedule;
    window.dispatchEvent(new CustomEvent('ts-location-schedule-ready', { detail: schedule }));
  } catch (err) {
    console.warn('Could not prime Bible location schedule', err);
  }
}

await primeLocationSchedule();

const observer = new MutationObserver(mutations => {
  if (!firstPrep) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        applyVendorDateDefaults(node);
        if (node.matches?.('input[type="date"],input[type="datetime-local"]')) applyVendorDateDefaults(node.parentElement || document);
      }
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
queueMicrotask(() => applyVendorDateDefaults(document));
