---
name: Store MAY
description: Lujo multimarca silencioso, preciso y 100% original.
colors:
  graphite-console: "#2B2D31"
  carved-silver: "#A4A6AB"
  muted-metal: "#777A80"
  ink: "#111315"
  paper: "#CFD9E3"
  luminous-white: "#FFFFFF"
  cool-silver: "#C7CBD0"
  mist-silver: "#CED9E3"
typography:
  display:
    fontFamily: "Jost, Century Gothic, sans-serif"
    fontSize: "clamp(3rem, 5.4vw, 6.3rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Jost, Century Gothic, sans-serif"
    fontSize: "clamp(2.2rem, 3.4vw, 4.1rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Montserrat, Avenir Next, sans-serif"
    fontSize: "clamp(1.15rem, 1.5vw, 1.5rem)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Montserrat, Avenir Next, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Montserrat, Avenir Next, sans-serif"
    fontSize: "clamp(0.8rem, 0.95vw, 0.98rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.075em"
  category-label:
    fontFamily: "Jost, Century Gothic, sans-serif"
    fontSize: "clamp(1rem, 1.08vw, 1.17rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.035em"
rounded:
  control: "16px"
  card: "20px"
  capsule: "999px"
spacing:
  micro: "4px"
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  section: "96px"
components:
  category-neobutton:
    backgroundColor: "{colors.graphite-console}"
    textColor: "{colors.luminous-white}"
    typography: "{typography.category-label}"
    rounded: "{rounded.capsule}"
    padding: "8px 9px 8px 22px"
    width: "100%"
    height: "76px"
  category-neobutton-hover:
    backgroundColor: "{colors.graphite-console}"
    textColor: "{colors.luminous-white}"
    typography: "{typography.category-label}"
    rounded: "{rounded.capsule}"
    padding: "8px 9px 8px 22px"
    width: "100%"
    height: "76px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.luminous-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "16px 28px"
  faq-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "16px 20px"
  brand-logo-slot:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    width: "max-content"
    height: "78px"
    gap: "clamp(48px, 3.6vw, 68px)"
  search-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.capsule}"
    padding: "12px 18px"
  porcelain-header-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: "9px 16px"
  style-advisor-panel:
    backgroundColor: "transparent"
    textColor: "{colors.luminous-white}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "clamp(28px, 4vw, 54px)"
---

# Design System: Store MAY

## Overview

**Creative North Star: "El Atelier Iluminado"**

Store MAY se siente como entrar en una boutique silenciosa después del cierre: grafito mate, metal frío y señalética retroiluminada que dirige la mirada sin levantar la voz. La persona llega para descubrir moda original con rapidez; la interfaz debe permitirle elegir categoría, reconocer autenticidad y llegar al producto sin fricción.

El lujo nace de la proporción, el espacio y el detalle. Las superficies claras presentan producto; las superficies oscuras crean momentos de marca y control. La firma del sistema es una única fuente de luz blanca aplicada con intención, nunca un espectáculo de efectos.

**Key Characteristics:**

- Monocromía de blanco, negro, grafito y plateado.
- Jerarquía inmediata, texto breve y producto dominante.
- Relieve táctil contenido en controles importantes.
- Movimiento silencioso, rápido y sin rebotes.
- Accesibilidad y contenido indexable como parte del acabado premium.

## Colors

La paleta imita grafito pulido, acero satinado, papel editorial y luz blanca de escaparate.

### Primary

- **Graphite Console** (`#2B2D31`): escenario oscuro y superficie exacta de los controles neumórficos.
- **Luminous White** (`#FFFFFF`): luz focal reservada para la esfera interactiva, el foco y texto crítico.

### Secondary

- **Cool Silver** (`#C7CBD0`): estados activos y reflejos metálicos contenidos.
- **Mist Silver** (`#CED9E3`): campo azul plateado del catálogo y soporte de la luz posterior.
- **Carved Silver** (`#A4A6AB`): etiquetas talladas y navegación secundaria legible.
- **Muted Metal** (`#777A80`): flechas y metadatos de baja prioridad.

### Neutral

- **Ink** (`#111315`): texto principal, acciones sólidas y contraste editorial.
- **Paper / Page Silver** (`#CFD9E3`): lienzo unificado de catálogo, FAQ y contenido de producto, con variaciones de luz entre `#CBD6E0` y `#D5DEE7`.

**The One Light Rule.** En una misma zona sólo una capa puede emitir luz: esfera interactiva, foco o llamada principal. Todo lo demás permanece mate.

**The Monochrome Status Rule.** El estatus se expresa con contraste y materialidad; ningún color decorativo compite con el producto.

## Typography

**Display Font:** Jost (con Century Gothic como respaldo)  
**Body Font:** Montserrat (con Avenir Next como respaldo)  
**Signature Fonts:** Brittany Signature y Archicoco sólo en momentos de marca ya definidos.

**Character:** Jost aporta aire editorial y moda contemporánea; Montserrat sostiene navegación, precios y datos con precisión comercial. La combinación debe sentirse sobria, no tecnológica ni genérica.

### Hierarchy

- **Display** (300, `clamp(3rem, 5.4vw, 6.3rem)`, 0.95): titulares editoriales con amplio espacio negativo.
- **Headline** (300, `clamp(2.2rem, 3.4vw, 4.1rem)`, 0.95): encabezados de categoría y bloques principales.
- **Title** (650, `clamp(1.15rem, 1.5vw, 1.5rem)`, 1): títulos compactos y jerarquía de sección.
- **Body** (400, `1rem`, 1.6): descripciones y contenido informativo con líneas de máximo 70 caracteres.
- **Label** (700, `clamp(0.8rem, 0.95vw, 0.98rem)`, 0.075em, mayúsculas): botones, navegación y microcopy comercial.

**The Quiet Type Rule.** El texto no vende lujo por tamaño extremo: lo vende por espaciado, peso correcto y alineación precisa.

## Elevation

El sistema usa elevación estructural en dos contextos: controles oscuros neumórficos y tarjetas informativas claras. No se mezclan sombras dramáticas, brillo barrido y bordes gruesos en un mismo componente.

### Shadow Vocabulary

- **Mist Backlight** (`radial-gradient(ellipse, rgba(255,255,255,.96), rgba(245,248,250,.62) 38%, transparent 73%)` + `blur(9px)`): luz externa que separa el control del campo azul plateado.
- **Graphite Rest** (`0 13px 22px rgba(77,91,104,.36), 0 4px 8px rgba(39,47,55,.30)`): sombra estructural bajo el cuerpo metálico.
- **Graphite Bevel** (`inset 1px 1px rgba(255,255,255,.16), inset -2px -2px rgba(5,7,9,.48)`): bisel completo, fino y continuo.
- **Graphite Pressed** (`inset 5px 5px 11px rgba(6,7,8,0.74), inset -4px -4px 10px rgba(191,195,201,0.055)`): respuesta táctil al presionar.
- **Carved White Label** (`0 -1px rgba(5,7,9,.90), 0 1px rgba(255,255,255,.44), 0 2px 3px rgba(5,7,9,.52)`): talla blanca contenida para el nombre completo de cada categoría.
- **Orb Off** (`inset 3px 3px 5px rgba(196,200,205,.10), inset -4px -5px 8px rgba(5,7,9,.74)`): esfera grafito integrada en reposo.
- **Orb On** (`0 0 10px rgba(255,255,255,.92), 0 0 26px rgba(242,246,249,.68)`): encendido blanco de la esfera durante hover y foco.

**The Material Separation Rule.** El campo Mist Silver, la luz posterior y el cuerpo Graphite son tres capas independientes; el bisel define el canto sin marcos gruesos.

## Components

### Buttons

- **Shape:** control compacto y táctil; las categorías usan cápsula biselada y una esfera circular integrada.
- **Primary:** Ink con Luminous White, peso 700 y área táctil mínima de 44px.
- **Hover / Focus:** elevación máxima de 2px; foco blanco de 2px con separación de 5px; active hundido mediante sombras internas.
- **Motion:** 220ms con desaceleración `cubic-bezier(0.16, 1, 0.3, 1)` y versión sin movimiento cuando el sistema lo solicite.

### Cards / Containers

- **Corner Style:** tarjetas informativas de `20px`; producto puede permanecer rectangular cuando la fotografía lo exija.
- **Background:** Paper sobre lienzo claro; Graphite Console sólo para escenas de marca y control.
- **Shadow Strategy:** una sola familia de profundidad por sección, nunca sombras incompatibles.
- **Internal Padding:** múltiplos de 8px, normalmente 16px o 24px.

### Inputs / Fields

- **Style:** superficie Paper, texto Ink, radio de cápsula cuando forma parte de la cabecera.
- **Focus:** contorno visible de 2px; el placeholder nunca sustituye una etiqueta accesible.
- **Error / Disabled:** mensaje HTML claro, contraste suficiente y estado no dependiente sólo del color.

### Navigation

- La navegación principal conserva enlaces reales y etiquetas breves dentro de cápsulas de porcelana plateada: bisel blanco superior, canto grafito inferior y presión interior al activar.
- El logotipo de cabecera usa el arte oficial completo de Store MAY, optimizado desde el original de alta resolución y mostrado sin recorte.
- En móvil la navegación se simplifica sin ocultar destinos esenciales.

### Optical Brand Rail

- La tira del carrusel es blanca y continua; los logotipos se presentan únicamente en negro.
- Una zona blanca de seguridad de `18px` separa los logotipos del inicio de cualquier sección oscura.
- Cada logotipo conserva su proporción y se ajusta por masa óptica, no mediante deformación ni marcos decorativos.
- La distancia se calcula desde el borde visible de una marca hasta la siguiente con un único intervalo de `48–68px`, incluida la unión entre repeticiones del carrusel.
- Los activos vectoriales se recortan al contenido real del `viewBox`; los rasterizados sólo se muestran por debajo de su resolución nativa.
- La nitidez vive en el borde negro del logotipo; no se aplican marcos, fondos individuales ni resplandores sobre las marcas.
- La banda mantiene movimiento continuo, repetición accesible oculta y texto alternativo únicamente en el primer conjunto.
- Adidas, Nike, Puma, Calvin Klein, Tommy Hilfiger, DKNY, Reebok, Karl Lagerfeld, Steve Madden, Timberland, Skechers y Vans comparten el mismo carril y un balance óptico individual.

### Illuminated Category Control

- `CATÁLOGO` se centra, se presenta en mayúsculas y comparte la escala tipográfica de `PREGUNTAS`.
- Las cuatro categorías ocupan una cuadrícula de cuatro columnas iguales hasta `1320px`, dos columnas en tablet y una columna centrada en móvil.
- Cada control mide `76px` de alto y muestra el nombre en Jost blanco tallado, centrado dentro del cuerpo principal.
- La esfera derecha integra la flecha: permanece grafito en reposo y se enciende en blanco plateado durante hover y foco.
- El escenario usa Mist Silver `#CED9E3` con luz ambiental fría. Cada control separa una luz posterior blanca, un cuerpo grafito metálico y un bisel interior continuo.
- La profundidad procede de contraste, sombra inferior y canto iluminado, no del tamaño ni de un marco decorativo.
- El nombre es texto HTML visible, etiqueta accesible y enlace rastreable; la flecha permanece decorativa dentro de la esfera.

### FAQ Relief Card

- Ocho preguntas conservadas en HTML y JSON-LD; dos columnas en escritorio y una en móvil.
- Cada control expone `aria-expanded` y `aria-controls`; la respuesta permanece semánticamente vinculada.

### Editorial Product Collection

- Todas las páginas internas del catálogo, incluidas Mujeres, Hombres, Niños, Accesorios y las fichas de producto, usan un lienzo blanco puro `#FFFFFF`; el azul plateado queda reservado para escenas de marca de la portada.
- En las fichas, el blanco cubre la ruta completa y continúa dentro del marco principal y las miniaturas de la galería; no quedan degradados azulados o grises expuestos en márgenes o superficies de producto.
- Todos los marcos de fotografía del catálogo usan fondo blanco puro. Formatos maestros recomendados: vertical `1200 × 1500 px` en relación `4:5`; horizontal `1600 × 1200 px` en relación `4:3`.
- El precio usa anclaje ético en dos líneas: `PRECIO COMERCIAL` primero con el importe tachado en rojo profundo, y `PRECIO STORE MAY` debajo con el importe entre 1.45 y 1.6 veces mayor; no se añaden falsas urgencias ni reclamos promocionales redundantes.
- El encabezado de colección centra el nombre y mantiene migas de pan HTML (`Inicio / Catálogo / Categoría`) como orientación y regreso.
- La cuadrícula usa cuatro columnas en escritorio, tres en portátil, dos en tablet y una en móvil.
- El encuadre se adapta a la fuente sin deformarla: vertical `4:5`, cuadrada `1:1` y horizontal `4:3`, siempre con `object-fit: contain`.
- La jerarquía comercial es marca, nombre, precio de venta, precio original tachado, ahorro real, talla y una sola acción.
- Sólo se usa una etiqueta comercial por producto. “Últimas unidades” requiere stock real menor o igual a tres; no se fabrica urgencia.
- Si existe una segunda imagen editorial, el clic alterna entre producto y modelo. La ficha admite además miniaturas para ángulos adicionales.
- Las tarjetas sólo muestran tallas cuando existen valores reales; se omiten mensajes genéricos de consulta. En Accesorios, el encabezado editorial es `VARIEDAD`.

### Verified Testimonial Stage

- El bloque de testimonios aparece después de la selección editorial y antes de FAQ; FAQ permanece como último bloque informativo.
- El escenario usa un lienzo blanco frío con una malla isométrica de cubos blancos y negros; las piezas alternan profundidad y transparencia sin competir con la lectura.
- Los tres espacios de opinión se presentan como planos glass escalonados: porcelana translúcida en los extremos y grafito translúcido en el centro, con una única familia de sombras y biseles finos.
- No se publican citas, estrellas ni estados de “compra verificada” sin evidencia real.
- Cada testimonio real debe incluir cita, nombre o inicial autorizada, ciudad y estado de verificación cuando pueda demostrarse.

### Image-led Advisor Showcase

- Aparece inmediatamente después de `CATÁLOGO` y reemplaza por completo el antiguo contenido editorial de tendencias.
- La escena combina el fondo satinado violeta original con una segunda capa de la caja Store MAY mediante mezcla luminosa; la caja ocupa aproximadamente el 82% del ancho de escritorio para respirar dentro del fondo y el logotipo conserva su nitidez.
- La información de precios y pagos vive en una capa glass amplia, desplazada ópticamente un 3% hacia la derecha para coincidir con el centro visible de la curvatura. Usa desenfoque, saturación, borde luminoso y un único reflejo diagonal; la tipografía mantiene lectura clara sin invadir el logotipo y no incluye una cápsula adicional de transferencias.
- La tarjeta combina glassmorphism visible con el lenguaje 3D de testimonios: grafito translúcido, desenfoque y saturación del fondo, borde luminoso, plano plateado diagonal, contenido elevado y una inclinación mínima en hover o foco. El espacio exterior entre testimonios y FAQ es blanco continuo, nunca azul plateado.
- El rótulo `PRECIOS Y PAGOS` tiene mayor presencia que el cuerpo y el texto comercial se limita a efectivo, transferencias bancarias y confirmación previa de disponibilidad.
- En móvil, caja, tarjeta y acción permanecen dentro de una sola escena: la tarjeta ocupa la zona superior libre y el logotipo conserva su propio espacio central.
- La acción de WhatsApp usa una pieza de porcelana biselada compacta y más rectangular, retirada de los márgenes transparentes del recurso y anclada dentro de la esquina inferior derecha visible de la caja, con el icono verde tradicional y el texto “Comunícate con nosotros”.
- El contador registra navegadores únicos mediante un identificador anónimo; Neon conserva el total en producción y una memoria local mantiene la experiencia durante desarrollo si la base de datos no responde.
- El contador es informativo, no competitivo: visualmente muestra sólo el número en la esquina inferior derecha; su descripción completa permanece en `aria-label` y usa `aria-live="polite"`.

## Do's and Don'ts

### Do:

- **Do** reservar la luz blanca para el nombre tallado, el foco de teclado o una única llamada principal.
- **Do** mantener Mujeres, Hombres, Niños y Accesorios como enlaces HTML completos, visibles y táctiles.
- **Do** usar blanco, negro y plateado como lenguaje visual principal.
- **Do** construir jerarquía con proporción, espacio, contraste y detalle.
- **Do** renderizar nombres, precios, tallas, categorías y respuestas FAQ en HTML indexable.
- **Do** respetar `prefers-reduced-motion` y un objetivo táctil mínimo de 44px.

### Don't:

- **Don't** usar efectos 3D baratos.
- **Don't** usar dorados decorativos.
- **Don't** usar fondos amarillos.
- **Don't** añadir exceso de texto.
- **Don't** crear componentes voluminosos.
- **Don't** recurrir a una estética genérica de plantilla.
- **Don't** permitir que un efecto compita con el producto.
- **Don't** añadir barridos brillantes, rebotes, giros o escalas exageradas a los controles premium.
