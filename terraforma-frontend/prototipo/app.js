// Motor do protótipo Terraforma (portado do HTML único para módulo ES).
// iniciar() precisa rodar no navegador, depois que MARCACAO já está no DOM.
// opcoes.assets  → pasta pública das texturas e do som (padrão /terra/)
// opcoes.aoEvento(tipo, dados) → chamado nas ações que o backend deve guardar (ver docs/API.md)
import { criarGlobo, estadoDoPlaneta, REGIOES, LIMIARES, RIOS } from './globo.js';
import { criarOceano, criarSomDoMar, ceuDaHora, corDaNevoa } from './oceano.js';

let iniciado = false;
export async function iniciar(opcoes = {}) {
  if (iniciado) return; iniciado = true;   // o React em modo estrito monta duas vezes no desenvolvimento
  const ASSETS = opcoes.assets ?? '/terra/';
  const emitir = (tipo, dados) => { try { opcoes.aoEvento?.(tipo, { ...dados, em: new Date().toISOString() }); } catch (e) { console.error(e); } };
  const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const telas = ['boas', 'troca', 'inicio', 'mapa', 'mare', 'tempestade', 'ajuda', 'luneta', 'financas', 'perfil', 'orbita', 'recado', 'divida'];
const mq = (q) => { try { return matchMedia(q).matches; } catch { return false; } };

// ---------- estado da demo ----------
const PADRAO = { dias: 21, mares: 9, rios: { amazonas: false, saoFrancisco: false, parana: false }, dalt: false, escuro: mq('(prefers-color-scheme: dark)'), mov: mq('(prefers-reduced-motion: reduce)') };
const s = JSON.parse(JSON.stringify(PADRAO));
let tempestade = false, regiaoSel = -1, telaAtual = null, globo = null;

// ---------- menu ----------
const ICONES = {
  mapa: ['Mapa-Mundi', '#3B6D11', '#EAF3DE', '#C0DD97', '#27500A', '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14" fill="none"/>'],
  luneta: ['Luneta', '#3C3489', '#EEEDFE', '#CECBF6', '#3C3489', '<path d="M3 13l11-5 2.2 4.5-11 5z"/><path d="M14 8l3.5-1.6 2.2 4.5-3.5 1.6"/><path d="M10 15.5l-3 6M11.5 15l3 6.5" fill="none"/>'],
  ajuda: ['Ajuda', '#185FA5', '#E6F1FB', '#B5D4F4', '#185FA5', '<circle cx="12" cy="12" r="9"/><circle class="miolo" cx="12" cy="12" r="4" style="fill:var(--nav)"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" fill="none"/>'],
  financas: ['Finanças', '#854F0B', '#FAEEDA', '#FAC775', '#854F0B', '<path d="M4 7h14a2 2 0 0 1 2 2v9H4z"/><path d="M4 7l11-3v3" fill="none"/><circle cx="16" cy="13" r="1.2"/>'],
};
const CORES_PLANETA = ['Planeta', '#0F6E56', '#E1F5EE', '#9FE1CB', '#0F6E56'];
const ORDEM_NAV = ['mapa', 'luneta', 'inicio', 'ajuda', 'financas'];
const GLOBO_ICONE = `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="terra-menu-ID"><circle cx="12" cy="12" r="10"/></clipPath></defs>
<g class="linha" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M4.5 7.5h15M4.5 16.5h15"/></g>
<g class="cor"><circle cx="12" cy="12" r="10" fill="#85B7EB"/><g clip-path="url(#terra-menu-ID)" fill="#3B6D11"><path d="M1.6 7.4c1.4-2 3.6-3.4 6.1-3.6 1.1-.1 1.4 1 .7 1.6-.6.5-.5 1.5.3 1.8.9.3 1.5 1.3 1 2.1-.5.8-1.6.7-2.3 1.2-.9.6-.8 1.9-1.7 2.4-1 .5-2.1-.1-2.8-.9-.7-.8-1.1-1.9-1.3-3-.1-.6-.2-1.1 0-1.6z"/><path d="M7.3 12.9c1.1-.4 2.4-.1 3.3.6.9.7 2.1.9 2.5 2 .4 1.1-.3 2.2-1.1 3-.8.9-1.1 2.1-1.8 3.1-.5.7-1.4 1.2-1.8.4-.4-.8.1-1.6 0-2.5-.1-1.1-1-1.7-1.4-2.7-.4-1-.6-2.3.3-3.9z"/><path d="M15.1 5.6c1-.7 2.4-.8 3.4-.2.7.4.5 1.3-.2 1.6-.8.3-1.6 0-2.2.5-.6.4-.7 1.3-1.3 1.4-.8.1-1.1-.9-.7-1.6.3-.6.6-1.2 1-1.7z"/><path d="M16.2 10.3c1.4-.6 3.1-.4 4.3.3 1.1.6 1.6 1.9 1.4 3.1-.2 1.3-1.1 2.3-1.5 3.5-.4 1.1-.7 2.3-1.5 3.1-.7.6-1.7.3-1.9-.6-.3-1.3.2-2.6-.3-3.8-.4-.9-1.5-1.2-2-2.2-.5-1.3.2-2.8 1.5-3.4z"/></g><circle cx="12" cy="12" r="10" fill="none" stroke="#185FA5" stroke-width=".8"/></g></svg>`;
$$('[data-nav]').forEach((nav, n) => {
  const item = (id) => { const [nome, c, f, ce, fe, svg] = ICONES[id];
    return `<button type="button" data-ir="${id}" data-item="${id}" style="--c:${c};--f:${f};--ce:${ce};--fe:${fe}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${svg}</svg>${nome}<span class="ponto"></span></button>`; };
  const [, pc, pf, pce, pfe] = CORES_PLANETA;
  nav.innerHTML = '<span class="indicador" aria-hidden="true"></span>' + item('mapa') + item('luneta') + `<button type="button" class="centro" data-ir="inicio" data-item="inicio" style="--c:${pc};--f:${pf};--ce:${pce};--fe:${pfe}">${GLOBO_ICONE.replaceAll('ID', n)}Planeta<span class="ponto"></span></button>` + item('ajuda') + item('financas');
});
function corNav() {
  const esc = s.escuro;
  $$('[data-nav] button[data-item]').forEach((b) => {
    // menu cinza-claro fosco: a aba ativa vira uma pílula branca com a cor da seção
    b.style.setProperty('--cor-ativa', 'var(--c)');
    b.style.setProperty('--fundo-ativo', 'var(--ce)');
    b.style.setProperty('--pilula', '#FFFFFF');
    b.style.setProperty('--pilula-borda', esc ? '#FFFFFF' : '#DDE2E8');
  });
  $$('[data-nav]').forEach((nav) => pintarIndicador(nav, telaAtual));
}
let navIdx = -1;
function corDoIndicador(ind, b) {
  const cs = getComputedStyle(b);
  ind.style.setProperty('--ind-fundo', cs.getPropertyValue('--pilula').trim());
  ind.style.setProperty('--ind-borda', cs.getPropertyValue('--pilula-borda').trim());
}
function pintarIndicador(nav, tela) {
  const k = ORDEM_NAV.indexOf(tela), ind = nav.querySelector('.indicador'); if (!ind) return;
  if (k < 0) { ind.style.setProperty('--ind-op', 0); return; }
  const b = nav.querySelectorAll('button[data-item]')[k];
  ind.style.setProperty('--ind-op', 1); ind.style.setProperty('--i', k); corDoIndicador(ind, b);
}
// a pílula sai de onde estava na tela anterior e desliza até a aba nova
function deslizarIndicador(tela) {
  const k = ORDEM_NAV.indexOf(tela), nav = $(`#tela-${tela} [data-nav]`);
  if (nav && k >= 0 && navIdx >= 0 && navIdx !== k && !s.mov) {
    const ind = nav.querySelector('.indicador'), b0 = nav.querySelectorAll('button[data-item]')[navIdx];
    ind.classList.add('sem-anim'); ind.style.setProperty('--i', navIdx);
    corDoIndicador(ind, b0);
    void ind.offsetWidth; ind.classList.remove('sem-anim');
    requestAnimationFrame(() => pintarIndicador(nav, tela));
  } else if (nav) pintarIndicador(nav, tela);
  if (k >= 0) navIdx = k;
}

// ---------- derivados ----------
let estadoBoas = null;   // nas Boas-vindas o planeta conta a própria história, sem mexer no estado da pessoa
const estado = () => (telaAtual === 'boas' && estadoBoas) ? estadoBoas : estadoDoPlaneta({ dias: s.dias, mares: s.mares, rios: s.rios, tempestade });
const proxima = () => LIMIARES.findIndex((l) => s.dias < l);
function atualizarTextos() {
  const e = estado(), i = proxima();
  const h = new Date().getHours();
  $('#saudacao').textContent = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + `, ${typeof perfil !== 'undefined' ? perfil.nome : 'Rafael'}.`;
  if (typeof perfil !== 'undefined') { $('#saudacao').nextElementSibling.textContent = perfil.motivo + '.'; $('#tela-inicio .avatar span').textContent = (perfil.nome[0] || 'V').toUpperCase(); }
  if (i === -1) {
    $('#prox-nome').textContent = 'o Brasil inteiro está verde'; $('#prox-falta').textContent = '';
    setBarra($('#prox-barra'), 100);
  } else {
    const ant = i ? LIMIARES[i - 1] : 0, pct = Math.round(100 * (s.dias - ant) / (LIMIARES[i] - ant));
    $('#prox-nome').textContent = REGIOES[i];
    const f = LIMIARES[i] - s.dias; $('#prox-falta').textContent = `falta${f > 1 ? 'm' : ''} ${f} dia${f > 1 ? 's' : ''}`;
    setBarra($('#prox-barra'), pct);
  }
  $('#n-dias').textContent = s.dias; $('#n-dias-txt').textContent = s.dias === 1 ? 'dia de recomeço' : 'dias de recomeço'; $('#t-dias').textContent = s.dias;
  $('#n-reais').textContent = 'R$ ' + (s.dias * 120 / 7).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const verdes = e.rec.map((r, k) => r >= 1 ? REGIOES[k] : null).filter(Boolean);
  $('#t-verdes').textContent = `${verdes.length} de 5`;
  $('#t-verdes-nomes').textContent = verdes.length ? (verdes.length > 2 ? verdes.slice(0, -1).join(', ') + ' e ' + verdes.at(-1) : verdes.join(' e ')) : 'a primeira vem logo';
  // lista do mapa
  $('#lista-regioes').innerHTML = REGIOES.map((nome, k) => {
    const ok = s.dias >= LIMIARES[k], andando = k === i;
    const ant = k ? LIMIARES[k - 1] : 0, pct = Math.round(100 * Math.max(0, s.dias - ant) / (LIMIARES[k] - ant));
    const selo = ok ? '<span class="selo ok" aria-label="Recuperada">✓</span>' : andando ? '<span class="selo andando" aria-label="Em andamento"></span>' : '<span class="selo depois" aria-label="Ainda não"></span>';
    const dias = ok ? `${LIMIARES[k]} dias` : andando ? `${s.dias} de ${LIMIARES[k]}` : `${LIMIARES[k]} dias`;
    return `<li><button type="button" data-regiao="${k}" aria-pressed="${k === regiaoSel}">${selo}<span style="font-weight:${andando ? 700 : 400}">${nome === 'Norte' ? 'Norte, o Brasil inteiro' : nome}</span><span class="dias">${dias}</span>${andando ? `<span class="barra" aria-hidden="true"><div style="width:${pct}%"></div></span>` : ''}</button></li>`;
  }).join('');
  const sel = regiaoSel >= 0 ? regiaoSel : (i === -1 ? 4 : i);
  const okSel = s.dias >= LIMIARES[sel];
  $('#nota-regiao').textContent = okSel ? `${REGIOES[sel]} recuperado no dia ${LIMIARES[sel]}. Fica verde para sempre.`
    : sel === i ? `${REGIOES[sel]} está brotando: faltam ${LIMIARES[sel] - s.dias} dias. A cor avança aos poucos, a partir de pontos espalhados.`
    : `${REGIOES[sel]} começa depois de ${REGIOES[sel - 1]}. Cada região espera a anterior.`;
  $('#chip-mar').textContent = e.mar >= 1 ? 'Limpo' : e.mar > 0 ? 'Limpando' : 'Poluído';
  $('#chip-mar-s').textContent = `${s.mares} de 10 Marés`;
  const rios = RIOS.filter((_, k) => e.rios[k]);
  $('#chip-rios').textContent = `${rios.length} de 3`; $('#chip-rios-s').textContent = rios.join(', ') || 'nenhum ainda';
  const prox = [['São Francisco', 'a primeira Barreira', s.rios.saoFrancisco], ['Paraná', 'a primeira renegociação', s.rios.parana], ['Amazonas', 'o primeiro passo no plano de dívidas', s.rios.amazonas]].find((r) => !r[2]);
  $('#nota-rio').textContent = prox ? `Próximo rio: o ${prox[0]} volta quando você fizer ${prox[1]}.` : 'Os três rios estão correndo.';
}
function setBarra(el, pct) { el.setAttribute('aria-valuenow', pct); el.firstElementChild.style.width = pct + '%'; }

// ---------- navegação com continuidade ----------
function lugarDo(tela) {
  const sec = $(`#tela-${tela}`), slot = sec && $('[data-slot]', sec);
  const base = app.getBoundingClientRect();
  if (!slot) return { opacidade: 0, r: 70, cx: base.width / 2, cy: 120 };
  const r = slot.getBoundingClientRect();
  const cx = r.left - base.left + r.width / 2, cy = r.top - base.top + r.height / 2;
  if (slot.dataset.zoom) return { cx, cy: cy + 4, r: r.width * 1.02, opacidade: 1 };
  if (slot.dataset.orbita) return { cx, cy, r: 64, opacidade: 1 };
  return { cx, cy, r: Math.min(r.width, r.height) / 2 - 8, opacidade: 1 };
}
let pararMare = null, oceano = null, mergulhando = false;
function irPara(tela, { sem = false, jaSaiu = false } = {}) {
  if (!telas.includes(tela)) tela = 'inicio';
  if (tela === telaAtual || mergulhando) return;
  // sair do mar: a câmera sobe pelas nuvens antes de voltar ao planeta
  if (telaAtual === 'mare' && !jaSaiu) { sairDoMar().then(() => irPara(tela, { sem, jaSaiu: true })); return; }
  const antes = telaAtual && $(`#tela-${telaAtual}`), depois = $(`#tela-${tela}`);
  const reduzido = s.mov || sem;
  // saída rápida, entrada mais lenta com escalonamento
  if (antes) {
    antes.classList.add('saindo');
    setTimeout(() => { antes.hidden = true; antes.classList.remove('saindo'); }, reduzido ? 0 : 180);
  }
  if (!antes) $$('.tela').forEach((t) => { if (t !== depois) t.hidden = true; });   // abertura direta por link (#orbita, #mapa…)
  setTimeout(() => {
    depois.hidden = false; depois.classList.add('entrando'); deslizarIndicador(tela);
    [...depois.children].forEach((c, k) => { c.style.transitionDelay = reduzido ? '0ms' : `${k * 40}ms`; });
    requestAnimationFrame(() => requestAnimationFrame(() => depois.classList.remove('entrando')));
    if (globo && tela !== 'mare') moverGlobo(tela, reduzido ? 0 : 850);
  }, reduzido || !antes ? 0 : 120);
  if (telaAtual === 'mare' && pararMare) pararMare();
  if (telaAtual === 'tempestade' && tempestade) { tempestade = false; aplicar(); } // as nuvens passam
  telaAtual = tela; app.dataset.tela = tela;
  $$('[data-nav] button[data-item]').forEach((b) => b.setAttribute('aria-current', b.dataset.item === tela ? 'page' : 'false'));
  if (tela === 'tempestade') { tempestade = true; aplicar(); emitir('tempestade', {}); }
  if (tela === 'mare') entrarNoMar(reduzido);
  if (tela === 'orbita') desenharOrbita();
  app.classList.toggle('no-boas', tela === 'boas');
  if (tela === 'boas') abrirBoas(); else pararLapso();
  if (tela === 'financas') desenharFin();
  if (tela === 'troca') desenharTroca(); else $('#passou')?.classList.remove('on');
  if (tela === 'divida') desenharDivida();
  if (tela === 'mare' || tela === 'tempestade' || tela === 'ajuda') fecharRecado();
  if (tela !== 'financas' && tela !== 'divida') $('#rio-volta').classList.remove('on');
  if (tela !== 'mapa' && globo) globo.focarRegiao(-1);
  if (tela === 'mapa' && globo) globo.focarRegiao(regiaoSel);
  if (tela === 'mapa' && regiaoSel >= 0) setTimeout(() => $(`[data-regiao="${regiaoSel}"]`)?.scrollIntoView({ block: 'nearest' }), 400);
  try { if (location.hash !== '#' + tela) history.replaceState(null, '', '#' + tela); } catch {}
}
function moverGlobo(tela, ms) {
  const lugar = lugarDo(tela);
  globo.nuvens(tela === 'mapa' ? 0.2 : 1);
  globo.mostrarSatelites(tela === 'orbita');
  if (tela === 'mapa') { if (regiaoSel < 0) globo.focar({ lon: -53, lat: -15 }); }
  else globo.focar(globo.centroBrasil, tela === 'inicio' || tela === 'boas');
  if (saidaDoMar && ms > 0) { saidaDoMar = false; globo.irPara(lugar, 1700, 'subida'); }
  else globo.irPara(lugar, ms);
  posicionarSombra(lugar, tela === 'inicio' || tela === 'tempestade');
}
function posicionarSombra(l, visivel) {
  const el = $('#sombra');
  el.style.width = l.r * 1.6 + 'px'; el.style.height = l.r * 0.28 + 'px';
  el.style.transform = `translate(${l.cx - l.r * 0.8}px, ${l.cy + l.r * 0.98}px)`;
  el.style.opacity = visivel && l.opacidade ? 1 : 0;
  el.style.transition = s.mov ? 'none' : 'transform 850ms cubic-bezier(.65,0,.35,1), width 850ms, height 850ms, opacity 400ms';
}

// ---------- Respire com a Terra ----------
// Ritmos: cada passo tem rótulo, dica, segundos e para onde vai o fôlego (0 = vazio, 1 = cheio)
const TECNICAS = {
  lenta: { nome: 'Respiração lenta', ritmo: '4 s · 6 s', desc: 'Seis respirações por minuto, soltando mais devagar do que puxa.',
    passos: [['Inspire', 'pelo nariz', 4, 1], ['Solte', 'devagar, pela boca ou nariz', 6, 0]] },
  suspiro: { nome: 'Suspiro cíclico', ritmo: '2 + 1 s · 6 s', desc: 'Duas puxadas pelo nariz e uma soltada longa pela boca.',
    passos: [['Inspire', 'pelo nariz', 2.5, 0.78], ['Mais um pouco', 'encha o peito', 1, 1], ['Solte', 'pela boca, bem devagar', 6, 0]] },
  surfar: { nome: 'Surfar a vontade', ritmo: '4 s · 6 s', desc: 'Observe a vontade como uma onda, sem agir sobre ela.',
    passos: [['Inspire', 'pelo nariz', 4, 1], ['Solte', 'devagar', 6, 0]],
    falas: ['Note onde a vontade aparece no corpo: peito, mãos, estômago.', 'Dê uma nota para ela agora, só na sua cabeça.',
      'Ela é uma onda: sobe, chega ao pico e desce.', 'Você não precisa fazer nada com ela. Só observe.',
      'Perceba se ela mudou de tamanho desde o começo.', 'Cada vez que você solta o ar, deixe a onda passar por baixo.',
      'Se a mente for para longe, volte para a respiração. Isso faz parte.', 'Você surfou essa onda até aqui.'] },
};
let tecnica = 'lenta', minutos = 3, som = null, somLigado = true;
try { somLigado = localStorage.getItem('terraforma:som') !== 'desligado'; } catch {}
function botaoSom() {
  $('#som').setAttribute('aria-pressed', String(somLigado));
  $('#som-texto').textContent = somLigado ? 'Som ligado' : 'Som desligado';
  $('#som-ondas').toggleAttribute('hidden', !somLigado); $('#som-x').toggleAttribute('hidden', somLigado);
}
const VOLUME_MAR = 0.28;
// abre o áudio dentro do toque (o navegador exige), mas em silêncio; o volume sobe só perto do mar
function abrirSom() { som ??= criarSomDoMar(ASSETS + 'mar.mp3'); som?.abrir(); }
botaoSom();
$('#tecnicas').innerHTML = Object.entries(TECNICAS).map(([id, t]) =>
  `<button type="button" class="tecnica" data-tecnica="${id}" aria-pressed="${id === tecnica}"><b>${t.nome}</b><span class="ritmo">${t.ritmo}</span><small>${t.desc}</small></button>`).join('');
$('#tecnicas').onclick = (e) => { const b = e.target.closest('[data-tecnica]'); if (!b) return; tecnica = b.dataset.tecnica; $$('#tecnicas [data-tecnica]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
$('#duracoes').onclick = (e) => { const b = e.target.closest('[data-min]'); if (!b) return; minutos = +b.dataset.min; $$('#duracoes [data-min]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
$('#vontade-antes').oninput = (e) => { $('#o-antes').textContent = e.target.value; };
$('#vontade-depois').oninput = (e) => { $('#o-depois').textContent = e.target.value; mostrarResultado(); };
$('#som').onclick = () => {
  somLigado = !somLigado;
  try { localStorage.setItem('terraforma:som', somLigado ? 'ligado' : 'desligado'); } catch {}
  if (somLigado) { abrirSom(); if (telaAtual === 'mare') som?.volume(VOLUME_MAR, 1.5); } else som?.volume(0, 0.6);
  botaoSom();
};
$('#mare-voltar').onclick = () => irPara('inicio');
$('#fim-voltar').onclick = () => { if (sessao) emitir('sessao_respiracao', { tecnica: sessao.t.nome, segundos: Math.round(sessao.decorrido), antes: sessao.antes, depois: +$('#vontade-depois').value }); irPara('inicio'); };
$('#fim-mais').onclick = () => etapa('escolha');
$('#comecar').onclick = () => comecarSessao();
$('#encerrar').onclick = () => { pararMare?.(); terminarSessao(false); };

const ceuEscolhido = () => ($('#c-ceu').value === 'auto' ? ceuDaHora() : $('#c-ceu').value);
$('#c-ceu').onchange = () => { oceano?.setCeu(ceuEscolhido()); pintarNevoa(ceuEscolhido()); };

let nevoaIntro = 0, nevoaMar = 0, mostrandoMar = false;
// a névoa do oceano só vale quando ele está na tela (antes disso o planeta ainda aparece)
function nevoa(v) { nevoaMar = mostrandoMar ? v : 0; $('#nevoa').style.opacity = Math.max(nevoaMar * 0.96, nevoaIntro).toFixed(3); }
function pintarNevoa(ceu) { const [c0, c1] = corDaNevoa(ceu); $('#nevoa').style.background = `radial-gradient(120% 90% at 50% 40%, ${c0} 0%, ${c1} 100%)`; }
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const suaveT = (t) => t * t * (3 - 2 * t);
function animarNevoaIntro(de, para, ms) {
  return new Promise((ok) => {
    const t0 = performance.now();
    const f = (agora) => { const t = Math.min(1, (agora - t0) / ms); nevoaIntro = de + (para - de) * suaveT(t); nevoa(nevoaMar); if (t < 1) requestAnimationFrame(f); else ok(); };
    requestAnimationFrame(f);
  });
}
function garantirOceano() {
  oceano ??= criarOceano($('#camada-oceano'), { ceu: ceuEscolhido(), movimentoReduzido: s.mov, aoNevoa: nevoa, pausado: true });
  return oceano;
}

const PAINEIS = { escolha: ['#mare-escolha'], sessao: ['#mare-sessao', '#mare-rodape'], fim: ['#mare-fim'] };
function mostrarPainel(el, atraso = 0) {
  clearTimeout(el._t); el.classList.remove('sumindo');
  if (!el.hidden && !el.classList.contains('surgindo')) return;
  el.hidden = false; el.classList.add('surgindo');
  el._t = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('surgindo'))), atraso);
}
function esconderPainel(el) {
  if (el.hidden) return;
  clearTimeout(el._t); el.classList.remove('surgindo'); el.classList.add('sumindo');
  el._t = setTimeout(() => { el.hidden = true; el.classList.remove('sumindo'); }, s.mov ? 0 : 270);
}
// troca de etapa: o painel atual sai, o próximo entra logo depois (sem os dois ao mesmo tempo)
function etapa(nome) {
  let saiu = false;
  Object.entries(PAINEIS).forEach(([k, qs]) => { if (k !== nome) qs.forEach((q) => { if (!$(q).hidden) saiu = true; esconderPainel($(q)); }); });
  if (nome) (PAINEIS[nome] || []).forEach((q, i) => mostrarPainel($(q), (saiu && !s.mov ? 280 : 0) + i * 80));
  if (nome === 'escolha') respirarOcioso();
}
let ocioso = null;
function respirarOcioso() {
  cancelAnimationFrame(ocioso);
  const t0 = performance.now();
  const f = (agora) => { const v = 0.5 - 0.5 * Math.cos((agora - t0) / 1000 * Math.PI * 2 / 10); oceano?.setFolego(v * 0.6); ocioso = requestAnimationFrame(f); };
  ocioso = requestAnimationFrame(f);
}

// Entrada: uma queda contínua. O planeta aproxima cada vez mais rápido em direção ao mar ao lado do Brasil;
// no meio do zoom, a vista do alto do oceano (com as mesmas nuvens por cima) se mistura com o planeta;
// a câmera continua caindo olhando para baixo, atravessa as nuvens como véus e levanta o olhar até o horizonte.
const PONTO_MAR = { lon: -31, lat: -9 };
let saidaDoMar = false;
async function entrarNoMar(reduzido) {
  mergulhando = true;
  abrirSom();                                  // ainda dentro do toque
  etapa(null);
  const o = garantirOceano(), ceu = ceuEscolhido();
  o.setCeu(ceu); o.setOpcoes({ movimentoReduzido: s.mov });
  if (!reduzido && globo) {
    o.preparar();
    const base = app.getBoundingClientRect();
    globo.focar(PONTO_MAR); globo.nuvens(1.6);
    globo.irPara({ cx: base.width / 2, cy: base.height / 2, r: 1600, opacidade: 1 }, 1800, 'queda');
    posicionarSombra({ cx: 0, cy: 0, r: 0, opacidade: 0 }, false);
    await esperar(1300);
    o.ligar();
    $('#camada-oceano').classList.add('on'); mostrandoMar = true; app.classList.add('no-mar');   // mistura de 650 ms enquanto o planeta ainda aproxima
    const descida = o.descer(4200);
    setTimeout(() => { if (somLigado) som?.volume(VOLUME_MAR, 3.5); }, 1600);
    await esperar(950);
    globo.irPara({ opacidade: 0 }, 0); globo.nuvens(1);
    await descida;
  } else {
    if (globo) globo.irPara({ opacidade: 0 }, 0);
    o.pousar(); o.ligar();
    $('#camada-oceano').classList.add('on'); mostrandoMar = true; app.classList.add('no-mar');
    if (somLigado) som?.volume(VOLUME_MAR, 2);
  }
  etapa('escolha');
  mergulhando = false;
}

// Saída: o caminho inverso. A câmera sobe olhando para baixo, a vista do alto se mistura com o planeta
// bem de perto, e o planeta se afasta desacelerando até o lugar dele na tela.
async function sairDoMar() {
  mergulhando = true;
  pararMare?.(); cancelAnimationFrame(ocioso);
  som?.volume(0, 1.4);
  const reduzido = s.mov;
  etapa(null);
  const base = app.getBoundingClientRect();
  if (!reduzido && oceano) {
    oceano.setFolego(0);
    await oceano.subir(1900);
    if (globo) { globo.focar(PONTO_MAR); globo.nuvens(1); globo.irPara({ cx: base.width / 2, cy: base.height / 2, r: 1600, opacidade: 1 }, 0); }
    $('#camada-oceano').classList.remove('on'); mostrandoMar = false; app.classList.remove('no-mar');
    saidaDoMar = true;
    mergulhando = false;
    setTimeout(() => oceano?.desligar(), 700);
  } else {
    oceano?.desligar();
    $('#camada-oceano').classList.remove('on'); mostrandoMar = false; app.classList.remove('no-mar');
    if (globo) { globo.focar(PONTO_MAR); globo.irPara({ cx: base.width / 2, cy: base.height / 2, r: 140, opacidade: 1 }, 0); }
    mergulhando = false;
  }
}

let sessao = null;
function comecarSessao() {
  cancelAnimationFrame(ocioso);
  const t = TECNICAS[tecnica];
  const ciclo = t.passos.reduce((a, p) => a + p[2], 0);
  const total = minutos * 60;
  sessao = { t, ciclo, total, decorrido: 0, pausado: false, ultimo: performance.now(), fala: -1, antes: +$('#vontade-antes').value };
  $('#tecnica-nome').textContent = t.nome;
  $('#prompt').textContent = ''; $('#fase').textContent = '';
  $('#pausa-sessao').textContent = 'Pausar';
  etapa('sessao');
  const anel = $('#anel-prog'), bolha = $('#bolha');
  let raf;
  const passo = (agora) => {
    const dt = (agora - sessao.ultimo) / 1000; sessao.ultimo = agora;
    if (!sessao.pausado) sessao.decorrido += dt;
    const e = sessao.decorrido;
    // em que ponto do ciclo estamos
    let x = e % ciclo, ant = 0, v = 0, rot = t.passos[0];
    for (const p of t.passos) {
      if (x < p[2]) {
        const k = x / p[2], sk = 0.5 - 0.5 * Math.cos(Math.PI * k);
        v = ant + (p[3] - ant) * sk; rot = [...p, Math.ceil(p[2] - x)]; break;
      }
      x -= p[2]; ant = p[3];
    }
    if ($('#fase').textContent !== rot[0]) {
      const f = rot[0] === 'Solte' ? 'solte' : rot[0] === 'Inspire' ? 'inspire' : 'mais';
      $('#fase').textContent = rot[0]; $('#fase').dataset.fase = f; bolha.dataset.fase = f;
    }
    $('#dica').textContent = `${rot[1]} · ${rot[4]}`;
    bolha.style.transform = `scale(${0.42 + 0.58 * v})`; // cheio = encosta no anel
    oceano?.setFolego(v);
    const resta = Math.max(0, Math.ceil(sessao.total - e));
    $('#tempo').firstChild.textContent = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
    anel.setAttribute('stroke-dashoffset', (653.5 * (1 - Math.min(1, e / sessao.total))).toFixed(1));
    if (t.falas) {
      const i = Math.min(t.falas.length - 1, Math.floor(e / (sessao.total / t.falas.length)));
      if (i !== sessao.fala) { sessao.fala = i; $('#prompt').textContent = t.falas[i]; }
    }
    if (e >= sessao.total) { terminarSessao(true); return; }
    raf = requestAnimationFrame(passo);
  };
  raf = requestAnimationFrame(passo);
  pararMare = () => { cancelAnimationFrame(raf); pararMare = null; };
  $('#pausa-sessao').onclick = () => { sessao.pausado = !sessao.pausado; $('#pausa-sessao').textContent = sessao.pausado ? 'Continuar' : 'Pausar'; };
}

function terminarSessao(completa) {
  pararMare?.();
  const feita = sessao && sessao.decorrido >= 60;
  if (feita) { s.mares = Math.min(10, s.mares + 1); sincronizarPainel(); aplicar(); }
  $('#fim-titulo').textContent = completa ? 'Passou?' : 'Tudo bem parar aqui.';
  $('#vontade-depois').value = sessao ? sessao.antes : 5; $('#o-depois').textContent = $('#vontade-depois').value;
  $('#fim-mare').textContent = feita ? `Maré ${s.mares} de 10. O mar sente cada uma.` : 'Com 1 minuto ou mais, a sessão conta como uma Maré.';
  mostrarResultado();
  etapa('fim');
  oceano?.setFolego(0.3);
}
function mostrarResultado() {
  if (!sessao) return;
  const a = sessao.antes, d = +$('#vontade-depois').value;
  $('#resultado').innerHTML = d < a ? `A vontade foi de <b>${a}</b> para <b>${d}</b>. Você deixou a onda passar.`
    : d === a ? `A vontade continua em <b>${d}</b>. Às vezes ela demora mais. Mais uma rodada pode ajudar.`
    : `A vontade subiu para <b>${d}</b>. Se ela continuar forte, chame alguém da sua órbita ou ligue 188 (CVV).`;
}

// ---------- informação ----------
function abrirInfo(abrir) {
  $('#info').classList.toggle('aberta', abrir); $('#veu').classList.toggle('on', abrir);
  $('#info').setAttribute('aria-hidden', String(!abrir)); $('#info').inert = !abrir;
  if (abrir) $('#fechar-info').focus(); else $('#abrir-info').focus();
}
$('#abrir-info').onclick = () => abrirInfo(true);
$('#fechar-info').onclick = () => abrirInfo(false);
$('#veu').onclick = () => abrirInfo(false);
app.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#info').classList.contains('aberta')) abrirInfo(false); });

let avisoT;
function aviso(txt) { const a = $('#aviso'); a.textContent = txt; a.classList.add('on'); clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('on'), 2600); }

// cliques delegados
app.addEventListener('click', (e) => {
  const ir = e.target.closest('[data-ir]'); if (ir) { irPara(ir.dataset.ir); return; }
  const av = e.target.closest('[data-aviso]'); if (av) { aviso(av.dataset.aviso); return; }
  const rg = e.target.closest('[data-regiao]'); if (rg) { selecionarRegiao(+rg.dataset.regiao); }
});
function selecionarRegiao(k) {
  regiaoSel = k; if (globo) globo.focarRegiao(k); atualizarTextos();
  const b = $(`[data-regiao="${k}"]`); if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest', behavior: s.mov ? 'auto' : 'smooth' }); }
}
$('#pausar').onclick = () => {
  if (!globo) return; const p = !globo.pausado; globo.pausar(p);
  $('#pausar').setAttribute('aria-pressed', String(p));
  $('#pausar').setAttribute('aria-label', p ? 'Retomar o movimento do planeta' : 'Pausar o movimento do planeta');
  $('#icone-pausa').setAttribute('d', p ? 'M3 2l7 4-7 4z' : 'M3 2h2v8H3zM7 2h2v8H7z');
};

// ---------- Órbita ----------
// Pessoas fictícias da demo. Os recados são escritos pela própria pessoa (tela Escrever); o app nunca inventa um.
const ORBITA = [
  { nome: 'Ana', relacao: 'irmã', cor: '#5DCAA5', borda: '#0F6E56', fundo: '#E1F5EE', recados: [{ txt: 'Um dia de cada vez. Tô orgulhosa de você e tô aqui.', quando: '12/10' }, { txt: 'Lembrei de você hoje. Bora tomar um café no sábado?', quando: '20/10' }], prox: 0 },
  { nome: 'Pedro', relacao: 'amigo', cor: '#AFA9EC', borda: '#3C3489', fundo: '#EEEDFE', recados: [{ txt: 'Se apertar, me liga. Qualquer hora.', quando: '15/10' }], prox: 0 },
];
let escrevendo = 0, recadoT = null;
function desenharOrbita() {
  $('#lista-orbita').innerHTML = ORBITA.map((p, i) => {
    const t = globo?.proximaVolta(i), m = t == null ? '' : t >= 60 ? `${Math.ceil(t / 60)} min` : `${Math.ceil(t)} s`;
    return `<li><span class="ini" style="background:${p.fundo};border-color:${p.borda};color:${p.borda}">${p.nome[0]}</span><span class="quem"><b>${p.nome} · ${p.relacao}</b><small>${p.recados.length} recado${p.recados.length === 1 ? '' : 's'}${m ? ` · próxima volta em ${m}` : ''}</small></span><button class="acao-lin" type="button" data-escrever="${i}">Escrever</button></li>`;
  }).join('') + '<li style="border-style: dashed; justify-content: center"><button class="acao-lin" type="button" data-aviso="No app: nome, relação e telefone, que ficam só neste celular. Até 3 pessoas.">+ Colocar alguém na órbita</button></li>';
}
setInterval(() => { if (telaAtual === 'orbita') desenharOrbita(); }, 1000);
app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-escrever]'); if (!b) return;
  escrevendo = +b.dataset.escrever;
  $('#recado-titulo').textContent = `${ORBITA[escrevendo].nome}, deixe um recado para o Rafael`;
  $('#recado-texto').value = '';
  irPara('recado');
});
$('#ideias').onclick = (e) => { const c = e.target.closest('.chip-ideia'); if (c) { const t = $('#recado-texto'); t.value = (t.value ? t.value + ' ' : '') + c.textContent; t.focus(); } };
$('#salvar-recado').onclick = () => {
  const txt = $('#recado-texto').value.trim();
  if (!txt) { aviso('Escreva um recado antes de salvar.'); return; }
  const d = new Date(); ORBITA[escrevendo].recados.push({ txt, quando: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` });
  ORBITA[escrevendo].prox = ORBITA[escrevendo].recados.length - 1;   // o novo recado é o próximo a aparecer
  aviso('Recado salvo. Ele chega na próxima volta do satélite.');
  irPara('orbita');
};
function mostrarRecado(i) {
  const p = ORBITA[i];
  if (!$('#recados-on').checked || !p || !p.recados.length) return;
  if (!['inicio', 'mapa', 'orbita', 'perfil'].includes(telaAtual) || mergulhando) return;   // nunca na respiração, tempestade ou Ajuda
  const r = p.recados[p.prox % p.recados.length]; p.prox++;
  const ini = $('#recado-ini'); ini.textContent = p.nome[0]; ini.style.background = p.fundo; ini.style.borderColor = p.borda; ini.style.color = p.borda;
  $('#recado-quem').textContent = `${p.nome} passou pela sua órbita`;
  $('#recado-quando').textContent = `Recado que ${p.relacao === 'irmã' ? 'ela' : 'ele'} escreveu em ${r.quando}`;
  $('#recado-txt').textContent = `“${r.txt}”`;
  $('#recado-responder').textContent = `Responder ${p.relacao === 'irmã' ? 'à' : 'ao'} ${p.nome}`;
  $('#recado-responder').dataset.aviso = `No app, abre a conversa com ${p.nome}. Na demo, nada é enviado.`;
  $('#recado').classList.add('on');
  clearTimeout(recadoT); recadoT = setTimeout(fecharRecado, 15000);
}
function fecharRecado() { $('#recado').classList.remove('on'); clearTimeout(recadoT); }
$('#recado-fechar').onclick = fecharRecado;
$('#recado-ok').onclick = fecharRecado;
$('#recado-responder').addEventListener('click', () => setTimeout(fecharRecado, 50));
$('#c-volta').onchange = (e) => { globo?.setPeriodoVolta(+e.target.value); desenharOrbita(); };

// ---------- Finanças ----------
// Regras: nada de dinheiro real nem conexão com banco (edital 8.4/8.5); valores fictícios só na demo;
// o rio volta pelo PASSO dado, nunca pelo valor pago; nunca mostrar "quanto perdeu".
const PASSOS = ['Listei', 'Abri a negociação', 'Renegociei', 'Paguei a 1ª parcela', 'Quitei'];
const PASSOS_FAMILIA = ['Listei', 'Conversei com calma', 'Combinamos um valor por mês', 'Paguei a 1ª parte', 'Quitei'];
const FAZER = ['Listar', 'Abrir a negociação', 'Renegociar', 'Pagar a 1ª parcela', 'Quitar'];
const FAZER_FAMILIA = ['Listar', 'Conversar com calma', 'Combinar um valor por mês', 'Pagar a 1ª parte', 'Quitar'];
const JUROS = { 'muito alto': 3, alto: 2, 'sem juros': 0 };
const FIN_PADRAO = {
  aba: 'dividas', estrategia: 'cara',
  basico: { Moradia: true, Comida: true, 'Luz e água': false, Transporte: true, Remédios: true },
  dividas: [
    { id: 'cartao', tipo: 'Cartão de crédito', det: 'rotativo', valor: 2400, juros: 'muito alto', passo: 1, plano: null },
    { id: 'cheque', tipo: 'Cheque especial', valor: 800, juros: 'muito alto', passo: 1, plano: null },
    { id: 'emprestimo', tipo: 'Empréstimo pessoal', valor: 3500, juros: 'alto', passo: 1, plano: null },
    { id: 'ana', tipo: 'Ana', det: 'irmã', valor: 500, juros: 'sem juros', passo: 1, plano: null, familia: true },
  ],
  barreiras: { pix: false, bloqueador: false, combinado: false },
};
let fin = JSON.parse(JSON.stringify(FIN_PADRAO)), dividaAberta = 'cartao', planoTmp = { quando: null, onde: null };
const reais = (v) => 'R$ ' + v.toLocaleString('pt-BR');
const passosDe = (d) => (d.familia ? PASSOS_FAMILIA : PASSOS);
const fazerDe = (d) => (d.familia ? FAZER_FAMILIA : FAZER);
function ordemDividas() {
  const abertas = fin.dividas.filter((d) => d.passo < 5), quitadas = fin.dividas.filter((d) => d.passo >= 5);
  abertas.sort(fin.estrategia === 'cara' ? (a, b) => (JUROS[b.juros] - JUROS[a.juros]) || (b.valor - a.valor) : (a, b) => a.valor - b.valor);
  return [...abertas, ...quitadas];
}
function desenharRiosFin() {
  const nomes = { amazonas: 'Amazonas', saoFrancisco: 'São Francisco', parana: 'Paraná' };
  const dica = { amazonas: '1º passo numa dívida', saoFrancisco: '1ª Barreira', parana: '1ª renegociação' };
  Object.keys(nomes).forEach((k) => {
    const on = !!s.rios[k];
    $(`#rios-faixa [data-rio="${k}"]`).classList.toggle('on', on);
    const r = $(`#rios-faixa [data-rot="${k}"]`); r.classList.toggle('on', on);
    r.querySelector('small').textContent = on ? 'correndo' : dica[k];
  });
  const n = Object.values(s.rios).filter(Boolean).length;
  $('#rios-faixa').setAttribute('aria-label', `Rios do planeta: ${n} de 3 correndo. ` + Object.keys(nomes).map((k) => `${nomes[k]} ${s.rios[k] ? 'correndo' : 'seco, volta com ' + dica[k]}`).join('; '));
}
const pontos = (d) => { const n = d.passo; return `<div class="pontos5" aria-hidden="true"><span class="barra" style="width: ${Math.max(0, Math.min(n, 5) - 1) * 20}%"></span>${[0, 1, 2, 3, 4].map((k) => `<i class="${k < n ? 'feito' : k === n ? 'agora' : ''}"></i>`).join('')}</div>`; };
const escalonar = (el) => [...el.children].forEach((c, k) => c.style.setProperty('--k', k));
const ICO = {
  pix: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2"/></svg>',
  bloqueador: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10c-4-2-7-5.5-7-10V6z"/></svg>',
  combinado: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19c1-3 3-4.5 5-4.5s4 1.5 5 4.5M11 19c1-3 3-4.5 5-4.5s4 1.5 5 4.5"/></svg>',
  auto: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>',
};
function desenharFin() {
  desenharRiosFin();
  const abas = ['basico', 'dividas', 'barreiras'];
  $$('#tela-financas [data-aba]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === fin.aba)));
  $('#ind-abas').style.setProperty('--i', abas.indexOf(fin.aba));
  const p = $('#painel-fin'); p.setAttribute('aria-labelledby', 'aba-' + fin.aba);
  const rodape = '<p class="rodape-fin">Não é consultoria financeira · orientação grátis no Procon ou na Defensoria</p>';
  if (fin.aba === 'basico') {
    const falta = Object.entries(fin.basico).filter(([, v]) => !v).map(([k]) => k.toLowerCase());
    p.innerHTML = `
      <h3 class="tit-fin">Este mês está garantido?</h3>
      <div class="basicos">${Object.entries(fin.basico).map(([k, v]) => `<button type="button" data-basico="${k}" aria-pressed="${v}">${k}</button>`).join('')}</div>
      ${falta.length ? `<p class="alerta-fin">Primeiro ${falta.join(', ')}, depois as dívidas. O CRAS da sua cidade orienta sobre ajuda.</p>` : '<p class="alerta-fin bom">O básico está garantido. Dá para olhar as dívidas com calma.</p>'}
      <details class="saber"><summary>A lei protege o seu mínimo</summary><div class="corpo"><p>Pela Lei do Superendividamento, dá para renegociar todas as dívidas juntas no Procon ou na Justiça, preservando R$ 600 por mês para viver. O STF manteve esse valor em abril de 2026.</p><p class="fonte">Lei 14.181/2021 · Decreto 11.150/2022 · STF, ADPFs 1.005, 1.006 e 1.097</p></div></details>
      <details class="saber"><summary>Não lembra de todas as dívidas?</summary><div class="corpo"><p>O Registrato, do Banco Central, mostra de graça as dívidas no seu CPF. Precisa de conta gov.br prata ou ouro.</p></div></details>
      ${rodape}`;
  } else if (fin.aba === 'dividas') {
    const ordem = ordemDividas(), foco = ordem.find((d) => d.passo < 5), resto = ordem.filter((d) => d !== foco);
    const est = fin.estrategia === 'cara';
    p.innerHTML = `
      <div class="estrat"><span class="rotulo-fin" id="rot-estrat">Começar pela</span><div class="seg mini" role="group" aria-labelledby="rot-estrat" style="--n: 2"><span class="ind" aria-hidden="true" style="--i: ${est ? 0 : 1}"></span><button type="button" data-estrategia="cara" aria-pressed="${est}">mais cara</button><button type="button" data-estrategia="menor" aria-pressed="${!est}">menor</button></div></div>
      <p class="dica-fin">${est ? 'Paga menos juros no total.' : 'Quitar uma logo dá fôlego.'} Uma de cada vez.</p>
      ${foco ? `<article class="foco" aria-label="Foco agora: ${foco.tipo}">
        <span class="etq">Foco agora</span>
        <div class="topo-foco"><h3>${foco.tipo}</h3><span class="val">${reais(foco.valor)}</span></div>
        ${pontos(foco)}
        <p class="passo-txt">Passo ${foco.passo + 1} de 5${foco.plano ? ` · plano: ${foco.plano}` : ''}</p>
        <button class="botao fin" type="button" data-divida="${foco.id}">${fazerDe(foco)[foco.passo]} <span aria-hidden="true">→</span></button>
      </article>` : '<p class="alerta-fin bom">Todas quitadas. Isso fica para sempre.</p>'}
      ${resto.length ? `<p class="mini-tit">Depois</p><ul class="lista-curta">${resto.map((d) => `<li><button type="button" data-divida="${d.id}"><span>${d.tipo}</span>${d.passo >= 5 ? '<span class="ok">✓ quitada</span>' : `<span class="val">${reais(d.valor)}</span>`}<span class="mini" aria-hidden="true">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < d.passo ? 'feito' : ''}"></i>`).join('')}</span></button></li>`).join('')}</ul>` : ''}
      <p class="rodape-fin">Os rios voltam pelos passos, nunca pelo valor.</p>`;
  } else {
    const b = fin.barreiras;
    const item = (id, tit, corpo, ok) => `<details class="saber ${ok ? 'ativa' : ''}"><summary><span class="lado"><span class="ico">${ICO[id]}</span>${tit}</span><span class="est">${ok ? '✓ ativa' : ''}</span></summary><div class="corpo">${corpo}${ok ? '' : `<button class="botao fin" type="button" data-barreira="${id}">${id === 'combinado' ? 'Combinei' : 'Fiz isso'}</button>`}</div></details>`;
    p.innerHTML = `
      ${item('pix', 'Pix menor à noite', '<p>Baixar o limite vale na hora; aumentar leva 24 horas. A espera protege de madrugada.</p><ol><li>No app do banco, abra o Pix.</li><li>Entre em "Meus limites".</li><li>Baixe o valor do período noturno.</li></ol><p class="fonte">Banco Central: noite das 20h às 6h, limite padrão de R$ 1.000.</p>', b.pix)}
      ${item('bloqueador', 'Bloqueador de sites', '<p>Sites ilegais continuam no ar. Um bloqueador no celular fecha a porta antes da vontade. Há opções gratuitas.</p>', b.bloqueador)}
      ${item('combinado', 'Combinar com alguém da Órbita', '<p>Por exemplo: "Se eu quiser aumentar o limite do Pix, te aviso antes." O app não toca no seu dinheiro.</p>', b.combinado)}
      <details class="saber conferir"><summary><span class="lado"><span class="ico">${ICO.auto}</span>Autoexclusão</span><span class="est">a conferir</span></summary><div class="corpo"><p>As apostas estão proibidas pela MP 1.394/2026 e o STF discute a medida. Se voltarem, bloquear o próprio CPF pelo gov.br é uma barreira forte.</p><p class="fonte">Reconferir após a audiência do STF de 3/11.</p></div></details>
      <p class="dica-fin" style="margin: 0 2px">A primeira Barreira traz o São Francisco de volta.</p>
      ${rodape}`;
  }
  escalonar(p);
}
const ONDE = { padrao: ['consumidor.gov.br', 'Procon', 'Canal do credor', 'Defensoria'], familia: ['Pessoalmente', 'Por mensagem', 'Por ligação'] };
function desenharDivida() {
  const d = fin.dividas.find((x) => x.id === dividaAberta); if (!d) return;
  const pss = passosDe(d), prox = fazerDe(d)[d.passo] || '', onde = d.familia ? ONDE.familia : ONDE.padrao;
  const roteiro = d.familia
    ? `“${d.tipo}, quero te devolver o que você me emprestou. Consigo R$ __ por mês sem faltar o básico. Pode ser assim?”`
    : '“Quero negociar esta dívida. Consigo pagar R$ __ por mês sem faltar o básico. Quais condições vocês oferecem? Pode mandar por escrito?”';
  const p = $('#painel-divida');
  p.innerHTML = `
    <div class="topo-foco" style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px"><h2 style="margin: 0; font-family: var(--f-titulo); font-weight: 400; font-size: 28px; color: var(--texto)">${d.tipo}${d.det ? `<small style="font-family: var(--f-texto); font-size: 14px; color: var(--neutro)"> · ${d.det}</small>` : ''}</h2><b style="font-variant-numeric: tabular-nums; white-space: nowrap">${reais(d.valor)}</b></div>
    <div style="display: flex; flex-direction: column; gap: 8px">${pontos(d)}<p class="passo-txt">${d.passo >= 5 ? 'Quitada' : `Passo ${d.passo + 1} de 5 · ${pss.slice(0, d.passo).length ? 'feito: ' + pss[d.passo - 1].toLowerCase() : ''}`}</p></div>
    ${d.passo >= 5 ? '<p class="alerta-fin bom">Quitada. Isso fica para sempre.</p>' : `
    <div class="cartao-fin">
      <h3 class="tit-fin">${prox}</h3>
      <p class="rotulo-fin">Quando?</p>
      <div class="escolhas">${['Hoje', 'Amanhã', 'No fim de semana'].map((q) => `<button type="button" data-quando="${q}" aria-pressed="${planoTmp.quando === q}">${q}</button>`).join('')}</div>
      <p class="rotulo-fin">Onde?</p>
      <div class="escolhas">${onde.map((o) => `<button type="button" data-onde="${o}" aria-pressed="${planoTmp.onde === o}">${o}</button>`).join('')}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px"><button class="botao contorno" type="button" id="guardar-plano" style="text-align: center; white-space: nowrap">Guardar plano</button><button class="botao fin" type="button" id="fiz-passo">Fiz este passo</button></div>
    </div>
    <details class="saber"><summary>${d.familia ? 'Para a conversa' : 'O que falar'}</summary><div class="corpo"><p class="roteiro" id="roteiro">${roteiro}</p><button class="botao contorno" type="button" id="copiar-roteiro" style="text-align: center">Copiar texto</button></div></details>
    ${d.familia ? '<details class="saber"><summary>Por que combinar</summary><div class="corpo"><p>Sem juros, o cuidado é a relação. Combinar um valor por mês, sem pedir que paguem outras dívidas por você.</p></div></details>' : '<details class="saber"><summary>Onde negociar sem custo</summary><div class="corpo"><p><b>consumidor.gov.br</b>: plataforma pública do Ministério da Justiça. <b>Procon</b> e <b>Defensoria</b>: orientação gratuita e conciliação no superendividamento.</p><p class="fonte">Senacon/Ministério da Justiça · Lei 14.181/2021</p></div></details>'}`}
    <p class="rodape-fin">Valor fictício · não é consultoria financeira</p>`;
  escalonar(p);
}
function verificarRios() {
  const antes = { ...s.rios };
  const maxPasso = Math.max(...fin.dividas.map((d) => d.passo));
  if (maxPasso >= 2) s.rios.amazonas = true;          // 1º passo depois de listar
  if (maxPasso >= 3) s.rios.parana = true;            // 1ª renegociação (ou combinado com a família)
  if (Object.values(fin.barreiras).some(Boolean)) s.rios.saoFrancisco = true;
  const novo = ['amazonas', 'saoFrancisco', 'parana'].find((k) => s.rios[k] && !antes[k]);
  sincronizarPainel(); aplicar(); desenharRiosFin();
  if (novo) {
    const txt = { amazonas: ['O Amazonas voltou a correr', 'Você deu o primeiro passo numa dívida.'], saoFrancisco: ['O São Francisco voltou a correr', 'Você ativou sua primeira Barreira.'], parana: ['O Paraná voltou a correr', 'Você renegociou sua primeira dívida.'] }[novo];
    $('#rio-titulo').textContent = txt[0]; $('#rio-sub').textContent = txt[1];
    $('#rio-volta').classList.add('on');
  }
}
const fecharRio = () => $('#rio-volta').classList.remove('on');
$('#rio-fechar').onclick = fecharRio; $('#rio-ok').onclick = fecharRio;
$('#rio-ver').onclick = () => { fecharRio(); regiaoSel = -1; irPara('mapa'); };
app.addEventListener('click', (e) => {
  const t = e.target;
  const aba = t.closest('[data-aba]'); if (aba) { fin.aba = aba.dataset.aba; desenharFin(); return; }
  const bas = t.closest('[data-basico]'); if (bas) { fin.basico[bas.dataset.basico] = !fin.basico[bas.dataset.basico]; desenharFin(); return; }
  const est = t.closest('[data-estrategia]'); if (est) { fin.estrategia = est.dataset.estrategia; desenharFin(); return; }
  const dv = t.closest('[data-divida]'); if (dv) { dividaAberta = dv.dataset.divida; planoTmp = { quando: null, onde: null }; irPara('divida'); return; }
  const bar = t.closest('[data-barreira]'); if (bar) { if (!fin.barreiras[bar.dataset.barreira]) { fin.barreiras[bar.dataset.barreira] = true; emitir('barreira_ativada', { barreira: bar.dataset.barreira }); desenharFin(); verificarRios(); } return; }
  const q = t.closest('[data-quando]'); if (q) { planoTmp.quando = q.dataset.quando; desenharDivida(); return; }
  const o = t.closest('[data-onde]'); if (o) { planoTmp.onde = o.dataset.onde; desenharDivida(); return; }
  if (t.closest('#guardar-plano')) {
    const d = fin.dividas.find((x) => x.id === dividaAberta);
    if (!planoTmp.quando || !planoTmp.onde) { aviso('Escolha quando e onde.'); return; }
    d.plano = `${planoTmp.quando.toLowerCase()}, ${d.familia ? planoTmp.onde.toLowerCase() : planoTmp.onde}`; emitir('plano_divida', { divida: d.id, quando: planoTmp.quando, onde: planoTmp.onde }); aviso('Plano guardado. Ele aparece na lista de dívidas.'); irPara('financas'); return;
  }
  if (t.closest('#fiz-passo')) {
    const d = fin.dividas.find((x) => x.id === dividaAberta);
    d.passo = Math.min(5, d.passo + 1); emitir('passo_divida', { divida: d.id, passo: d.passo }); d.plano = null; planoTmp = { quando: null, onde: null };
    desenharDivida(); verificarRios();
    if (d.passo >= 5) aviso('Dívida quitada. Isso fica para sempre.');
    return;
  }
  if (t.closest('#copiar-roteiro')) {
    const txt = $('#roteiro').textContent;
    try { navigator.clipboard.writeText(txt).then(() => aviso('Texto copiado.'), () => aviso('Selecione o texto para copiar.')); } catch { aviso('Selecione o texto para copiar.'); }
  }
});

// ---------- Boas-vindas ----------
// 1. o problema (as apostas secaram a terra) · 2. o que troca a aposta (o planeta revive em lapso de tempo) · 3. a pessoa começa
let boasPasso = 0, lapso = null;
var perfil = { nome: 'Rafael', motivo: 'Para voltar a dormir em paz' };
const MOTIVOS = ['Para voltar a dormir em paz', 'Pela minha família', 'Para ter dinheiro de novo', 'Para voltar a ser eu'];
const DIA1 = () => estadoDoPlaneta({ dias: 1, mares: 0, rios: {} });
const palavras = (txt, d = 0) => txt.split(' ').map((w, k, a) => `<span class="palavra" style="--k:${k};--d:${d}ms">${w}${k < a.length - 1 ? ' ' : ''}</span>`).join('');
const ICO_H = {
  dias: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 21c-4-3-7-6.5-7-10.5a7 7 0 0 1 14 0C19 14.5 16 18 12 21z"/><path d="M12 8v6M9 11h6"/></svg>',
  mar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/></svg>',
  rio: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h14a2 2 0 0 1 2 2v9H4z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13" r="1.2" fill="currentColor"/></svg>',
};
function pararLapso() { if (lapso) { clearInterval(lapso); lapso = null; } }
function planetaBoas(e) { estadoBoas = e; if (globo) globo.setEstado(e); }
function abrirBoas() { boasPasso = 0; desenharBoas(); }
function passoBoas(n) {
  boasPasso = n; pararLapso();
  $('#boas-slot').style.height = n === 0 ? '400px' : n === 1 ? '250px' : '200px';
  requestAnimationFrame(() => { if (globo && telaAtual === 'boas') moverGlobo('boas', s.mov ? 0 : 900); });
  desenharBoas();
}
function desenharBoas() {
  $$('.pontos-boas i').forEach((i, k) => i.classList.toggle('on', k === boasPasso));
  $('#boas-pular').hidden = boasPasso === 2;
  const c = $('#boas-corpo');
  if (boasPasso === 0) {
    planetaBoas(DIA1());
    c.innerHTML = `
      <h2 class="boas-tit">${palavras('As apostas secaram esta terra.')}</h2>
      <p class="boas-sub">${palavras('O Brasil rachou, os rios sumiram e o mar ficou turvo. É assim que o vício deixa a vida por dentro.', 450)}</p>
      <button class="boas-botao surgir" style="--d: 1500ms" type="button" id="boas-seguir">Continuar <span aria-hidden="true">→</span></button>
      <p class="sr-only">Passo 1 de 3</p>`;
  } else if (boasPasso === 1) {
    c.innerHTML = `
      <div class="contador surgir" aria-hidden="true"><b id="boas-dia">1</b><span id="boas-dia-txt">dia sem apostar</span></div>
      <h2 class="boas-tit" style="font-size: 27px">${palavras('Cada dia sem apostar devolve a vida a ela.')}</h2>
      <ul class="habitos" aria-label="O que coloca algo no lugar da aposta">
        <li class="surgir" style="--d: 500ms" data-h="0"><span class="ico">${ICO_H.dias}</span><b>Ficar longe das apostas</b><small>o Brasil volta a verdejar</small></li>
        <li class="surgir" style="--d: 650ms" data-h="1"><span class="ico">${ICO_H.mar}</span><b>Respirar quando a vontade vem</b><small>o mar fica limpo</small></li>
        <li class="surgir" style="--d: 800ms" data-h="2"><span class="ico">${ICO_H.rio}</span><b>Cuidar do dinheiro</b><small>os rios voltam a correr</small></li>
      </ul>
      <button class="boas-botao surgir" style="--d: 1000ms" type="button" id="boas-seguir">Continuar <span aria-hidden="true">→</span></button>
      <p class="sr-only">Passo 2 de 3. O planeta se recupera em 90 dias: as regiões verdejam, o mar limpa e os rios voltam.</p>`;
    lapsoDeTempo();
  } else {
    planetaBoas(DIA1());   // o planeta volta ao começo: agora é com a pessoa
    c.innerHTML = `
      <h2 class="boas-tit" style="font-size: 27px">${palavras('Você não causou isso sozinho. E pode recuperar.')}</h2>
      <div class="campo-boas surgir" style="--d: 500ms"><label for="boas-nome">Como quer ser chamado?</label><input id="boas-nome" type="text" autocomplete="nickname" maxlength="24" value="${perfil.nome}"></div>
      <div class="campo-boas surgir" style="--d: 620ms"><span class="rot" id="rot-motivo">Seu motivo para recomeçar</span>
        <div class="motivos" role="group" aria-labelledby="rot-motivo">${MOTIVOS.map((m) => `<button type="button" data-motivo="${m}" aria-pressed="${perfil.motivo === m}">${m}</button>`).join('')}</div></div>
      <p class="privado surgir" style="--d: 740ms"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Tudo fica só neste celular.</p>
      <button class="boas-botao surgir" style="--d: 860ms" type="button" id="boas-comecar">Começar a missão</button>
      <p class="sr-only">Passo 3 de 3</p>`;
  }
}
// lapso de tempo: 90 dias em ~5 s; regiões, mar e rios voltam na ordem do app
function lapsoDeTempo() {
  const el = $('#boas-dia'), txt = $('#boas-dia-txt');
  const pintar = (d) => {
    const rios = { saoFrancisco: d >= 25, parana: d >= 50, amazonas: d >= 70 };
    planetaBoas(estadoDoPlaneta({ dias: d, mares: Math.min(10, Math.round(d / 9)), rios }));
    if (el) { el.textContent = d; txt.textContent = d === 1 ? 'dia sem apostar' : 'dias sem apostar'; }
    $$('#boas-corpo .habitos li').forEach((li, k) => li.classList.toggle('vivo', [d >= 7, d >= 27, d >= 25][k]));
  };
  if (s.mov) { pintar(90); return; }
  let d = 1; pintar(1);
  setTimeout(() => {
    if (boasPasso !== 1 || telaAtual !== 'boas') return;
    lapso = setInterval(() => { d = Math.min(90, d + 1 + Math.floor(d / 30)); pintar(d); if (d >= 90) pararLapso(); }, 95);
  }, 900);
}
function comecarMissao() {
  const n = ($('#boas-nome')?.value || '').trim(); perfil.nome = n || 'você';
  emitir('perfil_criado', { nome: perfil.nome, motivo: perfil.motivo });
  Object.assign(s, { dias: 1, mares: 0, rios: { amazonas: false, saoFrancisco: false, parana: false } });
  estadoBoas = null; sincronizarPainel(); irPara('inicio'); aplicar();
}
$('#tela-boas').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('#boas-seguir')) { passoBoas(boasPasso + 1); return; }
  if (t.closest('#boas-pular')) { passoBoas(2); return; }
  const m = t.closest('[data-motivo]'); if (m) { perfil.motivo = m.dataset.motivo; $$('#tela-boas [data-motivo]').forEach((b) => b.setAttribute('aria-pressed', String(b === m))); return; }
  if (t.closest('#boas-comecar')) comecarMissao();
});
$('#abrir-boas').onclick = () => { $('#boas-slot').style.height = '400px'; irPara('boas'); };

// ---------- Trocar a aposta ----------
// Substituição de lazer: o que fazer no lugar da aposta, conforme o tempo que a pessoa tem. Nada custa dinheiro, nada dá prêmio.
const IT = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const TROCAS = [
  [ { t: 'Respirar com a Terra', d: 'Respiração lenta até a onda da vontade baixar.', ico: IT('<path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>'), ir: 'mare', b: 'Respirar' },
    { t: 'Chamar alguém da Órbita', d: '"Estou num momento difícil. Pode me ligar?"', ico: IT('<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19c1-3 3-4.5 5-4.5s4 1.5 5 4.5M11 19c1-3 3-4.5 5-4.5s4 1.5 5 4.5"/>'), ir: 'orbita', b: 'Chamar' },
    { t: 'Celular em outro cômodo', d: 'Feche o que estiver aberto e se afaste por alguns minutos.', ico: IT('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'), b: 'Fiz' } ],
  [ { t: 'Caminhar ou alongar', d: 'Dez minutos de movimento mudam o corpo e a cabeça.', ico: IT('<circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v4M7 12l3-4 4 1 3 3"/>'), b: 'Fazer agora' },
    { t: 'Ligar para alguém', d: 'Uma conversa sobre qualquer outra coisa.', ico: IT('<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'), b: 'Fazer agora' },
    { t: 'Um passo nas finanças', d: 'Ativar uma Barreira ou avançar uma dívida traz um rio de volta.', ico: IT('<path d="M4 7h14a2 2 0 0 1 2 2v9H4z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13" r="1.2" fill="currentColor"/>'), ir: 'financas', b: 'Abrir' } ],
  [ { t: 'Algo das Minhas trocas', d: 'O que você já sabe que funciona para você.', ico: IT('<path d="M12 21c-4-3-7-6.5-7-10.5a7 7 0 0 1 14 0C19 14.5 16 18 12 21z"/>'), alvo: 'minhas', b: 'Ver' },
    { t: 'Encontrar alguém', d: 'Um café, um jogo, uma volta. Perto de gente, a vontade perde força.', ico: IT('<circle cx="9" cy="8" r="3"/><path d="M3 20c1-4 3.5-6 6-6s5 2 6 6M17 11a3 3 0 1 0 0-6"/>'), b: 'Fazer agora' },
    { t: 'Grupo de apoio', d: 'Jogadores Anônimos ou o CAPS da sua cidade, com quem já passou por isso.', ico: IT('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>'), ir: 'ajuda', b: 'Ver onde' } ],
];
let troca = { tempo: 0, fazendo: null, nota: null, minhas: ['Jogar bola com o Pedro', 'Ouvir um podcast', 'Cozinhar algo'] };
function desenharTroca() {
  $('#ind-tempo').style.setProperty('--i', troca.tempo);
  $$('#tela-troca [data-tempo]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.tempo === troca.tempo)));
  const p = $('#painel-troca');
  p.innerHTML = `
    <ul class="trocas">${TROCAS[troca.tempo].map((x, k) => `<li class="${troca.fazendo === x.t ? 'fazendo' : ''}"><span class="ico">${x.ico}</span><b>${x.t}</b><small>${x.d}</small><button type="button" data-troca="${k}">${troca.fazendo === x.t ? 'Fazendo' : x.b}</button></li>`).join('')}</ul>
    <p class="mini-tit" id="minhas-trocas">Minhas trocas</p>
    <div class="minhas">${troca.minhas.map((m) => `<button type="button" data-minha="${m}">${m}</button>`).join('')}
      <form id="nova-troca"><label class="sr-only" for="nova-troca-txt">Nova troca</label><input id="nova-troca-txt" maxlength="40" placeholder="O que funciona para você?"><button class="botao contorno" type="submit" style="text-align: center">Guardar</button></form></div>
    <p class="rodape-fin">Nada aqui custa dinheiro. Se a vontade não passar, a Ajuda está a um toque.</p>`;
  escalonar(p);
  $('#notas-troca').innerHTML = Array.from({ length: 11 }, (_, n) => `<button type="button" data-nota="${n}" aria-pressed="${troca.nota === n}">${n}</button>`).join('');
  $('#passou-ok').disabled = troca.nota == null;
}
function comecarTroca(t) {
  troca.fazendo = t; troca.nota = null; desenharTroca();
  setTimeout(() => { if (telaAtual === 'troca') $('#passou').classList.add('on'); }, s.mov ? 0 : 900);
}
$('#tela-troca').addEventListener('click', (e) => {
  const t = e.target;
  const tp = t.closest('[data-tempo]'); if (tp) { troca.tempo = +tp.dataset.tempo; desenharTroca(); return; }
  const tr = t.closest('[data-troca]');
  if (tr) {
    const x = TROCAS[troca.tempo][+tr.dataset.troca];
    if (x.ir) { irPara(x.ir); return; }
    if (x.alvo) { $('#minhas-trocas').scrollIntoView({ behavior: s.mov ? 'auto' : 'smooth', block: 'start' }); return; }
    comecarTroca(x.t); return;
  }
  const mi = t.closest('[data-minha]'); if (mi) { comecarTroca(mi.dataset.minha); return; }
  const nt = t.closest('[data-nota]'); if (nt) { troca.nota = +nt.dataset.nota; $$('#notas-troca [data-nota]').forEach((b) => b.setAttribute('aria-pressed', String(b === nt))); $('#passou-ok').disabled = false; return; }
  if (t.closest('#passou-depois')) { $('#passou').classList.remove('on'); aviso('Tudo bem. A troca continua aqui quando precisar.'); return; }
  if (t.closest('#passou-ok')) {
    const nota = troca.nota, feita = troca.fazendo; emitir('troca_registrada', { troca: feita, vontade: nota });
    $('#passou').classList.remove('on'); troca.fazendo = null; troca.nota = null;
    if (nota <= 3 && feita && !troca.minhas.includes(feita)) { troca.minhas.unshift(feita); aviso(`Vontade em ${nota}. "${feita}" foi para Minhas trocas.`); }
    else if (nota >= 7) { aviso('A vontade continua forte. Respirar ou chamar alguém pode ajudar agora.'); }
    else aviso(`Anotado: vontade em ${nota}.`);
    desenharTroca(); return;
  }
});
$('#tela-troca').addEventListener('submit', (e) => {
  if (e.target.id !== 'nova-troca') return; e.preventDefault();
  const v = $('#nova-troca-txt').value.trim(); if (!v) return;
  if (!troca.minhas.includes(v)) troca.minhas.unshift(v);
  desenharTroca(); aviso('Guardado em Minhas trocas.');
});

// ---------- painel ----------
function sincronizarPainel() {
  $('#c-dias').value = s.dias; $('#o-dias').textContent = s.dias;
  $('#c-mares').value = s.mares; $('#o-mares').textContent = s.mares;
  $('#r-amazonas').checked = s.rios.amazonas; $('#r-sf').checked = s.rios.saoFrancisco; $('#r-parana').checked = s.rios.parana;
  $('#a-dalt').checked = s.dalt; $('#a-escuro').checked = s.escuro; $('#a-mov').checked = s.mov;
}
function aplicar() {
  app.dataset.tema = s.escuro ? 'escuro' : 'claro';
  app.classList.toggle('reduzido', s.mov);
  corNav(); atualizarTextos();
  if (globo) { globo.setOpcoes({ daltonismo: s.dalt, movimentoReduzido: s.mov, tema: s.escuro ? 'escuro' : 'claro' }); globo.setEstado(estado()); }
}
$('#c-dias').oninput = (e) => { s.dias = +e.target.value; sincronizarPainel(); aplicar(); };
$('#c-mares').oninput = (e) => { s.mares = +e.target.value; sincronizarPainel(); aplicar(); };
$('#mais-dia').onclick = () => { s.dias = Math.min(90, s.dias + 1); sincronizarPainel(); aplicar(); };
$('#prox-regiao').onclick = () => { const i = proxima(); if (i >= 0) { s.dias = LIMIARES[i]; regiaoSel = i; if (telaAtual === 'mapa' && globo) globo.focarRegiao(i); } sincronizarPainel(); aplicar(); };
$('#r-amazonas').onchange = (e) => { s.rios.amazonas = e.target.checked; aplicar(); };
$('#r-sf').onchange = (e) => { s.rios.saoFrancisco = e.target.checked; aplicar(); };
$('#r-parana').onchange = (e) => { s.rios.parana = e.target.checked; aplicar(); };
$('#a-dalt').onchange = (e) => { s.dalt = e.target.checked; aplicar(); };
$('#a-escuro').onchange = (e) => { s.escuro = e.target.checked; aplicar(); };
$('#a-mov').onchange = (e) => { s.mov = e.target.checked; aplicar(); };
$('#resetar').onclick = () => { Object.assign(s, JSON.parse(JSON.stringify(PADRAO))); fin = JSON.parse(JSON.stringify(FIN_PADRAO)); regiaoSel = -1; sincronizarPainel(); aplicar(); irPara('inicio'); };

// ---------- início ----------
sincronizarPainel(); aplicar();
const inicial = (location.hash || '#boas').slice(1);   // o app abre pela história
irPara(telas.includes(inicial) ? inicial : 'inicio', { sem: true });
addEventListener('hashchange', () => irPara(location.hash.slice(1)));

try {
  globo = await criarGlobo($('#camada'), {
    assets: ASSETS, estado: estado(), movimentoReduzido: s.mov,
    periodoVolta: 25, aoVoltaSatelite: (i) => mostrarRecado(i),
    aoTocarRegiao: (k) => {
      if (k < 0) return;
      if (telaAtual === 'inicio') { regiaoSel = k; irPara('mapa'); }
      else if (telaAtual === 'mapa') selecionarRegiao(k);
    },
  });
  globo.setSatelites(ORBITA);
  aplicar();
  moverGlobo(telaAtual, 0);
  desenharOrbita();
  if (telaAtual === 'mapa') globo.focarRegiao(regiaoSel);
  if (telaAtual === 'mare') { globo.irPara({ opacidade: 0 }, 0); }
  app.classList.add('pronto');
  setTimeout(() => { try { garantirOceano(); } catch (e) { console.error(e); } }, 1200);
  addEventListener('resize', () => moverGlobo(telaAtual, 0));
} catch (err) {
  console.error(err);
  aviso('Não foi possível desenhar o planeta em 3D neste aparelho.');
}
}
