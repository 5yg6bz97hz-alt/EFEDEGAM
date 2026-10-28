# EFEDEGAM — revisión inicial 3D
Fecha: 2026-10-28. Base: 470a582be1aa3d45721408745824762ac93f6335.

## Separación experimental
Rama experimental/threejs-blender creada desde main. No se han cambiado main, index.html ni la configuración de publicación. Esta rama todavía no es una nueva web publicada.

## Archivos revisados
- Repositorio: index.html, app.js, room-v20.css, README e inventario completo.
- Espacio_Portfolio.blend: 943285 bytes, cabecera Blender 4.03; inspección binaria, sin renderizado en Blender.
- efedegam-room-from-blender.glb: 102364 bytes; JSON y estructura de atributos revisados.
- EFEDEGAM_prueba_espacio_3D.html: visor separado, con GLB comprimido incrustado.

## Hallazgos
La web main es una sala simulada en HTML/CSS. Carga 16 hojas CSS sucesivas. Su aproximación al archivo escala room-world: no desplaza una cámara por geometría real. Los tres archivos de Blender/prueba no estaban en el árbol de main.

El Blender contiene 425 bloques de objeto, 16 de malla, 12 de material, 7 de luz y 4 de cámara. Cámaras: CAM_01_Referencia, CAM_02_Recorrido, CAM_03_Lateral, CAM_04_Cajones. Hay referencias a texturas Moqueta_color_512.png y Moqueta_normal_512.png. No se ha verificado aún si sus datos están empaquetados; la búsqueda por nombre no encontró archivos independientes.

El GLB fue generado con trimesh. Tiene 571 nodos, 18 mallas y 11 materiales de color básico. No contiene imágenes, texturas, cámaras, animaciones ni extensión de luces. Las primitivas solo contienen POSITION, sin NORMAL ni TEXCOORD_0. No debe considerarse una exportación visual fiel del Blender.

El HTML usa Three.js 0.160.1, cámara de 60 grados y puntos inicial/final escritos manualmente. Añade luces generales; no configura sombras. Fuerza DoubleSide en todas las mallas. Solo anima el desplazamiento de frentes tras el impacto; no implementa selección y apertura interactiva. La interpolación calcula sobrepaso pero lo limita a 1, anulando ese sobrepaso de cámara. El modo de movimiento reducido aún ejecuta la sacudida de cajones.

## Elementos que conservar
En app.js existen proyectos 023, EL VACÍO 099, planta pixelada, película, teléfono y ticket. Planta y teléfono tienen SVG; película y ticket se construyen en HTML/CSS. Los proyectos son seis fichas de ejemplo. El correo de contacto está vacío y el ticket indica texto provisional.

La web usa 15×9 cajones en escritorio y 9×10 en móvil. La prueba se identifica como 13×12; habrá que asignar interacciones mediante identificadores estables, sin trasladar posiciones de cuadrícula a ciegas.

## Orden de implementación
1. Inspeccionar Blender en su motor, resolver texturas y exportar conservando materiales, normales, UV, cámaras y jerarquía útil. Comparar un encuadre web con un render de referencia.
2. Construir la escena experimental en carpeta separada. Recuperar proporciones y cámaras del modelo. Ajustar iluminación fría y sombras con un presupuesto medido.
3. Implementar secuencia: plano general, EFEDEGAM, aceleración, frenada e impacto; salto y movimiento reducido sin sacudidas.
4. Añadir cajones completos con interior y carpetas. Migrar los seis elementos; acceso por ratón, tacto y teclado.
5. Medir triángulos, llamadas de dibujo, memoria de texturas, carga y rendimiento real. Reutilizar geometría/materiales; comprimir solo después de validar fidelidad.

## Límites de esta revisión
No se ha ejecutado ni renderizado Blender: el entorno no dispone de blender ni bpy. No se ha realizado prueba visual del visor en navegador ni medido FPS en móviles. La revisión no certifica todavía apariencia ni rendimiento.
