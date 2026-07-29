import{createClient}from'@supabase/supabase-js';
import{createSharedCookieStorage}from'./sharedAuthStorage.js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=Boolean(url&&key);
export const supabase=configured?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:createSharedCookieStorage()}}):null;
export const getShowId=()=>{const q=new URLSearchParams(location.search);return q.get('showId')||q.get('show')||''};
export const getLocationId=()=>new URLSearchParams(location.search).get('locationId')||'';
export async function getSession(){if(!supabase)return null;const{data,error}=await supabase.auth.getSession();if(error)throw error;return data.session}
export async function loadBible(showId){const{data,error}=await supabase.from('tool_documents').select('payload,updated_at').eq('show_id',showId).eq('tool_key','bible').maybeSingle();if(error)throw error;return data}
export async function saveBibleDocument(showId,payload){const{data,error}=await supabase.from('tool_documents').upsert({show_id:showId,tool_key:'bible',payload},{onConflict:'show_id,tool_key'}).select('updated_at').single();if(error)throw error;return data}
export async function loadBudget(showId){const{data,error}=await supabase.from('tool_documents').select('payload,updated_at').eq('show_id',showId).eq('tool_key','budget').maybeSingle();if(error)throw error;return data}
export async function loadLocations(showId){const{data,error}=await supabase.from('production_locations').select('*').eq('show_id',showId).order('updated_at',{ascending:false});if(error)throw error;return data||[]}
export async function updateLocation(locationId,changes){if(!locationId)throw new Error('Missing location ID');const payload={...changes,updated_by:(await getSession())?.user?.id||null,updated_at:new Date().toISOString()};const{data,error}=await supabase.from('production_locations').update(payload).eq('id',locationId).select('*').single();if(error)throw error;return data}
export function subscribeBible(showId,callback){if(!supabase||!showId)return()=>{};const channel=supabase.channel(`bible:${showId}`).on('postgres_changes',{event:'*',schema:'public',table:'tool_documents',filter:`show_id=eq.${showId}`},callback).on('postgres_changes',{event:'*',schema:'public',table:'production_locations',filter:`show_id=eq.${showId}`},callback).subscribe();return()=>supabase.removeChannel(channel)}
