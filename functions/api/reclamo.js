// POST /api/reclamo — Libro de Reclamaciones de JEDX (Cloudflare Pages Functions)
// Requiere: base de datos D1 enlazada como "DB" (ver schema.sql).
// Opcional: RESEND_API_KEY y MAIL_FROM para enviar la copia por correo (ver LEEME-RECLAMOS.md).
const JEDX_MAIL = 'jedx.agency@gmail.com';
const REQ = ['nombre','tipo_doc','num_doc','domicilio','telefono','correo','servicio','desc_servicio','tipo','detalle','pedido','respuesta'];
const LBL = {nombre:'Nombres y apellidos',tipo_doc:'Tipo de documento',num_doc:'N.° de documento',domicilio:'Domicilio',telefono:'Teléfono',correo:'Correo',apod_nombre:'Padre, madre o apoderado',apod_doc:'Documento del apoderado',servicio:'Servicio contratado',monto:'Monto reclamado (S/)',comprobante:'N.° de comprobante',desc_servicio:'Descripción del servicio',tipo:'Tipo',detalle:'Detalle',pedido:'Pedido',respuesta:'Respuesta por'};
const json = (o, s = 200) => new Response(JSON.stringify(o), {status: s, headers: {'Content-Type': 'application/json; charset=utf-8'}});
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function habiles(desde, n) { // suma n días hábiles (sin sábados ni domingos; revisar feriados a mano)
  const d = new Date(desde); let k = 0;
  while (k < n) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) k++; }
  return d;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ fallback: true, error: 'El libro de reclamaciones no está configurado todavía.' }, 503);
  let d; try { d = await request.json(); } catch { return json({ error: 'Datos inválidos.' }, 400); }
  for (const k of REQ) if (!d[k] || String(d[k]).trim() === '') return json({ error: 'Falta completar: ' + LBL[k] + '.' }, 400);
  if (!d.veridico || !d.datos) return json({ error: 'Debes marcar las dos casillas de confirmación.' }, 400);
  if (d.menor && (!d.apod_nombre || !d.apod_doc)) return json({ error: 'Completa los datos de tu padre, madre o apoderado.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo)) return json({ error: 'Revisa tu correo electrónico.' }, 400);
  if (!['Reclamo', 'Queja'].includes(d.tipo)) return json({ error: 'Elige Reclamo o Queja.' }, 400);
  const limpio = {}; for (const k of Object.keys(LBL)) if (d[k] != null) limpio[k] = String(d[k]).slice(0, 4000);
  limpio.menor = !!d.menor;

  const ahora = new Date();
  const anio = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Lima', year: 'numeric' }).format(ahora));
  const fecha = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }).format(ahora);
  const limite = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'long' }).format(habiles(ahora, 15));

  const row = await env.DB.prepare('INSERT INTO reclamos (anio, fecha, tipo, correo, datos) VALUES (?, ?, ?, ?, ?) RETURNING id').bind(anio, ahora.toISOString(), limpio.tipo, limpio.correo, JSON.stringify(limpio)).first();
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM reclamos WHERE anio = ? AND id <= ?').bind(anio, row.id).first();
  const numero = String(n).padStart(6, '0') + '-' + anio;
  await env.DB.prepare('UPDATE reclamos SET numero = ? WHERE id = ?').bind(numero, row.id).run();

  let correo_enviado = false;
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    const filas = Object.keys(LBL).filter(k => limpio[k]).map(k => `<tr><td style="padding:6px 12px;color:#555;vertical-align:top">${esc(LBL[k])}</td><td style="padding:6px 12px;white-space:pre-wrap">${esc(limpio[k])}</td></tr>`).join('');
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0D0E11">
<h2 style="margin:0 0 4px">Hoja de reclamación N.° ${numero}</h2><p style="margin:0 0 12px">Fecha: ${esc(fecha)}</p>
<p style="margin:0 0 12px">Proveedor: JEDX · Lima, Perú · ${JEDX_MAIL}</p>
<table style="border-collapse:collapse;border:1px solid #ddd">${filas}</table>
<p style="margin:16px 0 0">Responderemos por escrito en un plazo máximo de 15 días hábiles improrrogables (fecha límite aproximada: ${esc(limite)}).</p>
<p style="color:#666;font-size:12px">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p></div>`;
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_FROM, to: [limpio.correo], bcc: [JEDX_MAIL], reply_to: JEDX_MAIL, subject: `Hoja de reclamación N.° ${numero} — JEDX`, html })
      });
      correo_enviado = r.ok;
    } catch (e) { correo_enviado = false; }
  }
  return json({ numero, fecha, correo_enviado });
}

export const onRequest = () => json({ error: 'Usa POST.' }, 405);
