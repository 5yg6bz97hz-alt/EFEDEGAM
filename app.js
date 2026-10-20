"use strict";
// EFEDEGAM v10 — wall-sized archival cabinet with single physical drawer.
const projects=[
 {title:"Espacios imaginados",category:"Arquitectura",color:"#8D075A",word:"ESPACIOS",description:"Aquí irán proyectos de arquitectura, renders, planos y procesos de diseño."},
 {title:"Cortar y pegar",category:"Fotomontajes",color:"#F15C27",word:"COLLAGES",description:"Composiciones, recortes, fotomontajes y nuevas maneras de mirar."},
 {title:"De mi cuaderno",category:"Dibujos",color:"#078B76",word:"TRAZOS",description:"Dibujos, croquis e ideas que todavía no tienen forma."},
 {title:"Dentro del estudio",category:"Arquitectura profesional",color:"#ED2835",word:"ESTUDIO",description:"Una selección de trabajos profesionales, cuando esté autorizada su publicación."},
 {title:"Cosas que se tocan",category:"Objetos",color:"#2852E5",word:"OBJETOS",description:"Diseños, prototipos, impresiones 3D y experimentos materiales."},
 {title:"Sin clasificar",category:"Experimentos",color:"#C43C99",word:"ETC.",description:"Para todo aquello que se resiste a encajar en una categoría."}
];
const one=selector=>document.querySelector(selector);
const many=selector=>Array.from(document.querySelectorAll(selector));
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const finePointer=matchMedia("(pointer:fine)");
// Contact recipient pending confirmation from the portfolio owner.
const portfolioContactEmail="";
const portfolioMailto="mailto:"+portfolioContactEmail+"?subject="+encodeURIComponent("Hola desde EFEDEGAM")+"&body="+encodeURIComponent("¡Hola! He visto tu portfolio EFEDEGAM y quería ponerme en contacto contigo.\n\n");
const views={home:one("#homeView"),archive:one("#homeView"),about:one("#aboutView"),vacio:one("#voidView")};
let activeView=null,drawerOpen=false,picking=false,selectedProject=0,previousFocus=null,navigating=false;
let lensX=innerWidth/2,lensY=innerHeight/2,lensFrame=0,lensEnabled=false,replicaTimer=null;
let cabinetFocused=false,openingTimer=null,lockedTimer=null;
const wall=one("#cabinet"),cells=one("#cabinetCells");
let hero=null,voidDrawer=null,plantDrawer=null,filmDrawer=null,phoneDrawer=null,ticketDrawer=null,layoutIsSmall=null,voidBusy=false,voidTimer=null;
let introTimers=[];
let introSequenceActive=false;
let introPlayed=false;
let plantProgress=0,plantFrame=0,plantTargetOpen=false,plantRaster=null,plantRasterLoading=false;
function makeUnit(index,col,row,heroCell,voidCell,plantCell,storyType){
 // Reserve 023 and 099 for the special drawers without duplicate serial numbers.
 let serial=index+1;
 if(serial>=23)serial++;
 if(serial>=99)serial++;
 const id=heroCell?"023":voidCell?"099":String(serial).padStart(3,"0");
 const unit=document.createElement("div");
 unit.className="drawer-unit"+(heroCell?" is-hero":"")+(voidCell?" is-void-drawer":"")+(plantCell?" is-plant-drawer":"")+(storyType?" is-story-drawer is-story-"+storyType:"");
 unit.style.gridColumn=String(col+1);
 unit.style.gridRow=String(row+1);
 unit.dataset.drawer=heroCell?"middle":voidCell?"vacio":plantCell?"plant":storyType||"locked";
 unit.dataset.number=id;
 if(plantCell){
  const cavity=document.createElement("div");cavity.className="plant-cavity";cavity.setAttribute("aria-hidden","true");
  const sprout=document.createElement("img");sprout.src="assets/plant-sprout-v15.svg";sprout.alt="";sprout.className="plant-sprout";sprout.loading="eager";sprout.decoding="async";
  const pixels=document.createElement("canvas");
  pixels.className="plant-pixels";pixels.width=360;pixels.height=342;
  pixels.setAttribute("aria-hidden","true");
  unit.append(cavity,pixels,sprout);
 }
 if(storyType){
  const cavity=document.createElement("div");
  cavity.className="story-cavity";
  cavity.setAttribute("aria-hidden","true");
  unit.append(cavity);
  const visual=document.createElement("div");
  visual.className="story-visual "+storyType+"-visual";
  visual.setAttribute("aria-hidden","true");
  if(storyType==="film"){
   visual.innerHTML='<div class="film-roller"></div><div class="film-ribbon">'+
    Array.from({length:9},(_,i)=>'<div class="film-frame film-frame-'+(i%5)+'"><span class="film-frame-image"></span><span class="film-frame-index">'+String(i+1).padStart(2,"0")+'</span></div>').join("")+
    '</div><span class="film-tail"></span>';
  } else if(storyType==="phone"){
   visual.innerHTML='<svg class="phone-coil" viewBox="0 0 160 260" preserveAspectRatio="none" aria-hidden="true">'+
    '<path d="M80 0 C20 17 140 30 80 44 S20 70 80 84 S140 112 80 126 S20 153 80 166 S140 196 80 209 S20 235 80 260" stroke="#334d3b" stroke-width="5" fill="none" stroke-linecap="round"/>'+
    '<path d="M80 0 C20 17 140 30 80 44 S20 70 80 84 S140 112 80 126 S20 153 80 166 S140 196 80 209 S20 235 80 260" stroke="#a8bf95" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".65"/></svg>'+
    '<a class="phone-contact-link" href="'+portfolioMailto+'" aria-label="Escribir un correo a EFEDEGAM" title="Enviar un correo"><img class="phone-handset" src="assets/telefono-oliva-v18.svg" alt="" draggable="false"></a>';
   const mailLink=visual.querySelector(".phone-contact-link");
   mailLink.tabIndex=-1;
   mailLink.setAttribute("aria-hidden","true");
   mailLink.addEventListener("click",event=>event.stopPropagation());
   mailLink.addEventListener("pointerdown",event=>event.stopPropagation());
  } else {
   visual.innerHTML='<div class="ticket-feeder"></div><div class="ticket-paper">'+
    '<div class="ticket-brand">EFEDEGAM</div>'+
    '<div class="ticket-meta">RECIBO Nº 018<br>ARCHIVO PERSONAL · 2026</div>'+
    '<div class="ticket-rule">--------------------------------</div>'+
    '<div class="ticket-title">UN POCO SOBRE MÍ</div>'+
    '<p>Este archivo guarda cosas que me gustan, ideas que encuentro y proyectos que voy haciendo.</p>'+
    '<p>Arquitectura, imágenes, dibujos, fotografías y objetos. A veces todo mezclado.</p>'+
    '<div class="ticket-rule">--------------------------------</div>'+
    '<p>NO ES UN CATÁLOGO.<br>ES UN DIARIO EN CONSTRUCCIÓN.</p>'+
    '<div class="ticket-foot">FIN (POR AHORA) ✳<br>* TEXTO PROVISIONAL *</div>'+
    '</div>';
  }
  visual.addEventListener("click",event=>{
   if(event.target.closest(".phone-contact-link"))return;
   if(activeView==="archive"&&!voidBusy){cancelIntroSequence();toggleStoryDrawer(unit)}
  });
  unit.append(visual);
 }
 if(heroCell){
  const cavity=document.createElement("div");cavity.className="drawer-cavity";unit.append(cavity);
  const tray=document.createElement("div");
  tray.className="drawer-assembly";
  tray.innerHTML='<div class="drawer-tray-floor"></div><div class="drawer-tray-side drawer-tray-side--left"></div><div class="drawer-tray-side drawer-tray-side--right"></div><div class="drawer-tray-rim"></div>';
  unit.append(tray);
  const files=document.createElement("div");files.className="file-tray-files";files.id="fileStack";files.setAttribute("aria-label","Carpetas del cajón de proyectos");unit.append(files);
 }
 const front=document.createElement("div");front.className="drawer-face";
 front.innerHTML='<span class="drawer-card-label">'+(heroCell?"PROYECTOS":voidCell?"ARCHIVO ESPECIAL":("F. "+id))+'</span><span class="drawer-handle"></span><span class="drawer-id">'+id+'</span>'+(voidCell?'<span class="drawer-void-sticker">EL VACÍO</span>':'');
 const button=document.createElement("button");
 button.type="button";button.className="drawer-click";
 button.setAttribute("aria-label",heroCell?"Acercar y abrir el cajón 023 de proyectos":voidCell?"Abrir cajón 099 y entrar en El Vacío":plantCell?"Abrir el cajón de la planta":storyType?({film:"Abrir cajón de película analógica",phone:"Abrir cajón del teléfono verde",ticket:"Abrir cajón del ticket Sobre mí"}[storyType]):"Cajón "+id+" cerrado con llave");
 if(heroCell){button.setAttribute("aria-controls","fileStack");button.setAttribute("aria-expanded","false")}
 if(plantCell||storyType)button.setAttribute("aria-expanded","false");
 button.addEventListener("click",()=>clickDrawer(unit,heroCell,voidCell,plantCell,storyType));
 front.append(button);unit.append(front);
 return unit;
}
function buildWall(){
 const small=innerWidth<700;
 if(layoutIsSmall===small&&hero)return;
 layoutIsSmall=small;
 const cols=small?9:15,rows=small?10:9;
 wall.style.setProperty("--cols",String(cols));wall.style.setProperty("--rows",String(rows));
 const centerRow=Math.floor(rows/2),centerCol=Math.floor(cols/2);
 hero=null;voidDrawer=null;plantDrawer=null;filmDrawer=null;phoneDrawer=null;ticketDrawer=null;
 const fragment=document.createDocumentFragment();
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const i=r*cols+c;
  const isHero=r===centerRow&&c===centerCol;
  const isVoid=r===(small?3:3)&&c===(small?7:12);
  const isPlant=r===(small?6:6)&&c===(small?2:3);
  const storyType=r===(small?1:1)&&c===(small?2:4)?"film":
                  r===(small?5:5)&&c===(small?7:12)?"phone":
                  r===(small?1:2)&&c===(small?5:10)?"ticket":null;
  const unit=makeUnit(i,c,r,isHero,isVoid,isPlant,storyType);
  if(isHero)hero=unit;
  if(isVoid)voidDrawer=unit;
  if(isPlant)plantDrawer=unit;
  if(storyType==="film")filmDrawer=unit;
  if(storyType==="phone")phoneDrawer=unit;
  if(storyType==="ticket")ticketDrawer=unit;
  fragment.append(unit);
 }
 cancelPlantFrame();plantRaster=null;plantRasterLoading=false;plantProgress=0;plantTargetOpen=false;
 cells.replaceChildren(fragment);
 buildFolders();
 scheduleLensRefresh();
}
function buildFolders(){
 const holder=one("#fileStack"),touch=one("#touchFileButtons");
 holder.replaceChildren();touch.replaceChildren();
 projects.forEach((project,index)=>{
  const label=String(index+1).padStart(2,"0");
  const card=document.createElement("button");card.type="button";card.className="file-tab";
  card.style.setProperty("--index",index);
  card.style.setProperty("--tab-color",project.color);
  card.style.setProperty("--folder-color",project.color);
  card.style.setProperty("--tab-left",["7%","33%","58%","16%","50%","65%"][index]);
  card.innerHTML='<span class="file-card-head"><span class="file-number">'+label+'</span><span class="file-name">'+project.title+'</span><span class="file-arrow">↗</span></span><span class="file-card-info"><span class="file-edition">EFEDEGAM · ARCHIVO</span><span class="file-card-category">'+project.category+'</span><span class="file-card-index">EXP. / '+label+'</span></span>';
  card.setAttribute("aria-label","Abrir carpeta "+label+": "+project.title);
  card.addEventListener("mouseenter",()=>fanCards(index));
  card.addEventListener("focus",()=>fanCards(index));
  card.addEventListener("click",event=>{event.stopPropagation();pickFolder(index)});
  holder.append(card);
  const shortcut=document.createElement("button");shortcut.type="button";
  shortcut.textContent=label+" · "+project.title;
  shortcut.addEventListener("click",()=>pickFolder(index));
  touch.append(shortcut);
 });
 holder.addEventListener("pointermove",event=>{
  if(!drawerOpen||picking||event.pointerType!=="mouse")return;
  const rect=holder.getBoundingClientRect();
  const pos=Math.max(0,Math.min(5,((event.clientY-rect.top)/Math.max(1,rect.height))*5));
  sweepCards(pos);
 });
 holder.addEventListener("pointerleave",clearFan);
 holder.addEventListener("focusout",event=>{if(!holder.contains(event.relatedTarget))clearFan()});
}
function setDrawer(open){
 drawerOpen=Boolean(open);
 if(!hero)return;
 hero.classList.toggle("is-open",drawerOpen);
 const btn=hero.querySelector(".drawer-click");
 btn.setAttribute("aria-expanded",String(drawerOpen));
 btn.setAttribute("aria-label",drawerOpen?"Cerrar y alejar el cajón de proyectos":"Acercar y abrir el cajón central de proyectos");
 many("#fileStack .file-tab, #touchFileButtons button").forEach(button=>button.disabled=!drawerOpen);
 one("#touchFiles").hidden=!drawerOpen;
 if(!drawerOpen)clearFan();
 one("#drawerInstruction").textContent=drawerOpen?"Selecciona una carpeta. Pulsa el frontal para cerrar.":"Pulsa el cajón 023 de PROYECTOS para acercarte. El 099 guarda otro secreto.";
 scheduleLensRefresh();setTimeout(scheduleLensRefresh,1100);
}
function focusCabinet(){
 if(cabinetFocused)return;
 cabinetFocused=true;
 one("#archiveView .archive-stage-v6").classList.add("is-project-zoom");
 wall.classList.add("is-zoomed");
 scheduleLensRefresh();setTimeout(scheduleLensRefresh,1350);
}
function resetCabinet(){
 clearTimeout(openingTimer);
 setDrawer(false);cabinetFocused=false;wall.classList.remove("is-zoomed","is-void-zoom");
 one("#archiveView .archive-stage-v6").classList.remove("is-project-zoom");
 wall.style.removeProperty("transform-origin");
 scheduleLensRefresh();
}
function jiggleLocked(unit){
 unit.classList.remove("is-shaking");void unit.offsetWidth;
 unit.classList.add("is-shaking");
 one("#drawerInstruction").textContent="Ese cajón está cerrado con llave. Busca el 023 o el 099.";
 clearTimeout(lockedTimer);
 lockedTimer=setTimeout(()=>unit.classList.remove("is-shaking"),500);
}
function clickDrawer(unit,isHero,isVoid,isPlant,storyType){
 if(voidBusy)return;
 if(storyType){cancelIntroSequence();toggleStoryDrawer(unit);return}
 if(isPlant){
  cancelIntroSequence();
  if(plantTargetOpen)closePlantDrawer(true);
  else openPlantDrawer();
  return;
 }
 if(isVoid){cancelIntroSequence();enterVoid(unit);return}
 if(!isHero){jiggleLocked(unit);return}
 cancelIntroSequence();
 if(drawerOpen){
  setDrawer(false);
  clearTimeout(openingTimer);
  openingTimer=setTimeout(()=>{
   cabinetFocused=false;
   wall.classList.remove("is-zoomed");
   one("#archiveView .archive-stage-v6").classList.remove("is-project-zoom");
   scheduleLensRefresh();
  },reduced.matches?0:600);
  return;
 }
 if(!cabinetFocused){
  focusCabinet();clearTimeout(openingTimer);
  openingTimer=setTimeout(()=>setDrawer(true),reduced.matches?0:1180);
 }else setDrawer(true);
}
/* Three independent small stories live in the filing wall. Each drawer
   is clickable/keyboard-operable, and can be opened or put away again. */
function toggleStoryDrawer(unit,open=!unit.classList.contains("is-story-open")){
 if(!unit||!unit.isConnected)return;
 const kind=unit.dataset.drawer;
 if(!["film","phone","ticket"].includes(kind))return;
 unit.classList.toggle("is-story-open",open);
 unit.classList.toggle("is-story-shut",!open);
 const contact=unit.querySelector(".phone-contact-link");
 if(contact){
  contact.tabIndex=open?0:-1;
  contact.setAttribute("aria-hidden",String(!open));
  unit.querySelector(".phone-visual")?.setAttribute("aria-hidden",String(!open));
 }
 const button=unit.querySelector(".drawer-click");
 if(button){
  button.setAttribute("aria-expanded",String(open));
  const labels={
   film:open?"Cerrar cajón de película analógica":"Abrir cajón de película analógica",
   phone:open?"Guardar teléfono verde":"Sacar teléfono verde",
   ticket:open?"Guardar el ticket Sobre mí":"Imprimir el ticket Sobre mí"
  };
  button.setAttribute("aria-label",labels[kind]);
 }
 if(kind==="ticket"&&open){
  // Replay the abrupt thermal-printer motion on every fresh opening.
  const paper=unit.querySelector(".ticket-paper");
  if(paper){paper.style.animation="none";void paper.offsetWidth;paper.style.removeProperty("animation")}
 }
 scheduleLensRefresh();
 setTimeout(scheduleLensRefresh,1400);
}
function resetStoryDrawers(){
 for(const unit of [filmDrawer,phoneDrawer,ticketDrawer]){
  if(unit)toggleStoryDrawer(unit,false);
 }
}
function enterVoid(unit){
 if(voidBusy||activeView!=="archive")return;
 voidBusy=true;
 clearTimeout(openingTimer);
 if(drawerOpen)setDrawer(false);
 cabinetFocused=false;
 wall.classList.remove("is-zoomed");
 one("#archiveView .archive-stage-v6").classList.remove("is-project-zoom");
 const x=(unit.offsetLeft+unit.offsetWidth/2)/wall.offsetWidth*100;
 const y=(unit.offsetTop+unit.offsetHeight/2)/wall.offsetHeight*100;
 wall.style.transformOrigin=x.toFixed(2)+"% "+y.toFixed(2)+"%";
 voidDrawer=unit;
 unit.classList.add("is-portal-awake");
 const transition=one("#voidTransition");
 const target=unit.getBoundingClientRect();
 transition.style.setProperty("--portal-x",(target.left+target.width/2).toFixed(1)+"px");
 transition.style.setProperty("--portal-y",(target.top+target.height/2).toFixed(1)+"px");
 transition.hidden=false;
 transition.classList.remove("is-exiting");
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  wall.classList.add("is-void-zoom");
  transition.classList.add("is-active");
  scheduleLensRefresh();
 }));
 const duration=reduced.matches?75:1700;
 clearTimeout(voidTimer);
 voidTimer=setTimeout(()=>{
  history.pushState({view:"vacio"},"","#vacio");
  switchView("vacio",false);
  transition.classList.add("is-exiting");
  setTimeout(()=>{
   transition.classList.remove("is-active","is-exiting");
   transition.hidden=true;
   unit.classList.remove("is-portal-awake");
   voidBusy=false;
   scheduleLensRefresh();
  },reduced.matches?10:580);
 },duration);
}
/* After the blinds rise, all drawers remain shut. Only three invitation
   motions follow: 023, 099 and the botanical drawer, then one fern sprouts. */
function cancelIntroSequence(){
 introTimers.forEach(clearTimeout);
 introTimers=[];
 introSequenceActive=false;
}
function introAfter(delay,action){
 introTimers.push(setTimeout(()=>{
  if(activeView==="archive"&&introSequenceActive&&!voidBusy)action();
 },reduced.matches?0:delay));
}
function pulseDrawer(unit){
 if(!unit||!unit.isConnected)return;
 unit.classList.remove("is-shaking","is-inviting");
 void unit.offsetWidth;
 unit.classList.add("is-inviting");
 scheduleLensRefresh();
 setTimeout(()=>{
  unit.classList.remove("is-inviting");
  scheduleLensRefresh();
 },reduced.matches?40:830);
}

/* Pixelated assembly: paint a staggered, bottom-to-top mosaic of tiny blocks
   sampled from our transparent fern artwork. No organic scaling animation. */
function cancelPlantFrame(){
 if(plantFrame)cancelAnimationFrame(plantFrame);
 plantFrame=0;
}
function preparePlantRaster(img){
 if(plantRaster)return true;
 if(!img.complete||!img.naturalWidth)return false;
 const sampling=document.createElement("canvas");
 sampling.width=120;sampling.height=114;
 const brush=sampling.getContext("2d",{willReadFrequently:true});
 if(!brush)return false;
 try {
  brush.clearRect(0,0,120,114);
  brush.drawImage(img,0,0,120,114);
  const data=brush.getImageData(0,0,120,114).data;
  const cells=[];
  for(let y=0;y<114;y++)for(let x=0;x<120;x++){
   const pos=(y*120+x)*4,alpha=data[pos+3];
   if(alpha<45)continue;
   const noise=((Math.imul(x+11,73856093)^Math.imul(y+17,19349663))>>>0)%1000/1000;
   const threshold=Math.min(.99,(1-y/113)*.84+noise*.16);
   cells.push({x:x*3,y:y*3,color:"rgba("+data[pos]+","+data[pos+1]+","+data[pos+2]+","+(alpha/255).toFixed(2)+")",threshold});
  }
  plantRaster=cells;
  return true;
 }catch(error){return false}
}
function renderPlantPixels(progress){
 const canvas=plantDrawer?.querySelector(".plant-pixels");
 if(!canvas||!plantRaster)return;
 const ctx=canvas.getContext("2d");
 if(!ctx)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 for(const cell of plantRaster){
  if(cell.threshold>progress)continue;
  ctx.fillStyle=cell.color;
  ctx.fillRect(cell.x,cell.y,3,3);
 }
}
function setPlantFullyClosed(){
 if(!plantDrawer)return;
 plantDrawer.classList.remove("is-sprouting","is-grown","is-pixel-growing","is-pixel-closing","is-raster-fallback","plant-gentle-shake","is-shaking","is-inviting");
 plantDrawer.querySelector(".drawer-click")?.setAttribute("aria-expanded","false");
 plantDrawer.querySelector(".drawer-click")?.setAttribute("aria-label","Abrir el cajón de la planta");
 plantProgress=0;renderPlantPixels(0);
}
function animatePlantTo(open){
 if(!plantDrawer||!plantDrawer.isConnected)return;
 plantTargetOpen=open;
 cancelPlantFrame();
 const img=plantDrawer.querySelector(".plant-sprout");
 if(!preparePlantRaster(img)){
  // If the image loaded but canvas sampling is unsupported, retain a usable
  // static plant instead of leaving an empty drawer.
  if(img?.complete&&img?.naturalWidth){
   plantDrawer.classList.toggle("is-sprouting",open);
   plantDrawer.classList.toggle("is-grown",open);
   plantDrawer.classList.toggle("is-raster-fallback",open);
   plantDrawer.querySelector(".drawer-click")?.setAttribute("aria-expanded",String(open));
   if(!open)setPlantFullyClosed();
   return;
  }
  if(img&&!plantRasterLoading){
   plantRasterLoading=true;
   const onLoad=()=>{plantRasterLoading=false;if(plantTargetOpen)animatePlantTo(true)};
   img.addEventListener("load",onLoad,{once:true});
   img.addEventListener("error",()=>{
    plantRasterLoading=false;
    if(plantTargetOpen){
     plantDrawer.classList.add("is-grown","is-raster-fallback");
    }
   },{once:true});
  }
  if(open){
   plantDrawer.classList.add("is-sprouting");
   plantDrawer.classList.remove("is-grown");
   plantDrawer.querySelector(".drawer-click")?.setAttribute("aria-expanded","true");
  }else setPlantFullyClosed();
  return;
 }
 plantDrawer.classList.remove("is-raster-fallback");
 plantDrawer.classList.add("is-sprouting");
 plantDrawer.classList.toggle("is-pixel-growing",open);
 plantDrawer.classList.toggle("is-pixel-closing",!open);
 plantDrawer.classList.remove("is-grown");
 plantDrawer.querySelector(".drawer-click")?.setAttribute("aria-expanded",String(open));
 plantDrawer.querySelector(".drawer-click")?.setAttribute("aria-label",open?"Cerrar el cajón de la planta":"Abrir el cajón de la planta");
 if(reduced.matches){
  plantProgress=open?1:0;
  renderPlantPixels(plantProgress);
  if(open)plantDrawer.classList.add("is-grown");
  else setPlantFullyClosed();
  return;
 }
 const startProgress=plantProgress,goal=open?1:0;
 const duration=Math.max(180,Math.abs(goal-startProgress)*(open?2700:1250));
 const start=performance.now();
 function tick(now){
  if(!plantDrawer||!plantDrawer.isConnected)return;
  const t=Math.min(1,(now-start)/duration);
  const eased=t*t*(3-2*t);
  plantProgress=startProgress+(goal-startProgress)*eased;
  renderPlantPixels(plantProgress);
  if(t<1){plantFrame=requestAnimationFrame(tick);return}
  plantFrame=0;
  if(open){
   plantDrawer.classList.remove("is-pixel-growing");
   plantDrawer.classList.add("is-grown");
  }else setPlantFullyClosed();
  scheduleLensRefresh();
 }
 plantFrame=requestAnimationFrame(tick);
 scheduleLensRefresh();
}
function closePlantDrawer(animate=false){
 plantTargetOpen=false;
 if(!plantDrawer)return;
 if(animate&&plantProgress>0)animatePlantTo(false);
 else{
  cancelPlantFrame();
  setPlantFullyClosed();
  scheduleLensRefresh();
 }
}
function openPlantDrawer(){
 if(!plantDrawer||!plantDrawer.isConnected)return;
 animatePlantTo(true);
}
function resetArchiveIntro(){
 cancelIntroSequence();
 introPlayed=false;
 closePlantDrawer(false);
 resetStoryDrawers();
 hero?.classList.remove("is-shaking","is-inviting");
 voidDrawer?.classList.remove("is-shaking","is-inviting");
}
function runArchiveIntro(){
 if(introPlayed || activeView!=="archive")return;
 introPlayed=true;
 introSequenceActive=true;
 closePlantDrawer(false);
 resetStoryDrawers();
 // Give the Venetian blind enough time to finish its 1.4s lift.
 introAfter(1550,()=>pulseDrawer(hero));
 introAfter(2700,()=>pulseDrawer(voidDrawer));
 introAfter(3850,()=>pulseDrawer(plantDrawer));
 introAfter(4850,()=>openPlantDrawer());
 // Personal ephemera emerge only once the plant has nearly finished growing.
 introAfter(7950,()=>toggleStoryDrawer(filmDrawer,true));
 introAfter(10050,()=>toggleStoryDrawer(phoneDrawer,true));
 introAfter(12400,()=>toggleStoryDrawer(ticketDrawer,true));
 introAfter(14000,()=>{introSequenceActive=false;scheduleLensRefresh()});
}
function sweepCards(position){
 if(!drawerOpen||picking)return;
 const cards=many("#fileStack .file-tab");
 const clones=many("#cursorReplica .file-tab");
 cards.forEach((card,i)=>{
  const distance=Math.abs(i-position);
  const proximity=Math.max(0,1-distance*.75);
  // Longer dossiers remain partially inside the drawer even when lifted.
  const offset=proximity>0 ? -34*proximity:(i>position?8:0);
  const scale=1+proximity*.065;
  const tilt=-8*proximity;
  for(const node of [card,clones[i]].filter(Boolean)){
   node.style.setProperty("--paper-offset",offset.toFixed(1)+"%");
   node.style.setProperty("--paper-scale",scale.toFixed(3));
   node.style.setProperty("--paper-tilt",tilt.toFixed(1)+"deg");
   node.style.setProperty("--paper-light",proximity.toFixed(2));
   node.classList.toggle("is-under-hand",proximity>.4);
  }
 });
}
function fanCards(i){sweepCards(i)}
function clearFan(){
 many("#fileStack .file-tab, #cursorReplica .file-tab").forEach(card=>{
  for(const key of ["--paper-offset","--paper-scale","--paper-tilt","--paper-light"])card.style.removeProperty(key);
  card.classList.remove("is-under-hand","is-selected");
 });
}
function pickFolder(i){
 if(!drawerOpen||picking)return;
 picking=true;
 const cards=many("#fileStack .file-tab");clearFan();
 cards[i].classList.add("is-selected");
 setTimeout(()=>{
  picking=false;
  if(drawerOpen&&activeView==="archive")openProject(i);
 },reduced.matches?0:420);
}
function openProject(i){
 selectedProject=i;previousFocus=document.activeElement;
 const p=projects[i];
 one("#projectTitle").textContent=p.title;
 one("#projectCategory").textContent=p.category.toUpperCase();
 one("#projectDescription").textContent=p.description;
 one("#projectRef").textContent="FICHA DE ARCHIVO / "+String(i+1).padStart(3,"0")+" — 006";
 one("#projectArtNo").textContent=String(i+1).padStart(3,"0");
 one("#projectWord").textContent=p.word;
 one("#projectArtwork").style.setProperty("--project-color",p.color);
 const modal=one("#projectModal");modal.hidden=false;modal.setAttribute("aria-hidden","false");
 document.body.style.overflow="hidden";one("#closeProject").focus();
 scheduleLensRefresh();
}
function closeProject(restore=true){
 const modal=one("#projectModal");if(modal.hidden)return;
 modal.hidden=true;modal.setAttribute("aria-hidden","true");
 document.body.style.overflow="";clearFan();
 if(restore&&previousFocus&&previousFocus.isConnected&&!previousFocus.disabled)previousFocus.focus();
 scheduleLensRefresh();
}
function switchView(view,animate=true){
 if(!views[view]||navigating||view===activeView)return;
 closeProject(false);
 const apply=()=>{
  one("#homeView").hidden=view==="about"||view==="vacio";
  one("#aboutView").hidden=view!=="about";
  one("#voidView").hidden=view!=="vacio";
  one("#archiveView").inert=view!=="archive";
  activeView=view;
  document.body.classList.toggle("is-archive",view==="archive");
  document.body.classList.toggle("is-home",view==="home");
  document.body.classList.toggle("is-void",view==="vacio");
  if(view==="home"){resetBlindsForHome();resetCabinet();resetArchiveIntro()}
  else if(view==="archive"){openBlindsVisual();runArchiveIntro()}
  else {resetCabinet();cancelIntroSequence()}
  many(".nav a").forEach(link=>{
   if(link.dataset.view===view)link.setAttribute("aria-current","page");
   else link.removeAttribute("aria-current");
  });
  window.scrollTo({top:0,behavior:"instant"});scheduleLensRefresh();
 };
 const sameScene=(activeView==="home"&&view==="archive")||(activeView==="archive"&&view==="home");
 if(animate&&!reduced.matches&&!sameScene){
  navigating=true;const screen=one("#transitionScreen");
  screen.classList.remove("leave");screen.classList.add("on");
  setTimeout(()=>{
   apply();screen.classList.remove("on");screen.classList.add("leave");
   setTimeout(()=>{screen.classList.remove("leave");navigating=false;scheduleLensRefresh()},490);
  },490);
 }else apply();
}
const routeFromHash=()=>location.hash==="#vacio"?"vacio":location.hash==="#archivo"?"archive":location.hash==="#sobre-mi"?"about":"home";
many("[data-view]").forEach(link=>link.addEventListener("click",event=>{
 event.preventDefault();if(navigating)return;
 const view=link.dataset.view;if(activeView===view)return;
 history.pushState({view},"",view==="home"?"#inicio":view==="archive"?"#archivo":view==="vacio"?"#vacio":"#sobre-mi");
 switchView(view);
}));
addEventListener("popstate",()=>switchView(routeFromHash(),false));
addEventListener("hashchange",()=>switchView(routeFromHash(),false));
one("#closeProject").addEventListener("click",()=>closeProject());
one("#nextProject").addEventListener("click",()=>openProject((selectedProject+1)%projects.length));
one("#projectModal").addEventListener("click",event=>{if(event.target===event.currentTarget)closeProject()});
addEventListener("keydown",event=>{
 if(event.key==="Escape"){
  if(activeView==="vacio"){
   history.pushState({view:"archive"},"","#archivo");switchView("archive",false);return;
  }
  if(!one("#projectModal").hidden)closeProject();
  else if(drawerOpen||cabinetFocused)resetCabinet();
  return;
 }
 const modal=one("#projectModal");
 if(event.key==="Tab"&&!modal.hidden){
  const items=many("#projectModal button:not([disabled])");
  if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus()}
  if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus()}
 }
});

/* Small default magnifying cursor, no switch.
   A passive, clipped magnified DOM duplicate provides real page detail
   under the lens. The original page remains the only interactive layer. */
function createLensReplica(){
 if(!lensEnabled)return;
 const container=one("#cursorReplica"),source=one("#siteFrame");
 const clone=source.cloneNode(true);
 // An isolated second layout styled exactly like the live original.
 clone.id="siteFrame";
 clone.setAttribute("aria-hidden","true");
 clone.inert=true;
 clone.style.width=innerWidth+"px";
 clone.style.minHeight=source.scrollHeight+"px";
 // The duplicate is inert and hidden from assistive technology. Keep the
 // original IDs so the approved cabinet stylesheet also styles the lens copy.
 clone.querySelectorAll("a,button").forEach(element=>{element.tabIndex=-1});
 container.replaceChildren(clone);
 positionLens();
}
function positionLens(){
 if(!lensEnabled)return;
 const lens=one("#cursorLens");
 lens.style.left=lensX+"px";lens.style.top=lensY+"px";
 const zoom=1.5;
 const half=39;
 const translateX=half-(lensX+scrollX)*zoom;
 const translateY=half-(lensY+scrollY)*zoom;
 one("#cursorReplica").style.transform="translate("+translateX+"px,"+translateY+"px) scale("+zoom+")";
}
function scheduleLensRefresh(){
 if(!lensEnabled)return;
 clearTimeout(replicaTimer);
 replicaTimer=setTimeout(()=>requestAnimationFrame(createLensReplica),90);
}
function enableLens(){
 if(lensEnabled||!finePointer.matches||reduced.matches)return;
 lensEnabled=true;
 createLensReplica();
 document.body.classList.add("lens-active");
}
document.addEventListener("pointermove",event=>{
 if(event.pointerType!=="mouse"||!finePointer.matches||reduced.matches)return;
 if(!lensEnabled)enableLens();
 lensX=event.clientX;lensY=event.clientY;
 one("#cursorLens").classList.add("visible");
 if(!lensFrame)lensFrame=requestAnimationFrame(()=>{lensFrame=0;positionLens()});
},{passive:true});
document.addEventListener("pointerout",event=>{
 if(!event.relatedTarget)one("#cursorLens").classList.remove("visible");
});
addEventListener("scroll",()=>{positionLens()},{passive:true});
addEventListener("resize",()=>{
 if(!finePointer.matches||reduced.matches){
  lensEnabled=false;document.body.classList.remove("lens-active");
  one("#cursorLens").classList.remove("visible");
  one("#cursorReplica").replaceChildren();
 }else scheduleLensRefresh();
});

/* Physical Venetian blind: thick slats remain at the top when raised.
   Slat inclination and the shadow bands respond to the pointer. */
const SLATS=14;
const slatHost=one("#venetianSlats");
const blind=one("#venetianWindow");
const shadowHost=one("#blindShadowLayer");
let blindsOpened=false,blindPointerY=null,blindRAF=0,cordStartY=null,cordDrag=0,cordMoved=false;
for(let i=0;i<SLATS;i++){
 const slat=document.createElement("span");
 slat.className="blind-slat";
 slat.style.setProperty("--i",i);
 slat.style.setProperty("--slat-top",((i*100)/SLATS).toFixed(5)+"%");
 slat.style.setProperty("--lift-delay",((SLATS-1-i)*26)+"ms");
 slatHost.append(slat);
 const shadow=document.createElement("span");
 shadow.className="blind-shadow";
 shadow.style.setProperty("--i",i);
 shadow.style.setProperty("--slat-top",((i*100)/SLATS).toFixed(5)+"%");
 shadow.style.setProperty("--lift-delay",((SLATS-1-i)*26)+"ms");
 shadowHost.append(shadow);
}
const slats=many(".blind-slat"),shadows=many(".blind-shadow");
function resetSlats(){
 [...slats,...shadows,...many("#cursorReplica .blind-slat")].forEach(s=>{
  for(const prop of ["--tilt","--light","--slat-open"])s.style.removeProperty(prop);
 });
}
function updateLamelas(y){
 const rect=slatHost.getBoundingClientRect();
 const local=y-rect.top;
 const radius=Math.max(140,rect.height*.21);
 const clones=many("#cursorReplica .blind-slat");
 slats.forEach((slat,i)=>{
  const middle=(i+.5)*rect.height/SLATS;
  const force=Math.pow(Math.max(0,1-Math.abs(middle-local)/radius),1.07);
  const angle=(force*79).toFixed(1)+"deg";
  const light=force.toFixed(2);
  slat.style.setProperty("--tilt",angle);
  slat.style.setProperty("--light",light);
  slat.style.setProperty("--slat-open",light);
  if(shadows[i]){
   shadows[i].style.setProperty("--tilt",angle);
   shadows[i].style.setProperty("--light",light);
  }
  if(clones[i]){
   clones[i].style.setProperty("--tilt",angle);
   clones[i].style.setProperty("--light",light);
   clones[i].style.setProperty("--slat-open",light);
  }
 });
}
blind.addEventListener("pointermove",event=>{
 if(blindsOpened||!finePointer.matches||event.pointerType!=="mouse")return;
 if(event.target.closest("#blindCord"))return;
 blindPointerY=event.clientY;
 if(blindRAF)return;
 blindRAF=requestAnimationFrame(()=>{
  blindRAF=0;
  updateLamelas(blindPointerY);
 });
},{passive:true});
blind.addEventListener("pointerleave",()=>{if(!blindsOpened)resetSlats()});
function resetBlindsForHome(){
 blindsOpened=false;
 blind.classList.remove("is-lifting");
 const cord=one("#blindCord");
 cord.disabled=false;
 cord.setAttribute("aria-label","Tirar de la cuerda para subir la persiana");
 resetSlats();
 scheduleLensRefresh();
}
function openBlindsVisual(){
 blindsOpened=true;
 blind.classList.add("is-lifting");
 const cord=one("#blindCord");
 cord.disabled=false;
 cord.setAttribute("aria-label","Tirar de la cuerda para bajar la persiana");
 resetSlats();
 scheduleLensRefresh();
 setTimeout(scheduleLensRefresh,1300);
}
function liftBlinds(){
 if(blindsOpened)return;
 openBlindsVisual();
 history.pushState({view:"archive"},"","#archivo");
 switchView("archive",false);
}
function lowerBlinds(){
 if(!blindsOpened)return;
 history.pushState({view:"home"},"","#inicio");
 switchView("home",false);
}
const cord=one("#blindCord");
cord.addEventListener("pointerdown",event=>{
 cordStartY=event.clientY;cordDrag=0;cordMoved=false;
 if(cord.setPointerCapture)cord.setPointerCapture(event.pointerId);
 cord.classList.add("is-dragging");
});
cord.addEventListener("pointermove",event=>{
 if(cordStartY===null)return;
 const delta=event.clientY-cordStartY;
 cordDrag=Math.max(0,Math.min(115,Math.abs(delta)));
 cordMoved=cordMoved||cordDrag>9;
 cord.style.setProperty("--cord-drag",cordDrag+"px");
});
cord.addEventListener("pointerup",event=>{
 if(cordStartY===null)return;
 const distance=cordDrag;
 cordStartY=null;cord.classList.remove("is-dragging");
 cord.style.removeProperty("--cord-drag");
 if(distance>=34){
  if(blindsOpened)lowerBlinds();
  else liftBlinds();
 }
});
cord.addEventListener("pointercancel",()=>{
 cordStartY=null;cord.classList.remove("is-dragging");
 cord.style.removeProperty("--cord-drag");
});
cord.addEventListener("click",()=>{
 if(!cordMoved){
  if(blindsOpened)lowerBlinds();
  else liftBlinds();
 }
 cordMoved=false;
});



buildWall();
setDrawer(false);
switchView(routeFromHash(),false);
let lastSmall=innerWidth<700;
addEventListener("resize",()=>{
 const small=innerWidth<700;
 if(small!==lastSmall){
  lastSmall=small;resetCabinet();
  buildWall();
 }
});
