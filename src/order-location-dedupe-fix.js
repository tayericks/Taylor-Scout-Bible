// Keeps vendor planner location choices aligned with the visible Bible logistics cards.
// Prevents duplicate Set/Basecamp/Crew Parking/Catering choices and stale addresses in previews.
const canonicalLabels=['SET','BASECAMP','CREW PARKING','CATERING'];
const norm=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,' ');
const labelFromOption=opt=>{
  const value=String(opt?.value||'').toLowerCase();
  const text=String(opt?.textContent||'').split('—')[0].trim();
  if(value==='set'||/^set$/i.test(text))return 'SET';
  if(value==='basecamp'||/basecamp/i.test(text))return 'BASECAMP';
  if(value==='crewparking'||/crew\s*parking/i.test(text))return 'CREW PARKING';
  if(value==='catering'||/catering/i.test(text))return 'CATERING';
  return norm(text);
};
function canonicalLocations(root=document){
  const out=[];
  root.querySelectorAll('.vendor-planner-locations a').forEach(a=>{
    const label=norm(a.querySelector('b')?.textContent);
    const name=String(a.querySelector('span')?.textContent||'').trim();
    const address=String(a.querySelector('small')?.textContent||'').trim();
    if(!label||!name)return;
    if(!out.some(x=>x.label===label))out.push({label,name,address});
  });
  return out;
}
function canonicalValueFor(select,label){
  const direct={SET:'set',BASECAMP:'basecamp','CREW PARKING':'crewParking',CATERING:'catering'}[label];
  const directOpt=[...select.options].find(o=>String(o.value)===direct);
  if(directOpt)return directOpt.value;
  const match=[...select.options].find(o=>labelFromOption(o)===label);
  return match?.value||'';
}
function repairSelect(select,locations){
  if(!select?.classList?.contains('order-location-select'))return false;
  const selectedLabel=labelFromOption(select.selectedOptions?.[0]);
  let changed=false;
  const seen=new Set();
  [...select.options].forEach(opt=>{
    const label=labelFromOption(opt);
    const canonical=locations.find(x=>x.label===label);
    if(canonical){
      if(seen.has(label)){opt.remove();changed=true;return;}
      seen.add(label);
      const next=`${canonical.label.replace(/\b\w/g,m=>m.toUpperCase())} — ${canonical.name}`;
      if(opt.textContent!==next){opt.textContent=next;changed=true;}
    }
  });
  if(selectedLabel){
    const value=canonicalValueFor(select,selectedLabel);
    if(value&&select.value!==value){select.value=value;changed=true;}
  }
  const label=labelFromOption(select.selectedOptions?.[0]);
  const canonical=locations.find(x=>x.label===label);
  const group=select.closest('.location-order-group');
  const address=group?.querySelector('.order-location-address');
  if(address&&canonical?.address&&address.textContent!==canonical.address){address.textContent=canonical.address;changed=true;}
  return changed;
}
let repairing=false;
function repair(root=document){
  if(repairing)return;
  const locations=canonicalLocations(document);
  if(!locations.length)return;
  repairing=true;
  try{
    root.querySelectorAll?.('select.order-location-select').forEach(select=>{
      const before=select.value;
      const changed=repairSelect(select,locations);
      if(changed||before!==select.value){
        queueMicrotask(()=>select.dispatchEvent(new Event('change',{bubbles:true})));
      }
    });
  }finally{repairing=false;}
}
new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1)))queueMicrotask(()=>repair(document));
}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',e=>{if(e.target?.matches?.('.order-location-select'))queueMicrotask(()=>repair(e.target.closest('.vendor-planner-shell,.vendor-card')||document));},true);
queueMicrotask(()=>repair(document));
