// JEDX — Worker de Cloudflare: sirve la web estática y la API del Libro de Reclamaciones
import { onRequestPost, onRequest } from './functions/api/reclamo.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/reclamo' || url.pathname === '/api/reclamo/') {
      return request.method === 'POST' ? onRequestPost({ request, env, ctx }) : onRequest();
    }
    return env.ASSETS.fetch(request);
  }
};
