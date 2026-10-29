import type { Metadata, Viewport } from 'next';
// Fontes servidas pelo próprio app (licença OFL), sem depender do Google Fonts em produção
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Terraforma',
  description: 'Cada dia sem apostar devolve vida ao planeta. App de bem-estar para quem quer parar de apostar.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F7F5F0' }, { media: '(prefers-color-scheme: dark)', color: '#121513' }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Texturas leves do planeta: baixam em paralelo com o JavaScript */}
        <link rel="preload" href="/terra/terra-dia-baixa.webp" as="image" type="image/webp" />
        <link rel="preload" href="/terra/terra-agua.png" as="image" />
        <link rel="preload" href="/terra/brasil-regioes.png" as="image" />
        <link rel="preload" href="/terra/brasil-linhas.png" as="image" />
      </head>
      <body>{children}</body>
    </html>
  );
}
