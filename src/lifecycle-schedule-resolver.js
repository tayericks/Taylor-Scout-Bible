function iso(value){const s=String(value||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function first(...values){for(const value of values){const v=iso(value);if(v)return v}return ''}
function asDates(value){return Array.isArray(value)?value.map(iso).filter(Boolean):[]}
function normalizeEvent(event){const s=event?.schedule||{};return {
  prepStart:first(event?.prepStart,event?.prep_start,s.prepStart,s.prep_start),
  prepEnd:first(event?.prepEnd,event?.prep_end,s.prepEnd,s.prep_end,event?.prepStart,event?.prep_start,s.prepStart,s.prep_start),
  prepDates:asDates(event?.prepDates||event?.prep_dates||s.prepDates||s.prep_dates),
  holdStart:first(event?.holdStart,event?.hold_start,s.holdStart,s.hold_start),
  holdEnd:first(event?.holdEnd,event?.hold_end,s.holdEnd,s.hold_end,event?.holdStart,event?.hold_start,s.holdStart,s.hold_start),
  holdDates:asDates(event?.holdDates||event?.hold_dates||s.holdDates||s.hold_dates),
  shootStart:first(event?.shootStart,event?.shoot_start,event?.filmStart,event?.film_start,s.shootStart,s.shoot_start,s.filmStart,s.film_start),
  shootEnd:first(event?.shootEnd,event?.shoot_end,event?.filmEnd,event?.film_end,s.shootEnd,s.shoot_end,s.filmEnd,s.film_end,event?.shootStart,event?.shoot_start,event?.filmStart,event?.film_start),
  shootDates:asDates(event?.shootDates||event?.shoot_dates||event?.filmDates||event?.film_dates||s.shootDates||s.shoot_dates||s.filmDates||s.film_dates),
  strikeStart:first(event?.strikeStart,event?.strike_start,event?.wrapStart,event?.wrap_start,s.strikeStart,s.strike_start,s.wrapStart,s.wrap_start),
  strikeEnd:first(event?.strikeEnd,event?.strike_end,event?.wrapEnd,event?.wrap_end,s.strikeEnd,s.strike_end,s.wrapEnd,s.wrap_end,event?.strikeStart,event?.strike_start,event?.wrapStart,event?.wrap_start),
  strikeDates:asDates(event?.strikeDates||event?.strike_dates||event?.wrapDates||event?.wrap_dates||s.strikeDates||s.strike_dates||s.wrapDates||s.wrap_dates)
}}
function phaseDates(schedule){return [...schedule.prepDates,...schedule.holdDates,...schedule.shootDates,...schedule.strikeDates]}
function span(schedule){const starts=[schedule.prepStart,schedule.holdStart,schedule.shootStart,schedule.strikeStart,...phaseDates(schedule)].filter(Boolean).sort();const ends=[schedule.prepEnd,schedule.holdEnd,schedule.shootEnd,schedule.strikeEnd,...phaseDates(schedule)].filter(Boolean).sort();return {start:starts[0]||'',end:ends[ends.length-1]||starts[0]||''}}
function calendarEvents(){try{const payload=JSON.parse(localStorage.getItem('taylorScoutCalendarV5')||'{}');return Array.isArray(payload?.events)?payload.events:Array.isArray(payload?.data?.events)?payload.data.events:[]}catch{return[]}}
function resolveForDate(date){if(!date)return null;const events=calendarEvents().filter(e=>e&&e.eventType!=='note');const q=new URLSearchParams(location.search),locationId=q.get('locationId')||'',bibleId=q.get('bibleId')||'';let event=events.find(e=>(locationId&&(e.sharedLocationId===locationId||e.locationId===locationId))||(bibleId&&(e.bibleId===bibleId||e.locationBibleId===bibleId)));if(event)return normalizeEvent(event);
  const candidates=events.map(event=>({event,schedule:normalizeEvent(event)})).filter(x=>{const range=span(x.schedule);return range.start&&range.end&&date>=range.start&&date<=range.end});
  if(candidates.length===1)return candidates[0].schedule;
  if(candidates.length>1){const exact=candidates.find(x=>phaseDates(x.schedule).includes(date)||[x.schedule.prepStart,x.schedule.prepEnd,x.schedule.holdStart,x.schedule.holdEnd,x.schedule.shootStart,x.schedule.shootEnd,x.schedule.strikeStart,x.schedule.strikeEnd].includes(date));return (exact||candidates[0]).schedule}
  return null
}
function maybeResolve(input){if(!(input instanceof HTMLInputElement)||!['date','datetime-local'].includes(input.type))return;const date=iso(input.value);const schedule=resolveForDate(date);if(!schedule)return;window.__TS_LOCATION_SCHEDULE__=schedule;window.__TS_LOCATION_FIRST_PREP__=schedule.prepStart||window.__TS_LOCATION_FIRST_PREP__||'';window.dispatchEvent(new CustomEvent('ts-location-schedule-ready',{detail:schedule}))}
function inputFrom(event){return event.composedPath?.().find(x=>x instanceof HTMLInputElement)||event.target}
['pointerdown','mousedown','click','focusin'].forEach(type=>window.addEventListener(type,event=>maybeResolve(inputFrom(event)),true));
