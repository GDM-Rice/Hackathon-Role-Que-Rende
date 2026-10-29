// Teste de fumaça: abre o app, faz a entrada, passa por todas as telas e confere que nada quebrou
// e que os eventos chegam na API.
//
// Uso (com o app rodando em outro terminal: npm run dev, ou npm run build && npm start):
//   npm i -D playwright && npx playwright install chromium   (uma vez)
//   node testes/fumaca.mjs                                     (BASE=http://localhost:3000 por padrão)
//
// Sai com código 1 se houver erro de JavaScript, tela que não abre ou evento faltando.
// Capturas em testes/capturas/ para olhar o resultado.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const PASTA = new URL('./capturas/', import.meta.url).pathname;
mkdirSync(PASTA, { recursive: true });

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const erros = [];
p.on('pageerror', (e) => erros.push('JS: ' + e.message));
const ev = (f) => p.evaluate(f), espera = (ms) => p.waitForTimeout(ms);
const tela = () => ev(() => document.querySelector('#app').dataset.tela);
const falha = (m) => erros.push(m);

await p.goto(BASE + '/'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(800);

// sem conta → entrada em 3 passos → início
await p.click('#sem-conta'); await espera(1200);   // o login é real (back NestJS); o fluxo com conta está em testes/conta.mjs
await p.click('#boas-seguir'); await espera(1800); await p.click('#boas-seguir'); await espera(1800);
await p.fill('#boas-nome', 'Teste'); await p.click('#boas-comecar'); await espera(2000);
if ((await tela()) !== 'inicio') falha('a entrada não terminou no Início');
const saud = await ev(() => document.querySelector('#saudacao').textContent);
if (!saud.includes('Teste')) falha('saudação sem o nome: ' + saud);

// todas as telas abrem
for (const t of ['mapa', 'trilha', 'luneta', 'inicio', 'ajuda', 'financas', 'troca', 'tempestade', 'perfil', 'orbita', 'ajustes']) {
  await ev(`location.hash = '${t}'`); await espera(t === 'trilha' || t === 'mapa' || t === 'mare' ? 4000 : 1500);
  const atual = await tela(); if (atual !== t) falha(`#${t} abriu ${atual}`);
  await p.screenshot({ path: `${PASTA}${t}.png` });
}
// guardas de rota: sem dívida aberta, o detalhe volta para Finanças
await ev(`location.hash = 'divida'`); await espera(800);
if ((await tela()) !== 'financas') falha('#divida sem dívida não voltou para Finanças');

// Barreira traz rio
await ev(() => { [...document.querySelectorAll('button')].find((x) => /^Barreiras$/.test(x.textContent.trim()))?.click(); }); await espera(800);
await ev(() => document.querySelector('[data-barreira="pix"]')?.click()); await espera(1200);

// Órbita: colocar alguém
await ev(`location.hash = 'orbita'`); await espera(1200);
await ev(() => document.querySelector('#add-orbita').click()); await espera(400);
await p.fill('#orb-nome', 'Carla'); await p.fill('#orb-tel', '61988887777'); await ev(() => document.querySelector('#salvar-orbita').click()); await espera(600);

// Luneta: publicar
await ev(`location.hash = 'luneta'`); await espera(1200);
await ev(() => document.querySelector('#escrever')?.click()); await espera(500);
await p.fill('#txt-post', 'Hoje respirei e a vontade passou.'); await ev(() => document.querySelector('#publicar').click()); await espera(800);

// eventos esperados chegaram na API
const r = await p.request.get(BASE + '/api/eventos');
if (r.ok()) {
  const tipos = (await r.json()).map((e) => e.tipo);
  for (const t of ['entrada', 'perfil_criado', 'tempestade', 'barreira_ativada', 'orbita_pessoa_adicionada', 'luneta_post'])
    if (!tipos.includes(t)) falha('evento não chegou: ' + t);
} else falha('GET /api/eventos respondeu ' + r.status() + ' (com backend real, ajuste este trecho)');

if (await ev(() => document.documentElement.scrollWidth > innerWidth)) falha('rolagem horizontal na página');

// Respire com a Terra por último (a saída do mar tem animação)
await ev(`location.hash = 'mare'`); await espera(5000);
if ((await tela()) !== 'mare') falha('#mare não abriu');
await p.screenshot({ path: `${PASTA}mare.png` });
await b.close();
if (erros.length) { console.error('FALHOU\n' + erros.join('\n')); process.exit(1); }
console.log('ok: todas as telas abriram, eventos chegaram, sem erro de JavaScript. Capturas em testes/capturas/');
