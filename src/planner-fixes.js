import {getShowId,getLocationId,loadBible} from './supabase.js';
const legacy=/^(2026-07-30|2026-07-31|2026-08-01|2026-08-02|2026-08-03|2026-08-04)/;
let choices=[];
const prep=()=>window.__TS_LOCATION_FIRST_PREP__||window.__TS_LOCATION_SCHEDULE__?.prepStart||'';
const fire=e=>{e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))};
function repair(root=document){
 const p=prep();
 root.querySelectorAll?.('input[type="date"],input[type="datetime-local"]').forEach(i=>{if(p&&(!i.value||legacy.test(i.value))){i.value=i.type==='datetime-local'?`${p}T${i.value.includes('T')?i.value.slice(11):'07:00'}`:p;fire(i)}});
 root.querySelectorAll?.('textarea,input[type="text"]').forEach(i=>{if(/Church at Rocky Peak|June Lake Beach/i.test(i.value||'')){i.value='';fire(i)}});
 root.querySelectorAll?.('.order-location-select').forEach(s=>{if(!choices.length)return;const text=[...s.options].map(o=>o.textContent).join(' ');if(!/June Lake Beach|Darling Ranch|Foxtail Ranch/i.test(text))return;s.innerHTML=choices.map(x=>`<option value="${x[0]}">${x[1]} — ${x[2]}</option>`).join('');fire(s)});
 root.querySelectorAll?.('.eq-row').forEach(calc);
 relabel(root);
}
function calc(r){const q=Number(r.querySelector('.eq-qty')?.value)||0,v=Number(r.querySelector('.eq-rate')?.value)||0,o=r.querySelector('.eq-total');if(o)o.textContent=`$${(q*v).toFixed(2)}`}
function relabel(root=document){root.querySelectorAll?.('.restroom-group').forEach(g=>{[...g.querySelectorAll('.restroom-unit')].forEach((r,i)=>{const l=r.querySelector('.unit-label');if(l)l.lastChild.textContent=` Set Unit${i?` ${i+1}`:''}`});g.querySelectorAll('.service-row').forEach(r=>[...r.querySelectorAll('[data-service-unit]')].forEach((c,i)=>{const l=c.closest('label');if(l)l.lastChild.textContent=` Set Unit${i?` ${i+1}`:''}`}))})}
document.addEventListener('input',e=>{const r=e.target.closest?.('.eq-row');if(r)calc(r)},true);
document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;if(b.classList.contains('add-equipment-row')){e.preventDefault();const t=b.closest('.location-order-group,.vendor-planner-shell')?.querySelector('.equipment-table'),r=t?.querySelector('.eq-row:last-of-type')?.cloneNode(true);if(r){r.querySelector('.eq-qty').value=1;r.querySelector('.eq-rate').value=0;calc(r);t.appendChild(r)}}if(b.classList.contains('add-restroom-unit')){e.preventDefault();const g=b.closest('.restroom-group'),w=g?.querySelector('.restroom-units'),r=w?.querySelector('.restroom-unit:last-child')?.cloneNode(true);if(r){r.querySelector('select').value='1';w.appendChild(r);relabel(g)}}if(b.classList.contains('add-restroom-service')){e.preventDefault();const g=b.closest('.restroom-group'),w=g?.querySelector('.service-schedule'),r=w?.querySelector('.service-row:last-of-type')?.cloneNode(true);if(r){const i=r.querySelector('input[type="datetime-local"]');if(i)i.value=prep()?`${prep()}T09:00`:'';b.before(r);relabel(g)}}},true);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&repair(n)))).observe(document.documentElement,{childList:true,subtree:true});
try{const d=await loadBible(getShowId()),s=d?.payload||d,q=new URLSearchParams(location.search),id=q.get('bibleId'),lid=q.get('locationId')||getLocationId(),r=id?s?.bibles?.[id]:Object.values(s?.bibles||{}).find(x=>x.locationId===lid||x.location?.id===lid),l=r?.logistics||{};choices=[['set','Set',l.set?.name],['basecamp','Basecamp',l.basecamp?.name],['crewParking','Crew Parking',l.crewParking?.name],['catering','Catering',l.catering?.name]].filter(x=>x[2])}catch{}
queueMicrotask(()=>repair(document));
