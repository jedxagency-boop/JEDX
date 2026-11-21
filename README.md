# JEDX — web de la agencia

Web estática de JEDX (branding y diseño web), publicada en Cloudflare Pages desde este repositorio.

- `index.html` — página principal (inicio, servicios, proyectos, nosotros, contacto)
- `terminos.html`, `libro-de-reclamaciones.html` — páginas legales
- `assets/` — imágenes, videos, fuentes y scripts
- `functions/api/reclamo.js` — función de Cloudflare Pages del Libro de Reclamaciones
- `schema.sql` — tabla de la base D1 `jedx-reclamos`
- `LEEME-RECLAMOS.md` — cómo activar el Libro de Reclamaciones

## Publicación en Cloudflare (Workers con archivos estáticos)

- Proyecto `jedx` conectado a este repositorio, comando de despliegue `npx wrangler deploy`
- `wrangler.toml`: sirve los archivos estáticos y enlaza la base D1 `jedx-reclamos` como `DB`
- `worker.js`: atiende `/api/reclamo` (Libro de Reclamaciones) y entrega el resto de la web
- `.assetsignore`: archivos que no se publican (código del servidor, documentación)
- Variables opcionales del proyecto: `RESEND_API_KEY` (secret), `MAIL_FROM`

Cada cambio que se sube a `main` se publica solo.
