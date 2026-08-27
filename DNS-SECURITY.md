# DNS y protección anti-suplantación de Store MAY

Esta guía debe aplicarse cuando el dominio definitivo esté conectado. El código no puede modificar DNS, el registrador, el correo ni Google Search Console sin acceso autorizado a esas cuentas.

## 1. Dominio y certificado

1. Activa **bloqueo del registrador**, renovación automática y MFA mediante passkey o llave física.
2. Configura únicamente los registros `A`, `AAAA` o `CNAME` requeridos por el hosting. Elimina registros antiguos y subdominios sin uso.
3. Mantén HTTPS obligatorio y TLS 1.2/1.3. Si usas Cloudflare, selecciona **Full (strict)**; nunca Flexible.
4. Define `NEXT_PUBLIC_SITE_URL=https://dominio-final.example` en producción. La aplicación rechazará escrituras enviadas a otro host y redirigirá visitas al dominio canónico.

## 2. DNSSEC

Activa DNSSEC en el proveedor DNS y publica el registro DS entregado por ese proveedor en el registrador. Comprueba después el estado con DNSViz. No cambies los nameservers mientras exista un DS antiguo: primero sigue el procedimiento de migración del proveedor para evitar que el dominio deje de resolver.

## 3. CAA

Un registro CAA limita qué autoridades pueden emitir certificados. Antes de publicarlo, confirma qué autoridad utiliza realmente el hosting; una lista incorrecta puede impedir la renovación de HTTPS.

Plantilla — sustituye los valores por los indicados por el hosting:

```dns
@  CAA  0 issue "autoridad-autorizada.example"
@  CAA  0 issuewild "autoridad-autorizada.example"
@  CAA  0 iodef "mailto:security@TU-DOMINIO"
```

## 4. Correo y anti-phishing

Aunque el dominio no envíe correos, publica una política restrictiva para impedir que terceros lo suplanten.

Si **no se envía correo** desde el dominio:

```dns
@       MX   0 .
@       TXT  "v=spf1 -all"
_dmarc  TXT  "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; pct=100; rua=mailto:dmarc@TU-DOMINIO"
```

Si el dominio **sí envía correo**, utiliza exactamente el SPF y DKIM entregados por el proveedor de correo. Comienza DMARC en `p=none`, revisa los reportes, pasa a `quarantine` y finalmente a `reject`; nunca inventes un selector DKIM.

## 5. CDN, WAF y alertas

- Activa reglas administradas del WAF, mitigación DDoS y protección de bots.
- Limita especialmente `/dashboard/login`, `/dashboard/*` y `/api/*`.
- Bloquea el acceso directo al origen cuando el hosting lo permita.
- Configura alertas por cambios DNS, emisión de certificados, picos de errores y fallos de autenticación.

## 6. Evitar listas de sitios peligrosos

1. Verifica el dominio en Google Search Console y revisa **Problemas de seguridad** y **Acciones manuales**.
2. Mantén activas las alertas de Safe Browsing y revisa el dominio después de cada despliegue importante.
3. No hospedes ejecutables, descargas desconocidas, redirecciones ocultas ni scripts de orígenes no autorizados.
4. Si existe una alerta, conserva evidencia, elimina la causa, rota credenciales comprometidas y solicita una revisión desde Search Console.

## Lista final

- [ ] Dominio definitivo configurado en `NEXT_PUBLIC_SITE_URL`
- [ ] MFA y bloqueo del registrador
- [ ] DNSSEC validado
- [ ] HTTPS/TLS estricto
- [ ] CAA verificado con el hosting
- [ ] SPF, DKIM y DMARC correctos
- [ ] WAF y límites de solicitudes activos
- [ ] Search Console y alertas de seguridad activas
- [ ] Backups y restauración probados
