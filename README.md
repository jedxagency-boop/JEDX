# JEDX — web de la agencia

Web estática de JEDX (branding y diseño web), publicada en Cloudflare Pages desde este repositorio.

- `index.html` — página principal (inicio, servicios, proyectos, nosotros, contacto)
- `terminos.html`, `libro-de-reclamaciones.html` — páginas legales
- `assets/` — imágenes, videos, fuentes y scripts
- `functions/api/reclamo.js` — función de Cloudflare Pages del Libro de Reclamaciones
- `schema.sql` — tabla de la base D1 `jedx-reclamos`
- `LEEME-RECLAMOS.md` — cómo activar el Libro de Reclamaciones

## Configuración en Cloudflare Pages

- Framework preset: **None**
- Build command: *(vacío)*
- Build output directory: **/**
- Binding D1: variable `DB` → base `jedx-reclamos` (ya configurado en `wrangler.toml`)
- Variables opcionales: `RESEND_API_KEY` (secret), `MAIL_FROM`

Cada cambio que se sube a `main` se publica solo.
