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
const views={home:one("#homeView"),archive:one("#archiveView"),about:one("#aboutView")};
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
 const mid=one('[data-drawer="middle"]');
 mid.setAttribute("aria-expanded",String(drawerOpen));
 mid.setAttribute("aria-label",drawerOpen?"Cerrar el cajón central":"Abrir el cajón central de proyectos");
 one("#drawerInstruction").textContent=drawerOpen?"Elige una carpeta; pulsa el frente central para cerrar.":"Solo el cajón central se puede abrir. Los otros dos están cerrados con llave.";
 many(".file-tab").forEach(card=>{card.disabled=!drawerOpen;card.classList.remove("is-selected","is-shifted")});
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
 const face=one(kind==="top"?"#topDrawer":"#bottomDrawer");
 face.classList.remove("locked-jiggle");
 void face.offsetWidth; // restart CSS animation on repeated clicks
 face.classList.add("locked-jiggle");
 one("#drawerInstruction").textContent="Ese cajón está cerrado con llave. Prueba el del medio.";
 clearTimeout(lockedTimer);
 lockedTimer=setTimeout(()=>face.classList.remove("locked-jiggle"),500);
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
function fanCards(index){
 if(!drawerOpen||picking||!finePointer.matches)return;
 many(".file-tab").forEach((card,i)=>card.classList.toggle("is-shifted",i>index));
 scheduleLensRefresh();
}
function clearFan(){
 if(picking)return;
 many(".file-tab").forEach(card=>card.classList.remove("is-shifted"));
 scheduleLensRefresh();
}
function pickFolder(index){
 if(!drawerOpen||picking)return;
 picking=true;
 const cards=many(".file-tab");
 cards.forEach(card=>card.classList.remove("is-shifted","is-selected"));
 cards[index].classList.add("is-selected");
 setTimeout(()=>{picking=false;openProject(index)},reduced.matches?0:390);
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
  for(const [name,element] of Object.entries(views))element.hidden=name!==view;
  activeView=view;
  document.body.classList.toggle("is-archive",view==="archive");
  if(view!=="archive"){clearTimeout(openingTimer);setDrawer(false);cabinetFocused=false;one("#cabinet").classList.remove("is-focused")}
  many(".nav a").forEach(link=>{
   if(link.dataset.view===view)link.setAttribute("aria-current","page");
   else link.removeAttribute("aria-current");
  });
  window.scrollTo({top:0,behavior:"instant"});
  scheduleLensRefresh();
 };
 if(animate&&!reduced.matches){
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
 clone.querySelectorAll("[id]").forEach(element=>element.removeAttribute("id"));
 container.replaceChildren(clone);
 positionLens();
}
function positionLens(){
 if(!lensEnabled)return;
 const lens=one("#cursorLens");
 lens.style.left=lensX+"px";lens.style.top=lensY+"px";
 const zoom=1.55;
 const half=50;
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
buildFolders();
setDrawer(false);
switchView(routeFromHash(),false);
