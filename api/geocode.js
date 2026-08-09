export default async function handler(req,res){
  const q=String(req.query?.q||'').trim();
  if(!q)return res.status(400).json({error:'Address is required'});
  try{
    const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q='+encodeURIComponent(q);
    const response=await fetch(url,{headers:{'User-Agent':'TaylorScoutBible/1.0 (security map geocoder)','Accept':'application/json'}});
    if(!response.ok)throw new Error('Geocoder unavailable');
    const rows=await response.json();
    if(!rows[0])return res.status(404).json({error:'Address not found'});
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({lat:Number(rows[0].lat),lng:Number(rows[0].lon),label:rows[0].display_name});
  }catch(error){return res.status(502).json({error:'Unable to center map'})}
}
