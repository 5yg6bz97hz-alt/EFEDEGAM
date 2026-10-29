"""Blender 4.3: blender -b Espacio_Portfolio.blend --python tools/export-room.py -- OUTPUT_DIR
Exports a derived web asset. Never saves or mutates the source .blend on disk.
"""
import bpy, json, sys, pathlib, math
from mathutils import Matrix
out=pathlib.Path(sys.argv[sys.argv.index('--')+1]).resolve();out.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
# Keep the source coordinate system in Blender; export converts to glTF Y up.
areas=[]
for obj in scene.objects:
 if obj.type=='LIGHT' and obj.data.type=='AREA':
  areas.append(dict(name=obj.name,position=[obj.location.x,obj.location.z,-obj.location.y],quaternion=list((Matrix.Rotation(-math.pi/2,4,'X')@obj.matrix_world).to_quaternion())[1:]+[(Matrix.Rotation(-math.pi/2,4,'X')@obj.matrix_world).to_quaternion().w],width=obj.data.size,height=obj.data.size_y if obj.data.shape in ['RECTANGLE','ELLIPSE'] else obj.data.size,powerWatts=obj.data.energy,color=list(obj.data.color)))
 if obj.name.startswith('CAJON_C'):
  obj['drawerId']=obj.name.replace('CAJON_','')
# Fail on missing texture data instead of silently shipping a gray model.
images=[]
for image in bpy.data.images:
 if image.type=='RENDER_RESULT':continue
 _ = image.size[:] # Force lazy packed-image decode before checking has_data.
 if not image.has_data:raise RuntimeError('Missing texture: '+image.name)
 images.append(dict(name=image.name,width=image.size[0],height=image.size[1],packed=bool(image.packed_file)))
bpy.ops.export_scene.gltf(filepath=str(out/'room.glb'),export_format='GLB',export_cameras=True,export_lights=True,export_extras=True,export_texcoords=True,export_normals=True,export_tangents=True,export_materials='EXPORT',export_animations=False,export_apply=False)
meta=dict(source='Espacio_Portfolio.blend',blender=bpy.app.version_string,images=images,areaLights=areas,referenceCamera=scene.camera.name,referenceAspect=scene.render.resolution_x/scene.render.resolution_y,drawers=sum(o.name.startswith('CAJON_C') for o in scene.objects))
(out/'room-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
# Reference render from the original scene, only resolution/sampling adjusted.
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'reference-blender.png')
bpy.ops.render.render(write_still=True)
print('EXPORT_AND_REFERENCE_COMPLETE')
