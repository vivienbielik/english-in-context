// Worker entry: serves the static site and the AI feedback endpoint for the Writing Lab.
import { onRequestPost } from './evaluate.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/evaluate') {
      if (request.method !== 'POST') return new Response('Use POST', { status: 405 });
      return onRequestPost({ request, env });
    }
    return env.ASSETS.fetch(request);
  },
};
