// Teste do tutorial de boas-vindas: aparece só na primeira vez.
// - sem conta: depois de concluir, "Continuar sem conta" vai direto ao Início (com o nome guardado);
// - com conta: concluir marca na conta; outro aparelho com a mesma conta pula o tutorial;
// - outra conta no mesmo aparelho ainda vê o tutorial; "Apagar meus dados" faz o tutorial voltar.
//
// Precisa do front (BASE, padrão http://localhost:3000) e do back (BACKEND, padrão http://localhost:3001).
//   node testes/boas-vindas.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3000';
const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const sufixo = Math.random().toString(36).slice(2, 7);
const ana = { usuario: `boas.${sufixo}`, email: `boas.${sufixo}@exemplo.com`, senha: 'senha-de-teste-1' };
const bia = { usuario: `boas2.${sufixo}`, email: `boas2.${sufixo}@exemplo.com`, senha: 'senha-de-teste-2' };

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const erros = [];
const confere = (cond, m, extra = '') => { if (cond) console.log('✓ ' + m); else { erros.push(m); console.error('✗ ' + m + (extra ? `: ${extra}` : '')); } };
const espera = (p, ms) => p.waitForTimeout(ms);
const tela = (p) => p.evaluate(() => document.querySelector('#app').dataset.tela);

async function abrir(ctx) {
  ctx ??= await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => confere(false, 'JS: ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(p, 800);
  return p;
}
async function concluirTutorial(p, nome) {
  await p.click('#boas-pular'); await espera(p, 800);
  await p.fill('#boas-nome', nome); await p.click('#boas-comecar'); await espera(p, 1500);
}
async function entrar(p, u, criar = false) {
  if (criar) { await p.click('[data-login="criar"]'); await p.fill('#login-usuario', u.usuario); }
  await p.fill('#login-email', u.email); await p.fill('#login-senha', u.senha);
  await p.click('#login-ok'); await espera(p, 2000);
}
const token = (p) => p.evaluate(() => localStorage.getItem('terraforma:token'));

// 1. sem conta: primeira vez mostra o tutorial; depois, vai direto ao Início com o nome guardado
const ctxA = await b.newContext({ viewport: { width: 390, height: 844 } });
let p = await abrir(ctxA);
await p.click('#sem-conta'); await espera(p, 1200);
confere((await tela(p)) === 'boas', 'sem conta, primeira vez: mostra o tutorial');
await concluirTutorial(p, 'Rafa');
confere((await tela(p)) === 'inicio', 'concluir leva ao Início');
await p.goto(BASE + '/#login'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(p, 800);
await p.click('#sem-conta'); await espera(p, 1500);
confere((await tela(p)) === 'inicio', 'sem conta, segunda vez: pula o tutorial');
confere((await p.textContent('#saudacao')).includes('Rafa'), 'o nome escolhido continua na saudação', await p.textContent('#saudacao'));

// 2. criar conta neste aparelho (tutorial já feito sem conta): pula e marca na conta
await p.goto(BASE + '/#login'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(p, 800);
await entrar(p, ana, true);
confere((await tela(p)) === 'inicio', 'conta nova num aparelho que já fez o tutorial: pula');
const tAna = await token(p);
const me = await (await fetch(BACKEND + '/auth/me', { headers: { Authorization: `Bearer ${tAna}` } })).json();
confere(!!me.boasVindasEm, 'a conta ficou marcada no servidor (boasVindasEm)', JSON.stringify(me));

// 3. outro aparelho com a mesma conta: pula o tutorial
const p2 = await abrir();
await entrar(p2, ana);
confere((await tela(p2)) === 'inicio', 'outro aparelho, mesma conta: pula o tutorial');

// 4. outra conta no primeiro aparelho: ainda vê o tutorial
await p.evaluate(() => { localStorage.removeItem('terraforma:token'); });
await p.goto(BASE + '/#login'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(p, 800);
await entrar(p, bia, true);
confere((await tela(p)) === 'boas', 'outra conta no mesmo aparelho: mostra o tutorial');
await concluirTutorial(p, 'Bia');
const tBia = await token(p);

// 5. apagar meus dados (sem conta, num aparelho novo que fez o tutorial): o tutorial volta
const p3 = await abrir();
await p3.click('#sem-conta'); await espera(p3, 1200); await concluirTutorial(p3, 'Teste');
await p3.evaluate(() => { location.hash = 'ajustes'; }); await espera(p3, 1200);
await p3.click('#aj-apagar'); await p3.click('#aj-apagar'); await espera(p3, 1500);
await p3.click('#sem-conta'); await espera(p3, 1200);
confere((await tela(p3)) === 'boas', 'depois de "Apagar meus dados", o tutorial volta');

for (const t of [tAna, tBia]) await fetch(BACKEND + '/user/me', { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
await b.close();
if (erros.length) { console.error(`\n${erros.length} falha(s)`); process.exit(1); }
console.log('\nTudo certo.');
