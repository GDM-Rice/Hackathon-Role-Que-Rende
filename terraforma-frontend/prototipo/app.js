// Motor do protótipo Terraforma (portado do HTML único para módulo ES).
// iniciar() roda no navegador, depois que MARCACAO já está no DOM.
// opcoes.assets            pasta pública das texturas e do som (padrão /terra/)
// opcoes.aoEvento(tipo, d) chamado nas ações que o backend deve guardar (ver docs/API.md)
// opcoes.backend           cliente do back NestJS (lib/backend.ts): conta, senha e conversas. Sem ele, só o modo sem conta
// Leia AGENTS.md antes de editar. Mapa das seções: docs/BACKLOG.md e AGENTS.md.
import { criarGlobo, estadoDoPlaneta, REGIOES, LIMIARES, RIOS } from './globo.js';
import { criarOceano, criarSomDoMar, ceuDaHora, corDaNevoa } from './oceano.js';
import { carregarTexturas, montarCena, limparCenas, definirAtivo, retomar, destaque, aquecerChao, BIOMAS, NOMES } from './trilha-paisagem.js';

let iniciado = false;
export async function iniciar(opcoes = {}) {
  if (iniciado) return; iniciado = true;   // o React em modo estrito monta duas vezes no desenvolvimento
  const ASSETS = opcoes.assets ?? '/terra/';
  const B = opcoes.backend ?? null;
  const __evento = (tipo, dados) => { try { opcoes.aoEvento?.(tipo, { ...dados, em: new Date().toISOString() }); } catch (e) { console.error(e); } };
  const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
// de onde a pessoa chegou na Órbita: o botão voltar leva de volta para lá (antes era sempre "Perfil")
const VOLTA_ORBITA = { perfil: 'Perfil', troca: 'Hábitos saudáveis', inicio: 'Início', mapa: 'Mapa-Mundi', financas: 'Finanças', divida: 'Dívida', luneta: 'Luneta', ajuda: 'Ajuda' };
let origemOrbita = 'perfil';
const telas = ['ajustes', 'login', 'boas', 'troca', 'trilha', 'atividade', 'fio', 'conversa', 'inicio', 'mapa', 'mare', 'tempestade', 'ajuda', 'luneta', 'financas', 'perfil', 'orbita', 'recado', 'divida'];
const mq = (q) => { try { return matchMedia(q).matches; } catch { return false; } };

// ---------- estado (vem de GET /estado quando o backend estiver ligado; ver docs/API.md) ----------
const PADRAO = { dias: 1, mares: 0, rios: { amazonas: false, saoFrancisco: false, parana: false }, dalt: false, escuro: mq('(prefers-color-scheme: dark)'), mov: mq('(prefers-reduced-motion: reduce)') };
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
// a aba Mapa-Mundi abre a trilha; a trilha, a atividade e o planeta de perto acendem a mesma aba
const navDe = (t) => ({ trilha: 'mapa', atividade: 'mapa', divida: 'financas', fio: 'luneta', conversa: 'luneta', perfil: 'inicio', ajustes: 'inicio', orbita: 'inicio', recado: 'inicio' }[t] || t);
const DESTINO_NAV = { mapa: 'trilha' };
const GLOBO_ICONE = `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="terra-menu-ID"><circle cx="12" cy="12" r="10"/></clipPath></defs>
<g class="linha" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M4.5 7.5h15M4.5 16.5h15"/></g>
<g class="cor"><circle cx="12" cy="12" r="10" fill="#85B7EB"/><g clip-path="url(#terra-menu-ID)" fill="#3B6D11"><path d="M1.6 7.4c1.4-2 3.6-3.4 6.1-3.6 1.1-.1 1.4 1 .7 1.6-.6.5-.5 1.5.3 1.8.9.3 1.5 1.3 1 2.1-.5.8-1.6.7-2.3 1.2-.9.6-.8 1.9-1.7 2.4-1 .5-2.1-.1-2.8-.9-.7-.8-1.1-1.9-1.3-3-.1-.6-.2-1.1 0-1.6z"/><path d="M7.3 12.9c1.1-.4 2.4-.1 3.3.6.9.7 2.1.9 2.5 2 .4 1.1-.3 2.2-1.1 3-.8.9-1.1 2.1-1.8 3.1-.5.7-1.4 1.2-1.8.4-.4-.8.1-1.6 0-2.5-.1-1.1-1-1.7-1.4-2.7-.4-1-.6-2.3.3-3.9z"/><path d="M15.1 5.6c1-.7 2.4-.8 3.4-.2.7.4.5 1.3-.2 1.6-.8.3-1.6 0-2.2.5-.6.4-.7 1.3-1.3 1.4-.8.1-1.1-.9-.7-1.6.3-.6.6-1.2 1-1.7z"/><path d="M16.2 10.3c1.4-.6 3.1-.4 4.3.3 1.1.6 1.6 1.9 1.4 3.1-.2 1.3-1.1 2.3-1.5 3.5-.4 1.1-.7 2.3-1.5 3.1-.7.6-1.7.3-1.9-.6-.3-1.3.2-2.6-.3-3.8-.4-.9-1.5-1.2-2-2.2-.5-1.3.2-2.8 1.5-3.4z"/></g><circle cx="12" cy="12" r="10" fill="none" stroke="#185FA5" stroke-width=".8"/></g></svg>`;
$$('[data-nav]').forEach((nav, n) => {
  const item = (id) => { const [nome, c, f, ce, fe, svg] = ICONES[id];
    return `<button type="button" data-ir="${DESTINO_NAV[id] || id}" data-item="${id}" style="--c:${c};--f:${f};--ce:${ce};--fe:${fe}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${svg}</svg>${nome}<span class="ponto"></span></button>`; };
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
  const k = ORDEM_NAV.indexOf(navDe(tela)), ind = nav.querySelector('.indicador'); if (!ind) return;
  if (k < 0) { ind.style.setProperty('--ind-op', 0); return; }
  const b = nav.querySelectorAll('button[data-item]')[k];
  ind.style.setProperty('--ind-op', 1); ind.style.setProperty('--i', k); corDoIndicador(ind, b);
}
// a pílula sai de onde estava na tela anterior e desliza até a aba nova
function deslizarIndicador(tela) {
  const k = ORDEM_NAV.indexOf(navDe(tela)), nav = $(`#tela-${tela} [data-nav]`);
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
const estado = () => ((telaAtual === 'boas' || telaAtual === 'login') && estadoBoas) ? estadoBoas : estadoDoPlaneta({ dias: s.dias, mares: s.mares, rios: s.rios, tempestade });
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
  // dinheiro que deixou de ir para apostas: o que a pessoa contou × dias de recomeço. Nunca mostra quanto perdeu.
  const porDia = typeof perfil === 'undefined' || !perfil.valor ? 0 : perfil.valor / { dia: 1, semana: 7, mes: 30 }[perfil.periodo || 'semana'];
  $('#n-reais-bloco').hidden = !porDia; $('#n-reais-definir').hidden = !!porDia;
  $('#n-reais').textContent = 'R$ ' + Math.round(s.dias * porDia).toLocaleString('pt-BR');
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
  const prox = [['Amazonas', 'a Barreira do Pix menor à noite', s.rios.amazonas], ['São Francisco', 'a Barreira do bloqueador de sites', s.rios.saoFrancisco], ['Paraná', 'a Barreira de combinar com alguém', s.rios.parana]].find((r) => !r[2]);
  $('#nota-rio').textContent = prox ? `Próximo rio: o ${prox[0]} volta quando você ativar ${prox[1]}, em Finanças.` : 'Os três rios estão correndo.';
}
function setBarra(el, pct) { el.setAttribute('aria-valuenow', pct); el.firstElementChild.style.width = pct + '%'; }

// ---------- navegação com continuidade ----------
// enquanto o 3D carrega, o planeta desfocado (.slot::before) ocupa exatamente o lugar e o tamanho do planeta que vai entrar
function medirMarcador(sec) { $$('[data-slot]', sec).forEach((sl) => { const r = sl.getBoundingClientRect(); const d = sl.dataset.zoom ? r.width * 2.04 : sl.dataset.orbita ? 128 : Math.min(r.width, r.height) - 16; if (d > 0) sl.style.setProperty('--d', d + 'px'); }); }
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
function irPara(tela, { sem = false, jaSaiu = false, desceu = false, manterGlobo = false } = {}) {
  if (!telas.includes(tela)) tela = 'inicio';
  if (tela === 'atividade' && !abertaAt) tela = 'trilha';
  if (tela === 'divida' && !fin.dividas.some((d) => d.id === dividaAberta)) tela = 'financas';
  if ($('#info').classList.contains('aberta')) abrirInfo(false);   // a folha "Por que o planeta começa seco" fecha ao trocar de tela
  if ((tela === 'fio' && !fioAberto) || (tela === 'conversa' && !convAberta)) tela = 'luneta';   // link ou recarga em #atividade sem atividade aberta: volta para a trilha
  if (tela === telaAtual || mergulhando || descendo) return;
  // entrar na trilha vindo de outra parte do app: a câmera desce até a região do capítulo atual
  if (tela === 'trilha' && !desceu && !sem && globo && !s.mov && telaAtual && !['atividade', 'mapa', 'mare'].includes(telaAtual)) { descerNaTerra(); return; }
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
    if (globo && tela !== 'mare' && !manterGlobo) moverGlobo(tela, reduzido ? 0 : 850);
    if (!app.classList.contains('pronto')) medirMarcador(depois);
  }, reduzido || !antes ? 0 : 120);
  if (telaAtual === 'mare' && pararMare) pararMare();
  if (telaAtual === 'tempestade' && tempestade) { tempestade = false; aplicar(); } // as nuvens passam
  if (tela === 'orbita' && telaAtual !== 'recado') {
    origemOrbita = VOLTA_ORBITA[telaAtual] ? telaAtual : (telaAtual === 'tempestade' || telaAtual === 'mare' ? 'inicio' : 'perfil');
    const vb = $('#tela-orbita .voltar'); if (vb) { vb.dataset.ir = origemOrbita; vb.lastChild.textContent = VOLTA_ORBITA[origemOrbita]; }
  }
  telaAtual = tela; app.dataset.tela = tela;
  $$('[data-nav] button[data-item]').forEach((b) => b.setAttribute('aria-current', b.dataset.item === navDe(tela) ? 'page' : 'false'));
  if (tela === 'tempestade') { tempestade = true; aplicar(); __evento('tempestade', {}); }
  if (tela === 'mare') entrarNoMar(reduzido);
  if (tela === 'orbita') desenharOrbita();
  app.classList.toggle('no-boas', tela === 'boas' || tela === 'login');
  if (tela === 'login') planetaBoas(DIA1());
  if (tela === 'boas') abrirBoas(); else pararLapso();
  if (tela === 'login') desenharLogin();
  if (tela === 'perfil') desenharPerfil();
  if (tela === 'ajustes') desenharAjustes();
  atualizarLegendaSom(tela);
  if (tela === 'financas') desenharFin();
  if (tela === 'trilha') desenharTrilha(); else retomar();
  if (tela === 'luneta') desenharLuneta();
  if (tela !== 'luneta') { $('#folha-escrever').hidden = true; $('#folha-planeta').hidden = true; $('#folha-acoes').hidden = true; }
  if (tela !== 'financas') $('#folha-divida').hidden = true;
  $('#confirma-tempestade').hidden = true;
  if (tela !== 'orbita') { $('#folha-orbita').hidden = true; $('#folha-preciso').hidden = true; }
  if (tela === 'troca') desenharTroca(); else $('#passou')?.classList.remove('on');
  if (tela === 'divida') desenharDivida();
  if (tela === 'mare' || tela === 'tempestade' || tela === 'ajuda') fecharRecado();
  if (tela !== 'financas' && tela !== 'divida') $('#rio-volta').classList.remove('on');
  if (tela !== 'mapa' && globo) globo.focarRegiao(-1);
  if (tela === 'mapa' && globo) globo.focarRegiao(regiaoSel);
  if (tela === 'mapa' && regiaoSel >= 0) setTimeout(() => $(`[data-regiao="${regiaoSel}"]`)?.scrollIntoView({ block: 'nearest' }), 400);
  try { if (location.hash !== '#' + tela) history.replaceState(null, '', '#' + tela); } catch {}
}
let descendo = false;
function descerNaTerra(regiao) {
  descendo = true;
  const prox = proximaAt(), k = regiao ?? (prox ? prox[0] : 4), antiga = $(`#tela-${telaAtual}`), base = app.getBoundingClientRect();
  antiga.style.transition = 'opacity 280ms ease'; antiga.style.opacity = '0'; antiga.style.pointerEvents = 'none';
  globo.mostrarSatelites(false); globo.nuvens(0.35); globo.focarRegiao(k);
  globo.irPara({ cx: base.width / 2, cy: base.height * 0.46, r: 4500, opacidade: 1 }, 1500, 'queda');
  posicionarSombra(lugarDo(telaAtual), false);
  setTimeout(() => {
    // a trilha entra por cima do planeta ainda ampliado (antes o planeta sumia num quadro e a tela piscava);
    // depois o planeta grande se apaga e o pequeno aparece no cabeçalho
    descendo = false; irPara('trilha', { sem: true, desceu: true, manterGlobo: true });
    antiga.style.opacity = ''; antiga.style.pointerEvents = ''; antiga.style.transition = '';
    const t = $('#tela-trilha'); t.classList.remove('chegou'); void t.offsetWidth; t.classList.add('chegou');
    setTimeout(() => {
      if (telaAtual !== 'trilha' || descendo) return;
      globo.irPara({ opacidade: 0 }, 300);
      setTimeout(() => { if (telaAtual !== 'trilha' || descendo) return; globo.irPara({ ...lugarDo('trilha'), opacidade: 0 }, 0); moverGlobo('trilha', 450); }, 320);
    }, 540);
    if (regiao != null) setTimeout(() => irAoCapitulo(regiao, false), 200);
  }, 1450);
}
function moverGlobo(tela, ms) {
  const lugar = lugarDo(tela);
  globo.nuvens(tela === 'mapa' ? 0.2 : 1);
  globo.mostrarSatelites(tela === 'orbita');
  if (tela === 'mapa') { if (regiaoSel < 0) globo.focar({ lon: -53, lat: -15 }); }
  else globo.focar(globo.centroBrasil, tela === 'inicio' || tela === 'boas' || tela === 'login');
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
  botaoSom(); atualizarLegendaSom();
};
$('#mare-voltar').onclick = () => irPara('inicio');
$('#fim-voltar').onclick = () => { if (sessao) __evento('sessao_respiracao', { tecnica: sessao.t.nome, segundos: Math.round(sessao.decorrido), antes: sessao.antes, depois: +$('#vontade-depois').value }); irPara('inicio'); };
$('#fim-mais').onclick = () => etapa('escolha');
$('#comecar').onclick = () => comecarSessao();
$('#encerrar').onclick = () => { pararMare?.(); terminarSessao(false); };

const ceuEscolhido = () => ceuDaHora();

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
    const dica = `${rot[1]} · ${rot[4]}`; if ($('#dica').textContent !== dica) $('#dica').textContent = dica;   // só mexe no texto quando muda (evita layout a cada quadro)
    bolha.style.transform = `scale(${0.42 + 0.58 * v})`; // cheio = encosta no anel
    oceano?.setFolego(v);
    const resta = Math.max(0, Math.ceil(sessao.total - e));
    const relogio = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`, noTempo = $('#tempo').firstChild;
    if (noTempo.textContent !== relogio) noTempo.textContent = relogio;
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
  if (feita) { s.mares = Math.min(10, s.mares + 1); aplicar(); }
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
app.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#info').classList.contains('aberta')) abrirInfo(false); if (e.key === 'Escape' && !$('#menu-regioes').hidden) { abrirListaRegioes(false); $('#chip-regiao').focus(); } });

let avisoT;
// "Apostei hoje" pede confirmação: um toque sem querer não registra a tempestade
function confirmarTempestade(abrir) { const c = $('#confirma-tempestade'); c.hidden = !abrir; if (abrir) $('#ct-sim').focus({ preventScroll: true }); else $('#apostei-hoje')?.focus({ preventScroll: true }); }
$('#apostei-hoje').onclick = () => confirmarTempestade(true);
$('#ct-nao').onclick = () => confirmarTempestade(false);
$('#ct-sim').onclick = () => { $('#confirma-tempestade').hidden = true; irPara('tempestade'); };
$('#confirma-tempestade').addEventListener('click', (e) => { if (e.target.id === 'confirma-tempestade') confirmarTempestade(false); });
app.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#confirma-tempestade').hidden) confirmarTempestade(false); });
// os cartões de recado e de rio ficam fora da árvore de acessibilidade quando fechados (CSS: visibility);
// o leitor de tela recebe o texto por esta região viva, que existe sempre
function anunciar(txt) { const a = $('#anuncio'); if (!a) return; a.textContent = ''; setTimeout(() => { a.textContent = txt; }, 80); }
function aviso(txt) { const a = $('#aviso'); a.textContent = txt; a.classList.toggle('no-topo', !!document.querySelector('.folha-lun:not([hidden]), .sair-sheet:not([hidden])')); a.classList.add('on'); clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('on'), 2600); }

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
// Pessoas de confiança escolhidas por quem usa o app (até 3). Ficam só neste celular, inclusive o telefone.
// Os recados são escritos pela própria pessoa (tela Escrever); o app nunca inventa um.
const CORES_ORB = [['#5DCAA5', '#0F6E56', '#E1F5EE'], ['#AFA9EC', '#3C3489', '#EEEDFE'], ['#F0B86E', '#8A4B0F', '#FCF0DF']];
const ORBITA = [
];
try { const v = JSON.parse(localStorage.getItem('terraforma:orbita')); if (Array.isArray(v)) ORBITA.splice(0, ORBITA.length, ...v); } catch {}
const MSG_PRECISO = 'Estou num momento difícil. Pode me ligar?';
function corOrbita() { ORBITA.forEach((p, i) => { [p.cor, p.borda, p.fundo] = CORES_ORB[i % CORES_ORB.length]; }); }
function guardarOrbita() {
  corOrbita();
  try { localStorage.setItem('terraforma:orbita', JSON.stringify(ORBITA.map(({ cor, borda, fundo, ...p }) => p))); } catch {}
  globo?.setSatelites(ORBITA);
  const nomes = ORBITA.map((p) => p.nome);
  $('#perfil-orbita-sub').textContent = nomes.length ? `${nomes.length > 1 ? nomes.slice(0, -1).join(', ') + ' e ' + nomes.at(-1) : nomes[0]} · Preciso de você · recados` : 'Escolha pessoas de confiança';
}
corOrbita();
const telLimpo = (t) => (t || '').replace(/[^\d+]/g, '');
let escrevendo = 0, recadoT = null, tirandoOrb = null;
function desenharOrbita() {
  const vazia = !ORBITA.length;
  $('#lista-orbita').innerHTML = (vazia ? '<li class="vazia-orb"><span class="quem"><b>Ninguém na sua órbita ainda</b><small>Escolha até 3 pessoas de confiança. Cada uma vira um satélite que traz os recados dela.</small></span></li>' : '') + ORBITA.map((p, i) => {
    const t = globo?.proximaVolta(i), m = t == null ? '' : t >= 60 ? `${Math.ceil(t / 60)} min` : `${Math.ceil(t)} s`;
    const tirar = tirandoOrb === i;
    return `<li><span class="ini" style="background:${p.fundo};border-color:${p.borda};color:${p.borda}">${esc(p.nome[0].toUpperCase())}</span><span class="quem"><b>${esc(p.nome)}${p.relacao ? ' · ' + esc(p.relacao) : ''}</b><small>${p.recados.length ? `${p.recados.length} recado${p.recados.length === 1 ? '' : 's'}${m ? ` · próxima volta em ${m}` : ''}` : 'Ainda sem recado: toque em Escrever e passe o celular'}</small></span><button class="acao-lin" type="button" data-escrever="${i}">Escrever</button><button class="acao-lin tirar-orb" type="button" data-tirar-orb="${i}" aria-label="${tirar ? 'Confirmar: tirar ' : 'Tirar '}${esc(p.nome)} da órbita">${tirar ? 'Tirar?' : '×'}</button></li>`;
  }).join('') + (ORBITA.length < 3 ? '<li style="border-style: dashed; justify-content: center"><button class="acao-lin" type="button" id="add-orbita">+ Colocar alguém na órbita</button></li>' : '');
  $('#preciso').disabled = false;
}
setInterval(() => { if (telaAtual === 'orbita' && $('#folha-orbita').hidden) desenharOrbita(); }, 1000);
function abrirNovaPessoa() {
  ['#orb-nome', '#orb-rel', '#orb-tel'].forEach((s) => { $(s).value = ''; });
  $('#salvar-orbita').disabled = true; $('#folha-orbita').hidden = false; setTimeout(() => $('#orb-nome').focus(), 60);
}
function abrirPreciso() {
  if (!ORBITA.length) { irPara('orbita'); abrirNovaPessoa(); aviso('Primeiro, coloque alguém de confiança na sua órbita.'); return; }
  $('#lista-preciso').innerHTML = ORBITA.map((p) => {
    const tel = telLimpo(p.tel);
    const ini = `<span class="ini" style="background:${p.fundo};border-color:${p.borda};color:${p.borda}">${esc(p.nome[0].toUpperCase())}</span><span class="quem"><b>${esc(p.nome)}</b><small>${tel ? esc(p.tel) : 'sem telefone salvo'}</small></span>`;
    return `<li>${ini}${tel ? `<a class="acao-lin" href="sms:${tel}?body=${encodeURIComponent(MSG_PRECISO)}" data-chamou>Mensagem</a><a class="acao-lin" href="tel:${tel}" data-chamou>Ligar</a>` : `<button class="acao-lin" type="button" data-por-tel="${ORBITA.indexOf(p)}">Pôr telefone</button>`}</li>`;
  }).join('');
  if (telaAtual !== 'orbita') irPara('orbita');
  $('#folha-preciso').hidden = false;
}
$('#orb-nome').addEventListener('input', () => { $('#salvar-orbita').disabled = $('#orb-nome').value.trim().length < 2; });
$('#tela-orbita').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-fechar-folha]') || t.classList.contains('folha-lun')) { t.closest('.folha-lun').hidden = true; return; }
  if (t.closest('#add-orbita')) { abrirNovaPessoa(); return; }
  if (t.closest('#preciso')) { abrirPreciso(); return; }
  if (t.closest('[data-chamou]')) { emitir?.('preciso_de_voce', {}); $('#folha-preciso').hidden = true; return; }
  const pt = t.closest('[data-por-tel]'); if (pt) {
    const p = ORBITA[+pt.dataset.porTel]; $('#folha-preciso').hidden = true; abrirNovaPessoa();
    $('#orb-nome').value = p.nome; $('#orb-rel').value = p.relacao; $('#salvar-orbita').disabled = false; $('#salvar-orbita').dataset.editar = pt.dataset.porTel;
    setTimeout(() => $('#orb-tel').focus(), 80); return;
  }
  const tr = t.closest('[data-tirar-orb]'); if (tr) {
    const i = +tr.dataset.tirarOrb;
    if (tirandoOrb === i) { const [p] = ORBITA.splice(i, 1); tirandoOrb = null; guardarOrbita(); desenharOrbita(); aviso(`${p.nome} saiu da sua órbita.`); emitir?.('orbita_pessoa_removida', {}); }
    else { tirandoOrb = i; desenharOrbita(); setTimeout(() => { if (tirandoOrb === i) { tirandoOrb = null; desenharOrbita(); } }, 4000); }
    return;
  }
  if (t.closest('#salvar-orbita')) {
    const nome = $('#orb-nome').value.trim(), rel = $('#orb-rel').value.trim(), tel = $('#orb-tel').value.trim();
    if (nome.length < 2) return;
    if (tel && telLimpo(tel).replace('+', '').length < 10) { aviso('Confira o telefone, com DDD.'); $('#orb-tel').focus(); return; }
    const ed = $('#salvar-orbita').dataset.editar; delete $('#salvar-orbita').dataset.editar;
    if (ed != null) Object.assign(ORBITA[+ed], { nome, relacao: rel, tel });
    else { ORBITA.push({ nome, relacao: rel, tel, recados: [], prox: 0 }); emitir?.('orbita_pessoa_adicionada', { comTelefone: !!tel }); }
    guardarOrbita(); $('#folha-orbita').hidden = true; desenharOrbita();
    aviso(ed != null ? 'Salvo.' : `${nome} entrou na sua órbita. Peça para ${nome} deixar um recado em Escrever.`);
  }
});
$('#avisar-orbita').onclick = abrirPreciso;
$('#tela-orbita').addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; const f = $$('#tela-orbita .folha-lun').find((x) => !x.hidden); if (f) { f.hidden = true; ($('#add-orbita') || $('#preciso'))?.focus(); } });
app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-escrever]'); if (!b) return;
  escrevendo = +b.dataset.escrever;
  $('#recado-titulo').textContent = `${ORBITA[escrevendo].nome}, deixe um recado para ${perfil.nome}`;
  $('#recado-texto').value = '';
  irPara('recado');
});
$('#ideias').onclick = (e) => { const c = e.target.closest('.chip-ideia'); if (c) { const t = $('#recado-texto'); t.value = (t.value ? t.value + ' ' : '') + c.textContent; t.focus(); } };
$('#salvar-recado').onclick = () => {
  const txt = $('#recado-texto').value.trim();
  if (!txt) { aviso('Escreva um recado antes de salvar.'); return; }
  const d = new Date(); ORBITA[escrevendo].recados.push({ txt, quando: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` });
  ORBITA[escrevendo].prox = ORBITA[escrevendo].recados.length - 1;   // o novo recado é o próximo a aparecer
  guardarOrbita();
  aviso('Recado salvo. Ele chega na próxima volta do satélite.');
  irPara('orbita');
};
let recadoDe = null;
function mostrarRecado(i) {
  const p = ORBITA[i];
  if (!$('#recados-on').checked || !p || !p.recados.length) return;
  if (!['inicio', 'mapa', 'orbita', 'perfil'].includes(telaAtual) || mergulhando) return;   // nunca na respiração, tempestade ou Ajuda
  const r = p.recados[p.prox % p.recados.length]; p.prox++; recadoDe = p;
  const ini = $('#recado-ini'); ini.textContent = p.nome[0].toUpperCase(); ini.style.background = p.fundo; ini.style.borderColor = p.borda; ini.style.color = p.borda;
  $('#recado-quem').textContent = `${p.nome} passou pela sua órbita`;
  $('#recado-quando').textContent = `Recado escrito em ${r.quando}`;
  $('#recado-txt').textContent = `“${r.txt}”`;
  $('#recado-responder').textContent = `Responder para ${p.nome}`;
  $('#recado').classList.add('on'); anunciar(`${p.nome} passou pela sua órbita: ${r.txt}`);
  clearTimeout(recadoT); recadoT = setTimeout(fecharRecado, 15000);
}
function fecharRecado() { $('#recado').classList.remove('on'); clearTimeout(recadoT); }
$('#recado-fechar').onclick = fecharRecado;
$('#recado-ok').onclick = fecharRecado;
$('#recado-responder').addEventListener('click', () => {
  const tel = telLimpo(recadoDe?.tel);
  if (tel) location.href = `sms:${tel}`;
  else aviso(`Salve o telefone de ${recadoDe?.nome || 'quem escreveu'} na Órbita para responder daqui.`);
  setTimeout(fecharRecado, 50);
});

// ---------- Finanças ----------
// Regras: nada de dinheiro real nem conexão com banco (edital 8.4/8.5); valores fictícios só na demo;
// o rio volta pelo PASSO dado, nunca pelo valor pago; nunca mostrar "quanto perdeu".
const PASSOS = ['Anotei', 'Pedi uma proposta', 'Fechei um acordo', 'Paguei a 1ª parcela', 'Quitei'];
const PASSOS_FAMILIA = ['Anotei', 'Conversei com calma', 'Combinamos um valor por mês', 'Paguei a 1ª parte', 'Quitei'];
const FAZER = ['Anotar a dívida', 'Pedir uma proposta', 'Fechar um acordo', 'Pagar a 1ª parcela', 'Pagar até o fim'];
const FAZER_FAMILIA = ['Anotar', 'Conversar com calma', 'Combinar um valor por mês', 'Pagar a 1ª parte', 'Pagar até o fim'];
const JUROS = { 'muito alto': 3, alto: 2, 'sem juros': 0 };
const FIN_PADRAO = {
  aba: 'dividas', estrategia: 'cara',
  basico: { Moradia: false, Comida: false, 'Luz e água': false, Transporte: false, Remédios: false },
  dividas: [],
  barreiras: { pix: false, bloqueador: false, combinado: false },
};
let fin = JSON.parse(JSON.stringify(FIN_PADRAO)), dividaAberta = null, planoTmp = { quando: null, onde: null };
const reais = (v) => v ? 'R$ ' + v.toLocaleString('pt-BR') : '';
const passosDe = (d) => (d.familia ? PASSOS_FAMILIA : PASSOS);
const fazerDe = (d) => (d.familia ? FAZER_FAMILIA : FAZER);
function ordemDividas() {
  const abertas = fin.dividas.filter((d) => d.passo < 5), quitadas = fin.dividas.filter((d) => d.passo >= 5);
  abertas.sort(fin.estrategia === 'cara' ? (a, b) => (JUROS[b.juros] - JUROS[a.juros]) || (b.valor - a.valor) : (a, b) => a.valor - b.valor);
  return [...abertas, ...quitadas];
}
const FAIXA_RIOS = document.getElementById('rios-faixa');
function desenharRiosFin() {
  const nomes = { amazonas: 'Amazonas', saoFrancisco: 'São Francisco', parana: 'Paraná' };
  const dica = { amazonas: 'Pix menor à noite', saoFrancisco: 'Bloqueador de sites', parana: 'Combinar com alguém' };
  Object.keys(nomes).forEach((k) => {
    const on = !!s.rios[k];
    FAIXA_RIOS.querySelector(`[data-rio="${k}"]`).classList.toggle('on', on);
    const r = FAIXA_RIOS.querySelector(`[data-rot="${k}"]`); r.classList.toggle('on', on);
    r.querySelector('small').textContent = on ? 'correndo' : dica[k];
  });
  const n = Object.values(s.rios).filter(Boolean).length;
  FAIXA_RIOS.setAttribute('aria-label', `Rios do planeta: ${n} de 3 correndo. ` + Object.keys(nomes).map((k) => `${nomes[k]} ${s.rios[k] ? 'correndo' : 'seco, volta com ' + dica[k]}`).join('; '));
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
  const p = $('#painel-fin'); p.setAttribute('aria-labelledby', 'aba-' + fin.aba); FAIXA_RIOS.remove();
  const rodape = '<p class="rodape-fin">Não é consultoria financeira · orientação grátis no Procon ou na Defensoria</p>';
  if (fin.aba === 'basico') {
    const falta = Object.entries(fin.basico).filter(([, v]) => !v).map(([k]) => k.toLowerCase());
    p.innerHTML = `
      <h3 class="tit-fin">Antes das dívidas: o básico do mês está garantido?</h3>
      <p class="dica-fin" style="margin-top: -6px">Toque no que já está pago ou garantido.</p>
      <div class="basicos">${Object.entries(fin.basico).map(([k, v]) => `<button type="button" data-basico="${k}" aria-pressed="${v}">${k}</button>`).join('')}</div>
      ${falta.length ? `<p class="alerta-fin">Garanta primeiro: ${falta.join(', ')}. As dívidas podem esperar o básico. Se faltar, o CRAS da sua cidade orienta.</p>` : '<p class="alerta-fin bom">O básico está garantido. Agora dá para olhar as dívidas com calma.</p>'}
      <details class="saber"><summary>A lei protege o seu mínimo</summary><div class="corpo"><p>Pela Lei do Superendividamento, dá para renegociar todas as dívidas juntas no Procon ou na Justiça, preservando R$ 600 por mês para viver. O STF manteve esse valor em abril de 2026.</p><p class="fonte">Lei 14.181/2021 · Decreto 11.150/2022 · STF, ADPFs 1.005, 1.006 e 1.097</p></div></details>
      <details class="saber"><summary>Não lembra de todas as dívidas?</summary><div class="corpo"><p>O Registrato, do Banco Central, mostra de graça as dívidas no seu CPF. Precisa de conta gov.br prata ou ouro.</p></div></details>
      ${rodape}`;
  } else if (fin.aba === 'dividas') {
    const ordem = ordemDividas(), foco = ordem.find((d) => d.passo < 5), resto = ordem.filter((d) => d !== foco);
    const est = fin.estrategia === 'cara';
    const nAbertas = fin.dividas.filter((d) => d.passo < 5).length;
    p.innerHTML = `
      <div class="minhas-div"><h3>Minhas dívidas<small>${fin.dividas.length ? `${nAbertas} para pagar${fin.dividas.length > nAbertas ? ` · ${fin.dividas.length - nAbertas} quitada${fin.dividas.length - nAbertas > 1 ? 's' : ''}` : ''} · só você vê` : 'Nenhuma anotada ainda'}</small></h3><button type="button" class="btn-add" id="add-divida"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Adicionar</button></div>
      ${fin.dividas.length > 1 ? `<div class="estrat"><span class="rotulo-fin" id="rot-estrat">Qual pagar primeiro?</span><div class="seg mini" role="group" aria-labelledby="rot-estrat" style="--n: 2"><span class="ind" aria-hidden="true" style="--i: ${est ? 0 : 1}"></span><button type="button" data-estrategia="cara" aria-pressed="${est}">A de juros mais altos</button><button type="button" data-estrategia="menor" aria-pressed="${!est}">A menor</button></div></div>
      <p class="dica-fin">${est ? 'Juros altos fazem a dívida crescer rápido. Pagar essa primeiro sai mais barato no total.' : 'Quitar uma pequena logo dá ânimo para seguir com as outras.'}</p>` : ''}
      ${foco ? `<article class="foco" aria-label="Pagar agora: ${foco.tipo}">
        <span class="etq">Pagar agora</span>
        <div class="topo-foco"><h3>${foco.tipo}</h3><span class="val">${reais(foco.valor)}</span></div>
        ${pontos(foco)}
        <p class="passo-txt">Passo ${foco.passo + 1} de 5${foco.plano ? ` · combinado: ${foco.plano}` : ''}</p>
        <button class="botao fin" type="button" data-divida="${foco.id}">${fazerDe(foco)[foco.passo]} <span aria-hidden="true">→</span></button>
      </article>` : fin.dividas.length ? '<p class="alerta-fin bom">Todas quitadas. Isso fica para sempre.</p>' : '<p class="alerta-fin">Anote as dívidas que você lembra. Não precisa saber o valor exato agora.</p>'}
      ${resto.length ? `<p class="mini-tit">Pagar depois</p><p class="dica-fin" style="margin: -4px 2px 0">Uma de cada vez. Quando a de cima acabar, a próxima sobe sozinha.</p><ul class="lista-curta">${resto.map((d) => `<li><button type="button" data-divida="${d.id}"><span>${d.tipo}</span>${d.passo >= 5 ? '<span class="ok">✓ quitada</span>' : `${d.valor ? `<span class="val">${reais(d.valor)}</span>` : '<span class="sem-val">sem valor</span>'}`}<span class="mini" aria-hidden="true">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < d.passo ? 'feito' : ''}"></i>`).join('')}</span></button></li>`).join('')}</ul>` : ''}
      <p class="faq-tit">Dúvidas frequentes</p>
      <div class="faq">
        <details class="saber"><summary>Para que serve esta lista?</summary><div class="corpo"><p>É o seu controle pessoal: anote o que deve, escolha uma dívida por vez e marque cada passo. Só você vê. O app não acessa banco, CPF nem conta.</p></div></details>
        <details class="saber"><summary>Por que uma de cada vez?</summary><div class="corpo"><p>Focar numa dívida e ver o progresso dela ajuda a seguir pagando. Muitas ao mesmo tempo costumam travar.</p><p class="fonte">Kettle et al., 2016, JCR · Gal e McShane, 2012, JMR</p></div></details>
        <details class="saber"><summary>Juros mais altos ou a menor: qual pagar primeiro?</summary><div class="corpo"><p><b>A de juros mais altos</b>: você paga menos no total, porque ela é a que mais cresce. <b>A menor</b>: quitar uma logo dá ânimo. As duas valem; escolha a que você consegue manter.</p></div></details>
        <details class="saber"><summary>Não sei o valor exato</summary><div class="corpo"><p>Pode anotar sem valor. O Registrato, do Banco Central, mostra de graça as dívidas no seu CPF (precisa de conta gov.br prata ou ouro).</p></div></details>
        <details class="saber"><summary>Vale pegar um empréstimo para pagar?</summary><div class="corpo"><p>Antes de trocar uma dívida por outra, peça o Custo Efetivo Total (CET). Ele soma juros, tarifas, impostos e seguros, e o banco é obrigado a informar antes de você fechar, com o cálculo detalhado. Compare o CET, não só os juros. O Procon orienta de graça, e a Defensoria Pública também, se você não puder pagar advogado.</p><p class="fonte">Resolução CMN 4.881/2020, art. 7º</p></div></details>
        <details class="saber"><summary>E se não sobra nem para o básico?</summary><div class="corpo"><p>A Lei do Superendividamento permite renegociar tudo junto no Procon ou na Justiça, preservando o mínimo para viver. O CRAS da sua cidade também orienta.</p><p class="fonte">Lei 14.181/2021 · Decreto 11.150/2022</p></div></details>
        <details class="saber"><summary>Apostei para tentar pagar uma dívida</summary><div class="corpo"><p>Acontece com muita gente, e não apaga o que você já fez. Aposta não recupera dívida: costuma aumentar. Conte no "Apostei hoje", sem medo, e se estiver pesado, a Ajuda está no menu.</p></div></details>
      </div>
      <p class="rodape-fin">Cada passo fica marcado e nada regride · não é consultoria financeira</p>`;
  } else {
    const b = fin.barreiras;
    const RIO_DE = { pix: 'Amazonas', bloqueador: 'São Francisco', combinado: 'Paraná' };
    const item = (id, tit, corpo, ok) => `<details class="saber ${ok ? 'ativa' : ''}"><summary><span class="lado"><span class="ico">${ICO[id]}</span><span>${tit}${RIO_DE[id] ? `<small class="traz-rio">${ok ? 'o ' + RIO_DE[id] + ' está correndo' : 'traz o ' + RIO_DE[id]}</small>` : ''}</span></span><span class="est">${ok ? '✓ ativa' : ''}</span></summary><div class="corpo">${corpo}${ok ? '' : `<button class="botao fin" type="button" data-barreira="${id}">${id === 'combinado' ? 'Combinei' : 'Fiz isso'}</button>`}</div></details>`;
    const rioDe = { pix: 'Amazonas', bloqueador: 'São Francisco', combinado: 'Paraná' };
    p.innerHTML = `
      <div class="intro-rios"><h3 class="tit-fin">Barreiras trazem os rios de volta</h3><p class="dica-fin">Cada barreira que você ativa protege o seu dinheiro e faz um rio voltar a correr no seu planeta.</p><div id="lugar-rios"></div></div>
      ${item('pix', 'Pix menor à noite', '<p>Baixar o limite vale na hora; aumentar leva 24 horas. A espera protege de madrugada.</p><ol><li>No app do banco, abra o Pix.</li><li>Entre em "Meus limites".</li><li>Baixe o valor do período noturno.</li></ol><p class="fonte">Banco Central: noite das 20h às 6h, limite padrão de R$ 1.000.</p>', b.pix)}
      ${item('bloqueador', 'Bloqueador de sites', '<p>Sites ilegais continuam no ar. Um bloqueador no celular fecha a porta antes da vontade. Dá para fazer de graça, com o que já vem no celular:</p><ol><li><b>iPhone:</b> Ajustes › Tempo de Uso › Conteúdo e Privacidade › Conteúdo da Web. Escolha “Limitar sites adultos” e adicione os sites em “Nunca permitir”.</li><li><b>Android:</b> o Family Link, do Google, bloqueia sites no Chrome. Uma pessoa da sua Órbita pode ficar com a senha.</li></ol><p class="fonte">Recursos gratuitos da Apple (Tempo de Uso) e do Google (Family Link).</p>', b.bloqueador)}
      ${item('combinado', 'Combinar com alguém da Órbita', '<p>Por exemplo: "Se eu quiser aumentar o limite do Pix, te aviso antes." O app não toca no seu dinheiro.</p>', b.combinado)}
      <details class="saber conferir"><summary><span class="lado"><span class="ico">${ICO.auto}</span>Autoexclusão</span><span class="est">se voltarem</span></summary><div class="corpo"><p>As apostas estão proibidas pela MP 1.394/2026, e o STF discute a medida. Se voltarem a ser permitidas, bloquear o próprio CPF pelo gov.br é uma barreira forte.</p><p class="fonte">MP 1.394/2026, Planalto</p></div></details>
      ${rodape}`;
  }
  if (fin.aba === 'barreiras') $('#lugar-rios').append(FAIXA_RIOS);
  escalonar(p);
}
const TIPOS_DIV = [['Cartão de crédito', 'muito alto'], ['Cheque especial', 'muito alto'], ['Empréstimo', 'alto'], ['Crediário', 'alto'], ['Conta atrasada', 'alto'], ['Pessoa próxima', 'sem juros']];
let novaDiv = { tipo: null };
var emitir = (tipo, dados) => __evento(tipo, dados);
function abrirNovaDivida() {
  novaDiv = { tipo: null }; $('#div-quem').value = ''; $('#div-valor').value = ''; $('#campo-quem').hidden = true;
  $('#tipos-div').innerHTML = TIPOS_DIV.map(([n]) => `<button type="button" role="radio" data-tipo-div="${n}" aria-checked="false">${n}</button>`).join('');
  $('#folha-divida').hidden = false; validarNovaDiv(); setTimeout(() => $('#tipos-div button')?.focus(), 60);
}
function validarNovaDiv() {
  const falta = !novaDiv.tipo ? 'Escolha o tipo da dívida para anotar.' : (novaDiv.tipo === 'Pessoa próxima' && $('#div-quem').value.trim().length < 2) ? 'Escreva com quem é a dívida (o primeiro nome basta).' : '';
  $('#salvar-divida').disabled = !!falta; $('#dica-salvar-div').textContent = falta;
}
$('#div-quem').addEventListener('input', validarNovaDiv);
$('#div-valor').addEventListener('input', (e) => { const n = e.target.value.replace(/\D/g, ''); e.target.value = n ? (+n).toLocaleString('pt-BR') : ''; });
$('#folha-divida').addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#folha-divida').hidden = true; $('#add-divida')?.focus(); } });
const ONDE = { padrao: ['consumidor.gov.br', 'Procon', 'Canal do credor', 'Defensoria'], familia: ['Pessoalmente', 'Por mensagem', 'Por ligação'] };
function desenharDivida() {
  const d = fin.dividas.find((x) => x.id === dividaAberta); if (!d) return;
  const pss = passosDe(d), prox = fazerDe(d)[d.passo] || '', onde = d.familia ? ONDE.familia : ONDE.padrao;
  const roteiro = d.familia
    ? `“${d.tipo}, quero te devolver o que você me emprestou. Consigo R$ __ por mês sem faltar o básico. Pode ser assim?”`
    : '“Quero negociar esta dívida. Consigo pagar R$ __ por mês sem faltar o básico. Quais condições vocês oferecem? Pode mandar por escrito?”';
  const p = $('#painel-divida');
  p.innerHTML = `
    <div class="topo-foco" style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px"><h2 style="margin: 0; font-family: var(--f-titulo); font-weight: 400; font-size: 28px; color: var(--texto)">${d.tipo}${d.det ? `<small style="font-family: var(--f-texto); font-size: 14px; color: var(--neutro)"> · ${d.det}</small>` : ''}</h2><b style="font-variant-numeric: tabular-nums; white-space: nowrap">${reais(d.valor) || '<span style="font-weight: 400; color: var(--neutro); font-size: 14px">sem valor</span>'}</b></div>
    <div style="display: flex; flex-direction: column; gap: 8px">${pontos(d)}<p class="passo-txt">${d.passo >= 5 ? 'Quitada' : `Passo ${d.passo + 1} de 5${d.passo ? ' · já feito: ' + pss[d.passo - 1].toLowerCase() : ''}`}</p></div>
    ${d.passo >= 5 ? '<p class="alerta-fin bom">Quitada. Isso fica para sempre.</p>' : `
    <div class="cartao-fin">
      <p class="rotulo-fin" style="margin: 0">Próximo passo</p>
      <h3 class="tit-fin" style="margin-top: -6px">${prox}</h3>
      <p class="rotulo-fin">Quando você vai fazer?</p>
      <div class="escolhas">${['Hoje', 'Amanhã', 'No fim de semana'].map((q) => `<button type="button" data-quando="${q}" aria-pressed="${planoTmp.quando === q}">${q}</button>`).join('')}</div>
      <p class="rotulo-fin">${d.familia ? 'Como?' : 'Por onde?'}</p>
      <div class="escolhas">${onde.map((o) => `<button type="button" data-onde="${o}" aria-pressed="${planoTmp.onde === o}">${o}</button>`).join('')}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px"><button class="botao contorno" type="button" id="guardar-plano" style="text-align: center; white-space: nowrap">Salvar para depois</button><button class="botao fin" type="button" id="fiz-passo">Já fiz ✓</button></div>
    </div>
    <details class="saber"><summary>${d.familia ? 'Como puxar a conversa' : 'O que dizer (texto pronto)'}</summary><div class="corpo"><p class="roteiro" id="roteiro">${roteiro}</p><button class="botao contorno" type="button" id="copiar-roteiro" style="text-align: center">Copiar texto</button></div></details>
    ${d.familia ? '<details class="saber"><summary>Por que combinar</summary><div class="corpo"><p>Sem juros, o cuidado é a relação. Combinar um valor por mês, sem pedir que paguem outras dívidas por você.</p></div></details>' : '<details class="saber"><summary>Onde negociar sem custo</summary><div class="corpo"><p><b>consumidor.gov.br</b>: plataforma pública do Ministério da Justiça. <b>Procon</b> e <b>Defensoria</b>: orientação gratuita e conciliação no superendividamento.</p><p class="fonte">Senacon/Ministério da Justiça · Lei 14.181/2021</p></div></details>'}`}
    <button type="button" class="remover-div" id="remover-divida">Tirar da lista</button>
    <p class="rodape-fin">Valor fictício · não é consultoria financeira</p>`;
  escalonar(p);
}
function verificarRios() {
  const antes = { ...s.rios };
  // cada barreira ativada traz um rio; nada regride
  if (fin.barreiras.pix) s.rios.amazonas = true;
  if (fin.barreiras.bloqueador) s.rios.saoFrancisco = true;
  if (fin.barreiras.combinado) s.rios.parana = true;
  const novo = ['amazonas', 'saoFrancisco', 'parana'].find((k) => s.rios[k] && !antes[k]);
  aplicar(); desenharRiosFin();
  if (novo) {
    const txt = { amazonas: ['O Amazonas voltou a correr', 'Você baixou o Pix da noite.'], saoFrancisco: ['O São Francisco voltou a correr', 'Você ativou um bloqueador de sites.'], parana: ['O Paraná voltou a correr', 'Você combinou com alguém da sua Órbita.'] }[novo];
    $('#rio-titulo').textContent = txt[0]; $('#rio-sub').textContent = txt[1];
    $('#rio-volta').classList.add('on'); anunciar(`${txt[0]}. ${txt[1]}`);
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
  const bar = t.closest('[data-barreira]'); if (bar) { if (!fin.barreiras[bar.dataset.barreira]) { fin.barreiras[bar.dataset.barreira] = true; __evento('barreira_ativada', { barreira: bar.dataset.barreira }); desenharFin(); verificarRios(); } return; }
  const q = t.closest('[data-quando]'); if (q) { planoTmp.quando = q.dataset.quando; desenharDivida(); return; }
  const o = t.closest('[data-onde]'); if (o) { planoTmp.onde = o.dataset.onde; desenharDivida(); return; }
  if (t.closest('#guardar-plano')) {
    const d = fin.dividas.find((x) => x.id === dividaAberta);
    if (!planoTmp.quando || !planoTmp.onde) { aviso('Escolha quando e por onde.'); return; }
    d.plano = `${planoTmp.quando.toLowerCase()}, ${d.familia ? planoTmp.onde.toLowerCase() : planoTmp.onde}`; __evento('plano_divida', { divida: d.id, quando: planoTmp.quando, onde: planoTmp.onde }); aviso('Salvo. O combinado aparece no cartão da dívida.'); irPara('financas'); return;
  }
  if (t.closest('#fiz-passo')) {
    const d = fin.dividas.find((x) => x.id === dividaAberta);
    d.passo = Math.min(5, d.passo + 1); __evento('passo_divida', { divida: d.id, passo: d.passo }); d.plano = null; planoTmp = { quando: null, onde: null };
    desenharDivida(); verificarRios();
    if (d.passo >= 5) aviso('Dívida quitada. Isso fica para sempre.');
    return;
  }
  if (t.closest('#add-divida')) { abrirNovaDivida(); return; }
  if (t.closest('#fechar-divida') || t === $('#folha-divida')) { $('#folha-divida').hidden = true; $('#add-divida')?.focus(); return; }
  const tp = t.closest('[data-tipo-div]'); if (tp) { novaDiv.tipo = tp.dataset.tipoDiv; $$('#tipos-div [data-tipo-div]').forEach((b) => b.setAttribute('aria-checked', String(b === tp))); $('#campo-quem').hidden = novaDiv.tipo !== 'Pessoa próxima'; validarNovaDiv(); return; }
  if (t.closest('#salvar-divida')) {
    const tipo = TIPOS_DIV.find(([n]) => n === novaDiv.tipo), quem = $('#div-quem').value.trim(), valor = parseInt($('#div-valor').value.replace(/\D/g, ''), 10) || 0;
    const familia = tipo[0] === 'Pessoa próxima';
    fin.dividas.push({ id: 'd' + Date.now(), tipo: familia ? quem : tipo[0], det: familia ? 'pessoa próxima' : undefined, valor, juros: tipo[1], passo: 1, plano: null, familia });
    $('#folha-divida').hidden = true; desenharFin(); aviso('Dívida anotada. Listar já é o primeiro passo.');
    emitir?.('divida_adicionada', { tipo: familia ? 'pessoa' : tipo[0], comValor: !!valor });
    return;
  }
  if (t.closest('#remover-divida')) {
    const b = $('#remover-divida');
    if (!b.classList.contains('confirmar')) { b.classList.add('confirmar'); b.textContent = 'Toque de novo para tirar da lista'; return; }
    fin.dividas = fin.dividas.filter((x) => x.id !== dividaAberta); irPara('financas'); aviso('Dívida tirada da lista. Os rios que voltaram continuam correndo.');
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
var perfil = { nome: '', motivo: 'Para voltar a dormir em paz', valor: 0, periodo: 'semana' };
// boas-vindas já feitas neste aparelho: { feito, dono (id da conta ou null), perfil: { nome, motivo, valor, periodo } }.
// Com conta, o back também guarda (boasVindasEm), então outro aparelho pula o tutorial.
let boasVindas = null;
try { const v = JSON.parse(localStorage.getItem('terraforma:boas-vindas')); if (v && v.feito) { boasVindas = v; Object.assign(perfil, v.perfil || {}); } } catch {}
function guardarBoasVindas() {
  if (!boasVindas) return;
  const { nome, motivo, valor, periodo } = perfil;
  boasVindas.perfil = { nome, motivo, valor, periodo };
  try { localStorage.setItem('terraforma:boas-vindas', JSON.stringify(boasVindas)); } catch {}
}
// o tutorial aparece só na primeira vez: depois do login (ou de "Continuar sem conta") vai direto ao Início
function tutorialFeito() {
  if (conta?.boasVindas) return true;
  if (!boasVindas) return false;
  return !conta || !boasVindas.dono || boasVindas.dono === conta.id;   // outra conta neste aparelho ainda não fez
}
function entrarNoApp() {
  if (!tutorialFeito()) { irPara('boas'); return; }
  // feito sem conta e agora entrou numa conta: a conta passa a ter as boas-vindas feitas
  if (conta && !conta.boasVindas) { conta.boasVindas = true; B?.concluirBoasVindas().catch(() => {}); }
  if (conta && boasVindas) { boasVindas.dono = conta.id; guardarBoasVindas(); }
  irPara('inicio'); aplicar();
}
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
// conta = { id, username, email } quando há sessão no back; null = modo sem conta (tudo fica no aparelho)
let conta = null, modoLogin = 'entrar', tokenRedefinir = null, enviandoLogin = false;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, USUARIO_OK = /^[a-z0-9._-]{3,30}$/;
const contaDe = (u) => ({ id: u.id, username: u.username, email: u.email, boasVindas: !!u.boasVindasEm });
function desenharLogin() {
  const redef = modoLogin === 'redefinir';
  $$('#tela-login [data-login]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.login === modoLogin)));
  $('#abas-login').hidden = redef; $('#campo-email').hidden = redef; $('#login-priv').parentElement.hidden = redef; $('#ou-login').hidden = redef; $('#sem-conta').hidden = redef;
  $('#campo-usuario').hidden = modoLogin !== 'criar';
  $('#login-tit').textContent = redef ? 'Crie uma senha nova.' : 'Um lugar para recomeçar.';
  $('#rot-senha').textContent = redef ? 'Senha nova' : 'Senha';
  $('#login-ok').textContent = redef ? 'Salvar senha nova' : modoLogin === 'entrar' ? 'Entrar' : 'Criar conta';
  $('#login-senha').autocomplete = modoLogin === 'entrar' ? 'current-password' : 'new-password';
  $('#esqueci').hidden = modoLogin !== 'entrar'; $('#erro-login').textContent = '';
}
function semBackend() { $('#erro-login').textContent = 'A conta não está disponível nesta versão. Você pode continuar sem conta.'; }
$('#tela-login').addEventListener('click', async (e) => {
  const t = e.target;
  const md = t.closest('[data-login]'); if (md) { modoLogin = md.dataset.login; desenharLogin(); return; }
  const v = t.closest('#ver-senha'); if (v) { const on = v.getAttribute('aria-pressed') !== 'true'; v.setAttribute('aria-pressed', String(on)); v.setAttribute('aria-label', on ? 'Esconder senha' : 'Mostrar senha'); $('#login-senha').type = on ? 'text' : 'password'; return; }
  if (t.closest('#esqueci')) {
    const em = $('#login-email').value.trim();
    if (!EMAIL_OK.test(em)) { $('#erro-login').textContent = 'Digite seu e-mail acima para receber o link.'; $('#login-email').focus(); return; }
    if (!B) { semBackend(); return; }
    try { await B.esqueciSenha(em); emitir?.('senha_esquecida', {}); aviso('Se esse e-mail tiver conta, chega um link para criar uma senha nova.'); }
    catch (err) { $('#erro-login').textContent = err.message; }
    return;
  }
  if (t.closest('#sem-conta')) { conta = null; emitir?.('entrada', { comConta: false }); entrarNoApp(); }
});
$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault(); if (enviandoLogin) return;
  const em = $('#login-email').value.trim(), se = $('#login-senha').value, us = $('#login-usuario').value.trim().toLowerCase();
  const redef = modoLogin === 'redefinir', criar = modoLogin === 'criar';
  const erro = !redef && !EMAIL_OK.test(em) ? 'Confira o e-mail.'
    : criar && !USUARIO_OK.test(us) ? 'O nome de usuário precisa ter de 3 a 30 letras minúsculas, números, ponto, hífen ou sublinhado.'
    : se.length < 8 ? 'A senha precisa ter pelo menos 8 caracteres.' : '';
  $('#erro-login').textContent = erro;
  if (erro) { (erro.includes('e-mail') ? $('#login-email') : erro.includes('usuário') ? $('#login-usuario') : $('#login-senha')).focus(); return; }
  if (!B) { semBackend(); return; }
  const bt = $('#login-ok'), rotulo = bt.textContent;
  enviandoLogin = true; bt.disabled = true; bt.textContent = 'Um instante…';
  try {
    if (redef) {
      await B.redefinirSenha(tokenRedefinir, se);
      tokenRedefinir = null; try { history.replaceState(null, '', '/#login'); } catch {}
      modoLogin = 'entrar'; desenharLogin(); $('#login-senha').value = '';
      aviso('Senha nova salva. Agora é só entrar.'); $('#login-email').focus(); return;
    }
    const u = criar ? await B.criarConta(us, em, se) : await B.entrar(em, se);
    conta = contaDe(u); $('#login-senha').value = ''; trilhaDaConta();
    emitir?.(criar ? 'conta_criada' : 'login', {});
    aviso(criar ? 'Conta criada.' : 'Que bom te ver.'); entrarNoApp();
  } catch (err) {
    $('#erro-login').textContent = err.status === 401 ? 'E-mail ou senha não conferem.' : err.message;
  } finally { enviandoLogin = false; bt.disabled = false; if (bt.textContent === 'Um instante…') bt.textContent = rotulo; }
});
function abrirBoas() { boasPasso = 0; desenharBoas(); }
function passoBoas(n) {
  boasPasso = n; pararLapso();
  $('#boas-slot').style.height = n === 0 ? '400px' : n === 1 ? '250px' : '96px';
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
        <div class="motivos" role="group" aria-labelledby="rot-motivo">${MOTIVOS.map((m) => `<button type="button" data-motivo="${m}" aria-pressed="${perfil.motivo === m}">${m}</button>`).join('')}<button type="button" class="outro" id="motivo-outro-bt" aria-pressed="${!MOTIVOS.includes(perfil.motivo)}" aria-expanded="${!MOTIVOS.includes(perfil.motivo)}">+ Outro motivo</button></div>
        <div class="motivo-outro" id="motivo-outro" ${MOTIVOS.includes(perfil.motivo) ? 'hidden' : ''}><label class="sr-only" for="motivo-txt">Seu motivo, com suas palavras</label><input id="motivo-txt" type="text" maxlength="60" placeholder="Ex.: pagar a faculdade" aria-describedby="erro-motivo" value="${MOTIVOS.includes(perfil.motivo) ? '' : perfil.motivo}"></div><p class="erro-login erro-motivo" id="erro-motivo" role="alert"></p></div>
      <div class="campo-boas surgir" style="--d: 680ms"><label for="boas-valor">Quanto você apostava? <small style="font-weight: 400">opcional</small></label>
        <div class="valor-periodo"><span class="pref-boas"><b aria-hidden="true">R$</b><input id="boas-valor" inputmode="numeric" maxlength="7" autocomplete="off" placeholder="pode pular"></span>
        <div class="seg-login periodo" role="radiogroup" aria-label="Por período">${[['dia', 'por dia'], ['semana', 'por semana'], ['mes', 'por mês']].map(([k, n]) => `<button type="button" role="radio" data-periodo="${k}" aria-checked="${(perfil.periodo || 'semana') === k}">${n}</button>`).join('')}</div></div>
        <small class="dica-boas">Só para mostrar o dinheiro que fica com você. Pode ser aproximado.</small></div>
      <p class="privado surgir" style="--d: 740ms"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>${conta ? 'Seu motivo fica na sua conta. Ninguém mais vê.' : 'Tudo fica só neste celular.'}</p>
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
  const v = parseInt(($('#boas-valor')?.value || '').replace(/\D/g, ''), 10); perfil.valor = v > 0 ? v : 0;
  if ($('#motivo-outro-bt')?.getAttribute('aria-pressed') === 'true') { const mt = $('#motivo-txt').value.trim(); if (mt.length < 3) { const tx = $('#motivo-txt'); $('#erro-motivo').textContent = 'Escreva seu motivo (3 letras ou mais) ou escolha um da lista.'; tx.setAttribute('aria-invalid', 'true'); tx.scrollIntoView({ block: 'center', behavior: s.mov ? 'auto' : 'smooth' }); tx.focus({ preventScroll: true }); return; } perfil.motivo = mt; }
  __evento('perfil_criado', { nome: perfil.nome, motivo: perfil.motivo, valor: perfil.valor || null, periodo: perfil.periodo });
  Object.assign(s, { dias: 1, mares: 0, rios: { amazonas: false, saoFrancisco: false, parana: false } });
  boasVindas = { feito: true, dono: conta?.id ?? null }; guardarBoasVindas();
  if (conta && !conta.boasVindas) { conta.boasVindas = true; B?.concluirBoasVindas().catch(() => {}); }   // sem rede: o aparelho já lembra
  estadoBoas = null; irPara('inicio'); aplicar();
}
const SOBRE = [
  ['tempo', 'Há quanto tempo aposta', ['Menos de 1 ano', '1 a 3 anos', 'Mais de 3 anos', 'Prefiro não dizer']],
  ['tipo', 'Em que mais apostava', ['Esportes', 'Cassino online', 'Loterias e outros', 'Prefiro não dizer']],
  ['familia', 'Alguém da família passou por isso', ['Sim', 'Não', 'Prefiro não dizer']],
  ['atendimento', 'Já buscou atendimento', ['Sim', 'Ainda não', 'Quero buscar']],
];
perfil.sobre ||= {};
// ---------- Ajustes e acessibilidade ----------
s.tema ??= 'auto'; s.texto ??= 0; s.anim ??= 'auto'; s.legendas ??= false;
const OPC_AJ = { tema: [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Seguir o celular']], texto: [[0, 'A'], [1, 'A'], [2, 'A']], anim: [['auto', 'Seguir o celular'], ['reduzidas', 'Reduzidas'], ['normais', 'Normais']] };
function aplicarAjustes() {
  if (s.tema !== 'manual') { if (s.tema === 'auto') s.escuro = mq('(prefers-color-scheme: dark)'); else s.escuro = s.tema === 'escuro'; }
  if (s.anim === 'auto') s.mov = mq('(prefers-reduced-motion: reduce)'); else s.mov = s.anim === 'reduzidas';
  app.classList.toggle('contraste', !!s.contraste); app.classList.toggle('espaco', !!s.espaco);
  app.classList.toggle('texto-1', s.texto === 1); app.classList.toggle('texto-2', s.texto === 2);
  aplicar();
}
function desenharAjustes() {
  $$('#tela-ajustes [data-grupo]').forEach((g) => { const k = g.dataset.grupo;
    g.innerHTML = OPC_AJ[k].map(([v, n], i) => `<button type="button" role="radio" data-aj="${k}" data-v="${v}" aria-checked="${String(s[k]) === String(v)}"${k === 'texto' ? ` style="font-size: ${[13, 16, 20][i]}px" aria-label="${['Texto normal', 'Texto maior', 'Texto bem maior'][i]}"` : ''}>${n}</button>`).join(''); });
  $('#aj-contraste').checked = !!s.contraste; $('#aj-dalt').checked = !!s.dalt; $('#aj-espaco').checked = !!s.espaco;
  $('#aj-som').checked = somLigado; $('#aj-legendas').checked = !!s.legendas;
}
$('#tela-ajustes').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-aj]'); if (b) { const k = b.dataset.aj; s[k] = k === 'texto' ? +b.dataset.v : b.dataset.v; aplicarAjustes(); desenharAjustes(); return; }
  if (e.target.closest('#aj-fontes')) { abrirInfo(true); return; }
  const ap = e.target.closest('#aj-apagar'); if (ap) {
    if (!ap.classList.contains('confirmar')) { ap.classList.add('confirmar'); ap.textContent = conta ? 'Toque de novo para apagar tudo, inclusive a conta' : 'Toque de novo para apagar tudo'; return; }
    if (ap.disabled) return;
    // com conta, apaga primeiro no servidor: se falhar, nada some do aparelho e a pessoa pode tentar de novo
    if (conta && B) {
      ap.disabled = true;
      try { await B.apagarConta(); }
      catch (err) { aviso('Não deu para apagar sua conta agora. ' + err.message); return; }
      finally { ap.disabled = false; }
    }
    try { localStorage.removeItem('terraforma:token'); } catch {}
    conversasApi = null; convApi = null;
    try { ['terraforma:trilha-aulas', 'terraforma:boas-vindas', 'terraforma:luneta', 'terraforma:orbita', 'terraforma:som', 'terraforma:video'].forEach((k) => localStorage.removeItem(k)); } catch {}
    ORBITA.splice(0); guardarOrbita(); troca.minhas = []; Object.assign(perfil, { nome: '', valor: 0 }); boasVindas = null; emitir?.('dados_apagados', {});
    trilha = { feitas: {} }; lun = { aba: 'mural', filtro: 'tudo', ident: {}, denun: {}, meus: [], resp: {}, msgs: {}, planeta: lun.planeta, regiao: lun.regiao, mostrarDias: true, bloq: {} };
    fin = JSON.parse(JSON.stringify(FIN_PADRAO)); Object.assign(s, { dias: 1, mares: 0, rios: { amazonas: false, saoFrancisco: false, parana: false } });
    perfil.sobre = {}; perfil.pesquisa = false; const tinhaConta = !!conta; conta = null; aplicar(); aviso(tinhaConta ? 'Sua conta e seus dados foram apagados.' : 'Seus dados foram apagados deste celular.'); irPara('login');
  }
});
$('#tela-ajustes').addEventListener('change', (e) => {
  const id = e.target.id;
  if (id === 'aj-contraste') s.contraste = e.target.checked;
  if (id === 'aj-dalt') s.dalt = e.target.checked;
  if (id === 'aj-espaco') s.espaco = e.target.checked;
  if (id === 'aj-legendas') s.legendas = e.target.checked;
  if (id === 'aj-som') { somLigado = e.target.checked; try { localStorage.setItem('terraforma:som', somLigado ? 'ligado' : 'desligado'); } catch {} botaoSom(); }
  aplicarAjustes();
});
function atualizarLegendaSom(tela = telaAtual) { const l = $('#legenda-som'); if (l) l.hidden = !(tela === 'mare' && somLigado && s.legendas); }
function desenharPerfil() {
  $('#perfil-nome').textContent = perfil.nome; $('#perfil-motivo').textContent = `"${perfil.motivo}."`;
  $('#perfil-bola').style.background = lun.planeta.cor; $('#perfil-luneta').textContent = 'Na Luneta: ' + euNome();
  $('#edicao-perfil').hidden = true; $('#perfil-motivo').hidden = false;
  $('#sobre-onde').textContent = conta ? 'Fica só na sua conta.' : 'Fica só neste celular.';
  $('#conta-perfil').textContent = conta ? `Sair da conta (@${conta.username})` : 'Entrar ou criar conta';
  $('#sobre').innerHTML = SOBRE.map(([k, q, ops]) => { const r = perfil.sobre[k];
    return `<details><summary><span>${q}</span><span class="resp${r ? ' dada' : ''}">${r || 'Responder'}</span></summary><div class="ops" role="radiogroup" aria-label="${q}">${ops.map((o) => `<button type="button" role="radio" data-sobre="${k}" data-op="${o}" aria-pressed="${r === o}" aria-checked="${r === o}">${o}</button>`).join('')}</div></details>`; }).join('');
  $('#pesquisa-on').checked = !!perfil.pesquisa;
  $('#perfil-valor').value = perfil.valor ? perfil.valor.toLocaleString('pt-BR') : '';
  $('#perfil-periodo').innerHTML = [['dia', 'por dia'], ['semana', 'por semana'], ['mes', 'por mês']].map(([k, n]) => `<button type="button" role="radio" data-periodo-p="${k}" aria-checked="${(perfil.periodo || 'semana') === k}">${n}</button>`).join('');
}
$('#tela-perfil').addEventListener('click', (e) => {
  const sb = e.target.closest('[data-sobre]'); if (sb) { perfil.sobre[sb.dataset.sobre] = sb.dataset.op; const aberto = sb.closest('details'); desenharPerfil(); if (sb.dataset.op === 'Quero buscar') { aviso('A Ajuda mostra como falar com um psicólogo pelo SUS.'); setTimeout(() => irPara('ajuda'), 700); } return; }
  if (e.target.closest('#editar-perfil')) { $('#edicao-perfil').hidden = false; $('#perfil-motivo').hidden = true; $('#ed-nome').value = perfil.nome; $('#ed-motivo').value = perfil.motivo; $('#ed-nome').focus(); return; }
  if (e.target.closest('#cancelar-perfil')) { desenharPerfil(); return; }
  if (e.target.closest('#salvar-perfil')) { const n = $('#ed-nome').value.trim(), m = $('#ed-motivo').value.trim(); if (n) perfil.nome = n; if (m.length >= 3) perfil.motivo = m; guardarBoasVindas(); desenharPerfil(); atualizarTextos(); aviso('Perfil atualizado.'); return; }
  if (e.target.closest('#conta-perfil')) { if (conta) { B?.sair(); conta = null; conversasApi = null; convApi = null; const trilhaNaConta = !trilha.pendente; if (trilhaNaConta) { trilha = { feitas: {} }; guardarTrilha(); } aviso(trilhaNaConta ? 'Você saiu da conta. Sua trilha fica guardada nela; o resto fica neste celular.' : 'Você saiu da conta. Seus dados ficam neste celular.'); desenharPerfil(); } else { modoLogin = 'entrar'; irPara('login'); } return; }
  const pe = e.target.closest('[data-periodo-p]'); if (pe) { $$('#perfil-periodo [data-periodo-p]').forEach((b) => { b.setAttribute('aria-checked', String(b === pe)); }); return; }
  if (e.target.closest('#salvar-valor')) {
    const v = parseInt($('#perfil-valor').value.replace(/\D/g, ''), 10); perfil.valor = v > 0 ? v : 0;
    perfil.periodo = $('#perfil-periodo [aria-checked="true"]')?.dataset.periodoP || 'semana';
    guardarBoasVindas(); aplicar(); desenharPerfil(); aviso(perfil.valor ? 'Salvo. O Início mostra o dinheiro que ficou com você.' : 'Tudo bem. O Início não mostra valor.');
  }
});
$('#pesquisa-on').addEventListener('change', (e) => { perfil.pesquisa = e.target.checked; aviso(e.target.checked ? 'Obrigado. Só números anônimos são enviados.' : 'Você saiu da pesquisa.'); emitir?.('pesquisa', { participa: e.target.checked }); });
const mascaraReais = (e) => { const n = e.target.value.replace(/\D/g, ''); e.target.value = n ? (+n).toLocaleString('pt-BR') : ''; };
$('#perfil-valor').addEventListener('input', mascaraReais);
app.addEventListener('input', (e) => { if (e.target.id === 'boas-valor') mascaraReais(e); if (e.target.id === 'motivo-txt' && $('#erro-motivo')?.textContent) { $('#erro-motivo').textContent = ''; e.target.removeAttribute('aria-invalid'); } });
$('#tela-boas').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('#boas-seguir')) { passoBoas(boasPasso + 1); return; }
  if (t.closest('#boas-pular')) { passoBoas(2); return; }
  const m = t.closest('[data-motivo]'); if (m) { perfil.motivo = m.dataset.motivo; $$('#tela-boas [data-motivo]').forEach((b) => b.setAttribute('aria-pressed', String(b === m))); $('#motivo-outro-bt').setAttribute('aria-pressed', 'false'); $('#motivo-outro-bt').setAttribute('aria-expanded', 'false'); $('#motivo-outro').hidden = true; if ($('#erro-motivo')) $('#erro-motivo').textContent = ''; return; }
  const pe = t.closest('[data-periodo]'); if (pe) { perfil.periodo = pe.dataset.periodo; $$('#tela-boas [data-periodo]').forEach((b) => { b.setAttribute('aria-checked', String(b === pe)); }); return; }
  if (t.closest('#motivo-outro-bt')) {
    $$('#tela-boas [data-motivo]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    $('#motivo-outro-bt').setAttribute('aria-pressed', 'true'); $('#motivo-outro-bt').setAttribute('aria-expanded', 'true');
    $('#motivo-outro').hidden = false; $('#motivo-txt').focus(); return;
  }
  if (t.closest('#boas-comecar')) comecarMissao();
});

// ---------- Trocar a aposta ----------
// Substituição de lazer: o que fazer no lugar da aposta, conforme o tempo que a pessoa tem. Nada custa dinheiro, nada dá prêmio.
const IT = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const TROCAS = [
  [ { t: 'Respirar com a Terra', d: 'Respiração lenta até a onda da vontade baixar.', ico: IT('<path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>'), ir: 'mare', b: 'Respirar' },
    { t: 'Chamar alguém da Órbita', d: '"Estou num momento difícil. Pode me ligar?"', ico: IT('<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19c1-3 3-4.5 5-4.5s4 1.5 5 4.5M11 19c1-3 3-4.5 5-4.5s4 1.5 5 4.5"/>'), ir: 'orbita', b: 'Chamar' },
    { t: 'Celular em outro cômodo', d: 'Feche o que estiver aberto e se afaste por alguns minutos.', ico: IT('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'), b: 'Fiz' } ],
  [ { t: 'Caminhar ou alongar', d: 'Dez minutos de movimento mudam o corpo e a cabeça.', ico: IT('<circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v4M7 12l3-4 4 1 3 3"/>'), b: 'Fazer agora' },
    { t: 'Ligar para alguém', d: 'Uma conversa sobre qualquer outra coisa.', ico: IT('<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'), b: 'Fazer agora' },
    { t: 'Um passo nas finanças', d: 'Cada Barreira ativada em Finanças traz um rio de volta.', ico: IT('<path d="M4 7h14a2 2 0 0 1 2 2v9H4z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13" r="1.2" fill="currentColor"/>'), ir: 'financas', b: 'Abrir' } ],
  [ { t: 'Algo das Minhas trocas', d: 'O que você já sabe que funciona para você.', ico: IT('<path d="M12 21c-4-3-7-6.5-7-10.5a7 7 0 0 1 14 0C19 14.5 16 18 12 21z"/>'), alvo: 'minhas', b: 'Ver' },
    { t: 'Encontrar alguém', d: 'Um café, um jogo, uma volta. Perto de gente, a vontade perde força.', ico: IT('<circle cx="9" cy="8" r="3"/><path d="M3 20c1-4 3.5-6 6-6s5 2 6 6M17 11a3 3 0 1 0 0-6"/>'), b: 'Fazer agora' },
    { t: 'Grupo de apoio', d: 'Jogadores Anônimos ou o CAPS da sua cidade, com quem já passou por isso.', ico: IT('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>'), ir: 'ajuda', b: 'Ver onde' } ],
];
let troca = { tempo: 0, fazendo: null, nota: null, minhas: [] };
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
    const nota = troca.nota, feita = troca.fazendo; __evento('troca_registrada', { troca: feita, vontade: nota });
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

// ---------- Trilha (aulas em vídeo + quiz + Na prática), versão da equipe ----------
const AULAS = [{"id":"modulo_1","n":"Inadimplência financeira","a":[{"id":"modulo_1_aula_1","t":"Aposta não é investimento","v":"sLnR40D1g4Y","i":534,"f":825,"q":[{"p":"Por que uma aposta não é uma fonte confiável para pagar uma dívida?","o":["O resultado é incerto e pode não vir.","Porque o prêmio demora a cair na conta.","Porque só vale para dívidas pequenas.","Porque o banco não aceita esse dinheiro."],"r":0,"e":"Resultados incertos não são uma base segura para cumprir obrigações financeiras."},{"p":"Uma conta vence amanhã. Por que apostar para pagá-la é arriscado?","o":["A conta pode ser cancelada se for paga com prêmio.","A conta continua lá, mesmo se a aposta der errado.","Os juros da conta sobem quando você aposta.","O prêmio só cai depois do vencimento."],"r":1,"e":"A obrigação continua existindo mesmo que a aposta resulte em perda."},{"p":"Qual opção diferencia planejamento financeiro de aposta?","o":["Planejar exige ganhar mais do que você ganha hoje.","Apostar com estratégia vira um tipo de planejamento.","Planejar parte da renda, dos gastos e das contas.","Os dois funcionam se você tiver disciplina."],"r":2,"e":"Planejar é avaliar os recursos e compromissos reais."},{"p":"Conhecer as regras de uma aposta transforma a atividade em investimento seguro?","o":["Verdadeiro","Falso"],"r":1,"e":"Conhecer as regras não elimina a incerteza nem garante retorno."},{"p":"Qual atitude é mais adequada para lidar com uma dívida?","o":["Esperar uma renda extra para pagar tudo de uma vez.","Pagar primeiro quem cobra com mais insistência.","Pegar outro empréstimo sem comparar o custo.","Montar um plano que caiba na renda."],"r":3,"e":"Um plano realista considera o valor devido, a renda e as despesas essenciais."},{"p":"Por que usar dinheiro emprestado para apostar é perigoso?","o":["Você continua devendo, mesmo se perder.","O empréstimo deixa a aposta mais segura.","O banco desconta o prêmio automaticamente.","Os juros só começam se você ganhar."],"r":0,"e":"O empréstimo precisa ser pago, mesmo se a aposta gerar prejuízo."}]},{"id":"modulo_1_aula_2","t":"Os efeitos sociais e a recuperação financeira","v":"sLnR40D1g4Y","i":1325,"f":1570,"q":[{"p":"Por que dívidas ligadas a apostas podem afetar outras pessoas?","o":["Só se a família souber da dívida.","Podem faltar recursos para gastos da casa.","Porque o CPF de todos da casa fica sujo.","Elas só afetam quem apostou."],"r":1,"e":"Quando o orçamento familiar é comprometido, outras pessoas podem ser afetadas."},{"p":"Qual é um primeiro passo para entender a situação financeira?","o":["Cortar todos os gastos de lazer de uma vez.","Pedir um empréstimo para organizar as contas.","Anotar renda, gastos e dívidas.","Negociar a dívida maior antes de tudo."],"r":2,"e":"Conhecer a situação concreta ajuda a decidir como agir."},{"p":"A recuperação financeira pode exigir mudanças no orçamento e apoio?","o":["Verdadeiro","Falso"],"r":0,"e":"Rever gastos, negociar compromissos e buscar apoio podem fazer parte da recuperação."},{"p":"Se a renda não cobre todas as despesas, o que é importante fazer?","o":["Garantir primeiro o essencial: casa, comida, luz.","Pagar primeiro quem cobra com mais pressão.","Dividir a renda igualmente entre todas as contas.","Usar o limite do cartão para cobrir a diferença."],"r":0,"e":"Priorizar necessidades e compreender compromissos ajuda a construir um plano viável."},{"p":"Qual pode ser uma consequência de esconder dívidas da família?","o":["A dívida para de cobrar juros.","A família fica protegida da preocupação.","O problema se resolve antes de alguém notar.","A família demora a perceber e a ajudar."],"r":3,"e":"O segredo pode atrasar a compreensão do problema e a procura de apoio."},{"p":"O que significa considerar o impacto social das apostas?","o":["Olhar só quanto a pessoa perdeu no total.","Ver como afetam relações e gastos da família.","Comparar o quanto cada região aposta.","Saber quanto as empresas de aposta lucram."],"r":1,"e":"As consequências podem atingir o cotidiano e o bem-estar de outras pessoas."}]},{"id":"modulo_1_aula_3","t":"Como organizar as finanças após o endividamento","v":"sLnR40D1g4Y","i":1570,"f":1865,"q":[{"p":"O que é essencial para montar um plano de pagamento?","o":["Saber o prazo que o credor aceita, só isso.","Vontade de quitar tudo no mês seguinte.","Renda, gastos essenciais e dívidas.","Um dinheiro extra que ainda vai entrar."],"r":2,"e":"A capacidade real de pagamento depende da renda e dos compromissos."},{"p":"Por que anotar os gastos ajuda?","o":["Mostra para onde o dinheiro vai.","Faz você gastar menos sem perceber.","Serve de prova para negociar juros.","Evita que o banco cobre tarifas."],"r":0,"e":"O registro revela padrões de consumo e possíveis ajustes."},{"p":"Qual prática pode piorar o endividamento?","o":["Rever o orçamento todo mês.","Pagar primeiro as contas essenciais.","Conversar com o credor antes de atrasar a parcela.","Fazer parcelas sem ver se cabem na renda."],"r":3,"e":"Compromissos incompatíveis com a renda podem ampliar o desequilíbrio."},{"p":"Limite de cartão de crédito é o mesmo que renda disponível?","o":["Verdadeiro","Falso"],"r":1,"e":"O limite é crédito e pode gerar obrigação de pagamento."},{"p":"Se não é possível pagar tudo de uma vez, qual caminho é mais prudente?","o":["Pagar o mínimo do cartão em todas e esperar.","Ver prioridades e montar um plano possível.","Deixar de pagar até juntar o valor inteiro.","Pegar o primeiro empréstimo que aparecer."],"r":1,"e":"Um plano viável considera necessidades, dívidas e capacidade de pagamento."},{"p":"Por que incluir parcelas futuras no orçamento?","o":["Para saber quanto de limite ainda sobra.","Só importam quando chega a fatura.","Porque já são dinheiro comprometido.","Para conseguir parcelar mais coisas."],"r":2,"e":"Parcelas futuras precisam ser consideradas no planejamento."}]}]},{"id":"modulo_2","n":"Ajuda contra apelos publicitários","a":[{"id":"modulo_2_aula_1","t":"A promessa de dinheiro fácil e a facilidade de apostar","v":"EmN2UWGXXb0","i":454,"f":720,"q":[{"p":"Qual recurso publicitário pode tornar uma aposta atraente?","o":["Mostrar as chances reais de perder.","Prometer ganho fácil e mostrar vencedores.","Avisar sobre limites de idade.","Exibir o telefone de ajuda no fim."],"r":1,"e":"Promessas de ganhos podem destacar sucessos e minimizar a percepção de risco."},{"p":"Por que apostar pelo celular pode aumentar o risco?","o":["O celular mostra probabilidades erradas.","Os prêmios pelo app são menores.","Dá para repetir sem pausa para pensar.","O app cobra taxa a cada aposta."],"r":2,"e":"O acesso rápido pode facilitar a repetição impulsiva."},{"p":"Uma propaganda pode ser atraente e, mesmo assim, a aposta continuar incerta?","o":["Verdadeiro","Falso"],"r":0,"e":"A propaganda não muda o resultado: a aposta continua incerta."},{"p":"Ao ver promessa de ganho alto, qual pergunta crítica é útil?","o":["Quanto eu ganharia se apostasse o dobro?","Quantas pessoas já ganharam com isso?","Até quando vale essa promoção?","O que essa propaganda não está mostrando?"],"r":3,"e":"Avaliar o que a mensagem não destaca ajuda a reconhecer riscos."},{"p":"Qual é um sinal de alerta numa propaganda de apostas?","o":["Destacar ganhos e esconder perdas.","Mostrar o aviso de proibido para menores.","Informar as regras da promoção.","Citar o telefone de ajuda."],"r":0,"e":"Enfatizar ganhos e minimizar perdas pode distorcer a percepção do risco."},{"p":"Como se proteger de decisões levadas por promessa de dinheiro fácil?","o":["Apostar só um valor pequeno para testar.","Seguir quem já ganhou muitas vezes.","Fazer uma pausa e pensar nos riscos.","Esperar o bônus de boas-vindas."],"r":2,"e":"Uma pausa ajuda a avaliar consequências antes de agir."}]},{"id":"modulo_2_aula_2","t":"Como o design dos aplicativos influencia as decisões","v":"EmN2UWGXXb0","i":720,"f":1010,"q":[{"p":"Como o design de um aplicativo pode influenciar o comportamento?","o":["Só pela velocidade da internet.","Com cores e atalhos que facilitam continuar.","Mostrando com clareza quanto você já perdeu.","Bloqueando sozinho quem aposta demais no dia."],"r":1,"e":"A interface pode reduzir barreiras e estimular a continuidade."},{"p":"Qual risco existe quando apostar fica muito rápido?","o":["Cada aposta passa a custar mais caro do que antes.","O prêmio demora mais a cair na sua conta.","Decidir sem pensar nas consequências.","As chances de ganhar ficam mais baixas."],"r":2,"e":"A rapidez pode reduzir o tempo para refletir."},{"p":"Qual comportamento ajuda a manter uma decisão consciente?","o":["Definir limites e parar quando pesa no bolso.","Apostar só quando chega uma notificação.","Aumentar o valor para recuperar o que perdeu antes.","Deixar o app sugerir quanto apostar."],"r":0,"e":"Limites e pausas podem reduzir decisões impulsivas."},{"p":"Elementos visuais e notificações podem influenciar a atenção e as decisões?","o":["Verdadeiro","Falso"],"r":0,"e":"Design e notificações podem direcionar a atenção e incentivar a interação."},{"p":"Por que notificações frequentes atrapalham quem tenta parar?","o":["Porque gastam a bateria do celular.","Porque trazem só promoções falsas.","Porque mostram resultados errados.","Podem puxar a pessoa de volta."],"r":3,"e":"Notificações podem servir como estímulos para voltar a apostar."},{"p":"Qual pergunta ajuda a avaliar uma função do aplicativo?","o":["Ela me ajuda a ganhar mais rápido?","Ela me faz pensar ou me faz apostar sem pensar?","Ela deixa o app mais bonito que os concorrentes?","Quantas pessoas usam essa função?"],"r":1,"e":"É útil avaliar se a função incentiva reflexão ou acelera a aposta."}]},{"id":"modulo_2_aula_3","t":"Influenciadores, ética e responsabilidade","v":"sLnR40D1g4Y","i":825,"f":1054,"q":[{"p":"Por que avaliar com cuidado o que influenciadores dizem sobre apostas?","o":["Porque todo influenciador mente.","Porque eles só divulgam casas ilegais.","Podem ser pagos, e o risco continua.","Porque não entendem de futebol."],"r":2,"e":"Popularidade não garante imparcialidade nem previsibilidade."},{"p":"Que informação ajuda a ver se uma propaganda é responsável?","o":["Se diz que é publicidade e mostra os riscos.","Se o influenciador tem muitos seguidores.","Se mostra prints de prêmios recebidos.","Se o bônus oferecido é alto."],"r":0,"e":"Transparência e comunicação de riscos ajudam o público a avaliar a mensagem."},{"p":"Um depoimento de alguém que ganhou comprova que outros também ganharão?","o":["Verdadeiro","Falso"],"r":1,"e":"Um caso individual não garante o mesmo resultado para outras pessoas."},{"p":"Qual é o risco de mostrar só histórias de grandes ganhos?","o":["As pessoas passam a apostar valores menores.","Ninguém acredita nesse tipo de história.","As casas de aposta perdem dinheiro.","Fazer o ganho parecer comum e a perda, rara."],"r":3,"e":"Mostrar apenas sucessos pode distorcer a percepção dos riscos."},{"p":"Como reagir a uma promoção que promete ganhos fáceis?","o":["Aproveitar enquanto a oferta está valendo.","Perguntar quem lucra e quais os riscos.","Testar com pouco dinheiro primeiro.","Mandar para amigos que também apostam."],"r":1,"e":"Avaliação crítica evita tratar publicidade como garantia."},{"p":"Qual princípio é importante na comunicação responsável?","o":["Mostrar vencedores reais, com nome e foto.","Oferecer bônus iguais para todos.","Não vender ganho incerto como certo.","Falar dos riscos só nas letras miúdas."],"r":2,"e":"Ganhos incertos não devem ser apresentados como resultados garantidos."}]}]},{"id":"modulo_3","n":"Falta de controle financeiro","a":[{"id":"modulo_3_aula_1","t":"Dívida, “só mais uma” e por que não é falta de caráter","v":"IBMrjEnt_QI","i":958,"f":1291,"q":[{"p":"Por que apostar “só mais uma vez” pode ser perigoso?","o":["Pode gerar novas perdas e manter o ciclo.","Porque a próxima rodada costuma ser pior.","Porque o app aumenta o valor sozinho.","Só é perigoso se for com dinheiro emprestado."],"r":0,"e":"Tentar recuperar perdas pode estimular novas apostas e ampliar o prejuízo."},{"p":"Qual visão ajuda a entender problemas com apostas?","o":["É falta de força de vontade.","Só acontece com quem não sabe de dinheiro.","Pode ser questão de saúde e merece cuidado.","Passa sozinho quando a pessoa ganha."],"r":2,"e":"O problema não deve ser reduzido a julgamento moral."},{"p":"Além da culpa, são preciso apoio e passos práticos para sair do problema?","o":["Verdadeiro","Falso"],"r":0,"e":"Culpa e vergonha sozinhas não resolvem. Apoio e medidas práticas fazem a diferença."},{"p":"Qual sinal pode indicar perda do controle financeiro?","o":["Anotar os gastos do mês numa planilha.","Separar o dinheiro das contas no dia do salário.","Pedir para reduzir o limite do cartão.","Usar o dinheiro das contas para apostar."],"r":3,"e":"Comprometer recursos essenciais é um sinal de impacto financeiro."},{"p":"O que fazer quando a vontade de recuperar perdas leva a novas apostas?","o":["Apostar mais alto para recuperar mais rápido.","Parar a sequência e pedir apoio.","Mudar para outro tipo de jogo.","Apostar só nos dias de folga."],"r":1,"e":"Interromper o ciclo e buscar apoio pode reduzir novas perdas."},{"p":"Por que evitar julgamentos morais simplistas?","o":["Porque a culpa ajuda a pessoa a parar.","Porque o problema não tem consequências.","A vergonha afasta a pessoa da ajuda.","Porque só especialistas podem opinar."],"r":2,"e":"O estigma pode afastar a pessoa do apoio necessário."}]},{"id":"modulo_3_aula_2","t":"Dinheiro não deve ser um tabu","v":"sLnR40D1g4Y","i":1865,"f":2200,"q":[{"p":"Como conversar sobre dinheiro pode ajudar a família?","o":["Evita que alguém precise mudar os próprios hábitos.","Deixa o problema visível e as decisões juntas.","Faz os credores darem mais prazo.","Mostra quem é o culpado pela dívida."],"r":1,"e":"O diálogo ajuda a entender a situação e combinar ações."},{"p":"Qual atitude favorece uma conversa boa sobre dívidas?","o":["Ouvir, contar a situação e combinar o próximo passo.","Esperar a dívida estar resolvida para só então contar.","Evitar números para não brigar.","Prometer que vai ganhar de volta."],"r":0,"e":"Uma conversa produtiva procura compreender a situação e planejar ações."},{"p":"Falar sobre dívidas pode ajudar a identificar o problema e planejar soluções?","o":["Verdadeiro","Falso"],"r":0,"e":"A comunicação torna informações claras e facilita o planejamento."},{"p":"Por que o silêncio sobre problemas financeiros pode atrapalhar?","o":["Porque os juros crescem mais rápido.","Porque a família pode ser processada.","Porque o banco percebe e corta o crédito.","Atrasa perceber o problema e buscar apoio."],"r":3,"e":"Quando o problema fica oculto, pode ser mais difícil enfrentá-lo."},{"p":"Que informação é útil numa conversa sobre organizar o dinheiro?","o":["Quanto alguém conhecido ganhou apostando.","Valores reais de renda, gastos e dívidas.","Só os gastos de lazer de cada um.","O total que vocês gastaram no ano passado."],"r":1,"e":"Dados reais ajudam a transformar a conversa em planejamento."},{"p":"Qual deve ser o objetivo de conversar sobre dinheiro em família?","o":["Descobrir quem errou mais.","Decidir quem da família vai pagar a dívida sozinho.","Entender a situação e combinar ações.","Evitar que alguém mude de hábito."],"r":2,"e":"O diálogo deve ajudar a construir entendimento e próximos passos."}]},{"id":"modulo_3_aula_3","t":"Infidelidade financeira e patrimônio familiar","v":"sLnR40D1g4Y","i":2200,"f":2470,"q":[{"p":"O que mostra um problema de transparência financeira na família?","o":["Esconder dívidas que afetam o dinheiro de todos.","Ter conta bancária separada do parceiro ou parceira.","Um ganhar mais do que o outro.","Guardar dinheiro para uma surpresa."],"r":0,"e":"Ocultar informações relevantes pode prejudicar decisões sobre recursos compartilhados."},{"p":"Por que esconder dívidas pode afetar o patrimônio da família?","o":["Porque a dívida passa automaticamente para os filhos.","Recursos de todos podem ser usados sem plano.","Porque o imóvel é tomado na hora.","Só afeta se a dívida for no cartão."],"r":1,"e":"Compromissos não informados podem afetar o orçamento e os bens da família."},{"p":"Qual prática ajuda a evitar conflitos sobre dinheiro?","o":["Cada um decidir sozinho sobre o próprio dinheiro.","Evitar falar de dívidas para não brigar.","Combinar transparência sobre o que é de todos.","Deixar uma só pessoa cuidar de tudo."],"r":2,"e":"Comunicação sobre compromissos compartilhados favorece decisões conscientes."},{"p":"Ocultar uma dívida impede que ela afete despesas comuns?","o":["Verdadeiro","Falso"],"r":1,"e":"Mesmo escondida, a dívida pode comprometer recursos destinados a despesas comuns."},{"p":"Ao descobrir uma dívida escondida, qual resposta é mais construtiva?","o":["Fingir que não viu para não criar conflito.","Pagar a dívida em silêncio, sem conversar.","Esperar a pessoa resolver tudo sozinha.","Ver os valores e combinar como proteger a casa."],"r":3,"e":"Compreender valores e impactos permite planejar medidas."},{"p":"Por que decisões financeiras importantes devem considerar as pessoas afetadas?","o":["Porque a lei exige assinatura de todos.","O dinheiro e as contas podem ser de todos.","Porque assim a dívida diminui.","Para dividir a culpa se der errado."],"r":1,"e":"Decisões individuais podem afetar outras pessoas quando os recursos são compartilhados."}]}]},{"id":"modulo_4","n":"Quando o jogo vira problema","a":[{"id":"modulo_4_aula_1","t":"Como o cérebro vai se acostumando","v":"IBMrjEnt_QI","i":434,"f":721,"q":[{"p":"Por que repetir apostas pode torná-las mais difíceis de interromper?","o":["A repetição fortalece o hábito.","Porque quem aposta muito esquece as perdas.","Porque o app bloqueia a saída depois de um tempo.","Porque fica mais fácil ganhar com a prática."],"r":0,"e":"A repetição e a expectativa de recompensa podem reforçar hábitos."},{"p":"Qual frase evita simplificar o problema do jogo?","o":["É sempre falta de caráter.","Quem quer de verdade para sozinho.","Envolve vários fatores e merece cuidado.","Todo mundo que aposta vai ficar dependente."],"r":2,"e":"O risco não é igual para todos e não deve ser reduzido a julgamento moral."},{"p":"Todas as pessoas que apostam desenvolverão necessariamente um transtorno?","o":["Verdadeiro","Falso"],"r":1,"e":"Não é correto afirmar que todas as pessoas que apostam desenvolverão um transtorno."},{"p":"Qual atitude pode ajudar ao perceber dificuldade em controlar apostas?","o":["Apostar só nos fins de semana para compensar.","Reconhecer os sinais e procurar apoio.","Trocar de casa de aposta.","Esperar uma boa fase para parar."],"r":1,"e":"Reconhecer a dificuldade e buscar apoio são passos importantes."},{"p":"O que pode acontecer quando aposta e recompensa se repetem juntas?","o":["A pessoa aprende a prever os resultados.","Os riscos de perder diminuem.","A vontade de apostar some com o tempo.","Forma um hábito difícil de interromper."],"r":3,"e":"A repetição pode reforçar o comportamento."},{"p":"Por que observar mudanças no jeito de apostar?","o":["Sinais cedo podem mostrar perda de controle.","Qualquer mudança já é um diagnóstico.","Para saber a melhor hora de apostar.","Porque mudanças sempre trazem prejuízo."],"r":0,"e":"Observar mudanças ajuda a reconhecer possíveis problemas sem concluir diagnóstico automaticamente."}]},{"id":"modulo_4_aula_2","t":"O “quase ganhar” e por que não para nem ganhando","v":"IBMrjEnt_QI","i":1291,"f":1553,"q":[{"p":"Por que a sensação de “quase ganhar” pode puxar novas apostas?","o":["Porque mostra que a sorte está mudando a seu favor.","Porque devolve parte do dinheiro.","Parece que a vitória está perto, mas não está.","Porque o próximo resultado fica mais fácil."],"r":2,"e":"Quase vencer não garante o resultado seguinte."},{"p":"Alguém perdeu 5 vezes seguidas e pensa: “agora tem que vir”. O que há de errado nisso?","o":["As perdas anteriores não mudam a chance da próxima.","Nada: depois de várias perdas, ganhar fica mais provável.","Ele deveria esperar mais algumas rodadas.","O erro foi ter apostado pouco nas anteriores."],"r":0,"e":"Cada rodada é independente. Perder várias vezes não aumenta a chance de ganhar na próxima."},{"p":"A sensação de quase ganhar garante matematicamente uma vitória futura?","o":["Verdadeiro","Falso"],"r":1,"e":"A sensação não garante resultados futuros."},{"p":"Uma pessoa ganha pouco e continua até perder mais do que ganhou. O que isso mostra?","o":["Que ela deveria ter apostado mais alto desde o início.","Que a próxima vitória vai compensar.","Que ganhar uma vez quita as perdas.","Uma vitória isolada não garante saldo positivo."],"r":3,"e":"É possível ganhar em uma rodada e terminar com perdas acumuladas."},{"p":"Como não confundir sensação de proximidade com chance real?","o":["Apostar mais rápido para não pensar.","Lembrar que a sensação não prevê nada.","Acompanhar os padrões dos últimos resultados.","Aumentar a aposta quando sentir que vai ganhar."],"r":1,"e":"A sensação subjetiva não determina o próximo resultado."},{"p":"Por que anotar o total gasto é mais útil que lembrar só de uma vitória?","o":["Mostra o saldo real, com perdas e ganhos.","Ajuda a descobrir o melhor horário para apostar.","A memória das vitórias já é suficiente.","Porque o app pode errar o saldo."],"r":0,"e":"Considerar todos os valores oferece uma visão mais realista."}]},{"id":"modulo_4_aula_3","t":"Sinais para a família e como o problema avança","v":"zNp_Dl_smYM","i":523,"f":888,"q":[{"p":"Qual mudança pode ser sinal de alerta para a família?","o":["Falar abertamente sobre o orçamento.","Esconder gastos e pensar o tempo todo em apostas.","Começar a anotar todas as contas da casa num caderno.","Cortar gastos que não são essenciais."],"r":1,"e":"Segredo sobre gastos e preocupação intensa podem indicar que algo merece atenção."},{"p":"Como entender um sinal isolado de comportamento?","o":["Como prova de que a pessoa já tem um problema grave.","Como motivo para não tocar no assunto.","Como algo que merece atenção, sem concluir nada.","Como sinal de que está tudo bem."],"r":2,"e":"Um sinal isolado não basta para concluir um diagnóstico."},{"p":"Observar sinais de alerta significa acusar imediatamente a pessoa?","o":["Verdadeiro","Falso"],"r":1,"e":"Acusações podem dificultar o diálogo; é melhor conversar com cuidado."},{"p":"Qual é uma forma de apoiar alguém com possível problema de apostas?","o":["Ouvir com respeito e incentivar a busca de ajuda.","Pagar todas as dívidas dela sem tocar no assunto.","Vigiar o celular da pessoa escondido.","Dar um ultimato no primeiro sinal."],"r":0,"e":"Acolhimento e apoio adequado são mais construtivos do que estimular apostas."},{"p":"Por que dívidas secretas podem preocupar a família?","o":["Porque sempre indicam um problema grave e sem saída.","Porque toda dívida escondida é de aposta.","Porque a família vai ter que pagar.","Podem mostrar que as apostas pesam nas decisões."],"r":3,"e":"Mudanças financeiras secretas podem indicar consequências negativas."},{"p":"Qual a diferença entre apoiar e encobrir?","o":["Nenhuma: os dois protegem a pessoa.","Apoiar enfrenta o problema; encobrir esconde.","Encobrir é apoiar sem a pessoa saber.","Apoiar é pagar as dívidas por ela."],"r":1,"e":"Apoiar busca enfrentar o problema; encobrir pode impedir que ele seja reconhecido."}]}]},{"id":"modulo_5","n":"Organização financeira","a":[{"id":"modulo_5_aula_1","t":"Economia é sobre pessoas, não apenas dinheiro","v":"sLnR40D1g4Y","i":255,"f":534,"q":[{"p":"Por que a análise econômica deve considerar o bem-estar das pessoas?","o":["Decisões de dinheiro afetam a vida e as relações.","Porque o dinheiro importa menos que a felicidade.","Porque todas as famílias gastam igual.","Só para fazer pesquisa de opinião."],"r":0,"e":"Os efeitos econômicos também aparecem nas necessidades diárias e relações."},{"p":"Qual é um exemplo de impacto de uma dívida na família?","o":["Aumentar a renda da casa.","Melhorar o crédito de todos.","Faltar dinheiro para as contas da casa.","Fazer as contas da casa vencerem mais tarde."],"r":2,"e":"Recursos comprometidos podem deixar despesas compartilhadas sem cobertura."},{"p":"Compreender um problema financeiro exige olhar somente o valor da dívida?","o":["Verdadeiro","Falso"],"r":1,"e":"Também importa compreender efeitos sobre necessidades, cotidiano e relações."},{"p":"Qual pergunta ajuda a entender o impacto real de uma perda?","o":["Quanto eu teria ganhado se tivesse acertado?","Quem ganhou mais apostando este mês?","Em qual jogo eu perdi mais?","Quais gastos e necessidades foram afetados?"],"r":3,"e":"Identificar necessidades afetadas ajuda a entender consequências concretas."},{"p":"Por que o contexto da família importa no planejamento?","o":["Dinheiro e contas podem ser de todos.","Porque a família define quanto apostar.","Porque todas têm o mesmo orçamento.","Para dividir as dívidas igualmente."],"r":0,"e":"O planejamento precisa considerar responsabilidades e necessidades reais."},{"p":"Qual abordagem combina com uma visão humana da economia?","o":["Olhar só para o lucro possível.","Considerar necessidades e bem-estar.","Tratar dívidas pequenas como irrelevantes.","Comparar a renda entre famílias."],"r":1,"e":"Uma visão humana considera como as decisões econômicas afetam a vida das pessoas."}]},{"id":"modulo_5_aula_2","t":"Prevenção, educação financeira e políticas públicas","v":"sLnR40D1g4Y","i":2470,"f":2726,"q":[{"p":"Qual é o papel da educação financeira na prevenção de problemas com apostas?","o":["Ensinar a apostar com estratégia.","Garantir que ninguém perca dinheiro.","Ajudar a entender riscos e planejar.","Substituir o tratamento profissional."],"r":2,"e":"Educação financeira ajuda a compreender riscos, mas não garante lucro nem substitui outros apoios."},{"p":"Por que a prevenção vai além das escolhas de cada um?","o":["Propaganda, acesso e leis também influenciam.","Porque as escolhas pessoais não fazem diferença nenhuma.","Porque todos terão o mesmo resultado.","Porque leis eliminam todo o risco."],"r":0,"e":"A prevenção pode envolver educação, regulação, informação e proteção."},{"p":"Uma única medida de educação financeira garante que ninguém terá problemas com apostas?","o":["Verdadeiro","Falso"],"r":1,"e":"Nenhuma medida isolada garante a eliminação de todos os riscos."},{"p":"Qual é uma finalidade de políticas públicas de prevenção?","o":["Garantir que apostar seja lucrativo.","Esconder os riscos para não assustar.","Substituir o planejamento financeiro de cada pessoa.","Garantir informação, proteção e responsabilidade."],"r":3,"e":"Políticas públicas podem criar condições de proteção e responsabilidade."},{"p":"Qual atitude mostra olhar crítico diante de uma oferta de aposta?","o":["Aceitar porque todos os amigos também estão apostando.","Comparar a promessa com os riscos e as regras.","Aproveitar enquanto o bônus está alto.","Apostar pouco só para conhecer."],"r":1,"e":"Verificar condições e riscos evita decisões baseadas apenas em promessas."},{"p":"Por que prevenção é mais ampla que simplesmente dizer “tenha cuidado”?","o":["Precisa de informação, limites e apoio.","Porque avisos não servem para nada.","Porque só a lei resolve o problema.","Porque cuidado só depende de sorte."],"r":0,"e":"A prevenção pode combinar educação, apoio e medidas de proteção."}]},{"id":"modulo_5_aula_3","t":"Eu Vou Levar — consumo e decisão de compra","v":"FdTip4SdWMw","i":0,"f":259,"q":[{"p":"Antes de comprar algo, qual pergunta ajuda a avaliar a necessidade?","o":["Dá para parcelar sem juros?","Eu preciso disso e cabe no orçamento?","Quantas pessoas já compraram?","A promoção acaba hoje?"],"r":1,"e":"Avaliar necessidade e orçamento ajuda a distinguir desejo imediato de compra compatível com os recursos."},{"p":"Qual é um risco de comprar por impulso?","o":["O produto sempre sai mais caro do que na loja física.","Não é possível devolver.","Usar dinheiro que era de outra prioridade.","Ganhar pontos no cartão."],"r":2,"e":"Compras impulsivas podem consumir recursos necessários para outras despesas."},{"p":"Comparar uma compra com o orçamento pode ajudar a evitar gastos incompatíveis com a renda?","o":["Verdadeiro","Falso"],"r":0,"e":"Conferir o orçamento antes da compra ajuda a avaliar se ela cabe nos recursos."},{"p":"Qual atitude favorece uma compra consciente?","o":["Comprar sempre que houver promoção.","Olhar só o valor da parcela.","Comprar logo para não perder a chance.","Comparar opções e ver o custo total."],"r":3,"e":"Necessidade e custo total devem ser considerados na decisão."},{"p":"Uma promoção significa que a compra é vantajosa?","o":["Não necessariamente: pode não caber no bolso.","Sim, todo desconto compensa.","Sim, comprar mais sempre economiza.","Sim, se o desconto for maior que a metade do preço."],"r":0,"e":"Mesmo com desconto, a compra pode ser desnecessária ou incompatível com o orçamento."},{"p":"Qual prática ajuda a equilibrar desejos e compromissos?","o":["Gastar primeiro e ver o que sobra.","Planejar e separar dinheiro para prioridades.","Usar o cartão e pensar nas parcelas depois.","Comprar antes de ver o preço."],"r":1,"e":"Planejar ajuda a atender prioridades sem comprometer outras obrigações."}]}]}];
const CAP_REGIAO = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];
const CAP_BIOMA = ['Araucárias e campos', 'Mata Atlântica', 'Cerrado', 'Caatinga', 'Floresta Amazônica'];
const ICO_K = {
  aula: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5"/><path d="M12 18.5h.01"/><circle cx="12" cy="12" r="9.5"/></svg>',
  reflection: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  scenario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M9 10h6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M8 13l3 3 5-6"/></svg>',
  feito: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bloq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};
// recompensas por posição no capítulo: broto, árvore, flores, pássaro, borboleta (a paisagem que volta)
// a paisagem: cada atividade tem um elemento ao lado do caminho que volta à vida quando é concluída
// tipos por posição no capítulo: árvore, capim, flores (flora) · pássaro, borboleta (fauna)
const PAISAGEM_TIPO = ['arvore', 'capim', 'flores', 'passaro', 'borboleta', 'arvore', 'flores'];   // + "Na prática" no fim do capítulo   // aula 1, quiz 1, aula 2, quiz 2, aula 3, quiz 3
const FAUNA = new Set(['passaro', 'borboleta']);
const ICO_FLORA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/></svg>';
const ICO_FAUNA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 15c4-6 8-6 9-2 1-4 5-4 9 2"/></svg>';
// ---------- trilha de aulas: cada aula tem um círculo de vídeo e, logo depois, um círculo de quiz ----------
// "Na prática": fecha cada capítulo levando a aula para a vida da pessoa (atividade de recuperação, sem resposta certa)
const PRATICA = [{"title": "Escolher um cuidado financeiro", "kind": "reflection", "prompt": "Qual passo pequeno está ao seu alcance agora?", "options": ["Listar minhas despesas essenciais, sem precisar informar valores aqui", "Anotar uma dúvida para levar a um serviço de orientação", "Organizar uma informação de uma dívida", "Pedir apoio para começar essa organização"], "feedback": "Um passo de cada vez. Você não precisa resolver todas as dívidas nesta atividade nem enviar valores para o app.", "takeaway": "Um passo de organização financeira"}, {"title": "Desligar os convites", "kind": "reflection", "prompt": "Qual fonte de estímulos você poderia revisar no seu celular?", "options": ["Notificações de aplicativos e sites de apostas", "Perfis e canais que divulgam apostas", "Grupos que compartilham convites para apostar", "Quero identificar isso com alguém de confiança"], "feedback": "Revisar esses canais é um passo de proteção. Esta atividade só registra seu planejamento; ela não altera as configurações do celular.", "takeaway": "Escolher um canal para revisar"}, {"title": "Separar um momento", "kind": "plan", "prompt": "Onde você quer começar esse passo de organização?", "options": ["Em casa, em um horário tranquilo", "Com alguém de confiança que eu escolher", "Em um serviço de orientação financeira ou ao consumidor", "Vou definir um lugar depois"], "feedback": "Você preparou um ponto de partida. A atividade registra um plano, sem realizar negociação ou movimentar dinheiro.", "takeaway": "Planejar onde começar a organização"}, {"title": "Reconhecer meu gatilho", "kind": "reflection", "prompt": "Em que situação a vontade de apostar costuma aparecer para você?", "options": ["Quando estou ansioso ou frustrado", "Quando estou sozinho ou sem atividade", "Quando vejo anúncios ou conteúdos de apostas", "Ainda estou tentando perceber"], "feedback": "Não existe resposta certa aqui. Perceber o que vem antes da vontade ajuda a escolher uma proteção para esse momento.", "takeaway": "Observar um gatilho possível"}, {"title": "Levar meu plano comigo", "kind": "reflection", "prompt": "Qual parte do seu plano você quer manter por perto?", "options": ["Meus gatilhos e uma alternativa às apostas", "As barreiras e o cuidado com o essencial", "As pessoas e serviços a quem posso recorrer", "Quero rever o plano acompanhado"], "feedback": "O cuidado continua depois da trilha. Concluir atividades não mede recuperação clínica; seu plano pode ser revisto e o apoio pode continuar pelo tempo necessário.", "takeaway": "Revisar um plano de cuidado contínuo"}];
const TRILHA_NOS = AULAS.map((m, c) => [...m.a.flatMap((a, j) => [
  { tipo: 'aula', c, j, aula: a, title: a.t },
  { tipo: 'quiz', c, j, aula: a, title: a.t },
]), { tipo: 'pratica', c, j: m.a.length, pr: PRATICA[c], title: PRATICA[c].title }]);
const ROTULO_NO = { aula: 'Aula', quiz: 'Quiz', pratica: 'Na prática' };
ICO_K.pratica = ICO_K.reflection;
const escH = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let trilha = { feitas: {} };   // 'c-i' → { em, acertos?, total? }
try { const v = JSON.parse(localStorage.getItem('terraforma:trilha-aulas')); if (v && v.feitas) trilha = v; } catch {}
const guardarTrilha = () => { try { localStorage.setItem('terraforma:trilha-aulas', JSON.stringify(trilha)); } catch {} };
// ---------- progresso da trilha na conta (back NestJS, tabela trilha_progresso) ----------
// o aparelho continua sendo a cópia de trabalho; com conta, cada conclusão vai para o servidor e, ao entrar, os dois se juntam.
// trilha.dono = id da conta dona do progresso guardado; trilha.pendente = há algo que ainda não chegou ao servidor
const mesclarFeita = (a, b) => !a ? b : !b ? a : {
  ...a, ...b,
  em: a.em && b.em ? (a.em < b.em ? a.em : b.em) : a.em || b.em,
  ...(a.acertos != null || b.acertos != null ? { acertos: Math.max(a.acertos ?? 0, b.acertos ?? 0) } : {}),
};
let filaTrilha = Promise.resolve();
function sincronizarTrilhaConta() {
  if (!B || !conta) return filaTrilha;
  const dono = conta.id;
  // uma de cada vez: a resposta de uma não apaga o que foi concluído enquanto a outra viajava
  filaTrilha = filaTrilha.then(async () => {
    if (conta?.id !== dono) return;
    trilha.dono = dono;
    try {
      const doServidor = await B.sincronizarTrilha(trilha.feitas);
      if (conta?.id !== dono) return;
      const antes = JSON.stringify(trilha.feitas);
      for (const [k, v] of Object.entries(doServidor)) trilha.feitas[k] = mesclarFeita(v, trilha.feitas[k]);
      trilha.pendente = false; guardarTrilha();
      if (JSON.stringify(trilha.feitas) !== antes && telaAtual === 'trilha' && !licao) desenharTrilha();
    } catch { trilha.pendente = true; guardarTrilha(); }   // fora do ar: tenta de novo na próxima conclusão ou ao abrir o app
  });
  return filaTrilha;
}
// ao entrar: progresso de outra conta neste aparelho já está guardado nela, então não passa para esta
function trilhaDaConta() {
  if (!conta) return;
  if (trilha.dono && trilha.dono !== conta.id) { trilha = { feitas: {} }; guardarTrilha(); }
  sincronizarTrilhaConta();
}
const chaveAt = (c, i) => `${c}-${i}`;
const feita = (c, i) => !!trilha.feitas[chaveAt(c, i)];
const ordemLinear = () => TRILHA_NOS.flatMap((cap, c) => cap.map((_, i) => [c, i]));
const proximaAt = () => ordemLinear().find(([c, i]) => !feita(c, i)) || null;
let ultimaConcluida = null, abertaAt = null;
const mmss = (t) => { t = Math.max(0, Math.floor(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const duracao = (a) => { const d = a.f - a.i; return d >= 60 ? `${Math.round(d / 60)} min` : `${d} s`; };

// a paisagem volta trecho a trecho, de baixo para cima: chão seco e rachado vira grama, as plantas do bioma crescem e os bichos voltam
// (o desenho fica em paisagem.js; aqui ficam o caminho, os círculos e os prêmios de cada círculo)
function desenharTrilha() {
  fecharPop(); limparCenas();
  const prox = proximaAt(), nAulas = AULAS.reduce((n, m) => n + m.a.length, 0);
  let flora = 0, fauna = 0, totFlora = 0, totFauna = 0, aulas = 0, quizzes = 0;
  TRILHA_NOS.forEach((cap, c) => cap.forEach((m, i) => {
    const fa = FAUNA.has(PAISAGEM_TIPO[i]); if (fa) totFauna++; else totFlora++;
    if (feita(c, i)) { if (fa) fauna++; else flora++; if (m.tipo === 'aula') aulas++; else quizzes++; }
  }));
  $('#trilha-resumo').textContent = prox ? `${aulas} de ${nAulas} aulas · ${quizzes} de ${nAulas} quizzes` : `Trilha completa · ${nAulas} aulas e ${nAulas} quizzes`;
  $('#trilha-vida').innerHTML = `<span>${ICO_FLORA}<b>${flora}</b> de ${totFlora} flora</span><span>${ICO_FAUNA}<b>${fauna}</b> de ${totFauna} fauna</span>`;
  const W = 350, DY = 112, TOPO = 78, xs = (n) => W / 2 + Math.sin(n * 1.05) * 78;
  const [uc] = ultimaConcluida ? ultimaConcluida.split('-').map(Number) : [-1];
  const geo = {};
  const ordem = TRILHA_NOS.map((_, c) => c).reverse();   // o primeiro capítulo fica embaixo
  const html = ordem.map((c) => {
    const cap = TRILHA_NOS[c], N = cap.length, feitasCap = cap.filter((_, i) => feita(c, i)).length, H = TOPO + N * DY, base = c * N;
    const pts = cap.map((_, i) => [xs(base + i + 1), H - 60 - i * DY]);
    // a estrada entra e sai de cada capítulo por uma reta vertical no centro, longe das bordas: emenda perfeita com o capítulo de baixo e o de cima
    let d = `M ${W / 2} ${H + 400} L ${W / 2} ${H + 4}`;
    pts.forEach(([x, y], i) => { const [px, py] = i ? pts[i - 1] : [W / 2, H + 4]; const my = (py + y) / 2; d += ` C ${px} ${my}, ${x} ${my}, ${x} ${y}`; });
    const [ux, uy] = pts[N - 1]; d += ` C ${ux} ${uy - 44}, ${W / 2} 0, ${W / 2} -12 L ${W / 2} -400`;
    // a frente verde vai até o próximo círculo (ele mesmo só fica verde quando for concluído);
    // no começo de um capítulo, ela já sobe do capítulo anterior completo até o primeiro círculo, sem emenda entre as regiões
    const anteriorCompleto = c > 0 && TRILHA_NOS[c - 1].every((_, i) => feita(c - 1, i));
    const frente = (n) => n >= N ? -400 : n <= 0 ? (anteriorCompleto ? pts[0][1] : H + 400) : pts[n][1];
    const ucCompleto = uc >= 0 && TRILHA_NOS[uc].every((_, i) => feita(uc, i));
    const entraAgora = c === uc + 1 && feitasCap === 0 && ucCompleto && !s.mov;   // o capítulo acabou de ser liberado: o verde chega junto
    const yF = frente(feitasCap), anima = (c === uc || entraAgora) && !s.mov, yAnt = entraAgora ? H + 70 : anima ? frente(feitasCap - 1) : yF;
    const premios = cap.map((_, i) => { if (!feita(c, i)) return null; const [x, y] = pts[i], lado = x > W / 2 ? -1 : 1;
      return { x: Math.max(40, Math.min(W - 40, x + lado * 96)), y: y + 24, tipo: PAISAGEM_TIPO[i] }; }).filter(Boolean);
    geo[c] = { W, H, d, pts, premios, yF, yAnt, animar: anima, completo: feitasCap === N };
    const nos = cap.map((m, i) => {
      const [x, y] = pts[i], f = feita(c, i), agora = prox && prox[0] === c && prox[1] === i;
      const cls = f ? 'feito' : agora ? 'agora' : 'bloq', novo = ultimaConcluida === chaveAt(c, i);
      const rot = `${m.tipo === 'pratica' ? 'Na prática' : ROTULO_NO[m.tipo] + ' da aula ' + (m.j + 1)}: ${m.title}. ${f ? 'Concluído' : agora ? 'Disponível agora' : 'Bloqueado'}`;
      return `<button type="button" class="no ${cls} t-${m.tipo}${novo ? ' surgiu' : ''}" style="left: ${x}px; top: ${y}px" data-at="${c}-${i}" aria-haspopup="dialog" aria-label="${escH(rot)}">${f ? ICO_K.feito : ICO_K[m.tipo]}${agora ? `<span class="bolha">${{ aula: 'Começar', quiz: 'Quiz', pratica: 'Na prática' }[m.tipo]}</span>` : ''}</button>`;
    }).join('');
    return `<section class="capitulo" data-c="${c}" aria-label="Capítulo ${c + 1}, ${CAP_REGIAO[c]}: ${escH(AULAS[c].n)}">
      <canvas class="paisagem-chao" aria-hidden="true"></canvas>
      <canvas class="paisagem-cv" aria-hidden="true"></canvas>
      <div class="faixa-cap ${feitasCap === N ? 'feito' : ''}"><span><b>${CAP_REGIAO[c]} · ${AULAS[c].n}</b><small>Capítulo ${c + 1} · ${CAP_BIOMA[c].split(' e ')[0]} · ${AULAS[c].a.length} aulas + prática</small></span><span class="cont">${feitasCap === N ? '✓ completo' : feitasCap + ' de ' + N}</span></div>
      ${feitasCap === N ? `<p class="fim-cap">A paisagem do ${CAP_REGIAO[c]} voltou. O que floresce fica.</p>` : ''}
      <div class="trilho-cap" style="height: ${H}px">${nos}</div>
    </section>`;
  }).join('');
  $('#rol-trilha').innerHTML = html;
  $$('#rol-trilha .capitulo').forEach((sec) => {
    const c = +sec.dataset.c, tr = sec.querySelector('.trilho-cap');
    montarCena({ canvas: sec.querySelector('.paisagem-cv'), chaoCv: sec.querySelector('.paisagem-chao'), c, trilho: tr, ox: tr.offsetLeft, oy: tr.offsetTop, reduzido: s.mov, escuro: s.escuro, ...geo[c] });
  });
  const px = $('#proxima');
  if (prox) {
    const m = TRILHA_NOS[prox[0]][prox[1]];
    px.innerHTML = `<span class="ico">${ICO_K[m.tipo]}</span><span><small>Próximo · ${m.tipo === 'aula' ? `Aula ${m.j + 1} de ${AULAS[m.c].a.length}` : m.tipo === 'quiz' ? `Quiz da aula ${m.j + 1}` : 'Na prática'}</small><b>${m.title}</b></span><button type="button" data-at="${prox[0]}-${prox[1]}">${m.tipo === 'aula' ? 'Assistir' : 'Começar'}</button>`;
  } else px.innerHTML = '<span class="ico">' + ICO_K.feito + '</span><span><small>Trilha completa</small><b>Você pode rever qualquer aula ou quiz</b></span>';
  // leva a pessoa até onde parou
  const alvo = prox ? $(`#rol-trilha .no[data-at="${prox[0]}-${prox[1]}"]`) : ultimaConcluida ? $(`#rol-trilha .no[data-at="${ultimaConcluida}"]`) : null;
  const suave = !!ultimaConcluida && !s.mov, r0 = $('#rol-trilha');
  const rolar = (b) => { if (alvo) r0.scrollTo({ top: Math.max(0, alvo.offsetTop + alvo.closest('.capitulo').offsetTop - r0.clientHeight * 0.45), behavior: b }); };
  rolar('auto');
  if (alvo) setTimeout(() => rolar(suave ? 'smooth' : 'auto'), 160);
  if (ultimaConcluida) {
    const [cc, ui] = ultimaConcluida.split('-').map(Number), tipo = PAISAGEM_TIPO[ui], bio = BIOMAS[cc];
    const nomeArv = Array.isArray(NOMES[bio.principal]) ? NOMES[bio.principal][cc] : NOMES[bio.principal];
    const volta = { arvore: `${nomeArv} voltou`, capim: 'O mato voltou', flores: 'As flores voltaram', passaro: `${NOMES[bio.ave]} voltou`, borboleta: 'As borboletas voltaram' }[tipo];
    const bichoNome = NOMES[bio.bicho], plural = !/^Um/.test(bichoNome);
    const msg = TRILHA_NOS[cc].every((_, i) => feita(cc, i)) ? `${CAP_REGIAO[cc]} completo. ${bichoNome} ${plural ? 'voltaram' : 'voltou'}.` : `${volta} ao ${CAP_REGIAO[cc]}.`;
    setTimeout(() => aviso(msg), 1600);
    setTimeout(() => $$('#rol-trilha .surgiu').forEach((e) => e.classList.remove('surgiu')), 2600);
    ultimaConcluida = null;
  }
}

// ---------- balão do círculo (como no Duolingo: tocar abre um cartão com o botão de começar) ----------
function fecharPop() { $('#pop-no')?.remove(); }
function abrirPop(c, i, b) {
  fecharPop();
  const m = TRILHA_NOS[c][i], f = feita(c, i), p = proximaAt(), agora = p && p[0] === c && p[1] === i, reg = trilha.feitas[chaveAt(c, i)];
  const est = f ? 'feito' : agora ? 'agora' : 'bloq', cap = b.closest('.trilho-cap');
  const W = 350, PW = 290, x = parseFloat(b.style.left), y = parseFloat(b.style.top), H = cap.offsetHeight;
  const left = Math.max(4, Math.min(W - PW - 4, x - PW / 2)), acima = y + 210 > H;
  const sub = m.tipo === 'aula' ? `Aula ${m.j + 1} de ${AULAS[c].a.length} · vídeo de ${duracao(m.aula)}` : m.tipo === 'quiz' ? `Quiz da aula ${m.j + 1} · ${m.aula.q.length} perguntas` : 'Levar o capítulo para a sua vida · sem resposta certa';
  const recorde = m.tipo === 'quiz' && reg && reg.acertos != null ? `<small>Melhor resultado: ${reg.acertos} de ${reg.total} de primeira</small>` : '';
  const rot = m.tipo === 'aula' ? (f ? 'Rever aula' : 'Assistir aula') : m.tipo === 'quiz' ? (f ? 'Refazer quiz' : 'Começar quiz') : (f ? 'Rever' : 'Começar');
  const el = document.createElement('div');
  el.id = 'pop-no'; el.className = `pop-no ${est} t-${m.tipo}${acima ? ' acima' : ''}`; el.dataset.at = `${c}-${i}`;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `${ROTULO_NO[m.tipo]}: ${m.title}`);
  el.style.left = `${left}px`; el.style.top = `${acima ? y - 46 : y + 46}px`; el.style.setProperty('--seta', `${x - left}px`);
  el.innerHTML = `<span class="pop-tipo">${ICO_K[m.tipo]}${ROTULO_NO[m.tipo]}</span><b>${m.title}</b><small>${sub}</small>${recorde}${est === 'bloq'
    ? `<p>${m.tipo === 'quiz' ? 'Assista à aula antes para liberar o quiz.' : m.tipo === 'pratica' ? 'Termine as aulas do capítulo para liberar.' : 'Termine os círculos anteriores para liberar esta aula.'}</p>`
    : `<button type="button" data-abrir="${c}-${i}">${rot}</button>`}`;
  cap.append(el);
  el.querySelector('button')?.focus({ preventScroll: true });
  // rola só a trilha (scrollIntoView também moveria a moldura do celular)
  setTimeout(() => {
    const r = $('#rol-trilha'), rr = r.getBoundingClientRect(), er = el.getBoundingClientRect(), behavior = s.mov ? 'auto' : 'smooth';
    if (er.bottom > rr.bottom - 12) r.scrollBy({ top: er.bottom - rr.bottom + 20, behavior });
    else if (er.top < rr.top + 64) r.scrollBy({ top: er.top - rr.top - 72, behavior });
  }, 260);
}

// ---------- aula (vídeo) e quiz no modelo do Duolingo ----------
let licao = null, ctxSom = null;
const ELOGIOS = ['Muito bem!', 'Isso aí!', 'Correto!', 'Mandou bem!', 'Excelente!', 'Boa!'];
function tom(certo) {   // um toque curto de acerto ou erro, baixinho; segue o botão de som do app
  if (typeof somLigado !== 'undefined' && !somLigado) return;
  try {
    ctxSom ??= new (window.AudioContext || window.webkitAudioContext)();
    (certo ? [659.25, 987.77] : [233.08, 207.65]).forEach((f, k) => {
      const o = ctxSom.createOscillator(), g = ctxSom.createGain(), t = ctxSom.currentTime + k * 0.1;
      o.type = certo ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ctxSom.destination); o.start(t); o.stop(t + 0.32);
    });
  } catch {}
}
function abrirNo(c, i) {
  const m = TRILHA_NOS[c][i];
  abertaAt = [c, i];
  licao = { ...m, i, inicio: Date.now(), prog: 0, assistido: m.tipo === 'aula' && feita(c, i), fase: { aula: 'video', quiz: 'pergunta', pratica: 'pratica' }[m.tipo],
    fila: (m.aula?.q || []).map((_, k) => k), pos: 0, vistas: new Set(), erradas: new Set(), primeira: 0, certas: 0, seguidas: 0, escolha: m.tipo === 'pratica' ? (trilha.feitas[chaveAt(c, i)]?.escolha ?? null) : null };
  fecharPop(); $('#sair-sheet').hidden = true;
  irPara('atividade');
  desenharLicao(false);
}
function barraLicao() {
  if (!licao) return;
  const total = licao.aula?.q.length || 1;
  const pct = licao.fase === 'fim' || licao.fase === 'pratica-ret' ? 100 : licao.tipo === 'pratica' ? (licao.escolha != null ? 50 : 8) : licao.tipo === 'aula' ? Math.round((licao.assistido ? 1 : licao.prog) * 100) : Math.round(((licao.pos + (licao.fase === 'retorno' ? 1 : 0)) / total) * 100);   // avança a cada pergunta respondida
  const b = $('#ativ-barra'); b.setAttribute('aria-valuenow', pct); b.setAttribute('aria-label', licao.tipo === 'aula' ? 'Vídeo assistido' : licao.tipo === 'pratica' ? 'Na prática' : 'Progresso do quiz');
  b.firstElementChild.style.width = `${Math.max(pct, 0)}%`;
}
// troca o conteúdo com o deslize lateral do Duolingo (sai para a esquerda, entra pela direita)
function trocarCorpo(html, animar) {
  const corpo = $('#ativ-corpo');
  const poe = () => { corpo.innerHTML = html; corpo.scrollTop = 0;
    $$('img.v-capa', corpo).forEach((im) => { const tira = () => im.closest('.video-link')?.classList.remove('com-capa'); im.closest('.video-link')?.classList.add('com-capa'); im.addEventListener('error', () => { tira(); im.remove(); }); }); if (animar && !s.mov) { corpo.classList.add('entra'); requestAnimationFrame(() => requestAnimationFrame(() => corpo.classList.remove('entra'))); } ligarVideo(); };
  if (!animar || s.mov) { poe(); return; }
  corpo.classList.add('sai'); setTimeout(() => { corpo.classList.remove('sai'); poe(); }, 170);
}
function desenharLicao(animar) {
  const r = $('#ativ-rodape'); r.className = 'ativ-rodape';
  $('#tela-atividade').dataset.fase = licao.fase;
  $('#tela-atividade').setAttribute('aria-label', { aula: 'Aula', quiz: 'Quiz', pratica: 'Na prática' }[licao.tipo]);
  if (licao.fase === 'video') { trocarCorpo(htmlAula(), animar); rodapeAula(); }
  else if (licao.fase === 'pratica') { trocarCorpo(htmlPratica(), animar); r.innerHTML = `<button class="btn-duo" type="button" id="duo-pratica" ${licao.escolha == null ? 'disabled' : ''}>Continuar</button>`; }
  else if (licao.fase === 'pratica-ret') {
    const pr = licao.pr, plano = pr.kind === 'plan';
    trocarCorpo(htmlPratica(true), false); r.className = 'ativ-rodape pratica';
    r.innerHTML = `<div class="ret" role="status"><div class="ret-cab"><span class="selo">${ICO_K.reflection}</span>${plano ? 'Plano guardado' : 'Anotado'}</div><p class="ret-txt">${pr.feedback}</p><p class="ret-txt levar">Para levar: <b>${pr.takeaway}</b></p>${plano ? '<p class="ret-txt levar">Planejar não é o mesmo que fazer. Quando fizer, tudo bem marcar só para você.</p>' : ''}</div>
      <button class="btn-duo" type="button" id="duo-pratica-ok">Concluir</button>`;
  }
  else if (licao.fase === 'refazer') {
    trocarCorpo(htmlRefazer(), animar);
    r.innerHTML = '<button class="btn-duo" type="button" id="duo-refazer">Refazer o quiz</button><button class="link-duo" type="button" id="duo-rever">Rever a aula antes</button><button class="link-duo" type="button" id="duo-seguir">Seguir mesmo assim</button>';
  }
  else if (licao.fase === 'fim') {
    trocarCorpo(htmlFim(), animar); r.innerHTML = '<button class="btn-duo" type="button" id="duo-fim">Continuar</button>'; setTimeout(contarStats, s.mov ? 0 : 450);
    const { c, i } = licao; setTimeout(() => { const cv = $('#ativ-corpo .fim-cv'); if (cv) destaque(cv, { tipo: PAISAGEM_TIPO[i], c, reduzido: s.mov }); }, animar && !s.mov ? 200 : 0);
  }
  else { trocarCorpo(htmlPergunta(), animar); r.innerHTML = '<button class="btn-duo" type="button" id="duo-verificar" disabled>Verificar</button>'; }
  barraLicao();
  setTimeout(() => $('#ativ-corpo [data-foco]')?.focus({ preventScroll: true }), animar && !s.mov ? 260 : 30);
}
// o player toca dentro do app quando o site permite incorporar (app em Next); no artifact publicado, abre o YouTube no trecho
const VIDEO_EMBUTIDO = (() => { try { if (localStorage.getItem('terraforma:video') === 'link') return false; return location.origin !== 'null' && !/(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname); } catch { return false; } })();
function htmlAula() {
  const a = licao.aula, c = licao.c, orig = location.origin && location.origin !== 'null' ? `&origin=${encodeURIComponent(location.origin)}` : '';
  const ytLink = `https://www.youtube.com/watch?v=${a.v}&t=${a.i}s`;
  const url = `https://www.youtube-nocookie.com/embed/${a.v}?start=${a.i}&end=${a.f}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&cc_load_policy=1&cc_lang_pref=pt&hl=pt-BR${orig}`;
  return `<span class="q-tipo">Aula ${licao.j + 1} de ${AULAS[c].a.length} · ${AULAS[c].n}</span>
    <h3 class="q" tabindex="-1" data-foco>${a.t}</h3>
    ${VIDEO_EMBUTIDO ? `<div class="video"><iframe id="video-aula" src="${url}" title="Vídeo da aula: ${escH(a.t)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    <div class="video-info"><span>Trecho de ${mmss(a.i)} a ${mmss(a.f)} · ${duracao(a)}</span><a href="${ytLink}" target="_blank" rel="noopener">Abrir no YouTube</a></div>`
    : `<a class="video video-link" id="video-link" href="${ytLink}" target="_blank" rel="noopener" aria-label="Assistir a aula no YouTube, a partir de ${mmss(a.i)}">
        <svg class="v-ondas" viewBox="0 0 320 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34Q40 22 80 34T160 34T240 34T320 34V60H0z" fill="#FFFFFF" opacity=".07"/><path d="M0 46Q40 36 80 46T160 46T240 46T320 46V60H0z" fill="#FFFFFF" opacity=".08"/></svg>
        <img class="v-capa" src="${ASSETS}capas/${a.v}.jpg" alt=""><span class="v-veu"></span>
        <span class="v-tempo">${duracao(a)}</span><span class="v-play">${ICO_K.aula}</span>
        <span class="v-rot">Assistir à aula<small>Abre no YouTube já no trecho · ${mmss(a.i)} a ${mmss(a.f)}</small></span></a>
    <div class="video-info"><span>Quando o trecho acabar, volte aqui para fazer o quiz.</span></div>`}
    <div class="depois"><span class="ico">${ICO_K.quiz}</span><span><b>Depois do vídeo, um quiz</b><small>${a.q.length} perguntas sobre esta aula</small></span></div>
    <p class="nota-ativ">Conteúdo educativo, não é consultoria financeira. As legendas do YouTube abrem ligadas quando o vídeo tem.</p>`;
}
function rodapeAula() {
  $('#ativ-rodape').innerHTML = licao.assistido
    ? '<p class="assistido">✓ Aula assistida</p><button class="btn-duo" type="button" id="duo-ok">Continuar</button>'
    : '<button class="btn-duo" type="button" id="duo-ok" disabled>Continuar</button><button class="link-duo" type="button" id="duo-pular">Já assisti</button>';
}
function marcarAssistido() {
  if (!licao || licao.fase !== 'video' || licao.assistido) return;
  licao.assistido = true; rodapeAula(); barraLicao();
  const b = $('#duo-ok'); b.classList.add('pulsa');
}
// ouve o player do YouTube pela API de mensagens do iframe (sem carregar script de fora)
function ligarVideo() {
  const f = $('#video-aula'); if (!f) return;
  const ping = () => { try {
    f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'aula', channel: 'widget' }), '*');
    f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: 'aula', channel: 'widget' }), '*');
  } catch {} };
  f.addEventListener('load', () => { ping(); setTimeout(ping, 1000); });
}
addEventListener('message', (e) => {
  if (!licao || licao.fase !== 'video' || !/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
  let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
  const info = d && d.info, a = licao.aula; if (info == null) return;
  if (typeof info.currentTime === 'number') { licao.prog = Math.max(licao.prog, Math.min(1, (info.currentTime - a.i) / (a.f - a.i))); barraLicao(); }
  if (info.playerState === 0 || info === 0 || licao.prog >= 0.97) marcarAssistido();
});
function htmlPergunta() {
  const a = licao.aula, qi = licao.fila[licao.pos], q = a.q[qi], vf = q.o.length === 2, revisao = licao.vistas.has(qi);
  licao.vistas.add(qi); licao.escolha = null;
  const combo = licao.seguidas >= 2 ? `<span class="combo">${licao.seguidas} seguidas!</span>` : '';
  return `${combo}<span class="q-tipo${revisao ? ' revisao' : ''}">Pergunta ${licao.pos + 1} de ${a.q.length} · ${vf ? 'Verdadeiro ou falso?' : 'Escolha a resposta certa'}</span>
    <h3 class="q" id="q-texto" tabindex="-1" data-foco>${q.p}</h3>
    <ul class="alts${vf ? ' vf' : ''}" role="radiogroup" aria-labelledby="q-texto">${q.o.map((t, k) =>
      `<li><button type="button" role="radio" class="alt" data-alt="${k}" aria-checked="false"><span class="tecla" aria-hidden="true">${k + 1}</span><span>${t}</span></button></li>`).join('')}</ul>`;
}
function escolher(k) {
  if (!licao || (licao.fase !== 'pergunta' && licao.fase !== 'pratica')) return;
  const b = $(`#ativ-corpo [data-alt="${k}"]`); if (!b) return;
  licao.escolha = k;
  $$('#ativ-corpo [data-alt]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  ($('#duo-verificar') || $('#duo-pratica')).disabled = false; barraLicao();
}
function htmlPratica(travada) {
  const pr = licao.pr, c = licao.c, plano = pr.kind === 'plan';
  return `<span class="q-tipo pratica">Na prática · ${plano ? 'um plano para você' : 'sem resposta certa'}</span>
    <h3 class="q" id="q-texto" tabindex="-1" data-foco>${pr.prompt}</h3>
    <p class="nota-ativ" style="margin-top: -4px">${AULAS[c].n} · depois das aulas, o que muda na sua vida? Sua resposta fica só com você.</p>
    <ul class="alts${travada ? ' travada' : ''}" role="radiogroup" aria-labelledby="q-texto">${pr.options.map((t, k) =>
      `<li><button type="button" role="radio" class="alt${travada && k === licao.escolha ? ' certa' : ''}" data-alt="${k}" aria-checked="${k === licao.escolha}" ${travada ? 'aria-disabled="true"' : ''}><span class="tecla" aria-hidden="true">${k + 1}</span><span>${t}</span></button></li>`).join('')}</ul>`;
}
function verificar() {
  if (!licao || licao.fase !== 'pergunta' || licao.escolha == null) return;
  const qi = licao.fila[licao.pos], q = licao.aula.q[qi], certo = licao.escolha === q.r;
  licao.fase = 'retorno';
  if (certo) { if (!licao.erradas.has(qi)) licao.primeira++; licao.certas++; licao.seguidas++; }
  else { licao.erradas.add(qi); licao.seguidas = 0; }   // são sempre as 6 perguntas da aula; a errada mostra a resposta certa e segue
  $('#ativ-corpo .alts').classList.add('travada');
  $$('#ativ-corpo [data-alt]').forEach((x) => { x.setAttribute('aria-disabled', 'true'); const k = +x.dataset.alt;
    if (k === licao.escolha) x.classList.add(certo ? 'certa' : 'errada'); if (!certo && k === q.r) x.classList.add('indicada'); });
  tom(certo); barraLicao();
  const r = $('#ativ-rodape'); r.className = `ativ-rodape ${certo ? 'certo' : 'errado'}`;
  const sel = certo ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  r.innerHTML = `<div class="ret" role="status"><div class="ret-cab"><span class="selo">${sel}</span>${certo ? ELOGIOS[licao.pos % ELOGIOS.length] : 'Não foi dessa vez'}</div>
      ${certo ? '' : `<p class="ret-certa"><b>Resposta certa:</b> ${q.o[q.r]}</p>`}<p class="ret-txt">${q.e}</p></div>
    <button class="btn-duo${certo ? '' : ' vermelho'}" type="button" id="duo-continuar">Continuar</button>`;
  $('#duo-continuar').focus({ preventScroll: true });
}
function seguirQuiz() {
  licao.pos++;
  if (licao.pos >= licao.fila.length) { concluirNo(); return; }
  licao.fase = 'pergunta'; desenharLicao(true);
}
const MAX_ERROS = 3;   // errou 4 ou mais das 6 (mais da metade): sugere refazer, mas a pessoa pode seguir (sem punição)
function concluirNo() {
  if (licao.tipo === 'quiz' && licao.erradas.size > MAX_ERROS && !licao.seguirMesmo) {
    licao.tempo = (Date.now() - licao.inicio) / 1000; licao.fase = 'refazer'; desenharLicao(true); return;
  }
  const { c, i, tipo, aula } = licao, k = chaveAt(c, i), antes = trilha.feitas[k];
  if (tipo === 'pratica') {   // guarda a escolha, sem certo ou errado
    licao.nova = !antes; licao.tempo = (Date.now() - licao.inicio) / 1000;
    trilha.feitas[k] = { em: antes?.em || new Date().toISOString(), escolha: licao.escolha }; guardarTrilha(); sincronizarTrilhaConta();
    if (licao.nova) { ultimaConcluida = k; emitirTrilha?.({ capitulo: c, indice: i, modulo: AULAS[c].id, aula: null, tipo, escolha: licao.escolha }); }
    licao.fase = 'fim'; desenharLicao(true); return;
  }
  licao.nova = !antes; licao.tempo = (Date.now() - licao.inicio) / 1000;
  const reg = { em: new Date().toISOString() };
  if (tipo === 'quiz') { reg.acertos = Math.max(licao.primeira, antes?.acertos ?? 0); reg.total = aula.q.length; }
  trilha.feitas[k] = antes ? { ...antes, ...(tipo === 'quiz' ? { acertos: reg.acertos, total: reg.total } : {}) } : reg;
  guardarTrilha(); sincronizarTrilhaConta();
  if (licao.nova) {
    ultimaConcluida = k;
    emitirTrilha?.({ capitulo: c, indice: i, modulo: AULAS[c].id, aula: aula.id, tipo, acertos: tipo === 'quiz' ? licao.primeira : null, total: tipo === 'quiz' ? aula.q.length : null });
  }
  licao.fase = 'fim'; desenharLicao(true);
}
function htmlRefazer() {
  const total = licao.aula.q.length, certas = total - licao.erradas.size;
  return `<div class="fim-licao refazer">
    <div class="refazer-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg></div>
    <h3 tabindex="-1" data-foco>Vamos tentar de novo</h3>
    <p>Você acertou ${certas} de ${total}. Rever a aula ajuda a fixar. Você pode refazer agora ou seguir e voltar depois.</p>
    <div class="stats dois"><div class="stat acertos"><small>Acertos</small><b>${certas} de ${total}</b></div><div class="stat tempo"><small>Tempo</small><b>${mmss(licao.tempo)}</b></div></div>
    <p class="fim-nota">Errar aqui não tira nada do seu planeta.</p>
  </div>`;
}
function htmlFim() {
  const { c, i, tipo, aula, j } = licao, N = TRILHA_NOS[c].length, tipoP = PAISAGEM_TIPO[i], fa = FAUNA.has(tipoP);
  const total = aula?.q.length || 1, pct = Math.round((licao.primeira / total) * 100), capFeito = TRILHA_NOS[c].every((_, k) => feita(c, k));
  const titulo = tipo === 'aula' ? 'Aula concluída!' : tipo === 'pratica' ? (licao.pr.kind === 'plan' ? 'Plano guardado!' : 'Reflexão guardada!') : licao.primeira === total ? 'Quiz perfeito!' : 'Quiz concluído!';
  const sub = capFeito && licao.nova ? `Capítulo do ${CAP_REGIAO[c]} completo. A paisagem voltou inteira.`
    : tipo === 'aula' ? 'O quiz desta aula está liberado.' : tipo === 'pratica' ? 'O que você aprendeu agora vira um passo seu.' : i + 1 < N - 1 ? 'A próxima aula está liberada.' : 'Falta só o "Na prática" deste capítulo.';
  const nome = { arvore: { araucaria: 'Araucária', folhosa: 'Árvore', ipe: 'Ipê', mandacaru: 'Mandacaru' }[BIOMAS[c].principal], capim: 'Arbusto', flores: 'Flores', passaro: { gralha: 'Gralha-azul', tucano: 'Tucano', caninde: 'Arara', asabranca: 'Asa-branca', arara: 'Arara' }[BIOMAS[c].ave], borboleta: 'Borboletas' }[tipoP];
  const stats = [
    tipo === 'quiz' ? ['acertos', 'Acertos', `<span data-conta="${pct}" data-suf="%">${s.mov ? pct + '%' : '0%'}</span>`] : tipo === 'pratica' ? ['acertos', 'Tipo', licao.pr.kind === 'plan' ? 'Plano' : 'Reflexão'] : ['acertos', 'Vídeo', duracao(aula)],
    ['tempo', 'Tempo', mmss(licao.tempo)],
    ['vida', 'Paisagem', `${fa ? ICO_FAUNA : ICO_FLORA}${licao.nova ? nome : '✓'}`],
  ];
  return `<div class="fim-licao">
    <div class="fim-arte" aria-hidden="true"><canvas class="fim-cv"></canvas></div>
    <h3 tabindex="-1" data-foco>${titulo}</h3>
    <p>${sub}</p>
    <div class="stats">${stats.map(([k, rot, val]) => `<div class="stat ${k}"><small>${rot}</small><b>${val}</b></div>`).join('')}</div>
    ${tipo === 'quiz' ? `<p class="fim-nota">Você acertou ${licao.primeira} de ${total} perguntas.</p>` : tipo === 'pratica' ? `<p class="fim-nota">Para levar: ${licao.pr.takeaway}</p>` : `<p class="fim-nota">${AULAS[c].n} · aula ${j + 1} de ${AULAS[c].a.length}</p>`}
  </div>`;
}
function contarStats() {
  $$('#ativ-corpo [data-conta]').forEach((el) => {
    const alvo = +el.dataset.conta, suf = el.dataset.suf || '', t0 = performance.now();
    if (s.mov) { el.textContent = alvo + suf; return; }
    const passo = (t) => { const f = Math.min(1, (t - t0) / 700); el.textContent = Math.round(alvo * (1 - Math.pow(1 - f, 3))) + suf; if (f < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  });
}
// recomeça direto, sem voltar à trilha (a tela já é a de atividade)
function abrirLicaoDeNovo(c, i) {
  const m = TRILHA_NOS[c][i];
  abertaAt = [c, i];
  licao = { ...m, i, inicio: Date.now(), prog: 0, assistido: m.tipo === 'aula' && feita(c, i), fase: { aula: 'video', quiz: 'pergunta', pratica: 'pratica' }[m.tipo],
    fila: (m.aula?.q || []).map((_, k) => k), pos: 0, vistas: new Set(), erradas: new Set(), primeira: 0, certas: 0, seguidas: 0, escolha: m.tipo === 'pratica' ? (trilha.feitas[chaveAt(c, i)]?.escolha ?? null) : null };
  desenharLicao(true);
}
function sairLicao() { $('#sair-sheet').hidden = true; licao = null; abertaAt = null; irPara('trilha'); }
function pedirSaida() {
  const emAndamento = licao && licao.tipo === 'quiz' && (licao.fase === 'pergunta' || licao.fase === 'retorno') && (licao.pos > 0 || licao.escolha != null || licao.fase === 'retorno');
  if (!emAndamento) { sairLicao(); return; }
  $('#sair-sheet').hidden = false; $('#sair-ficar').focus({ preventScroll: true });
}

function capituloVisivel() {
  const r = $('#rol-trilha'), meio = r.scrollTop + r.clientHeight * 0.5;
  let k = 0; $$('#rol-trilha .capitulo').forEach((el) => { if (el.offsetTop <= meio) k = +el.dataset.c; }); return k;
}
$('#rol-trilha').addEventListener('scroll', () => { $('#chip-regiao-nome').textContent = CAP_REGIAO[capituloVisivel()]; }, { passive: true });
// o capítulo começa embaixo: rola até o fim dele
function irAoCapitulo(k, suave = !s.mov) { const el = $(`#rol-trilha .capitulo[data-c="${k}"]`), r = $('#rol-trilha'); if (el) r.scrollTo({ top: Math.max(0, el.offsetTop + el.offsetHeight - r.clientHeight), behavior: suave ? 'smooth' : 'auto' }); }
function abrirListaRegioes(abrir) {
  const l = $('#menu-regioes'), atual = capituloVisivel();
  l.hidden = !abrir; $('#chip-regiao').setAttribute('aria-expanded', String(abrir));
  if (abrir) { l.innerHTML = TRILHA_NOS.map((cap, c) => `<button type="button" data-cap="${c}" aria-current="${c === atual}"><span><b>${CAP_REGIAO[c]}</b><small>${AULAS[c].n}</small></span><span class="n">${cap.filter((_, i) => feita(c, i)).length}/${cap.length}</span></button>`).join(''); l.querySelector('[aria-current="true"]').focus({ preventScroll: true }); }
}
let capAoChegar = null;
function subirAoPlaneta() {
  const k = capituloVisivel();
  abrirListaRegioes(false); irPara('inicio', { sem: true });
  if (!globo || s.mov) return;
  globo.focarRegiao(k);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    globo.irPara({ cx: app.clientWidth / 2, cy: app.clientHeight * 0.46, r: 4500, opacidade: 1 }, 0);
    saidaDoMar = true; moverGlobo('inicio', 1700);
  }));
}
$('#tela-trilha').addEventListener('click', (e) => {
  if (e.target.closest('#subir-planeta')) { subirAoPlaneta(); return; }
  if (e.target.closest('#chip-regiao')) { abrirListaRegioes($('#menu-regioes').hidden); return; }
  const cp = e.target.closest('[data-cap]'); if (cp) { abrirListaRegioes(false); irAoCapitulo(+cp.dataset.cap); return; }
  if (!$('#menu-regioes').hidden) abrirListaRegioes(false);
  const ab = e.target.closest('[data-abrir]'); if (ab) { const [c, i] = ab.dataset.abrir.split('-').map(Number); abrirNo(c, i); return; }
  const px = e.target.closest('#proxima [data-at]'); if (px) { const [c, i] = px.dataset.at.split('-').map(Number); abrirNo(c, i); return; }
  const b = e.target.closest('.no[data-at]');
  if (b) { const [c, i] = b.dataset.at.split('-').map(Number); if ($('#pop-no')?.dataset.at === b.dataset.at) fecharPop(); else abrirPop(c, i, b); return; }
  if (!e.target.closest('#pop-no')) fecharPop();
});
$('#tela-atividade').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('#ativ-fechar')) { pedirSaida(); return; }
  if (t.closest('#sair-ficar')) { $('#sair-sheet').hidden = true; return; }
  if (t.closest('#sair-sim')) { sairLicao(); return; }
  if (!licao) return;
  const o = t.closest('[data-alt]'); if (o) { escolher(+o.dataset.alt); return; }
  if (t.closest('#duo-verificar')) { verificar(); return; }
  if (t.closest('#duo-continuar')) { seguirQuiz(); return; }
  if (t.closest('#duo-pular')) { marcarAssistido(); return; }
  if (t.closest('#video-link')) { setTimeout(marcarAssistido, 1200); return; }   // abriu o vídeo no YouTube: ao voltar, o Continuar já está liberado
  if (t.closest('#duo-ok') && licao.assistido) { concluirNo(); return; }
  if (t.closest('#duo-fim')) { sairLicao(); return; }
  if (t.closest('#duo-refazer')) { const { c, i } = licao; abrirLicaoDeNovo(c, i); return; }
  if (t.closest('#duo-seguir')) { licao.seguirMesmo = true; concluirNo(); return; }
  if (t.closest('#duo-pratica') && licao.escolha != null) { licao.fase = 'pratica-ret'; desenharLicao(false); $('#duo-pratica-ok')?.focus({ preventScroll: true }); return; }
  if (t.closest('#duo-pratica-ok')) { concluirNo(); return; }
  if (t.closest('#duo-rever')) { const { c, i } = licao; abrirLicaoDeNovo(c, i - 1); return; }
});
// teclado como no Duolingo: 1–4 escolhem, Enter verifica e continua
addEventListener('keydown', (e) => {
  if (telaAtual !== 'atividade' || !licao || e.target.closest?.('input, textarea, select')) return;
  if (e.key === 'Escape') { if (!$('#sair-sheet').hidden) $('#sair-sheet').hidden = true; else pedirSaida(); return; }
  if (!$('#sair-sheet').hidden) return;
  if (/^[1-4]$/.test(e.key) && (licao.fase === 'pergunta' || licao.fase === 'pratica')) { escolher(+e.key - 1); e.preventDefault(); return; }
  if (e.key === 'Enter' && !e.target.closest?.('button, a')) {
    const b = $('#duo-verificar:not([disabled]), #duo-continuar, #duo-ok:not([disabled]), #duo-fim, #duo-pratica:not([disabled]), #duo-pratica-ok'); if (b) { b.click(); e.preventDefault(); }
  }
});
var emitirTrilha = (d) => __evento('trilha_' + d.tipo, d);   // o app em Next liga isto ao backend
definirAtivo(() => telaAtual === 'trilha');


// ---------- Luneta: comunidade anônima ----------
// Cada pessoa aparece como um planeta (cor + número), nunca com nome, foto ou valores. Posts e conversas desta demo são fictícios.
// "Me identifico" no lugar de curtida; sem seguidores, sem ranking. A moderação bloqueia links, valores, telefones e casas de aposta,
// e o Guardião (moderação automática) entra na conversa quando algo parece risco, sempre apontando para a Ajuda.
const CONSTELACOES = { vontade: 'Vontade agora', primeiros: 'Primeiros dias', dividas: 'Dívidas', familia: 'Família', tempestades: 'Tempestades', conquistas: 'Conquistas' };
const PLANETAS = { 'Turquesa-27': ['#1D9E75', 34], 'Âmbar-08': ['#EF9F27', 12], 'Índigo-33': ['#534AB7', 20], 'Areia-19': ['#C8B48A', null], 'Jade-02': ['#3B6D11', 90], 'Lilás-41': ['#AFA9EC', 3], 'Coral-15': ['#D85A30', 61] };
const POSTS_DEMO = [
  { id: 'p0', fixo: true, quem: 'Moderação', c: null, t: 'Aqui você é um planeta, sem nome nem foto. Conte como está e o que ajudou. Sem links, valores, telefones ou casas de aposta.', id_: 0, r: [] },
  { id: 'p1', quem: 'Turquesa-27', c: 'vontade', h: '20 min', t: 'Sexta à noite ainda é difícil. Ontem fiz duas Marés seguidas e a vontade passou.', id_: 18, r: [['Coral-15', 'Sexta também é meu dia mais difícil. Combinei de jantar com um amigo nesse horário.'], ['Lilás-41', 'Duas Marés seguidas, vou tentar isso hoje.'], ['Jade-02', 'No começo a sexta era a pior para mim também. Melhora. Não some daqui.']] },
  { id: 'p2', quem: 'Índigo-33', c: 'tempestades', h: '1 h', t: 'Apostei ontem depois de 20 dias. Pensei em sumir do app, mas vim contar. O planeta não secou de novo, e isso me ajudou a voltar.', id_: 31, r: [['Turquesa-27', 'Obrigado por contar. Ler isso me dá coragem de voltar se acontecer comigo.'], ['Jade-02', 'Eu tive três tempestades no caminho. Nenhuma apagou o que eu tinha feito.']] },
  { id: 'p3', quem: 'Âmbar-08', c: 'dividas', h: '2 h', t: 'Liguei para negociar o cartão hoje. Deu medo, mas consegui parcelar.', id_: 24, r: [['Lilás-41', 'Que coragem. Qual foi a primeira frase que você usou?'], ['Âmbar-08', 'Copiei o texto pronto da aba Dívidas e fui lendo devagar.']] },
  { id: 'p4', quem: 'Areia-19', c: 'familia', h: '3 h', familiar: true, t: 'Meu pai está no começo. Como vocês gostariam que a família falasse com vocês sem virar briga?', id_: 9, r: [['Jade-02', 'O que mais me ajudou: minha esposa perguntar como eu estava, não quanto eu tinha perdido.'], ['Âmbar-08', 'Combinar um horário fixo para falar de dinheiro, longe do calor da discussão.']] },
  { id: 'p5', quem: 'Jade-02', c: 'conquistas', h: '5 h', t: '90 dias hoje. O Norte voltou. Domingo joguei bola com meu filho sem o celular no bolso.', id_: 52, r: [['Turquesa-27', 'Que bonito. Guardei para ler na sexta.']] },
  { id: 'p6', quem: 'Lilás-41', c: 'primeiros', h: 'ontem', t: 'Terceiro dia. Apaguei os aplicativos e pedi para minha irmã ficar com o cartão por um tempo. Estranho, mas leve.', id_: 15, r: [['Coral-15', 'Pedir para alguém segurar o cartão foi o que mais me ajudou também.']] },
  { id: 'p7', quem: 'Coral-15', c: 'vontade', h: 'ontem', t: 'Os anúncios no intervalo do futebol me pegam. Alguém conseguiu fugir disso?', id_: 11, r: [['Turquesa-27', 'Eu deixo o celular em outro cômodo durante o jogo.'], ['Âmbar-08', 'Na aba Barreiras, em Finanças, tem a parte do bloqueador.']] },
];
// pergunta da semana (como os "tópicos diários" do Reddit): dá um jeito fácil de participar sem expor nada
const PERGUNTA = { id: 'q1', pergunta: true, quem: 'Moderação', c: null, h: 'esta semana', t: 'O que você faz agora na sexta à noite, no lugar da aposta?', id_: 0,
  r: [['Turquesa-27', 'Janta com meu irmão. Celular fica na mochila.'], ['Coral-15', 'Futebol de várzea. Jogar em vez de assistir.'], ['Lilás-41', 'Ainda estou descobrindo. Ontem foi série com a minha irmã.'], ['Jade-02', 'Caminhada com o cachorro e a Roda das 21h aqui.']] };
// marco de outra pessoa: um toque para mandar força, sem precisar escrever
const MARCO = { quem: 'Jade-02', dias: 90, regiao: 'Norte', forca: 23 };
const CONVERSAS = {
  roda: { tit: 'Roda das sextas, 21h', sub: 'Sua região · com moderação', ic: ['#EEEDFE', '#3C3489'], quando: '21:04', novas: 3,
    msgs: [['dia', 'Hoje'], ['g', 'Lembrete da roda: aqui vale contar como você está. Sem links, valores ou nomes de casas de aposta. Se alguém estiver em risco, a Ajuda fica no menu.'], ['Coral-15', 'Cheguei. Hoje tá pesado, tem jogo às 21h30.'], ['Turquesa-27', 'Tô aqui também. Bora fazer uma Maré juntos às 21h25?'], ['Jade-02', 'Eu topo. Depois conto como foi.']],
    respostas: [['Turquesa-27', 'Valeu por escrever. Tamo junto nessa sexta.'], ['Coral-15', 'Bom te ver aqui. Vai fazer a Maré com a gente?'], ['Jade-02', 'Isso que você escreveu já é um passo.']],
    rapidas: ['Estou com vontade agora', 'Consegui hoje', 'Só passando para ler'] },
  par: { tit: 'Coral-15', sub: 'Companheiro de trilha · 61 dias', ic: ['#FAECE7', '#993C1D'], quando: 'ontem', novas: 0, planeta: 'Coral-15',
    msgs: [['dia', 'Ontem'], ['g', 'Vocês combinaram de se falar às sextas, antes das 21h. Qualquer um dos dois pode encerrar a dupla quando quiser.'], ['Coral-15', 'E aí, como foi a semana?'], ['eu', 'Quinta foi difícil, mas fiz a Maré e passou.'], ['Coral-15', 'Boa! Amanhã é sexta. Me chama se apertar.']],
    respostas: [['Coral-15', 'Tô por aqui. Quer fazer uma Maré junto?'], ['Coral-15', 'Que bom que você escreveu. Me conta mais.']],
    rapidas: ['Apertou agora', 'Consegui hoje', 'Obrigado por ontem'] },
};
let lun = { aba: 'mural', filtro: 'tudo', ident: {}, denun: {}, meus: [], resp: {}, msgs: {}, planeta: null };
try { const v = JSON.parse(localStorage.getItem('terraforma:luneta')); if (v) lun = { ...lun, ...v, aba: 'mural', filtro: 'tudo' }; } catch {}
const guardarLun = () => { try { const { aba, filtro, ...resto } = lun; localStorage.setItem('terraforma:luneta', JSON.stringify(resto)); } catch {} };
let fioAberto = null, convAberta = null, constEscolhida = 'vontade';
// conversas reais (back NestJS, só com conta). Ids na tela: 'api:<id do chat>'
let conversasApi = null, carregandoConversas = false, erroConversas = '', convApi = null, avisosConv = {}, relogioConv = null, enviandoConv = false;
const ehApi = (id) => typeof id === 'string' && id.startsWith('api:');
const RAPIDAS_API = ['Estou com vontade agora', 'Consegui hoje', 'Obrigado por estar aqui'];
const horaCurta = (iso) => { const d = new Date(iso), hoje = new Date().toDateString() === d.toDateString();
  return hoje ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
async function carregarConversas() {
  if (!B || !conta || carregandoConversas) return;
  carregandoConversas = true;
  try { conversasApi = (await B.listarConversas()).itens; erroConversas = ''; }
  catch (err) { erroConversas = err.message; }
  finally { carregandoConversas = false; }
  if (telaAtual === 'luneta' && lun.aba === 'conversas') { lunTopo = false; desenharLuneta(); }
}
function blocoConversasApi() {
  if (!conta) return `<p class="sec-conv">Pessoas reais</p><div class="par-cartao"><b>Converse com quem você conhece</b><p>Com uma conta, você chama outras pessoas pelo nome de usuário. Ninguém vê seu e-mail.</p><button type="button" id="conv-entrar">Entrar ou criar conta</button></div>`;
  const lista = conversasApi == null ? `<p class="regra-lun">${erroConversas ? esc(erroConversas) : 'Carregando suas conversas…'}</p>`
    : conversasApi.length ? `<div class="lista-conv">${conversasApi.map((c) => { const outros = c.membros.filter((m) => m.id !== conta.id);
      return `<button type="button" class="conv-item" data-conv="api:${esc(c.id)}"><span class="ic" style="background: var(--sup)"><span class="av-pl" style="width: 26px; height: 26px; background: ${corUsuario(outros[0]?.username || c.titulo)}"></span></span><span><b>${esc(c.titulo)}</b><small>${outros.length + 1} pessoas · ${esc(outros.map((m) => '@' + m.username).join(', '))}</small></span><span class="hora">${horaCurta(c.updatedAt)}</span></button>`; }).join('')}</div>`
    : '<p class="regra-lun">Você ainda não tem conversas. Chame alguém pelo nome de usuário.</p>';
  return `<p class="sec-conv">Suas conversas</p>${lista}
    <form class="nova-conv" id="nova-conv" autocomplete="off" novalidate><label for="nova-conv-user">Conversar com</label><div class="linha"><input id="nova-conv-user" autocapitalize="none" spellcheck="false" maxlength="200" placeholder="nome de usuário" aria-describedby="dica-nova-conv"><button type="submit">Começar</button></div><p class="regra-lun" id="dica-nova-conv">Para um grupo, separe os nomes por vírgula.</p><p class="erro-conv" id="erro-nova-conv" role="alert"></p></form>`;
}
async function abrirConversaApi(id) {
  convAberta = 'api:' + id; if (convApi?.id !== id) convApi = null;
  irPara('conversa'); desenharConversa(); await atualizarConversaApi();
  clearInterval(relogioConv);
  // sem WebSocket no back: busca mensagens novas a cada 5 s enquanto a conversa estiver aberta
  relogioConv = setInterval(() => { if (telaAtual !== 'conversa' || !ehApi(convAberta) || !conta) { clearInterval(relogioConv); relogioConv = null; return; } atualizarConversaApi(); }, 5000);
}
async function atualizarConversaApi() {
  const id = convAberta.slice(4);
  try { const c = await B.abrirConversa(id); if (convAberta !== 'api:' + id) return;
    const mudou = !convApi || convApi.mensagens.length !== c.mensagens.length || convApi.mensagens.at(-1)?.id !== c.mensagens.at(-1)?.id;
    convApi = c; if (mudou && telaAtual === 'conversa') desenharConversa(); }
  catch (err) { if (err.status === 404) { aviso('Essa conversa não existe mais.'); conversasApi = null; lun.aba = 'conversas'; irPara('luneta'); } }
}
var emitirLuneta = (d) => __evento('luneta_' + d.tipo, d);   // o app em Next liga isto ao backend
// o planeta da pessoa: nome e cor escolhidos por ela; o padrão é sorteado uma vez e não muda com os dias
if (!lun.planeta) { lun.planeta = { nome: 'Verde-' + String(10 + Math.floor(Math.random() * 89)), cor: '#639922' }; guardarLun(); }
const euNome = () => 'Planeta ' + lun.planeta.nome;
const corDe = (q) => q === 'eu' ? lun.planeta.cor : (PLANETAS[q] || ['#B4B2A9'])[0];
// conversas reais: cada nome de usuário ganha sempre a mesma cor da paleta dos planetas
const CORES_USUARIO = Object.values(PLANETAS).map(([c]) => c);
const corUsuario = (nome) => { let h = 0; for (const ch of String(nome)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CORES_USUARIO[h % CORES_USUARIO.length]; };
const CORES_PL = [['#639922', 'Verde'], ['#1D9E75', 'Turquesa'], ['#378ADD', 'Azul'], ['#534AB7', 'Índigo'], ['#D4537E', 'Rosa'], ['#D85A30', 'Coral'], ['#EF9F27', 'Âmbar'], ['#888780', 'Cinza']];
const NOMES_PL = ['Ipê', 'Girassol', 'Jatobá', 'Seriema', 'Aurora', 'Maré Calma', 'Cerrado', 'Vagalume', 'Sabiá', 'Pitanga', 'Brisa', 'Araucária', 'Bem-te-vi', 'Orvalho', 'Jabuticaba', 'Lua Cheia'];
let rascunhoPl = null;
function checarNome(n) {
  const t = n.trim(), outros = Object.keys(PLANETAS).map((k) => k.toLowerCase());
  return [
    ['De 3 a 18 letras', t.length < 3 || t.length > 18],
    ['Sem @, links ou telefone', /[@#]|https?:|www\.|\.com|\d{4,}/i.test(t)],
    ['Sem casas de aposta', MODERACAO[3][2].test(t)],
    ['Nome livre', outros.includes(t.toLowerCase()) || t.toLowerCase() === 'moderação' || /guardi/i.test(t)],
  ];
}
function abrirPlaneta() {
  rascunhoPl = { ...lun.planeta };
  $('#folha-planeta').hidden = false; $('#txt-planeta').value = rascunhoPl.nome;
  $('#cores-pl').innerHTML = CORES_PL.map(([c, n]) => `<button type="button" role="radio" data-cor-pl="${c}" aria-label="${n}" aria-checked="${c === rascunhoPl.cor}" style="background: ${c}"></button>`).join('');
  rascunhoPl.regiao = lun.regiao; $('#mostrar-dias').checked = lun.mostrarDias; desenharBloqueados();
  $('#regiao-pl').innerHTML = REGIOES_LUN.map((r, k) => `<button type="button" role="radio" data-reg-pl="${k}" aria-checked="${k === lun.regiao}">${r[0]}</button>`).join('');
  sortearSugestoes(); atualizarPlaneta();
  setTimeout(() => $('#txt-planeta').select(), 60);
}
function sortearSugestoes() {
  const emb = [...NOMES_PL].sort(() => Math.random() - 0.5).slice(0, 5);
  $('#sugestoes-pl').innerHTML = emb.map((n) => `<button type="button" data-sug="${n}">${n}</button>`).join('') + '<button type="button" id="sortear-pl">Sortear outros</button>';
}
function atualizarPlaneta() {
  const n = $('#txt-planeta').value, ch = checarNome(n);
  rascunhoPl.nome = n.trim();
  $('#previa-bola').style.background = rascunhoPl.cor; $('#previa-nome').textContent = 'Planeta ' + (rascunhoPl.nome || '…');
  $('#checagem-pl').innerHTML = ch.map(([rot, b]) => `<li class="${b ? 'bloq' : ''}">${rot === 'Nome livre' && b ? 'Esse nome já existe' : rot}</li>`).join('');
  $('#salvar-planeta').disabled = ch.some(([, b]) => b);
}
function abrirAcoes(id) {
  postAcoes = id; const p = todosPosts().find((x) => x.id === id);
  $('#acao-bloquear-tit').textContent = `Bloquear Planeta ${p.quem}`;
  $('#acao-denunciar').hidden = !!lun.denun[id];
  $('#folha-acoes').hidden = false; setTimeout(() => $('#folha-acoes .op-apoio:not([hidden])')?.focus(), 60);
}
function desenharBloqueados() {
  const b = Object.keys(lun.bloq).filter((k) => lun.bloq[k]);
  $('#bloqueados-pl').innerHTML = b.length ? `<div class="bloq-lista"><p>Planetas bloqueados</p>${b.map((q) => `<button type="button" data-desbloq="${q}"><span>Planeta ${q}</span><span>Desbloquear</span></button>`).join('')}</div>` : '';
}
function fecharPlaneta() { $('#folha-planeta').hidden = true; $('#eu-planeta').focus(); }
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// moderação (protótipo): o que bloqueia a publicação e o que pede cuidado
const MODERACAO = [
  ['link', 'Sem links', /(https?:\/\/|www\.|\.com\b|\.br\b|\.bet\b|\.net\b)/i],
  ['valor', 'Sem valores em dinheiro', /(r\$\s*\d|\d[\d.,]*\s*(reais|conto|mil\b|k\b)|\$\s*\d)/i],
  ['tel', 'Sem telefone', /(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4})/],
  ['casa', 'Sem casas de aposta', /(\bbet\w*|cassino|casino|tigrinho|\bodds?\b|palpite|bônus de aposta|bonus de aposta)/i],
];
const CRISE = /(me matar|suic|não aguento mais|nao aguento mais|quero sumir|quero morrer|acabar com tudo|tirar minha vida|sem saída|sem saida)/i;
function checar(txt) { return MODERACAO.map(([k, rot, re]) => [k, rot, re.test(txt)]); }
function cartaoCrise() {
  return `<div class="crise" role="alert"><b>Parece que está muito pesado agora.</b><span>Você não precisa passar por isso sozinho. O CVV atende 24 horas pelo 188, de graça. Se houver risco imediato, ligue 192 (SAMU).</span>
    <div class="bts"><a class="ligar" href="tel:188">Ligar 188</a><button type="button" class="sec" data-ir="ajuda">Abrir Ajuda</button><button type="button" class="sec" data-ir="mare">Respirar com a Terra</button></div></div>`;
}
const ICO_IDENT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(-20 12 12)" fill="none"/></svg>';
const ICO_RESP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>';
function todosPosts() { return [POSTS_DEMO[0], ...lun.meus, ...POSTS_DEMO.slice(1), PERGUNTA]; }
const NOVATOS = new Set(['Lilás-41']);
// regiões da trilha viram rodas: conversar com quem está perto, mas só pela região (nunca cidade)
const REGIOES_LUN = [['Sul', '#3B6D11', '#EAF3DE', 'Araucárias', 6], ['Sudeste', '#0F6E56', '#E1F5EE', 'Mata Atlântica', 11], ['Centro-Oeste', '#BA7517', '#FAEEDA', 'Cerrado', 7], ['Nordeste', '#D85A30', '#FAECE7', 'Caatinga', 9], ['Norte', '#085041', '#E1F5EE', 'Amazônia', 4]];
if (lun.regiao == null) lun.regiao = 2;
if (lun.mostrarDias == null) lun.mostrarDias = true;
lun.bloq ||= {};
// mutirão da roda: atividades saudáveis somadas pelo grupo; não mostra quem fez nem quem não fez
const MUTIRAO = { meta: 40, base: [21, 33, 27, 30, 18], atividades: ['Caminhada', 'Música sem tela', 'Liguei para alguém', 'Organizei o orçamento', 'Respirei com a Terra'] };
let postAcoes = null;
const ICO_RODA = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="2.6"/><circle cx="5" cy="15" r="2.6"/><circle cx="19" cy="15" r="2.6"/><path d="M8 19.5c1.2.9 2.5 1.3 4 1.3s2.8-.4 4-1.3M9.3 7.5 6.6 12M14.7 7.5l2.7 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
function rodaMinha() { const [n, cor, claro, bio, qtd] = REGIOES_LUN[lun.regiao]; return { n, cor, claro, bio, qtd }; }
const ICO_DEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>';
function cartaoPost(p, k, modo = 'feed') {
  const meu = p.quem === 'eu', nome = meu ? euNome() : 'Planeta ' + p.quem, nId = (p.id_ || 0) + (lun.ident[p.id] ? 1 : 0);
  const resps = [...p.r.map(([q]) => q), ...(lun.resp[p.id] || []).map(() => 'eu')], nR = resps.length;
  const dias = meu ? (lun.mostrarDias ? s.dias : null) : PLANETAS[p.quem]?.[1];
  const selo = p.familiar ? '<span class="dias fam">familiar</span>' : dias ? `<span class="dias">${dias} dias</span>` : '';
  const novo = NOVATOS.has(p.quem) ? '<span class="selo-novo">chegou agora</span>' : '';
  const corpo = modo === 'feed' ? `<button type="button" class="abrir" data-fio="${p.id}" aria-label="Abrir conversa de ${nome}"><span class="texto">${esc(p.t)}</span></button>` : `<span class="texto">${esc(p.t)}</span>`;
  const revisao = lun.denun[p.id];
  const pilha = nR ? `<span class="quem-resp" aria-hidden="true">${[...new Set(resps)].slice(0, 3).map((q) => `<span class="av" style="background: ${corDe(q)}"></span>`).join('')}</span>` : ICO_RESP;
  const acoes = `<div class="acoes"><button type="button" class="ident" data-ident="${p.id}" aria-pressed="${!!lun.ident[p.id]}" aria-label="Me identifico${nId ? ', ' + nId + ' planetas' : ''}">${ICO_IDENT}${lun.ident[p.id] ? '<span>Me identifico</span>' : ''}${nId ? ` <span class="n">${nId}</span>` : ''}</button>${modo === 'feed' ? `<button type="button" data-fio="${p.id}" aria-label="Responder${nR ? ', ' + nR + ' respostas' : ''}">${pilha}${nR ? ` <span class="n">${nR}</span>` : ''}</button>` : ''}${meu ? '' : `<button type="button" class="den" data-den="${p.id}" ${revisao ? 'disabled' : ''} aria-label="${revisao ? 'Em revisão pela moderação' : 'Denunciar'}">${revisao ? 'Em revisão' : ICO_DEN}</button>`}</div>`;
  return `<article class="tw${revisao ? ' revisao' : ''}${modo === 'orig' ? ' orig' : ''}" style="--k: ${k}"><span class="av" style="background: ${corDe(meu ? 'eu' : p.quem)}"></span><div>
    <div class="linha1"><b>${meu ? nome : nome}</b>${meu ? '<span>(você)</span>' : ''}${selo}${novo}<span>· ${p.h || 'agora'}</span></div>
    ${p.c ? `<div class="em">em <b>${CONSTELACOES[p.c]}</b></div>` : ''}${corpo}${acoes}</div></article>`;
}
function desenharLuneta() {
  $('#eu-nome').textContent = euNome(); $('#pub-nome').textContent = euNome(); $('#eu-cor').style.background = lun.planeta.cor;
  $$('.abas-lun [data-lun]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.lun === lun.aba)));
  $('#ind-lun').style.setProperty('--i', lun.aba === 'mural' ? 0 : 1);
  $('#bol-conv').hidden = !!lun.msgs.roda || lun.aba === 'conversas';
  $('#escrever').classList.toggle('oculto', lun.aba !== 'mural');
  const pn = $('#painel-lun'); pn.setAttribute('aria-labelledby', 'aba-' + lun.aba);
  if (lun.aba === 'mural') {
    const filtros = [['tudo', 'Tudo'], ...Object.entries(CONSTELACOES)];
    const posts = [...lun.meus, ...POSTS_DEMO.slice(1)].filter((p) => !lun.bloq[p.quem] && (lun.filtro === 'tudo' ? true : p.c === lun.filtro));
    const rmm = rodaMinha(), fezHoje = lun.mut?.dia === new Date().toDateString(), nMut = Math.min(MUTIRAO.meta, MUTIRAO.base[lun.regiao] + (lun.mut?.n || 0));
    const mutirao = `<section class="mutirao" aria-label="Mutirão da sua região"><span class="rot" style="--cor-reg: ${rmm.cor}">Mutirão do ${rmm.n} · esta semana</span><h4>${MUTIRAO.meta} atividades fora das apostas, juntos</h4>
      <div class="barra-mut" role="progressbar" aria-valuemin="0" aria-valuemax="${MUTIRAO.meta}" aria-valuenow="${nMut}" aria-label="Progresso do mutirão"><i style="width: ${nMut / MUTIRAO.meta * 100}%; background: ${rmm.cor}"></i></div>
      <div class="num"><span><b>${nMut}</b> de ${MUTIRAO.meta}</span><span>${rmm.qtd} planetas no grupo</span></div>
      ${fezHoje ? `<span class="fiz">✓ Você somou: ${lun.mut.at.toLowerCase()}. Volte amanhã.</span>` : `<div class="chips" role="group" aria-label="O que você fez hoje?">${MUTIRAO.atividades.map((a) => `<button type="button" data-mut="${a}">+ ${a}</button>`).join('')}</div>`}
      <small class="regra">Conta só o total do grupo. Ninguém vê quem fez ou quem não fez.</small></section>`;
    const tudo = lun.filtro === 'tudo', roda = ['Coral-15', 'Turquesa-27', 'Jade-02', 'Âmbar-08'];
    const nP = PERGUNTA.r.length + (lun.resp.q1 || []).length, forca = MARCO.forca + (lun.forca ? 1 : 0);
    const pergunta = `<section class="cartao-com pergunta" aria-label="Pergunta da semana"><span class="rot">Pergunta da semana</span><h4>${PERGUNTA.t}</h4>
      <div class="rodape"><button type="button" data-fio="q1">Responder</button><span class="quem-resp">${PERGUNTA.r.map(([q]) => `<span class="av" style="background: ${corDe(q)}; border-color: var(--lun-claro)"></span>`).join('')}</span><span>${nP} planetas responderam</span></div></section>`;
    const marco = `<section class="cartao-com marco" aria-label="Marco da comunidade"><span class="rot">Marco na constelação</span><h4>Planeta ${MARCO.quem} chegou a ${MARCO.dias} dias. O ${MARCO.regiao} voltou.</h4>
      <div class="rodape"><button type="button" id="mandar-forca" aria-pressed="${!!lun.forca}">${lun.forca ? 'Você mandou força' : 'Mandar força'}</button><span>${forca} planetas mandaram força</span></div></section>`;
    const feed = posts.map((p, k) => cartaoPost(p, k)), meio = [];
    feed.forEach((h, k) => { meio.push(h); if (tudo && k === 0) meio.push(mutirao); if (tudo && k === 2) meio.push(pergunta); if (tudo && k === 5) meio.push(marco); });
    pn.innerHTML = (tudo ? `<button type="button" class="prompt-post" id="prompt-post"><span class="av" style="background: ${lun.planeta.cor}"></span><span class="q">Como está seu recomeço hoje?</span><span class="ir">Escrever</span></button>
      <button type="button" class="presenca" data-conv="roda"><span class="pilha-lun">${roda.map((q) => `<span class="av" style="background: ${corDe(q)}"></span>`).join('')}</span><span><b>Roda do ${rodaMinha().n}</b><small>4 planetas da sua região</small></span><span class="vivo demo">exemplo</span></button>
` : '')
      + `<div class="chips" role="group" aria-label="Constelações">${filtros.map(([k, n]) => `<button type="button" data-filtro="${k}" aria-pressed="${lun.filtro === k}">${n}</button>`).join('')}</div>`
      + (meio.join('') || '<p class="fim-feed">Ninguém escreveu nesta constelação ainda. Que tal ser o primeiro?</p>')
      + `<p class="fim-feed">Você viu tudo por hoje.<br>Posts fictícios na demonstração.</p>`;
  } else {
    const item = (id) => { const c = CONVERSAS[id], ult = (lun.msgs[id] || []).slice(-1)[0] || c.msgs[c.msgs.length - 1];
      const prev = ult[0] === 'eu' ? 'Você: ' + ult[1] : ult[0] === 'g' ? 'Guardião: ' + ult[1] : ult[0] === 'dia' ? '' : ult[0] + ': ' + ult[1];
      const icone = id === 'roda' ? `<span class="ic" style="background: ${c.ic[0]}; color: ${c.ic[1]}"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="6" r="2.6"/><circle cx="5.5" cy="15" r="2.6"/><circle cx="18.5" cy="15" r="2.6"/><path d="M12 9.5l-4.5 4M12 9.5l4.5 4M8 16.5h8" stroke="currentColor" stroke-width="1.4" fill="none"/></svg></span>`
        : `<span class="ic" style="background: ${c.ic[0]}"><span class="av-pl" style="width: 26px; height: 26px; background: ${corDe(c.planeta)}"></span></span>`;
      const novas = !lun.msgs[id] && c.novas ? `<span class="novas">${c.novas} novas</span>` : '';
      return `<button type="button" class="conv-item" data-conv="${id}">${icone}<span><b>${c.tit}</b><small>${c.sub}</small><small>${esc(prev)}</small></span><span class="hora">${c.quando}${novas ? '<br>' + novas : ''}</span></button>`; };
    const rm = rodaMinha(), nNovas = !lun.msgs.roda ? 3 : 0;
    const minha = `<p class="sec-conv">Na sua região</p><button type="button" class="roda-reg" data-conv="roda"><span class="bio" style="background: ${rm.claro}; color: ${rm.cor}">${ICO_RODA}</span><span><b>Roda do ${rm.n}</b><small>${rm.bio} · sextas, 21h · ${rm.qtd} planetas</small></span><span class="vivo${nNovas ? '' : ' demo'}">${nNovas ? nNovas + ' novas' : 'exemplo'}</span></button>`;
    const outras = `<p class="sec-conv">Outras regiões</p><div class="outras-reg">${REGIOES_LUN.map((r, k) => k === lun.regiao ? '' : `<button type="button" data-outra="${k}"><b><i style="background: ${r[1]}"></i>${r[0]}</b><small>${r[4]} planetas</small></button>`).join('')}</div>`;
    if (conta && conversasApi == null && !erroConversas) carregarConversas();
    pn.innerHTML = blocoConversasApi() + minha + outras + `<p class="sec-conv">Só vocês dois</p><div class="lista-conv">${item('par')}</div><div class="par-cartao"><b>Quer mais um companheiro de trilha?</b><p>A Luneta sugere alguém com dias de recomeço e horário difícil parecidos com os seus. Os dois aceitam antes, ninguém vê nome ou foto, e qualquer um pode encerrar quando quiser.</p><button type="button" data-aviso="Na demo, a sugestão de companheiro não é feita. No app, chega um convite que a outra pessoa precisa aceitar.">Pedir um companheiro</button></div>`
      + `<p class="regra-lun">A roda e o companheiro são fictícios na demonstração; suas conversas acima são reais. A região serve para achar rodas no mesmo fuso e com a mesma realidade; cidade e localização exata nunca aparecem.</p>`;
  }
  if (lunTopo) { pn.scrollTop = 0; lunTopo = false; }
}
let lunTopo = true;
function abrirFio(id) { fioAberto = id; irPara('fio'); desenharFio(); }
function desenharFio() {
  const p = todosPosts().find((x) => x.id === fioAberto); if (!p) return;
  $('#fio-const').textContent = p.pergunta ? 'Pergunta da semana' : p.c ? CONSTELACOES[p.c] : '';
  const resps = [...p.r.filter(([q]) => !lun.bloq[q]).map(([q, t]) => [q, t]), ...(lun.resp[p.id] || []).map((t) => ['eu', t])];
  const orig = p.pergunta ? `<section class="cartao-com pergunta" style="margin: 6px 16px 4px"><span class="rot">Pergunta da semana</span><h4>${p.t}</h4></section>` : cartaoPost(p, 0, 'orig');
  const um = ([q, t]) => `<article class="tw rp${q === 'eu' ? ' minha' : ''}"><span class="av" style="background: ${corDe(q)}"></span><div><div class="linha1"><b>${q === 'eu' ? euNome() : 'Planeta ' + q}</b>${q === 'eu' ? '<span>(você)</span>' : PLANETAS[q]?.[1] ? `<span class="dias">${PLANETAS[q][1]} dias</span>` : ''}</div><span class="texto">${esc(t)}</span></div></article>`;
  $('#rol-fio').innerHTML = orig + `<p class="resp-titulo">${resps.length ? resps.length + (resps.length > 1 ? ' respostas' : ' resposta') : 'Ninguém respondeu ainda. Você pode ser o primeiro.'}</p>` + resps.map(um).join('') + '<div id="fio-aviso" style="padding: 0 16px"></div>';
  const rapidas = p.pergunta ? ['Ainda estou descobrindo', 'Saio para caminhar'] : NOVATOS.has(p.quem) ? ['Seja bem-vindo à Luneta', 'Força nos primeiros dias'] : p.c === 'tempestades' ? ['Obrigado por contar', 'Você voltou, isso conta'] : ['Me identifico com isso', 'Força pra você'];
  $('#rapidas-fio').innerHTML = rapidas.map((r) => `<button type="button" data-rapida-fio="${r}">${r}</button>`).join('');
  $('#txt-fio').placeholder = p.pergunta ? 'Sua resposta…' : `Responder ao Planeta ${p.quem === 'eu' ? lun.planeta.nome : p.quem}…`;
}
function abrirConversa(id) { if (ehApi(id)) { abrirConversaApi(id.slice(4)); return; } convAberta = id; irPara('conversa'); desenharConversa(); }
function desenharConversaApi() {
  const c = convApi, extra = avisosConv[convAberta] || [];
  const outros = c ? c.membros.filter((m) => m.id !== conta?.id) : [];
  $('#conv-tit').textContent = c ? c.titulo : 'Conversa';
  $('#conv-sub').textContent = c ? outros.map((m) => '@' + m.username).join(', ') + ' · com moderação' : 'Carregando…';
  $('#txt-conv').placeholder = 'Escreva uma mensagem…'; $('#txt-conv').maxLength = 4000;
  const msg = (m) => m.autorId && m.autorId === conta?.id
    ? `<div class="msg minha"><div class="bolha-msg">${esc(m.conteudo)}</div></div>`
    : `<div class="msg"><span class="de"><span class="av-pl" style="width: 14px; height: 14px; background: ${m.autor ? corUsuario(m.autor.username) : '#B4B2A9'}"></span>${m.autor ? '@' + esc(m.autor.username) : 'Conta apagada'}</span><div class="bolha-msg">${esc(m.conteudo)}</div></div>`;
  const guard = (conteudo) => `<div class="msg guardiao"><span class="de"><span class="av-pl" style="width: 14px; height: 14px; background: #3C3489"></span>Guardião da Luneta</span>${conteudo}</div>`;
  const ini = c && !c.mensagens.length ? guard('<div class="bolha-msg">Aqui vale contar como você está. Sem links, valores ou nomes de casas de aposta. Se alguém estiver em risco, a Ajuda fica no menu.</div>') : '';
  $('#rol-msgs').innerHTML = (c ? ini + c.mensagens.map(msg).join('') : '<p class="regra-lun">Carregando mensagens…</p>')
    + extra.map(([q, t]) => q === 'crise' ? guard(cartaoCrise()) : guard(`<div class="bolha-msg">${esc(t)}</div>`)).join('');
  $('#rapidas').innerHTML = RAPIDAS_API.map((r) => `<button type="button" data-rapida="${esc(r)}">${r}</button>`).join('');
  const r = $('#rol-msgs'); r.scrollTop = r.scrollHeight;
}
function desenharConversa(digitando) {
  if (ehApi(convAberta)) { desenharConversaApi(); return; }
  $('#txt-conv').maxLength = 300;
  const c = CONVERSAS[convAberta]; if (!c) return;
  const rm = rodaMinha();
  $('#conv-tit').textContent = c.planeta ? 'Planeta ' + c.tit : `Roda do ${rm.n}`; $('#conv-sub').textContent = c.planeta ? c.sub : `${rm.bio} · sextas, 21h · com moderação`;
  $('#txt-conv').placeholder = c.planeta ? 'Escreva para Coral-15…' : 'Escreva para a roda…';
  const msgs = [...c.msgs, ...(lun.msgs[convAberta] || [])].filter(([q]) => !lun.bloq[q]);
  const um = ([q, t]) => q === 'dia' ? `<span class="dia-msg">${t}</span>`
    : q === 'g' ? `<div class="msg guardiao"><span class="de"><span class="av-pl" style="width: 14px; height: 14px; background: #3C3489"></span>Guardião da Luneta</span><div class="bolha-msg">${t}</div></div>`
    : q === 'crise' ? `<div class="msg guardiao"><span class="de"><span class="av-pl" style="width: 14px; height: 14px; background: #3C3489"></span>Guardião da Luneta</span>${cartaoCrise()}</div>`
    : q === 'eu' ? `<div class="msg minha"><div class="bolha-msg">${esc(t)}</div></div>`
    : `<div class="msg"><span class="de"><span class="av-pl" style="width: 14px; height: 14px; background: ${corDe(q)}"></span>Planeta ${q}</span><div class="bolha-msg">${esc(t)}</div></div>`;
  $('#rol-msgs').innerHTML = msgs.map(um).join('') + (digitando ? `<div class="msg"><span class="de"><span class="av-pl" style="width: 14px; height: 14px; background: ${corDe(digitando)}"></span>Planeta ${digitando}</span><div class="bolha-msg"><span class="digitando" aria-label="digitando"><i></i><i></i><i></i></span></div></div>` : '');
  $('#rapidas').innerHTML = c.rapidas.map((r) => `<button type="button" data-rapida="${esc(r)}">${r}</button>`).join('');
  const r = $('#rol-msgs'); r.scrollTop = r.scrollHeight;
}
let respIdx = 0;
async function enviarMensagemApi(txt) {
  const aberta = convAberta, extra = (avisosConv[aberta] ||= []);
  // crise: não vai para o servidor; mostra CVV e SAMU como nas conversas da demo
  if (CRISE.test(txt)) { extra.push(['crise', '']); desenharConversa(); emitirLuneta?.({ tipo: 'alerta_crise', onde: 'conversa' }); return; }
  const bloq = checar(txt).filter(([, , b]) => b);
  if (bloq.length) { extra.push(['g', `Sua mensagem não foi enviada: ${bloq.map(([, rot]) => rot.toLowerCase()).join(', ')}. Aqui a gente conta como está, sem esses detalhes.`]); desenharConversa(); return; }
  if (enviandoConv) return; enviandoConv = true;
  try { await B.enviarMensagem(aberta.slice(4), txt); avisosConv[aberta] = []; conversasApi = null; await atualizarConversaApi(); }
  catch (err) { extra.push(['g', 'Sua mensagem não foi enviada. ' + err.message]); if (convAberta === aberta) desenharConversa(); }
  finally { enviandoConv = false; }
}
function enviarMensagem(txt) {
  txt = txt.trim(); if (!txt) return;
  if (ehApi(convAberta)) { enviarMensagemApi(txt); return; }
  const lista = (lun.msgs[convAberta] ||= []);
  if (CRISE.test(txt)) { lista.push(['eu', txt], ['crise', '']); guardarLun(); desenharConversa(); emitirLuneta?.({ tipo: 'alerta_crise', onde: 'conversa' }); return; }
  const bloq = checar(txt).filter(([, , b]) => b);
  if (bloq.length) { lista.push(['g', `Sua mensagem não foi enviada: ${bloq.map(([, rot]) => rot.toLowerCase()).join(', ')}. Aqui a gente conta como está, sem esses detalhes.`]); guardarLun(); desenharConversa(); return; }
  lista.push(['eu', txt]); guardarLun(); emitirLuneta?.({ tipo: 'mensagem', conversa: convAberta, texto: txt });
  const c = CONVERSAS[convAberta], [q, t] = c.respostas[respIdx++ % c.respostas.length], aberta = convAberta;
  desenharConversa();
  setTimeout(() => { if (convAberta === aberta && telaAtual === 'conversa') desenharConversa(q); }, 600);
  setTimeout(() => { lista.push([q, t]); guardarLun(); if (convAberta === aberta && telaAtual === 'conversa') desenharConversa(); }, 1900);
}
function abrirEscrever() {
  const f = $('#folha-escrever'); f.hidden = false;
  $('#escolha-const').innerHTML = Object.entries(CONSTELACOES).filter(([k]) => k !== 'familia' || true).map(([k, n]) => `<button type="button" role="radio" data-const="${k}" aria-checked="${k === constEscolhida}">${n}</button>`).join('');
  $('#txt-post').placeholder = 'Como você está? O que ajudou hoje?';
  atualizarChecagem(); setTimeout(() => $('#txt-post').focus({ preventScroll: true }), 60);
}
function atualizarChecagem() {
  const txt = $('#txt-post').value, ch = checar(txt), crise = CRISE.test(txt);
  $('#checagem').innerHTML = ch.map(([, rot, b]) => `<li class="${b ? 'bloq' : ''}">${rot}</li>`).join('');
  $('#aviso-crise').innerHTML = crise ? cartaoCrise() : '';
  $('#publicar').disabled = txt.trim().length < 3 || ch.some(([, , b]) => b);
  $('#publicar').firstChild.textContent = crise ? 'Publicar para a moderação ler antes como ' : 'Publicar como ';
}
$('#tela-luneta').addEventListener('click', (e) => {
  const t = e.target;
  const ab = t.closest('[data-lun]'); if (ab) { lun.aba = ab.dataset.lun; lunTopo = true; desenharLuneta(); return; }
  const fl = t.closest('[data-filtro]'); if (fl) { lun.filtro = fl.dataset.filtro; lunTopo = true; desenharLuneta(); return; }
  const id = t.closest('[data-ident]'); if (id) { const k = id.dataset.ident; lun.ident[k] = !lun.ident[k]; guardarLun(); desenharLuneta(); const b = $(`#painel-lun [data-ident="${k}"]`); if (b && lun.ident[k]) b.classList.add('pulsa'); if (lun.ident[k]) emitirLuneta?.({ tipo: 'identifico', post: k }); return; }
  const dn = t.closest('[data-den]'); if (dn) { abrirAcoes(dn.dataset.den); return; }
  if (t.closest('#fechar-acoes') || t === $('#folha-acoes')) { $('#folha-acoes').hidden = true; return; }
  if (t.closest('#acao-denunciar')) { lun.denun[postAcoes] = true; guardarLun(); $('#folha-acoes').hidden = true; desenharLuneta(); aviso('Obrigado. A moderação vai olhar este post.'); emitirLuneta?.({ tipo: 'denuncia', post: postAcoes }); return; }
  if (t.closest('#acao-bloquear')) { const q = todosPosts().find((x) => x.id === postAcoes)?.quem; if (q) { lun.bloq[q] = true; guardarLun(); } $('#folha-acoes').hidden = true; lunTopo = false; desenharLuneta(); aviso(`Planeta ${q} bloqueado. Para desfazer, toque no seu planeta.`); emitirLuneta?.({ tipo: 'bloqueio' }); return; }
  const mt = t.closest('[data-mut]'); if (mt) { const hoje = new Date().toDateString(); lun.mut = { dia: hoje, at: mt.dataset.mut, n: (lun.mut?.n || 0) + 1 }; guardarLun(); desenharLuneta(); aviso(`${mt.dataset.mut} somada ao mutirão do ${rodaMinha().n}.`); emitirLuneta?.({ tipo: 'mutirao', atividade: mt.dataset.mut }); return; }
  const fi = t.closest('[data-fio]'); if (fi) { abrirFio(fi.dataset.fio); return; }
  const cv = t.closest('[data-conv]'); if (cv) { abrirConversa(cv.dataset.conv); return; }
  if (t.closest('#conv-entrar')) { modoLogin = 'entrar'; irPara('login'); return; }
  const ou = t.closest('[data-outra]'); if (ou) { aviso(`Você participa da roda da sua região. Para trocar para o ${REGIOES_LUN[+ou.dataset.outra][0]}, toque no seu planeta.`); return; }
  if (t.closest('#escrever') || t.closest('#prompt-post')) { abrirEscrever(); return; }
  if (t.closest('#mandar-forca')) { lun.forca = !lun.forca; guardarLun(); desenharLuneta(); if (lun.forca) { aviso(`Força enviada ao Planeta ${MARCO.quem}.`); emitirLuneta?.({ tipo: 'forca', para: MARCO.quem }); } return; }
  if (t.closest('#fechar-escrever') || t === $('#folha-escrever')) { $('#folha-escrever').hidden = true; $('#escrever').focus(); return; }
  const ce = t.closest('[data-const]'); if (ce) { constEscolhida = ce.dataset.const; $$('#escolha-const [data-const]').forEach((b) => b.setAttribute('aria-checked', String(b === ce))); return; }
  if (t.closest('#publicar')) {
    const txt = $('#txt-post').value.trim(), crise = CRISE.test(txt);
    lun.meus.unshift({ id: 'm' + Date.now(), quem: 'eu', c: constEscolhida, h: 'agora', t: txt, id_: 0, r: [] });
    if (crise) lun.denun[lun.meus[0].id] = true;
    guardarLun(); $('#txt-post').value = ''; $('#folha-escrever').hidden = true; lun.filtro = 'tudo'; desenharLuneta();
    aviso(crise ? 'Seu post vai aparecer depois que a moderação ler. A Ajuda está no menu.' : 'Publicado na constelação ' + CONSTELACOES[constEscolhida] + '.');
    emitirLuneta?.({ tipo: 'post', id: lun.meus[0].id, constelacao: constEscolhida, texto: txt, revisao: crise });
  }
});
$('#tela-luneta').addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; if (!$('#folha-escrever').hidden) { $('#folha-escrever').hidden = true; $('#escrever').focus(); } $('#folha-acoes').hidden = true; });
$('#txt-post').addEventListener('input', atualizarChecagem);
$('#eu-planeta').addEventListener('click', abrirPlaneta);
$('#txt-planeta').addEventListener('input', atualizarPlaneta);
$('#folha-planeta').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('#fechar-planeta') || t === $('#folha-planeta')) { fecharPlaneta(); return; }
  if (t.closest('#sortear-pl')) { sortearSugestoes(); return; }
  const sg = t.closest('[data-sug]'); if (sg) { $('#txt-planeta').value = sg.dataset.sug; atualizarPlaneta(); return; }
  const db = t.closest('[data-desbloq]'); if (db) { delete lun.bloq[db.dataset.desbloq]; guardarLun(); desenharBloqueados(); aviso(`Planeta ${db.dataset.desbloq} desbloqueado.`); return; }
  const rg = t.closest('[data-reg-pl]'); if (rg) { rascunhoPl.regiao = +rg.dataset.regPl; $$('#regiao-pl [data-reg-pl]').forEach((b) => b.setAttribute('aria-checked', String(b === rg))); return; }
  const cr = t.closest('[data-cor-pl]'); if (cr) { rascunhoPl.cor = cr.dataset.corPl; $$('#cores-pl [data-cor-pl]').forEach((b) => b.setAttribute('aria-checked', String(b === cr))); atualizarPlaneta(); return; }
  if (t.closest('#salvar-planeta')) {
    lun.planeta = { nome: rascunhoPl.nome, cor: rascunhoPl.cor }; lun.regiao = rascunhoPl.regiao; lun.mostrarDias = $('#mostrar-dias').checked; guardarLun(); fecharPlaneta(); desenharLuneta();
    aviso(`Agora você é o ${euNome()}.`); emitirLuneta?.({ tipo: 'planeta_editado' });
  }
});
$('#folha-planeta').addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharPlaneta(); if (e.key === 'Enter' && !$('#salvar-planeta').disabled && e.target.id === 'txt-planeta') $('#salvar-planeta').click(); });
$('#tela-fio').addEventListener('click', (e) => {
  const rf = e.target.closest('[data-rapida-fio]'); if (rf) { $('#txt-fio').value = rf.dataset.rapidaFio; $('#compor-fio').requestSubmit(); return; }
  const id = e.target.closest('[data-ident]'); if (id) { const k = id.dataset.ident; lun.ident[k] = !lun.ident[k]; guardarLun(); desenharFio(); return; }
});
$('#compor-fio').addEventListener('submit', (e) => {
  e.preventDefault(); const inp = $('#txt-fio'), txt = inp.value.trim(); if (!txt) return;
  if (CRISE.test(txt)) { $('#fio-aviso').innerHTML = cartaoCrise(); emitirLuneta?.({ tipo: 'alerta_crise', onde: 'mural' }); return; }
  const bloq = checar(txt).filter(([, , b]) => b);
  if (bloq.length) { $('#fio-aviso').innerHTML = `<p class="regra-lun" role="alert" style="color: #A32D2D; font-weight: 700">Não foi enviada: ${bloq.map(([, r]) => r.toLowerCase()).join(', ')}.</p>`; return; }
  (lun.resp[fioAberto] ||= []).push(txt); guardarLun(); inp.value = ''; desenharFio();
  const r = $('#rol-fio'); r.scrollTop = r.scrollHeight; emitirLuneta?.({ tipo: 'resposta', post: fioAberto, texto: txt });
});
$('#tela-luneta').addEventListener('submit', async (e) => {
  if (e.target.id !== 'nova-conv') return;
  e.preventDefault();
  const inp = $('#nova-conv-user'), erro = $('#erro-nova-conv');
  const nomes = [...new Set(inp.value.split(/[,\s]+/).map((n) => n.replace(/^@/, '').trim().toLowerCase()).filter(Boolean))];
  if (!nomes.length) { erro.textContent = 'Digite o nome de usuário de quem você quer chamar.'; inp.focus(); return; }
  if (nomes.includes(conta.username)) { erro.textContent = 'Esse é o seu nome de usuário. Chame outra pessoa.'; inp.focus(); return; }
  const bt = e.target.querySelector('button[type="submit"]'); bt.disabled = true; erro.textContent = '';
  try { const c = await B.criarConversa(nomes); conversasApi = null; emitirLuneta?.({ tipo: 'conversa_criada', pessoas: nomes.length + 1 }); abrirConversaApi(c.id); }
  catch (err) { erro.textContent = err.message; }
  finally { bt.disabled = false; }
});
$('#compor-conv').addEventListener('submit', (e) => { e.preventDefault(); const inp = $('#txt-conv'); enviarMensagem(inp.value); inp.value = ''; });
$('#tela-conversa').addEventListener('click', (e) => {
  const r = e.target.closest('[data-rapida]'); if (r) { enviarMensagem(r.dataset.rapida); return; }
  if (e.target.closest('#voltar-conversa')) { lun.aba = 'conversas'; irPara('luneta'); }
});

// ---------- arrastar para rolar com o mouse (como o dedo no celular) ----------
// No computador não há barra de rolagem visível; segurar e arrastar rola qualquer lista, e um arrasto não vira clique.
(() => {
  let alvo = null, y0 = 0, x0 = 0, top0 = 0, left0 = 0, moveu = false, eixo = null;
  const rolavel = (el) => { for (let e = el; e && e !== app; e = e.parentElement) { const cs = getComputedStyle(e);
    if ((/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2) || (/(auto|scroll)/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 2)) return e; } return null; };
  app.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('input, textarea, select, [contenteditable], canvas, .slot')) return;
    alvo = rolavel(e.target); if (!alvo) return;
    y0 = e.clientY; x0 = e.clientX; top0 = alvo.scrollTop; left0 = alvo.scrollLeft; moveu = false; eixo = null;
  });
  addEventListener('pointermove', (e) => {
    if (!alvo) return;
    const dy = e.clientY - y0, dx = e.clientX - x0;
    if (!moveu && Math.hypot(dx, dy) < 6) return;
    if (!moveu) { moveu = true; eixo = alvo.scrollWidth > alvo.clientWidth + 2 && Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; app.classList.add('arrastando'); }
    if (eixo === 'y') alvo.scrollTop = top0 - dy; else alvo.scrollLeft = left0 - dx;
    e.preventDefault();
  });
  addEventListener('pointerup', () => { if (!alvo) return; alvo = null; app.classList.remove('arrastando'); if (moveu) { const parar = (ev) => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', parar, { capture: true, once: true }); setTimeout(() => removeEventListener('click', parar, { capture: true }), 50); } });
})();

// ---------- aplicar o estado ao planeta e ao menu ----------
function aplicar() {
  app.dataset.tema = s.escuro ? 'escuro' : 'claro';
  app.classList.toggle('reduzido', s.mov);
  corNav(); atualizarTextos();
  if (globo) { globo.setOpcoes({ daltonismo: s.dalt, movimentoReduzido: s.mov, tema: s.escuro ? 'escuro' : 'claro' }); globo.setEstado(estado()); }
}

// ---------- início ----------
aplicar();
// link do e-mail de recuperação: /redefinir-senha?token=... abre o login no modo "senha nova"
try { const q = new URLSearchParams(location.search); if (location.pathname.startsWith('/redefinir-senha') && q.get('token')) { tokenRedefinir = q.get('token'); modoLogin = 'redefinir'; } } catch {}
const inicial = tokenRedefinir ? 'login' : (location.hash || '#login').slice(1);   // o app abre pela história
irPara(telas.includes(inicial) ? inicial : 'inicio', { sem: true });
if (B) {
  // token vencido, senha trocada em outro aparelho ou conta apagada: volta ao modo sem conta
  B.quandoDeslogar(() => { if (!conta) return; conta = null; conversasApi = null; convApi = null; aviso('Sua sessão terminou. Entre de novo para ver suas conversas.'); if (telaAtual === 'conversa' && ehApi(convAberta)) { lun.aba = 'conversas'; irPara('luneta'); } });
  // sessão salva: reconhece a pessoa sem pedir a senha de novo
  B.sessao().then((u) => { if (!u) return; conta = contaDe(u); trilhaDaConta(); if (telaAtual === 'login' && modoLogin !== 'redefinir') entrarNoApp(); else if (telaAtual === 'perfil') desenharPerfil(); })
    .catch(() => { /* servidor fora do ar: segue sem conta, o token fica para a próxima vez */ });
}
addEventListener('hashchange', () => irPara(location.hash.slice(1)));

try {
  globo = await criarGlobo($('#camada'), {
    assets: ASSETS, estado: estado(), movimentoReduzido: s.mov,
    periodoVolta: 25, aoVoltaSatelite: (i) => mostrarRecado(i),
    aoTocarRegiao: (k) => {
      if (k < 0) return;
      if (telaAtual === 'inicio') { if (!s.mov) descerNaTerra(k); else { irPara('trilha'); setTimeout(() => irAoCapitulo(k, false), 200); } }   // tocar uma região no planeta desce até o capítulo dela
      else if (telaAtual === 'mapa') selecionarRegiao(k);
    },
  });
  globo.setSatelites(ORBITA);
  aplicar();
  moverGlobo(telaAtual, 0);
  desenharOrbita();
  if (telaAtual === 'mapa') globo.focarRegiao(regiaoSel);
  if (telaAtual === 'mare') { globo.irPara({ opacidade: 0 }, 0); }
  await Promise.race([globo.primeiroQuadro, new Promise((ok) => setTimeout(ok, 2500))]);
  app.classList.add('pronto'); app.removeAttribute('aria-busy');
  setTimeout(() => { try { garantirOceano(); } catch (e) { console.error(e); } }, 1200);
  setTimeout(() => { aquecerChao(s.escuro).catch(() => {}); }, 3000);   // texturas do chão da trilha, em fatias, antes de a pessoa abrir a trilha
  addEventListener('resize', () => moverGlobo(telaAtual, 0));
} catch (err) {
  console.error(err);
  app.classList.add('sem-3d'); app.removeAttribute('aria-busy');   // para de "respirar": o planeta desfocado fica parado
  aviso('Não foi possível desenhar o planeta em 3D neste aparelho.');
}
}
