// Runtime hardening for Bible vendor planners. Keeps planner UI scoped to the active
// location and repairs dynamic add/remove/math actions without changing the locked shell.

const firstPrep = () => window.__TS_LOCATION_FIRST_PREP__ || '';
const legacyDate = value => /^2026-(07-(30|31)|08-(01|02|03|04))/.test(String(value || ''));
const money = value => `$${Number(value || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

function currentOrderLocations(){
  const cards=[...document.querySelectorAll('.order-locations-card,.order-location-card,[class*="order-location"]')];
  const result=[];
  const seen=new Set();
  cards.forEach(card=>{
    const text=(card.innerText||'').trim();
    const label=(card.querySelector('small,.eyebrow,[class*="label"]')?.textContent||text.split('\n')[0]||'').trim();
    const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
    const name=(card.querySelector('b,strong,h4,h5')?.textContent||lines[1]||lines[0]||'').trim();
    if(!name||/location logistics/i.test(name))return;
    const key=(label||name).toLowerCase();
    if(seen.has(key))return;
    seen.add(key); result.push({label:label||name,name});
  });
  // The right rail uses these canonical areas; prefer them when available.
  const canonical=[];
  document.querySelectorAll('aside [class*="order-location"], aside .order-locations *').forEach(el=>{
    if(el.children.length>4)return;
    const txt=(el.innerText||'').trim(); if(!txt)return;
    const lines=txt.split('\n').map(x=>x.trim()).filter(Boolean);
    const head=lines[0]||'', name=lines[1]||'';
    if(/^(SET|BASECAMP|CREW PARKING|CATERING)$/i.test(head)&&name&&!canonical.some(x=>x.label.toLowerCase()===head.toLowerCase())) canonical.push({label:head,name});
  });
  return canonical.length?canonical:result;
}

function repairLocationSelects(root=document){
  const choices=currentOrderLocations();
  if(!choices.length)return;
  root.querySelectorAll('select.order-location-select, .location-order-group select').forEach(select=>{
    const opts=[...select.options];
    if(!opts.length)return;
    const looksLikeLocation=select.classList.contains('order-location-select')||opts.some(o=>/(June Lake Beach|Darling Ranch|Foxtail Ranch)/i.test(o.textContent||''));
    if(!looksLikeLocation)return;
    opts.forEach((opt,i)=>{
      const raw=(opt.value+' '+opt.textContent).toLowerCase();
      let c=choices.find(x=>raw.includes(x.label.toLowerCase().replace(/\s+/g,''))||raw.includes(x.label.toLowerCase()))||choices[i]||choices[0];
      if(c) opt.textContent=`${c.label.replace(/\b\w/g,m=>m.toUpperCase())} — ${c.name}`;
    });
  });
}

function clearCarryoverNotes(root=document){
  root.querySelectorAll('textarea,input[type="text"]').forEach(el=>{
    if(/^\s*(Church at Rocky Peak|June Lake Beach)\s*$/i.test(el.value||'')){
      el.value=''; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
    }
  });
}

function applyPrepDates(root=document){
  const prep=firstPrep(); if(!prep)return;
  root.querySelectorAll('input[type="date"],input[type="datetime-local"]').forEach(input=>{
    const v=String(input.value||'');
    if(v && !legacyDate(v))return;
    if(input.type==='datetime-local') input.value=`${prep}T${v.includes('T')?(v.slice(11)||'06:00'):'06:00'}`;
    else input.value=prep;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
}

function recalcEquipment(root=document){
  root.querySelectorAll('.eq-row').forEach(row=>{
    const qty=row.querySelector('.eq-qty,input[type="number"]');
    const rate=row.querySelector('.eq-rate,input[type="number"]:nth-of-type(2)');
    const total=row.querySelector('.eq-total,strong');
    if(!qty||!rate||!total)return;
    total.textContent=money((Number(qty.value)||0)*(Number(rate.value)||0));
  });
}

function nextUnitName(group){
  const count=group.querySelectorAll('.restroom-unit').length+1;
  const loc=group.querySelector('.order-location-select')?.selectedOptions?.[0]?.textContent?.split('—')[0]?.trim()||'Set';
  const clean=/base/i.test(loc)?'Basecamp':/crew/i.test(loc)?'Crew Parking':/cater/i.test(loc)?'Catering':'Set';
  return count===1?`${clean} Unit`:`${clean} Unit ${count}`;
}

function relabelRestroomUnits(group){
  const loc=group.querySelector('.order-location-select')?.selectedOptions?.[0]?.textContent?.split('—')[0]?.trim()||'Set';
  const clean=/base/i.test(loc)?'Basecamp':/crew/i.test(loc)?'Crew Parking':/cater/i.test(loc)?'Catering':'Set';
  group.querySelectorAll('.restroom-unit').forEach((unit,i)=>{
    const label=unit.querySelector('.unit-label');
    if(label){ const input=label.querySelector('input'); label.childNodes.forEach(n=>{if(n.nodeType===3)n.remove()}); label.append(` ${clean} Unit${i?` ${i+1}`:''}`); if(input&&!label.contains(input))label.prepend(input); }
  });
  group.querySelectorAll('.service-row').forEach(row=>{
    row.querySelectorAll('label').forEach((label,i)=>{
      if(label.querySelector('.service-all'))return;
      const input=label.querySelector('input'); if(!input)return;
      label.childNodes.forEach(n=>{if(n.nodeType===3)n.remove()}); label.append(` ${clean} Unit${i?` ${i+1}`:''}`);
    });
  });
}

function addRestroomUnit(group){
  const list=group.querySelector('.restroom-units'); if(!list)return;
  const source=list.querySelector('.restroom-unit:last-child');
  const unit=source?source.cloneNode(true):document.createElement('div');
  unit.className='restroom-unit';
  if(!source) unit.innerHTML='<select><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select><select><option>4-room</option><option>2-room</option><option>Single</option><option>ADA</option><option>Luxury trailer</option><option>Custom</option></select><label class="unit-label"><input type="checkbox" checked></label><button class="tiny remove-restroom-unit" type="button">×</button>';
  unit.querySelectorAll('select').forEach((s,i)=>{if(i===0)s.value='1'});
  unit.querySelectorAll('input[type="checkbox"]').forEach(x=>x.checked=true);
  list.append(unit); relabelRestroomUnits(group);
  unit.querySelectorAll('select,input').forEach(x=>x.dispatchEvent(new Event('change',{bubbles:true})));
}

function addRestroomService(group){
  const schedule=group.querySelector('.service-schedule'); if(!schedule)return;
  const units=[...group.querySelectorAll('.restroom-unit')];
  const row=document.createElement('div'); row.className='service-row';
  const prep=firstPrep();
  row.innerHTML=`<input type="datetime-local" value="${prep?prep+'T09:00':''}"><div class="service-units"><span>Service:</span>${units.map((_,i)=>`<label><input type="checkbox" checked data-service-unit="service-${Date.now()}-${i}"> Unit ${i+1}</label>`).join('')}<label><input type="checkbox" class="service-all" checked> All</label></div><button class="tiny remove-service" type="button">×</button>`;
  const add=schedule.querySelector('.add-restroom-service'); schedule.insertBefore(row,add||null); relabelRestroomUnits(group); applyPrepDates(row);
  row.querySelector('input[type="datetime-local"]')?.dispatchEvent(new Event('change',{bubbles:true}));
}

function addEquipmentRow(group){
  const table=group.querySelector('.equipment-table'); if(!table)return;
  const source=table.querySelector('.eq-row:last-child');
  const row=source?source.cloneNode(true):null; if(!row)return;
  row.querySelectorAll('input').forEach(i=>i.value=i.classList.contains('eq-rate')?'0':'1');
  const total=row.querySelector('.eq-total'); if(total)total.textContent='$0.00';
  table.append(row); recalcEquipment(row);
}

function addOrderLocation(planner){
  const container=planner.querySelector('.location-order-group')?.parentElement; if(!container)return;
  const groups=[...container.querySelectorAll(':scope > .location-order-group')]; if(!groups.length)return;
  const source=groups[groups.length-1]; const clone=source.cloneNode(true);
  const select=clone.querySelector('.order-location-select');
  if(select){
    const used=new Set(groups.map(g=>g.querySelector('.order-location-select')?.value).filter(Boolean));
    const next=[...select.options].find(o=>!used.has(o.value)); if(next)select.value=next.value;
  }
  clone.querySelectorAll('.eq-row').forEach((r,i)=>{if(i>0)r.remove()});
  clone.querySelectorAll('.eq-row input').forEach(i=>i.value=i.classList.contains('eq-rate')?'0':'1');
  clone.querySelectorAll('.restroom-unit').forEach((u,i)=>{if(i>0)u.remove()});
  clone.querySelectorAll('.service-row').forEach(r=>r.remove());
  container.append(clone); repairLocationSelects(clone); applyPrepDates(clone); relabelRestroomUnits(clone); recalcEquipment(clone);
  select?.dispatchEvent(new Event('change',{bubbles:true}));
}

function findButton(event,pattern){
  const b=event.target.closest?.('button'); if(!b)return null;
  return pattern.test((b.textContent||'').trim())?b:null;
}

document.addEventListener('click',event=>{
  let b;
  if((b=event.target.closest?.('.add-restroom-unit'))){event.preventDefault();event.stopImmediatePropagation();addRestroomUnit(b.closest('.restroom-group,.location-order-group'));return;}
  if((b=event.target.closest?.('.add-restroom-service'))){event.preventDefault();event.stopImmediatePropagation();addRestroomService(b.closest('.restroom-group,.location-order-group'));return;}
  if((b=event.target.closest?.('.add-equipment-row'))){event.preventDefault();event.stopImmediatePropagation();addEquipmentRow(b.closest('.equipment-group,.location-order-group'));return;}
  if((b=event.target.closest?.('.remove-restroom-unit'))){event.preventDefault();event.stopImmediatePropagation();const g=b.closest('.restroom-group,.location-order-group');b.closest('.restroom-unit')?.remove();relabelRestroomUnits(g);return;}
  if((b=event.target.closest?.('.remove-service,.service-row .tiny'))){if(b.closest('.service-row')){event.preventDefault();event.stopImmediatePropagation();b.closest('.service-row').remove();return;}}
  if((b=findButton(event,/add order to location/i))){event.preventDefault();event.stopImmediatePropagation();addOrderLocation(b.closest('.vendor-planner-shell')||document);return;}
},true);

document.addEventListener('input',event=>{
  if(event.target.matches?.('.eq-qty,.eq-rate')) recalcEquipment(event.target.closest('.eq-row'));
},true);
document.addEventListener('change',event=>{
  if(event.target.matches?.('.eq-qty,.eq-rate')) recalcEquipment(event.target.closest('.eq-row'));
  if(event.target.matches?.('.order-location-select')) relabelRestroomUnits(event.target.closest('.location-order-group'));
},true);

function repair(root=document){repairLocationSelects(root);clearCarryoverNotes(root);applyPrepDates(root);recalcEquipment(root);root.querySelectorAll?.('.restroom-group,.location-order-group').forEach(relabelRestroomUnits);}
const observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)queueMicrotask(()=>repair(n));})));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('ts-location-schedule-ready',()=>repair(document));
queueMicrotask(()=>repair(document));
