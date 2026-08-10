// Shares Bible Security Planner posts with the show's Waypoint document.
// Waypoint keeps its existing drawing objects; this only updates the per-location
// Security layer so pins can be toggled there without re-entering coverage.
import { configured, supabase, getShowId, getLocationId, getSession, loadBible } from './supabase.js';

const q=new URLSearchParams(location.search);
const bibleId=q.get('bibleId')||'';
const showId=getShowId();
const locationId=getLocationId();

function securityKey(){return `taylorScoutSecurityPlannerV1:${bibleId||'default'}`;}

async function currentPlan(){
  try{
    const local=JSON.parse(localStorage.getItem(securityKey())||'null');
    if(local?.assignments)return local;
  }catch{}
  if(!configured||!showId)return null;
  try{
    const doc=await loadBible(showId), store=doc?.payload;
    const record=(bibleId&&store?.bibles?.[bibleId])||Object.values(store?.bibles||{}).find(r=>r?.locationId===locationId||r?.location?.id===locationId);
    return record?.securityPlanner||null;
  }catch{return null;}
}

function cleanPost(a,type){
  return {
    id:a.id,
    source:'bible-security',
    locationId,
    typeId:a.typeId,
    typeName:type?.name||a.name||'Security',
    color:type?.color||'#2f80ed',
    name:a.name||type?.name||'Security Post',
    guards:Number(a.guards||1),
    role:a.role||'Guard',
    coverageMode:a.coverageMode||'day',
    startDate:a.startDate||a.date||'',
    endDate:a.endDate||a.startDate||a.date||'',
    start:a.start||'06:00',
    end:a.end||'18:00',
    placement:a.placement||a.post||'',
    note:a.note||'',
    anchor:Array.isArray(a.anchor)?a.anchor:(Array.isArray(a.mapAnchor)?a.mapAnchor:null),
    updatedAt:new Date().toISOString()
  };
}

export async function syncSecurityToWaypoint(){
  if(!configured||!supabase||!showId||!locationId)return false;
  const session=await getSession(); if(!session)return false;
  const plan=await currentPlan(); if(!plan)return false;
  const types=Array.isArray(plan.types)?plan.types:[];
  const posts=(Array.isArray(plan.assignments)?plan.assignments:[]).map(a=>cleanPost(a,types.find(t=>t.id===a.typeId)));
  const {data:row,error:loadError}=await supabase.from('tool_documents').select('payload').eq('show_id',showId).eq('tool_key','waypoint').maybeSingle();
  if(loadError)throw loadError;
  const payload={...(row?.payload||{})};
  const securityLayers={...(payload.securityLayers||{})};
  securityLayers[locationId]={version:1,locationId,bibleId,posts,updatedAt:new Date().toISOString()};
  payload.securityLayers=securityLayers;
  payload.layers={...(payload.layers||{}),security:{...((payload.layers||{}).security||{}),byLocation:securityLayers}};
  const {error}=await supabase.from('tool_documents').upsert({show_id:showId,tool_key:'waypoint',payload},{onConflict:'show_id,tool_key'});
  if(error)throw error;
  return true;
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('button'); if(!button)return;
  const isSecuritySave=button.id==='secSave'||(/save to bible/i.test(button.textContent||'')&&button.closest('.security-planner-shell'));
  if(!isSecuritySave)return;
  setTimeout(()=>syncSecurityToWaypoint().catch(err=>console.warn('Waypoint security sync failed',err)),250);
},true);
