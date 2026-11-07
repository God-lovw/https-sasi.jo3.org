/* ŚA'SI World Map — Leaflet + OpenStreetMap, no API key required. */
const map = L.map('map', {worldCopyJump:true}).setView([20,0],2);
const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'});
street.addTo(map);
let activeMarker=null, selected=null;
const savedMarkers = new Map();
const $ = id => document.getElementById(id);
const getSaved = () => {try{return JSON.parse(localStorage.getItem('sasi-saved-places')||'[]')}catch{return []}};
const setSaved = items => localStorage.setItem('sasi-saved-places',JSON.stringify(items));
function coordsText(p){return p.lat.toFixed(5)+', '+p.lng.toFixed(5)}
function selectPoint(latlng,name='Pinned location'){
 selected={lat:latlng.lat,lng:latlng.lng,name};
 if(activeMarker) map.removeLayer(activeMarker);
 activeMarker=L.marker(latlng).addTo(map).bindPopup(name).openPopup();
 $('selection-name').textContent=name;
 $('selection-coords').textContent=coordsText(selected);
 $('save-btn').disabled=false;
}
map.on('click',e=>selectPoint(e.latlng));
function renderSaved(){
 const items=getSaved(); $('saved-count').textContent=items.length;
 const list=$('saved-list'); list.innerHTML='';
 if(!items.length){list.innerHTML='<p class="empty">Tap the map to drop a pin, then save it here.</p>';return}
 items.forEach((p,i)=>{
  const row=document.createElement('div');row.className='saved-item';
  const go=document.createElement('button');go.type='button';go.textContent=p.name;go.addEventListener('click',()=>{map.setView([p.lat,p.lng],14);selectPoint({lat:p.lat,lng:p.lng},p.name)});
  const del=document.createElement('button');del.type='button';del.className='remove';del.textContent='×';del.setAttribute('aria-label','Remove '+p.name);del.addEventListener('click',()=>{const next=getSaved();next.splice(i,1);setSaved(next);renderSaved();});
  row.append(go,del);list.append(row);
 });
}
$('save-btn').addEventListener('click',()=>{
 if(!selected)return;const items=getSaved();const name=selected.name==='Pinned location'?'Saved place '+(items.length+1):selected.name;
 if(items.some(p=>Math.abs(p.lat-selected.lat)<.00001&&Math.abs(p.lng-selected.lng)<.00001)){$('search-status').textContent='That location is already saved.';return}
 items.push({...selected,name});setSaved(items);renderSaved();$('search-status').textContent='Location saved on this device.';
});
$('world-btn').addEventListener('click',()=>map.setView([20,0],2));
$('locate-btn').addEventListener('click',()=>{
 if(!navigator.geolocation){$('search-status').textContent='Location is not supported by this browser.';return}
 $('search-status').textContent='Requesting your location…';
 navigator.geolocation.getCurrentPosition(pos=>{const p={lat:pos.coords.latitude,lng:pos.coords.longitude};map.setView([p.lat,p.lng],14);selectPoint(p,'Your current location');$('search-status').textContent='Location found.'},()=>{$('search-status').textContent='Location unavailable. Check browser permission and try again.'},{enableHighAccuracy:true,timeout:10000});
});
document.querySelectorAll('input[name="basemap"]').forEach(el=>el.addEventListener('change',()=>{if(el.checked){if(el.value==='satellite'){map.removeLayer(street);satellite.addTo(map)}else{map.removeLayer(satellite);street.addTo(map)}}}));
$('search-form').addEventListener('submit',async e=>{
 e.preventDefault();const q=$('place-search').value.trim();if(!q)return;
 $('search-status').textContent='Searching…';
 try{
  const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(q);
  const response=await fetch(url,{headers:{'Accept':'application/json'}});if(!response.ok)throw new Error('Search service unavailable');
  const results=await response.json();if(!results.length){$('search-status').textContent='No match found. Try a more specific place name.';return}
  const r=results[0],p={lat:Number(r.lat),lng:Number(r.lon)};map.setView([p.lat,p.lng],13);selectPoint(p,r.display_name.split(',').slice(0,3).join(','));$('search-status').textContent='Place found. Save it to keep it on this device.';
 }catch(err){$('search-status').textContent='Search could not complete. Please try again.'}
});
renderSaved();