import { configured, supabase, getShowId, getLocationId, updateLocation } from './supabase.js';

const showId=getShowId();
const phaseConfig={
  prep:{label:'PREP',start:'prepStart',end:'prepEnd',metaStart:'prep_start',metaEnd:'prep_end'},
  shoot:{label:'FILM',start:'shootStart',end:'shootEnd',metaStart:'shoot_start',metaEnd:'shoot_end'},
  strike:{label:'WRAP',start:'strikeStart',end:'strikeEnd',metaStart:'strike_start',metaEnd:'strike_end'}
};
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const currentLocationId=()=>new URLSearchParams(location.search).get('locationId')||getLocationId()||'';

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

function valuesFor(phase,loaded){
  const cfg=phaseConfig[phase],m=loaded.location?.metadata?.schedule||{},e=loaded.event||{};
  return {start:e[cfg.start]||m[cfg.metaStart]||'',end:e[cfg.end]||m[cfg.metaEnd]||e[cfg.start]||m[cfg.metaStart]||''};
}

async function savePhase(phase,start,end){
  const cfg=phaseConfig[phase],loaded=await loadCurrent(),locationId=currentLocationId();
  if(!locationId)throw new Error('This Bible is not connected to a location.');
  const existingSchedule=loaded.location?.metadata?.schedule||{};
  const nextSchedule={...existingSchedule,[cfg.metaStart]:start,[cfg.metaEnd]:end||start};
  await updateLocation(locationId,{metadata:{...(loaded.location?.metadata||{}),schedule:nextSchedule}});
  if(loaded.calendar){
    const payload={...(loaded.calendar.payload||{})};
    const events=Array.isArray(payload.events)?[...payload.events]:[];
    let idx=events.findIndex(e=>e&&(e.sharedLocationId===locationId||e.locationId===locationId));
    if(idx>=0)events[idx]={...events[idx],[cfg.start]:start,[cfg.end]:end||start};
    else events.push({id:crypto.randomUUID(),sharedLocationId:locationId,locationId,eventType:'location',episode:loaded.location?.episode_name||loaded.location?.episode_id||'',set:loaded.location?.set_name||'',location:loaded.location?.location_name||'',[cfg.start]:start,[cfg.end]:end||start});
    payload.events=events;
    const {error}=await supabase.from('tool_documents').upsert({show_id:showId,tool_key:'calendar',payload},{onConflict:'show_id,tool_key'});
    if(error)throw error;
  }
  window.__TS_LOCATION_SCHEDULE__={...(window.__TS_LOCATION_SCHEDULE__||{}),[cfg.start]:start,[cfg.end]:end||start};
  window.dispatchEvent(new CustomEvent('ts-location-schedule-ready'));
}

async function openEditor(phase){
  const cfg=phaseConfig[phase];
  let loaded;try{loaded=await loadCurrent()}catch(e){alert(e.message||'Could not load schedule');return}
  const v=valuesFor(phase,loaded),wrap=document.createElement('div');
  wrap.className='modal-backdrop bible-schedule-edit-backdrop';
  wrap.innerHTML=`<section class="location-modal bible-schedule-edit-modal"><div class="modal-head"><div><small>LOCATION BIBLE · SCHEDULE</small><h2>Edit ${esc(cfg.label)} dates</h2></div><button class="modal-close" type="button">×</button></div><form><div class="modal-grid"><label><span>${esc(cfg.label)} start</span><input name="start" type="date" value="${esc(v.start)}" required></label><label><span>${esc(cfg.label)} end</span><input name="end" type="date" value="${esc(v.end)}"></label></div><p class="modal-note">These dates sync to the shared location schedule and Calendar.</p><div class="modal-actions"><button type="button" class="ghost cancel">Cancel</button><button class="primary save">Save dates</button></div></form></section>`;
  document.body.append(wrap);document.body.style.overflow='hidden';
  const close=()=>{document.body.style.overflow='';wrap.remove()};
  wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.cancel').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
  wrap.querySelector('form').onsubmit=async e=>{e.preventDefault();const btn=wrap.querySelector('.save'),fd=new FormData(e.currentTarget);let start=String(fd.get('start')||''),end=String(fd.get('end')||start);if(end&&end<start)[start,end]=[end,start];btn.disabled=true;btn.textContent='Saving…';try{await savePhase(phase,start,end);close();location.reload()}catch(err){console.error(err);btn.disabled=false;btn.textContent='Save dates';alert(err.message||'Could not save schedule dates')}};
}

function mount(){
  const strip=document.querySelector('.schedule-strip');if(!strip)return;
  const phaseOrder=['prep','shoot','strike'];
  [...strip.children].slice(0,3).forEach((cell,i)=>{if(cell.dataset.scheduleEditable)return;const phase=phaseOrder[i];cell.dataset.scheduleEditable='1';cell.dataset.schedulePhase=phase;cell.tabIndex=0;cell.setAttribute('role','button');cell.title=`Edit ${phaseConfig[phase].label} dates`;cell.style.cursor='pointer';cell.onclick=e=>{e.preventDefault();openEditor(phase)};cell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openEditor(phase)}}});
}
mount();new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});
