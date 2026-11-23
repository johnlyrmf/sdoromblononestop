/* School summaries arrive through the protected OneStop Firestore collection. */

const $ = id => document.getElementById(id);
const map = L.map('map',{zoomControl:false,scrollWheelZoom:true,attributionControl:true,preferCanvas:true,zoomSnap:.5});
map.attributionControl.setPrefix(false);
map.attributionControl.addAttribution('Municipality boundaries © geoBoundaries · CC BY 3.0 IGO');
const boundaryLayer=L.geoJSON(null,{style:{color:'#f7f7f3',weight:1.4,fillColor:'#a8bfae',fillOpacity:1},onEachFeature:(feature,layer)=>{
  layer.bindTooltip(feature.properties.shapeName,{sticky:true,className:'school-tooltip'});
  layer.on('mouseover',()=>layer.setStyle({fillColor:'#93ad9a',weight:1.8}));
  layer.on('mouseout',()=>layer.setStyle({fillColor:'#a8bfae',weight:1.4}));
  layer.on('click',()=>{$('municipality').value=feature.properties.shapeName;applyFilters(true)});
}}).addTo(map);
const markerLayer=L.layerGroup().addTo(map);
let municipalities=[];
let schools=[];
let selectedId=null;
let activeView='map-view';
let fullBounds=null;
let overviewCamera=null;

function setInitialOverview(){
  if(!fullBounds)return;
  map.invalidateSize({pan:false});
  map.fitBounds(fullBounds,{padding:[18,18],animate:false});
  if(window.innerWidth>=800)map.setZoom(map.getZoom()+.5,{animate:false});
  overviewCamera={center:map.getCenter(),zoom:map.getZoom()};
}
function resetView(){
  if(!overviewCamera){setInitialOverview();return;}
  map.stop();
  map.invalidateSize({pan:false});
  const alreadyHome=Math.abs(map.getZoom()-overviewCamera.zoom)<.01&&map.getCenter().distanceTo(overviewCamera.center)<50;
  if(alreadyHome)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    map.setView(overviewCamera.center,overviewCamera.zoom,{animate:false});
  }else{
    map.flyTo(overviewCamera.center,overviewCamera.zoom,{duration:.8});
  }
}
function measureHeader(){
  document.documentElement.style.setProperty('--header-height',`${document.querySelector('.site-header').getBoundingClientRect().height}px`);
}

function makePin(selected){return L.divIcon({className:'',html:`<div class="school-pin${selected?' is-selected':''}"></div>`,iconSize:selected?[22,22]:[18,21],iconAnchor:selected?[11,11]:[9,19]});}
function schoolMatches(s){
  const query=$('search').value.trim().toLowerCase();
  return (!query||`${s.name} ${s.id} ${s.municipality} ${s.district}`.toLowerCase().includes(query))&&
    (!$('district').value||s.district===$('district').value)&&
    (!$('municipality').value||s.municipality===$('municipality').value)&&
    (!$('level').value||s.level===$('level').value);
}
function selectSchool(id,fly=true){
  const s=schools.find(item=>item.id===id);if(!s)return;
  selectedId=id;
  $('map-layout').classList.remove('panel-closed');
  $('school-panel').hidden=false;
  $('school-name').textContent=s.name;
  $('school-id').textContent=`School ID ${s.id}`;
  $('school-level').textContent=s.level;
  $('school-district').textContent=s.district;
  $('school-municipality').textContent=s.municipality;
  $('school-barangay').textContent=s.barangay;
  $('teachers').textContent=s.teachers ?? '—';
  $('devices').textContent=s.equipmentRecords ?? '—';
  $('laptops').textContent=s.donatedLaptops ?? '—';
  $('packages').textContent=s.dcpPackages ?? '—';
  $('data-note').textContent=s.dcpPackages==null?'DCP package count needs verification':`${s.dcpPackages} verified DCP packages`;
  $('equipment-breakdown').textContent=Object.entries(s.itemCounts||{}).map(([name,count])=>`${count} ${name.toLowerCase()}${count===1?'':'s'}`).join(' · ')||'No item breakdown available';
  $('donation-summary').textContent=`${s.donatedDevices??'—'} donated devices recorded`;
  $('functional').textContent=s.functional??'—';
  $('attention').textContent=s.attention??'—';
  const conditionTotal=(s.functional||0)+(s.attention||0);
  $('condition-functional').style.width=conditionTotal?`${100*(s.functional||0)/conditionTotal}%`:'0%';
  $('connectivity').textContent=s.connectivity||'Not verified from the inventory workbook';
  $('source-note').textContent=`Source: ${s.sourceFile||'School inventory'} · Imported ${s.importedOn||'date unavailable'}`;
  renderMarkers();
  if(fly&&activeView==='map-view')map.flyTo([s.lat,s.lng],Math.max(map.getZoom(),11),{duration:.45});
}
function renderMarkers(){
  markerLayer.clearLayers();
  for(const s of schools.filter(schoolMatches)){
    const m=L.marker([s.lat,s.lng],{icon:makePin(s.id===selectedId),title:s.name,keyboard:true,zIndexOffset:s.id===selectedId?1000:0});
    m.bindTooltip(s.name,{direction:'top',offset:[0,s.id===selectedId?-15:-18],className:'school-tooltip'});
    m.on('click',()=>selectSchool(s.id));
    markerLayer.addLayer(m);
  }
}
function renderDirectory(){
  const list=$('directory-list');list.replaceChildren();
  const visible=schools.filter(schoolMatches).sort((a,b)=>a.name.localeCompare(b.name));
  $('empty-state').hidden=visible.length!==0;
  $('empty-state').textContent=schools.length?'No schools match these filters. Try another search.':'No schools have been imported yet. Use Import schools in the ICT workspace.';
  for(const s of visible){
    const button=document.createElement('button');button.type='button';button.className='directory-item';
    const name=document.createElement('strong');name.textContent=s.name;
    const meta=document.createElement('span');meta.textContent=`${s.municipality} · ${s.level} · ${s.district}`;
    button.append(name,meta);button.addEventListener('click',()=>{setView('map-view');selectSchool(s.id)});list.append(button);
  }
}
function applyFilters(zoomMunicipality=false){
  const visible=schools.filter(schoolMatches);
  $('count-pill').textContent=`${visible.length} school${visible.length===1?'':'s'}`;
  $('clear-filters').hidden=!($('search').value||$('district').value||$('municipality').value||$('level').value);
  if(!visible.length){selectedId=null;$('map-layout').classList.add('panel-closed');$('school-panel').hidden=true}
  else if(!visible.some(s=>s.id===selectedId))selectSchool(visible[0].id,false);
  renderMarkers();renderDirectory();
  if(zoomMunicipality&&$('municipality').value){
    const f=municipalities.find(item=>item.properties.shapeName===$('municipality').value);
    if(f)map.fitBounds(L.geoJSON(f).getBounds(),{padding:[30,30],maxZoom:11});
  }
}
function setView(view){
  activeView=view;
  document.body.classList.toggle('directory-mode',view!=='map-view');
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  for(const id of ['map-view','directory-view','upload-view']){$(id).hidden=id!==view;$(id).classList.toggle('active',id===view)}
  $('page-title').textContent=view==='map-view'?'School map':view==='directory-view'?'School directory':'Import schools';
  $('page-description').textContent=view==='map-view'?'Explore schools, resources and connectivity across Romblon.':view==='directory-view'?'Browse imported school records across Romblon.':'Review school workbooks before they appear on the map.';
  if(view==='map-view')requestAnimationFrame(()=>map.invalidateSize({pan:false}));
}

function start(){
  try{
    const data=window.ROMBLON_MUNICIPALITIES;
    if(!data?.features?.length)throw new Error('Municipality boundary data is unavailable');
    municipalities=data.features;
    boundaryLayer.addData(data);fullBounds=boundaryLayer.getBounds();
    schools=[];
    requestAnimationFrame(setInitialOverview);
    applyFilters();
  }catch(error){
    $('map').innerHTML='<div style="padding:28px;color:#202824;background:#e6eeea;height:100%"><strong>The map could not load.</strong><p>Check that the project files are together in one folder.</p></div>';
    console.error(error);
  }
}

window.updateSchoolData=(records)=>{
  const previous=selectedId;
  schools=records.filter(s=>s.id&&s.name&&Number.isFinite(s.lat)&&Number.isFinite(s.lng));
  for(const key of ['district','municipality']){
    const select=$(key),chosen=select.value;
    while(select.options.length>1)select.remove(1);
    for(const value of [...new Set(schools.map(s=>s[key]).filter(Boolean))].sort())select.add(new Option(value,value));
    select.value=chosen;
  }
  selectedId=schools.some(s=>s.id===previous)?previous:null;
  if(!selectedId&&schools.length)selectSchool(schools[0].id,false);
  else if(selectedId)selectSchool(selectedId,false);
  applyFilters();
  $('map-note').textContent=`${schools.length} school${schools.length===1?'':'s'} loaded`;
};

document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
for(const id of ['search','district','municipality','level'])$(id).addEventListener(id==='search'?'input':'change',()=>applyFilters(id==='municipality'));
$('clear-filters').addEventListener('click',()=>{for(const id of ['search','district','municipality','level'])$(id).value='';applyFilters();resetView()});
$('zoom-in').addEventListener('click',()=>map.zoomIn());
$('zoom-out').addEventListener('click',()=>map.zoomOut());
$('reset-view').addEventListener('click',resetView);
$('close-panel').addEventListener('click',()=>{$('map-layout').classList.add('panel-closed');requestAnimationFrame(()=>map.invalidateSize())});
$('directory-button').addEventListener('click',()=>{$('search').value=selectedId;applyFilters();setView('directory-view')});
let leavingForIct=false;
document.querySelectorAll('a[href="../../ict-dashboard.html"]').forEach(link=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  if(leavingForIct)return;
  leavingForIct=true;
  const loader=$('dcp-page-loader');
  loader.hidden=false;
  requestAnimationFrame(()=>loader.classList.add('is-visible'));
  window.setTimeout(()=>{window.location.href=link.href},420);
}));
window.addEventListener('pageshow',()=>{leavingForIct=false;const loader=$('dcp-page-loader');loader.classList.remove('is-visible');loader.hidden=true});
new ResizeObserver(measureHeader).observe(document.querySelector('.site-header'));
measureHeader();
start();
