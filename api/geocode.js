const json=async url=>{const response=await fetch(url,{headers:{'User-Agent':'TaylorScoutBible/1.0 (security map geocoder)','Accept':'application/json'}});if(!response.ok)throw new Error('Geocoder unavailable');return response.json()};

export default async function handler(req,res){
  const q=String(req.query?.q||'').trim();
  if(!q)return res.status(400).json({error:'Address is required'});
  try{
    const censusUrl='https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address='+encodeURIComponent(q);
    const census=await json(censusUrl);
    const match=census?.result?.addressMatches?.[0];
    if(match?.coordinates){
      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({lat:Number(match.coordinates.y),lng:Number(match.coordinates.x),label:match.matchedAddress,source:'census'});
    }
  }catch{}
  try{
    const attempts=[q,q.replace(/\bAve\b/ig,'Avenue'),q.replace(/^\d+\s+/,'')];
    for(const address of [...new Set(attempts)]){
      const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q='+encodeURIComponent(address);
      const rows=await json(url);
      if(rows?.[0]){
        res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).json({lat:Number(rows[0].lat),lng:Number(rows[0].lon),label:rows[0].display_name,source:'openstreetmap'});
      }
    }
  }catch{}
  return res.status(404).json({error:'Address not found'});
}
