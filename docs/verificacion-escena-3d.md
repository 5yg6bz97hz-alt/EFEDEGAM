# Verificación de la primera escena 3D

Fecha: 2026-10-28. Rama: experimental/threejs-blender.

- Blender 4.3.2: exportación nativa y render Cycles completados.
- GLB: 907724 bytes, 156 cajones, 4 cámaras, 2 imágenes de 512×512 y 11 materiales. Todas las primitivas conservan normales y UV.
- Khronos glTF Validator 2.0.0-dev.3.10: 0 errores, 0 advertencias; 38 avisos informativos de atributos sin uso y nodos vacíos de luces de área.
- Chromium 138 / Playwright: apertura modular y HTML autónomo, sin errores JavaScript ni recursos fallidos. HTML autónomo probado desde file:// sin solicitudes HTTP.
- Controles: cambio de cámara, comparación, Escape, recorrido completo, repetición y salto.
- Movimiento reducido: llegada inmediata y cámara estable tras esperar.
- Vista móvil emulada 390×844: sin desbordamiento horizontal, controles visibles y con altura táctil de al menos 40 px. Inspección visual de vistas general, lateral, detalle y móvil.
- Vista general: 18 llamadas de dibujo de color / 32156 triángulos. 569 piezas de render agrupadas en 18 lotes. La generación inicial de sombras tiene coste adicional; no se regenera cada fotograma.

No equivale a una prueba en móvil físico ni certifica FPS, Safari o Firefox. La iluminación es una aproximación en tiempo real; no se ha horneado la iluminación global de Cycles.

Main, su index.html, app.js y sus estilos permanecen sin cambios. No se ha cambiado la configuración de GitHub Pages.
