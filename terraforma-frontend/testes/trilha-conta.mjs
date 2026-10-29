// Teste do progresso da trilha na conta (tabela trilha_progresso do back NestJS):
// concluir uma aula com conta grava no servidor, sair limpa o aparelho, entrar em outro
// aparelho traz o progresso de volta, e o progresso sem conta se junta à conta ao entrar.
//
// Precisa do front (BASE, padrão http://localhost:3000) e do back (BACKEND, padrão http://localhost:3001).
//   node testes/trilha-conta.mjs
// Sai com código 1 se algo falhar. Capturas em testes/capturas/trilha-conta-*.png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const PASTA = new URL('./capturas/', import.meta.url).pathname;
mkdirSync(PASTA, { recursive: true });

const sufixo = Math.random().toString(36).slice(2, 7);
const ana = { usuario: `trilha.${sufixo}`, email: `trilha.${sufixo}@exemplo.com`, senha: 'senha-de-teste-1' };

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const erros = [];
const falha = (m) => { erros.push(m); console.error('✗ ' + m); };
const ok = (m) => console.log('✓ ' + m);
const confere = (cond, m, extra = '') => (cond ? ok(m) : falha(m + (extra ? `: ${extra}` : '')));
const espera = (p, ms) => p.waitForTimeout(ms);

async function abrir(estadoInicial) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  if (estadoInicial) await ctx.addInitScript((v) => { if (!sessionStorage.getItem('ja')) { sessionStorage.setItem('ja', '1'); localStorage.setItem('terraforma:trilha-aulas', v); } }, JSON.stringify(estadoInicial));
  const p = await ctx.newPage();
  p.on('pageerror', (e) => falha('JS: ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(p, 600);
  return p;
}
async function entrar(p, u, criar = false) {
  if (criar) await p.click('[data-login="criar"]');
  if (criar) await p.fill('#login-usuario', u.usuario);
  await p.fill('#login-email', u.email); await p.fill('#login-senha', u.senha);
  await p.click('#login-ok'); await espera(p, 2000);
}
const local = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('terraforma:trilha-aulas') || '{"feitas":{}}'));
const token = (p) => p.evaluate(() => localStorage.getItem('terraforma:token'));
async function servidor(t) {
  const r = await fetch(BACKEND + '/trilha', { headers: { Authorization: `Bearer ${t}` } });
  return (await r.json()).atividades;
}

// 1. sem conta, conclui a primeira aula; depois cria a conta: o progresso vai junto
const pa = await abrir({ feitas: { '0-0': { em: '2026-10-20T10:00:00.000Z' } } });
await entrar(pa, ana, true);
const t1 = await token(pa);
confere(!!t1, 'conta criada');
let srv = await servidor(t1);
confere(srv.some((a) => a.capitulo === 0 && a.indice === 0 && a.em === '2026-10-20T10:00:00.000Z'), 'progresso feito sem conta subiu para a conta ao entrar', JSON.stringify(srv));

// 2. com conta, conclui o quiz da aula 1 pelo app (6 perguntas)
await pa.evaluate(() => { location.hash = 'trilha'; }); await espera(pa, 3500);
await pa.click('#proxima [data-at]'); await espera(pa, 1200);
for (let n = 0; n < 12; n++) {   // responde sempre a 1ª opção; no fim, segue mesmo com erros
  if (await pa.$('#duo-fim')) break;
  if (await pa.$('#duo-seguir')) { await pa.click('#duo-seguir'); await espera(pa, 900); continue; }
  await pa.click('#ativ-corpo [data-alt="0"]'); await pa.click('#duo-verificar'); await espera(pa, 500);
  await pa.click('#duo-continuar'); await espera(pa, 800);
}
confere(!!(await pa.$('#duo-fim')), 'quiz concluído pelo app');
await espera(pa, 1200);
srv = await servidor(t1);
const quiz = srv.find((a) => a.capitulo === 0 && a.indice === 1);
confere(quiz && quiz.total === 6 && Number.isInteger(quiz.acertos), 'quiz gravado no servidor com acertos e total', JSON.stringify(srv));
await pa.click('#duo-fim'); await espera(pa, 1500);
await pa.screenshot({ path: PASTA + 'trilha-conta-1-com-conta.png' });

// 3. sair da conta: a trilha sai do aparelho (fica na conta)
await pa.evaluate(() => { location.hash = 'perfil'; }); await espera(pa, 1200);
await pa.click('#conta-perfil'); await espera(pa, 800);
confere(Object.keys((await local(pa)).feitas).length === 0, 'ao sair, a trilha da conta sai do aparelho');

// 4. outro aparelho: entra e recebe o progresso
const pb = await abrir();
await entrar(pb, ana);
await espera(pb, 1500);
const lb = await local(pb);
confere(lb.feitas['0-0'] && lb.feitas['0-1']?.total === 6, 'outro aparelho recebeu o progresso ao entrar', JSON.stringify(lb));
await pb.evaluate(() => { location.hash = 'trilha'; }); await espera(pb, 3500);
const resumo = await pb.textContent('#trilha-resumo');
confere(/^1 de \d+ aulas · 1 de/.test(resumo), 'a trilha mostra o progresso da conta', resumo);
await pb.screenshot({ path: PASTA + 'trilha-conta-2-outro-aparelho.png' });

// 5. outra conta no mesmo aparelho não herda o progresso da primeira
const outra = { usuario: `outra.${sufixo}`, email: `outra.${sufixo}@exemplo.com`, senha: 'senha-de-teste-2' };
await pb.evaluate(() => { localStorage.removeItem('terraforma:token'); location.hash = 'login'; location.reload(); });
await pb.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(pb, 800);
await entrar(pb, outra, true);
await espera(pb, 1200);
const t2 = await token(pb);
srv = await servidor(t2);
confere(srv.length === 0, 'a outra conta começa a trilha do zero', JSON.stringify(srv));

// 6. apagar a conta apaga o progresso no servidor
for (const t of [t1, t2]) await fetch(BACKEND + '/user/me', { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
const depois = await fetch(BACKEND + '/trilha', { headers: { Authorization: `Bearer ${t1}` } });
confere(depois.status === 401, 'conta apagada não tem mais trilha');

await b.close();
if (erros.length) { console.error(`\n${erros.length} falha(s)`); process.exit(1); }
console.log('\nTudo certo.');
