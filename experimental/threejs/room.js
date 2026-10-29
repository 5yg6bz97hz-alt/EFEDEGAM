import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const buttons = [...document.querySelectorAll('.toolbar button')];
buttons.forEach(b => b.disabled = true);
const debug = new URLSearchParams(location.search).has('debug');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#c3cbc3');
let renderer, camera, presets = {}, activePreset = 'CAM_01_Referencia';
let transition = null, sequence = null, raf = 0, ready = false, suspendedAt = 0;
const stats = { sourceMeshes: 0, batches: 0, drawers: 0, cameras: 0, textures: 0 };
const labels = { CAM_01_Referencia: '01 / VISTA GENERAL', CAM_03_Lateral: '02 / PERSPECTIVA LATERAL', CAM_04_Cajones: '03 / DETALLE DEL ARCHIVO' };

function fail(error) {
  console.error(error);
  cancelAnimationFrame(raf); raf = 0;
  $('loading').hidden = true; $('error').hidden = false;
  $('errorMessage').textContent = 'Comprueba la conexión y que tu navegador permita gráficos WebGL. Puedes seguir visitando el portfolio actual.';
  document.body.dataset.state = 'error';
}
function pose(cam) {
  return { position: cam.getWorldPosition(new THREE.Vector3()), quaternion: cam.getWorldQuaternion(new THREE.Quaternion()), fov: cam.fov };
}
function applyPose(p) {
  camera.position.copy(p.position); camera.quaternion.copy(p.quaternion); camera.fov = p.fov;
  camera.updateProjectionMatrix();
}
function blend(a, b, t) {
  camera.position.lerpVectors(a.position, b.position, t);
  camera.quaternion.slerpQuaternions(a.quaternion, b.quaternion, Math.min(1, Math.max(0, t)));
  camera.fov = THREE.MathUtils.lerp(a.fov, b.fov, Math.min(1, Math.max(0, t)));
  camera.updateProjectionMatrix();
}
function responsivePose(name) {
  const result = { ...presets[name], position: presets[name].position.clone(), quaternion: presets[name].quaternion.clone() };
  // Preserve source vertical field of view. Portrait gets a modest wider view,
  // without moving the camera outside the enclosed room or stretching geometry.
  if (mobile.matches) result.fov = Math.min(70, result.fov * 1.25);
  return result;
}
function resetSequence() {
  sequence = null; transition = null;
  $('title').classList.remove('visible'); $('skip').hidden = true; $('play').hidden = false;
}
function setReference(show) {
  $('reference').hidden = !show;
  $('compare').setAttribute('aria-pressed', String(show));
  $('compare').textContent = show ? 'Volver a la sala 3D' : 'Ver referencia Blender';
}
function selectCamera(name, immediate = false) {
  if (!ready) return;
  resetSequence(); setReference(false); activePreset = name;
  document.querySelectorAll('[data-camera]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.camera === name)));
  $('viewLabel').textContent = labels[name];
  $('status').textContent = 'Estudio de materiales, luz y perspectiva. Las interacciones del portfolio se integrarán en la siguiente fase.';
  const target = responsivePose(name);
  if (immediate || reduced.matches) applyPose(target);
  else transition = { from: pose(camera), to: target, start: performance.now(), duration: 1000 };
  document.body.dataset.state = 'ready'; requestRender();
}
function arrivalPose() {
  const p = responsivePose('CAM_02_Recorrido');
  p.position.set(0, 1.36, mobile.matches ? 2.8 : 2.35);
  p.quaternion.identity();
  return p;
}
function finishSequence() {
  resetSequence(); applyPose(arrivalPose()); activePreset = null;
  $('viewLabel').textContent = '04 / FRENTE AL ARCHIVO';
  $('status').textContent = 'Fin del recorrido. Cambia de vista para inspeccionar la sala.';
  document.body.dataset.state = 'arrived'; requestRender();
}
function play() {
  if (!ready) return;
  resetSequence(); setReference(false);
  document.querySelectorAll('[data-camera]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  if (reduced.matches) { finishSequence(); return; }
  activePreset = null;
  sequence = { start: performance.now(), from: responsivePose('CAM_01_Referencia'), to: arrivalPose() };
  applyPose(sequence.from); $('play').hidden = true; $('skip').hidden = false;
  $('viewLabel').textContent = 'RECORRIDO / EFEDEGAM';
  $('status').textContent = 'Vista general · aparición · aceleración · frenada';
  document.body.dataset.state = 'playing'; requestRender();
}
function tick(now) {
  raf = 0;
  if (!ready || document.hidden) return;
  if (transition) {
    const t = Math.min(1, (now - transition.start) / transition.duration);
    blend(transition.from, transition.to, t*t*(3-2*t));
    if (t === 1) transition = null;
  }
  if (sequence) {
    const elapsed = now - sequence.start;
    $('title').classList.toggle('visible', elapsed >= 600 && elapsed < 2550);
    if (elapsed < 2800) applyPose(sequence.from);
    else if (elapsed < 3620) {
      const t = (elapsed - 2800) / 820;
      // Reach the end at speed, then visibly brake and settle. No clamping
      // of the position: the small overrun is intentional and remains in-room.
      const k = t < .78 ? Math.pow(t/.78, 2.8)*1.025 : 1 + .025*Math.pow(1-(t-.78)/.22, 2);
      blend(sequence.from, sequence.to, k);
    } else if (elapsed < 4000) {
      applyPose(sequence.to);
      const t = (elapsed - 3620) / 380;
      camera.position.x += Math.sin(t * Math.PI * 4) * .009 * (1-t)**2;
      camera.position.y += Math.sin(t * Math.PI * 3) * .005 * (1-t)**2;
    } else finishSequence();
  }
  renderer.render(scene, camera);
  stats.calls = renderer.info.render.calls; stats.triangles = renderer.info.render.triangles;
  stats.width = innerWidth; stats.height = innerHeight; stats.pixelRatio = renderer.getPixelRatio();
  if (debug) { $('diagnostics').hidden = false; $('diagnostics').textContent = JSON.stringify(stats,null,2); }
  if (transition || sequence) requestRender();
}
function requestRender() { if (!raf && !document.hidden) raf = requestAnimationFrame(tick); }

// Shared source geometry stays shared on the GPU. Retain each original node
// name and transform so the next phase can animate a drawer without merging it.
function batchMeshes(root) {
  root.updateMatrixWorld(true);
  const groups = new Map(), originals = [];
  root.traverse(obj => {
    if (!obj.isMesh) return;
    stats.sourceMeshes++;
    const key = obj.geometry.uuid + ':' + (Array.isArray(obj.material) ? obj.material.map(m=>m.uuid).join(',') : obj.material.uuid);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(obj); originals.push(obj);
  });
  for (const meshes of groups.values()) {
    const first = meshes[0];
    const batch = new THREE.InstancedMesh(first.geometry, first.material, meshes.length);
    batch.name = 'batch_' + first.name;
    batch.userData.sources = meshes.map(m => ({ name: m.name, parent: m.parent?.name, matrix: m.matrixWorld.toArray() }));
    meshes.forEach((mesh,i) => batch.setMatrixAt(i,mesh.matrixWorld));
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    batch.castShadow = !first.name.startsWith('PANEL_LUZ'); batch.receiveShadow = true;
    scene.add(batch); stats.batches++;
  }
  originals.forEach(m => m.removeFromParent());
}
async function init() {
  renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile.matches?1.25:1.5));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  $('stage').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Sala de archivo en tres dimensiones');
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail(new Error('WebGL context lost'));});
  const metaResponse = await fetch('./assets/room-meta.json');
  if (!metaResponse.ok) throw new Error('Metadata unavailable');
  const meta = await metaResponse.json();
  const gltf = await new GLTFLoader().loadAsync('./assets/room.glb', event=>{
    if(event.total){const p=event.loaded/event.total;$('loadStatus').textContent='Recuperando materiales y geometría… '+Math.round(p*100)+'%';document.querySelector('progress').value=p;document.querySelector('progress').max=1;}
  });
  scene.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
  gltf.cameras.forEach(c => presets[c.name]=pose(c));
  for (const name of ['CAM_01_Referencia','CAM_02_Recorrido','CAM_03_Lateral','CAM_04_Cajones']) if (!presets[name]) throw new Error('Missing source camera '+name);
  stats.cameras = gltf.cameras.length; stats.drawers = meta.drawers; stats.textures = meta.images.length;
  camera = new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.025,50);
  const materials = new Set();
  gltf.scene.traverse(obj=>{
    if(obj.isMesh) (Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>materials.add(m));
    // Point lights are preserved from the export. Area lights are recreated below.
    if(obj.isLight) obj.visible = false; // Area lights replace the source web placeholders; no point hotspots.
  });
  for (const mat of materials) if(mat.map) mat.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  RectAreaLightUniformsLib.init();
  for(const a of meta.areaLights){
    const intensity=2.0*a.powerWatts/(a.width*a.height*Math.PI);
    const light=new THREE.RectAreaLight(new THREE.Color(.93,.98,1),intensity,a.width,a.height);
    light.name=a.name; light.position.fromArray(a.position); light.quaternion.fromArray(a.quaternion); scene.add(light);
  }
  // Economical approximation to the diffuse room bounce that Cycles computes.
  scene.add(new THREE.HemisphereLight(0xe8f2ef,0x55634c,.65));
  const shadowLight = new THREE.DirectionalLight(0xe5f1ee,.3);
  shadowLight.position.set(-1,2.6,4.5); shadowLight.target.position.set(0,1,-.2);
  shadowLight.castShadow=true;shadowLight.shadow.mapSize.set(1024,1024);
  Object.assign(shadowLight.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});
  shadowLight.shadow.normalBias=.002; shadowLight.shadow.bias=.0005;
  scene.add(shadowLight,shadowLight.target);
  batchMeshes(gltf.scene);renderer.shadowMap.needsUpdate=true;
  ready=true;buttons.forEach(b=>b.disabled=false);$('loading').hidden=true;
  selectCamera('CAM_01_Referencia',true);
  // Inspectable counters for repeatable smoke tests, never shown in the normal UI.
  if(debug)window.__room={stats,get camera(){return pose(camera)},get state(){return document.body.dataset.state},get scene(){return scene}};
}
buttons.filter(b=>b.dataset.camera).forEach(b=>b.addEventListener('click',()=>selectCamera(b.dataset.camera)));
$('play').addEventListener('click',play);$('skip').addEventListener('click',finishSequence);
$('compare').addEventListener('click',()=>{const show=$('reference').hidden;if(show){selectCamera('CAM_01_Referencia',true);}setReference(show);});
addEventListener('keydown',event=>{if(event.key==='Escape'){if(sequence)finishSequence();setReference(false);}});
addEventListener('resize',()=>{
  if(!ready)return;
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile.matches?1.25:1.5));renderer.setSize(innerWidth,innerHeight);
  if(sequence) finishSequence(); else if(activePreset) selectCamera(activePreset,true);
  requestRender();
});
reduced.addEventListener('change',()=>{if(sequence&&reduced.matches)finishSequence();if(transition&&reduced.matches){applyPose(transition.to);transition=null;requestRender();}});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){suspendedAt=performance.now();cancelAnimationFrame(raf);raf=0;}
  else{const pause=performance.now()-suspendedAt;if(sequence)sequence.start+=pause;if(transition)transition.start+=pause;requestRender();}
});
init().catch(fail);
