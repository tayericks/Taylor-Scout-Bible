import { configured, getShowId, getLocationId, getSession, loadBible, saveBibleDocument } from './supabase.js';

const showId=getShowId();
const url=new URL(location.href);
const requestedBibleId=url.searchParams.get('bibleId')||'';
const locationId=getLocationId();
let store=null;
let record=null;
let removed=new Set();

function locateRecord(payload){
  if(!payload?.bibles)return null;
  if(requestedBibleId&&payload.bibles[requestedBibleId])return payload.bibles[requestedBibleId];
  if(locationId)return Object.values(payload.bibles).find(r=>r&&(r.locationId===locationId||r.location?.id===locationId))||null;
  return payload.bibles[payload.activeBibleId]||null;
}

async function loadRemoved(){
  if(!configured||!showId)return;
  try{
    const session=await getSession();
    if(!session)return;
    const doc=await loadBible(showId);
    store=doc?.payload||null;
    record=locateRecord(store);
    removed=new Set(Array.isArray(record?.removedVendorIds)?record.removedVendorIds:[]);
  }catch(err){console.warn('Could not load removed Bible vendors',err)}
}

function vendorId(card){return card?.dataset?.cardId||card?.getAttribute('data-vendor-id')||''}
function isDeleteVendorButton(btn){
  if(!btn)return false;
  if(btn.classList?.contains('delete-vendor'))return true;
  const text=String(btn.textContent||btn.getAttribute?.('aria-label')||'').trim().toLowerCase();
  return text==='delete vendor'||text==='remove vendor';
}

function applyRemoved(){
  document.querySelectorAll('.vendor-card').forEach(card=>{
    const id=vendorId(card);
    if(id&&removed.has(id))card.remove();
  });
}

function ensureDeleteButtons(){
  document.querySelectorAll('.vendor-card').forEach(card=>{
    const id=vendorId(card);
    if(!id||removed.has(id))return;
    if([...card.querySelectorAll('button')].some(isDeleteVendorButton))return;
    const host=card.querySelector('.vendor-footer')||card.querySelector('.vendor-detail');
    if(!host)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='small-btn danger-action delete-vendor';
    btn.textContent='Delete Vendor';
    host.appendChild(btn);
  });
}

async function persistRemoval(id){
  if(!id)return;
  removed.add(id);
  if(!configured||!showId)return;
  try{
    const session=await getSession();
    if(!session)return;
    const doc=await loadBible(showId);
    const freshStore=doc?.payload||null;
    const freshRecord=locateRecord(freshStore);
    if(!freshStore||!freshRecord)return;
    freshRecord.removedVendorIds=[...new Set([...(freshRecord.removedVendorIds||[]),id])];
    await saveBibleDocument(showId,freshStore);
    store=freshStore;
    record=freshRecord;
  }catch(err){console.error('Could not save removed Bible vendor',err)}
}

await loadRemoved();

const refresh=()=>{applyRemoved();ensureDeleteButtons()};
queueMicrotask(refresh);
new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('click',async event=>{
  const btn=event.target?.closest?.('button');
  if(!isDeleteVendorButton(btn))return;
  const card=btn.closest('.vendor-card');
  if(!card)return;
  event.preventDefault();
  event.stopPropagation();
  const id=vendorId(card);
  if(!id)return;
  btn.disabled=true;
  btn.textContent='Deleting…';
  await persistRemoval(id);
  card.remove();
},{capture:true});
