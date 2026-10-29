// Teste do fluxo com conta: cadastro, sessão salva, conversa real entre duas pessoas,
// moderação/crise, senha errada, sair e apagar a conta.
//
// Precisa do front (BASE, padrão http://localhost:3000) e do back NestJS (BACKEND, padrão
// http://localhost:3001) rodando, com banco limpo ou não (os usuários têm sufixo aleatório).
//   node testes/conta.mjs
// Sai com código 1 se algo falhar. Capturas em testes/capturas/conta-*.png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const PASTA = new URL('./capturas/', import.meta.url).pathname;
mkdirSync(PASTA, { recursive: true });

const sufixo = Math.random().toString(36).slice(2, 7);
const ana = { usuario: `ana.${sufixo}`, email: `ana.${sufixo}@exemplo.com`, senha: 'senha-de-teste-1' };
const bia = { usuario: `bia.${sufixo}`, email: `bia.${sufixo}@exemplo.com`, senha: 'senha-de-teste-2' };

const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const erros = [];
const falha = (m) => { erros.push(m); console.error('✗ ' + m); };
const ok = (m) => console.log('✓ ' + m);
const espera = (p, ms) => p.waitForTimeout(ms);
const tela = (p) => p.evaluate(() => document.querySelector('#app').dataset.tela);

async function abrir() {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => falha('JS: ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(p, 600);
  return p;
}
async function criarConta(p, u) {
  await p.click('[data-login="criar"]');
  await p.fill('#login-usuario', u.usuario); await p.fill('#login-email', u.email); await p.fill('#login-senha', u.senha);
  await p.click('#login-ok'); await espera(p, 1500);
}
async function abrirConversas(p) {
  await p.evaluate(() => { location.hash = 'luneta'; }); await espera(p, 1200);
  await p.click('[data-lun="conversas"]'); await espera(p, 1200);
}
const textos = (p) => p.$$eval('#rol-msgs .bolha-msg', (els) => els.map((e) => e.textContent));

// 1. cadastro
const pa = await abrir();
await criarConta(pa, ana);
if ((await tela(pa)) === 'boas') ok('Ana criou a conta e foi para as boas-vindas'); else falha('cadastro não levou às boas-vindas: ' + (await pa.textContent('#erro-login')));
if (!(await pa.evaluate(() => localStorage.getItem('terraforma:token')))) falha('token não foi salvo');

// 2. sessão salva: recarregar não pede a senha de novo
await pa.evaluate(() => history.replaceState(null, '', '/#login')); await pa.reload(); await pa.waitForSelector('#app.pronto', { timeout: 90000 }); await espera(pa, 1500);
if ((await tela(pa)) === 'boas') ok('sessão restaurada ao recarregar'); else falha('sessão não foi restaurada (tela ' + (await tela(pa)) + ')');

// 3. validação no front
await pa.goto(BASE + '/#login'); await pa.evaluate(() => localStorage.removeItem('terraforma:token')); await pa.reload(); await pa.waitForSelector('#app.pronto'); await espera(pa, 600);
await pa.click('[data-login="criar"]'); await pa.fill('#login-usuario', 'Nome Com Espaço'); await pa.fill('#login-email', 'x@exemplo.com'); await pa.fill('#login-senha', '12345678'); await pa.click('#login-ok'); await espera(pa, 300);
if ((await pa.textContent('#erro-login')).includes('usuário')) ok('nome de usuário inválido é barrado no front'); else falha('username inválido passou');
await pa.click('[data-login="criar"]'); await pa.fill('#login-usuario', ana.usuario); await pa.fill('#login-email', `outra.${sufixo}@exemplo.com`); await pa.fill('#login-senha', 'senha-qualquer'); await pa.click('#login-ok'); await espera(pa, 1200);
const erroDup = await pa.textContent('#erro-login');
if (erroDup && (await tela(pa)) === 'login') ok('username repetido mostra o erro do back: ' + erroDup); else falha('username repetido não mostrou erro');

// 4. senha errada, depois certa
await pa.click('[data-login="entrar"]'); await pa.fill('#login-email', ana.email); await pa.fill('#login-senha', 'senha-errada-123'); await pa.click('#login-ok'); await espera(pa, 1200);
if ((await pa.textContent('#erro-login')).includes('não conferem')) ok('senha errada mostra erro'); else falha('senha errada: ' + (await pa.textContent('#erro-login')));
await pa.fill('#login-senha', ana.senha); await pa.click('#login-ok'); await espera(pa, 1500);
if ((await tela(pa)) === 'boas') ok('Ana entrou'); else falha('login falhou: ' + (await pa.textContent('#erro-login')));

// 5. Bia em outro navegador
const pb = await abrir();
await criarConta(pb, bia);
if ((await tela(pb)) !== 'boas') falha('Bia não conseguiu criar a conta');

// 6. Ana chama a Bia
await abrirConversas(pa);
await pa.screenshot({ path: `${PASTA}conta-lista.png` });
await pa.fill('#nova-conv-user', '@' + bia.usuario); await pa.click('#nova-conv button[type="submit"]'); await espera(pa, 1500);
if ((await tela(pa)) === 'conversa') ok('conversa criada pelo nome de usuário'); else falha('conversa não abriu: ' + (await pa.textContent('#erro-nova-conv').catch(() => '')));
await pa.fill('#txt-conv', 'Oi! Consegui hoje.'); await pa.press('#txt-conv', 'Enter'); await espera(pa, 1500);
if ((await pa.$$eval('#rol-msgs .msg.minha .bolha-msg', (els) => els.map((e) => e.textContent))).includes('Oi! Consegui hoje.')) ok('mensagem enviada aparece como minha'); else falha('mensagem enviada não apareceu');

// 7. crise e moderação não vão para o servidor
await pa.fill('#txt-conv', 'não aguento mais'); await pa.press('#txt-conv', 'Enter'); await espera(pa, 800);
if (await pa.$('#rol-msgs .guardiao a[href^="tel:188"], #rol-msgs .guardiao [href*="188"]') || (await pa.textContent('#rol-msgs')).includes('188')) ok('texto de crise mostra o CVV 188'); else falha('crise não mostrou o CVV');
await pa.fill('#txt-conv', 'olha https://exemplo.com'); await pa.press('#txt-conv', 'Enter'); await espera(pa, 800);
if ((await pa.textContent('#rol-msgs')).includes('não foi enviada')) ok('link é barrado antes de enviar'); else falha('link não foi barrado');
await pa.screenshot({ path: `${PASTA}conta-conversa.png` });

// 8. Bia vê e responde; Ana recebe sem recarregar
await abrirConversas(pb);
const item = await pb.$(`[data-conv^="api:"]`);
if (item) ok('Bia vê a conversa na lista'); else falha('conversa não aparece para a Bia');
await item?.click(); await espera(pb, 1500);
const vistos = await textos(pb);
if (vistos.includes('Oi! Consegui hoje.')) ok('Bia lê a mensagem da Ana'); else falha('Bia não viu a mensagem: ' + vistos.join(' | '));
if (vistos.some((t) => t.includes('aguento') || t.includes('exemplo.com'))) falha('texto de crise ou link chegou ao servidor');
await pb.fill('#txt-conv', 'Que bom! Tô aqui.'); await pb.press('#txt-conv', 'Enter'); await espera(pb, 1000);
await espera(pa, 6000);
if ((await textos(pa)).includes('Que bom! Tô aqui.')) ok('Ana recebe a resposta sozinha (atualização a cada 5 s)'); else falha('Ana não recebeu a resposta');

// 9. sair da conta
await pa.evaluate(() => { location.hash = 'perfil'; }); await espera(pa, 1000);
const rotulo = await pa.textContent('#conta-perfil');
if (rotulo.includes('@' + ana.usuario)) ok('perfil mostra a conta: ' + rotulo); else falha('perfil não mostra a conta: ' + rotulo);
await pa.click('#conta-perfil'); await espera(pa, 600);
if (!(await pa.evaluate(() => localStorage.getItem('terraforma:token')))) ok('sair da conta apaga o token'); else falha('token continuou depois de sair');

// 10. esqueci a senha → link → senha nova (sem SMTP o back escreve o link no console: aqui pegamos o token pela API de teste)
const r = await pa.request.post(BACKEND + '/auth/forgot-password', { data: { email: ana.email } });
if (r.ok()) ok('esqueci a senha respondeu ' + r.status()); else falha('forgot-password respondeu ' + r.status());

// 11. Bia apaga os dados (e a conta)
await pb.evaluate(() => { location.hash = 'ajustes'; }); await espera(pb, 1000);
await pb.click('#aj-apagar'); await espera(pb, 200);
if ((await pb.textContent('#aj-apagar')).includes('conta')) ok('confirmação avisa que a conta será apagada'); else falha('confirmação não fala da conta');
await pb.click('#aj-apagar'); await espera(pb, 1500);
if ((await tela(pb)) === 'login') ok('depois de apagar volta ao login'); else falha('não voltou ao login');
const login = await pb.request.post(BACKEND + '/auth/login', { data: { email: bia.email, senha: bia.senha } });
if (login.status() === 401) ok('conta da Bia não existe mais no servidor'); else falha('conta da Bia ainda entra: ' + login.status());

await b.close();
if (erros.length) { console.error('\nFALHOU\n' + erros.join('\n')); process.exit(1); }
console.log('\nok: fluxo com conta funcionando.');
