// Prevent location-specific Bible details from leaking into another location.
// Runs before the main Bible UI so stale legacy/default location values are
// corrected from the canonical production_locations record before rendering.
import { configured, getShowId, getLocationId, getSession, loadBible, loadLocations, saveBibleDocument } from './supabase.js';

const LEGACY_DARLING = {
  name: 'Darling Ranch',
  address: '1773 Darling Ave',
  city: 'Frazier Park',
  state: 'CA',
  postal: '93225',
  contact: 'Karen Bryden',
  phone: '661-510-6366'
};

const norm = value => String(value || '').trim().toLowerCase();
const contains = (value, needle) => norm(value).includes(norm(needle));

function canonicalAddress(location) {
  if (!location) return '';
  const street = String(location.address || '').trim();
  const cityStateZip = [
    String(location.city || '').trim(),
    [String(location.state || '').trim(), String(location.postal_code || '').trim()].filter(Boolean).join(' ')
  ].filter(Boolean).join(', ');
  return [street, cityStateZip].filter(Boolean).join(', ');
}

function isLegacyDarlingValue(value, type) {
  const v = norm(value);
  if (!v) return false;
  if (type === 'contact') return v === norm(LEGACY_DARLING.contact);
  if (type === 'phone') return v === norm(LEGACY_DARLING.phone);
  if (type === 'address') {
    return contains(v, LEGACY_DARLING.address) ||
      (contains(v, LEGACY_DARLING.city) && contains(v, LEGACY_DARLING.postal));
  }
  return false;
}

function repairArea(area, canonical, forceCanonicalSet = false) {
  if (!area || typeof area !== 'object') return false;
  let changed = false;
  const canonAddress = canonicalAddress(canonical);

  if (forceCanonicalSet) {
    if (canonical.location_name && area.name !== canonical.location_name) {
      area.name = canonical.location_name;
      changed = true;
    }
    if ((!area.address || isLegacyDarlingValue(area.address, 'address')) && area.address !== canonAddress) {
      area.address = canonAddress;
      changed = true;
    }
    if ((!area.contact || isLegacyDarlingValue(area.contact, 'contact'))) {
      const next = canonical.contact_name || '';
      if (area.contact !== next) { area.contact = next; changed = true; }
    }
    if ((!area.phone || isLegacyDarlingValue(area.phone, 'phone'))) {
      const next = canonical.contact_phone || '';
      if (area.phone !== next) { area.phone = next; changed = true; }
    }
  } else {
    // Never retain the known Darling defaults on a different location.
    if (isLegacyDarlingValue(area.address, 'address')) { area.address = ''; changed = true; }
    if (isLegacyDarlingValue(area.contact, 'contact')) { area.contact = ''; changed = true; }
    if (isLegacyDarlingValue(area.phone, 'phone')) { area.phone = ''; changed = true; }
  }
  return changed;
}

async function repairCurrentBible() {
  if (!configured) return;
  const showId = getShowId();
  const locationId = getLocationId();
  if (!showId || !locationId) return;

  try {
    const session = await getSession();
    if (!session) return;
    const [bibleDoc, locations] = await Promise.all([loadBible(showId), loadLocations(showId)]);
    const canonical = (locations || []).find(l => l.id === locationId);
    if (!canonical || norm(canonical.location_name) === norm(LEGACY_DARLING.name)) return;

    const store = bibleDoc?.payload;
    if (!store?.bibles) return;
    const record = Object.values(store.bibles).find(r => r?.locationId === locationId || r?.location?.id === locationId);
    if (!record) return;

    let changed = false;
    record.location = { ...(record.location || {}) };
    const canonAddress = canonicalAddress(canonical);

    // The canonical Location List record owns identity/contact fields.
    const identity = {
      id: canonical.id,
      location_name: canonical.location_name || '',
      address: canonical.address || '',
      city: canonical.city || '',
      state: canonical.state || '',
      postal_code: canonical.postal_code || '',
      contact_name: canonical.contact_name || '',
      contact_phone: canonical.contact_phone || ''
    };
    for (const [key, value] of Object.entries(identity)) {
      if (record.location[key] !== value) { record.location[key] = value; changed = true; }
    }

    record.locationName = canonical.location_name || record.locationName || '';

    if (record.logistics && typeof record.logistics === 'object') {
      if (record.logistics.set) changed = repairArea(record.logistics.set, canonical, true) || changed;
      for (const key of ['basecamp', 'crewParking', 'catering']) {
        if (record.logistics[key]) changed = repairArea(record.logistics[key], canonical, false) || changed;
      }
      for (const extra of record.logistics.extras || []) changed = repairArea(extra, canonical, false) || changed;
    }

    // Clean top-level legacy display fields if present.
    if (isLegacyDarlingValue(record.primaryContact, 'contact')) { record.primaryContact = ''; changed = true; }
    if (isLegacyDarlingValue(record.contact, 'contact')) { record.contact = ''; changed = true; }
    if (isLegacyDarlingValue(record.phone, 'phone')) { record.phone = ''; changed = true; }
    if (isLegacyDarlingValue(record.address, 'address')) { record.address = canonAddress; changed = true; }

    if (changed) await saveBibleDocument(showId, store);
  } catch (error) {
    console.warn('Bible location carryover guard could not repair record', error);
  }
}

await repairCurrentBible();
