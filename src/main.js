import{configured,getShowId,getLocationId,getSession,loadBible as loadBibleDocument,saveBibleDocument,loadBudget,saveBudgetVendorLibrary,loadCalendarDocument,loadProductionSetup,loadLocations,updateLocation,subscribeBible}from'./supabase.js';
const vendors = [
  {id:'security',category:'Site Operations',title:'Security',vendor:'Showbiz Inc',status:'ordered',summary:'24-hour, day and night coverage · Jul 30–Aug 4',contact:'Ray Barajas · 562-318-7807 · Rbarajasj@gmail.com',stamp:'Ordered Jul 20 at 2:34 PM',po:'PO pending',type:'security'},
  {id:'restrooms',category:'Site Operations',title:'Restrooms',vendor:'Elite Mobile Restrooms',status:'ordered',summary:'2 × 4-room units · delivery, service and pickup scheduled',contact:'Shaunn Freire · 818-743-6226 · elitemobilerestrooms@gmail.com',stamp:'Ordered Jul 20 at 2:34 PM',po:'PO 304-118',type:'restrooms'},
  {id:'cleaning',category:'Site Operations',title:'Cleaning',vendor:'Vendor not finalized',status:'review',summary:'Final cleaning · Aug 4 at 11:00 AM',contact:'Options: Dave Sutor or Reeltime Production Services',stamp:'Awaiting selection',po:'No PO',type:'cleaning'},
  {id:'bins',category:'Site Operations',title:'Bins & Dumpsters',vendor:'Reel Waste',status:'ordered',summary:'Black, blue and green bins · set + basecamp',contact:'Brooke Ybarra · 661-621-1253 · tnj@reelwaste.net',stamp:'Ordered Jul 20 at 2:34 PM',po:'PO 304-121',type:'bins'},
  {id:'equipment',category:'Equipment',title:'Equipment',vendor:'HDR Rentals',status:'ordered',summary:'Pop-ups, lights, extinguishers and wash stations',contact:'Daniel Godinez · 323-557-3371 · daniel@hollywooddepot.com',stamp:'Ordered Jul 20 at 2:34 PM',po:'PO 304-125',type:'equipment'},
  {id:'catering',category:'Equipment',title:'Catering Setup',vendor:'Lunchbox Transportation / HDR',status:'review',summary:'Large lunchbox · vendor confirmation needed',contact:'Larry · 818-997-3200 · larry@lunchboxtrailers.com',stamp:'Pending vendor selection',po:'No PO',type:'catering'},
  {id:'snake',category:'Specialty',title:'Snake Wrangler',vendor:'Tatem Forsberg',status:'ordered',summary:'Coverage across prep, film and wrap',contact:'805-857-1401 · tatemforsberg@gmail.com',stamp:'Ordered Jul 20 at 2:34 PM',po:'PO 304-130',type:'schedule'},
  {id:'maps',category:'Parking & Movement',title:'Maps',vendor:'Map This Out',status:'ordered',summary:'Prep + crew maps · edge-of-zone lot',contact:'Rich Clark · 818-391-3176 · rich@mapthisout.com',stamp:'Ordered Jul 20 at 2:34 PM',po:'PO 304-133',type:'maps'}
];

vendors.push(
  {id:'police',category:'Traffic & Public Safety',title:'Police / Traffic Control',vendor:'Vendor not selected',status:'working',summary:'Budget allowance ready for planning',contact:'',stamp:'Not ordered',po:'No PO',type:'generic'},
  {id:'parking',category:'Parking & Movement',title:'Parking / Basecamp',vendor:'Vendor not selected',status:'working',summary:'Budget allowance ready for planning',contact:'',stamp:'Not ordered',po:'No PO',type:'generic'},
  {id:'permits',category:'Permits & Community',title:'Permits / Notification',vendor:'Vendor not selected',status:'working',summary:'Budget allowance ready for planning',contact:'',stamp:'Not ordered',po:'No PO',type:'generic'},
  {id:'power',category:'Site Operations',title:'Power / HVAC / Lighting',vendor:'Vendor not selected',status:'working',summary:'Budget allowance ready for planning',contact:'',stamp:'Not ordered',po:'No PO',type:'generic'},
  {id:'support',category:'Site Operations',title:'Site Support / Holding',vendor:'Vendor not selected',status:'working',summary:'Budget allowance ready for planning',contact:'',stamp:'Not ordered',po:'No PO',type:'generic'}
);
const vendorTemplateDefaults=Object.fromEntries(vendors.map(v=>[v.id,{vendor:'Vendor not selected',status:'working',summary:'Budget allowance ready for planning',contact:'',stamp:'Not ordered',po:'No PO'}]));
function resetVendorTemplates(){vendors.forEach(v=>Object.assign(v,vendorTemplateDefaults[v.id]||{}))}
resetVendorTemplates();

const OPERATION_PLANNER_IDS=new Set(['parking','police','permits','support']);
function customVendorCatalog(){return Array.isArray(bibleStore?.customVendors)?bibleStore.customVendors:[]}
function fullVendorCatalog(){
 const seen=new Set(),all=[...vendorCatalog,...customVendorCatalog()];
 return all.filter(v=>{const key=String(v.name||'').trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true})
}
function isOperationPlanner(v){return OPERATION_PLANNER_IDS.has(v?.id)}
const vendorCatalog = [
 {category:'Abatement / Environmental Cleaning',name:'Westcor Environmental',status:'Pending',contact:'Matt Westrup / Christian Sanford',phone:'562-677-3990 / 562-371-5445',email:'mwestrup@westcorenv.com',rates:'Estimate required'},
 {category:'Air Conditioning',name:'Air on Location, Inc.',status:'Account Documents Complete',contact:'Edgar Robles',phone:'818-307-4558 / 818-712-6933',email:'aironlocation@gmail.com',rates:'Recent invoice 8/3/26: 10x10 cooling tent $100; 1.5 Ton AC 110V $200; AC delivery/pick-up $400; 500 Amp ultra-silent generator $450; generator delivery/pick-up $300; distro pack $400; diesel $10/gal. Existing guide: 25 Ton $1,700/wk or $1,200/day; 20 Ton $1,500/wk or $1,000/day; 10 Ton $1,100/wk or $800/day; 5 Ton $600/wk or $500/day; 1.5 Ton $300/wk or $200/day.'},
 {category:'Air Conditioning',name:'Herc Entertainment Services LLC',status:'Account Documents Complete',contact:'Zach R. Perlman',phone:'818-840-8247 / 714-381-6446',email:'Zachary.Perlman@hercrentals.com',rates:'Quote required'},
 {category:'Catering Trailer',name:'Lunchbox Transportation, LLC',status:'Account Documents Complete',contact:'Larry Wasserman',phone:'818-822-8801',email:'larry@lunchboxtrailers.com',rates:'Large $1,450/day + $150 fuel + $477 delivery + $477 pickup; Small $1,150/day + $150 fuel + $784 delivery/pickup; capacities Large 100, Small 75, Mini 50'},
 {category:'Changing / HMU Trailers',name:'Hollywood Executive Restrooms LLC',status:'Account Documents Complete',contact:'Gale & Michelle Webster',phone:'661-857-9321 / 661-212-4729',email:'book@Hollywoodexecutiverestrooms.com',rates:'5-room changing trailer $1,150/day or week; 6-station HMU $1,150/day or week'},
 {category:'Changing / HMU Trailers',name:'Greenlite',status:'Vendor Documents Requested',contact:'Gale Webster',phone:'',email:'gale@greenlitetrailers.com',rates:'8-station HMU $866/day or $2,600/week; 10-station HMU $1,283/day or $2,600/week'},
 {category:'Changing / HMU Trailers',name:'Reel Waste & Recycling, LLC',status:'Account Documents Complete',contact:'Tom / Brooke Ybarra',phone:'661-621-1253 / 877-588-7335',email:'tnj@reelwaste.net',rates:'Changing trailer $750/day; HMU trailer $850/day'},
 {category:'Cleaning',name:'White Tee Set Cleaning',status:'Account Documents Complete',contact:'Dave Sutor',phone:'661-803-6123',email:'billing4wtsc@gmail.com',rates:'Quote required; preferred for big jobs and exterior spaces'},
 {category:'Cleaning',name:'Reeltime Production Services',status:'Pending',contact:'Liliana & Jorge Solares',phone:'818-472-6463',email:'liliana@reeltimepro.com',rates:'Quote required; preferred for houses and interiors'},
 {category:'Construction / Restoration',name:'Absolute Construction Services',status:'Pending',contact:'Carlos Martinez',phone:'818-573-0097',email:'carlosconstructionservice@gmail.com',rates:'Quote required'},
 {category:'Construction / Restoration',name:'Uli Restore / Bernabe Ulises Solano',status:'Pending',contact:'Ulises Solano',phone:'818-669-2633',email:'ulrestore0413@gmail.com',rates:'Quote required'},
 {category:'Closure Plans / Directional Signs',name:'Pacific Traffic Control (PTC)',status:'Account Documents Complete',contact:'Ismael Rodriguez / Signs Desk',phone:'323-981-0600',email:'accounting@pacifictc.com',rates:'Quote required'},
 {category:'Environmental / Water Testing',name:'Ellis Environmental Management Inc.',status:'Pending',contact:'Ryan Davidson / Jane Cornish / Eliza Kraus',phone:'310-544-1837',email:'ellisstaff@ellisenvironmental.com',rates:'Quote required'},
 {category:'Fencing',name:'Cal-State Site Services',status:'Pending',contact:'Rene Seville',phone:'',email:'rene@rentfenceandtoilets.com',rates:'Quote required'},
 {category:'Filming Permits / Services',name:'Pacific Production Services (PPS)',status:'Account Documents Complete',contact:'Katie King',phone:'323-260-4777 / 864-915-4842',email:'katie@grouppps.com',rates:'Difficult permit $225; standard permit $175; rider $125'},
 {category:'Filming Permits / Services',name:'Inland Empire Film Service',status:'Pending',contact:'Dan Taylor',phone:'909-285-9700',email:'dan@iefilmpermits.com',rates:'Quote required'},
 {category:'Equipment / Glowbugs',name:'Hollywood Depot Rentals (HDR)',status:'Account Documents Complete',contact:'Daniel Godinez',phone:'818-845-8077 / 323-557-3371',email:'daniel@hollywooddepot.com',rates:"Recent invoice 8/6/26 (rental 7/31–8/4): 10x10 pop-up tent $70; 10' tent side $16; sandbag $7; handwashing station $350; 33-gal trash can $5.50; Milwaukee light $60; GloBug lighting system w/generator $330; small fire extinguisher $24; delivery/set-up $425; strike pick-up $425. Confirm current quote before ordering."},
 {category:'Layout Boards',name:'Mat Men / Sunset Supplies',status:'Account Documents Complete',contact:'Ken Coon / John Reinhold / Mike Morales',phone:'626-716-4560 / 626-524-8280',email:'ken@matmen.net',rates:'Invoice-backed mats, corrugated, runners, floor protection, layout board, tape, labor and delivery rates are in the shared library.'},
 {category:'Map Services',name:'Map This Out, Inc.',status:'Account Documents Complete',contact:'Rich Clark',phone:'818-391-3176',email:'rich@mapthisout.com',rates:'$90 per map'},
 {category:'Pest Control',name:'All Valley Honey and Bee',status:'Account Documents Complete',contact:'',phone:'818-894-1881',email:'beeman@allvalleyhoneyandbee.com',rates:'Pay via Cashet card each service'},
 {category:'Police',name:'LAPD',status:'Pending',contact:'Jill Stanley-Markow',phone:'818-585-1995',email:'jillatwalker@gmail.com',rates:'Contract / city rate'},
 {category:'Police',name:'CHP',status:'Available',contact:'Officer Jon Dockweiler',phone:'213-703-2070',email:'JDockweiler@chp.ca.gov',rates:'Agency rate'},
 {category:'Security',name:'Showbiz Inc.',status:'Account Documents Complete',contact:'Ray Barajas / Fernando Nunez',phone:'562-318-7807 / 323-910-8304',email:'Rbarajasj@gmail.com',rates:'Guard $29.50/hr first 8, $44.25/hr after 8; 8-hour guarantee. Gaffer $31.50/hr first 8, $47.25/hr after 8; no double time'},
 {category:'Showers',name:'Hollywood Executive Restrooms LLC',status:'Account Documents Complete',contact:'Gale & Michelle Webster',phone:'661-857-9321 / 661-212-4729',email:'book@Hollywoodexecutiverestrooms.com',rates:'2-room shower trailer $2,500/day or week incl. delivery/pickup; attendant $35/hr first 8, 1.5× after 8'},
 {category:'Showers',name:'Quixote',status:'Vendor Not Set Up',contact:'Kyle Williams / Ernesto Shahbaz / Jonathan Robles',phone:'',email:'kwilliams@quixote.com',rates:'3-room shower combo $2,500/day/week/location; delivery $175 or $225 AH; pickup $175 or $225 AH; service $250 or $325 AH'},
 {category:'Snake Wrangling',name:"Scott Perez's Company",status:'Account Documents Complete',contact:'Tatem Forsberg',phone:'805-857-1401',email:'tatemforsberg@gmail.com',rates:'$50.41/hr starting 8/2/26; $48.71/hr through 8/1/26; paid via payroll'},
 {category:'Street Sweeping',name:'Quality Surface Maintenance',status:'May Not Need',contact:'Michael Perez & Andrea Padilla',phone:'909-284-2251',email:'qualitysurfacemaintenance@gmail.com',rates:'$130/hr'},
 {category:'Tents / Tables / Chairs',name:'American Tents',status:'Account Documents Complete',contact:'Anthony Sierra',phone:'626-523-4056',email:'americantentsinc@gmail.com',rates:'20×20: $2,179 daily / $2,469 weekly / $4,746 monthly; 20×40: $2,698.13 / $3,290.55 / $7,019.07; 20×60: $3,227.25 / $4,165.08 / $8,994.21'},
 {category:'Toilets',name:'Elite Mobile Restrooms',status:'Account Documents Complete',contact:'Shaunn Freire',phone:'818-743-6226',email:'elitemobilerestrooms@gmail.com',rates:'4-unit with generator $1,000 incl. standard delivery/pickup; service $175; after-hours/weekend fee $125; attendant $350/10 hrs then $90/hr OT; construction unit $150/unit/swap'},
 {category:'Trash',name:'Reel Waste & Recycling, LLC',status:'Account Documents Complete',contact:'Tom / Brooke Ybarra',phone:'661-621-1253 / 877-588-7335',email:'tnj@reelwaste.net',rates:'3-yard black/blue/green $175 each; 15-yard $650; 30-yard $750'},
 {category:'Trash',name:'Athens Services',status:'May Not Need',contact:'Customer Service',phone:'888-336-6100',email:'',rates:'3-yard bin 7-day rental $213.94 incl. one service; additional service $193.94; $61.76/day after 7 days'},
 {category:'Trash',name:'Universal Waste Systems, Inc.',status:'Location Specific',contact:'Brian Zuniga',phone:'562-205-4963',email:'brianz@uwscompany.com',rates:'$170/bin'},
 {category:'Trash',name:'Burrtec / Mountain Disposal',status:'Location Specific',contact:'Rachel Bullock',phone:'909-338-2417',email:'rbullock@burrtec.com',rates:'Quote required'}
];
let vendorLibraryOpen=false;
let vendorLibrarySelected='Hollywood Depot Rentals (HDR)';
const statusFlow=['working','review','approved','ordered'];
const statusLabels={working:'Working',review:'Ready for review',approved:'Approved',ordered:'Ordered'};
const equipmentInventory=["Air Compressor", "Air Conditioner 1.5 ton w/ Hose", "Astroturf", "Broom-corn Stick", "Broom-push", "Boom Box - iPod Dock", "Butt Can", "Bull Horn", "C-Stand - G&E", "Cal-OSHA Sign", "Camera Cart", "Clip-on lights", "Cart, Rubbermaid", "Coffee Cambro", "Coffee Maker-100 Cup", "Coffee Maker-55 Cup", "Cone Delineator 36\"", "Cone 18\"", "Cone 28\"", "Cooler 100 Qt", "Cooler 48 Qt (Tech Scout)", "Cooler 68 Qt", "Copier Desktop", "Crash Pad - 4 x 8 x 8", "Cube Taps", "Director Chair-tall", "Director Chair-Medium", "Director Chair-low", "Dolly Magliner Sr", "Dolly Magliner Sr w/ Shelf", "Dolly Furniture", "Dolly Handtruck", "Dolly Refrigerator", "Dust Mop", "Dust Pan", "Extension Cord 100 ft", "Extension Cord 50 ft", "Extension Cord 25 ft", "Extension, 4 Prong", "Equipment Cover, Heat Reflective - 10x10", "Fan (Box)", "Fan (High Velocity)", "Fire Extinguisher - Small", "Fire Extinguisher - Large", "First Aid Kit-50 Person", "Flash Light", "Floor Squeegee", "Fogger - Rosco Vapour", "Folding Chair", "Folding Chair Cart", "Folding Chair, Padded", "Furniture Pad", "Gas Can - Large", "Generator: Honda 2000 Watt", "Generator: Honda 3000 Watt", "Generator: Honda 7000 Watt", "Glo Bugs - LED", "Hazer - Rosco V Hazer", "Heater Blower Small", "Heater Blower Large", "Heater - Dish Electric", "Heater - Dolly w Propane Tank", "Heater - Tent Box Heater", "Iron, Steam/Dry", "Ironing Board", "Ladder 4 ft", "Ladder 6 ft", "Ladder 8 ft", "Ladder 12 ft", "Ladder 16 ft", "Laundry Bins", "Leaf Blower", "Loco Mat 3 x 5", "Microwave", "Mirror: Floor Length", "Mirror: Make-up Rolling", "Mirror: Make-up Table Top", "Misting Fan - 30 Gallon", "Pallet Jack", "Pipe & Drape - Base", "Pipe & Drape - Upright", "Pipe & Drape - Support", "Pipe & Drape - Drape 10 ft", "Pop-Up Tent 8x8 (Black)", "Pop-Up Tent 10x10 (Blue)", "Pop-Up Tent 10x10 (White)", "Pop-Up Tent 10x15 (Blue)", "Pop-Up Tent 10x15 (White)", "Pop-Up Tent 10x20 (Blue)", "Pop-Up Tent 10x20 (White)", "Pop-Up Tent Side 8ft (Black)", "Pop-Up Tent Side 10ft (Blue)", "Pop-Up Tent Side 10ft (Black)", "Pop-Up Tent Side 10ft (White)", "Pop-Up Tent Side 10ft - Heat Reflective", "Pop-Up Tent Top 10ft - Heat Reflective", "Propane Tanks 20 lbs", "Power Strip", "Rack: Tool", "Rack Track", "Rake - Rock", "Ratchet Straps", "Refrigerator", "Shop Vac", "Shovel - Flat", "Shovel - Spade", "Safety Vest", "Sandbags-25 lbs", "Swamp Cooler", "Table-4ft Plastic", "Table-6ft Plastic", "Table-8ft Plastic", "Toaster", "Trash Can - Regular 32 Gal", "Trash Can - Office", "Trash Can - Kitchen", "Trash Can-recycle", "Truck Shelf-6 ft", "Truck Shelf-8 ft", "Umbrella", "Wardrobe Rack", "Wardrobe Rack Bottoms", "Wardrobe Z Racks", "Wardrobe S Racks", "Wardrobe Steamer", "Water Cooler - 5 gal", "Water- 5 gal Disp. (hot & cold)", "Water- 5 gal Bottle", "Water Bags", "Water Barrels", "Water Hose 50 ft", "Worklight (LED) Red", "Worklight w/Stand", "Worklight w/Stand (Double)", "Motorola Radios-CP200 (UHF)", "Headsets", "Hand Mic", "Surveillance Mic", "Noise Canceling Headsets", "Base Stations (40 watt)", "Repeater", "J-Box", '10x10 Pop-Up Tent', "10' Tent Side", 'Trash Can, 33 gal', 'Milwaukee Light', 'GloBug Lighting System with Generator', 'Fire Extinguisher, Small', 'Delivery / Set-Up', 'Strike Pick-Up', '10x10 Cooling Tent', '1.5 Ton Air Conditioning Unit — 110V', '500 Amp Ultra Silent Generator', 'Distro Pack — Base Camp', 'Diesel Fuel — per gallon', 'AC Delivery / Pick-Up', 'Generator Delivery / Pick-Up'];
const commonEquipment=['10x10 Pop-Up Tent',"10' Tent Side",'Sandbag','Handwashing Station','Trash Can, 33 gal','Milwaukee Light','GloBug Lighting System with Generator','Fire Extinguisher, Small','10x10 Cooling Tent','1.5 Ton Air Conditioning Unit — 110V','500 Amp Ultra Silent Generator','Distro Pack — Base Camp'];

const knownEquipmentRates={
 '10x10 pop-up tent':70,"10' tent side":16,'sandbag':7,'sandbags':7,'handwashing station':350,'trash can, 33 gal':5.5,'milwaukee light':60,'globug lighting system with generator':330,'glowbug':330,'glo bugs - led':330,'fire extinguisher, small':24,'fire extinguisher - small':24,'delivery / set-up':425,'strike pick-up':425,
 '10x10 cooling tent':100,'1.5 ton air conditioning unit — 110v':200,'air conditioner 1.5 ton w/ hose':200,'500 amp ultra silent generator':450,'distro pack — base camp':400,'diesel fuel — per gallon':10,'ac delivery / pick-up':400,'generator delivery / pick-up':300
};
function defaultVendorLibraryItems(){
 const hdr='Hollywood Depot Rentals (HDR)';
 return{[hdr]:equipmentInventory.map((name,i)=>({id:`hdr-${i+1}`,name,rate:knownEquipmentRates[String(name).trim().toLowerCase()]||0,billing:'unit'}))}
}
function vendorLibraryFromBudget(items=[]){return items.reduce((out,v)=>{const vendor=String(v.vendor||'Unassigned Vendor').trim()||'Unassigned Vendor';(out[vendor]||(out[vendor]=[])).push({...v,rate:v.billingType==='weekly'?Number(v.weeklyRate||0):Number(v.flatRate||0),billing:v.billingType==='weekly'?'weekly':'flat'});return out},{})}
function budgetVendorsFromLibrary(library){return Object.entries(library||{}).flatMap(([vendor,items])=>(items||[]).map(item=>{const billingType=item.billing==='weekly'?'weekly':'flat';return{id:item.id||crypto.randomUUID(),name:item.name||'Untitled item',vendor,billingType,flatRate:billingType==='flat'?Number(item.rate||0):Number(item.flatRate||0),weeklyRate:billingType==='weekly'?Number(item.rate||0):Number(item.weeklyRate||0),serviceRate:Number(item.serviceRate||0),deliveryFee:Number(item.deliveryFee||0),pickupFee:Number(item.pickupFee||0)}}))}
function syncVendorLibraryFromBudget(){if(Array.isArray(sharedBudget?.vendors))bibleStore.vendorLibraryItems=vendorLibraryFromBudget(sharedBudget.vendors)}
function ensureVendorLibraryItems(){
 if(!bibleStore.vendorLibraryItems||typeof bibleStore.vendorLibraryItems!=='object')bibleStore.vendorLibraryItems=defaultVendorLibraryItems();
 const library=bibleStore.vendorLibraryItems;
 const seed=(vendor,items)=>{
   if(!Array.isArray(library[vendor]))library[vendor]=[];
   const existing=new Set(library[vendor].map(x=>String(x.name||'').trim().toLowerCase()));
   items.forEach(item=>{if(!existing.has(item.name.toLowerCase()))library[vendor].push(item)});
 };
 seed('American Tents',[
   {id:'american-tents-20x20-daily',name:'20×20 Tent — Daily',rate:2179,billing:'flat'},
   {id:'american-tents-20x20-weekly',name:'20×20 Tent — Weekly',rate:2469,billing:'flat'},
   {id:'american-tents-20x20-monthly',name:'20×20 Tent — Monthly',rate:4746,billing:'flat'},
   {id:'american-tents-20x40-daily',name:'20×40 Tent — Daily',rate:2698.13,billing:'flat'},
   {id:'american-tents-20x40-weekly',name:'20×40 Tent — Weekly',rate:3290.55,billing:'flat'},
   {id:'american-tents-20x40-monthly',name:'20×40 Tent — Monthly',rate:7019.07,billing:'flat'},
   {id:'american-tents-20x60-daily',name:'20×60 Tent — Daily',rate:3227.25,billing:'flat'},
   {id:'american-tents-20x60-weekly',name:'20×60 Tent — Weekly',rate:4165.08,billing:'flat'},
   {id:'american-tents-20x60-monthly',name:'20×60 Tent — Monthly',rate:8994.21,billing:'flat'}
 ]);
 seed('Lunchbox Transportation, LLC',[
   {id:'lunchbox-large-daily',name:'Large Lunchbox — Daily',rate:1450,billing:'flat'},
   {id:'lunchbox-small-daily',name:'Small Lunchbox — Daily',rate:1150,billing:'flat'},
   {id:'lunchbox-fuel',name:'Fuel',rate:150,billing:'flat'},
   {id:'lunchbox-large-delivery',name:'Large Lunchbox Delivery',rate:477,billing:'flat'},
   {id:'lunchbox-large-pickup',name:'Large Lunchbox Pickup',rate:477,billing:'flat'},
   {id:'lunchbox-small-delivery-pickup',name:'Small Lunchbox Delivery / Pickup',rate:784,billing:'flat'}
 ]);
 return library;
}
function vendorItemsFor(name){const library=ensureVendorLibraryItems();if(!Array.isArray(library[name]))library[name]=[];return library[name]}
let vendorLibrarySaveTimer=null;
function markVendorLibraryDirty(){
 bibleDirty=true;cloudState='Unsaved vendor library changes';updateCloudStatus();clearTimeout(vendorLibrarySaveTimer);vendorLibrarySaveTimer=setTimeout(saveVendorLibrary,700)
}
async function saveVendorLibrary(){
 clearTimeout(vendorLibrarySaveTimer);if(bibleSaving){vendorLibrarySaveTimer=setTimeout(saveVendorLibrary,500);return}
 bibleSaving=true;localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
 try{if(configured&&showId){const session=await getSession();if(!session)throw new Error('Not signed in');const canonical=budgetVendorsFromLibrary(ensureVendorLibraryItems());await saveBudgetVendorLibrary(showId,canonical);sharedBudget={...(sharedBudget||{}),vendors:canonical};cloudState='Connected · shared vendor library saved'}else cloudState='Vendor library saved locally';bibleDirty=false}
 catch(e){console.error('Vendor library save failed',e);bibleDirty=true;cloudState=`Sync error: ${e.message||'vendor library save failed'}`}
 finally{bibleSaving=false;updateCloudStatus();if(pendingRemoteRefresh&&!bibleDirty){pendingRemoteRefresh=false;setTimeout(()=>refreshSharedData(true),0)}}
}
function equipmentLibraryItems(){
 const vendor=vendorCatalog.find(x=>x.category.includes('Equipment / Glowbugs'))?.name||'Hollywood Depot Rentals (HDR)';
 return vendorItemsFor(vendor);
}
function equipmentKnownRate(name){
 const saved=equipmentLibraryItems().find(x=>String(x.name||'').trim().toLowerCase()===String(name||'').trim().toLowerCase());
 return Number(saved?.rate)||0
}
let emailPreviewOpen=false;
let undoStack=[];
let cloudPayload=null;
let bibleStore={version:18,activeBibleId:null,bibles:{},vendorLibraryItems:defaultVendorLibraryItems()};
let activeBibleId=new URLSearchParams(location.search).get('bibleId')||null;
let cloudState=configured?'Connecting…':'Saved locally';
let sharedLocation=null;
let sharedLocations=[];
let sharedBudget=null;
let sharedCalendar=null;
let realtimeStop=()=>{};
let bibleSaveTimer=null;
let bibleDirty=false;
let bibleSaving=false;
let bibleSaveQueued=false;
let pendingRemoteRefresh=false;

const state={filter:'all',query:'',expanded:new Set(['security']),activeCategory:'All',openEpisode:'',logistics:null,vendorOrder:[],removedVendorIds:[],removedOrderLocations:[]};
const showId=getShowId();
const queryParams=new URLSearchParams(location.search);
let showProfile={name:queryParams.get('showName')||'Production',season:'',company:'',logo:'',units:[]};
const bibleStoreKey=`taylorScoutBibleStoreV18:${showId||'local'}`;
const bibleDraftKey=`taylorScoutBibleV7:${showId||'local'}`;
let locationId=getLocationId();
const locValue=(key,fallback='')=>sharedLocation?.[key]||fallback;
const fullAddress=()=>[locValue('address',''),[locValue('city',''),locValue('state',''),locValue('postal_code','')].filter(Boolean).join(' ')].filter(Boolean).join(', ');
function defaultLogistics(){const base={name:locValue('location_name','Location TBD'),address:fullAddress(),contact:locValue('contact_name',''),phone:locValue('contact_phone','')};return{set:{...base,uses:'Set / filming area'},basecamp:{name:'Basecamp TBD',address:'',contact:'',phone:'',uses:'Basecamp'},crewParking:{name:'Crew Parking TBD',address:'',contact:'',phone:'',uses:'Crew parking'},catering:{name:'Catering TBD',address:'',contact:'',phone:'',uses:'Catering / meal service'},extras:[]}}
function currentLogistics(){return state.logistics||cloudPayload?.logistics||bibleStore.bibles?.[activeBibleId]?.logistics||defaultLogistics()}
function pushUndoSnapshot(){undoStack.push({html:document.querySelector('#app')?.innerHTML||'',statuses:Object.fromEntries(vendors.map(v=>[v.id,v.status])),openEpisode:state.openEpisode});if(undoStack.length>20)undoStack.shift();updateUndoButton();}
function updateUndoButton(){const b=document.querySelector('#undoAction');if(b)b.disabled=!undoStack.length;}
function undoLast(){const snap=undoStack.pop();if(!snap)return;Object.entries(snap.statuses||{}).forEach(([id,st])=>{const v=vendors.find(x=>x.id===id);if(v)v.status=st});state.openEpisode=snap.openEpisode||'304';document.querySelector('#app').innerHTML=snap.html;bind();updateUndoButton();}
function normalizeEpisode(value=''){const m=String(value).match(/(\d{3})/);return m?m[1]:String(value||'Unassigned').replace(/^Episode\s*/i,'')}
function bibleRecords(){return Object.values(bibleStore?.bibles||{}).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))}
function episodeSidebar(){
 const records=bibleRecords();
 const known=[...(showProfile.units||[]).map(u=>normalizeEpisode(u.name||u.code)),...records.map(b=>normalizeEpisode(b.episodeName||b.episodeId))];
 const episodes=[...new Set(known.filter(Boolean))];
 return episodes.map(ep=>{const open=state.openEpisode===ep;const list=records.filter(b=>normalizeEpisode(b.episodeName||b.episodeId)===ep);return `<div class="episode-group ${open?'open':''}"><button class="episode-row ${open?'active':''}" data-episode="${esc(ep)}"><span>${open?'⌄':'›'} Episode ${esc(ep)}</span><b>${list.length}</b></button><div class="bible-list ${list.length?'':'empty-episode'}">${list.length?list.map(b=>`<button class="bible-link ${b.id===activeBibleId?'active':''}" data-bible-id="${esc(b.id)}"><strong>${esc(b.locationName||b.location?.location_name||'Unnamed location')}</strong><small>${esc(b.setName||b.location?.set_name||'Set TBD')}</small></button>`).join(''):'<span>No Bibles</span>'}</div></div>`}).join('');
}
const categories=['All',...new Set(vendors.map(v=>v.category))];
const guardOptions=Array.from({length:21},(_,i)=>`<option>${i}</option>`).join('');
const qtyOptions=Array.from({length:31},(_,i)=>`<option>${i}</option>`).join('');
const input=(label,value='',type='text')=>`<label class="field"><span>${label}</span><input type="${type}" value="${value}"></label>`;
const select=(label,options,value='')=>`<label class="field"><span>${label}</span><select>${options.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select></label>`;
const scheduleRow=(date='',start='06:00',end='18:00',note='')=>`<div class="repeat-row">${input('Date',date,'date')}${input('Start',start,'time')}${input('End',end,'time')}${input('Area / note',note)}</div>`;

function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));}
function calculateBudgetItem(i){
 if(!i)return 0;
 if(i.calcType==='flat')return +(i.flatAmount||0);
 if(i.calcType==='rateDay')return +(i.days||0)*+(i.dayRate||0);
 if(i.calcType==='hourly'){const p=+(i.people||0),d=+(i.days||0),r=+(i.hourlyRate||0),reg=+(i.regHours||0),ot=+(i.ot15Hours||0),dt=+(i.ot2Hours||0),kit=+(i.kitFee||0);return p*d*(reg*r+ot*r*1.5+dt*r*2)+(i.kitFeeMode==='flat'?kit:p*d*kit)}
 if(i.calcType==='dayRate'){const people=+(i.people||0),days=+(i.days||0),dayRate=+(i.dayRate||0),included=Math.max(+(i.includedHours||12),1),hourlyEquivalent=dayRate/included,base=people*days*dayRate,overtime=people*days*((+(i.ot15Hours||0))*hourlyEquivalent*1.5+(+(i.ot2Hours||0))*hourlyEquivalent*2),kit=+(i.kitFee||0),kitTotal=i.kitFeeMode==='flat'?kit:people*days*kit;return base+overtime+kitTotal}
 if(i.calcType==='vendor'){const base=i.vendorBillingType==='flat'?+(i.units||0)*+(i.vendorFlatRate||0):+(i.units||0)*+(i.weeks||0)*+(i.weeklyRate||0);return base+(+(i.units||0)*+(i.servicesPerUnit||0)*+(i.serviceRate||0))+(+(i.flatAmount||0))}
 return 0;
}
const vendorSectionMap={security:'security',restrooms:'vendors',cleaning:'restoration',bins:'vendors',equipment:'equipment-rentals',catering:'vendors',snake:'vendors',maps:'parking',police:'police',parking:'parking',permits:'permits',power:'heating-ac',support:'site-support-rentals'};
const vendorKeywords={
 security:['security','guard','gaffer','supervisor'],
 restrooms:['restroom','toilet'],
 cleaning:['clean','restoration','power wash','reset'],
 bins:['bin','dumpster','trash','waste'],
 equipment:['equipment','hdr','glowbug','sandbag','handwashing','tent'],
 catering:['catering','lunchbox'],
 snake:['snake','wrangler'],
 maps:['map'],
 police:['police','lapd','chp','traffic control','lane closure'],
 parking:['parking','basecamp'],
 permits:['permit','notification','posting','closure fee'],
 power:['generator','heating','cooling','hvac','electrician','lighting','lights','air conditioning','ac delivery','distro','diesel fuel'],
 support:['site rep','layout','holding','customer displacement','lost revenue','business impact','public control','park monitor','staging']
};
function budgetItemsForVendor(v,page=currentBudgetPage()){
 const keys=vendorKeywords[v.id]||[String(v.title||'').toLowerCase()];
 return (page?.items||[]).filter(i=>{
  const text=`${i.name||''} ${i.vendor||''} ${i.sectionId||''}`.toLowerCase();
  return keys.some(k=>text.includes(k));
 });
}
function budgetVendorIds(page){
 return vendors.filter(v=>budgetItemsForVendor(v,page).some(i=>calculateBudgetItem(i)>0||Number(i.units||0)>0||Number(i.days||0)>0)).map(v=>v.id);
}
function budgetVendorName(items=[]){
 const named=items.find(i=>String(i.vendor||'').trim());
 return named?.vendor||'Vendor not selected';
}
function hydrateVendorTemplatesFromBudget(page){
 resetVendorTemplates();
 const record=cloudPayload||bibleStore.bibles?.[activeBibleId]||{};
 const overrides=record.vendorOverrides||{};
 if(!page){
  vendors.forEach(v=>{if(overrides[v.id])v.vendor=overrides[v.id]});
  return;
 }
 vendors.forEach(v=>{
  const items=budgetItemsForVendor(v,page);
  if(items.length){
   const total=items.reduce((sum,i)=>sum+calculateBudgetItem(i),0);
   v.vendor=overrides[v.id]||budgetVendorName(items);
   v.summary=`${items.length} budgeted item${items.length===1?'':'s'} · ${money(total)} allowance`;
   v.status='working';v.stamp=overrides[v.id]?'Vendor selected in Bible':'Budget imported';v.po='No PO';
  }else if(overrides[v.id])v.vendor=overrides[v.id];
 });
}
function locationForBudget(page){
 const id=page?.sharedLocationId;
 if(id)return sharedLocations.find(x=>String(x.id)===String(id))||null;
 const norm=v=>String(v||'').trim().toLowerCase();
 return sharedLocations.find(x=>normalizeEpisode(x.episode_name||x.episode_id)===normalizeEpisode(page?.episode)&&norm(x.location_name)===norm(page?.location))
   ||sharedLocations.find(x=>normalizeEpisode(x.episode_name||x.episode_id)===normalizeEpisode(page?.episode)&&norm(x.set_name)===norm(page?.setName))
   ||null;
}
function scheduleFromBudget(page={}){
 return{
  prepStart:page.prepStart||'',prepEnd:page.prepEnd||page.prepStart||'',
  holdStart:page.holdStart||'',holdEnd:page.holdEnd||page.holdStart||'',
  shootStart:page.shootStart||'',shootEnd:page.shootEnd||page.shootStart||'',
  strikeStart:page.strikeStart||'',strikeEnd:page.strikeEnd||page.strikeStart||''
 };
}
function securityPlanFromBudget(page){
 const schedule=scheduleFromBudget(page);
 return{version:2,types:structuredClone(SECURITY_DEFAULT_TYPES),assignments:[],savedViews:[{id:'all',name:'All Security',types:[]}],schedule,updatedAt:new Date().toISOString()};
}
function equipmentOrdersFromBudget(page){
 const schedule=scheduleFromBudget(page);
 const items=(page?.items||[]).filter(i=>{
  const text=`${i.name||''} ${i.vendor||''} ${i.sectionId||''}`.toLowerCase();
  return i.calcType==='vendor'&&(text.includes('hdr')||text.includes('equipment-rentals')||text.includes('handwashing')||text.includes('tent')||text.includes('sandbag')||text.includes('glowbug')||text.includes('trash can'));
 }).map(i=>({
  item:String(i.name||'Equipment').replace(/^HDR\s*[—-]\s*/i,'').trim(),
  qty:Number(i.units||1),
  rate:Number(i.vendorFlatRate||i.weeklyRate||i.flatAmount||0)
 }));
 if(!items.length)return[];
 const delivery=(schedule.prepStart||schedule.shootStart)?`${schedule.prepStart||schedule.shootStart}T07:00`:'';
 const pickup=(schedule.strikeEnd||schedule.shootEnd)?`${schedule.strikeEnd||schedule.shootEnd}T17:00`:'';
 return[{location:'set',delivery,pickup,items}];
}
function bibleRecordFromBudget(page,location){
 const id=`location-${location.id}`,relevant=budgetVendorIds(page);
 const logistics={
  set:{name:location.location_name||'Location',address:[location.address,location.city,location.state,location.postal_code].filter(Boolean).join(', '),contact:location.contact_name||'',phone:location.contact_phone||'',uses:'Set / filming area'},
  basecamp:{name:'Basecamp TBD',address:'',contact:'',phone:'',uses:'Basecamp'},
  crewParking:{name:'Crew Parking TBD',address:'',contact:'',phone:'',uses:'Crew parking'},
  catering:{name:'Catering TBD',address:'',contact:'',phone:'',uses:'Catering / meal service'},
  extras:[]
 };
 return{
  version:23,bibleId:id,id,locationId:location.id,location,
  locationName:location.location_name||page.location||'Unnamed location',
  setName:page.setName||location.set_name||'',episodeName:page.episode||location.episode_name||location.episode_id||'',
  createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
  statuses:Object.fromEntries(vendors.map(v=>[v.id,'working'])),
  vendorOrder:relevant,removedVendorIds:vendors.filter(v=>!relevant.includes(v.id)).map(v=>v.id),
  removedOrderLocations:[],logistics,values:[],commitments:{},
  equipmentOrders:equipmentOrdersFromBudget(page),
  securityPlanner:securityPlanFromBudget(page),
  sourceBudgetId:page.id||'',budgetBootstrappedAt:new Date().toISOString()
 };
}
async function bootstrapBiblesFromBudget(){
 const pages=Array.isArray(sharedBudget?.budgets)?sharedBudget.budgets:[];
 let changed=false;
 for(const page of pages){
  const location=locationForBudget(page);
  if(!location)continue;
  const existing=Object.values(bibleStore.bibles||{}).find(b=>String(b.locationId||b.location?.id||'')===String(location.id));
  if(existing)continue;
  const record=bibleRecordFromBudget(page,location);
  bibleStore.bibles[record.id]=record;changed=true;
 }
 if(changed){
  bibleStore.activeBibleId=bibleStore.activeBibleId||Object.keys(bibleStore.bibles)[0]||null;
  localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
  if(configured&&showId)await saveBibleDocument(showId,bibleStore);
 }
 return changed;
}

function currentBudgetPage(){const list=Array.isArray(sharedBudget?.budgets)?sharedBudget.budgets:(Array.isArray(sharedBudget)?sharedBudget:[]);const targetId=sharedLocation?.id||locationId||'';const ep=normalizeEpisode(sharedLocation?.episode_name||sharedLocation?.episode_id||cloudPayload?.episodeName||'');const set=String(sharedLocation?.set_name||cloudPayload?.setName||'').trim().toLowerCase();const loc=String(sharedLocation?.location_name||cloudPayload?.locationName||'').trim().toLowerCase();return list.find(b=>targetId&&b.sharedLocationId===targetId)||list.find(b=>normalizeEpisode(b.episode||'')===ep&&set&&String(b.setName||'').trim().toLowerCase()===set)||list.find(b=>normalizeEpisode(b.episode||'')===ep&&loc&&String(b.location||'').trim().toLowerCase()===loc)||null}
function calendarEventForLocation(){const events=Array.isArray(sharedCalendar?.events)?sharedCalendar.events.filter(e=>e&&e.eventType!=='note'):[],targetId=sharedLocation?.id||locationId||'',episode=normalizeEpisode(sharedLocation?.episode_name||sharedLocation?.episode_id||cloudPayload?.episodeName||''),norm=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' '),set=norm(sharedLocation?.set_name||cloudPayload?.setName||''),locationName=norm(sharedLocation?.location_name||cloudPayload?.locationName||'');return events.find(e=>targetId&&(e.sharedLocationId===targetId||e.locationId===targetId))||events.find(e=>normalizeEpisode(e.episode||'')===episode&&set&&norm(e.set)===set)||events.find(e=>normalizeEpisode(e.episode||'')===episode&&locationName&&norm(e.location)===locationName)||null}
function scheduleForLocation(){const event=calendarEventForLocation();if(event)return{prepStart:event.prepStart||'',prepEnd:event.prepEnd||event.prepStart||'',shootStart:event.shootStart||'',shootEnd:event.shootEnd||event.shootStart||'',holdStart:event.holdStart||'',holdEnd:event.holdEnd||event.holdStart||'',strikeStart:event.strikeStart||'',strikeEnd:event.strikeEnd||event.strikeStart||''};const m=sharedLocation?.metadata?.schedule||{},b=currentBudgetPage()||{};return{prepStart:m.prep_start||b.prepStart||'',prepEnd:m.prep_end||b.prepEnd||m.prep_start||'',shootStart:m.shoot_start||b.shootStart||'',shootEnd:m.shoot_end||b.shootEnd||m.shoot_start||'',holdStart:m.hold_start||b.holdStart||'',holdEnd:m.hold_end||b.holdEnd||m.hold_start||'',strikeStart:m.strike_start||b.strikeStart||'',strikeEnd:m.strike_end||b.strikeEnd||m.strike_start||''}}
function scheduleSignature(sc={}){
 return ['prepStart','prepEnd','holdStart','holdEnd','shootStart','shootEnd','strikeStart','strikeEnd'].map(k=>sc[k]||'').join('|');
}
function calendarScheduleForRecord(record,location){
 const events=Array.isArray(sharedCalendar?.events)?sharedCalendar.events.filter(e=>e&&e.eventType!=='note'):[];
 const targetId=location?.id||record?.locationId||record?.location?.id||'',episode=normalizeEpisode(location?.episode_name||location?.episode_id||record?.episodeName||record?.episodeId||'');
 const norm=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
 const set=norm(location?.set_name||record?.setName||''),locationName=norm(location?.location_name||record?.locationName||'');
 const event=events.find(e=>targetId&&(String(e.sharedLocationId||'')===String(targetId)||String(e.locationId||'')===String(targetId)))
  ||events.find(e=>normalizeEpisode(e.episode||'')===episode&&set&&norm(e.set)===set)
  ||events.find(e=>normalizeEpisode(e.episode||'')===episode&&locationName&&norm(e.location)===locationName);
 if(!event)return null;
 return{prepStart:event.prepStart||'',prepEnd:event.prepEnd||event.prepStart||'',holdStart:event.holdStart||'',holdEnd:event.holdEnd||event.holdStart||'',shootStart:event.shootStart||'',shootEnd:event.shootEnd||event.shootStart||'',strikeStart:event.strikeStart||'',strikeEnd:event.strikeEnd||event.strikeStart||''};
}
function rebasePlannerValuesToCalendar(values=[],sc={}){
 const dt=(date,time)=>date?date+'T'+time:'';
 return (Array.isArray(values)?values:[]).map(item=>{
  const key=String(item.key||'');
  let value=item.value;
  if(key.startsWith('restrooms|')){
    if(key.includes('|Delivery||datetime-local|'))value=dt(sc.prepStart||sc.shootStart,'07:00');
    else if(key.includes('|Pickup||datetime-local|'))value=dt(sc.strikeEnd||sc.shootEnd,'17:00');
    else if(key.includes('|service-row|')&&key.includes('|datetime-local|'))value=dt(sc.shootStart||sc.prepEnd||sc.prepStart,'06:00');
  }else if(key.startsWith('equipment|')){
    if(key.includes('|Shared delivery||datetime-local|'))value=dt(sc.prepStart||sc.shootStart,'07:00');
    else if(key.includes('|Shared pickup||datetime-local|'))value=dt(sc.strikeEnd||sc.shootEnd,'17:00');
  }else if(key.startsWith('catering|')){
    if(key.includes('|Delivery||datetime-local|'))value=dt(sc.shootStart||sc.prepEnd||sc.prepStart,'09:00');
    else if(key.includes('|Pickup||datetime-local|'))value=dt(sc.shootEnd||sc.shootStart||sc.strikeStart,'16:00');
  }else if(key.startsWith('cleaning|')&&key.includes('|Date||date|')){
    value=sc.strikeEnd||sc.strikeStart||sc.shootEnd||sc.shootStart||'';
  }else if(/^(police|parking|permits|power|support)\|/.test(key)){
    if(key.includes('|Start||datetime-local|'))value=dt(sc.prepStart||sc.shootStart,'07:00');
    else if(key.includes('|End||datetime-local|'))value=dt(sc.strikeEnd||sc.shootEnd,'17:00');
  }
  return value===item.value?item:{...item,value};
 });
}
function syncSecurityPlanToCalendar(plan,sc={}){
 if(!plan)return plan;
 const rangeFor=name=>{
  const n=String(name||'').toLowerCase();
  if(n.includes('prep'))return[sc.prepStart,sc.prepEnd];
  if(n.includes('strike')||n.includes('wrap'))return[sc.strikeStart,sc.strikeEnd];
  if(n.includes('hold'))return[sc.holdStart,sc.holdEnd];
  return[sc.shootStart,sc.shootEnd];
 };
 return{...plan,schedule:{...sc},assignments:(plan.assignments||[]).map(a=>{
  if(!(String(a.id||'').startsWith('budget-sec-')||String(a.note||'').includes('Imported from Budget allowance')))return a;
  const [startDate,endDate]=rangeFor(a.name);if(!startDate)return a;
  return{...a,date:startDate,startDate,endDate:endDate||startDate};
 }),updatedAt:new Date().toISOString()};
}
function syncRecordScheduleFromCalendar(record,location){
 const sc=calendarScheduleForRecord(record,location);if(!record||!sc)return{record,changed:false};
 const signature=scheduleSignature(sc),previous=record.calendarScheduleSignature||'';
 if(previous===signature)return{record,changed:false};
 const next={...record,
  calendarSchedule:{...sc},
  productionSchedule:{...sc},
  schedule:{...sc},
  calendarScheduleSignature:signature,
  values:rebasePlannerValuesToCalendar(record.values||[],sc),
  securityPlanner:syncSecurityPlanToCalendar(record.securityPlanner,sc),
  equipmentOrders:(record.equipmentOrders||[]).map(order=>({...order,
    delivery:(sc.prepStart||sc.shootStart)?(sc.prepStart||sc.shootStart)+'T07:00':'',
    pickup:(sc.strikeEnd||sc.shootEnd)?(sc.strikeEnd||sc.shootEnd)+'T17:00':''
  })),
  calendarScheduleSyncedAt:new Date().toISOString()
 };
 return{record:next,changed:true};
}
async function syncAllBibleSchedulesFromCalendar(){
 let changed=false;
 for(const [id,record] of Object.entries(bibleStore.bibles||{})){
  const location=sharedLocations.find(x=>String(x.id)===String(record.locationId||record.location?.id||''))||record.location||null;
  const synced=syncRecordScheduleFromCalendar(record,location);
  if(synced.changed){bibleStore.bibles[id]=synced.record;changed=true}
 }
 if(changed){
  localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
  if(configured&&showId)await saveBibleDocument(showId,bibleStore);
 }
 return changed;
}

function shortScheduleRange(a,b){if(!a)return'—';const f=x=>{const d=new Date(x+'T12:00:00');return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})};return b&&b!==a?`${f(a)}–${new Date(b+'T12:00:00').getDate()}`:f(a)}
function resolvedLogistics(){const raw=currentLogistics();const fixed=['set','basecamp','crewParking','catering'];const resolving=new Set();const resolveRef=(ref)=>{if(!ref)return null;if(ref.startsWith('extra:')){const i=Number(ref.split(':')[1]);return resolveExtra(i)}return fixed.includes(ref)?resolveFixed(ref):null};const merge=(item,source)=>source?{...source,uses:item?.uses||source.uses||'',sameAs:item?.sameAs||''}:{...(item||{})};const resolveFixed=(key)=>{if(resolving.has('f:'+key))return raw[key]||{};resolving.add('f:'+key);const item=raw[key]||{};const out=merge(item,resolveRef(item.sameAs));resolving.delete('f:'+key);return out};const resolveExtra=(i)=>{if(resolving.has('e:'+i))return raw.extras?.[i]||{};resolving.add('e:'+i);const item=raw.extras?.[i]||{};const out={...merge(item,resolveRef(item.sameAs)),label:item.label||''};resolving.delete('e:'+i);return out};return{set:resolveFixed('set'),basecamp:resolveFixed('basecamp'),crewParking:resolveFixed('crewParking'),catering:resolveFixed('catering'),extras:(raw.extras||[]).map((_,i)=>resolveExtra(i))}}
function lockedBudgetFor(v){const page=currentBudgetPage();if(!page)return 0;const keys=vendorKeywords[v.id]||[v.title.toLowerCase()];const matches=(page.items||[]).filter(i=>{const text=`${i.name||''} ${i.vendor||''}`.toLowerCase();return keys.some(k=>text.includes(k))});return matches.reduce((sum,i)=>sum+calculateBudgetItem(i),0)}
function budgetEditor(v){
 const locked=lockedBudgetFor(v);
 return `<section class="budget-panel compare-panel" data-budget-card="${v.id}" data-locked-budget="${locked}">
   <div class="budget-compare">
     <div class="compare-block locked"><small>LOCKED BUDGET</small><strong>${money(locked)}</strong><span>Read-only from Budget</span></div>
     <div class="compare-arrow">→</div>
     <div class="compare-block working"><small>WORKING ORDER</small><strong class="working-total">${money(0)}</strong><span>Updates from Bible details</span></div>
     <div class="compare-block variance"><small>VARIANCE</small><strong class="variance-total">${money(-locked)}</strong><span class="variance-note">Under budget</span></div>
   </div>
   <div class="budget-meta">${input('PO number',v.po.replace('PO ','').replace('No PO',''))}<label class="field"><span>Budget section</span><input value="${v.title}" readonly></label><div class="budget-readonly-note">The Bible can see the approved budget but cannot change it. Ordered totals flow back to Budget as commitments.</div></div>
 </section>`;
}
function vendorOptionsFor(v){
 const map={security:['Security'],restrooms:['Toilets'],cleaning:['Cleaning'],bins:['Trash'],equipment:['Equipment'],catering:['Catering Trailer','Tents / Tables / Chairs'],snake:['Snake Wrangling'],maps:['Map Services']};
 const keys=map[v.id]||[v.title];
 return fullVendorCatalog().filter(x=>keys.some(key=>x.category.includes(key))).map(x=>x.name);
}
function vendorLibrary(){
 const library=ensureVendorLibraryItems();
 const vendorsWithItems=fullVendorCatalog().map(v=>({...v,itemCount:vendorItemsFor(v.name).length}));
 if(!vendorsWithItems.some(v=>v.name===vendorLibrarySelected))vendorLibrarySelected=vendorsWithItems[0]?.name||'';
 const selected=vendorsWithItems.find(v=>v.name===vendorLibrarySelected)||vendorsWithItems[0];
 const items=selected?vendorItemsFor(selected.name):[];
 return `<div class="modal-backdrop ${vendorLibraryOpen?'':'hidden'}" id="vendorLibraryModal"><div class="modal vendor-library-modal"><div class="modal-head"><div><small>${esc([showProfile.name,showProfile.season].filter(Boolean).join(' · '))}</small><h2>Vendor Library</h2><p>Choose a vendor, then manage only that vendor's order items.</p></div><button id="closeVendorLibrary" type="button" aria-label="Close vendor library">×</button></div><div class="vendor-library-workspace"><aside class="vendor-library-vendors"><button type="button" class="primary add-library-vendor">＋ Add Vendor</button><label class="library-vendor-search">⌕<input id="vendorSearch" placeholder="Find vendor"></label><div>${vendorsWithItems.map(v=>`<button type="button" class="library-vendor-button ${v.name===selected?.name?'active':''}" data-vendor-name="${esc(v.name)}" data-vendor-search="${esc(`${v.name} ${v.category}`.toLowerCase())}"><span><small>${esc(v.category)}</small><b>${esc(v.name)}</b></span><em>${v.itemCount}</em></button>`).join('')}</div></aside><section class="vendor-library-editor"><header><div><small>${esc(selected?.category||'VENDOR')}</small><h3>${esc(selected?.name||'Select a vendor')}</h3><p>${esc(selected?.contact||'')}${selected?.phone?' · '+esc(selected.phone):''}</p></div><button class="primary add-library-item" type="button" data-vendor-name="${esc(selected?.name||'')}">＋ Add Item</button></header><label class="library-item-search">⌕<input id="vendorLibrarySearch" placeholder="Search ${esc(selected?.name||'vendor')} items"></label><div class="library-items-head"><span>Item</span><span>Rate</span><span>Billing</span><span></span></div><div class="library-items compact">${items.length?items.map(item=>`<div class="library-item-row" data-library-item="${esc(item.name.toLowerCase())}" data-vendor-name="${esc(selected.name)}" data-item-id="${esc(item.id)}"><input class="library-item-name" value="${esc(item.name)}" aria-label="Item name"><input class="library-item-rate" aria-label="Rate" type="number" min="0" step="0.01" value="${Number(item.rate)||0}"><select class="library-item-billing" aria-label="Billing type"><option value="unit" ${item.billing==='unit'?'selected':''}>Per unit</option><option value="weekly" ${item.billing==='weekly'?'selected':''}>Weekly</option><option value="flat" ${item.billing==='flat'?'selected':''}>Flat</option></select><button class="delete-library-item" type="button" aria-label="Delete ${esc(item.name)}">×</button></div>`).join(''):'<div class="empty-library-items"><b>No items yet</b><span>Click Add Item to create the first one.</span></div>'}</div><footer><span>${items.length} item${items.length===1?'':'s'}</span><span>Changes save automatically</span></footer></section></div></div></div>`;
}

function genericVendorItems(v){
 const selected=String(v?.vendor||'').trim();
 const items=selected?vendorItemsFor(selected):[];
 return items.length?items:[{id:'custom',name:'Custom item',rate:0,billing:'flat'}];
}
function genericOrderRow(v,itemName='',qty=1,rate=null,billing='flat'){
 const library=genericVendorItems(v),chosen=library.find(i=>i.name===itemName)||library[0]||{name:'Custom item',rate:0,billing:'flat'};
 const unitRate=rate==null?Number(chosen.rate||chosen.flatRate||chosen.weeklyRate||0):Number(rate||0);
 const bill=billing||chosen.billing||chosen.billingType||'flat';
 return `<div class="generic-order-row">
   <select class="generic-order-item" aria-label="Order item">
     ${library.map(i=>`<option value="${esc(i.name)}" data-rate="${Number(i.rate||i.flatRate||i.weeklyRate||0)}" data-billing="${esc(i.billing||i.billingType||'flat')}" ${i.name===chosen.name?'selected':''}>${esc(i.name)}</option>`).join('')}
     <option value="__custom__" ${itemName&&!library.some(i=>i.name===itemName)?'selected':''}>Custom item…</option>
   </select>
   <input class="generic-order-custom" placeholder="Custom item description" value="${itemName&&!library.some(i=>i.name===itemName)?esc(itemName):''}" ${itemName&&!library.some(i=>i.name===itemName)?'':'hidden'}>
   <input class="generic-order-qty" type="number" min="0" step="1" value="${Number(qty||1)}" aria-label="Quantity">
   <input class="generic-order-rate" type="number" min="0" step="0.01" value="${unitRate}" aria-label="Unit rate">
   <select class="generic-order-billing" aria-label="Billing">
     <option value="unit" ${bill==='unit'?'selected':''}>Per unit</option>
     <option value="weekly" ${bill==='weekly'?'selected':''}>Weekly</option>
     <option value="flat" ${bill==='flat'?'selected':''}>Flat</option>
   </select>
   <strong class="generic-order-total">${money(Number(qty||1)*unitRate)}</strong>
   <button type="button" class="tiny remove-generic-order" aria-label="Remove item">×</button>
 </div>`;
}
function refreshGenericOrderVendor(detail,v){
 const list=detail?.querySelector('.generic-order-list');if(!list)return;
 const rows=[...list.querySelectorAll('.generic-order-row')];
 if(!rows.length){
   const wrapper=document.createElement('div');wrapper.innerHTML=genericOrderRow(v);list.append(wrapper.firstElementChild);return;
 }
 rows.forEach(row=>{
   const current=row.querySelector('.generic-order-item')?.value||'';
   const custom=row.querySelector('.generic-order-custom')?.value||'';
   const qty=Number(row.querySelector('.generic-order-qty')?.value||1);
   const library=genericVendorItems(v);
   const stillExists=library.some(i=>i.name===current);
   const wrapper=document.createElement('div');
   wrapper.innerHTML=genericOrderRow(v,stillExists?current:'',qty,null,stillExists?(row.querySelector('.generic-order-billing')?.value||'flat'):'flat');
   row.replaceWith(wrapper.firstElementChild);
 });
}
function syncGenericOrderRow(row){
 const item=row?.querySelector('.generic-order-item'),custom=row?.querySelector('.generic-order-custom'),rate=row?.querySelector('.generic-order-rate'),billing=row?.querySelector('.generic-order-billing');
 if(!item)return;
 const selected=item.selectedOptions?.[0];
 const isCustom=item.value==='__custom__';
 if(custom){custom.hidden=!isCustom;if(isCustom)custom.focus()}
 if(!isCustom&&selected){
   if(rate)rate.value=Number(selected.dataset.rate||0);
   if(billing)billing.value=selected.dataset.billing||'flat';
 }
}
function editor(v){
  const sc=scheduleForLocation(),items=budgetItemsForVendor(v),startDate=sc.prepStart||sc.shootStart||'',endDate=sc.strikeEnd||sc.shootEnd||startDate;
  const dt=(date,time)=>date?`${date}T${time}`:'';
  if(v.type==='security'){
    const plan=loadSecurityPlan(),tot=securityTotals(plan);
    const rows=plan.assignments.slice().sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).map(a=>{const type=plan.types.find(x=>x.id===a.typeId),mode=inferSecurityCoverageMode(a),coverage=mode==='24h'?'24-hour coverage · 2 × 12h shifts':securityCoverageLabel(a);return `<div class="security-readonly-row ${mode==='night'?'is-night':mode==='24h'?'is-24h':''}"><span><i style="background:${type?.color||'#64748b'}"></i>${esc(type?.name||'Security')}</span><span>${esc(a.startDate||a.date||'')}${(a.endDate||a.startDate||a.date)!==(a.startDate||a.date)?` → ${esc(a.endDate)}`:''}</span><span>${esc(coverage)}</span><strong>${Number(a.guards||1)} guard${Number(a.guards||1)===1?'':'s'}${mode==='24h'?' / shift':''}</strong><span>${esc(a.name||'')}</span></div>`}).join('');
    return `<div class="custom-editor cost-scope security-readonly" data-cost-type="security"><div class="security-readonly-head"><div><h4>Security Coverage</h4><p>Imported from the location budget and editable in the Security Planner.</p></div></div><div class="security-readonly-kpis"><span><b>${tot.posts}</b> posts</span><span><b>${tot.guards}</b> guard shifts</span><span><b>${Math.round(tot.hours)}</b> guard hours</span><span><b>${money(tot.cost)}</b> est. cost</span></div><div class="security-readonly-list">${rows||'<p class="security-readonly-empty">Budget allowance imported. Add exact guard posts in Security Planner.</p>'}</div></div>`;
  }
  if(v.type==='restrooms'){
    const budgetItem=items.find(i=>/restroom|toilet/i.test(String(i.name||'')))||{};
    const qty=Math.max(1,Number(budgetItem.units||1)),serviceCount=Math.max(0,Number(budgetItem.servicesPerUnit||0));
    const services=Array.from({length:serviceCount},(_,i)=>dt(sc.shootStart||startDate,i?'13:00':'06:00')).filter(Boolean);
    return `<div class="custom-editor cost-scope" data-cost-type="restrooms"><h4>Restrooms by Location</h4>${restroomLocation('Set','set',[[String(qty),'4-room']],services)}<button class="add-row add-restroom-location">＋ Add restroom location</button></div>`;
  }
  if(v.type==='bins') return `<div class="custom-editor cost-scope" data-cost-type="bins"><h4>Bins by Location</h4>${binLocation('Set','set',1,1,1,0,dt(startDate,'08:00'),dt(endDate,'17:00'))}<button class="add-row add-bin-location">＋ Add bin location</button></div>`;
  if(v.type==='catering'){
    const lines=items.map(i=>`<div class="budget-import-line"><span>${esc(i.name||'Budget item')}</span><strong>${money(calculateBudgetItem(i))}</strong></div>`).join('');
    return `<div class="custom-editor cost-scope generic-order-editor catering-order-editor" data-cost-type="catering">
      <section class="generic-budget-reference"><h4>Budgeted Scope <small>LOCKED FROM BUDGET</small></h4><div class="budget-import-list">${lines||'<span>No budgeted catering setup items.</span>'}</div></section>
      <section class="generic-working-order">
        <div class="generic-order-head"><div><h4>Working Order</h4><p>Items below come from the selected vendor’s library.</p></div><button type="button" class="add-row add-generic-order">＋ Add Item</button></div>
        <div class="generic-order-columns"><span>Item</span><span>Custom</span><span>Qty</span><span>Rate</span><span>Billing</span><span>Total</span><span></span></div>
        <div class="generic-order-list"></div>
      </section>
      <div class="repeat-row catering-row">${input('Delivery',dt(sc.shootStart||startDate,'09:00'),'datetime-local')}${input('Pickup',dt(sc.shootEnd||endDate,'16:00'),'datetime-local')}${orderLocationField('catering','catering')}</div>
      <label class="field full"><span>Setup notes</span><textarea placeholder="Tent placement, weights, sidewalls, tables/chairs, install notes, access..."></textarea></label>
    </div>`;
  }
  if(v.type==='schedule') return `<div class="custom-editor cost-scope" data-cost-type="snake"><h4>Coverage Schedule</h4>${scheduleRow(sc.shootStart||startDate,'06:00','18:00','Set coverage')}<button class="add-row">＋ Add shift</button></div>`;
  if(v.type==='maps') return `<div class="custom-editor cost-scope" data-cost-type="maps"><h4>Map Order</h4><div class="map-lines"><div>${select('Quantity',['1','2','3','4','5'],'1')}${select('Type',['Crew','BG','Prep','VIP','Move','Edge Of Zone','Custom'],'Crew')}${input('Custom / notes','')}</div></div><button class="add-row">＋ Add map</button></div>`;
  if(v.type==='equipment'){
    const rows=items.filter(i=>i.calcType==='vendor').map(i=>[String(i.name||'Equipment').replace(/^HDR\s*[—-]\s*/i,''),Math.max(1,Number(i.units||1)),Number(i.vendorFlatRate||i.weeklyRate||i.flatAmount||0)]);
    return `<div class="custom-editor cost-scope" data-cost-type="equipment"><datalist id="equipmentInventory">${equipmentLibraryItems().map(x=>`<option value="${esc(x.name)}"></option>`).join('')}</datalist><h4>Equipment by Location</h4>${equipmentLocation('Set','set',dt(startDate,'07:00'),dt(endDate,'17:00'),rows.length?rows:[['Equipment TBD',1,0]])}<button class="add-row add-equipment-location">＋ Add Order Location</button></div>`;
  }
  if(v.type==='cleaning') return `<div class="custom-editor cost-scope" data-cost-type="cleaning"><h4>Cleaning / Restoration Schedule</h4>${scheduleRow(sc.strikeEnd||sc.strikeStart||endDate,'11:00','14:00','Final cleanup / restoration')}<label class="field full"><span>Instructions</span><textarea></textarea></label><button class="add-row">＋ Add cleaning visit</button></div>`;
  if(v.type==='generic'){
    const lines=items.map(i=>`<div class="budget-import-line"><span>${esc(i.name||'Budget item')}</span><strong>${money(calculateBudgetItem(i))}</strong></div>`).join('');
    const seeded=genericVendorItems(v).filter(i=>Number(i.rate||i.flatRate||i.weeklyRate||0)>0).slice(0,0);
    return `<div class="custom-editor cost-scope generic-order-editor" data-cost-type="${esc(v.id)}">
      <section class="generic-budget-reference"><h4>Budgeted Scope <small>LOCKED FROM BUDGET</small></h4><div class="budget-import-list">${lines||'<span>No budgeted items in this section.</span>'}</div></section>
      <section class="generic-working-order">
        <div class="generic-order-head"><div><h4>Working Order</h4><p>Edit this independently from the locked Budget allowance.</p></div><button type="button" class="add-row add-generic-order">＋ Add Item</button></div>
        <div class="generic-order-columns"><span>Item</span><span>Custom</span><span>Qty</span><span>Rate</span><span>Billing</span><span>Total</span><span></span></div>
        <div class="generic-order-list">${seeded.map(i=>genericOrderRow(v,i.name,1,Number(i.rate||0),i.billing||'flat')).join('')}</div>
      </section>
      <div class="repeat-row">${input('Start',dt(startDate,'07:00'),'datetime-local')}${input('End',dt(endDate,'17:00'),'datetime-local')}</div>
      <label class="field full"><span>Order / coordination notes</span><textarea placeholder="Vendor contact, delivery instructions, confirmation details, special requirements..."></textarea></label>
    </div>`;
  }
  return '';
}
function securityRow(shift,start,end,guards,position,role){return `<div class="security-row"><select class="sec-shift"><option ${shift==='24 Hour'?'selected':''}>24 Hour</option><option ${shift==='Day'?'selected':''}>Day</option><option ${shift==='Night'?'selected':''}>Night</option></select><input class="sec-start" type="datetime-local" value="${start}"><input class="sec-end" type="datetime-local" value="${end}"><select class="sec-guards">${Array.from({length:11},(_,i)=>`<option ${String(i)===guards?'selected':''}>${i}</option>`).join('')}</select><input class="sec-position" value="${position}"><select class="sec-role"><option ${role!=='Supervisor'?'selected':''}>Guard</option><option ${role==='Supervisor'?'selected':''}>Supervisor</option></select><button class="tiny">×</button></div>`}
function orderLogisticsChoices(){const l=resolvedLogistics();return[{ref:'set',label:'Set',item:l.set},{ref:'basecamp',label:'Basecamp',item:l.basecamp},{ref:'crewParking',label:'Crew Parking',item:l.crewParking},{ref:'catering',label:'Catering',item:l.catering},...(l.extras||[]).map((x,i)=>({ref:`extra:${i}`,label:x.label||`Additional area ${i+1}`,item:x}))].filter(x=>x.item)}
function orderAreaByRef(ref){return orderLogisticsChoices().find(x=>x.ref===ref)||orderLogisticsChoices()[0]||null}
function matchOrderLocationRef(value,id=''){const raw=String(value||id||'').toLowerCase().replace(/[^a-z0-9]/g,'');const choices=orderLogisticsChoices();if(id==='base'||raw.includes('base'))return'basecamp';if(raw.includes('crewparking'))return'crewParking';if(raw.includes('catering'))return'catering';if(raw.includes('set'))return'set';return choices.find(x=>x.ref.toLowerCase()===String(value||'').toLowerCase()||String(x.item?.name||'').toLowerCase()===String(value||'').toLowerCase())?.ref||choices[0]?.ref||'set'}
function orderLocationField(value,id=''){const selected=matchOrderLocationRef(value,id),choices=orderLogisticsChoices(),area=choices.find(x=>x.ref===selected)||choices[0];return`<label class="order-location-field"><span>LOCATION LOGISTICS</span><select class="order-location-select">${choices.map(x=>`<option value="${esc(x.ref)}" ${x.ref===area?.ref?'selected':''}>${esc(x.label)} — ${esc(x.item?.name||'Unnamed')}</option>`).join('')}</select><small class="order-location-address">${esc(area?.item?.address||'Address not entered')}</small></label>`}
function syncOrderLocation(group){const select=group?.querySelector('.order-location-select');if(!select)return;const area=orderAreaByRef(select.value),out=group.querySelector('.order-location-address');if(out)out.textContent=area?.item?.address||'Address not entered'}
function restroomLocation(name,id,units,services){if(state.removedOrderLocations.includes(`restrooms:${id}`))return'';const sc=scheduleForLocation(),delivery=(sc.prepStart||sc.shootStart)?`${sc.prepStart||sc.shootStart}T07:00`:'',pickup=(sc.strikeEnd||sc.shootEnd)?`${sc.strikeEnd||sc.shootEnd}T17:00`:'';return `<section class="location-order-group restroom-group" data-location="${id}"><div class="location-group-head"><div>${orderLocationField(name,id)}</div><div>${input('Delivery',delivery,'datetime-local')}${input('Pickup',pickup,'datetime-local')}</div><button class="small-btn danger-action delete-order-location" type="button">Delete Location</button></div><div class="restroom-units">${units.map((u,i)=>`<div class="restroom-unit" data-unit="${id}-${i}">${select('Qty',['0','1','2','3','4','5'],u[0])}${select('Unit type',['4-room','2-room','Single','ADA','Luxury trailer','Custom'],u[1])}<label class="unit-label"><input type="checkbox" checked> Unit ${i+1}</label><button class="tiny remove-restroom-unit" type="button" aria-label="Remove Unit ${i+1}" title="Remove unit">×</button></div>`).join('')}</div><button class="add-row add-restroom-unit">＋ Add unit type</button><div class="service-schedule"><h5>Service Schedule</h5>${services.map((d,i)=>`<div class="service-row"><input type="datetime-local" value="${d}"><div class="service-units"><span>Service:</span>${units.map((u,j)=>`<label><input type="checkbox" checked data-service-unit="${id}-${j}"> Unit ${j+1}</label>`).join('')}<label><input type="checkbox" class="service-all" checked> All</label></div><button class="tiny">×</button></div>`).join('')}<button class="add-row add-restroom-service">＋ Add service</button></div></section>`}
function binLocation(name,id,black,blue,green,roll,delivery,pickup){if(state.removedOrderLocations.includes(`bins:${id}`))return'';return `<section class="location-order-group bin-group" data-location="${id}"><div class="location-group-head"><div>${orderLocationField(name,id)}</div><div>${input('Delivery',delivery,'datetime-local')}${input('Pickup',pickup,'datetime-local')}</div><button class="small-btn danger-action delete-order-location" type="button">Delete Location</button></div><div class="bin-quantities">${[['Black',black],['Blue',blue],['Green',green],['Roll-off',roll]].map(([n,q])=>`<label><span>${n}</span><select data-bin-type="${n}">${Array.from({length:11},(_,i)=>`<option ${i===q?'selected':''}>${i}</option>`).join('')}</select></label>`).join('')}</div><div class="swap-list"><div class="swap-row"><select><option>Swap</option><option>Extra Service</option></select><input type="datetime-local" value="2026-08-03T04:00"><input placeholder="Notes"></div><button class="add-row add-bin-swap">＋ Add swap/service</button></div></section>`}
function equipmentLocation(name,id,delivery,pickup,items){if(state.removedOrderLocations.includes(`equipment:${id}`))return'';return `<section class="location-order-group equipment-group" data-location="${id}"><div class="location-group-head"><div>${orderLocationField(name,id)}</div><div>${input('Shared delivery',delivery,'datetime-local')}${input('Shared pickup',pickup,'datetime-local')}</div><button class="small-btn danger-action delete-order-location" type="button">Delete Location</button></div><div class="equipment-table"><div class="eq-head"><span>Item</span><span>Qty</span><span>Unit Rate</span><span>Total</span><span></span></div>${items.map(([item,qty,rate])=>`<div class="eq-row"><select class="eq-item"><option>${item}</option><option>Table</option><option>Chair</option><option>Pipe and Drape</option><option>Glowbug</option><option>Handwashing Station</option></select><input class="eq-qty" type="number" min="0" value="${qty}"><input class="eq-rate" type="number" min="0" step="0.01" value="${rate}"><strong class="eq-total">${money(qty*rate)}</strong><button class="tiny">×</button></div>`).join('')}</div><button class="add-row add-equipment-row">＋ Add Item</button></section>`}
function logisticCard(label,item){const x=item||{};return `<details class="logistic-card"><summary><small>${label}</small><strong>${esc(x.name||'TBD')}</strong><span>${esc(x.uses||'')}</span></summary><div class="logistic-info"><div><b>Address</b><span>${esc(x.address||'')}</span></div><div><b>Contact</b><span>${esc(x.contact||'')}</span></div><div><b>Phone</b><span>${esc(x.phone||'')}</span></div></div></details>`}
function preparePrintDetails(){document.querySelectorAll('.vendor-card').forEach(c=>{const v=vendors.find(x=>x.id===c.dataset.cardId);const box=c.querySelector('.print-order-details');if(box){const details=collectOrderDetails(c).split('\n').filter(Boolean).map(x=>`<div>${x.replace(/^•\s*/, '• ')}</div>`).join('');box.innerHTML=`<div class="print-vendor-line"><b>${v?.vendor||''}</b><span>${v?.contact||''}</span><span>${v?.po||''}</span></div><div class="print-order-list">${details}</div>`}})}

const SECURITY_DEFAULT_TYPES=[
 {id:'set',name:'Set',color:'#2f80ed',locked:true},
 {id:'basecamp',name:'Base Camp',color:'#17a673',locked:true},
 {id:'crew-parking',name:'Crew Parking',color:'#f0a52b',locked:true},
 {id:'catering',name:'Catering',color:'#8b5cf6',locked:true},
 {id:'trucks',name:'Trucks',color:'#64748b',locked:true}
];
function securityPlanStorageKey(){return `taylorScoutSecurityPlannerV1:${activeBibleId||'default'}`}
function defaultSecurityPlan(){return{version:1,types:structuredClone(SECURITY_DEFAULT_TYPES),assignments:[],savedViews:[{id:'all',name:'All Security',types:[]}],schedule:scheduleForLocation(),updatedAt:new Date().toISOString()}}
function calendarScheduleForSecurity(){try{const match=calendarEventForLocation();if(!match)return scheduleForLocation();return{prepStart:match.prepStart||'',prepEnd:match.prepEnd||match.prepStart||'',holdStart:match.holdStart||'',holdEnd:match.holdEnd||match.holdStart||'',shootStart:match.shootStart||'',shootEnd:match.shootEnd||match.shootStart||'',strikeStart:match.strikeStart||'',strikeEnd:match.strikeEnd||match.strikeStart||''}}catch{return scheduleForLocation()}}
function inferSecurityCoverageMode(a){if(a.coverageMode==='24h'||a.coverageMode==='day'||a.coverageMode==='night')return a.coverageMode;if(String(a.shift||'').toLowerCase().includes('24'))return'24h';if(String(a.shift||'').toLowerCase()==='night')return'night';if(String(a.shift||'').toLowerCase()==='day')return'day';const start=String(a.start||'06:00'),end=String(a.end||'18:00');if(start==='06:00'&&end==='18:00')return'day';if(start==='18:00'&&end==='06:00')return'night';return Number(start.slice(0,2))>=18||Number(start.slice(0,2))<6?'night':'day'}
function normalizeSecurityPlan(value){const base=defaultSecurityPlan(),v=value&&typeof value==='object'?value:{},calendarSchedule=calendarScheduleForSecurity();const types=Array.isArray(v.types)&&v.types.length?v.types:base.types;let assignments=Array.isArray(v.assignments)?v.assignments
 .filter(a=>!(String(a.id||'').startsWith('budget-sec-')||String(a.note||'')==='Imported from Budget allowance'))
 .map(a=>{const startDate=a.startDate||a.date||'',endDate=a.endDate||a.startDate||a.date||'';const role=a.role==='Gaffer'?'Guard':(a.role||'Guard');return{...a,date:startDate,startDate,endDate,role,coverageMode:inferSecurityCoverageMode(a)}}):[];
 // Collapse legacy paired Day + Night entries into one 24-hour coverage item when every identifying field matches.
 const used=new Set(),merged=[];
 for(let i=0;i<assignments.length;i++){if(used.has(i))continue;const a=assignments[i];if(a.coverageMode!=='24h'){const opposite=a.coverageMode==='day'?'night':a.coverageMode==='night'?'day':null;if(opposite){const j=assignments.findIndex((b,idx)=>idx!==i&&!used.has(idx)&&b.coverageMode===opposite&&b.typeId===a.typeId&&String(b.name||'')===String(a.name||'')&&Number(b.guards||1)===Number(a.guards||1)&&b.startDate===a.startDate&&b.endDate===a.endDate&&String(b.role||'Guard')===String(a.role||'Guard'));if(j>=0){used.add(i);used.add(j);merged.push({...a,coverageMode:'24h',start:'06:00',end:'06:00',note:a.note||assignments[j].note||''});continue}}}used.add(i);merged.push(a)}
 assignments=merged;
 return{...base,...v,types,assignments,savedViews:Array.isArray(v.savedViews)?v.savedViews:base.savedViews,schedule:{...base.schedule,...(v.schedule||{}),...(calendarSchedule||{})}}}
function loadSecurityPlan(){try{const embedded=cloudPayload?.securityPlanner||bibleStore.bibles?.[activeBibleId]?.securityPlanner;if(embedded)return normalizeSecurityPlan(embedded);return normalizeSecurityPlan(JSON.parse(localStorage.getItem(securityPlanStorageKey())||'null'))}catch{return defaultSecurityPlan()}}
function saveSecurityPlanLocal(plan){plan.updatedAt=new Date().toISOString();localStorage.setItem(securityPlanStorageKey(),JSON.stringify(plan));if(activeBibleId&&bibleStore.bibles?.[activeBibleId])bibleStore.bibles[activeBibleId].securityPlanner=plan;const v=vendors.find(x=>x.id==='security');if(v)v.summary=securityPlannerSummary(plan);}
function eachDate(start,end){if(!start)return[];const a=new Date(start+'T12:00:00'),b=new Date((end||start)+'T12:00:00'),out=[];if(!isFinite(a)||!isFinite(b))return[];for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1))out.push(d.toISOString().slice(0,10));return out}
function securityScheduleDays(plan){const s=plan.schedule||{};const kinds=[['prep','PREP',s.prepStart,s.prepEnd],['hold','HOLD',s.holdStart,s.holdEnd],['shoot','SHOOT',s.shootStart,s.shootEnd],['strike','STRIKE',s.strikeStart,s.strikeEnd]];const map=new Map();kinds.forEach(([kind,label,a,b])=>eachDate(a,b).forEach(date=>map.set(date,{date,kind,label})));return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date))}
function securityCoverageDates(a){const start=a.startDate||a.date||'',end=a.endDate||start;return eachDate(start,end)}
function securityAssignmentCovers(a,date){return securityCoverageDates(a).includes(date)}
function securityBudgetRates(){const fallback={guard:33,supervisor:36};try{const budget=currentBudgetPage();if(!budget)return fallback;const items=Array.isArray(budget.items)?budget.items:[];const guard=items.find(i=>i.sectionId==='security'&&/guard/i.test(String(i.name||''))&&Number(i.hourlyRate)>0);const supervisor=items.find(i=>i.sectionId==='security'&&/supervisor/i.test(String(i.name||''))&&Number(i.hourlyRate)>0);return{guard:Number(guard?.hourlyRate||fallback.guard),supervisor:Number(supervisor?.hourlyRate||fallback.supervisor)}}catch{return fallback}}
function securityBudgetGuidance(){
 const page=currentBudgetPage(),items=(page?.items||[]).filter(i=>i.sectionId==='security'||/guard|security|supervisor/i.test(String(i.name||'')));
 const rows=items.filter(i=>Number(i.people||0)>0).map(i=>({
  name:String(i.name||'Security'),
  people:Number(i.people||0),
  days:Number(i.days||0),
  regHours:Number(i.regHours||0),
  ot15Hours:Number(i.ot15Hours||0),
  rate:Number(i.hourlyRate||0),
  total:calculateBudgetItem(i)
 }));
 return{
  rows,
  total:rows.reduce((n,r)=>n+r.total,0),
  maxGuards:rows.filter(r=>/guard/i.test(r.name)).reduce((m,r)=>Math.max(m,r.people),0),
  totalGuardDays:rows.filter(r=>/guard/i.test(r.name)).reduce((n,r)=>n+r.people*r.days,0)
 };
}

function securityRateFor(a){const rates=securityBudgetRates();return a.role==='Supervisor'?rates.supervisor:rates.guard}
function secHours(a){if(a.coverageMode==='24h')return 24;const [sh,sm]=String(a.start||'06:00').split(':').map(Number),[eh,em]=String(a.end||'18:00').split(':').map(Number);let h=(eh+em/60)-(sh+sm/60);if(h<=0)h+=24;return h}
function securityShiftCount(a){return a.coverageMode==='24h'?2:1}
function securityOvertimeLabel(a){if(a.coverageMode==='24h')return'';const extra=Math.max(0,secHours(a)-12);return extra>0?` · +${Number.isInteger(extra)?extra:extra.toFixed(1)} OT`:''}
function securityCoverageLabel(a){if(a.coverageMode==='24h')return'24 HR · 2 × 12h shifts';if(a.coverageMode==='night')return`${a.start||'18:00'}–${a.end||'06:00'} · NIGHT${securityOvertimeLabel(a)}`;return`${a.start||'06:00'}–${a.end||'18:00'}${securityOvertimeLabel(a)}`}
function secCost(a){const g=Number(a.guards||1),rate=securityRateFor(a),days=Math.max(1,securityCoverageDates(a).length);if(a.coverageMode==='24h'){const perShift=Math.min(8,12)*rate+Math.max(0,12-8)*rate*1.5;return days*g*2*perShift}const h=secHours(a);return days*g*(Math.min(8,h)*rate+Math.max(0,h-8)*rate*1.5)}
function securityTotals(plan){const hours=plan.assignments.reduce((n,a)=>n+secHours(a)*Number(a.guards||1)*Math.max(1,securityCoverageDates(a).length),0);const cost=plan.assignments.reduce((n,a)=>n+secCost(a),0);const guards=plan.assignments.reduce((n,a)=>n+Number(a.guards||1)*securityShiftCount(a)*Math.max(1,securityCoverageDates(a).length),0);return{hours,cost,guards,posts:plan.assignments.length}}
function securityPlannerSummary(plan=loadSecurityPlan()){const t=securityTotals(plan);return `${t.posts} posts · ${t.guards} guard shifts · ${Math.round(t.hours)} guard hours · ${money(t.cost)}`}
function securityLifecycleClass(kind){return`sec-day-${kind||'none'}`}
function openSecurityPlanner(){
 let plan=loadSecurityPlan(),visibleTypes=new Set(plan.types.map(x=>x.id)),dragState=null;
 const wrap=document.createElement('div');wrap.className='security-planner-backdrop';document.body.appendChild(wrap);document.body.style.overflow='hidden';
 const close=()=>{document.body.style.overflow='';wrap.remove();render()};
 const persist=async(showToastMessage=false)=>{saveSecurityPlanLocal(plan);if(activeBibleId){bibleStore.bibles[activeBibleId]={...(bibleStore.bibles[activeBibleId]||{}),securityPlanner:plan};localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));}if(showToastMessage)showToast('Security plan saved');};
 const clearDragRange=()=>wrap.querySelectorAll('.security-drop-cell.drag-range,.security-drop-cell.drag-over').forEach(c=>c.classList.remove('drag-range','drag-over'));
 const paintDragRange=(a,targetDate)=>{clearDragRange();if(!a||!targetDate)return;const anchor=a.startDate||a.date||targetDate,start=anchor<targetDate?anchor:targetDate,end=anchor<targetDate?targetDate:anchor;wrap.querySelectorAll(`.security-drop-cell[data-type="${CSS.escape(a.typeId)}"]`).forEach(c=>{if(c.dataset.date>=start&&c.dataset.date<=end)c.classList.add('drag-range')})};
 const renderPlanner=()=>{
  const days=securityScheduleDays(plan),tot=securityTotals(plan),budgetGuide=securityBudgetGuidance(),types=plan.types.filter(x=>visibleTypes.has(x.id));
  const dayHeads=days.map(d=>`<div class="security-day-head ${securityLifecycleClass(d.kind)}"><b>${new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})}</b><span>${new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span><small>${d.label}</small></div>`).join('');
  const rows=types.map(type=>`<div class="security-type-label"><span class="security-color-dot" style="background:${type.color}"></span><b>${esc(type.name)}</b><div><button class="sec-filter-type" data-type="${type.id}">Hide</button><button class="sec-delete-type" data-type="${type.id}" title="Delete type">×</button></div></div>${days.map(d=>{const cards=plan.assignments.filter(a=>a.typeId===type.id&&securityAssignmentCovers(a,d.date)).map(a=>`<button draggable="true" class="security-assignment ${a.coverageMode==='night'?'is-night':a.coverageMode==='24h'?'is-24h':''}" data-assignment="${a.id}" style="--post-color:${type.color}"><b>${esc(a.name||type.name)}</b><span>${a.guards||1} guard${Number(a.guards||1)===1?'':'s'}${a.coverageMode==='24h'?' / shift':''} · ${esc(securityCoverageLabel(a))}</span><small>${esc(a.note||'')}</small></button>`).join('');return`<div class="security-drop-cell ${securityLifecycleClass(d.kind)}" data-date="${d.date}" data-type="${type.id}">${cards}<button class="security-add-post" data-date="${d.date}" data-type="${type.id}">＋</button></div>`}).join('')}`).join('');
  const logistics=resolvedLogistics();const mapAddress=encodeURIComponent(logistics.set?.address||fullAddress());
  wrap.innerHTML=`<section class="security-planner-shell"><header class="security-planner-top"><div><small>LOCATION BIBLE · SECURITY</small><h2>Security Planner</h2><p>${esc(locValue('location_name','Location'))}</p></div><div class="security-top-actions"><button class="ghost" id="secOrder">Generate Order</button><button class="ghost" id="secAddType">＋ Post Type</button><button class="primary" id="secSave">Save to Bible</button><button class="icon-close" id="secClose">×</button></div></header><div class="security-kpis"><div><small>PLANNED POSTS</small><strong>${tot.posts}</strong></div><div><small>PLANNED SHIFTS</small><strong>${tot.guards}</strong></div><div><small>PLANNED HOURS</small><strong>${Math.round(tot.hours)}</strong></div><div><small>PLANNED COST · BUDGET RATE</small><strong>${money(tot.cost)}</strong></div></div><div class="security-budget-guide"><div><small>BUDGET GUIDANCE</small><strong>${budgetGuide.maxGuards||0} guards max at one time · ${budgetGuide.totalGuardDays||0} guard-days budgeted · ${money(budgetGuide.total)}</strong><span>Budget is guidance only. The Key builds the actual posts, dates, coverage and map placement.</span></div><div class="security-budget-chips">${budgetGuide.rows.map(r=>`<span><b>${esc(r.name)}</b> ${r.people} × ${r.days} day${r.days===1?'':'s'} · ${money(r.total)}</span>`).join('')||'<span>No security allowance in Budget.</span>'}</div></div><div class="security-planner-body"><section class="security-calendar-panel"><div class="security-filterbar"><b>Coverage Calendar</b><span>Start blank and build the security plan here. Budget guidance above shows the allowance; it does not schedule guards for you. Background colors come from prep / hold / shoot / strike.</span><div class="security-legend">${plan.types.map(x=>`<button class="sec-toggle-legend ${visibleTypes.has(x.id)?'on':''}" data-type="${x.id}"><i style="background:${x.color}"></i>${esc(x.name)}</button>`).join('')}</div></div><div class="security-calendar-scroll"><div class="security-calendar-grid" style="--security-days:${Math.max(1,days.length)}"><div class="security-grid-corner">POST TYPE</div>${dayHeads}${rows||'<div class="security-empty">Add a post type to begin.</div>'}</div></div></section><aside class="security-map-panel"><div class="security-map-head"><div><small>WAYPOINT LAYER</small><h3>Security placement</h3></div><span>Security</span></div><div class="security-map-canvas" id="securityPlannerMap"></div><div class="security-location-legend"><span class="set">★ <b>Set</b></span><span class="basecamp">B <b>Basecamp</b></span><span class="catering">C <b>Catering</b></span><span class="crew">P <b>Crew Parking</b></span><span class="guards"># <b>Guard Post</b></span></div><div class="security-map-help"><b>Guard posts are anchored to the map</b><span>Support areas come from Location Logistics. Guard pins are set from Add/Edit Coverage.</span></div><div class="security-map-posts">${plan.assignments.map((a,i)=>{const type=plan.types.find(x=>x.id===a.typeId);return`<button data-assignment="${a.id}"><i style="background:${type?.color||'#64748b'}">${i+1}</i><span><b>${esc(a.name||type?.name||'Post')}</b><small>${esc(a.startDate||a.date||'')}${(a.endDate||a.startDate||a.date)!==(a.startDate||a.date)?` → ${esc(a.endDate)}`:''}</small></span></button>`}).join('')||'<p>No security posts placed yet.</p>'}</div><p class="security-map-note">This is the Security layer. Waypoint will use the same post records so the layer can be toggled on or off without re-entering them.</p></aside></div></section>`;
  wrap.querySelector('#secClose').onclick=close;wrap.querySelector('#secSave').onclick=async()=>{await persist(true);await saveBible(true);renderPlanner()};wrap.querySelector('#secAddType').onclick=()=>openSecurityTypeEditor(plan,()=>{persist();renderPlanner()});wrap.querySelector('#secOrder').onclick=()=>openSecurityOrderPreview(plan);
  wrap.querySelectorAll('.sec-toggle-legend').forEach(b=>b.onclick=()=>{visibleTypes.has(b.dataset.type)?visibleTypes.delete(b.dataset.type):visibleTypes.add(b.dataset.type);renderPlanner()});
  wrap.querySelectorAll('.sec-delete-type').forEach(b=>b.onclick=()=>{const type=plan.types.find(x=>x.id===b.dataset.type);if(!type)return;if(plan.assignments.some(a=>a.typeId===type.id)&&!confirm(`Delete ${type.name} and its security posts?`))return;plan.assignments=plan.assignments.filter(a=>a.typeId!==type.id);plan.types=plan.types.filter(x=>x.id!==type.id);visibleTypes.delete(type.id);persist();renderPlanner()});
  wrap.querySelectorAll('.security-add-post').forEach(b=>b.onclick=()=>openSecurityAssignmentEditor(plan,{date:b.dataset.date,typeId:b.dataset.type},()=>{persist();renderPlanner()}));
  wrap.querySelectorAll('.security-assignment,.security-map-posts button[data-assignment]').forEach(b=>{b.onclick=()=>{const a=plan.assignments.find(x=>x.id===b.dataset.assignment);if(a)openSecurityAssignmentEditor(plan,a,()=>{persist();renderPlanner()})};b.ondragstart=e=>{const a=plan.assignments.find(x=>x.id===b.dataset.assignment);if(!a)return;dragState={id:a.id};e.dataTransfer.setData('text/security-assignment',a.id);e.dataTransfer.effectAllowed='copy';setTimeout(()=>b.classList.add('is-dragging'),0)};b.ondragend=()=>{dragState=null;clearDragRange();wrap.querySelectorAll('.is-dragging').forEach(x=>x.classList.remove('is-dragging'))}});
  mountSecurityMap(wrap.querySelector('#securityPlannerMap'),plan,resolvedLogistics().set?.address||fullAddress());
  wrap.querySelectorAll('.security-drop-cell').forEach(c=>{c.ondragover=e=>{const id=dragState?.id||e.dataTransfer.getData('text/security-assignment');const a=plan.assignments.find(x=>x.id===id);if(!a||a.typeId!==c.dataset.type)return;e.preventDefault();e.dataTransfer.dropEffect='copy';paintDragRange(a,c.dataset.date)};c.ondragleave=()=>{};c.ondrop=e=>{e.preventDefault();const id=dragState?.id||e.dataTransfer.getData('text/security-assignment');const a=plan.assignments.find(x=>x.id===id);if(!a||a.typeId!==c.dataset.type){clearDragRange();return}const anchor=a.startDate||a.date||c.dataset.date,target=c.dataset.date;a.startDate=anchor<target?anchor:target;a.endDate=anchor<target?target:anchor;a.date=a.startDate;dragState=null;clearDragRange();persist();renderPlanner()}});
 };
 renderPlanner();
}
function openSecurityTypeEditor(plan,onDone){const w=document.createElement('div');w.className='modal-backdrop security-planner-modal-backdrop';w.innerHTML=`<section class="location-modal security-mini-modal"><div class="modal-head"><div><small>SECURITY PLANNER</small><h2>Add post type</h2></div><button class="modal-close">×</button></div><form><div class="modal-grid"><label><span>Name</span><input name="name" required placeholder="Background Catering"></label><label><span>Color</span><input name="color" type="color" value="#ef476f"></label></div><div class="modal-actions"><button type="button" class="ghost cancel">Cancel</button><button class="primary">Add Type</button></div></form></section>`;document.body.append(w);const close=()=>w.remove();w.querySelector('.modal-close').onclick=close;w.querySelector('.cancel').onclick=close;w.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);plan.types.push({id:`custom-${crypto.randomUUID()}`,name:String(f.get('name')).trim(),color:String(f.get('color')||'#ef476f'),locked:false});close();onDone()}}

let securityLeafletPromise=null;
function loadSecurityLeaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(securityLeafletPromise)return securityLeafletPromise;
 securityLeafletPromise=new Promise((resolve,reject)=>{
  if(!document.querySelector('link[data-security-leaflet]')){const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';link.dataset.securityLeaflet='1';document.head.append(link)}
  const existing=document.querySelector('script[data-security-leaflet]');
  if(existing){existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',reject,{once:true});return}
  const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.dataset.securityLeaflet='1';script.onload=()=>resolve(window.L);script.onerror=reject;document.head.append(script)
 });
 return securityLeafletPromise;
}
async function securityMapCenter(plan,address=fullAddress()){
 const placed=(plan?.assignments||[]).find(a=>Number.isFinite(Number(a.mapLat))&&Number.isFinite(Number(a.mapLng)));
 if(placed)return[Number(placed.mapLat),Number(placed.mapLng)];
 address=String(address||fullAddress()).trim();const key='ts_security_geocode_v2_'+address.toLowerCase();try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached?.lat&&cached?.lng)return[cached.lat,cached.lng]}catch{}
 try{const response=await fetch('/api/geocode?q='+encodeURIComponent(address));const row=await response.json();if(response.ok&&Number.isFinite(Number(row.lat))&&Number.isFinite(Number(row.lng))){const point=[Number(row.lat),Number(row.lng)];localStorage.setItem(key,JSON.stringify({lat:point[0],lng:point[1]}));return point}}catch{}
 return null;
}
function securityPinIcon(L,type,index){
 const color=type?.color||'#64748b';return L.divIcon({className:'security-leaflet-icon',html:`<span style="--pin-color:${color}"><b>${index+1}</b></span>`,iconSize:[34,42],iconAnchor:[17,42],popupAnchor:[0,-40]})
}
function securitySetIcon(L){
 return L.divIcon({className:'security-set-icon',html:'<span aria-label="Set location">★</span>',iconSize:[38,38],iconAnchor:[19,19],popupAnchor:[0,-22]})
}
function securityLogisticsIcon(L,kind){
 const config={
  basecamp:{label:'B',name:'Basecamp',color:'#159a93'},
  catering:{label:'C',name:'Catering',color:'#f59e0b'},
  crewParking:{label:'P',name:'Crew Parking',color:'#7c3aed'}
 }[kind]||{label:'•',name:'Support',color:'#64748b'};
 return L.divIcon({className:'security-logistics-icon',html:`<span style="--support-color:${config.color}" aria-label="${config.name}">${config.label}</span>`,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-20]})
}
async function securityAddressPoint(address=fullAddress()){
 address=String(address||'').trim();if(!address)return null;
 const key='ts_security_geocode_v2_'+address.toLowerCase();
 try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached?.lat&&cached?.lng)return[cached.lat,cached.lng]}catch{}
 try{const response=await fetch('/api/geocode?q='+encodeURIComponent(address));const row=await response.json();if(response.ok&&Number.isFinite(Number(row.lat))&&Number.isFinite(Number(row.lng))){const point=[Number(row.lat),Number(row.lng)];localStorage.setItem(key,JSON.stringify({lat:point[0],lng:point[1]}));return point}}catch{}
 return null;
}
async function securitySetPoint(address=fullAddress()){return securityAddressPoint(address)}
async function mountSecurityMap(el,plan,address=fullAddress()){
 if(!el)return;try{
  const L=await loadSecurityLeaflet();if(!el.isConnected)return;
  const center=await securityMapCenter(plan,address);if(!el.isConnected)return;if(!center)throw new Error('Location address could not be mapped');
  const map=L.map(el,{zoomControl:true}).setView(center,17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(map);
  const bounds=[];
  const logistics=resolvedLogistics();
  const setPoint=await securitySetPoint(address);
  if(setPoint&&el.isConnected){
    L.marker(setPoint,{icon:securitySetIcon(L),zIndexOffset:1000}).addTo(map).bindPopup(`<b>★ SET</b><br>${esc(logistics.set?.name||locValue('location_name','Filming location'))}<br>${esc(address||'')}`);
    bounds.push(setPoint);
  }
  const supportPoints=[
    ['basecamp',logistics.basecamp,'B','Basecamp'],
    ['catering',logistics.catering,'C','Catering'],
    ['crewParking',logistics.crewParking,'P','Crew Parking']
  ];
  for(const [kind,item,label,name] of supportPoints){
    if(!item?.address)continue;
    const point=await securityAddressPoint(item.address);
    if(!point||!el.isConnected)continue;
    L.marker(point,{icon:securityLogisticsIcon(L,kind),zIndexOffset:700}).addTo(map)
      .bindPopup(`<b>${label} · ${name}</b><br>${esc(item.name||name)}<br>${esc(item.address||'')}`);
    bounds.push(point);
  }
  (plan.assignments||[]).forEach((a,i)=>{
    if(!Number.isFinite(Number(a.mapLat))||!Number.isFinite(Number(a.mapLng)))return;
    const point=[Number(a.mapLat),Number(a.mapLng)],type=plan.types.find(x=>x.id===a.typeId);
    L.marker(point,{icon:securityPinIcon(L,type,i)}).addTo(map).bindPopup(`<b>${esc(a.name||type?.name||'Security post')}</b><br>${Number(a.guards)||1} guard${Number(a.guards)===1?'':'s'}`);
    bounds.push(point)
  });
  if(bounds.length>1)map.fitBounds(bounds,{padding:[34,34],maxZoom:18});
  else if(setPoint)map.setView(setPoint,17);
  setTimeout(()=>map.invalidateSize(),60)
 }catch{el.innerHTML='<div class="security-map-unavailable">Map could not load. Reopen the planner to try again.</div>'}
}
async function mountSecurityPlacementMap(el,assignment,onChange,address=fullAddress()){
 if(!el)return;
 try{
  const L=await loadSecurityLeaflet();if(!el.isConnected)return;
  const logistics=resolvedLogistics();
  const referencePoints=[];
  const addReference=async(kind,item,label)=>{
   const addr=String(item?.address||'').trim();if(!addr)return;
   const p=await securityAddressPoint(addr);if(!p||!el.isConnected)return;
   const icon=kind==='set'?securitySetIcon(L):securityLogisticsIcon(L,kind);
   L.marker(p,{icon,zIndexOffset:kind==='set'?1000:700,interactive:true})
    .addTo(map)
    .bindPopup(`<b>${kind==='set'?'★':label} · ${esc(kind==='set'?'Set':label)}</b><br>${esc(item?.name||label)}<br>${esc(addr)}`);
   referencePoints.push(p);
  };
  let point=Number.isFinite(Number(assignment.mapLat))&&Number.isFinite(Number(assignment.mapLng))
   ?[Number(assignment.mapLat),Number(assignment.mapLng)]
   :await securityMapCenter({assignments:[]},address);
  if(!el.isConnected)return;
  if(!point)throw new Error('Location address could not be mapped');
  const map=L.map(el).setView(point,18);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(map);

  await addReference('set',logistics.set,'Set');
  await addReference('basecamp',logistics.basecamp,'Basecamp');
  await addReference('catering',logistics.catering,'Catering');
  await addReference('crewParking',logistics.crewParking,'Crew Parking');

  const type={color:'#169a9a'};
  const marker=L.marker(point,{draggable:true,icon:securityPinIcon(L,type,0),zIndexOffset:1200}).addTo(map);
  const setGuardPoint=latlng=>{
   marker.setLatLng(latlng);point=[latlng.lat,latlng.lng];
   onChange({lat:point[0],lng:point[1]});
  };
  marker.on('dragend',()=>setGuardPoint(marker.getLatLng()));
  map.on('click',e=>setGuardPoint(e.latlng));
  onChange({lat:point[0],lng:point[1]});

  const bounds=[...referencePoints,point];
  if(bounds.length>1)map.fitBounds(bounds,{padding:[28,28],maxZoom:18});
  else map.setView(point,18);
  setTimeout(()=>map.invalidateSize(),80);
 }catch{
  el.innerHTML='<div class="security-map-unavailable"><b>Address could not be mapped</b><span>Check the location addresses in Bible details, then reopen coverage.</span></div>';
 }
}
function openSecurityAssignmentEditor(plan,seed,onDone){const existing=seed.id?seed:null;const seedDate=seed.startDate||seed.date||'';const a=existing?{...existing}:{id:crypto.randomUUID(),typeId:seed.typeId,date:seedDate,startDate:seedDate,endDate:seedDate,name:'',guards:1,start:'06:00',end:'18:00',role:'Guard',coverageMode:'day',note:''};a.startDate=a.startDate||a.date||seedDate;a.endDate=a.endDate||a.startDate;a.coverageMode=inferSecurityCoverageMode(a);const placementAddress=resolvedLogistics().set?.address||fullAddress();const w=document.createElement('div');w.className='modal-backdrop security-planner-modal-backdrop';w.innerHTML=`<section class="location-modal security-mini-modal security-coverage-modal"><div class="modal-head"><div><small>SECURITY POST</small><h2>${existing?'Edit':'Add'} coverage</h2></div><button class="modal-close">×</button></div><form><div class="security-coverage-layout"><div class="modal-grid"><label><span>Post type</span><select name="typeId">${plan.types.map(x=>`<option value="${x.id}" ${x.id===a.typeId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label><span>Guards per shift</span><input name="guards" type="number" min="1" value="${a.guards}"></label><label><span>Coverage start</span><input name="startDate" type="date" value="${a.startDate}"></label><label><span>Coverage end</span><input name="endDate" type="date" value="${a.endDate}"></label><label class="wide"><span>Post / placement</span><input name="name" value="${esc(a.name)}" placeholder="Main entrance / generator / street lockup"></label><label><span>Role</span><select name="role"><option ${a.role!=='Supervisor'?'selected':''}>Guard</option><option ${a.role==='Supervisor'?'selected':''}>Supervisor</option></select></label><label><span>Coverage</span><select name="coverageMode" class="sec-coverage-mode"><option value="day" ${a.coverageMode==='day'?'selected':''}>Day</option><option value="night" ${a.coverageMode==='night'?'selected':''}>Night</option><option value="24h" ${a.coverageMode==='24h'?'selected':''}>24 Hour</option></select></label><label class="sec-time-field"><span>Start time</span><input name="start" type="time" value="${a.coverageMode==='24h'?'06:00':a.start}"></label><label class="sec-time-field"><span>End time</span><input name="end" type="time" value="${a.coverageMode==='24h'?'18:00':a.end}"></label><label class="wide"><span>Instructions / position note</span><input name="note" value="${esc(a.note)}" placeholder="Post at driveway; keep generator access clear"></label></div><aside class="security-placement-field"><div><b>Guard post placement</b><span>Reference markers are locked to the addresses saved in Location Logistics. Click the map or drag only the numbered guard pin.</span></div><div class="security-placement-map" id="securityPlacementMap"></div><div class="security-location-legend compact"><span class="set">★ <b>Set</b></span><span class="basecamp">B <b>Basecamp</b></span><span class="catering">C <b>Catering</b></span><span class="crew">P <b>Crew Parking</b></span><span class="guards"># <b>Guard Post</b></span></div></aside></div><div class="security-rate-note">Rates are owned by Budget. A 24-hour post is automatically treated as two 12-hour guard shifts per day.</div><div class="modal-actions">${existing?'<button type="button" class="danger-action delete-sec">Delete Post</button>':''}<button type="button" class="ghost cancel">Cancel</button><button class="primary">Save Post</button></div></form></section>`;document.body.append(w);let placement={lat:Number(a.mapLat),lng:Number(a.mapLng)};mountSecurityPlacementMap(w.querySelector('#securityPlacementMap'),a,p=>placement=p,placementAddress);const close=()=>w.remove(),mode=w.querySelector('.sec-coverage-mode'),syncMode=()=>{const is24=mode.value==='24h',start=w.querySelector('[name=start]'),end=w.querySelector('[name=end]');w.querySelectorAll('.sec-time-field').forEach(x=>x.classList.toggle('is-disabled',is24));start.disabled=is24;end.disabled=is24;if(mode.value==='day'){start.value=start.value||'06:00';end.value=end.value||'18:00'}if(mode.value==='night'){start.value='18:00';end.value='06:00'}};mode.onchange=syncMode;syncMode();w.querySelector('.modal-close').onclick=close;w.querySelector('.cancel').onclick=close;const del=w.querySelector('.delete-sec');if(del)del.onclick=()=>{if(confirm('Delete this security post?')){plan.assignments=plan.assignments.filter(x=>x.id!==a.id);close();onDone()}};w.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);let startDate=String(f.get('startDate')),endDate=String(f.get('endDate'));if(endDate<startDate)[startDate,endDate]=[endDate,startDate];const coverageMode=String(f.get('coverageMode')||'day');let startTime=coverageMode==='24h'?'06:00':String(f.get('start')||'06:00'),endTime=coverageMode==='24h'?'06:00':String(f.get('end')||'18:00');Object.assign(a,{typeId:String(f.get('typeId')),date:startDate,startDate,endDate,name:String(f.get('name')).trim(),guards:Number(f.get('guards')||1),role:String(f.get('role'))==='Supervisor'?'Supervisor':'Guard',coverageMode,start:startTime,end:endTime,note:String(f.get('note')).trim(),mapLat:Number.isFinite(placement.lat)?Number(placement.lat.toFixed(7)):null,mapLng:Number.isFinite(placement.lng)?Number(placement.lng.toFixed(7)):null});delete a.mapX;delete a.mapY;delete a.rate;if(existing)Object.assign(existing,a);else plan.assignments.push(a);close();onDone()}}

function securityVendorMapUrl(){
 const u=new URL(location.href);u.searchParams.set('securityMap','1');return u.toString();
}
function openVendorSecurityMap(plan=loadSecurityPlan()){
 const app=document.querySelector('#app'),address=resolvedLogistics().set?.address||fullAddress(),name=locValue('location_name','Location');
 document.body.className='vendor-security-map-page';
 app.innerHTML=`<main class="vendor-map-sheet"><header><div><small>TAYLOR SCOUT · SECURITY POST MAP</small><h1>${esc(name)}</h1><p>${esc(address)}</p></div><button class="ghost vendor-map-print">Print Map</button></header><section class="vendor-map-layout"><div class="vendor-map-canvas" id="vendorSecurityMap"></div><aside><small>GUARD POST KEY</small><h2>Security placement</h2><div class="vendor-map-key">${plan.assignments.map((a,i)=>{const type=plan.types.find(x=>x.id===a.typeId);return`<div><i style="background:${type?.color||'#64748b'}">${i+1}</i><span><b>${esc(a.name||type?.name||'Security post')}</b><small>${esc(type?.name||'Post')} · ${Number(a.guards)||1} guard${Number(a.guards)===1?'':'s'}</small>${a.note?`<em>${esc(a.note)}</em>`:''}</span></div>`}).join('')||'<p>No posts have been placed.</p>'}</div><p class="vendor-map-note">Numbered pins show the approved security post locations for this order. Contact the Location Manager with placement questions.</p></aside></section></main>`;
 app.querySelector('.vendor-map-print').onclick=()=>window.print();
 mountSecurityMap(app.querySelector('#vendorSecurityMap'),plan,address);
}
function securityOrderText(plan){const days=securityScheduleDays(plan),tot=securityTotals(plan);const lines=[`SECURITY ORDER — ${locValue('location_name','LOCATION')}`,fullAddress(),'',`GUARD COVERAGE: ${tot.guards} guard shifts · ${Math.round(tot.hours)} guard hours`,``];days.forEach(d=>{const list=plan.assignments.filter(a=>securityAssignmentCovers(a,d.date));if(!list.length)return;lines.push(`${d.label} — ${new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}`);list.forEach(a=>{const type=plan.types.find(x=>x.id===a.typeId),role=a.role==='Supervisor'?'Supervisor':'Guard',place=a.name||type?.name||'Post';if(a.coverageMode==='24h')lines.push(`• ${a.guards} ${role}${Number(a.guards)>1?'s':''} PER SHIFT · 24-HOUR COVERAGE · Day 06:00–18:00 / Night 18:00–06:00 · ${place}${a.note?` — ${a.note}`:''}`);else lines.push(`• ${a.guards} ${role}${Number(a.guards)>1?'s':''} · ${a.coverageMode==='night'?'NIGHT · ':''}${a.start}–${a.end}${securityOvertimeLabel(a)} · ${place}${a.note?` — ${a.note}`:''}`)});lines.push('')});lines.push('SECURITY POST MAP:',securityVendorMapUrl(),'','Open the map link to view the numbered guard-post placements.');return lines.join('\n')}
function openSecurityOrderPreview(plan){const w=document.createElement('div');w.className='modal-backdrop security-planner-modal-backdrop';const text=securityOrderText(plan),mapAddress=encodeURIComponent(fullAddress());w.innerHTML=`<section class="location-modal security-order-modal"><div class="modal-head"><div><small>SECURITY ORDER</small><h2>Review before sending</h2></div><button class="modal-close">×</button></div><div class="security-order-grid"><div><textarea class="security-order-text">${esc(text)}</textarea><div class="modal-actions"><button class="ghost open-sec-map">View Shared Map</button><button class="ghost copy-sec-order">Copy</button><button class="primary email-sec-order">Open Email</button></div></div><div><iframe title="Security order street map" src="https://www.google.com/maps?q=${mapAddress}&output=embed" loading="lazy"></iframe><div class="security-order-key">${plan.assignments.map((a,i)=>`<div><b>${i+1}</b><span>${esc(a.name||plan.types.find(x=>x.id===a.typeId)?.name||'Post')} · ${a.guards} guard${Number(a.guards)===1?'':'s'}</span></div>`).join('')}</div></div></div></section>`;document.body.append(w);const close=()=>w.remove();w.querySelector('.modal-close').onclick=close;w.querySelector('.open-sec-map').onclick=()=>window.open(securityVendorMapUrl(),'_blank','noopener');w.querySelector('.copy-sec-order').onclick=async()=>{await navigator.clipboard.writeText(w.querySelector('textarea').value);showToast('Security order copied')};w.querySelector('.email-sec-order').onclick=()=>{const subject=encodeURIComponent(`Security Order — ${locValue('location_name','Location')}`),body=encodeURIComponent(w.querySelector('textarea').value);location.href=`mailto:?subject=${subject}&body=${body}`}}

function printFullBible(){const previous=new Set(state.expanded);const previousTitle=document.title;state.expanded=new Set(vendors.map(v=>v.id));render();requestAnimationFrame(()=>{preparePrintDetails();document.body.classList.add('print-full');document.querySelectorAll('.vendor-card').forEach(c=>c.classList.add('print-expanded'));document.querySelectorAll('.logistic-card').forEach(c=>c.setAttribute('open',''));document.title='';setTimeout(()=>window.print(),120);setTimeout(()=>{document.title=previousTitle;document.body.classList.remove('print-full');state.expanded=previous;render()},900)})}
function render(){
 window.__TS_ACTIVE_LOCATION_ID__=sharedLocation?.id||locationId||cloudPayload?.locationId||cloudPayload?.location?.id||'';
 window.__TS_LOCATION_SCHEDULE__=scheduleForLocation();
 window.dispatchEvent(new CustomEvent('ts-location-schedule-ready',{detail:window.__TS_LOCATION_SCHEDULE__}));
 const activeVendors=vendors.filter(v=>!state.removedVendorIds.includes(v.id));
 const operationPlanners=activeVendors.filter(isOperationPlanner);
 const vendorOrders=activeVendors.filter(v=>!isOperationPlanner(v));
 const order=state.vendorOrder||[],filtered=vendorOrders.filter(v=>(state.filter==='all'||v.status===state.filter)&&(state.activeCategory==='All'||v.category===state.activeCategory)&&`${v.title} ${v.vendor} ${v.summary}`.toLowerCase().includes(state.query.toLowerCase())).sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return(ai<0?9999:ai)-(bi<0?9999:bi)});
 const counts=Object.fromEntries(statusFlow.map(x=>[x,vendorOrders.filter(v=>v.status===x).length]));
 document.querySelector('#app').innerHTML=`<header class="topbar"><button class="brand brand-home" id="hubHome"><span class="ts-logo"><svg viewBox="0 0 74 92" aria-hidden="true"><path class="pin-outline" d="M37 3C18 3 5 17 5 36c0 22 17 40 32 53 15-13 32-31 32-53C69 17 56 3 37 3Z"/><path class="mountain" d="M16 39l15-13 8 7 10-10 12 14-12-8-10 10-8-7-15 7Z"/><path class="road" d="M19 69c12-14 24-18 31-27-3 14-12 22-20 31l7 8-9 2-9-14Z"/><path class="star" d="M21 17l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z"/></svg><span class="ts-wordmark"><b>TAYLOR SCOUT</b><small>PRODUCTION TOOLS</small></span></span></button><strong class="show-header-title">${esc(showProfile.name)}</strong><div class="top-actions"><span class="cloud-status" id="cloudStatus">${cloudState}</span><button class="dark-action undo-action" id="undoAction" disabled>↶ Undo</button><div class="tool-switcher" aria-label="Connected tools"><button class="tool-tab" id="openCalendarTop">Calendar</button><button class="tool-tab" id="openBudgetTop">Budget</button><button class="tool-tab active" id="openBibleTop" aria-current="page">Bible</button></div><button class="dark-action" id="printBibleTop">⎙ Print Full Bible</button><button class="primary" id="saveBible">Save</button></div></header><div class="app-shell"><aside class="sidebar"><div class="side-show"><span>${esc(showProfile.name)}</span><small>LOCATION BIBLES</small></div><button class="new-bible" id="newBible">＋ New Bible</button><div class="side-label">EPISODES</div><div class="episode-nav">${episodeSidebar()}</div><div class="side-bottom"><button id="openVendorLibrary">▦ Vendor Library</button><button id="openBudgetSide">$ Budget</button><button id="allShows">⌂ All Shows</button></div></aside><main class="main"><section class="hero-card"><div><div class="eyebrow">LOCATION BIBLE</div><h1>${locValue('location_name','Location TBD')}</h1><div class="sets">${locValue('set_name','Set TBD')}</div><div class="address">${fullAddress()}</div></div><div class="hero-actions"><button class="ghost" id="editLocation">✎ Edit location</button><button class="danger-action" id="deleteBible">⌫ Delete Bible</button><button class="primary" id="emailOrdersHero">✉ Email orders</button></div></section><section class="schedule-strip">${(()=>{const sc=scheduleForLocation();return `<div><small>PREP</small><strong>${shortScheduleRange(sc.prepStart,sc.prepEnd)}</strong></div><div><small>FILM</small><strong>${shortScheduleRange(sc.shootStart,sc.shootEnd)}</strong></div><div><small>WRAP</small><strong>${shortScheduleRange(sc.strikeStart,sc.strikeEnd)}</strong></div>`})()}<div><small>KEY ASSISTANT</small><strong>${currentBudgetPage()?.keyAssistantLocationManager||'—'}</strong></div><div><small>PRIMARY CONTACT</small><strong>${(()=>{const primary=resolvedLogistics().set||{};return [primary.contact||locValue('contact_name',''),primary.phone||locValue('contact_phone','')].filter(Boolean).join(' · ')})()}</strong></div></section><section class="summary-top"><div><small>LOCATION SUMMARY</small><h3>${locValue('location_name','Location TBD')}</h3><span>${locValue('episode_name',locValue('episode_id','Episode'))} · ${locValue('set_name','Set TBD')}</span></div><div class="top-metrics">${statusFlow.map(st=>`<b class="metric ${st}">${counts[st]||0}<small>${statusLabels[st]}</small></b>`).join('')}</div><div class="summary-actions"><button class="small-btn" id="emailPending">✉ Email pending</button><button class="small-btn" onclick="window.print()">⎙ Print</button><button class="small-btn" id="openBudgetSummary">$ Budget</button></div></section><div class="content-column"><section class="section-card logistics"><div class="section-head"><div><h2>Location Logistics</h2><p>Each operational area has one shared address and contact. Add as many operational areas as the location needs.</p></div><div class="section-actions"><button class="small-btn" id="addLogisticsArea">＋ Add logistics line</button><button class="small-btn" id="editLogistics">✎ Edit</button></div></div><div class="logistics-grid four">${(()=>{const l=resolvedLogistics();const extras=(l.extras||[]).map((x,i)=>logisticCard(x.label||`AREA ${i+1}`,x)).join('');return logisticCard('SET',l.set)+logisticCard('BASECAMP',l.basecamp)+logisticCard('CREW PARKING',l.crewParking)+logisticCard('CATERING',l.catering)+extras})()} </div></section><section class="operations-planning"><div class="section-head"><div><h2>Operations Planning</h2><p>Internal location operations that are not vendor orders.</p></div></div><div class="vendor-list operations-list">${operationPlanners.map(v=>card(v)).join('')}</div></section><section class="vendor-toolbar"><div><h2>Vendor Orders</h2><p>Outside companies and services ordered for this location.</p></div><button class="primary" id="openVendorLibraryFromOrders">＋ Add Vendor</button></section><section class="controls"><div class="status-tabs"><button data-filter="all" class="${state.filter==='all'?'active':''}">All <b>${vendorOrders.length}</b></button>${statusFlow.map(st=>`<button data-filter="${st}" class="${state.filter===st?'active':''}">${statusLabels[st]} <b>${counts[st]||0}</b></button>`).join('')}</div><label class="search">⌕<input id="searchInput" placeholder="Search vendors or orders" value="${state.query}"></label></section><div class="category-tabs">${categories.map(c=>`<button data-category="${c}" class="${state.activeCategory===c?'active':''}">${c}</button>`).join('')}</div><div class="vendor-list">${filtered.map(v=>card(v)).join('')}</div></div></main></div>${vendorLibrary()}`;restoreVendorEditors((cloudPayload||bibleStore.bibles?.[activeBibleId])?.vendorEditors);bind();
}
function vendorPlannerDetail(v){const operation=isOperationPlanner(v);return `<div class="vendor-detail"><div class="card-status-control"><span>${operation?'PLANNING STATUS':'ORDER STATUS'}</span><div class="status-toggle">${statusFlow.map(st=>`<button type="button" data-status="${st}" class="${v.status===st?'active '+st:st}">${statusLabels[st]}</button>`).join('')}</div></div>${operation?'':`<div class="contact-line"><b>${v.vendor}</b><span>${v.contact}</span></div>`}<div class="print-summary"><strong>${v.title}</strong><span>${v.summary}</span><small>${operation?'Internal operations planner':`${v.contact} · ${v.po} · ${v.stamp}`}</small><div class="print-order-details"></div></div>${operation?'':`<div class="vendor-choice">${select('Vendor',vendorOptionsFor(v).length?vendorOptionsFor(v):[v.vendor],v.vendor)}<button class="small-btn open-library">Browse Vendor Library</button></div>`}${v.id==='security'?'<div class="security-planner-entry"><div><small>SECURITY OPERATIONS</small><strong>Plan posts visually across prep, shoot, hold and strike.</strong></div><button class="primary" id="openSecurityPlanner">Open Security Planner</button></div>':''}${budgetEditor(v)}${editor(v)}<div class="vendor-footer"><span>${v.stamp}</span><span>${v.po}</span><div><button class="small-btn danger-action delete-vendor-order" type="button">Delete Vendor Order</button><button class="small-btn save-section">Save section</button></div></div></div>`}
function card(v){return `<article draggable="true" class="vendor-card ${v.status} planner-card" data-card-id="${v.id}"><div class="vendor-summary"><span class="vendor-drag-handle" title="Drag to reorder">⋮⋮</span><span class="status-rail"></span><span class="vendor-main"><small>${v.category}</small><strong>${v.title}</strong><span>${v.vendor}</span></span><span class="vendor-desc">${v.summary}</span><span class="status-badge ${v.status}">${statusLabels[v.status]}</span><button type="button" class="primary open-vendor-planner">Open Planner</button></div><div class="planner-home" hidden>${vendorPlannerDetail(v)}</div></article>`}
function vendorPlannerSchedule(scope,cardId=''){const items=[];scope.querySelectorAll('input[type="datetime-local"],input[type="date"]').forEach(input=>{if(!input.value)return;let label=input.closest('label')?.querySelector('span')?.textContent?.trim()||input.getAttribute('placeholder')||'';const row=input.closest('.service-row,.swap-row,.repeat-row,.location-group-head'),group=input.closest('.location-order-group'),location=group?.querySelector('.order-location-select')?.selectedOptions?.[0]?.textContent?.split(' — ')[0]?.trim()||'';if(!label&&row?.classList.contains('service-row'))label='Service';if(!label&&row?.classList.contains('swap-row'))label=row.querySelector('select')?.value||'Swap / service';if(!label&&row?.classList.contains('repeat-row'))label=cardId==='cleaning'?'Cleaning visit':cardId==='snake'?'Coverage':'Scheduled';if(!label)label='Scheduled';items.push({label,location,value:input.value,date:input.value.slice(0,10)})});return items.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)).slice(0,30)}
function vendorPlannerCalendar(items){if(!items.length)return'<div class="vendor-calendar-empty">Add a delivery, service, cleaning, swap, pickup, or coverage date to begin the schedule.</div>';const dates=items.map(x=>x.date).sort(),start=new Date(dates[0]+'T12:00:00'),last=new Date(dates[dates.length-1]+'T12:00:00'),days=[];for(let d=new Date(start);d<=last&&days.length<14;d.setDate(d.getDate()+1))days.push(d.toISOString().slice(0,10));return days.map(date=>{const d=new Date(date+'T12:00:00'),events=items.filter(x=>x.date===date);return`<div class="vendor-calendar-day ${events.length?'has-events':''}"><div><b>${d.toLocaleDateString('en-US',{weekday:'short'})}</b><span>${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span></div><div class="vendor-calendar-events">${events.length?events.map(x=>`<span><b>${esc(x.label)}</b><small>${x.value.includes('T')?new Date(x.value).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'All day'}${x.location?' · '+esc(x.location):''}</small></span>`).join(''):'<em>No activity</em>'}</div></div>`}).join('')}
function vendorPlannerPreview(detail,v){const details=collectOrderDetails(detail).split('\n').filter(Boolean);return`<div class="live-order-head"><small>LIVE ORDER PREVIEW</small><h3>What the vendor receives</h3><p>This updates as you build the order.</p></div><div class="live-order-sheet"><div class="live-order-title"><b>${esc((sharedLocation?.location_name||'Location').toUpperCase())}</b><span>${esc(v.title.toUpperCase())}</span></div>${details.length?details.map(line=>{const isHead=line===line.toUpperCase()&&!line.startsWith('•')&&line.length<80;return`<div class="${isHead?'order-preview-heading':'order-preview-line'}">${esc(line)}</div>`}).join(''):'<div class="order-preview-empty">Add order details to build the vendor email.</div>'}<div class="live-order-po">${esc(v.po||'PO pending')}</div></div>`}
function preparePlannerLocations(detail){const groups=[...detail.querySelectorAll('.location-order-group')];groups.forEach((group,i)=>{group.classList.add('planner-collapsible-location');group.classList.toggle('planner-location-open',i===0);const head=group.querySelector('.location-group-head');if(!head||head.querySelector('.location-expand-toggle'))return;const button=document.createElement('button');button.type='button';button.className='small-btn location-expand-toggle';button.textContent=i===0?'Close Details':'Edit Order';head.append(button);button.onclick=e=>{e.preventDefault();e.stopPropagation();const opening=!group.classList.contains('planner-location-open');groups.forEach(g=>{g.classList.remove('planner-location-open');const b=g.querySelector('.location-expand-toggle');if(b)b.textContent='Edit Order'});if(opening){group.classList.add('planner-location-open');button.textContent='Close Details'}}});const budget=detail.querySelector('[data-budget-card]');if(budget&&!budget.closest('.planner-budget-drawer')){const drawer=document.createElement('details');drawer.className='planner-budget-drawer';drawer.innerHTML='<summary>Budget comparison & PO</summary>';budget.before(drawer);drawer.append(budget)}}
function vendorPlannerLocations(){const l=resolvedLogistics();return[{label:'Set',item:l.set},{label:'Basecamp',item:l.basecamp},{label:'Crew Parking',item:l.crewParking},{label:'Catering',item:l.catering},...(l.extras||[]).map((item,i)=>({label:item.label||`Area ${i+1}`,item}))].filter(x=>x.item?.address||x.item?.name)}
function syncPlannerDatesFromCalendar(detail,v){
 const sc=scheduleForLocation(),dt=(date,time)=>date?date+'T'+time:'';
 if(!detail||!v)return;
 const setByLabel=(label,value)=>{
  [...detail.querySelectorAll('input[type="datetime-local"],input[type="date"]')].forEach(input=>{
   const text=input.closest('label')?.querySelector('span')?.textContent?.trim()||'';
   if(text===label&&value){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
  });
 };
 if(v.id==='restrooms'){
  setByLabel('Delivery',dt(sc.prepStart||sc.shootStart,'07:00'));
  setByLabel('Pickup',dt(sc.strikeEnd||sc.shootEnd,'17:00'));
  detail.querySelectorAll('.service-row input[type="datetime-local"]').forEach((input,i)=>{
   const value=dt(sc.shootStart||sc.prepEnd||sc.prepStart,i?'13:00':'06:00');if(value)input.value=value;
  });
 }else if(v.id==='equipment'){
  setByLabel('Shared delivery',dt(sc.prepStart||sc.shootStart,'07:00'));
  setByLabel('Shared pickup',dt(sc.strikeEnd||sc.shootEnd,'17:00'));
 }else if(v.id==='catering'){
  setByLabel('Delivery',dt(sc.shootStart||sc.prepEnd||sc.prepStart,'09:00'));
  setByLabel('Pickup',dt(sc.shootEnd||sc.shootStart||sc.strikeStart,'16:00'));
 }else if(v.id==='cleaning'){
  setByLabel('Date',sc.strikeEnd||sc.strikeStart||sc.shootEnd||sc.shootStart);
 }else if(['police','parking','permits','power','support'].includes(v.id)){
  setByLabel('Start',dt(sc.prepStart||sc.shootStart,'07:00'));
  setByLabel('End',dt(sc.strikeEnd||sc.shootEnd,'17:00'));
 }
 window.__TS_LOCATION_SCHEDULE__=sc;
 window.dispatchEvent(new CustomEvent('ts-location-schedule-ready',{detail:sc}));
}
function openVendorPlanner(card){if(!card)return;const v=vendors.find(x=>x.id===card.dataset.cardId);if(!v)return;if(v.id==='security'){openSecurityPlanner();return}const home=card.querySelector('.planner-home'),detail=home?.querySelector('.vendor-detail');if(!home||!detail)return;syncPlannerDatesFromCalendar(detail,v);const vendorSelect=detail.querySelector('.vendor-choice select');const plannerVendor=isOperationPlanner(v)?'':(vendorSelect?.value||v.vendor||'Vendor not selected');if(!isOperationPlanner(v))v.vendor=plannerVendor;const contactLine=detail.querySelector('.contact-line b');if(contactLine)contactLine.textContent=plannerVendor;const locations=vendorPlannerLocations();const wrap=document.createElement('div');wrap.className='vendor-planner-backdrop';wrap.innerHTML=`<section class="vendor-planner-shell" data-vendor-id="${esc(v.id)}" role="dialog" aria-modal="true" aria-labelledby="vendorPlannerTitle"><header class="vendor-planner-top"><div><small>LOCATION BIBLE · ${esc(v.category.toUpperCase())}</small><h2 id="vendorPlannerTitle">${esc(v.title)} Planner</h2><p>${esc(locValue('location_name','Location'))}${isOperationPlanner(v)?' · Internal Operations':` · <span class="planner-vendor-name">${esc(plannerVendor)}</span>`}</p></div><div><button class="ghost planner-generate">Review & Email Order</button><button class="primary planner-save">Save to Bible</button><button class="icon-close planner-close" aria-label="Close">×</button></div></header><div class="vendor-planner-layout"><main class="vendor-planner-work"></main><aside class="vendor-planner-side"><section class="live-order-preview"></section><section class="planner-location-links"><small>ORDER LOCATIONS</small><div class="vendor-planner-locations">${locations.map(x=>`<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.item.address||x.item.name||'')}"><b>${esc(x.label)}</b><span>${esc(x.item.name||'')}</span><small>${esc(x.item.address||'Address not entered')}</small></a>`).join('')}</div></section></aside></div></section>`;document.body.append(wrap);const work=wrap.querySelector('.vendor-planner-work');work.append(detail);preparePlannerLocations(detail);document.body.style.overflow='hidden';
 const refresh=()=>{const previousVendor=v.vendor;const selectedVendor=isOperationPlanner(v)?'':(detail.querySelector('.vendor-choice select')?.value||v.vendor||'Vendor not selected');if(!isOperationPlanner(v)){v.vendor=selectedVendor;if(previousVendor!==selectedVendor)refreshGenericOrderVendor(detail,v);const record=cloudPayload||bibleStore.bibles?.[activeBibleId];if(record){record.vendorOverrides={...(record.vendorOverrides||{}),[v.id]:selectedVendor};if(activeBibleId)bibleStore.bibles[activeBibleId]={...(bibleStore.bibles[activeBibleId]||{}),vendorOverrides:{...(bibleStore.bibles[activeBibleId]?.vendorOverrides||{}),[v.id]:selectedVendor}}}}const headerVendor=wrap.querySelector('.planner-vendor-name');if(headerVendor)headerVendor.textContent=selectedVendor;const contactVendor=detail.querySelector('.contact-line b');if(contactVendor)contactVendor.textContent=selectedVendor;const preview=wrap.querySelector('.live-order-preview');if(preview)preview.innerHTML=vendorPlannerPreview(detail,v)};refresh();
 detail.addEventListener('input',e=>{if(e.target.closest('.generic-order-row'))recalculateCard(wrap);refresh();markBibleDirty()});
 detail.addEventListener('change',e=>{
   const row=e.target.closest('.generic-order-row');
   if(row&&e.target.classList.contains('generic-order-item'))syncGenericOrderRow(row);
   if(row)recalculateCard(wrap);
   refresh();
   if(e.target.closest('.vendor-choice')||row)markBibleDirty();
 });
 detail.addEventListener('click',e=>{
   const add=e.target.closest('.add-generic-order');
   if(add){
     e.preventDefault();
     const list=detail.querySelector('.generic-order-list');
     if(list){const holder=document.createElement('div');holder.innerHTML=genericOrderRow(v);list.append(holder.firstElementChild);recalculateCard(wrap);markBibleDirty()}
     return;
   }
   const remove=e.target.closest('.remove-generic-order');
   if(remove){e.preventDefault();remove.closest('.generic-order-row')?.remove();recalculateCard(wrap);refresh();markBibleDirty();return}
   if(e.target.closest('.add-row,.tiny,.delete-order-location,.remove-restroom-unit'))setTimeout(()=>{refresh();recalculateCard(wrap)},0)
 });
 const close=()=>{home.append(detail);wrap.remove();document.body.style.overflow='';recalculateCard(card)};wrap.querySelector('.planner-close').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};wrap.querySelector('.planner-generate').onclick=()=>{home.append(detail);openEmailPreview(card);work.append(detail)};wrap.querySelector('.planner-save').onclick=async()=>{await saveBible();close();showToast(`${v.title} planner saved`)};const key=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',key);close()}};document.addEventListener('keydown',key);setTimeout(()=>detail.querySelector('input,select,textarea')?.focus(),0)
}
function bind(){
 const undo=document.querySelector('#undoAction');if(undo)undo.onclick=undoLast;updateUndoButton();
 const printTop=document.querySelector('#printBibleTop');if(printTop)printTop.onclick=printFullBible;
 document.querySelectorAll('[onclick="window.print()"]').forEach(b=>b.onclick=printFullBible);
 const heroEmail=document.querySelector('#emailOrdersHero');if(heroEmail)heroEmail.onclick=()=>openEmailPreview(null);
 const sharedParams=()=>{const current=new URLSearchParams(location.search);const out=new URLSearchParams();['show','showId','showName','locationId','episodeId'].forEach(k=>{const v=current.get(k);if(v)out.set(k,v)});if(!out.get('showName'))out.set('showName',showProfile.name||'Production');return out.toString()};
 const openTool=(base)=>{const q=sharedParams();location.href=base+(q?'?'+q:'')};
 const budgetAction=()=>{const page=currentBudgetPage();const current=new URLSearchParams(location.search);const out=new URLSearchParams();['show','showId','showName','episodeId'].forEach(k=>{const v=current.get(k);if(v)out.set(k,v)});if(showId){out.set('show',showId);out.set('showId',showId)}if(sharedLocation?.id||locationId)out.set('locationId',sharedLocation?.id||locationId);if(page?.id)out.set('budgetId',page.id);if(!out.get('showName'))out.set('showName',showProfile.name||'Production');location.href=(import.meta.env.VITE_BUDGET_URL||'https://budget.taylorscout.com')+'?'+out.toString()};
 const calendarAction=()=>openTool(import.meta.env.VITE_CALENDAR_URL||'https://calendar.taylorscout.com');
 const cal=document.querySelector('#openCalendarTop');if(cal)cal.onclick=calendarAction;
 ['#openBudgetTop','#openBudgetSide','#openBudgetSummary'].forEach(id=>{const el=document.querySelector(id);if(el)el.onclick=budgetAction});
 const bibleTop=document.querySelector('#openBibleTop');if(bibleTop)bibleTop.onclick=()=>{};
 const home=document.querySelector('#hubHome');if(home)home.onclick=()=>location.href='https://www.taylorscout.com';
 const allShows=document.querySelector('#allShows');if(allShows)allShows.onclick=()=>location.href='https://www.taylorscout.com';
 const nb=document.querySelector('#newBible');if(nb)nb.onclick=openNewBibleFlow;
 document.querySelectorAll('.episode-row').forEach(b=>b.onclick=()=>{state.openEpisode=state.openEpisode===b.dataset.episode?'':b.dataset.episode;render()});
 document.querySelectorAll('.bible-link[data-bible-id]').forEach(b=>b.onclick=()=>selectBible(b.dataset.bibleId));
 const editLoc=document.querySelector('#editLocation');if(editLoc)editLoc.onclick=openLocationEditor;
 const editLog=document.querySelector('#editLogistics');if(editLog)editLog.onclick=()=>openLogisticsEditor(false); const addLog=document.querySelector('#addLogisticsArea');if(addLog)addLog.onclick=()=>openLogisticsEditor(true);
 const openVendorLibraryModal=(preservePlanner=false)=>{
   vendorLibraryOpen=true;
   const modal=document.querySelector('#vendorLibraryModal');
   if(preservePlanner&&modal){
     modal.classList.remove('hidden');
     modal.classList.add('above-planner');
     document.body.style.overflow='hidden';
     return;
   }
   render();
 };
 const ov=document.querySelector('#openVendorLibrary');if(ov)ov.onclick=()=>openVendorLibraryModal(false);
 const ovOrders=document.querySelector('#openVendorLibraryFromOrders');if(ovOrders)ovOrders.onclick=()=>openVendorLibraryModal(false);
 document.querySelectorAll('.open-library').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();openVendorLibraryModal(!!b.closest('.vendor-planner-shell'))});
 const addLibraryVendor=document.querySelector('.add-library-vendor');if(addLibraryVendor)addLibraryVendor.onclick=e=>{
   e.preventDefault();
   const name=(prompt('Vendor name')||'').trim();if(!name)return;
   if(fullVendorCatalog().some(v=>String(v.name||'').trim().toLowerCase()===name.toLowerCase())){vendorLibrarySelected=name;render();return}
   const category=(prompt('Vendor category','Other Services')||'Other Services').trim()||'Other Services';
   bibleStore.customVendors=[...(bibleStore.customVendors||[]),{category,name,status:'New',contact:'',phone:'',email:'',rates:''}];
   vendorItemsFor(name);
   vendorLibrarySelected=name;
   localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
   if(configured&&showId)saveBibleDocument(showId,bibleStore).catch(console.error);
   markVendorLibraryDirty();
   render();
 };
 const closeVendorLibrary=()=>{
   vendorLibraryOpen=false;
   const modal=document.querySelector('#vendorLibraryModal');
   const planner=document.querySelector('.vendor-planner-backdrop');
   if(modal&&planner){
     modal.classList.add('hidden');
     modal.classList.remove('above-planner');
     document.body.style.overflow='hidden';
     return;
   }
   document.body.style.overflow='';
   render();
 };
 const cv=document.querySelector('#closeVendorLibrary');if(cv){cv.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeVendorLibrary()})}
 const vendorModal=document.querySelector('#vendorLibraryModal');if(vendorModal&&vendorLibraryOpen){document.body.style.overflow='hidden';vendorModal.addEventListener('click',e=>{if(e.target===vendorModal)closeVendorLibrary()})}else{document.body.style.overflow=''}
 const escapeVendorLibrary=e=>{if(e.key==='Escape'&&vendorLibraryOpen){document.removeEventListener('keydown',escapeVendorLibrary);closeVendorLibrary()}};document.addEventListener('keydown',escapeVendorLibrary,{once:false});
 document.querySelectorAll('.library-vendor-button').forEach(btn=>btn.onclick=e=>{
   e.preventDefault();
   const name=btn.dataset.vendorName||'';
   const modal=document.querySelector('#vendorLibraryModal');
   const planner=document.querySelector('.vendor-planner-backdrop');
   const plannerShell=planner?.querySelector('.vendor-planner-shell');
   const fromPlanner=!!(modal?.classList.contains('above-planner')&&plannerShell);
   if(fromPlanner){
     const vendorId=plannerShell.dataset.vendorId||'';
     const vendor=vendors.find(v=>v.id===vendorId);
     const select=plannerShell.querySelector('.vendor-choice select');
     if(select){
       let option=[...select.options].find(o=>o.value===name);
       if(!option){option=document.createElement('option');option.value=name;option.textContent=name;select.appendChild(option)}
       select.value=name;
       select.dispatchEvent(new Event('change',{bubbles:true}));
     }
     if(vendor){
       vendor.vendor=name;
       const record=cloudPayload||bibleStore.bibles?.[activeBibleId];
       if(record){
         record.vendorOverrides={...(record.vendorOverrides||{}),[vendor.id]:name};
         if(activeBibleId)bibleStore.bibles[activeBibleId]={...(bibleStore.bibles[activeBibleId]||{}),vendorOverrides:{...(bibleStore.bibles[activeBibleId]?.vendorOverrides||{}),[vendor.id]:name}};
       }
       const headerVendor=plannerShell.querySelector('.planner-vendor-name');if(headerVendor)headerVendor.textContent=name;
       const contactVendor=plannerShell.querySelector('.contact-line b');if(contactVendor)contactVendor.textContent=name;
       const preview=plannerShell.querySelector('.live-order-preview');
       const detail=plannerShell.querySelector('.vendor-detail');
       if(preview&&detail)preview.innerHTML=vendorPlannerPreview(detail,vendor);
       bibleDirty=true;cloudState='Unsaved vendor selection';updateCloudStatus();
       localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
       if(configured&&showId)saveBible(true).catch(console.error);
     }
     vendorLibrarySelected=name;
     closeVendorLibrary();
     return;
   }
   vendorLibrarySelected=name;
   render();
 });
 const updateLibraryItem=row=>{const items=vendorItemsFor(row.dataset.vendorName),item=items.find(x=>x.id===row.dataset.itemId);if(!item)return;item.name=row.querySelector('.library-item-name')?.value.trim()||'Untitled item';item.rate=Number(row.querySelector('.library-item-rate')?.value)||0;item.billing=row.querySelector('.library-item-billing')?.value||'flat';item.billingType=item.billing==='weekly'?'weekly':'flat';if(item.billingType==='weekly')item.weeklyRate=item.rate;else item.flatRate=item.rate;row.dataset.libraryItem=item.name.toLowerCase();markVendorLibraryDirty()};
 document.querySelectorAll('.library-item-row').forEach(row=>row.querySelectorAll('input,select').forEach(el=>{el.oninput=()=>updateLibraryItem(row);el.onchange=()=>updateLibraryItem(row)}));
 document.querySelectorAll('.add-library-item').forEach(btn=>btn.onclick=e=>{e.preventDefault();const items=vendorItemsFor(btn.dataset.vendorName);items.unshift({id:crypto.randomUUID(),name:'New item',vendor:btn.dataset.vendorName,rate:0,flatRate:0,weeklyRate:0,serviceRate:0,deliveryFee:0,pickupFee:0,billing:'flat',billingType:'flat'});markVendorLibraryDirty();render();setTimeout(()=>document.querySelector('.library-item-name')?.select(),0)});
 document.querySelectorAll('.delete-library-item').forEach(btn=>btn.onclick=e=>{e.preventDefault();const row=btn.closest('.library-item-row'),items=vendorItemsFor(row.dataset.vendorName),index=items.findIndex(x=>x.id===row.dataset.itemId);if(index<0)return;items.splice(index,1);row.remove();markVendorLibraryDirty();const count=document.querySelector('.vendor-library-editor footer span');if(count)count.textContent=`${items.length} item${items.length===1?'':'s'}`;const badge=document.querySelector('.library-vendor-button.active em');if(badge)badge.textContent=String(items.length)});
 const vendorSearch=document.querySelector('#vendorSearch');if(vendorSearch)vendorSearch.oninput=e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('.library-vendor-button').forEach(btn=>btn.style.display=!q||btn.dataset.vendorSearch.includes(q)?'grid':'none')};
 const vls=document.querySelector('#vendorLibrarySearch');if(vls)vls.oninput=e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('.library-item-row').forEach(row=>row.style.display=!q||row.dataset.libraryItem.includes(q)?'grid':'none')};
 document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{const id=b.dataset.toggle;state.expanded.has(id)?state.expanded.delete(id):state.expanded.add(id);render()});
 document.querySelectorAll('.open-vendor-planner').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();openVendorPlanner(b.closest('.vendor-card'))});
 let bibleCardDrag=null;
 document.querySelectorAll('.vendor-card[draggable="true"]').forEach(card=>{card.ondragstart=e=>{if(e.target.closest('input,select,textarea,.vendor-detail')){e.preventDefault();return}bibleCardDrag=card;card.classList.add('card-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/bible-card',card.dataset.cardId)};card.ondragover=e=>{if(!bibleCardDrag||bibleCardDrag===card)return;e.preventDefault();card.classList.add('card-drag-over')};card.ondragleave=()=>card.classList.remove('card-drag-over');card.ondrop=e=>{if(!bibleCardDrag||bibleCardDrag===card)return;e.preventDefault();const list=card.parentElement,before=e.clientY<card.getBoundingClientRect().top+card.offsetHeight/2;list.insertBefore(bibleCardDrag,before?card:card.nextSibling);document.querySelectorAll('.vendor-card').forEach(x=>x.classList.remove('card-drag-over','card-dragging'));state.vendorOrder=[...list.querySelectorAll('.vendor-card')].map(x=>x.dataset.cardId).concat(vendors.map(v=>v.id).filter(id=>![...list.querySelectorAll('.vendor-card')].some(x=>x.dataset.cardId===id)));bibleCardDrag=null;saveBible(true)};card.ondragend=()=>{bibleCardDrag=null;document.querySelectorAll('.vendor-card').forEach(x=>x.classList.remove('card-drag-over','card-dragging'))}});
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;render()});
 document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{state.activeCategory=b.dataset.category;render()});
 const search=document.querySelector('#searchInput');if(search)search.oninput=e=>{state.query=e.target.value;render();requestAnimationFrame(()=>document.querySelector('#searchInput')?.focus())};
 document.querySelectorAll('[data-status]').forEach(b=>b.onclick=async e=>{e.preventDefault();const v=vendors.find(x=>x.id===b.closest('.vendor-card').dataset.cardId);if(!v)return;pushUndoSnapshot();v.status=b.dataset.status;const target=cloudPayload||bibleStore.bibles?.[activeBibleId];if(target)target.statuses={...(target.statuses||{}),[v.id]:v.status};await saveBible(true);render()});
 document.querySelectorAll('.vendor-card input,.vendor-card select,.vendor-card textarea').forEach(el=>{el.addEventListener('input',()=>{recalculateCard(el.closest('.vendor-card'));markBibleDirty()});el.addEventListener('change',()=>{recalculateCard(el.closest('.vendor-card'));markBibleDirty()})});
 document.querySelectorAll('.vendor-card.expanded').forEach(recalculateCard);
 document.querySelectorAll('.service-all').forEach(x=>x.addEventListener('change',e=>e.target.closest('.service-units').querySelectorAll('input:not(.service-all)').forEach(c=>c.checked=e.target.checked)));
 document.querySelectorAll('.order-location-select').forEach(sel=>sel.onchange=()=>{const group=sel.closest('.location-order-group,.catering-row');syncOrderLocation(group);recalculateCard(sel.closest('.vendor-card'))});
 document.querySelectorAll('.location-pill').forEach(b=>b.onclick=e=>{e.preventDefault();b.parentElement.querySelectorAll('.location-pill').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
 document.querySelectorAll('.save-section').forEach(b=>b.onclick=e=>{e.preventDefault();saveBible(true)});
 document.querySelectorAll('.preview-email').forEach(b=>b.onclick=e=>{e.preventDefault();const shell=b.closest('.vendor-planner-shell'),vendorId=shell?.dataset.vendorId,card=b.closest('.vendor-card')||(vendorId?document.querySelector(`.vendor-card[data-card-id="${vendorId}"]`):null);openEmailPreview(card)});
 const planner=document.querySelector('#openSecurityPlanner');if(planner)planner.onclick=e=>{e.preventDefault();openSecurityPlanner()};const plannerInline=document.querySelector('#openSecurityPlannerInline');if(plannerInline)plannerInline.onclick=e=>{e.preventDefault();openSecurityPlanner()};
 const del=document.querySelector('#deleteBible');if(del)del.onclick=()=>deleteBibleRecord();
 const save=document.querySelector('#saveBible');if(save)save.onclick=()=>saveBible(false);
 const ep=document.querySelector('#emailPending');if(ep)ep.onclick=()=>openEmailPreview(null);
 document.querySelectorAll('.equipment-search').forEach(inp=>inp.addEventListener('input',()=>filterEquipment(inp)));
 document.querySelectorAll('.quick-equip').forEach(b=>b.onclick=e=>{e.preventDefault();addEquipmentItem(b.closest('.equipment-group'),b.dataset.item);markBibleDirty()});
 document.querySelectorAll('.add-equipment-row').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addEquipmentItem(b.closest('.equipment-group'),'');markBibleDirty()});
 document.querySelectorAll('.add-equipment-location').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addEquipmentOrderLocation(b.closest('.custom-editor'));markBibleDirty()});
 document.querySelectorAll('.add-bin-swap').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addBinSwap(b);markBibleDirty()});
 document.querySelectorAll('.add-bin-location').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addBinLocation(b.closest('.custom-editor'),b);markBibleDirty()});
 document.querySelectorAll('.add-restroom-location').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addRestroomOrderLocation(b.closest('.custom-editor'),b);markBibleDirty()});
 document.querySelectorAll('.add-restroom-service').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addRestroomService(b);markBibleDirty()});
 document.querySelectorAll('.add-restroom-unit').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();addRestroomUnit(b);markBibleDirty()});
 document.querySelectorAll('.delete-order-location').forEach(b=>b.onclick=async e=>{e.preventDefault();const group=b.closest('.location-order-group'),card=b.closest('.vendor-card');if(!group||!card)return;const locationSelect=group.querySelector('.order-location-select'),name=locationSelect?.selectedOptions?.[0]?.textContent?.trim()||'this location';if(!confirm(`Delete ${name}? This removes the entire location and its scheduled items from this vendor order.`))return;pushUndoSnapshot();const key=`${card.dataset.cardId}:${group.dataset.location}`;state.removedOrderLocations=[...new Set([...state.removedOrderLocations,key])];group.remove();recalculateCard(card);await saveBible(true)});
 document.querySelectorAll('.delete-vendor-order').forEach(b=>b.onclick=async e=>{e.preventDefault();const card=b.closest('.vendor-card'),v=vendors.find(x=>x.id===card?.dataset.cardId);if(!v||!confirm(`Delete ${v.title} from this Bible? This removes the entire vendor order.`))return;pushUndoSnapshot();state.removedVendorIds=[...new Set([...state.removedVendorIds,v.id])];state.expanded.delete(v.id);await saveBible(true);render()});
 document.querySelectorAll('.remove-restroom-unit').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();removeRestroomUnit(b);markBibleDirty()});
 document.querySelectorAll('.tiny:not(.remove-restroom-unit)').forEach(b=>b.onclick=e=>{e.preventDefault();const row=b.closest('.security-row,.service-row,.swap-row,.eq-row');if(row){pushUndoSnapshot();row.remove();recalculateCard(b.closest('.vendor-card'));markBibleDirty()}});
 document.querySelectorAll('.add-row:not(.add-equipment-row):not(.add-equipment-location):not(.add-bin-swap):not(.add-bin-location):not(.add-restroom-location):not(.add-restroom-service):not(.add-restroom-unit)').forEach(b=>b.onclick=e=>{e.preventDefault();pushUndoSnapshot();duplicateRelevantRow(b);markBibleDirty()});
 restoreValues();
}

function wireDynamicOrderRow(row){
 const card=row.closest('.vendor-card');row.querySelectorAll('input,select,textarea').forEach(el=>{el.addEventListener('input',()=>{recalculateCard(card);markBibleDirty()});el.addEventListener('change',()=>{recalculateCard(card);markBibleDirty()})});
 const remove=row.querySelector('.tiny');if(remove)remove.onclick=e=>{e.preventDefault();pushUndoSnapshot();row.remove();recalculateCard(card);markBibleDirty()}
 markBibleDirty();
}
function addBinSwap(button){
 const list=button.closest('.swap-list');if(!list)return;const row=document.createElement('div');row.className='swap-row';row.innerHTML='<select><option>Swap</option><option>Extra Service</option></select><input type="datetime-local"><input placeholder="Notes"><button class="tiny" type="button">×</button>';button.before(row);wireDynamicOrderRow(row);row.querySelector('input[type=datetime-local]')?.focus();recalculateCard(button.closest('.vendor-card'))
}
function addBinLocation(editor,button){
 if(!editor||!button)return;const holder=document.createElement('div');holder.innerHTML=binLocation('New Bin Location',`custom-${Date.now()}`,0,0,0,0,'','');const group=holder.firstElementChild;button.before(group);group.querySelector('.add-bin-swap').onclick=e=>{e.preventDefault();pushUndoSnapshot();addBinSwap(e.currentTarget)};group.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',()=>recalculateCard(editor.closest('.vendor-card')));el.addEventListener('change',()=>recalculateCard(editor.closest('.vendor-card')))});group.querySelector('.location-group-head input')?.select();recalculateCard(editor.closest('.vendor-card'))
}
function addRestroomOrderLocation(editor,button){
 if(!editor||!button)return;const holder=document.createElement('div');holder.innerHTML=restroomLocation('New Restroom Location',`custom-${Date.now()}`,[['0','4-room']],[]);const group=holder.firstElementChild;button.before(group);group.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',()=>recalculateCard(editor.closest('.vendor-card')));el.addEventListener('change',()=>recalculateCard(editor.closest('.vendor-card')))});group.querySelector('.add-restroom-service').onclick=e=>{e.preventDefault();pushUndoSnapshot();addRestroomService(e.currentTarget)};group.querySelector('.add-restroom-unit').onclick=e=>{e.preventDefault();pushUndoSnapshot();addRestroomUnit(e.currentTarget)};group.querySelector('.location-group-head input')?.select();recalculateCard(editor.closest('.vendor-card'))
}

function addRestroomService(button){
 const group=button.closest('.restroom-group'),schedule=button.closest('.service-schedule');if(!group||!schedule)return;const units=[...group.querySelectorAll('.restroom-unit')];const row=document.createElement('div');row.className='service-row';row.innerHTML=`<input type="datetime-local"><div class="service-units"><span>Service:</span>${units.map((u,i)=>`<label><input type="checkbox" checked data-service-unit="${group.dataset.location}-${i}"> Unit ${i+1}</label>`).join('')}<label><input type="checkbox" class="service-all" checked> All</label></div><button class="tiny" type="button">×</button>`;button.before(row);const all=row.querySelector('.service-all');all.onchange=e=>row.querySelectorAll('.service-units input:not(.service-all)').forEach(c=>c.checked=e.target.checked);wireDynamicOrderRow(row);row.querySelector('input[type=datetime-local]')?.focus();recalculateCard(group.closest('.vendor-card'))
}
function addRestroomUnit(button){
 const group=button.closest('.restroom-group'),list=group?.querySelector('.restroom-units');if(!group||!list)return;const index=list.querySelectorAll('.restroom-unit').length,id=`${group.dataset.location}-${Date.now()}`,row=document.createElement('div');row.className='restroom-unit';row.dataset.unit=id;row.innerHTML=`<label class="field"><span>Qty</span><select><option selected>0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label><label class="field"><span>Unit type</span><select><option>4-room</option><option>2-room</option><option>Single</option><option>ADA</option><option>Luxury trailer</option><option>Custom</option></select></label><label class="unit-label"><input type="checkbox" checked> Unit ${index+1}</label><button class="tiny remove-restroom-unit" type="button" aria-label="Remove Unit ${index+1}" title="Remove unit">×</button>`;list.append(row);group.querySelectorAll('.service-units').forEach(box=>{const all=box.querySelector('label:last-child');const label=document.createElement('label');label.innerHTML=`<input type="checkbox" checked data-service-unit="${id}"> Unit ${index+1}`;box.insertBefore(label,all)});wireDynamicOrderRow(row);const remove=row.querySelector('.remove-restroom-unit');if(remove)remove.onclick=e=>{e.preventDefault();pushUndoSnapshot();removeRestroomUnit(remove)};recalculateCard(group.closest('.vendor-card'))
}
function removeRestroomUnit(button){
 const group=button.closest('.restroom-group'),row=button.closest('.restroom-unit');if(!group||!row)return;const units=[...group.querySelectorAll('.restroom-unit')],index=units.indexOf(row);if(index<0)return;
 group.querySelectorAll('.service-units').forEach(box=>{const labels=[...box.querySelectorAll('label')].filter(label=>!label.querySelector('.service-all'));labels[index]?.remove()});row.remove();
 [...group.querySelectorAll('.restroom-unit')].forEach((unit,i)=>{const label=unit.querySelector('.unit-label'),input=label?.querySelector('input'),remove=unit.querySelector('.remove-restroom-unit');if(label&&input){label.replaceChildren(input,document.createTextNode(` Unit ${i+1}`))}if(remove){remove.setAttribute('aria-label',`Remove Unit ${i+1}`);remove.title='Remove unit'}});
 group.querySelectorAll('.service-units').forEach(box=>{[...box.querySelectorAll('label')].filter(label=>!label.querySelector('.service-all')).forEach((label,i)=>{const input=label.querySelector('input');if(input){input.dataset.serviceUnit=`${group.dataset.location}-${i}`;label.replaceChildren(input,document.createTextNode(` Unit ${i+1}`))}})});recalculateCard(group.closest('.vendor-card'))
}
function hoursBetween(a,b){const s=new Date(a),e=new Date(b);return isFinite(s)&&isFinite(e)?Math.max(0,(e-s)/36e5):0}
function recalculateCard(card){if(!card)return;const panel=card.querySelector('[data-budget-card]');if(!panel)return;const id=panel.dataset.budgetCard;let total=0;
 if(id==='security'){total=securityTotals(loadSecurityPlan()).cost}
 else if(id==='restrooms'){card.querySelectorAll('.restroom-unit').forEach(u=>{const q=+u.querySelector('select').value,t=u.querySelectorAll('select')[1].value;total+=q*({'4-room':1000,'2-room':700,'Single':250,'ADA':325,'Luxury trailer':2500,'Custom':0}[t]||0)});card.querySelectorAll('.service-row').forEach(r=>{const checked=[...r.querySelectorAll('.service-units input:not(.service-all)')].filter(x=>x.checked).length;total+=checked*175})}
 else if(id==='bins'){card.querySelectorAll('[data-bin-type]').forEach(s=>{const rates={'Black':175,'Blue':175,'Green':175,'Roll-off':650};total+=+s.value*rates[s.dataset.binType]});total+=card.querySelectorAll('.swap-row').length*175}
 else if(id==='equipment'){card.querySelectorAll('.eq-row').forEach(r=>{const q=+r.querySelector('.eq-qty').value||0,rate=+r.querySelector('.eq-rate').value||0,sub=q*rate;total+=sub;const out=r.querySelector('.eq-total');if(out)out.textContent=money(sub)})}
 else if(id==='catering'){
   const rows=card.querySelectorAll('.generic-order-row');
   if(rows.length)rows.forEach(r=>{const q=+r.querySelector('.generic-order-qty')?.value||0,rate=+r.querySelector('.generic-order-rate')?.value||0,sub=q*rate;total+=sub;const out=r.querySelector('.generic-order-total');if(out)out.textContent=money(sub)});
   else total=0;
 }
 else if(id==='snake'){card.querySelectorAll('.repeat-row').forEach(r=>{const ins=r.querySelectorAll('input');if(ins.length>=3)total+=hoursBetween(`${ins[0].value}T${ins[1].value}`,`${ins[0].value}T${ins[2].value}`)*50.41})}
 else if(id==='maps'){card.querySelectorAll('.map-lines>div').forEach(r=>total+=(+r.querySelector('select').value||0)*90)}
 else if(id==='cleaning'){card.querySelectorAll('.repeat-row').forEach(r=>{const ins=r.querySelectorAll('input');if(ins.length>=3)total+=hoursBetween(`${ins[0].value}T${ins[1].value}`,`${ins[0].value}T${ins[2].value}`)*75})}
 else if(['power','police','parking','permits','support'].includes(id)){card.querySelectorAll('.generic-order-row').forEach(r=>{const q=+r.querySelector('.generic-order-qty')?.value||0,rate=+r.querySelector('.generic-order-rate')?.value||0,sub=q*rate;total+=sub;const out=r.querySelector('.generic-order-total');if(out)out.textContent=money(sub)})}
 const locked=+panel.dataset.lockedBudget||0,diff=total-locked;panel.querySelector('.working-total').textContent=money(total);panel.querySelector('.variance-total').textContent=money(Math.abs(diff));panel.querySelector('.variance-total').classList.toggle('over',diff>0);panel.querySelector('.variance-note').textContent=diff>0?'Over budget':'Under budget';}
function fieldPersistenceKey(el){const card=el.closest?.('.vendor-card'),planner=el.closest?.('.vendor-planner-shell'),cardId=card?.dataset?.cardId||planner?.dataset?.vendorId||'global',group=el.closest?.('.location-order-group'),groupId=group?.dataset?.location||group?.querySelector?.('.location-pill.active')?.textContent?.trim()||'',row=el.closest?.('.security-row,.service-row,.swap-row,.repeat-row,.eq-row,.restroom-unit'),rowClass=row?[...row.classList].find(c=>/row|unit/.test(c))||'row':'',rowIndex=row&&row.parentElement?[...row.parentElement.children].filter(x=>x.classList?.contains(rowClass)).indexOf(row):-1,label=el.closest?.('label')?.querySelector?.('span')?.textContent?.trim()||el.getAttribute?.('aria-label')||el.getAttribute?.('placeholder')||'',cls=[...(el.classList||[])].filter(c=>!['active','over'].includes(c)).sort().join('.'),type=el.getAttribute?.('type')||el.tagName?.toLowerCase()||'',same=[...((el.parentElement?.querySelectorAll?.('input,select,textarea'))||[])].filter(x=>([...(x.classList||[])].sort().join('.')===cls)&&(x.getAttribute?.('type')||x.tagName?.toLowerCase())===type),localIndex=Math.max(0,same.indexOf(el));return[cardId,groupId,rowClass,rowIndex,label,cls,type,localIndex].map(x=>String(x??'').replace(/[|]/g,'/')).join('|')}
function captureFormValues(){return[...document.querySelectorAll('input,select,textarea')].filter(el=>!el.closest('#vendorLibraryModal')).map(el=>({key:fieldPersistenceKey(el),value:el.value,checked:el.checked,type:el.type}))}
function captureVendorEditors(){return Object.fromEntries(vendors.map(v=>{const root=document.querySelector(`.vendor-planner-shell[data-vendor-id="${v.id}"] .custom-editor`)||document.querySelector(`.vendor-card[data-card-id="${v.id}"] .custom-editor`);return[v.id,root?.innerHTML||'']}).filter(([,html])=>html))}
function restoreVendorEditors(saved){if(!saved||typeof saved!=='object')return;Object.entries(saved).forEach(([id,html])=>{if(typeof html!=='string'||!html)return;const root=document.querySelector(`.vendor-card[data-card-id="${id}"] .custom-editor`);if(root)root.innerHTML=html})}
function restoreFormValues(values){if(!Array.isArray(values))return;const els=[...document.querySelectorAll('input,select,textarea')],byKey=new Map(els.map(el=>[fieldPersistenceKey(el),el]));values.forEach(x=>{const el=x.key?byKey.get(x.key):els[x.i];if(!el)return;if(x.type==='checkbox'||x.type==='radio')el.checked=!!x.checked;else el.value=x.value??''})}
function collectBiblePayload(){
 const commitments={};
 document.querySelectorAll('.vendor-card').forEach(card=>{
  const id=card.dataset.cardId;if(state.removedVendorIds.includes(id))return;const planner=document.querySelector(`.vendor-planner-shell[data-vendor-id="${id}"]`),panel=planner?.querySelector('[data-budget-card]')||card.querySelector('[data-budget-card]'),vendor=vendors.find(v=>v.id===id);
  const amount=panel?Number((panel.querySelector('.working-total')?.textContent||'0').replace(/[^0-9.-]/g,'')):0;
  commitments[id]={key:id,title:vendor?.title||id,vendor:vendor?.vendor||'',sectionId:vendorSectionMap[id]||'vendors',status:vendor?.status||'working',amount,workingTotal:amount,lockedBudget:lockedBudgetFor(vendor||{id,title:id}),po:(planner?.querySelector('.budget-meta input')||card.querySelector('.budget-meta input'))?.value||'',locationId:sharedLocation?.id||locationId||null,updatedAt:new Date().toISOString()}
 });
 return{version:23,bibleId:activeBibleId,removedVendorIds:[...state.removedVendorIds],removedOrderLocations:[...state.removedOrderLocations],logistics:currentLogistics(),vendorEditors:captureVendorEditors(),equipmentOrders:collectEquipmentOrders(),locationId:sharedLocation?.id||locationId||null,location:sharedLocation,locationName:sharedLocation?.location_name||'Unnamed location',setName:sharedLocation?.set_name||'',episodeName:sharedLocation?.episode_name||sharedLocation?.episode_id||'',updatedAt:new Date().toISOString(),statuses:Object.fromEntries(vendors.map(v=>[v.id,v.status])),vendorOrder:(state.vendorOrder?.length?state.vendorOrder:vendors.map(v=>v.id)),vendorOverrides:{...((cloudPayload||bibleStore.bibles?.[activeBibleId])?.vendorOverrides||{})},values:captureFormValues(),commitments,securityPlanner:loadSecurityPlan()}
}

async function deleteBibleRecord(){
 const record=bibleStore.bibles?.[activeBibleId];
 const name=record?.locationName||sharedLocation?.location_name||'this location bible';
 if(!confirm(`Delete ${name}? This permanently removes this Bible and cannot be undone.`))return;
 if(activeBibleId)delete bibleStore.bibles[activeBibleId];
 const nextId=Object.keys(bibleStore.bibles||{})[0]||null;
 bibleStore.activeBibleId=nextId;activeBibleId=nextId;
 localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
 try{if(configured&&showId)await saveBibleDocument(showId,bibleStore)}catch(e){console.error('Delete Bible sync failed',e)}
 if(nextId){selectBible(nextId)}else{cloudPayload=null;sharedLocation=null;locationId='';state.logistics=defaultLogistics();state.removedVendorIds=[];state.removedOrderLocations=[];resetVendorStatuses();}
 render();
}

function markBibleDirty(){
 bibleDirty=true;
 cloudState='Unsaved changes';
 updateCloudStatus();
 clearTimeout(bibleSaveTimer);
 bibleSaveTimer=setTimeout(()=>saveBible(true,true),650);
}
async function saveBible(sectionOnly=false,silent=false){
 clearTimeout(bibleSaveTimer);
 if(bibleSaving){bibleSaveQueued=true;return false}
 bibleSaving=true;
 const data=collectBiblePayload();
 if(!activeBibleId)activeBibleId=data.bibleId=crypto.randomUUID();
 bibleStore.bibles[activeBibleId]={...(bibleStore.bibles[activeBibleId]||{}),...data,id:activeBibleId,createdAt:bibleStore.bibles[activeBibleId]?.createdAt||new Date().toISOString()};
 bibleStore.activeBibleId=activeBibleId;
 localStorage.setItem(bibleStoreKey,JSON.stringify(bibleStore));
 localStorage.setItem(bibleDraftKey,JSON.stringify(data));
 cloudPayload=data;
 const btn=document.querySelector('#saveBible');if(btn)btn.textContent='Saving…';
 let saved=false;
 try{if(configured&&showId){const session=await getSession();if(!session)throw new Error('Not signed in');const result=await saveBibleDocument(showId,bibleStore);if(result?.conflicts?.length)throw new Error('This Bible changed in another session. Your edits are still here; reload before saving again.');cloudState='Connected · saved'}else cloudState='Saved locally';bibleDirty=false;saved=true;if(btn)btn.textContent='✓ Saved'}catch(e){console.error('Bible save failed',e);bibleDirty=true;cloudState=`Sync error: ${e.message||'save failed'}`;if(btn)btn.textContent='Save'}
 bibleSaving=false;
 updateCloudStatus();setTimeout(()=>{if(btn)btn.textContent='Save'},1200);
 if(sectionOnly&&!silent){const n=document.createElement('div');n.className='toast';n.textContent=saved?'Section saved':cloudState;document.body.append(n);setTimeout(()=>n.remove(),1800)}
 if(bibleSaveQueued){bibleSaveQueued=false;setTimeout(()=>saveBible(true,true),0)}
 else if(pendingRemoteRefresh&&saved){pendingRemoteRefresh=false;setTimeout(()=>refreshSharedData(true),0)}
 return saved;
}
function applyPayload(data){if(!data)return;restoreVendorEditors(data.vendorEditors);Object.entries(data.vendorOverrides||{}).forEach(([id,name])=>{const vendor=vendors.find(v=>v.id===id);if(vendor&&name)vendor.vendor=name});state.removedVendorIds=Array.isArray(data.removedVendorIds)?data.removedVendorIds:[];state.removedOrderLocations=Array.isArray(data.removedOrderLocations)?data.removedOrderLocations:[];state.vendorOrder=Array.isArray(data.vendorOrder)?data.vendorOrder:state.vendorOrder;if(data.equipmentOrders)restoreEquipmentOrders(data.equipmentOrders);if(data.securityPlanner)try{localStorage.setItem(securityPlanStorageKey(),JSON.stringify(data.securityPlanner))}catch{}cloudPayload=data;state.logistics=data.logistics||state.logistics||defaultLogistics();Object.entries(data.statuses||{}).forEach(([id,st])=>{const v=vendors.find(x=>x.id===id);if(v)v.status=st});restoreFormValues(data.values||[]);document.querySelectorAll('.vendor-card.expanded').forEach(recalculateCard)}
function restoreValues(){try{const data=cloudPayload||bibleStore.bibles?.[activeBibleId]||JSON.parse(localStorage.getItem(bibleDraftKey)||'null');applyPayload(data)}catch(e){console.warn(e)}}
function updateCloudStatus(){const el=document.querySelector('#cloudStatus');if(el){el.textContent=cloudState;el.classList.toggle('error',cloudState.startsWith('Sync error')||cloudState==='Not signed in')}}
function normalizeBibleStore(payload){
 if(payload?.bibles)return{version:18,activeBibleId:payload.activeBibleId||null,bibles:payload.bibles||{},vendorLibraryItems:payload.vendorLibraryItems&&typeof payload.vendorLibraryItems==='object'?payload.vendorLibraryItems:defaultVendorLibraryItems()};
 if(payload?.locationId||payload?.statuses||payload?.values){const id=payload.bibleId||`legacy-${payload.locationId||'default'}`;return{version:18,activeBibleId:id,bibles:{[id]:{...payload,id,createdAt:payload.updatedAt||new Date().toISOString()}},vendorLibraryItems:payload.vendorLibraryItems&&typeof payload.vendorLibraryItems==='object'?payload.vendorLibraryItems:defaultVendorLibraryItems()}}
 return{version:18,activeBibleId:null,bibles:{},vendorLibraryItems:defaultVendorLibraryItems()};
}
function resetVendorStatuses(){vendors.forEach(v=>v.status='working')}
function selectBible(id){
 const record=bibleStore.bibles?.[id];if(!record)return;
 activeBibleId=id;bibleStore.activeBibleId=id;cloudPayload=record;state.logistics=record.logistics||null;state.vendorOrder=Array.isArray(record.vendorOrder)?record.vendorOrder:[];state.removedVendorIds=Array.isArray(record.removedVendorIds)?record.removedVendorIds:[];state.removedOrderLocations=Array.isArray(record.removedOrderLocations)?record.removedOrderLocations:[];locationId=record.locationId||record.location?.id||'';
 sharedLocation=(locationId?sharedLocations.find(x=>x.id===locationId):null)||record.location||null;
 state.openEpisode=normalizeEpisode(record.episodeName||record.episodeId||sharedLocation?.episode_name||sharedLocation?.episode_id);
 resetVendorStatuses();Object.entries(record.statuses||{}).forEach(([vendorId,status])=>{const vendor=vendors.find(x=>x.id===vendorId);if(vendor)vendor.status=status});hydrateVendorTemplatesFromBudget(currentBudgetPage());
 const params=new URLSearchParams(location.search);params.set('bibleId',id);if(locationId)params.set('locationId',locationId);history.replaceState({},'',`${location.pathname}?${params.toString()}`);
 render();
}
async function refreshSharedData(fromRealtime=false){if(fromRealtime&&(bibleDirty||bibleSaving)){pendingRemoteRefresh=true;return}if(!configured||!showId){cloudState=configured?'Missing show ID':'Saved locally';updateCloudStatus();return}try{const session=await getSession();if(!session){cloudState='Not signed in';updateCloudStatus();return}const[doc,locations,budget,calendar,setup]=await Promise.all([loadBibleDocument(showId),loadLocations(showId),loadBudget(showId),loadCalendarDocument(showId),loadProductionSetup(showId)]);sharedLocations=locations||[];sharedBudget=budget?.payload||null;sharedCalendar=calendar?.payload||null;showProfile={name:queryParams.get('showName')||showProfile.name||'Production',season:setup?.settings?.season||'',company:setup?.settings?.production_company||'',logo:setup?.settings?.logo_url||'',units:setup?.units||[]};bibleStore=normalizeBibleStore(doc?.payload||JSON.parse(localStorage.getItem(bibleStoreKey)||'null'));syncVendorLibraryFromBudget();await bootstrapBiblesFromBudget();await syncAllBibleSchedulesFromCalendar();
 const q=new URLSearchParams(location.search);const requestedId=q.get('bibleId');const requestedLocation=q.get('locationId')||locationId;
 activeBibleId=(requestedId&&bibleStore.bibles[requestedId]?requestedId:null)||Object.values(bibleStore.bibles).find(b=>requestedLocation&&(b.locationId===requestedLocation||b.location?.id===requestedLocation))?.id||bibleStore.activeBibleId||Object.keys(bibleStore.bibles)[0]||null;
 const record=activeBibleId?bibleStore.bibles[activeBibleId]:null;locationId=record?.locationId||requestedLocation||'';sharedLocation=(locationId?sharedLocations.find(x=>x.id===locationId):null)||record?.location||null;cloudPayload=record||null;if(record){state.openEpisode=normalizeEpisode(record.episodeName||record.episodeId||sharedLocation?.episode_name||sharedLocation?.episode_id);state.removedVendorIds=Array.isArray(record.removedVendorIds)?record.removedVendorIds:[];state.removedOrderLocations=Array.isArray(record.removedOrderLocations)?record.removedOrderLocations:[];resetVendorStatuses();Object.entries(record.statuses||{}).forEach(([id,st])=>{const v=vendors.find(x=>x.id===id);if(v)v.status=st})}else{state.openEpisode=normalizeEpisode(showProfile.units?.[0]?.name||showProfile.units?.[0]?.code||'');state.removedVendorIds=[];state.removedOrderLocations=[];resetVendorStatuses()}hydrateVendorTemplatesFromBudget(currentBudgetPage());cloudState='Connected';render();}catch(e){console.error('Bible sync failed',e);cloudState=`Sync error: ${e.message||'connection failed'}`;updateCloudStatus()}}

async function initShared(){await refreshSharedData(false);realtimeStop();realtimeStop=subscribeBible(showId,()=>refreshSharedData(true))}

function esc(v=''){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function openLogisticsEditor(addBlank=false){
 const l=structuredClone(currentLogistics());l.extras=Array.isArray(l.extras)?l.extras:[];
 if(addBlank)l.extras.push({label:'TRUCK PARKING',name:'',uses:'',address:'',contact:'',phone:''});
 const escv=v=>esc(v||'');
 const sameOptions=(currentKey,currentValue='')=>`<option value="">Independent</option>${[['set','Set'],['basecamp','Basecamp'],['crewParking','Crew Parking'],['catering','Catering'],...(l.extras||[]).map((x,i)=>[`extra:${i}`,x.label||`Additional area ${i+1}`])].filter(([v])=>v!==currentKey).map(([v,n])=>`<option value="${v}" ${currentValue===v?'selected':''}>Same as ${escv(n)}</option>`).join('')}`;const fixedSection=(key,label)=>{const x=l[key]||{};return `<fieldset class="logistics-edit-section"><legend>${label}</legend><div class="modal-grid"><label><span>Same as</span><select name="${key}_sameAs">${sameOptions(key,x.sameAs||'')}</select></label><label><span>Name</span><input name="${key}_name" value="${escv(x.name)}"></label><label><span>Uses / notes</span><input name="${key}_uses" value="${escv(x.uses)}"></label><label class="wide"><span>Address</span><input name="${key}_address" value="${escv(x.address)}"></label><label><span>Contact</span><input name="${key}_contact" value="${escv(x.contact)}"></label><label><span>Phone</span><input name="${key}_phone" value="${escv(x.phone)}"></label></div></fieldset>`};
 const extraSection=(x,i)=>`<fieldset class="logistics-edit-section extra-logistics-section" data-extra-index="${i}"><legend>Additional area ${i+1}</legend><div class="modal-grid"><label><span>Area type / label</span><input name="extra_${i}_label" value="${escv(x.label||'')}" placeholder="Truck Parking, BG Parking, BG Holding..."></label><label><span>Same as</span><select name="extra_${i}_sameAs">${sameOptions(`extra:${i}`,x.sameAs||'')}</select></label><label><span>Name</span><input name="extra_${i}_name" value="${escv(x.name||'')}"></label><label class="wide"><span>Uses / notes</span><input name="extra_${i}_uses" value="${escv(x.uses||'')}"></label><label class="wide"><span>Address</span><input name="extra_${i}_address" value="${escv(x.address||'')}"></label><label><span>Contact</span><input name="extra_${i}_contact" value="${escv(x.contact||'')}"></label><label><span>Phone</span><input name="extra_${i}_phone" value="${escv(x.phone||'')}"></label></div><button type="button" class="remove-extra-logistics ghost">Remove area</button></fieldset>`;
 const wrap=document.createElement('div');wrap.className='modal-backdrop logistics-editor-backdrop';wrap.innerHTML=`<section class="location-modal logistics-edit-modal" role="dialog" aria-modal="true" aria-labelledby="editLogisticsTitle"><div class="modal-head"><div><small>LOCATION BIBLE</small><h2 id="editLogisticsTitle">Edit location logistics</h2></div><button class="modal-close" type="button" aria-label="Close">×</button></div><form id="logisticsEditForm">${fixedSection('set','Set')}${fixedSection('basecamp','Basecamp')}${fixedSection('crewParking','Crew Parking')}${fixedSection('catering','Catering')}<div id="extraLogisticsEditor">${l.extras.map(extraSection).join('')}</div><button type="button" class="small-btn add-extra-logistics">＋ Add another line</button><p class="modal-note">Add Truck Parking, BG Parking, BG Holding, Satellite Basecamp, or any other operational area needed for this Bible.</p><div class="modal-actions"><button type="button" class="ghost cancel-logistics">Cancel</button><button type="submit" class="primary">Save logistics</button></div></form></section>`;
 document.body.appendChild(wrap);document.body.style.overflow='hidden';
 const close=()=>{document.body.style.overflow='';wrap.remove()};
 wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.cancel-logistics').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 const onKey=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',onKey);close()}};document.addEventListener('keydown',onKey);
 const linkedFields=['name','address','contact','phone'];
 const prefixForRef=ref=>ref?.startsWith('extra:')?`extra_${ref.split(':')[1]}`:ref;
 const applySameAs=select=>{const target=select.name.replace(/_sameAs$/,'');const source=prefixForRef(select.value);linkedFields.forEach(field=>{const targetInput=wrap.querySelector(`[name="${target}_${field}"]`);if(!targetInput)return;targetInput.readOnly=!!source;targetInput.classList.toggle('linked-logistics-field',!!source);if(source){const sourceInput=wrap.querySelector(`[name="${source}_${field}"]`);targetInput.value=sourceInput?.value||''}})};
 const refreshSameAs=()=>{for(let pass=0;pass<3;pass++)wrap.querySelectorAll('select[name$="_sameAs"]').forEach(applySameAs)};
 const wireSameAs=()=>{wrap.querySelectorAll('select[name$="_sameAs"]').forEach(select=>select.onchange=refreshSameAs);wrap.querySelectorAll('#logisticsEditForm input').forEach(input=>input.oninput=refreshSameAs);refreshSameAs()};
 const rebuildExtras=()=>{const box=wrap.querySelector('#extraLogisticsEditor');box.innerHTML=l.extras.map(extraSection).join('');box.querySelectorAll('.remove-extra-logistics').forEach((b,i)=>b.onclick=()=>{l.extras.splice(i,1);rebuildExtras()});wireSameAs()};
 wrap.querySelector('.add-extra-logistics').onclick=()=>{l.extras.push({label:'',name:'',uses:'',address:'',contact:'',phone:''});rebuildExtras();setTimeout(()=>wrap.querySelector('#extraLogisticsEditor fieldset:last-child input')?.focus(),0)};
 rebuildExtras();
 wrap.querySelector('#logisticsEditForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const read=key=>({sameAs:String(f.get(`${key}_sameAs`)||''),name:String(f.get(`${key}_name`)||''),uses:String(f.get(`${key}_uses`)||''),address:String(f.get(`${key}_address`)||''),contact:String(f.get(`${key}_contact`)||''),phone:String(f.get(`${key}_phone`)||'')});const extras=l.extras.map((_,i)=>({label:String(f.get(`extra_${i}_label`)||'').trim(),sameAs:String(f.get(`extra_${i}_sameAs`)||''),name:String(f.get(`extra_${i}_name`)||''),uses:String(f.get(`extra_${i}_uses`)||''),address:String(f.get(`extra_${i}_address`)||''),contact:String(f.get(`extra_${i}_contact`)||''),phone:String(f.get(`extra_${i}_phone`)||'')})).filter(x=>x.label||x.name||x.uses||x.address||x.contact||x.phone);pushUndoSnapshot();state.logistics={set:read('set'),basecamp:read('basecamp'),crewParking:read('crewParking'),catering:read('catering'),extras};close();await saveBible(true);render()};
}
function openLocationEditor(){
 if(!sharedLocation){showToast('No shared location is selected. Open this Bible from a location record first.',true);return}
 const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<section class="location-modal" role="dialog" aria-modal="true" aria-labelledby="editLocationTitle"><div class="modal-head"><div><small>SHARED LOCATION</small><h2 id="editLocationTitle">Edit location</h2></div><button class="modal-close" type="button" aria-label="Close">×</button></div><form id="locationEditForm"><div class="modal-grid"><label><span>Location name</span><input name="location_name" required value="${esc(sharedLocation.location_name)}"></label><label><span>Set name(s)</span><input name="set_name" value="${esc(sharedLocation.set_name)}"></label><label class="wide"><span>Street address</span><input name="address" value="${esc(sharedLocation.address)}"></label><label><span>City</span><input name="city" value="${esc(sharedLocation.city)}"></label><label><span>State</span><input name="state" value="${esc(sharedLocation.state)}"></label><label><span>ZIP</span><input name="postal_code" value="${esc(sharedLocation.postal_code)}"></label><label><span>Area</span><input name="area" value="${esc(sharedLocation.area)}"></label><label><span>Primary contact</span><input name="contact_name" value="${esc(sharedLocation.contact_name)}"></label><label><span>Phone</span><input name="contact_phone" value="${esc(sharedLocation.contact_phone)}"></label><label class="wide"><span>Email</span><input type="email" name="contact_email" value="${esc(sharedLocation.contact_email)}"></label></div><p class="modal-note">Changes update the shared location record used by Location List, Calendar, Budget, Bible, and Scout Route.</p><div class="modal-actions"><button type="button" class="ghost cancel-location">Cancel</button><button type="submit" class="primary save-location">Save shared location</button></div></form></section>`;
 document.body.append(wrap);const close=()=>wrap.remove();wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.cancel-location').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 wrap.querySelector('#locationEditForm').onsubmit=async e=>{e.preventDefault();const btn=wrap.querySelector('.save-location');btn.disabled=true;btn.textContent='Saving…';const fd=new FormData(e.currentTarget);const changes=Object.fromEntries([...fd.entries()].map(([k,v])=>[k,String(v).trim()]));try{sharedLocation=await updateLocation(sharedLocation.id,changes);const record=bibleStore.bibles?.[activeBibleId];if(record){record.location=sharedLocation;record.locationId=sharedLocation.id;record.locationName=sharedLocation.location_name;record.setName=sharedLocation.set_name}close();await saveBible(true,true);render();showToast('Shared location updated');}catch(err){console.error('Location update failed',err);btn.disabled=false;btn.textContent='Save shared location';showToast(err.message||'Could not update location',true)}};
 setTimeout(()=>wrap.querySelector('input')?.focus(),0)
}

function openNewBibleFlow(){
 if(!sharedLocations.length){showToast('No shared locations are available yet. Add a location in Location List or Calendar first.',true);return}
 const episodes=[...new Set(sharedLocations.map(x=>x.episode_name||x.episode_id||'Unassigned').filter(Boolean))];
 const wrap=document.createElement('div');wrap.className='modal-backdrop new-bible-backdrop';
 const locationOptions=(episode='')=>sharedLocations.filter(x=>!episode||(x.episode_name||x.episode_id||'Unassigned')===episode).map(x=>`<option value="${esc(x.id)}">${esc(x.location_name||'Unnamed location')} — ${esc(x.set_name||'Set TBD')}</option>`).join('');
 wrap.innerHTML=`<section class="location-modal new-bible-modal" role="dialog" aria-modal="true" aria-labelledby="newBibleTitle"><div class="modal-head"><div><small>NEW LOCATION BIBLE</small><h2 id="newBibleTitle">Start a new Bible</h2></div><button class="modal-close" type="button" aria-label="Close">×</button></div><form id="newBibleForm"><div class="modal-grid"><label><span>Episode</span><select name="episode">${episodes.map((e,i)=>`<option ${i===0?'selected':''}>${esc(e)}</option>`).join('')}</select></label><label><span>Shared location</span><select name="locationId">${locationOptions(episodes[0])}</select></label><label class="wide"><span>Scene / set name</span><input name="setName" placeholder="Uses the shared set name unless changed"></label></div><div class="new-bible-preview"></div><p class="modal-note">This starts the Bible from a shared production location so its address, contact, episode, and set stay connected across Taylor Scout.</p><div class="modal-actions"><button type="button" class="ghost cancel-new-bible">Cancel</button><button type="submit" class="primary create-new-bible">Create Bible</button></div></form></section>`;
 document.body.append(wrap);document.body.style.overflow='hidden';
 const close=()=>{document.body.style.overflow='';wrap.remove()};
 const ep=wrap.querySelector('[name=episode]'),loc=wrap.querySelector('[name=locationId]'),setInput=wrap.querySelector('[name=setName]'),preview=wrap.querySelector('.new-bible-preview');
 const updatePreview=()=>{const item=sharedLocations.find(x=>x.id===loc.value);if(!item)return;setInput.placeholder=item.set_name||'Set TBD';preview.innerHTML=`<strong>${esc(item.location_name||'Unnamed location')}</strong><span>${esc([item.address,item.city,item.state,item.postal_code].filter(Boolean).join(', '))}</span><small>${esc(item.contact_name||'No primary contact')}</small>`};
 ep.onchange=()=>{loc.innerHTML=locationOptions(ep.value);updatePreview()};loc.onchange=updatePreview;updatePreview();
 wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.cancel-new-bible').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 const key=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',key);close()}};document.addEventListener('keydown',key);
 wrap.querySelector('#newBibleForm').onsubmit=async e=>{e.preventDefault();const item=sharedLocations.find(x=>x.id===loc.value);if(!item)return showToast('Choose a location.',true);const btn=wrap.querySelector('.create-new-bible');btn.disabled=true;btn.textContent='Creating…';
 const id=crypto.randomUUID();activeBibleId=id;locationId=item.id;sharedLocation={...item,set_name:setInput.value.trim()||item.set_name,episode_name:ep.value};resetVendorStatuses();cloudPayload=null;
 const blank={version:18,bibleId:id,id,locationId:item.id,location:sharedLocation,locationName:sharedLocation.location_name||'Unnamed location',setName:sharedLocation.set_name||'',episodeName:ep.value,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),statuses:Object.fromEntries(vendors.map(v=>[v.id,'working'])),values:[],commitments:{}};
 bibleStore.bibles[id]=blank;bibleStore.activeBibleId=id;cloudPayload=blank;state.openEpisode=normalizeEpisode(ep.value);
 const params=new URLSearchParams(location.search);params.set('bibleId',id);params.set('locationId',item.id);params.set('episodeId',item.episode_id||ep.value);history.replaceState({},'',`${location.pathname}?${params.toString()}`);
 close();render();await saveBible();showToast('New Bible created')};
}

function showToast(message,isError=false){const old=document.querySelector('.toast');if(old)old.remove();const n=document.createElement('div');n.className=`toast${isError?' error':''}`;n.textContent=message;document.body.append(n);setTimeout(()=>n.remove(),2600)}

function formatEventDate(value){if(!value)return '';const d=new Date(value);if(!isFinite(d))return value;return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(d).replace(',','').replace(' 0', ' ')}
function operationalAreaByLabel(label){const l=resolvedLogistics();const key=String(label||'').toLowerCase().replace(/[^a-z]/g,'');if(key.includes('base'))return l.basecamp;if(key.includes('crewparking'))return l.crewParking;if(key.includes('catering'))return l.catering;if(key.includes('set'))return l.set;return (l.extras||[]).find(x=>String(x.label||'').toLowerCase()===String(label||'').toLowerCase())||null}
function locationManagerInfo(){const x=sharedLocation||{};return {name:x.location_manager_name||x.locationManagerName||x.lm_name||'',phone:x.location_manager_phone||x.locationManagerPhone||x.lm_phone||'',email:x.location_manager_email||x.locationManagerEmail||x.lm_email||''}}
function collectOrderDetails(card){
 const lines=[],editor=card.querySelector('.custom-editor'),type=editor?.dataset.costType||card.dataset.cardId||'';
 const locationHeading=g=>{const locationSelect=g.querySelector('.order-location-select'),area=locationSelect?orderAreaByRef(locationSelect.value):null,name=locationSelect?.selectedOptions?.[0]?.textContent?.split(' — ')[0]?.trim()||g.dataset.location||'Location';lines.push(name.toUpperCase());if(area?.item?.name&&area.item.name!==name)lines.push(area.item.name);if(area?.item?.address)lines.push(area.item.address)};
 card.querySelectorAll('.location-order-group').forEach((g,groupIndex)=>{if(groupIndex)lines.push('————');locationHeading(g);
  g.querySelectorAll('.restroom-unit').forEach(u=>{const fields=u.querySelectorAll('select'),qty=Number(fields[0]?.value||0),unit=fields[1]?.value||'unit';if(qty)lines.push(`(${qty}) × ${unit}`)});
  g.querySelectorAll('[data-bin-type]').forEach(x=>{const qty=Number(x.value||0);if(qty)lines.push(`(${qty}) × ${x.dataset.binType} bin${qty===1?'':'s'}`)});
  g.querySelectorAll('.eq-row').forEach(r=>{const item=r.querySelector('.eq-item')?.value?.trim()||'',qty=Number(r.querySelector('.eq-qty')?.value||0);if(item&&qty)lines.push(`(${qty}) × ${item}`)});
  const labels=[...g.querySelectorAll('.location-group-head .field span')].map(x=>x.textContent.trim()),values=[...g.querySelectorAll('.location-group-head input[type=datetime-local]')];
  values.forEach((x,i)=>{if(x.value)lines.push(`${labels[i]||'Schedule'}: ${formatEventDate(x.value)}`)});
  const services=[];g.querySelectorAll('.service-row').forEach(r=>{const when=r.querySelector('input[type=datetime-local]')?.value,units=[...r.querySelectorAll('.service-units input:not(.service-all)')].filter(x=>x.checked).map(x=>x.closest('label')?.textContent?.trim()).filter(Boolean);if(when)services.push(`Service: ${formatEventDate(when)}${units.length?' — '+units.join(', '):''}`)});
  g.querySelectorAll('.swap-row').forEach(r=>{const action=r.querySelector('select')?.value||'Service',when=r.querySelector('input[type=datetime-local]')?.value,note=r.querySelector('input[placeholder="Notes"]')?.value?.trim();if(when)services.push(`${action}: ${formatEventDate(when)}${note?' — '+note:''}`)});
  if(services.length){lines.push('');lines.push(...services)};lines.push('')
 });
 if(type==='catering'){
  const row=card.querySelector('.catering-row'),loc=row?.querySelector('.order-location-select'),area=loc?orderAreaByRef(loc.value):null;
  lines.push((loc?.selectedOptions?.[0]?.textContent?.split(' — ')[0]?.trim()||'CATERING').toUpperCase());if(area?.item?.name)lines.push(area.item.name);if(area?.item?.address)lines.push(area.item.address);
  const chosen=card.querySelector('.catering-type:checked')?.value||'Setup',fields=row?.querySelectorAll('select')||[],dates=row?.querySelectorAll('input[type=datetime-local]')||[],size=fields[0]?.value||'',qty=Number(fields[1]?.value||0);
  if(qty&&size)lines.push(`(${qty}) × ${size} ${chosen}`);if(dates[0]?.value)lines.push(`Delivery: ${formatEventDate(dates[0].value)}`);if(dates[1]?.value)lines.push(`Pickup: ${formatEventDate(dates[1].value)}`);
  const notes=card.querySelector('textarea')?.value?.trim();if(notes)lines.push(`Notes: ${notes}`)
 }
 if(type==='cleaning'||type==='snake'){
  const visits=[...card.querySelectorAll('.repeat-row')];visits.forEach((r,i)=>{const values=[...r.querySelectorAll('input')].map(x=>x.value);if(i)lines.push('');lines.push(type==='cleaning'?`CLEANING VISIT ${i+1}`:`COVERAGE ${i+1}`);if(values[0])lines.push(`Date: ${formatEventDate(values[0])}`);if(values[1])lines.push(`Start: ${values[1]}`);if(values[2])lines.push(`End: ${values[2]}`);if(values[3])lines.push(`Area / notes: ${values[3]}`)});
  if(type==='cleaning'){const areas=[...card.querySelectorAll('.check-grid input:checked')].map(x=>x.closest('label')?.textContent?.trim()).filter(Boolean),instructions=card.querySelector('textarea')?.value?.trim();if(areas.length)lines.push(`Areas: ${areas.join(', ')}`);if(instructions)lines.push(`Instructions: ${instructions}`)}
 }
 if(type==='maps')card.querySelectorAll('.map-lines>div').forEach((r,i)=>{const selects=r.querySelectorAll('select'),qty=Number(selects[0]?.value||0),mapType=selects[1]?.value||'Map',note=r.querySelector('input')?.value?.trim();if(qty)lines.push(`(${qty}) × ${mapType} map${qty===1?'':'s'}${note?' — '+note:''}`)});
 if(!lines.some(x=>String(x).trim()))card.querySelectorAll('input,select,textarea').forEach(el=>{if(el.closest('[data-budget-card]')||el.classList.contains('order-location-select')||el.type==='radio'&&!el.checked||el.type==='checkbox'&&!el.checked)return;const value=el.value?.trim();if(value&&value.length<180)lines.push(value)});
 return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
function openEmailPreview(card){
 if(card?.dataset.cardId==='security'){openSecurityOrderPreview(loadSecurityPlan());return}
 const selected=card?[card]:vendors.filter(v=>v.status==='review'||v.status==='approved').map(v=>document.querySelector(`.vendor-card[data-card-id="${v.id}"]`)).filter(Boolean);
 const title=card?(card.querySelector('.vendor-main strong')?.textContent||'Vendor Order'):'Taylor Scout Vendor Orders';
 const sections=selected.map(c=>{const v=vendors.find(x=>x.id===c.dataset.cardId);return `${(v?.title||'ORDER').toUpperCase()} — ${v?.vendor||''}\n${collectOrderDetails(c)}\nPO: ${v?.po||'Pending'}`}).join('\n\n————————————\n\n');
 const greeting=card?`Hi ${((vendors.find(x=>x.id===card.dataset.cardId)?.contact||'').split('·')[0]||'there').trim()},`:'Hello,';
 const showName=new URLSearchParams(location.search).get('showName')||cloudPayload?.showName||'Taylor Scout Production',episode=normalizeEpisode(sharedLocation?.episode_name||sharedLocation?.episode_id||cloudPayload?.episodeName||''),locationName=sharedLocation?.location_name||cloudPayload?.locationName||'Location',setName=sharedLocation?.set_name||cloudPayload?.setName||'',workAt=[setName,locationName].filter(Boolean).join(' — ');
 const text=`${greeting}\n\nPlease confirm the following order for our upcoming work at ${workAt} for ${showName}${episode?`, Episode ${episode}`:''}.\n\n${sections||'No orders are currently marked Ready for Review or Approved.'}\n\n${(()=>{const lm=locationManagerInfo();const bits=[lm.name,lm.phone,lm.email].filter(Boolean);return bits.length?'LOCATION MANAGER\n'+bits.join(' · ')+'\n\n':''})()}Please confirm availability, pricing, each delivery/service/swap/pickup time, and that the order has been placed as written. Please note any substitutions, additional fees, or schedule conflicts before proceeding.\n\nThank you.`;
 const vendorName=card?(vendors.find(x=>x.id===card.dataset.cardId)?.vendor||'Vendor'):'Vendor Orders';
 const clean=x=>String(x||'').replace(/[^A-Za-z0-9]+/g,' ').trim().replace(/\s+/g,'_');const subjectText=[clean(showName),episode&&clean(episode),clean(locationName),clean(vendorName)].filter(Boolean).join('_');
 const subject=encodeURIComponent(subjectText),body=encodeURIComponent(text);
 const w=window.open('','_blank','width=820,height=760');w.document.write(`<title>Email Preview</title><style>body{font:16px Arial;padding:32px;color:#13283b;background:#f4f7f8}main{max-width:760px;margin:auto;background:#fff;padding:28px;border-radius:14px}textarea{width:100%;height:470px;padding:16px;box-sizing:border-box;line-height:1.45}button,a{display:inline-block;padding:11px 16px;margin:10px 8px 0 0;border-radius:8px;border:1px solid #bfd0d8;background:#fff;color:#13283b;text-decoration:none;font-weight:700}.primary{background:#24a7b8;color:#fff;border-color:#24a7b8}</style><main><h2>${title}</h2><p><b>Subject:</b> ${subjectText}</p><textarea>${text.replace(/</g,'&lt;')}</textarea><br><button onclick="navigator.clipboard.writeText(document.querySelector('textarea').value)">Copy Email</button><a class="primary" href="mailto:?subject=${subject}&body=${body}">Open Mail App</a></main>`)}
function addEquipmentItem(group,item){if(!group)return;const table=group.querySelector('.equipment-table');const row=document.createElement('div');row.className='eq-row';const known=equipmentKnownRate(item);row.innerHTML=`<input class="eq-item" list="equipmentInventory" value="${item||''}" placeholder="Equipment item"><select class="eq-qty">${Array.from({length:31},(_,i)=>`<option>${i}</option>`).join('')}</select><input class="eq-rate" type="number" min="0" step="0.01" value="${known}"><strong class="eq-total">$0.00</strong><button class="tiny">×</button>`;table.append(row);const itemInput=row.querySelector('.eq-item'),rateInput=row.querySelector('.eq-rate');itemInput?.addEventListener('change',()=>{const r=equipmentKnownRate(itemInput.value);if(r&&(!Number(rateInput.value)||Number(rateInput.value)===0))rateInput.value=String(r);recalculateCard(group.closest('.vendor-card'))});row.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>recalculateCard(group.closest('.vendor-card'))));row.querySelector('.tiny').onclick=()=>{row.remove();recalculateCard(group.closest('.vendor-card'))};row.querySelector('.eq-item')?.focus()}
function bindEquipmentGroup(group){const loc=group.querySelector('.order-location-select');if(loc)loc.onchange=()=>{syncOrderLocation(group);recalculateCard(group.closest('.vendor-card'))};const add=group.querySelector('.add-equipment-row');if(add)add.onclick=e=>{e.preventDefault();pushUndoSnapshot();addEquipmentItem(group,'')};group.querySelectorAll('.eq-row').forEach(r=>{const item=r.querySelector('.eq-item'),rate=r.querySelector('.eq-rate');item?.addEventListener('change',()=>{const known=equipmentKnownRate(item.value);if(known&&(!Number(rate.value)||Number(rate.value)===0))rate.value=String(known)})});group.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',()=>recalculateCard(group.closest('.vendor-card')));el.addEventListener('change',()=>recalculateCard(group.closest('.vendor-card')))});group.querySelectorAll('.tiny').forEach(btn=>btn.onclick=e=>{e.preventDefault();btn.closest('.eq-row')?.remove();recalculateCard(group.closest('.vendor-card'))})}
function addEquipmentOrderLocation(editor){if(!editor)return;const holder=document.createElement('div');holder.innerHTML=equipmentLocation('Other',`custom-${Date.now()}`,'','',[]);const group=holder.firstElementChild;editor.querySelector('.add-equipment-location')?.before(group);bindEquipmentGroup(group);addEquipmentItem(group,'')}
function collectEquipmentOrders(){return [...document.querySelectorAll('.vendor-card[data-card-id="equipment"] .equipment-group')].map(g=>({location:g.querySelector('.order-location-select')?.value||g.dataset.location||'set',delivery:g.querySelectorAll('.location-group-head input[type=datetime-local]')[0]?.value||'',pickup:g.querySelectorAll('.location-group-head input[type=datetime-local]')[1]?.value||'',items:[...g.querySelectorAll('.eq-row')].map(r=>({item:r.querySelector('.eq-item')?.value||'',qty:Number(r.querySelector('.eq-qty')?.value||0),rate:Number(r.querySelector('.eq-rate')?.value||0)})).filter(x=>x.item||x.qty)}))}
function restoreEquipmentOrders(orders){const editor=document.querySelector('.vendor-card[data-card-id="equipment"] .custom-editor[data-cost-type="equipment"]');if(!editor||!Array.isArray(orders)||!orders.length)return;editor.querySelectorAll('.equipment-group').forEach(g=>g.remove());const before=editor.querySelector('.add-equipment-location');orders.forEach((o,i)=>{const holder=document.createElement('div');holder.innerHTML=equipmentLocation(o.location||'Other',`saved-${i}`,o.delivery||'',o.pickup||'',(o.items||[]).map(x=>[x.item,x.qty,x.rate]));const g=holder.firstElementChild;before?.before(g);bindEquipmentGroup(g)})}

function filterEquipment(inp){const q=inp.value.toLowerCase();const list=inp.closest('.equipment-group').querySelector('.equipment-results');list.innerHTML=equipmentLibraryItems().map(x=>x.name).filter(x=>x.toLowerCase().includes(q)).slice(0,12).map(x=>`<button type="button" class="quick-equip" data-item="${esc(x)}">${esc(x)}</button>`).join('');list.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.preventDefault();addEquipmentItem(inp.closest('.equipment-group'),b.dataset.item)})}
function duplicateRelevantRow(button){const editor=button.closest('.custom-editor');if(!editor)return;const scope=button.closest('.location-order-group')||editor;const candidates=[...scope.querySelectorAll('.security-row,.service-row,.swap-row,.repeat-row,.map-lines>div')];let source=candidates[candidates.length-1];if(source){const clone=source.cloneNode(true);source.after(clone);clone.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',()=>recalculateCard(editor.closest('.vendor-card')));el.addEventListener('change',()=>recalculateCard(editor.closest('.vendor-card')))});return}const group=editor.querySelector('.location-order-group:last-of-type');if(group){const clone=group.cloneNode(true);group.after(clone)}}

render();
initShared().then(()=>{if(new URLSearchParams(location.search).get('securityMap')==='1')openVendorSecurityMap()});
