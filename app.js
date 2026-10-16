
const projects=[
["Espacios imaginados","Arquitectura","architecture","#f9e975","ESPACIOS","Arquitectura, renders, planos y procesos de diseño."],
["Cortar y pegar","Fotomontajes","collage","#ef9eaf","COLLAGE","Composiciones, recortes y otras realidades posibles."],
["De mi cuaderno","Dibujos","drawing","#d7e8b6","TRAZOS","Bocetos, dibujos e ideas incompletas."],
["Dentro del estudio","Trabajos de estudio","studio","#b2c9f2","ESTUDIO","Proyectos profesionales, sujetos a permisos y créditos."],
["Cosas que se tocan","Objetos y diseño","objects","#ef825e","OBJETOS","Objetos, prototipos y pequeñas piezas."],
["Sin clasificar","Experimentos","experiments","#e8d0ae","ETCÉTERA","Pruebas, ensayos y proyectos inesperados."]
];
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let currentView="home",drawerOpen=false,currentProject=0,previousFocus=null,transitioning=false;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const views={home:$("#homeView"),archive:$("#archiveView"),about:$("#aboutView")};
projects.forEach((p,i)=>{
 const n=String(i+1).padStart(2,"0"),btn=document.createElement("button");
 btn.type="button";btn.className="folder-card";btn.style.setProperty("--c",p[3]);btn.style.setProperty("--i",i);btn.style.setProperty("--tilt",[-5,2,-3,4,-2,6][i]+"deg");
 btn.innerHTML='<span class="folder-num">'+n+' / 06</span><strong class="folder-label">'+p[0]+'</strong><span class="folder-foot">ABRIR FICHA ↗</span>';
 btn.setAttribute("aria-label","Abrir proyecto: "+p[0]);btn.addEventListener("click",()=>pickFolder(i));$("#fileStack").append(btn);
});
function setDrawer(value){
 drawerOpen=value;$("#cabinet").classList.toggle("is-open",value);$("#drawerToggle").textContent=value?"↑ CERRAR CAJÓN":"↓ ABRIR CAJÓN";
 $("#drawerToggle").setAttribute("aria-expanded",String(value));$$(".folder-card").forEach(b=>b.tabIndex=value?0:-1);
}
function closeProject(restore=true){
 const overlay=$("#projectOverlay");if(!overlay.classList.contains("is-visible"))return;
 overlay.classList.remove("is-visible");overlay.setAttribute("aria-hidden","true");document.body.style.overflow="";
 $(".folder-card").forEach(card=>card.classList.remove("is-picking"));
 if(restore&&previousFocus)previousFocus.focus();
}
function setView(view,animate=true){
 if(!views[view]||transitioning)return;
 closeProject(false);
 if(view===currentView){if(view==="archive"&&!drawerOpen)setDrawer(true);return;}
 const change=()=>{
 Object.keys(views).forEach(key=>{views[key].hidden=key!==view;views[key].classList.toggle("is-active",key===view);});
 currentView=view;$$(".nav-btn").forEach(btn=>btn.classList.toggle("is-current",btn.dataset.nav===view));window.scrollTo(0,0);
 if(view==="archive")setTimeout(()=>setDrawer(true),reduced.matches?0:200);
 };
 if(animate&&!reduced.matches){
 transitioning=true;const wipe=$("#siteWipe");wipe.classList.remove("is-leaving");wipe.classList.add("is-cover");
 setTimeout(()=>{change();wipe.classList.remove("is-cover");wipe.classList.add("is-leaving");setTimeout(()=>{wipe.classList.remove("is-leaving");transitioning=false},620)},610);
 }else change();
}
function route(view){history.pushState({view:view},"","#"+(view==="home"?"inicio":view==="archive"?"archivo":"sobre-mi"));setView(view);}
function pickFolder(i){
 if(!drawerOpen)setDrawer(true);
 $(".folder-card").forEach(card=>card.classList.remove("is-picking"));
 const card=$(".folder-card")[i];if(card)card.classList.add("is-picking");
 setTimeout(()=>openProject(i),reduced.matches?0:460);
}
function openProject(i){
 const p=projects[i];if(!p)return;
 currentProject=i;previousFocus=document.activeElement;
 $("#sheetReference").textContent="ARCHIVO / FICHA N.º "+String(i+1).padStart(3,"0");
 $("#projectCategory").textContent=p[1].toUpperCase()+" / "+String(i+1).padStart(3,"0");
 $("#projectTitle").textContent=p[0];$("#projectDescription").textContent=p[5];$("#projectMetaCategory").textContent=p[1];
 $("#artWord").textContent=p[4];$("#artNumber").textContent=String(i+1).padStart(2,"0")+" / 06";
 $("#projectArtwork").className="artwork artwork--"+p[2];$("#projectOverlay").classList.add("is-visible");
 $("#projectOverlay").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";$("#closeProject").focus();
}
$$("[data-nav]").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();route(btn.dataset.nav);}));
$("#drawerToggle").addEventListener("click",()=>setDrawer(!drawerOpen));
$("#closeProject").addEventListener("click",()=>closeProject());
$("#nextProject").addEventListener("click",()=>openProject((currentProject+1)%projects.length));
$("#projectOverlay").addEventListener("click",e=>{if(e.target===e.currentTarget)closeProject()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){closeProject();return;}
 if(e.key==="Tab"&&$("#projectOverlay").classList.contains("is-visible")){
 const buttons=$$("#projectOverlay button");if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[buttons.length-1].focus();}
 else if(!e.shiftKey&&document.activeElement===buttons[buttons.length-1]){e.preventDefault();buttons[0].focus();}
 }
});
window.addEventListener("popstate",()=>setView(location.hash==="#archivo"?"archive":location.hash==="#sobre-mi"?"about":"home",false));
setDrawer(false);setView(location.hash==="#archivo"?"archive":location.hash==="#sobre-mi"?"about":"home",false);if(currentView==="archive")setDrawer(true);
// Opt-in glass: magnified live snapshot of the DOM, clipped by a circular optical lens.
const lens=$("#magnifier"),scene=$("#lensScene"),glass=$("#lensOptics"),switcher=$("#lensSwitch"),switchText=$("#lensSwitchText");
const fine=matchMedia("(pointer:fine)");let enabled=false,x=0,y=0,raf=0,replica=null,pending=false;
const warp='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><radialGradient id="a"><stop stop-color="#808080"/><stop offset=".7" stop-color="#808080"/><stop offset="1" stop-color="#ff8080"/></radialGradient></defs><rect width="200" height="200" fill="url(#a)"/></svg>';
$("#warpTexture").setAttribute("href","data:image/svg+xml;base64,"+btoa(warp));
function lensMove(){
 if(!enabled)return;
 lens.style.left=x+"px";lens.style.top=y+"px";
 scene.style.transform="translate("+(93-1.7*x)+"px,"+(93-1.7*y)+"px) scale(1.7)";
}
function updateReplica(){
 if(!enabled)return;
 replica=$("#siteFrame").cloneNode(true);replica.id="lensReplica";replica.style.width=innerWidth+"px";
 replica.setAttribute("aria-hidden","true");replica.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
 replica.querySelectorAll("button,a").forEach(el=>el.tabIndex=-1);scene.replaceChildren(replica);pending=false;lensMove();
}
function turnLens(on){
 enabled=Boolean(on&&fine.matches&&!reduced.matches);lens.classList.toggle("is-visible",enabled);
 document.body.classList.toggle("is-lens-on",enabled);switcher.setAttribute("aria-pressed",String(enabled));
 switchText.textContent=enabled?"LUPA: ON":"LUPA: OFF";
 if(enabled){updateReplica();glass.style.filter="url(#glassWarp)";}
 else{glass.style.filter="none";scene.replaceChildren();replica=null;}
}
switcher.addEventListener("click",()=>turnLens(!enabled));
document.addEventListener("pointermove",e=>{
 if(!enabled||e.pointerType!=="mouse")return;x=e.clientX;y=e.clientY;
 if(!raf)raf=requestAnimationFrame(()=>{raf=0;lensMove();});
},{passive:true});
document.addEventListener("pointerleave",()=>lens.classList.remove("is-visible"));
document.addEventListener("pointerenter",()=>{if(enabled)lens.classList.add("is-visible")});
new MutationObserver(records=>{
 if(!enabled||pending)return;
 if(records.every(r=>r.target.closest&&r.target.closest("#lensReplica")))return;
 pending=true;requestAnimationFrame(()=>{if(enabled)updateReplica();else pending=false;});
}).observe($("#siteFrame"),{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:["class","hidden","style","aria-hidden"]});
addEventListener("resize",()=>{if(!fine.matches)turnLens(false);else if(enabled)updateReplica();});
