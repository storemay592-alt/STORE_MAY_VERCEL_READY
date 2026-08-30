# Store MAY Dashboard Interface System

## Direction and feel

El panel sirve a una administradora no técnica que prepara inventario en Excel y fotografías en grupos pequeños. Debe sentirse preciso, sereno y explícito: cada estado explica qué se procesará, qué se omitirá y qué acción falta antes de guardar.

## Visual system

- Paleta: papel claro, tinta, grises estructurales, verde para coincidencias confirmadas y ámbar para revisión.
- Profundidad: bordes finos y cambios sutiles de superficie; no usar sombras dramáticas.
- Tipografía: Montserrat para controles, instrucciones y datos comerciales.
- Espaciado: base de 8 px.
- Estados: toda espera debe mostrar progreso concreto; todo bloqueo debe explicar su causa junto al control.

## Importación por lotes parciales

- Una matriz completa puede usarse repetidamente con subconjuntos pequeños de fotografías.
- Solo se importan las filas que tengan al menos una fotografía confirmada en el lote actual.
- Las demás filas válidas de la matriz se omiten sin error y sin modificar productos existentes.
- El resumen previo debe indicar cuántos productos se guardarán y cuántas filas quedarán fuera del lote.
- Las fotografías amarillas requieren confirmación; las rojas requieren asignación manual o deben ignorarse.
- El botón final se habilita cuando existe al menos un producto con foto y no quedan imágenes pendientes de decisión.
- La carga de red nunca puede quedar indefinida: debe tener límite de tiempo y un mensaje de recuperación claro.
- Repetir la matriz no borra el catálogo. El modo predeterminado sigue siendo importar solo productos nuevos.

## Patrón de conciliación

La firma del importador es la conciliación visible entre foto y fila: miniatura, porcentaje de confianza, producto asignado y decisión. El muelle inferior resume el alcance real del lote antes de escribir en Neon.
