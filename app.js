"use strict";
// EFEDEGAM / archivo personal. Los proyectos siguen siendo ejemplos editables.
const projects=[
 {title:"Espacios imaginados",category:"Arquitectura",color:"#f6e474",word:"ESPACIOS",description:"Aquí irán proyectos de arquitectura, renders, planos y procesos de diseño."},
 {title:"Cortar y pegar",category:"Fotomontajes",color:"#efabbd",word:"COLLAGES",description:"Composiciones, recortes, fotomontajes y nuevas maneras de mirar."},
 {title:"De mi cuaderno",category:"Dibujos",color:"#c6dbaa",word:"TRAZOS",description:"Dibujos, croquis e ideas que todavía no tienen forma."},
 {title:"Dentro del estudio",category:"Arquitectura profesional",color:"#b3c8ea",word:"ESTUDIO",description:"Una selección de trabajos profesionales, cuando esté autorizada su publicación."},
 {title:"Cosas que se tocan",category:"Objetos",color:"#ef9a7b",word:"OBJETOS",description:"Diseños, prototipos, impresiones 3D y experimentos materiales."},
 {title:"Sin clasificar",category:"Experimentos",color:"#e0c9e5",word:"ETC.",description:"Para todo aquello que se resiste a encajar en una categoría."}
];
const one=selector=>document.querySelector(selector);
const many=selector=>Array.from(document.querySelectorAll(selector));
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const finePointer=matchMedia("(pointer:fine)");
const views={home:one("#homeView"),archive:one("#homeView"),about:one("#aboutView")};
let activeView=null,drawerOpen=false,picking=false,selectedProject=0,previousFocus=null,navigating=false;
let lensX=innerWidth/2,lensY=innerHeight/2,lensFrame=0,lensEnabled=false,replicaTimer=null;
function buildFolders(){
 const holder=one("#fileStack"),touch=one("#touchFileButtons");
 projects.forEach((project,index)=>{
  const label=String(index+1).padStart(2,"0");
  const card=document.createElement("button");
  card.type="button";card.className="file-tab";
  card.style.setProperty("--index",index);
  card.style.setProperty("--tab-color",project.color);
  card.style.setProperty("--tab-left",["8%","24%","53%","12%","40%","62%"][index]);
  card.innerHTML='<span class="file-number">'+label+'</span><span class="file-name">'+project.title+'</span><span class="file-arrow">↗</span>';
  card.setAttribute("aria-label","Abrir carpeta "+label+": "+project.title);
  card.addEventListener("mouseenter",()=>fanCards(index));
  card.addEventListener("focus",()=>fanCards(index));
  card.addEventListener("click",()=>pickFolder(index));
  holder.append(card);
  const shortcut=document.createElement("button");
  shortcut.type="button";shortcut.textContent=label+" · "+project.title;
  shortcut.setAttribute("aria-label","Abrir "+project.title);
  shortcut.addEventListener("click",()=>pickFolder(index));
  touch.append(shortcut);
 });
 holder.addEventListener("pointermove",event=>{
  if(!drawerOpen||picking||event.pointerType!=="mouse")return;
  const rect=holder.getBoundingClientRect();
  const pos=Math.max(0,Math.min(projects.length-1,((event.clientY-rect.top)/Math.max(1,rect.height))*(projects.length-1)));
  sweepCards(pos);
 });
 holder.addEventListener("mouseleave",clearFan);
 holder.addEventListener("focusout",event=>{if(!holder.contains(event.relatedTarget))clearFan()});
}
let cabinetFocused=false;
let openingTimer=null;
let lockedTimer=null;
function setDrawer(isOpen){
 drawerOpen=Boolean(isOpen);
 const cabinet=one("#cabinet");
 cabinet.classList.toggle("is-open",drawerOpen);
 many('[data-drawer="middle"]').forEach(button=>{
  button.setAttribute("aria-expanded",String(drawerOpen));
  button.setAttribute("aria-label",drawerOpen?"Cerrar el cajón central":"Acercar y abrir el cajón central de proyectos");
 });
 one("#cabinetOpenControls").setAttribute("aria-hidden",String(!drawerOpen));
 many("#cabinetClosedControls button").forEach(button=>button.disabled=drawerOpen);
 many("#cabinetOpenControls > button").forEach(button=>button.disabled=!drawerOpen);
 one("#drawerInstruction").textContent=drawerOpen?"Elige una carpeta; pulsa el frente central para cerrar.":"Solo el cajón central se puede abrir. Los otros dos están cerrados con llave.";
 many(".file-tab").forEach(card=>{card.disabled=!drawerOpen;card.classList.remove("is-selected","is-shifted","is-under-hand");card.style.removeProperty("--paper-offset");card.style.removeProperty("--paper-scale");card.style.removeProperty("--paper-tilt");card.style.removeProperty("--paper-light")});
 many("#touchFileButtons button").forEach(btn=>{btn.disabled=!drawerOpen});
 one("#touchFiles").hidden=!drawerOpen;
 scheduleLensRefresh();setTimeout(scheduleLensRefresh,780);
}
function focusCabinet(){
 if(cabinetFocused)return;
 cabinetFocused=true;
 one("#cabinet").classList.add("is-focused");
 one("#drawerInstruction").textContent="Ahora puedes probar los tres cajones. Solo se abre el central.";
 scheduleLensRefresh();setTimeout(scheduleLensRefresh,900);
}
function jiggleLocked(kind){
 const cabinet=one("#cabinet");
 cabinet.classList.remove("locked-top","locked-bottom");
 void cabinet.offsetWidth;
 const cls=kind==="top"?"locked-top":"locked-bottom";
 cabinet.classList.add(cls);
 one("#drawerInstruction").textContent="Ese cajón está cerrado con llave. Prueba el del medio.";
 clearTimeout(lockedTimer);
 lockedTimer=setTimeout(()=>cabinet.classList.remove(cls),500);
 scheduleLensRefresh();
}
function clickDrawer(kind){
 if(!cabinetFocused){
  focusCabinet();
  clearTimeout(openingTimer);
  openingTimer=setTimeout(()=>{
   if(activeView!=="archive")return;
   if(kind==="middle")setDrawer(true);
   else jiggleLocked(kind);
  },reduced.matches?0:730);
 }else if(kind==="middle"){
  clearTimeout(openingTimer);
  setDrawer(!drawerOpen);
 }else{
  jiggleLocked(kind);
 }
}
function sweepCards(position){
 if(!drawerOpen||picking||!finePointer.matches)return;
 const cards=many(".file-tab");
 cards.forEach((card,i)=>{
  const distance=Math.abs(i-position);
  const strength=Math.max(0,1-distance*.78);
  const isForward=i>position;
  const shift=strength>0 ? -76*strength : (isForward?27:0);
  card.style.setProperty("--paper-offset",shift.toFixed(2)+"%");
  card.style.setProperty("--paper-scale",(1+strength*.09).toFixed(3));
  card.style.setProperty("--paper-tilt",(-20*strength).toFixed(1)+"deg");
  card.style.setProperty("--paper-light",strength.toFixed(2));
  card.classList.toggle("is-under-hand",strength>.37);
  card.classList.toggle("is-shifted",isForward);
 });
 // Keep the moving lens synchronized without rebuilding the entire DOM.
 const clones=many("#cursorReplica .file-tab");
 if(clones.length===cards.length)cards.forEach((card,i)=>{
  for(const prop of ["--paper-offset","--paper-scale","--paper-tilt","--paper-light"])
   clones[i].style.setProperty(prop,card.style.getPropertyValue(prop));
 });
}
function fanCards(index){sweepCards(index)}
function clearFan(){
 if(picking)return;
 many(".file-tab, #cursorReplica .file-tab").forEach(card=>{
  card.classList.remove("is-shifted","is-under-hand");
  for(const prop of ["--paper-offset","--paper-scale","--paper-tilt","--paper-light"])
   card.style.removeProperty(prop);
 });
 scheduleLensRefresh();
}
function pickFolder(index){
 if(!drawerOpen||picking)return;
 picking=true;
 const cards=many(".file-tab");
 cards.forEach(card=>{card.classList.remove("is-shifted","is-selected","is-under-hand");card.style.removeProperty("--paper-offset");card.style.removeProperty("--paper-scale");card.style.removeProperty("--paper-tilt");card.style.removeProperty("--paper-light")});
 cards[index].classList.add("is-selected");
 setTimeout(()=>{
  picking=false;
  if(!drawerOpen||activeView!=="archive")return;
  openProject(index);
 },reduced.matches?0:320);
}
function openProject(index){
 selectedProject=index;
 previousFocus=document.activeElement;
 const p=projects[index];
 one("#projectTitle").textContent=p.title;
 one("#projectCategory").textContent=p.category.toUpperCase();
 one("#projectDescription").textContent=p.description;
 one("#projectRef").textContent="FICHA DE ARCHIVO / "+String(index+1).padStart(3,"0")+" — 006";
 one("#projectArtNo").textContent=String(index+1).padStart(3,"0");
 one("#projectWord").textContent=p.word;
 one("#projectArtwork").style.setProperty("--project-color",p.color);
 const modal=one("#projectModal");modal.hidden=false;modal.setAttribute("aria-hidden","false");
 document.body.style.overflow="hidden";
 one("#closeProject").focus();
 scheduleLensRefresh();
}
function closeProject(restoreFocus=true){
 const modal=one("#projectModal");
 if(modal.hidden)return;
 modal.hidden=true;modal.setAttribute("aria-hidden","true");
 document.body.style.overflow="";
 many(".file-tab").forEach(card=>card.classList.remove("is-selected"));
 if(restoreFocus&&previousFocus&&previousFocus.isConnected&&!previousFocus.disabled)previousFocus.focus();
 scheduleLensRefresh();
}
function switchView(view,animate=true){
 if(!views[view]||navigating)return;
 if(view===activeView)return;
 closeProject(false);
 const apply=()=>{
  one("#homeView").hidden=view==="about";
  one("#aboutView").hidden=view!=="about";
  one("#archiveView").inert=view!=="archive";
  activeView=view;
  document.body.classList.toggle("is-archive",view==="archive");
  document.body.classList.toggle("is-home",view==="home");
  if(view==="home"){
   resetBlindsForHome();
   clearTimeout(openingTimer);setDrawer(false);
   cabinetFocused=false;one("#cabinet").classList.remove("is-focused");
  }else if(view==="archive"){
   openBlindsVisual();
  }else{
   clearTimeout(openingTimer);setDrawer(false);
   cabinetFocused=false;one("#cabinet").classList.remove("is-focused");
  }
  many(".nav a").forEach(link=>{
   if(link.dataset.view===view)link.setAttribute("aria-current","page");
   else link.removeAttribute("aria-current");
  });
  window.scrollTo({top:0,behavior:"instant"});
  scheduleLensRefresh();
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
const routeFromHash=()=>location.hash==="#archivo"?"archive":location.hash==="#sobre-mi"?"about":"home";
many("[data-view]").forEach(link=>link.addEventListener("click",event=>{
 event.preventDefault();
 if(navigating)return;
 const view=link.dataset.view;
 if(activeView===view)return;
 history.pushState({view},"",view==="home"?"#inicio":view==="archive"?"#archivo":"#sobre-mi");
 switchView(view);
}));
addEventListener("popstate",()=>switchView(routeFromHash(),false));
addEventListener("hashchange",()=>switchView(routeFromHash(),false));
many("[data-drawer]").forEach(button=>{
 button.addEventListener("click",event=>{event.stopPropagation();clickDrawer(button.dataset.drawer)});
});
one("#cabinet").addEventListener("click",event=>{
 if(event.target.closest(".file-tab")||event.target.closest(".drawer-hit"))return;
 focusCabinet();
});
one("#closeProject").addEventListener("click",()=>closeProject());
one("#nextProject").addEventListener("click",()=>openProject((selectedProject+1)%projects.length));
one("#projectModal").addEventListener("click",event=>{if(event.target===event.currentTarget)closeProject()});
addEventListener("keydown",event=>{
 if(event.key==="Escape"){closeProject();return}
 const modal=one("#projectModal");
 if(event.key==="Tab"&&!modal.hidden){
  const targets=many("#projectModal button:not([disabled])");
  if(!targets.length)return;
  if(event.shiftKey&&document.activeElement===targets[0]){event.preventDefault();targets.at(-1).focus()}
  if(!event.shiftKey&&document.activeElement===targets.at(-1)){event.preventDefault();targets[0].focus()}
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

buildFolders();
setDrawer(false);
switchView(routeFromHash(),false);
