const schedule = () => window.__TS_LOCATION_SCHEDULE__ || {};

function eachDate(start, end) {
  if (!start) return [];
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end || start}T12:00:00`);
  if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime())) return [];
  const out = [];
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

function lifecycleMap() {
  const s = schedule();
  const map = new Map();
  [
    ['prep', 'PREP', s.prepStart, s.prepEnd],
    ['hold', 'HOLD', s.holdStart, s.holdEnd],
    ['shoot', 'SHOOT', s.shootStart, s.shootEnd],
    ['strike', 'STRIKE', s.strikeStart, s.strikeEnd]
  ].forEach(([kind, label, start, end]) => eachDate(start, end).forEach(date => map.set(date, { kind, label })));
  return map;
}
function isoFromInput(input){return String(input.value||'').slice(0,10)}
function monthStartFor(input){const value=isoFromInput(input)||window.__TS_LOCATION_FIRST_PREP__||new Date().toISOString().slice(0,10);const d=new Date(`${value}T12:00:00`);return new Date(d.getFullYear(),d.getMonth(),1,12)}
let active=null,monthCursor=null;
function closePicker(){document.querySelector('.ts-lifecycle-picker')?.remove();active=null;monthCursor=null}
function formatMonth(d){return d.toLocaleDateString('en-US',{month:'long',year:'numeric'})}
function renderPicker(){if(!active||!monthCursor)return;document.querySelector('.ts-lifecycle-picker')?.remove();const lifecycle=lifecycleMap(),selected=isoFromInput(active),year=monthCursor.getFullYear(),month=monthCursor.getMonth(),first=new Date(year,month,1,12),daysInMonth=new Date(year,month+1,0,12).getDate(),cells=[];for(let i=0;i<first.getDay();i++)cells.push('<span class="ts-cal-empty"></span>');for(let day=1;day<=daysInMonth;day++){const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,life=lifecycle.get(date),classes=['ts-cal-day'];if(life)classes.push(`is-${life.kind}`);if(date===selected)classes.push('is-selected');cells.push(`<button type="button" class="${classes.join(' ')}" data-date="${date}" title="${life?.label||''}"><span>${day}</span>${life?`<small>${life.label}</small>`:''}</button>`)}const rect=active.getBoundingClientRect(),picker=document.createElement('div');picker.className='ts-lifecycle-picker';picker.innerHTML=`<div class="ts-cal-head"><button type="button" data-nav="prev" aria-label="Previous month">‹</button><strong>${formatMonth(monthCursor)}</strong><button type="button" data-nav="next" aria-label="Next month">›</button></div><div class="ts-cal-legend"><span class="prep">Prep</span><span class="hold">Hold</span><span class="shoot">Shoot</span><span class="strike">Strike</span></div><div class="ts-cal-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="ts-cal-grid">${cells.join('')}</div>`;document.body.appendChild(picker);const width=picker.offsetWidth||340;let left=Math.min(rect.left,window.innerWidth-width-12);left=Math.max(12,left);let top=rect.bottom+6;if(top+picker.offsetHeight>window.innerHeight-12)top=Math.max(12,rect.top-picker.offsetHeight-6);picker.style.left=`${left+window.scrollX}px`;picker.style.top=`${top+window.scrollY}px`;picker.querySelector('[data-nav="prev"]').onclick=()=>{monthCursor=new Date(year,month-1,1,12);renderPicker()};picker.querySelector('[data-nav="next"]').onclick=()=>{monthCursor=new Date(year,month+1,1,12);renderPicker()};picker.querySelectorAll('[data-date]').forEach(button=>button.onclick=()=>{const date=button.dataset.date;if(active.type==='datetime-local'){const time=String(active.value||'').includes('T')?String(active.value).slice(11):'06:00';active.value=`${date}T${time||'06:00'}`}else active.value=date;active.dispatchEvent(new Event('input',{bubbles:true}));active.dispatchEvent(new Event('change',{bubbles:true}));closePicker()})}
function openPicker(input){active=input;monthCursor=monthStartFor(input);renderPicker()}
function eligible(input){if(!(input instanceof HTMLInputElement)||input.disabled||input.readOnly)return false;return ['date','datetime-local'].includes(input.type)&&Boolean(input.closest('#app'))&&!input.matches('[data-native-date-picker]')}
function handlePointer(event){const input=event.target.closest?.('input');if(!eligible(input)){if(!event.target.closest?.('.ts-lifecycle-picker'))closePicker();return}event.preventDefault();event.stopImmediatePropagation();openPicker(input)}
document.addEventListener('pointerdown',handlePointer,true);document.addEventListener('mousedown',event=>{const input=event.target.closest?.('input');if(eligible(input)){event.preventDefault();event.stopImmediatePropagation()}},true);document.addEventListener('keydown',event=>{if(event.key==='Escape')closePicker();if((event.key==='Enter'||event.key===' ')&&eligible(event.target)){event.preventDefault();openPicker(event.target)}},true);
