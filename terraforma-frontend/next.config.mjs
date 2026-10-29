// Em produção no Vercel as rotas /api de exemplo ficam desligadas (app/api/_acesso.ts) e o app para de enviar eventos a elas.
// Continua enviando se houver uma API de eventos de verdade (NEXT_PUBLIC_API_URL) ou se API_EXEMPLO=1 ligar o exemplo de propósito.
const semApiDeEventos = process.env.VERCEL_ENV === 'production' && process.env.API_EXEMPLO !== '1' && !process.env.NEXT_PUBLIC_API_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_EVENTOS_API: semApiDeEventos ? 'off' : 'on' },
  // As texturas do planeta são grandes e não mudam: cache longo.
  async headers() {
    return [{ source: '/terra/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  },
};
export default nextConfig;
