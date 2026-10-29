// Teste das rotas de exemplo /api/eventos e /api/estado e do envio de eventos pelo app.
//
// Uso (com o app rodando, build de produção ou dev):
//   node testes/api-exemplo.mjs                      → espera as rotas LIGADAS (local, dev, preview)
//   EXPECT=desligado node testes/api-exemplo.mjs     → espera as rotas DESLIGADAS (produção no Vercel)
//
// Para simular produção na sua máquina, builde e rode com a mesma variável:
//   VERCEL_ENV=production npm run build && VERCEL_ENV=production npm start
//
// Sai com código 1 se algo não bater. BASE=http://localhost:3000 por padrão.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3000';
const ligado = (process.env.EXPECT || 'ligado') === 'ligado';
const falhas = [];
const confere = (ok, msg) => { console.log(`${ok ? 'ok   ' : 'FALHA'} ${msg}`); if (!ok) falhas.push(msg); };
const chama = (metodo, caminho, corpo, cab = {}) => fetch(BASE + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', ...cab }, body: corpo === undefined ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo) });
const evento = { tipo: 'tempestade', dados: { em: new Date().toISOString() } };

console.log(`\n== Rotas (${ligado ? 'ligadas' : 'desligadas'}) em ${BASE}`);
if (!ligado) {
  for (const [m, c, b] of [['POST', '/api/eventos', evento], ['GET', '/api/eventos'], ['GET', '/api/estado'], ['PATCH', '/api/estado', { perfil: {} }]]) {
    const r = await chama(m, c, b);
    confere(r.status === 404, `${m} ${c} responde 404 (veio ${r.status})`);
  }
} else {
  let r = await chama('POST', '/api/eventos', evento);
  confere(r.status === 201, `POST evento válido → 201 (veio ${r.status})`);
  r = await chama('POST', '/api/eventos', '{ isto não é json');
  confere(r.status === 400, `POST com JSON quebrado → 400, não 500 (veio ${r.status})`);
  r = await chama('POST', '/api/eventos', { tipo: 'tipo_que_nao_existe', dados: { em: 'x' } });
  confere(r.status === 400, `POST com tipo desconhecido → 400 (veio ${r.status})`);
  r = await chama('POST', '/api/eventos', { tipo: 'tempestade', dados: [1, 2, 3] });
  confere(r.status === 400, `POST com dados em lista → 400 (veio ${r.status})`);
  r = await chama('POST', '/api/eventos', { tipo: 'tempestade', dados: { em: 'x', lixo: 'a'.repeat(20_000) } });
  confere(r.status === 413, `POST maior que 10 KB → 413 (veio ${r.status})`);
  r = await chama('GET', '/api/eventos');
  confere(r.status === 200 && Array.isArray(await r.json()), 'GET eventos → 200 com uma lista');

  r = await chama('PATCH', '/api/estado', '{ quebrado');
  confere(r.status === 400, `PATCH com JSON quebrado → 400 (veio ${r.status})`);
  r = await chama('PATCH', '/api/estado', [1, 2]);
  confere(r.status === 400, `PATCH com lista → 400 (veio ${r.status})`);
  r = await chama('PATCH', '/api/estado', '{"desconhecido": 1, "__proto__": {"injetado": true}, "ajustes": {"tema": "escuro", "contraste": false, "daltonismo": false, "texto": 0, "espaco": false, "anim": "auto", "som": true, "legendas": false}}');
  const est = await r.json();
  confere(r.status === 200 && est.ajustes?.tema === 'escuro', 'PATCH com seção conhecida é aplicado');
  confere(!('desconhecido' in est) && est.injetado === undefined && ({}).injetado === undefined, 'PATCH ignora chave desconhecida e "__proto__"');
  await chama('PATCH', '/api/estado', { ajustes: { tema: 'auto', contraste: false, daltonismo: false, texto: 0, espaco: false, anim: 'auto', som: true, legendas: false } });

  // teto da memória: 1.100 eventos e a lista não passa de 1.000
  let total = 0;
  for (let i = 0; i < 1100; i += 50) {
    const lote = await Promise.all(Array.from({ length: 50 }, () => chama('POST', '/api/eventos', evento).then((x) => x.json())));
    total = Math.max(total, ...lote.map((x) => x.total));
  }
  confere(total <= 1000, `lista de eventos tem teto: depois de 1.100 envios o total é ${total} (máx. 1000)`);
}

console.log('\n== App no navegador');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const erros = [], envios = [];
p.on('pageerror', (e) => erros.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 140)); });
p.on('request', (r) => { if (r.method() === 'POST' && /\/api\/eventos/.test(r.url())) envios.push(r.url()); });
await p.goto(BASE + '/#inicio'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await p.waitForTimeout(800);
await p.evaluate(() => { localStorage.setItem('terraforma:eventos-pendentes', JSON.stringify([{ tipo: 'tempestade', dados: { em: 'antigo' } }])); });
await p.evaluate(() => { location.hash = '#tempestade'; }); await p.waitForTimeout(1500);
const fila = () => p.evaluate(() => JSON.parse(localStorage.getItem('terraforma:eventos-pendentes') || '[]').length);
if (ligado) {
  confere(envios.length >= 1, `o app envia eventos para /api/eventos (${envios.length} envio(s))`);
  confere((await fila()) === 0, 'a fila local esvazia quando o envio funciona');
  // API fora do ar: a fila local tem teto de 100
  await p.route('**/api/eventos', (r) => r.abort());
  await p.evaluate(() => { location.hash = '#perfil'; }); await p.waitForSelector('#pesquisa-on', { state: 'attached' }); await p.waitForTimeout(800);
  await p.evaluate(async () => { const c = document.querySelector('#pesquisa-on'); for (let i = 0; i < 130; i++) { c.click(); await new Promise((ok) => setTimeout(ok, 15)); } });
  await p.waitForTimeout(800);
  const n = await fila();
  confere(n > 50 && n <= 100, `API fora do ar: depois de 130 eventos a fila local tem ${n} (teto 100)`);
} else {
  confere(envios.length === 0, `o app NÃO envia eventos quando a API está desligada (${envios.length} envio(s))`);
  confere((await fila()) === 0, 'a fila antiga do aparelho é limpa');
}
// net::ERR_FAILED vem do route.abort() que simula a API fora do ar (só no modo ligado): não é erro do app
const reais = erros.filter((e) => !(ligado && /net::ERR_FAILED/.test(e)));
confere(reais.length === 0, `sem erro de JavaScript nem de console${reais.length ? ': ' + reais[0] : ''}`);
await b.close();

if (falhas.length) { console.log(`\n${falhas.length} falha(s).`); process.exit(1); }
console.log('\nok: tudo como esperado.');
