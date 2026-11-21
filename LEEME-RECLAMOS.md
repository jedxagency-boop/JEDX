# Libro de Reclamaciones: cómo activarlo en Cloudflare

La página `libro-de-reclamaciones.html` ya funciona sola: si el servidor no está configurado, le muestra al cliente su hoja y le deja enviarla por correo a jedx.agency@gmail.com. Para que asigne el número correlativo y guarde cada hoja automáticamente:

1. **Sube la web con la carpeta `functions`.** Las funciones de Cloudflare Pages se publican al subir el proyecto desde GitHub (con el directorio de salida en `/`) o, desde una terminal dentro de esta carpeta, con `npx wrangler pages deploy .`. La subida "arrastrar y soltar" del panel no publica funciones: con ella la web funciona, pero el libro usa el envío por correo de respaldo.
2. **Crea la base de datos:** en Cloudflare → Storage & Databases → D1 → *Create* → nómbrala `jedx-reclamos`. Abre la consola de la base y pega el contenido de `schema.sql`.
3. **Enlázala a la web:** en tu proyecto de Pages → Settings → Bindings → *Add* → D1 database → nombre de la variable `DB` → elige `jedx-reclamos`. Vuelve a publicar.
4. **(Recomendado) Copia automática por correo:** crea una cuenta gratis en resend.com, verifica tu dominio y en Pages → Settings → Variables and Secrets agrega:
   - `RESEND_API_KEY` = tu clave de Resend (como *secret*)
   - `MAIL_FROM` = por ejemplo `JEDX <reclamos@tudominio.com>`
   Así el cliente recibe su copia al instante y a ti te llega una copia oculta.

Para ver los reclamos: D1 → `jedx-reclamos` → consola → `SELECT numero, fecha, tipo, correo, datos FROM reclamos ORDER BY id DESC;`

Recuerda: responder por escrito en máximo 15 días hábiles y guardar cada hoja y su respuesta al menos 2 años. La fecha límite que calcula el correo no descuenta feriados.
