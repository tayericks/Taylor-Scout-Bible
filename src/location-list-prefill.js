import { configured, getShowId, getSession, loadBible, loadLocations, saveBibleDocument } from './supabase.js';

const fullAddress=loc=>[loc?.address,[loc?.city,[loc?.state,loc?.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(', ');
let running=false,lastKey='';

async function syncFromLocationList(){
  if(running||!configured)return;
  const params=new URLSearchParams(location.search),showId=getShowId(),locationId=params.get('locationId')||'',bibleId=params.get('bibleId')||'';
  const key=`${showId}:${bibleId}:${locationId}`;
  if(!showId||!locationId||!bibleId||key===lastKey)return;
  running=true;
  try{
    const session=await getSession();if(!session)return;
    const [doc,locations]=await Promise.all([loadBible(showId),loadLocations(showId)]);
    const canonical=(locations||[]).find(x=>x.id===locationId);const store=doc?.payload;const record=store?.bibles?.[bibleId];
    if(!canonical||!record)return;
    const address=fullAddress(canonical);
    record.location={...(record.location||{}),...canonical};
    record.locationId=canonical.id;
    record.locationName=canonical.location_name||record.locationName||'';
    record.setName=record.setName||canonical.set_name||'';
    record.episodeName=record.episodeName||canonical.episode_name||canonical.episode_id||'';
    record.logistics=record.logistics||{};
    record.logistics.set={
      ...(record.logistics.set||{}),
      name:canonical.location_name||record.logistics.set?.name||'',
      address,
      contact:canonical.contact_name||record.logistics.set?.contact||'',
      phone:canonical.contact_phone||record.logistics.set?.phone||'',
      uses:record.logistics.set?.uses||'Hero Location · Work Trucks · Craft Service'
    };
    record.updatedAt=new Date().toISOString();
    await saveBibleDocument(showId,store);
    lastKey=key;
    window.dispatchEvent(new CustomEvent('ts-bible-location-prefilled',{detail:{locationId,bibleId}}));
  }catch(error){console.warn('Could not prefill Bible from Location List',error)}finally{running=false}
}

const originalReplace=history.replaceState.bind(history);
history.replaceState=function(...args){const result=originalReplace(...args);queueMicrotask(syncFromLocationList);return result};
window.addEventListener('popstate',syncFromLocationList);
window.addEventListener('focus',syncFromLocationList);
setTimeout(syncFromLocationList,0);
setInterval(syncFromLocationList,1200);
