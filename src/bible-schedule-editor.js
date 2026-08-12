import { configured, supabase, getShowId, getLocationId, updateLocation } from './supabase.js';

const showId=getShowId();
const phases={prep:{label:'PREP',start:'prepStart',end:'prepEnd',dates:'prepDates',metaStart:'prep_start',metaEnd:'prep_end',metaDates:'prep_dates'},hold:{label:'HOLD',start:'holdStart',end:'holdEnd',dates:'holdDates',metaStart:'hold_start',metaEnd:'hold_end',metaDates:'hold_dates'},shoot:{label:'SHOOT',start:'shootStart',end:'shootEnd',dates:'shootDates',metaStart:'shoot_start',metaEnd:'shoot_end',metaDates:'shoot_dates'},strike:{label:'STRIKE',start:'strikeStart',end:'strikeEnd',dates:'strikeDates',metaStart:'strike_start',metaEnd:'strike_end',metaDates:'strike_dates'}};
const currentLocationId=()=>new URLSearchParams(location.search).get('locationId')||getLocationId()||'';
const iso=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||'').slice(0,10))?String(v).slice(0,10):'';
const daysBetween=(a,b)=>{a=iso(a);b=iso(b)||a;if(!a)return[];const out=[],start=new Date(`${a}T12:00:00`),end=new Date(`${b}T12:00:00`);for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);return out};

async function loadCurrent(){
  if(!configured||!supabase||!showId)return {location:null,calendar:null,event:null};
  const locationId=currentLocationId();
  const [{data:location,error:locError},{data:calendar,error:calError}]=await Promise.all([
    locationId?supabase.from('production_locations').select('*').eq('show_id',showId).eq('id',locationId).maybeSingle():Promise.resolve({data:null,error:null}),
    supabase.from('tool_documents').select('payload').eq('show_id',showId).eq('tool_key','calendar').maybeSingle()
  ]);
  if(locError)throw locError;if(calError)throw calError;
  const events=Array.isArray(calendar?.payload?.events)?calendar.payload.events:[];
  const event=events.find(e=>e&&(e.sharedLocationId===locationId||e.locationId===locationId))||null;
  return {location,calendar,event};
}

function readAssignments(loaded){
  const meta=loaded.location?.metadata?.schedule||{},event=loaded.event||{},assignments={};
  Object.entries(phases).forEach(([key,cfg])=>{
    const explicit=event[cfg.dates]||meta[cfg.metaDates]||[];
    const list=Array.isArray(explicit)&&explicit.length?explicit.map(iso).filter(Boolean):daysBetween(event[cfg.start]||meta[cfg.metaStart],event[cfg.end]||meta[cfg.metaEnd]);
    list.forEach(date=>{assignments[date]=key});
  });
  return assignments;
}

function derive(assignments,key){const dates=Object.entries(assignments).filter(([,p])=>p===key).map(([d])=>d).sort();return {dates,start:dates[0]||'',end:dates.at(-1)||''}}

async function saveAssignments(assignments,loaded){
  const locationId=currentLocationId();if(!locationId)throw new Error('This Bible is not connected to a location.');
  const existing=loaded.location?.metadata?.schedule||{},next={...existing};
  const eventPatch={};
  Object.entries(phases).forEach(([key,cfg])=>{const d=derive(assignments,key);next[cfg.metaDates]=d.dates;next[cfg.metaStart]=d.start;next[cfg.metaEnd]=d.end;eventPatch[cfg.dates]=d.dates;eventPatch[cfg.start]=d.start;eventPatch[cfg.end]=d.end});
  await updateLocation(locationId,{metadata:{...(loaded.location?.metadata||{}),schedule:next}});
  const payload={...(loaded.calendar?.payload||{})},events=Array.isArray(payload.events)?[...payload.events]:[];
  let idx=events.findIndex(e=>e&&(e.sharedLocationId===locationId||e.locationId===locationId));
  const base={id:crypto.randomUUID(),sharedLocationId:locationId,locationId,eventType:'location',episode:loaded.location?.episode_name||loaded.location?.episode_id||'',set:loaded.location?.set_name||'',location:loaded.location?.location_name||''};
  if(idx>=0)events[idx]={...events[idx],...eventPatch};else events.push({...base,...eventPatch});
  payload.events=events;
  const {error}=await supabase.from('tool_documents').upsert({show_id:showId,tool_key:'calendar',payload},{onConflict:'show_id,tool_key'});if(error)throw error;
  window.__TS_LOCATION_SCHEDULE__={...next};window.dispatchEvent(new CustomEvent('ts-location-schedule-ready',{detail:next}));
}

async function openEditor(){
  let loaded;try{loaded=await loadCurrent()}catch(e){alert(e.message||'Could not load schedule');return}
  let assignments=readAssignments(loaded),activePhase='prep';
  const existingDates=Object.keys(assignments).sort(),anchor=existingDates[0]||new Date().toISOString().slice(0,10),ad=new Date(`${anchor}T12:00:00`);let cursor=new Date(ad.getFullYear(),ad.getMonth(),1,12);
  const wrap=document.createElement('div');wrap.className='modal-backdrop bible-schedule-edit-backdrop';wrap.innerHTML=`<section class="location-modal bible-schedule-flex-modal"><div class="ts-flex-head"><div><small>LOCATION BIBLE · SCHEDULE</small><h2>Set production days</h2><p>Choose a bubble, then click any dates you want. Leave out phases this location does not use.</p></div><button type="button" class="ts-flex-close" aria-label="Close">×</button></div><div class="ts-flex-body"><div class="ts-flex-phases">${Object.entries(phases).map(([k,p])=>`<button type="button" class="ts-flex-phase ${k==='prep'?'active':''}" data-phase="${k}">${p.label}</button>`).join('')}<span class="ts-flex-hint">Click a colored date again to remove it.</span></div><div class="ts-flex-calendar"><div class="ts-flex-cal-head"><button type="button" data-nav="prev">‹</button><strong></strong><button type="button" data-nav="next">›</button></div><div class="ts-flex-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="ts-flex-grid"></div></div><div class="ts-flex-summary"></div><div class="ts-flex-actions"><button type="button" class="ts-flex-clear">Clear all dates</button><div class="ts-flex-actions-right"><button type="button" class="ts-flex-cancel">Cancel</button><button type="button" class="ts-flex-save">Save schedule</button></div></div></div></section>`;
  document.body.append(wrap);document.body.style.overflow='hidden';
  const close=()=>{document.body.style.overflow='';wrap.remove()};
  const render=()=>{const y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1,12),count=new Date(y,m+1,0,12).getDate();wrap.querySelector('.ts-flex-cal-head strong').textContent=cursor.toLocaleDateString('en-US',{month:'long',year:'numeric'});const grid=wrap.querySelector('.ts-flex-grid');let html='';for(let i=0;i<first.getDay();i++)html+='<span class="ts-flex-empty"></span>';for(let day=1;day<=count;day++){const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,phase=assignments[date],label=phase?phases[phase].label:'';html+=`<button type="button" class="ts-flex-day ${phase?`is-${phase}`:''}" data-date="${date}"><span class="day-num">${day}</span>${label?`<span class="day-bubble">${label}</span>`:''}</button>`}grid.innerHTML=html;grid.querySelectorAll('[data-date]').forEach(btn=>btn.onclick=()=>{const date=btn.dataset.date;if(assignments[date]===activePhase)delete assignments[date];else assignments[date]=activePhase;render()});const summary=wrap.querySelector('.ts-flex-summary'),parts=[];Object.entries(phases).forEach(([key,p])=>{const n=Object.values(assignments).filter(x=>x===key).length;if(n)parts.push(`<span class="ts-flex-summary-chip ${key}">${p.label} · ${n} day${n===1?'':'s'}</span>`)});summary.innerHTML=parts.length?parts.join(''):'<span class="empty">No production days selected yet.</span>'};
  wrap.querySelectorAll('[data-phase]').forEach(btn=>btn.onclick=()=>{activePhase=btn.dataset.phase;wrap.querySelectorAll('[data-phase]').forEach(x=>x.classList.toggle('active',x===btn))});
  wrap.querySelector('[data-nav="prev"]').onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()-1,1,12);render()};wrap.querySelector('[data-nav="next"]').onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1,12);render()};
  wrap.querySelector('.ts-flex-close').onclick=close;wrap.querySelector('.ts-flex-cancel').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
  wrap.querySelector('.ts-flex-clear').onclick=()=>{if(confirm('Clear every production date for this location?')){assignments={};render()}};
  wrap.querySelector('.ts-flex-save').onclick=async e=>{const btn=e.currentTarget;btn.disabled=true;btn.textContent='Saving…';try{await saveAssignments(assignments,loaded);close();location.reload()}catch(err){console.error(err);btn.disabled=false;btn.textContent='Save schedule';alert(err.message||'Could not save schedule')}};
  render();
}

function mount(){const strip=document.querySelector('.schedule-strip');if(!strip)return;[...strip.children].slice(0,4).forEach(cell=>{if(cell.dataset.scheduleEditable)return;cell.dataset.scheduleEditable='1';cell.tabIndex=0;cell.setAttribute('role','button');cell.title='Edit production schedule';cell.style.cursor='pointer';cell.onclick=e=>{e.preventDefault();openEditor()};cell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openEditor()}}})}
mount();new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});
