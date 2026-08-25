# Seguridad de Store MAY

Ninguna aplicación conectada a Internet puede prometerse como “inviolable”. Store MAY aplica defensa en profundidad para reducir la superficie de ataque, bloquear abusos comunes, limitar el impacto de una credencial comprometida y conservar evidencia de los accesos administrativos.

## Controles implementados en la aplicación

- CSP estricta con nonce diferente por respuesta, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` y restricción de scripts, imágenes, fuentes, conexiones e iframes.
- Cabeceras contra MIME sniffing, clickjacking, filtración de referente y acceso innecesario a cámara, micrófono, ubicación, pagos y USB.
- Redirección permanente a HTTPS en producción y HSTS durante un año. No se habilita `includeSubDomains` hasta confirmar que todos los subdominios usan HTTPS.
- Panel administrativo excluido de cachés y buscadores.
- Cookie de sesión administrativa `HttpOnly`, `Secure` en producción, `SameSite=Strict`, `Path=/`, prioridad alta y prefijo `__Host-`.
- Sesiones de cuatro horas, firmadas, registradas en Neon y revocadas en el servidor al cerrar sesión.
- Contraseñas almacenadas únicamente como hash bcrypt de coste 12.
- Protección de acciones mutables mediante validación `Origin`, `Host`, protocolo y `Sec-Fetch-Site`.
- Límites de intentos de login por IP y combinación IP/usuario, además de límites en métricas públicas.
- Registro de accesos correctos, fallidos, bloqueados y cierres de sesión, sin guardar IP en claro.
- Validación de extensión, tamaño, tipo MIME y firma binaria de las imágenes; solo se guardan URLs del origen ImageKit configurado.
- Consultas SQL parametrizadas y validación de todos los campos con esquemas cerrados.
- Conexión a Neon obligatoriamente cifrada con `sslmode=require` o `sslmode=verify-full` en producción.
- Dependencias de producción auditadas con `npm audit`.

## Configuración obligatoria antes de publicar

1. Ejecuta `npm run security:check` en el entorno de producción y no publiques si devuelve un error.
2. Usa un `SESSION_SECRET` aleatorio de al menos 48 caracteres. No reutilices ninguna contraseña.
3. Crea al dueño con `npm run admin:create`; después elimina `ADMIN_PASSWORD` del hosting. La aplicación solo necesita el hash almacenado en Neon.
4. Configura `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS definitivo.
5. Separa el usuario propietario de Neon del usuario de ejecución de la web y concede al segundo solo permisos sobre las tablas y secuencias necesarias.
6. Activa backups/PITR de Neon y realiza una prueba de restauración antes del lanzamiento.
7. Rota las claves de Neon, ImageKit, hosting, correo y DNS si alguna se compartió por chat, captura o repositorio.

## SSL, DNS, WAF y cuentas externas

Estos controles no se pueden activar desde el código; requieren acceso al proveedor del dominio y del hosting:

- TLS 1.2/1.3, renovación automática de certificado y redirección HTTP → HTTPS en el edge.
- Modo SSL “Full (strict)” si se usa Cloudflare; nunca “Flexible”.
- DNSSEC, bloqueo de transferencia y bloqueo de registrador.
- Registros CAA limitados a la autoridad que emite el certificado.
- MFA con llave física o passkey en registrador, DNS, hosting, Neon, ImageKit y correo del dueño.
- WAF con reglas administradas, protección DDoS/bots y límites adicionales para `/dashboard/login`, `/dashboard/*` y `/api/*`.
- El origen debe aceptar tráfico solamente desde el CDN/WAF cuando la arquitectura lo permita.
- Alertas para fallos repetidos de acceso, cambios DNS, emisión de certificados y consumo anormal de base de datos o imágenes.

## Verificación previa y recurrente

- `npm run typecheck`
- `npm run build`
- `npm audit --omit=dev`
- Prueba OWASP ZAP en staging.
- Revisión de TLS con SSL Labs, cabeceras con SecurityHeaders.com y DNSSEC con DNSViz.
- Actualizaciones mensuales de dependencias y revisión trimestral de accesos, secretos y restauración de backups.

Los secretos reales deben existir solamente en el gestor de variables cifradas del hosting y en `.env.local` durante desarrollo. Nunca deben incluirse en Git, archivos públicos, capturas ni variables `NEXT_PUBLIC_*`.
