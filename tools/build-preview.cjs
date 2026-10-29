// npm install --prefix tools && node tools/build-preview.cjs
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'../experimental/threejs');
(async()=>{
 let source=fs.readFileSync(path.join(root,'room.js'),'utf8');
 const meta=fs.readFileSync(path.join(root,'assets/room-meta.json'),'utf8');
 const glb=fs.readFileSync(path.join(root,'assets/room.glb')).toString('base64');
 source=source.replace("const metaResponse = await fetch('./assets/room-meta.json');\n  if (!metaResponse.ok) throw new Error('Metadata unavailable');\n  const meta = await metaResponse.json();",'const meta = '+meta+';');
 source=source.replace("'./assets/room.glb'",JSON.stringify('data:model/gltf-binary;base64,'+glb));
 const result=await esbuild.build({stdin:{contents:source,resolveDir:root,sourcefile:'room.js'},bundle:true,write:false,format:'iife',minify:true,legalComments:'inline',plugins:[{name:'local-three',setup(build){build.onResolve({filter:/^three(?:\/|$)/},args=>({path:args.path==='three'?path.join(root,'vendor/three.module.js'):path.join(root,'vendor',args.path.slice(6))}));}}]});
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 html=html.replace('<link rel="stylesheet" href="room.css">','<style>'+fs.readFileSync(path.join(root,'room.css'),'utf8')+'</style>');
 html=html.replace(/<script type="importmap">.*?<\/script>/s,'');
 html=html.replace('<script type="module" src="room.js"></script>',()=>'<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
 html=html.replaceAll('../../index.html','https://5yg6bz97hz-alt.github.io/EFEDEGAM/');
 html=html.replace('../../favicon.svg','data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'../../favicon.svg')).toString('base64'));
 html=html.replace('assets/reference-blender.webp','data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/reference-blender.webp')).toString('base64'));
 const out=path.join(root,'EFEDEGAM-experimental.html');fs.writeFileSync(out,html);console.log(out+' ('+Buffer.byteLength(html)+' bytes)');
})();
