# Sala experimental · EFEDEGAM

Primera integración nativa del Blender: materiales, cámaras, luz y recorrido. La web de `main` no se modifica.

## Abrir sin instalar nada
Descarga `EFEDEGAM-experimental.html` y ábrelo en Chrome, Edge, Firefox o Safari con WebGL. Incluye el motor, el modelo y la referencia; no solicita archivos externos para funcionar. La validación automatizada se ha realizado en Chromium, no en todos esos navegadores.

Para servir la versión modular desde la raíz del repositorio: `python3 -m http.server 8765`, y abre `/experimental/threejs/`. Las dependencias están fijadas localmente en Three.js 0.160.1; no hay CDN en tiempo de ejecución.

## Incluido
- GLB exportado con Blender 4.3.2, conservando dos texturas empaquetadas de 512 px, normales, UV, materiales, emisivos, cuatro cámaras y tres luces puntuales.
- 156 cajones completos y sus identificadores originales. Los materiales no se sustituyen por colores genéricos.
- Tres encuadres seleccionables derivados de las cámaras originales. En vertical se amplía moderadamente el campo visual; no se deforma el espacio ni se atraviesan las paredes.
- Luz de área reconstruida desde los datos del Blender; relleno ambiental y una sombra estática para aproximar el rebote de Cycles. Las luces puntuales exportadas se conservan pero se desactivan en el visor para evitar focos especulares. La iluminación web es una aproximación, no un lightmap de Cycles.
- Recorrido manual: plano general, título, aceleración, frenada y pequeña oscilación de cámara. Salto inmediato, cancelación y respeto del movimiento reducido.
- Render bajo demanda: sin animación, no se mantiene un bucle continuo; se suspende al ocultar la pestaña. Resolución de píxel limitada en móvil y escritorio.
- 569 piezas de render agrupadas en 18 lotes por geometría/material mediante instancias. Se mantienen nombres y matrices de origen para la futura interacción. 32.156 triángulos en la vista general.
- Comparación con un render de la cámara de referencia del Blender. Coincide el encuadre a 16:9; en otros formatos la imagen de referencia mantiene su proporción.

## Pendiente
Esta fase verifica el espacio. Los cajones aún no se abren con clic y los contenidos 023, 099, planta, película, teléfono y ticket siguen en la web original. La siguiente fase debe enlazarlos con identificadores del modelo, conservando teclado/tacto y el volumen completo de cada cajón.

No se ha medido rendimiento en un teléfono físico. No hay aún una URL de GitHub Pages para esta rama: el HTML autónomo permite revisar el resultado sin cambiar la configuración de publicación.

## Regeneración
1. Con Blender 4.3.2: `blender -b /ruta/Espacio_Portfolio.blend --python tools/export-room.py -- experimental/threejs/assets`. No guarda cambios en el archivo fuente.
2. Convierte `assets/reference-blender.png` a `assets/reference-blender.webp` (calidad 90), y elimina el PNG de salida antes de hacer commit; se conserva el WebP de distribución.
3. `npm install --prefix tools` y `node tools/build-preview.cjs`.

El script produce `room.glb`, `room-meta.json` y un render de referencia. Las luces de área no viajan directamente en glTF: su posición, orientación y dimensiones se escriben en los metadatos para reconstruirlas en Three.js.

Diagnóstico opcional: añade `?debug` a la URL para inspeccionar estadísticas y `window.__room`.
