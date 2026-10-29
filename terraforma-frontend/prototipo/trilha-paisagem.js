// paisagem.js — a paisagem da trilha em canvas: chão seco e rachado, grama que avança, plantas que crescem e bichos que voltam.
// Cada capítulo é um bioma. Tudo é desenhado aqui (sem imagens de fora), com texturas geradas por ferramentas/gerar_texturas.py.

const TEX = {};
export function carregarTexturas(base) {
  return Promise.all(['chao-seco', 'estrada-seca', 'grama', 'estrada-viva'].map((n) => new Promise((ok) => {
    const im = new Image(); im.onload = () => { TEX[n] = im; ok(); }; im.onerror = () => ok(); im.src = `${base}${n}.jpg`;
  })));
}

// ---------- utilidades ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const suave = (t) => t * t * (3 - 2 * t);
const saida = (t) => 1 - Math.pow(1 - t, 3);
const vaiVolta = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function semente(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DPR = () => Math.min(2, window.devicePixelRatio || 1);

function sombra(ctx, x, y, rx, ry, a = 0.28) {
  if (rx <= 0.5) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(20,30,10,${a})`); g.addColorStop(1, 'rgba(20,30,10,0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function tufo(ctx, cx, cy, r, pal, rnd, manchas = 6) {   // um "punhado" de folhas com luz do alto à esquerda
  if (r < 0.6) { for (let k = 0; k < manchas * 3; k++) rnd(); return; }   // gasta o mesmo tanto de sorteios para o desenho não tremer enquanto cresce
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.08, cx, cy, r * 1.08);
  g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(1, pal[2]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < manchas; k++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.75, rr = r * (0.12 + rnd() * 0.16);
    ctx.fillStyle = k % 2 ? pal[0] : pal[2]; ctx.globalAlpha = k % 2 ? 0.45 : 0.35;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function tronco(ctx, x, y, h, w, curva, cor) {   // tronco afilado com casca (claro à esquerda)
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, cor[2]); g.addColorStop(0.35, cor[0]); g.addColorStop(1, cor[1]);
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x - w * 0.4 + curva, y - h * 0.5, x - w * 0.18 + curva * 1.4, y - h);
  ctx.lineTo(x + w * 0.18 + curva * 1.4, y - h);
  ctx.quadraticCurveTo(x + w * 0.4 + curva, y - h * 0.5, x + w / 2, y);
  ctx.closePath(); ctx.fill();
}
function galho(ctx, x1, y1, x2, y2, w, cor) {
  ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2 + (y2 - y1) * 0.12, (y1 + y2) / 2, x2, y2); ctx.stroke();
}

// ---------- biomas ----------
const CASCA = ['#7A5638', '#3E2A1C', '#5A3E28'];
const VERDES = {
  mata: ['#9CCB5E', '#4E8F32', '#1F4A1A'], campo: ['#B3D46A', '#6A9E3A', '#2E5A1E'], cerrado: ['#C2CF6A', '#7C9A3A', '#3D5520'],
  caatinga: ['#B8CF7A', '#7FA04A', '#3E5A28'], amazonia: ['#8CC459', '#3F8A2E', '#123F16'], araucaria: ['#7FA65A', '#3E6A2E', '#1C3A18'],
};
export const BIOMAS = [
  { nome: 'Sul', arvores: ['araucaria', 'araucaria', 'folhosa', 'arbusto', 'capim', 'araucaria', 'capim', 'flores'], verde: 'campo', principal: 'araucaria',
    ave: 'gralha', bicho: 'capivara', flor: ['#F4E8FA', '#C9A3E6', '#FFFFFF'], borboleta: ['#F2A33A', '#6B3A0E'] },
  { nome: 'Sudeste', arvores: ['folhosa', 'palmeira', 'folhosa', 'arbusto', 'folhosa', 'capim', 'palmeira', 'flores'], verde: 'mata', principal: 'folhosa',
    ave: 'tucano', bicho: 'veado', flor: ['#F28BB0', '#FFFFFF', '#F2C14E'], borboleta: ['#F2C14E', '#3A2A10'] },
  { nome: 'Centro-Oeste', arvores: ['tortuosa', 'ipe', 'capim', 'tortuosa', 'arbusto', 'capim', 'ipe', 'flores'], verde: 'cerrado', principal: 'ipe',
    ave: 'caninde', bicho: 'lobo', flor: ['#F2C14E', '#E8724A', '#FFFFFF'], borboleta: ['#F7E06A', '#3A3010'] },
  { nome: 'Nordeste', arvores: ['mandacaru', 'tortuosa', 'arbusto', 'mandacaru', 'capim', 'tortuosa', 'flores', 'arbusto'], verde: 'caatinga', principal: 'mandacaru',
    ave: 'asabranca', bicho: 'prea', flor: ['#F2C14E', '#E86A6A', '#FFFFFF'], borboleta: ['#F2A33A', '#4A2A08'] },
  { nome: 'Norte', arvores: ['folhosa', 'palmeira', 'folhosa', 'palmeira', 'arbusto', 'folhosa', 'capim', 'flores'], verde: 'amazonia', principal: 'folhosa',
    ave: 'arara', bicho: 'anta', flor: ['#E8455A', '#F2A33A', '#FFFFFF'], borboleta: ['#3C7DF0', '#0E2A5A'] },
];
export const NOMES = {
  araucaria: 'Uma araucária', folhosa: ['', 'Um jequitibá', '', '', 'Uma castanheira'], ipe: 'Um ipê-amarelo', mandacaru: 'Um mandacaru',
  gralha: 'Uma gralha-azul', tucano: 'Um tucano', caninde: 'Uma arara-canindé', asabranca: 'Uma asa-branca', arara: 'Uma arara-vermelha',
  capivara: 'Capivaras', veado: 'Veados-campeiros', lobo: 'Um lobo-guará', prea: 'Preás', anta: 'Uma anta',
};

// ---------- plantas vivas (g = crescimento de 0 a 1) ----------
const PLANTAS = {
  folhosa(ctx, x, y, e, g, rnd, bio, c) {
    const pal = VERDES[c === 4 ? 'amazonia' : bio.verde === 'campo' ? 'mata' : bio.verde];
    const gt = saida(clamp(g / 0.5)), gc = clamp((g - 0.22) / 0.78), H = 50 * e * gt, curva = (rnd() - 0.5) * 6 * e;
    sombra(ctx, x + 5 * e, y + 1, (8 + 22 * gc) * e, (3 + 6 * gc) * e);
    tronco(ctx, x, y, H, 7 * e * (0.4 + 0.6 * gt), curva, CASCA);
    const tx = x + curva * 1.4, ty = y - H;
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.75 + (rnd() - 0.5) * 0.3, L = (12 + rnd() * 8) * e * gt;
      galho(ctx, tx, ty + 8 * e, tx + Math.cos(a) * L, ty + 6 * e + Math.sin(a) * L, 2.4 * e * gt, CASCA[1]); }
    const N = 18, cy0 = ty - 8 * e;
    const cl = Array.from({ length: N }, (_, i) => { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
      return { x: tx + Math.cos(a) * d * 22 * e, y: cy0 + Math.sin(a) * d * 13 * e - (1 - d) * 4 * e, r: (8 + rnd() * 5) * e, i, s: rnd() }; })
      .sort((p, q) => p.y - q.y);
    const escuro = [pal[1], pal[2], pal[2]];
    cl.forEach((k) => { const v = saida(clamp((gc - k.i * 0.025) / 0.45)); tufo(ctx, k.x + 2 * e, k.y + 3 * e, k.r * v * 1.02, escuro, rnd, 0); });
    cl.forEach((k) => { const v = saida(clamp((gc - k.i * 0.025) / 0.45)); tufo(ctx, k.x, k.y, k.r * v, pal, rnd); });
  },
  tortuosa(ctx, x, y, e, g, rnd, bio) {
    const pal = VERDES[bio.verde === 'caatinga' ? 'caatinga' : 'cerrado'];
    const gt = saida(clamp(g / 0.5)), gc = clamp((g - 0.3) / 0.7), H = 34 * e * gt;
    sombra(ctx, x + 4 * e, y + 1, (6 + 16 * gc) * e, (2 + 4 * gc) * e);
    const ws = 4.5 * e * (0.4 + 0.6 * gt), dx = (rnd() - 0.5) * 16 * e;
    ctx.strokeStyle = CASCA[0]; ctx.lineCap = 'round'; ctx.lineWidth = ws;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + dx, y - H * 0.4, x - dx, y - H * 0.7, x + dx * 0.4, y - H); ctx.stroke();
    ctx.strokeStyle = CASCA[1]; ctx.lineWidth = ws * 0.35; ctx.beginPath(); ctx.moveTo(x + ws * 0.3, y); ctx.bezierCurveTo(x + dx + ws * 0.3, y - H * 0.4, x - dx + ws * 0.3, y - H * 0.7, x + dx * 0.4 + ws * 0.2, y - H); ctx.stroke();
    const tx = x + dx * 0.4, ty = y - H;
    const ramos = [[-1, 0.8], [1, 0.9], [-0.3, 1.1], [0.5, 1]].map(([s, l]) => [tx + s * 16 * e * gt * l, ty - 6 * e * gt * l]);
    ramos.forEach(([bx, by]) => galho(ctx, tx, ty + 4 * e, bx, by, 2 * e * gt, CASCA[0]));
    ramos.forEach(([bx, by], i) => { for (let k = 0; k < 3; k++) { const v = saida(clamp((gc - i * 0.08 - k * 0.04) / 0.5));
      tufo(ctx, bx + (rnd() - 0.5) * 10 * e, by - 2 * e + (rnd() - 0.5) * 6 * e, (6 + rnd() * 3) * e * v, pal, rnd, 4); } });
  },
  ipe(ctx, x, y, e, g, rnd) {
    PLANTAS.tortuosa(ctx, x, y, e * 1.15, g, rnd, { verde: 'cerrado' });
    const gc = clamp((g - 0.45) / 0.55), ty = y - 34 * e * 1.15;
    const amarelo = ['#FFF0A0', '#F2C230', '#A87A0E'];
    for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()), v = saida(clamp((gc - i * 0.03) / 0.4));
      tufo(ctx, x + Math.cos(a) * d * 22 * e, ty - 6 * e + Math.sin(a) * d * 11 * e, (5 + rnd() * 4) * e * v, amarelo, rnd, 5); }
    if (gc > 0.6) { ctx.fillStyle = '#F2C230'; for (let i = 0; i < 14; i++) { ctx.globalAlpha = (gc - 0.6) * 2.2; ctx.beginPath(); ctx.arc(x + (rnd() - 0.5) * 50 * e, y + (rnd() - 0.3) * 8 * e, 1.3 * e, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
  },
  araucaria(ctx, x, y, e, g, rnd) {
    const pal = VERDES.araucaria, gt = saida(clamp(g / 0.55)), gc = clamp((g - 0.3) / 0.7), H = 70 * e * gt;
    sombra(ctx, x + 7 * e, y + 1, (6 + 26 * gc) * e, (2 + 5 * gc) * e);
    tronco(ctx, x, y, H, 5.5 * e * (0.4 + 0.6 * gt), 0, ['#8A6A4A', '#4A3424', '#6A4E36']);
    // galhos que saem do alto do tronco e sobem nas pontas
    const ramos = [[-1, 0.95, 26], [1, 0.95, 27], [-1, 0.86, 20], [1, 0.87, 21], [-0.45, 1, 13], [0.5, 1, 14], [-1, 0.78, 13], [1, 0.79, 12]];
    const pontas = ramos.map(([s, at, L], i) => {
      const v = saida(clamp((gc - i * 0.05) / 0.5)), by = y - H * at, ex = x + s * L * e * v, ey = by - (6 + L * 0.28) * e * v;
      ctx.strokeStyle = '#4A3424'; ctx.lineWidth = 1.8 * e; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + s * L * e * v * 0.75, by + 1.5 * e, ex, ey); ctx.stroke();
      return { ex, ey, v, s, i };
    });
    const escuro = [pal[1], pal[2], '#0E2410'];
    pontas.sort((p, q) => p.ey - q.ey).forEach((p) => {   // tufos densos: sombra embaixo, folhagem por cima
      for (let j = 0; j < 4; j++) { const ox = (rnd() - 0.5) * 9 * e, oy = (rnd() - 0.3) * 4 * e, r = (5.5 + rnd() * 3) * e * p.v;
        tufo(ctx, p.ex + ox + 1.5 * e, p.ey + oy + 2.5 * e, r, escuro, rnd, 0); tufo(ctx, p.ex + ox, p.ey + oy, r * 0.92, pal, rnd, 5); }
    });
  },
  mandacaru(ctx, x, y, e, g, rnd) {
    const gt = saida(clamp(g)), H = 56 * e * gt, w = 8.5 * e;
    sombra(ctx, x + 6 * e, y + 1, 18 * e * gt + 2, 4 * e * gt + 1);
    const coluna = (cx, by, h, ww) => {
      if (h <= 1) return;
      const gr = ctx.createLinearGradient(cx - ww / 2, 0, cx + ww / 2, 0);
      gr.addColorStop(0, '#2C5A36'); gr.addColorStop(0.3, '#6FAF72'); gr.addColorStop(0.6, '#3F7F4A'); gr.addColorStop(1, '#1E4228');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(cx - ww / 2, by); ctx.lineTo(cx - ww / 2, by - h + ww / 2); ctx.arc(cx, by - h + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(cx + ww / 2, by); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(16,40,20,.35)'; ctx.lineWidth = 0.7; for (const f of [-0.22, 0.08, 0.3]) { ctx.beginPath(); ctx.moveTo(cx + f * ww, by); ctx.lineTo(cx + f * ww, by - h + ww * 0.6); ctx.stroke(); }
    };
    const bracos = [[-1, 0.42, 0.62], [1, 0.55, 0.5], [1, 0.3, 0.38]];
    bracos.forEach(([s, at, alt], i) => { const v = saida(clamp((g - 0.35 - i * 0.12) / 0.45)); if (v <= 0) return;
      const by = y - H * at, bx = x + s * (w * 0.5 + 6 * e * v);
      ctx.strokeStyle = '#3F7F4A'; ctx.lineWidth = w * 0.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(bx, by, bx, by - 4 * e); ctx.stroke();
      coluna(bx, by - 2 * e, H * alt * v, w * 0.75); });
    coluna(x, y, H, w);
    if (g > 0.9) { ctx.globalAlpha = (g - 0.9) * 10; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + 1, y - H - 1.5 * e, 2.6 * e, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#F2D36A'; ctx.beginPath(); ctx.arc(x + 1, y - H - 1.5 * e, 1 * e, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  },
  palmeira(ctx, x, y, e, g, rnd) {
    const gt = saida(clamp(g / 0.55)), gf = clamp((g - 0.3) / 0.7), H = 62 * e * gt, curva = (rnd() - 0.5) * 14 * e;
    sombra(ctx, x + 8 * e, y + 1, (6 + 16 * gf) * e, (2 + 4 * gf) * e);
    ctx.strokeStyle = '#8A7A62'; ctx.lineWidth = 3.4 * e; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + curva, y - H * 0.5, x + curva * 0.6, y - H); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = 3.6 * e;
    for (let k = 1; k < 9; k++) { const t = k / 9, px = x + 2 * (1 - t) * t * curva + t * t * curva * 0.6, py = y - H * t; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(px - 1.6 * e, py); ctx.lineTo(px + 1.6 * e, py); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const tx = x + curva * 0.6, ty = y - H, F = 8;
    for (let k = 0; k < F; k++) {
      const v = saida(clamp((gf - k * 0.05) / 0.55)); if (v <= 0) continue;
      const a0 = -Math.PI / 2 + (k / (F - 1) - 0.5) * 2.9, L = 26 * e * v, caida = 0.55 + 0.6 * Math.abs(Math.cos(a0)) * v;
      const ex = tx + Math.cos(a0) * L, ey = ty + Math.sin(a0) * L * 0.6 + L * caida * 0.5, mx = tx + Math.cos(a0) * L * 0.55, my = ty + Math.sin(a0) * L * 0.55 - 3 * e;
      ctx.strokeStyle = '#3E6E2A'; ctx.lineWidth = 1.3 * e; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
      for (let j = 1; j < 10; j++) { const t = j / 10, px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * my + t * t * ey;
        const fl = (1 - t * 0.6) * 7 * e * v; ctx.strokeStyle = j % 2 ? '#5E9E3A' : '#3A7A2A'; ctx.lineWidth = 1.1 * e;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - fl * 0.5, py + fl); ctx.moveTo(px, py); ctx.lineTo(px + fl * 0.5, py + fl); ctx.stroke(); }
    }
  },
  arbusto(ctx, x, y, e, g, rnd, bio) {
    const pal = VERDES[bio.verde], v0 = saida(clamp(g));
    sombra(ctx, x + 3 * e, y + 1, 16 * e * v0 + 1, 4 * e * v0 + 1);
    const cl = Array.from({ length: 8 }, (_, i) => ({ x: x + (rnd() - 0.5) * 22 * e, y: y - (4 + rnd() * 9) * e, r: (5 + rnd() * 4) * e, i })).sort((p, q) => p.y - q.y);
    cl.forEach((k) => tufo(ctx, k.x, k.y, k.r * saida(clamp((g - k.i * 0.05) / 0.6)), pal, rnd, 4));
    if (g > 0.75) { for (let i = 0; i < 6; i++) { ctx.globalAlpha = clamp((g - 0.75) * 4); ctx.fillStyle = bio.flor[i % 3];
      ctx.beginPath(); ctx.arc(x + (rnd() - 0.5) * 22 * e, y - (5 + rnd() * 10) * e, 1.4 * e, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
  },
  capim(ctx, x, y, e, g, rnd, bio, c, t = 0) {
    const n = 18, alto = (bio.verde === 'cerrado' ? 26 : 18) * e;
    for (let i = 0; i < n; i++) {
      const bx = x + (rnd() - 0.5) * 18 * e, h = alto * (0.55 + rnd() * 0.45) * saida(clamp((g - i * 0.02) / 0.6)), lado = (rnd() - 0.5) * 1.6;
      if (h < 0.5) continue;
      const vento = Math.sin(t * 1.6 + bx * 0.08) * 2.2 * e * (h / alto);
      const tx = bx + lado * h * 0.5 + vento, ty = y - h;
      ctx.fillStyle = ['#7FAE45', '#5E8F32', '#9CC25A', '#4A7A2A'][i % 4];
      ctx.beginPath(); ctx.moveTo(bx - 1.3 * e, y); ctx.quadraticCurveTo(bx + lado * h * 0.15, y - h * 0.6, tx, ty); ctx.quadraticCurveTo(bx + lado * h * 0.15 + 0.6 * e, y - h * 0.6, bx + 1.3 * e, y); ctx.fill();
    }
  },
  flores(ctx, x, y, e, g, rnd, bio) {
    PLANTAS.capim(ctx, x, y, e * 0.7, g, rnd, { verde: 'campo' });
    for (let i = 0; i < 7; i++) {
      const fx = x + (rnd() - 0.5) * 26 * e, h = (8 + rnd() * 10) * e * saida(clamp((g - 0.2 - i * 0.04) / 0.5)), v = saida(clamp((g - 0.5 - i * 0.04) / 0.4));
      if (h < 0.5) continue;
      ctx.strokeStyle = '#4E7F2A'; ctx.lineWidth = 0.9 * e; ctx.beginPath(); ctx.moveTo(fx, y); ctx.quadraticCurveTo(fx + 1.5 * e, y - h * 0.5, fx, y - h); ctx.stroke();
      if (v <= 0) continue;
      const cor = bio.flor[i % bio.flor.length], r = 2.1 * e * v;
      ctx.fillStyle = cor; for (let p = 0; p < 5; p++) { const a = p * 1.2566 + i; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * r, y - h + Math.sin(a) * r, r * 0.85, r * 0.6, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#E8B23A'; ctx.beginPath(); ctx.arc(fx, y - h, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
  },
};
// tamanho reservado para guardar cada planta pronta como imagem (largura, altura, base)
const CAIXA = { folhosa: [80, 96], tortuosa: [64, 64], ipe: [72, 72], araucaria: [100, 104], mandacaru: [48, 72], palmeira: [86, 96], arbusto: [44, 30], capim: [44, 36], flores: [44, 30] };

// ---------- o que fica no chão seco ----------
const SECOS = {
  morta(ctx, x, y, e, rnd) {
    sombra(ctx, x + 3 * e, y + 1, 12 * e, 3 * e, 0.18);
    const cor = ['#7D7266', '#5E544A'];
    const ramo = (x1, y1, a, L, w, n) => { const x2 = x1 + Math.cos(a) * L, y2 = y1 + Math.sin(a) * L; galho(ctx, x1, y1, x2, y2, w, cor[n % 2]);
      if (n < 3) { ramo(x2, y2, a - 0.45 - rnd() * 0.3, L * 0.68, w * 0.62, n + 1); if (rnd() < 0.8) ramo(x2, y2, a + 0.4 + rnd() * 0.3, L * 0.62, w * 0.6, n + 1); } };
    ramo(x, y, -Math.PI / 2 + (rnd() - 0.5) * 0.2, 20 * e, 4 * e, 0);
  },
  toco(ctx, x, y, e) {
    sombra(ctx, x + 3 * e, y + 1, 10 * e, 2.6 * e, 0.2);
    const g = ctx.createLinearGradient(x - 6 * e, 0, x + 6 * e, 0); g.addColorStop(0, '#5E544A'); g.addColorStop(0.4, '#8D8274'); g.addColorStop(1, '#4E463E');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 6 * e, y); ctx.lineTo(x - 5 * e, y - 9 * e); ctx.lineTo(x + 5 * e, y - 9 * e); ctx.lineTo(x + 6 * e, y); ctx.fill();
    ctx.fillStyle = '#B4A894'; ctx.beginPath(); ctx.ellipse(x, y - 9 * e, 5 * e, 1.8 * e, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(80,66,52,.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x, y - 9 * e, 2.6 * e, 0.9 * e, 0, 0, Math.PI * 2); ctx.stroke();
  },
  pedra(ctx, x, y, e, rnd) {
    for (let k = 0; k < 3; k++) { const px = x + (k - 1) * 7 * e + (rnd() - 0.5) * 3 * e, r = (3 + rnd() * 4) * e;
      sombra(ctx, px + 2, y + 1, r * 1.3, r * 0.4, 0.22);
      const g = ctx.createRadialGradient(px - r * 0.4, y - r * 0.7, r * 0.1, px, y - r * 0.4, r * 1.2); g.addColorStop(0, '#D8D0C2'); g.addColorStop(1, '#7C746A');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, y - r * 0.45, r, r * 0.65, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  palha(ctx, x, y, e, rnd) {
    for (let i = 0; i < 12; i++) { const bx = x + (rnd() - 0.5) * 16 * e, h = (5 + rnd() * 8) * e, lado = (rnd() - 0.5) * 2.4;
      ctx.strokeStyle = ['#B39A70', '#9A8460', '#C4AE84'][i % 3]; ctx.lineWidth = 1.1 * e; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(bx + lado * h * 0.3, y - h * 0.7, bx + lado * h, y - h * 0.6); ctx.stroke(); }
  },
  caatinga(ctx, x, y, e, rnd) {   // a caatinga seca fica cinza-clara, cheia de galhos finos
    sombra(ctx, x + 3 * e, y + 1, 14 * e, 3 * e, 0.16);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 1.8, L = (8 + rnd() * 12) * e;
      galho(ctx, x + (rnd() - 0.5) * 6 * e, y, x + Math.cos(a) * L, y + Math.sin(a) * L, 1.2 * e, i % 2 ? '#A8A096' : '#8A8278'); }
  },
};

// ---------- fauna ----------
// aves: cada espécie com as cores de verdade (corpo, asa, ponta das penas, barriga, rosto)
const AVES = {
  gralha: { corpo: ['#3C82E2', '#1B4C9F'], cabeca: '#15181D', bico: '#15181D', cauda: '#1F58B9', barriga: '#3069C8', asa: '#2C70D8', ponta: '#163C86', tam: 1 },
  tucano: { corpo: ['#2C2927', '#131211'], cabeca: '#1B1A19', bico: 'tucano', cauda: '#131211', barriga: '#1E1C1B', asa: '#262321', ponta: '#0C0B0A', tam: 1.05, garganta: '#FBEFB8' },
  caninde: { corpo: ['#3A97E8', '#1763B4'], cabeca: '#2F86DA', testa: '#3FA868', bico: 'arara', cauda: '#2272C6', barriga: '#F6C531', asa: '#2F86DA', ponta: '#0F4A8E', tam: 1.1, longa: true, face: '#F4F1EC' },
  asabranca: { corpo: ['#A89C93', '#7A6E65'], cabeca: '#958981', bico: '#3A3430', cauda: '#64594F', barriga: '#C9BDB3', asa: '#8C8077', ponta: '#5A5048', tam: 0.9, faixa: '#F6F3EE' },
  arara: { corpo: ['#EC4237', '#B3251F'], cabeca: '#EF4C40', bico: 'arara', cauda: '#C92C25', barriga: '#E3382F', asa: '#F2C230', ponta: '#2F6FD0', tam: 1.15, longa: true, face: '#F7F2EA' },
  generica: { corpo: ['#474B42', '#262922'], cabeca: '#2E312A', bico: '#2E312A', cauda: '#262922', barriga: '#777B70', asa: '#3A3E35', ponta: '#1C1E19', tam: 0.85 },
};
function olho(ctx, x, y, r) {
  ctx.fillStyle = '#0E0E0E'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.35, r * 0.38, 0, Math.PI * 2); ctx.fill();
}
function bicoAve(ctx, A, hx, hy, r) {
  if (A.bico === 'tucano') {
    const gb = ctx.createLinearGradient(hx + r * 0.6, 0, hx + r * 4, 0); gb.addColorStop(0, '#F7C340'); gb.addColorStop(0.65, '#F2781E'); gb.addColorStop(0.92, '#C8401A'); gb.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(hx + r * 0.7, hy - r * 0.75); ctx.quadraticCurveTo(hx + r * 3, hy - r * 1.05, hx + r * 4.1, hy + r * 0.25);
    ctx.quadraticCurveTo(hx + r * 2.6, hy + r * 0.75, hx + r * 0.7, hy + r * 0.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,10,.35)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(hx + r * 0.8, hy); ctx.quadraticCurveTo(hx + r * 2.5, hy + r * 0.05, hx + r * 4, hy + r * 0.25); ctx.stroke();
  } else if (A.bico === 'arara') {   // bico curvo e forte
    ctx.fillStyle = '#E9E2D6'; ctx.beginPath(); ctx.moveTo(hx + r * 0.6, hy - r * 0.7); ctx.quadraticCurveTo(hx + r * 1.9, hy - r * 0.8, hx + r * 1.85, hy + r * 0.85);
    ctx.lineTo(hx + r * 1.35, hy + r * 0.45); ctx.quadraticCurveTo(hx + r * 1.2, hy + r * 0.1, hx + r * 0.7, hy + r * 0.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2A2622'; ctx.beginPath(); ctx.moveTo(hx + r * 0.7, hy + r * 0.2); ctx.quadraticCurveTo(hx + r * 1.3, hy + r * 0.25, hx + r * 1.3, hy + r * 0.7); ctx.quadraticCurveTo(hx + r * 0.9, hy + r * 0.8, hx + r * 0.6, hy + r * 0.55); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = A.bico; ctx.beginPath(); ctx.moveTo(hx + r * 0.75, hy - r * 0.35); ctx.lineTo(hx + r * 1.9, hy + r * 0.12); ctx.lineTo(hx + r * 0.75, hy + r * 0.4); ctx.closePath(); ctx.fill();
  }
}
function cabecaAve(ctx, A, hx, hy, r) {
  ctx.fillStyle = A.cabeca; ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
  if (A.testa) { ctx.fillStyle = A.testa; ctx.beginPath(); ctx.arc(hx + r * 0.25, hy - r * 0.45, r * 0.62, Math.PI * 1.05, Math.PI * 2.05); ctx.fill(); }
  if (A.face) { ctx.fillStyle = A.face; ctx.beginPath(); ctx.ellipse(hx + r * 0.42, hy + r * 0.12, r * 0.55, r * 0.48, 0.3, 0, Math.PI * 2); ctx.fill(); }
  if (A.garganta) { ctx.fillStyle = A.garganta; ctx.beginPath(); ctx.ellipse(hx + r * 0.35, hy + r * 0.62, r * 0.62, r * 0.5, 0.2, 0, Math.PI * 2); ctx.fill(); }
  bicoAve(ctx, A, hx, hy, r);
  olho(ctx, hx + r * 0.32, hy - r * 0.22, r * 0.27);
  // brilho no alto da cabeça
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(hx - r * 0.25, hy - r * 0.4, r * 0.45, 0, Math.PI * 2); ctx.fill();
}
function avePousada(ctx, x, y, esp, t, seed, dir) {
  const A = AVES[esp] || AVES.generica, s = A.tam;
  const bob = Math.max(0, Math.sin(t * 2.2 + seed)) ** 6, vira = Math.sin(t * 0.21 + seed * 3) > 0.6 ? -dir : dir;
  ctx.save(); ctx.translate(x, y); ctx.scale(vira * s, s);
  sombra(ctx, 1, 0.5, 8, 2, 0.25);
  ctx.strokeStyle = '#5A4A3A'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-0.6, 0); ctx.lineTo(0, -4.4); ctx.moveTo(2.2, 0); ctx.lineTo(2, -4.4); ctx.moveTo(-1.6, 0); ctx.lineTo(1, 0); ctx.moveTo(1.4, 0); ctx.lineTo(3.6, 0); ctx.stroke();
  // cauda
  const cl = A.longa ? 16 : 10.5;
  ctx.fillStyle = A.cauda; ctx.beginPath(); ctx.moveTo(-3.5, -8.4); ctx.quadraticCurveTo(-cl * 0.65, -4, -cl, A.longa ? 4.5 : 1.2);
  ctx.lineTo(-cl + 3.2, A.longa ? 5.4 : 2.6); ctx.quadraticCurveTo(-cl * 0.4, -1.4, -1.5, -5.2); ctx.closePath(); ctx.fill();
  // corpo em gota: peito redondo, costas descendo para a cauda
  const g = ctx.createLinearGradient(0, -15, 0, -3); g.addColorStop(0, A.corpo[0]); g.addColorStop(1, A.corpo[1]);
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(-6.2, -6.6); ctx.bezierCurveTo(-5.2, -12.4, 1, -14.4, 4.6, -12.6); ctx.bezierCurveTo(8.2, -11, 8.1, -5.8, 5, -3.6); ctx.bezierCurveTo(2, -2, -3.2, -2.9, -6.2, -6.6); ctx.fill();
  ctx.fillStyle = A.barriga; ctx.beginPath(); ctx.moveTo(5.8, -10.6); ctx.bezierCurveTo(8.2, -8, 6.6, -4.4, 4, -3.7); ctx.bezierCurveTo(1.4, -3.1, -0.2, -4.6, 0.4, -6.2); ctx.bezierCurveTo(1.4, -8.6, 3.6, -10.6, 5.8, -10.6); ctx.fill();
  // asa dobrada, com a ponta das penas mais escura
  ctx.fillStyle = A.asa; ctx.beginPath(); ctx.moveTo(3.4, -11.2); ctx.bezierCurveTo(-1, -11.8, -6.4, -9.2, -9.6, -5.4); ctx.bezierCurveTo(-5.2, -4.8, 0, -5.4, 3.2, -7.6); ctx.closePath(); ctx.fill();
  if (A.faixa) { ctx.fillStyle = A.faixa; ctx.beginPath(); ctx.moveTo(1.8, -10.4); ctx.bezierCurveTo(-1, -10.6, -3.4, -9.4, -4.6, -8.2); ctx.bezierCurveTo(-2.4, -8.2, 0, -8.6, 2.2, -9.2); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = A.ponta; ctx.beginPath(); ctx.moveTo(-2.6, -8.8); ctx.bezierCurveTo(-5.4, -8, -7.8, -6.8, -9.6, -5.4); ctx.bezierCurveTo(-6.4, -5.2, -4.2, -5.6, -1.8, -6.6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(1.5, -9.6); ctx.quadraticCurveTo(-3, -8.6, -7.2, -6.2); ctx.moveTo(0.8, -8.2); ctx.quadraticCurveTo(-3, -7.2, -6, -5.8); ctx.stroke();
  cabecaAve(ctx, A, 5.2, -13.6 - bob * 0.7, 3.6);
  ctx.restore();
}
// ave em voo: corpo, cabeça e cauda de verdade; as asas batem mas sempre têm largura (nunca viram um traço)
function aveVoando(ctx, x, y, t, fase, esc, esp) {
  const A = AVES[esp] || AVES.generica, b = Math.sin(t * 8 + fase), k = esc * A.tam;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  const asa = (span, cor, ponta, ox, oy, atraso) => {
    const bb = Math.sin(t * 8 + fase - atraso), dx = -0.5 - 0.35 * (1 - Math.abs(bb)), dy = -bb;
    const ang = Math.atan2(dy, dx), L = span * (0.62 + 0.38 * Math.abs(bb)), w = 4.4 + 1.8 * (1 - Math.abs(bb));
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, cor); g.addColorStop(0.55, cor); g.addColorStop(1, ponta);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(0, -w * 0.55); ctx.quadraticCurveTo(L * 0.55, -w * 0.85, L, -w * 0.05);   // borda da frente, curva
    // borda de trás recortada em penas
    ctx.quadraticCurveTo(L * 0.9, w * 0.35, L * 0.78, w * 0.22); ctx.quadraticCurveTo(L * 0.7, w * 0.6, L * 0.56, w * 0.42);
    ctx.quadraticCurveTo(L * 0.45, w * 0.78, L * 0.32, w * 0.55); ctx.quadraticCurveTo(L * 0.15, w * 0.75, 0, w * 0.5); ctx.closePath(); ctx.fill();
    if (A.faixa) { ctx.fillStyle = A.faixa; ctx.beginPath(); ctx.moveTo(L * 0.18, -w * 0.15); ctx.quadraticCurveTo(L * 0.45, -w * 0.3, L * 0.62, -w * 0.05); ctx.quadraticCurveTo(L * 0.42, w * 0.2, L * 0.18, w * 0.15); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };
  asa(11, shade(A.asa, -0.28), shade(A.ponta, -0.2), 1.6, -1.6, 0.25);   // asa de trás
  const cl = A.longa ? 15 : 10;
  ctx.fillStyle = A.cauda; ctx.beginPath(); ctx.moveTo(-5.5, -1.2); ctx.lineTo(-cl, -2.4); ctx.quadraticCurveTo(-cl - 1, 0.2, -cl, 1.8); ctx.lineTo(-5.5, 0.8); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(0, -3.6, 0, 2.4); g.addColorStop(0, A.corpo[0]); g.addColorStop(0.55, A.corpo[1]); g.addColorStop(1, A.barriga);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-7, -0.4); ctx.bezierCurveTo(-4, -3.6, 3, -3.8, 6.4, -1.8); ctx.bezierCurveTo(7.6, -0.6, 6.2, 1.8, 3, 2.1); ctx.bezierCurveTo(-1, 2.7, -5, 1.6, -7, -0.4); ctx.fill();
  cabecaAve(ctx, A, 6.6, -1.9, 2.6);
  asa(12.5, A.asa, A.ponta, 0.6, -1.2, 0);   // asa da frente
  ctx.restore();
}
function borboleta(ctx, x, y, t, fase, cores, esc = 1) {
  const abre = 0.25 + 0.75 * Math.abs(Math.sin(t * 11 + fase));
  ctx.save(); ctx.translate(x, y); ctx.scale(esc, esc); ctx.rotate(Math.sin(t * 2 + fase) * 0.25);
  [[-1], [1]].forEach(([s]) => {
    ctx.fillStyle = cores[0]; ctx.beginPath(); ctx.ellipse(s * 3.2 * abre, -1.6, 3.4 * abre, 2.6, s * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 2.4 * abre, 1.8, 2.4 * abre, 1.9, -s * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cores[1]; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(s * 3.2 * abre, -1.6, 3.4 * abre, 2.6, s * 0.5, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.strokeStyle = '#1A1410'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, 3); ctx.stroke();
  ctx.restore();
}
// bichos de chão: silhueta contínua (corpo, pescoço e cabeça numa curva só, que se dobra para pastar),
// patas com as articulações de verdade (ombro, cotovelo, joelho, jarrete), luz de cima, pelagem e marcha diagonal
// pts: contorno em pé [x, y, peso]; peso 0 = corpo, 1 = cabeça (o que gira e desce para pastar), entre os dois = pescoço
const BICHOS = {
  capivara: {
    pts: [[-14, -6, 0], [-15.8, -10.6, 0], [-13, -15.8, 0], [-5, -18, 0], [3.5, -17.8, 0], [8, -17, 0.5], [11, -17.6, 1], [15, -16.8, 1], [18.4, -15.2, 1], [19.8, -12.6, 1], [19, -10.4, 1], [14.5, -9.8, 1], [10.4, -9.4, 0.5], [8.4, -7.4, 0], [4.5, -5.4, 0], [-3, -4.8, 0], [-10, -5.2, 0]],
    piv: [8, -13], gira: 0.5, desce: 3, cor: ['#946A44', '#6E4A2C'], costas: '#5A3B22', barriga: '#A9845D',
    pata: { f: [5.5, -7.5, 3.8, 2.5], b: [-9.6, -8.5, 4.8, 2.6], cor: '#5E4028', ponta: '#3A2716', tipo: 'dedos' },
    orelha: { tipo: 'redonda', x: 10.6, y: -17.6, r: 1.7 }, olho: [14.9, -15.2, 0.85], nariz: [19.2, -12.9, 0.9],
  },
  veado: {
    pts: [[-11, -17.4, 0], [-12.6, -21.2, 0], [-8, -24.4, 0], [0, -24.8, 0], [6, -25.4, 0], [8.4, -28.6, 0.35], [10, -33.2, 0.8], [11, -35.4, 1], [13.6, -35.4, 1], [16.6, -33.4, 1], [17.7, -32.2, 1], [16.2, -31.2, 1], [12.8, -31.4, 1], [12, -29.8, 0.8], [12, -26, 0.4], [11, -21.4, 0.1], [9, -18.4, 0], [5, -17.2, 0], [-2, -16.8, 0], [-8, -17.2, 0]],
    piv: [8.6, -25], gira: 1.15, desce: 11, cor: ['#C08A50', '#94653A'], costas: '#7E5530', barriga: '#EFE2C8',
    pata: { f: [8.4, -18.6, 3, 1.3], b: [-8.6, -19.4, 4.4, 1.3], cor: '#8C5E34', ponta: '#241A12', tipo: 'casco' },
    orelha: { tipo: 'folha', x: 11.2, y: -35.4, comp: 4.6, larg: 1.7 }, olho: [13.8, -34.2, 0.8], nariz: [17.4, -32.3, 0.85],
    cauda: 'flag', garganta: '#F7EFE0', chifre: true,
  },
  lobo: {
    pts: [[-11, -21, 0], [-12.6, -24.6, 0], [-6, -28.4, 0], [1, -28.8, 0], [6, -29.4, 0], [8.2, -31.8, 0.35], [10, -34.6, 0.8], [12, -35.9, 1], [14.2, -35.5, 1], [19, -33.2, 1], [20.4, -32.4, 1], [18.8, -31.5, 1], [14.2, -31.3, 1], [12.2, -30.6, 0.8], [11.6, -27.8, 0.4], [10.6, -24.4, 0.1], [8.4, -21.4, 0], [4, -20.5, 0], [-3, -20.1, 0], [-8.5, -20.6, 0]],
    piv: [8.6, -28], gira: 1.2, desce: 12, cor: ['#DE7A34', '#B45A22'], costas: '#9E4A18', barriga: '#EBA864',
    pata: { f: [8, -22.6, 2.9, 1.5], b: [-8.6, -23.2, 4, 1.5], cor: '#B45A22', ponta: '#141110', tipo: 'pata', meia: '#191513' },
    orelha: { tipo: 'alta', x: 12.4, y: -35.8, comp: 6.4, larg: 2.6 }, olho: [14.6, -34.2, 0.8], nariz: [20.2, -32.6, 0.95],
    cauda: 'peluda', crina: true, garganta: '#F5E9D8', focinho: '#1A1614',
  },
  prea: {
    pts: [[-7, -2.4, 0], [-8.2, -5.4, 0], [-5.4, -8.8, 0], [0, -9.8, 0], [3.8, -9.2, 0], [5.4, -8.8, 0.6], [7, -9.4, 1], [9.4, -8.6, 1], [11.2, -6.6, 1], [10.2, -4.9, 1], [7.2, -4.4, 1], [5.6, -3.6, 0.5], [4.4, -2.4, 0], [0, -1.8, 0], [-4.6, -2, 0]],
    piv: [5, -6], gira: 0.45, desce: 1.6, cor: ['#958470', '#6A5A48'], costas: '#5A4C3C', barriga: '#BCAC94',
    pata: { f: [4, -3, 2, 1.3], b: [-4.8, -3.4, 2.6, 1.3], cor: '#5E5040', ponta: '#3E3428', tipo: 'dedos' },
    orelha: { tipo: 'redonda', x: 6.8, y: -9.6, r: 1.3 }, olho: [8.8, -7.6, 0.7], nariz: [11, -6.6, 0.6],
  },
  anta: {
    pts: [[-17, -9.6, 0], [-19.2, -15.6, 0], [-14.6, -22.4, 0], [-4, -24.2, 0], [5.6, -22.8, 0], [9, -23, 0.35], [12, -21.6, 0.8], [15.6, -19.8, 1], [20, -17.2, 1], [22.6, -14.4, 1], [21.4, -12.6, 1], [18.6, -13.2, 1], [14.6, -13.8, 1], [11.6, -14.2, 0.7], [10.4, -12.2, 0.3], [9, -9.4, 0], [4, -8, 0], [-5, -7.6, 0], [-13, -8.4, 0]],
    piv: [10, -17], gira: 0.6, desce: 3, cor: ['#57514D', '#3C3734'], costas: '#2E2A28', barriga: '#4E4844',
    pata: { f: [6, -10.4, 5, 3], b: [-12, -11.4, 6.2, 3.2], cor: '#3A3532', ponta: '#1E1B1A', tipo: 'dedos' },
    orelha: { tipo: 'anta', x: 12.6, y: -22, r: 2.2 }, olho: [15.8, -18.9, 0.7], nariz: [22.2, -14, 0.7], cauda: 'curta', topete: true,
  },
};
function curvaFechada(pts) {   // Catmull-Rom fechada → Bézier: contorno orgânico passando por todos os pontos
  const p = new Path2D(), n = pts.length, k = 1 / 6;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n], d = pts[(i + 2) % n];
    p.bezierCurveTo(b[0] + (c[0] - a[0]) * k, b[1] + (c[1] - a[1]) * k, c[0] - (d[0] - b[0]) * k, c[1] - (d[1] - b[1]) * k, c[0], c[1]);
  }
  p.closePath(); return p;
}
function segmento(ctx, x1, y1, x2, y2, w1, w2) {   // trecho afilado com pontas redondas
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a);
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); ctx.lineTo(x2 + nx * w2 / 2, y2 + ny * w2 / 2);
  ctx.arc(x2, y2, w2 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  ctx.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2);
  ctx.arc(x1, y1, w1 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  ctx.fill();
}
// uma pata: ângulos a partir da vertical (positivo = para a frente); a cadeia é escalada para o casco tocar o chão
function pata(ctx, P, x, yTop, wT, wB, ph, andar, tras, longe, gradCorpo) {
  const Q = P.pata, L = -yTop, balanco = Math.sin(ph) * 0.36 * andar, ergue = Math.max(0, Math.cos(ph)) * andar;
  const ang = tras ? [0.38 + balanco, -0.55 + balanco * 0.6 - ergue * 0.25, 0.06 + balanco * 0.3 + ergue * 0.55, 0.5] : [-0.12 + balanco, 0.06 + balanco, 0 + balanco * 0.4 - ergue * 0.9, 0.42 - ergue * 0.4];
  const fr = tras ? [0.3, 0.32, 0.3, 0.08] : [0.3, 0.34, 0.28, 0.08];
  let queda = 0; ang.forEach((a, i) => (queda += Math.cos(a) * fr[i]));
  const alvo = L - ergue * L * 0.14, esc = alvo / queda;
  const pts = [[x, yTop]]; ang.forEach((a, i) => { const [px, py] = pts[i]; pts.push([px + Math.sin(a) * fr[i] * esc, py + Math.cos(a) * fr[i] * esc]); });
  const ws = tras ? [wT, wT * 0.62, wB * 1.25, wB * 1.05, wB] : [wT, wT * 0.7, wB * 1.2, wB * 1.05, wB];
  const escurece = (c) => (longe ? shade(c, -0.3) : c);
  for (let i = 0; i < 4; i++) {
    // o alto da pata usa o mesmo degradê do corpo: coxa e paleta se fundem ao corpo, sem disco por cima
    ctx.fillStyle = Q.meia && i >= (tras ? 2 : 1) ? escurece(Q.meia) : i === 0 ? (gradCorpo || escurece(P.cor[1])) : escurece(Q.cor);
    segmento(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], ws[i], ws[i + 1]);
  }
  const [hx, hy] = pts[4];
  ctx.fillStyle = escurece(Q.ponta); ctx.beginPath();
  if (Q.tipo === 'casco') { ctx.moveTo(hx - wB * 0.55, hy - wB * 0.9); ctx.lineTo(hx + wB * 0.7, hy - wB * 0.9); ctx.lineTo(hx + wB * 1.05, hy); ctx.lineTo(hx - wB * 0.6, hy); ctx.closePath(); }
  else ctx.ellipse(hx + wB * 0.35, hy - wB * 0.35, wB * 0.95, wB * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}
function bicho(ctx, x, y, esp, t, dir, andar, pastar, esc = 1) {
  const P = BICHOS[esp], ph = t * 6.4;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * esc, esc);
  const xs = P.pts.map((p) => p[0]), comp = Math.max(...xs) - Math.min(...xs);
  sombra(ctx, 1, 0.6, comp * 0.5, 3.2, 0.3);
  // o corpo sobe e desce de leve a cada passo; a cabeça acompanha
  const sobe = -Math.abs(Math.sin(ph)) * 0.55 * andar, ang = pastar * P.gira, desce = pastar * P.desce;
  const [pvx, pvy] = P.piv, cabeca = Math.sin(ph * 2) * 0.04 * andar;
  const T = (px, py, w) => { const a = (ang + cabeca) * w, dx = px - pvx, dy = py - pvy;
    return [pvx + dx * Math.cos(a) - dy * Math.sin(a), pvy + dx * Math.sin(a) + dy * Math.cos(a) + desce * w + sobe]; };
  const contorno = P.pts.map(([px, py, w]) => T(px, py, w)), corpo = curvaFechada(contorno);
  const topo = Math.min(...contorno.map((p) => p[1])), base = Math.max(...P.pts.filter((p) => !p[2]).map((p) => p[1])) + sobe;
  const Q = P.pata;
  // patas de longe (mais escuras), em marcha diagonal
  pata(ctx, P, Q.f[0] + 1.6, Q.f[1] + sobe, Q.f[2], Q.f[3], ph + Math.PI, andar, false, true);
  pata(ctx, P, Q.b[0] + 1.6, Q.b[1] + sobe, Q.b[2], Q.b[3], ph, andar, true, true);
  // cauda, atrás do corpo
  const balanca = Math.sin(t * 1.9) * (0.6 + andar * 0.6);
  if (P.cauda === 'peluda') {
    const [bx, by] = [P.pts[1][0] + 0.6, P.pts[1][1] + 0.8 + sobe], m = [bx - 4.5, by + 6 + balanca], f = [bx - 6.4, by + 12.5 + balanca * 1.4];
    ctx.fillStyle = P.cor[1]; segmento(ctx, bx, by, m[0], m[1], 3.2, 5); segmento(ctx, m[0], m[1], f[0], f[1], 5, 3.4);
    ctx.fillStyle = '#F7EFE4'; segmento(ctx, f[0] + 0.4, f[1] - 2.2, f[0], f[1] + 0.4, 3.6, 2.4);
  } else if (P.cauda === 'flag') {
    ctx.fillStyle = '#FBF7F0'; ctx.beginPath(); ctx.ellipse(P.pts[1][0] + 0.2, P.pts[1][1] - 0.6 + sobe, 1.8, 3, -0.5 + balanca * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.costas; ctx.beginPath(); ctx.ellipse(P.pts[1][0] + 0.8, P.pts[1][1] - 1.8 + sobe, 1.1, 1.6, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (P.cauda === 'curta') { ctx.fillStyle = P.cor[1]; segmento(ctx, P.pts[1][0] + 0.8, P.pts[1][1] + 0.6 + sobe, P.pts[1][0] - 0.6, P.pts[1][1] + 4 + sobe, 2.2, 1.4); }
  // corpo: costas mais escuras, flancos, barriga clara
  const g = ctx.createLinearGradient(0, topo, 0, base);
  g.addColorStop(0, P.costas); g.addColorStop(0.28, P.cor[0]); g.addColorStop(0.72, P.cor[1]); g.addColorStop(1, P.barriga);
  ctx.fillStyle = g; ctx.fill(corpo);
  ctx.save(); ctx.clip(corpo);
  // luz do alto à esquerda e sombra embaixo da barriga
  const lx = P.pts[3][0], ly = P.pts[3][1] + sobe;
  const luz = ctx.createRadialGradient(lx - 2, ly + 2, 0, lx - 2, ly + 2, comp * 0.42); luz.addColorStop(0, 'rgba(255,248,235,.24)'); luz.addColorStop(1, 'rgba(255,248,235,0)');
  ctx.fillStyle = luz; ctx.fillRect(-40, -60, 90, 70);
  const ao = ctx.createLinearGradient(0, base - 4, 0, base); ao.addColorStop(0, 'rgba(20,14,8,0)'); ao.addColorStop(1, 'rgba(20,14,8,.22)');
  ctx.fillStyle = ao; ctx.fillRect(-40, base - 4, 90, 6);
  // músculo da coxa e da paleta, só insinuados
  ctx.strokeStyle = 'rgba(30,18,8,.16)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); const [bx0, by0] = Q.b; ctx.arc(bx0 + 1.2, by0 - (P.pts[2][1] - by0) * -0.2 + sobe - 3.2, Math.min(6, Q.b[2] * 1.15), Math.PI * 0.55, Math.PI * 1.6); ctx.stroke();
  ctx.beginPath(); const [fx0, fy0] = Q.f; ctx.arc(fx0 - 0.5, fy0 + sobe - 3, Math.min(5, Q.f[2] * 1.1), Math.PI * 1.45, Math.PI * 2.35); ctx.stroke();
  // pelagem: tracinhos curtos e claros/escuros
  const r = semente(esp.length * 97);
  for (let i = 0; i < 34; i++) { const px = P.pts[1][0] + r() * comp * 0.8, py = topo + 1 + r() * (base - topo - 2), a = 0.5 + r() * 0.5;
    ctx.strokeStyle = i % 3 ? 'rgba(40,24,10,.14)' : 'rgba(255,245,225,.14)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(a) * 1.6, py + Math.sin(a) * 1.2); ctx.stroke(); }
  // manchas próprias: garganta clara, focinho preto, crina
  if (P.garganta) { const [gx, gy] = T(P.pts[P.pts.length > 18 ? 13 : 11][0] + 0.6, P.pts[P.pts.length > 18 ? 13 : 11][1] - 0.4, 0.9); ctx.fillStyle = P.garganta; ctx.beginPath(); ctx.ellipse(gx, gy, 2.1, 1.5, ang * 0.9 + 0.2, 0, Math.PI * 2); ctx.fill(); }
  if (P.focinho) { const [nx, ny] = T(P.nariz[0] - 1.4, P.nariz[1] + 0.5, 1); ctx.fillStyle = P.focinho; ctx.beginPath(); ctx.ellipse(nx, ny, 2.4, 1.3, ang + 0.25, 0, Math.PI * 2); ctx.fill(); }
  if (P.crina) { ctx.fillStyle = 'rgba(22,18,16,.92)'; const c1 = T(4, -29.6, 0), c2 = T(8.6, -32.6, 0.4), c3 = T(10.6, -35.2, 0.85);
    ctx.beginPath(); ctx.moveTo(c1[0] - 3, c1[1] + 0.8); ctx.quadraticCurveTo(c1[0], c1[1] - 1.6, c2[0], c2[1] - 0.6); ctx.quadraticCurveTo(c3[0] - 0.4, c3[1] - 0.6, c3[0] + 0.4, c3[1] + 0.8);
    ctx.quadraticCurveTo(c2[0] + 1.6, c2[1] + 1.6, c1[0] + 2.2, c1[1] + 2.6); ctx.closePath(); ctx.fill(); }
  if (P.topete) { const a1 = T(5, -22.6, 0), a2 = T(9.6, -23, 0.4), a3 = T(12, -21.8, 0.8); ctx.strokeStyle = 'rgba(20,18,17,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(...a1); ctx.quadraticCurveTo(...a2, ...a3); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = shade(P.cor[1], -0.4); ctx.globalAlpha = 0.45; ctx.lineWidth = 0.55; ctx.stroke(corpo); ctx.globalAlpha = 1;
  // patas de perto, por cima da barriga
  pata(ctx, P, Q.f[0], Q.f[1] + sobe, Q.f[2], Q.f[3], ph, andar, false, false, g);
  pata(ctx, P, Q.b[0], Q.b[1] + sobe, Q.b[2], Q.b[3], ph + Math.PI, andar, true, false, g);
  // orelha (mexe de vez em quando), chifres, olho e narina
  const O = P.orelha, tremida = Math.pow(Math.max(0, Math.sin(t * 0.9 + esp.length)), 24) * 0.35, [ox, oy] = T(O.x, O.y, 1);
  ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang - tremida);
  if (O.tipo === 'redonda') { ctx.fillStyle = P.costas; ctx.beginPath(); ctx.arc(0, 0, O.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = shade(P.barriga, -0.15); ctx.beginPath(); ctx.arc(0.3, 0.2, O.r * 0.5, 0, Math.PI * 2); ctx.fill(); }
  else if (O.tipo === 'folha') { ctx.rotate(-0.9); ctx.fillStyle = P.cor[1]; ctx.beginPath(); ctx.ellipse(0, -O.comp * 0.5, O.larg, O.comp * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#E9D4B6'; ctx.beginPath(); ctx.ellipse(0.3, -O.comp * 0.45, O.larg * 0.45, O.comp * 0.36, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (O.tipo === 'alta') { ctx.rotate(-0.15); ctx.fillStyle = P.cor[0]; ctx.beginPath(); ctx.moveTo(-O.larg * 0.6, 0.6); ctx.quadraticCurveTo(-O.larg * 0.55, -O.comp * 0.6, -0.2, -O.comp); ctx.quadraticCurveTo(O.larg * 0.45, -O.comp * 0.5, O.larg * 0.6, 0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F2D4B4'; ctx.beginPath(); ctx.moveTo(-O.larg * 0.25, 0); ctx.quadraticCurveTo(-O.larg * 0.25, -O.comp * 0.55, -0.15, -O.comp * 0.78); ctx.quadraticCurveTo(O.larg * 0.2, -O.comp * 0.45, O.larg * 0.3, 0); ctx.closePath(); ctx.fill(); }
  else if (O.tipo === 'anta') { ctx.fillStyle = shade(P.cor[0], -0.08); ctx.beginPath(); ctx.ellipse(0, -O.r * 0.6, O.r * 0.8, O.r, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#E6DFD4'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(0, -O.r * 0.6, O.r * 0.8, O.r, -0.3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  ctx.restore();
  if (P.chifre) { const [cx, cy] = T(12.6, -35.6, 1); ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.strokeStyle = '#6A4E34'; ctx.lineWidth = 0.85; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-0.8, -3, -0.2, -5.8); ctx.moveTo(-0.5, -2.8); ctx.lineTo(1.4, -4); ctx.moveTo(-0.4, -4.4); ctx.lineTo(-2, -5.6); ctx.stroke(); ctx.restore(); }
  const [ex, ey] = T(P.olho[0], P.olho[1], 1); olho(ctx, ex, ey, P.olho[2]);
  const [nx, ny] = T(P.nariz[0], P.nariz[1], 1); ctx.fillStyle = 'rgba(16,12,10,.85)'; ctx.beginPath(); ctx.ellipse(nx, ny, P.nariz[2] * 0.75, P.nariz[2] * 0.5, ang, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, m = (v) => Math.round(clamp(v * (1 + f), 0, 255)); return `rgb(${m(r)},${m(g)},${m(b)})`; }

// ---------- chão no visual anterior (cores e rachaduras do tema) ----------
const PAL = {
  claro: { seco: '#CFC9BE', racha: '#9E968A', grama: '#A3D05A', grama2: '#86BB3F', grama3: '#C6E58A', eSeca: '#BCB5A9', eSecaB: '#968E82', eViva: '#8CC63F', eVivaB: '#5A962A', morroS: '#C3BCB0', morroV: '#93C64C' },
  escuro: { seco: '#3A3833', racha: '#57534B', grama: '#3F6E26', grama2: '#4D8030', grama3: '#5A8F36', eSeca: '#4A4741', eSecaB: '#2F2D29', eViva: '#6FA33A', eVivaB: '#3F6B20', morroS: '#45423C', morroV: '#4A7F2B' },
};
function mistura(a, b, k) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; }
const PADROES = {};
// rachaduras que se emendam sozinhas: células de Voronoi num ladrilho que "dá a volta" nas bordas,
// então a textura repete sem nenhuma costura (nem na vertical, nem na horizontal, nem entre capítulos)
function rachaduras(c, T, d, celulas, cor, larg, alfa, pular, seed) {
  const rnd = semente(seed), g = Math.round(Math.sqrt(celulas)), pts = [];
  for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) pts.push([(i + 0.15 + rnd() * 0.7) * T / g, (j + 0.15 + rnd() * 0.7) * T / g]);
  const n = pts.length, peso = (i, k) => { const h = Math.sin((Math.min(i, k) * 73.1 + Math.max(i, k) * 19.7) * 12.9898) * 43758.5453; return h - Math.floor(h); };
  const N = T * d, img = c.getImageData(0, 0, N, N), px = img.data, [r, gg, b] = [1, 3, 5].map((k) => parseInt(cor.slice(k, k + 2), 16)), aa = 0.75;
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
    const x = (xx + 0.5) / d, y = (yy + 0.5) / d; let d1 = 1e9, d2 = 1e9, i1 = 0, i2 = 0;
    for (let k = 0; k < n; k++) { let dx = Math.abs(x - pts[k][0]), dy = Math.abs(y - pts[k][1]); if (dx > T / 2) dx = T - dx; if (dy > T / 2) dy = T - dy;
      const dd = dx * dx + dy * dy; if (dd < d1) { d2 = d1; i2 = i1; d1 = dd; i1 = k; } else if (dd < d2) { d2 = dd; i2 = k; } }
    const h = peso(i1, i2); if (h < pular) continue;   // algumas rachaduras ficam pela metade, como na terra de verdade
    const borda = (Math.sqrt(d2) - Math.sqrt(d1)) / 2, w = larg * (0.55 + 0.8 * h), a = Math.max(0, Math.min(1, (w / 2 + aa - borda) / aa)) * alfa;
    if (a <= 0) continue;
    const o = (yy * N + xx) * 4, ja = px[o + 3] / 255, na = a + ja * (1 - a);
    px[o] = (r * a + px[o] * ja * (1 - a)) / na; px[o + 1] = (gg * a + px[o + 1] * ja * (1 - a)) / na; px[o + 2] = (b * a + px[o + 2] * ja * (1 - a)) / na; px[o + 3] = na * 255;
  }
  c.putImageData(img, 0, 0);
}
// ladrilho de cada textura (em unidades da tela) e a escala do padrão: rachas e estrada são geradas em dobro para ficarem nítidas
const LADRILHO = { rachas: [220, 0.5], estrada: [72, 0.5], grama: [46, 1] };
function padrao(nome, P) {
  const chave = nome + P.seco; if (PADROES[chave]) return PADROES[chave];
  const cv = document.createElement('canvas'), d = 2;
  if (nome === 'rachas') {
    const T = LADRILHO.rachas[0]; cv.width = cv.height = T * d; const c = cv.getContext('2d');
    rachaduras(c, T, d, 81, P.racha, 0.75, 0.5, 0.45, 11);   // fissuras finas por baixo
    rachaduras(c, T, d, 16, P.racha, 1.9, 1, 0.1, 7);         // rachaduras principais
  } else if (nome === 'estrada') {
    const T = LADRILHO.estrada[0]; cv.width = cv.height = T * d; const c = cv.getContext('2d');
    c.fillStyle = P.eSeca; c.fillRect(0, 0, cv.width, cv.height);
    rachaduras(c, T, d, 9, P.eSecaB, 1.4, 1, 0.15, 5);
  } else {
    const t = LADRILHO.grama[0]; cv.width = cv.height = t * d; const c = cv.getContext('2d'); c.scale(d, d); c.lineCap = 'round';
    c.strokeStyle = P.grama2; c.lineWidth = 1.5; ['M6 30q1-4 3-7M10 30q0-5-2-8', 'M30 12q1-4 3-6M34 12q0-4-2-7', 'M36 40q1-3 3-5'].forEach((s) => c.stroke(new Path2D(s)));
    c.fillStyle = P.grama3; [[20, 22, 1.3], [42, 26, 1]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
  }
  return (PADROES[chave] = cv);
}

// ---------- uma cena por capítulo ----------
export class CenaTrilha {
  // cfg: { canvas, c, W, H, ox, oy, d (caminho SVG), pts, premios: [{x, y, tipo, feito, novo}], completo, yF, yAnt, animar, reduzido, escuro }
  constructor(cfg) {
    Object.assign(this, cfg);
    this.bio = BIOMAS[this.c];
    this.caminho = new Path2D(this.d);
    this.t0 = performance.now(); this.yCur = this.animar ? this.yAnt : this.yF;
    const rnd = semente(1000 + this.c * 77);
    // onde não pode ter planta: em cima da estrada e dos círculos
    const teste = document.createElement('canvas').getContext('2d'); teste.lineWidth = 64;
    const livre = (x, y) => !teste.isPointInStroke(this.caminho, x, y) && this.pts.every(([px, py]) => Math.hypot(px - x, py - y) > 46) && this.premios.every((p) => Math.hypot(p.x - x, p.y - y) > 26);
    // a paisagem ocupa a largura inteira da tela (não só os 350 px da trilha): sem faixas vazias nas laterais
    this.medirLargura();
    const xa = this.xa, xb = this.xb, largura = xb - xa, topoLivre = -this.oy;
    this.itens = [];
    const total = Math.round(30 * Math.max(1, largura / this.W));
    for (let k = 0, tent = 0; k < total && tent < 600; tent++) {
      const borda = rnd() < 0.72, lado = rnd() < 0.5 ? -1 : 1;
      const x = borda ? (lado < 0 ? xa - 8 + rnd() * (70 + (0 - xa)) : xb + 8 - rnd() * (70 + (xb - this.W))) : xa + 20 + rnd() * (largura - 40), y = 20 + rnd() * (this.H - 10);
      if (!livre(x, y)) continue;
      const tipo = this.bio.arvores[k % this.bio.arvores.length], grande = ['folhosa', 'araucaria', 'palmeira', 'ipe'].includes(tipo);
      if (y - (grande ? 118 : 44) < topoLivre + 2) continue;   // nada cortado pela borda de cima do capítulo
      const seco = this.c === 3 && rnd() < 0.6 ? 'caatinga' : grande ? (rnd() < 0.7 ? 'morta' : 'toco') : rnd() < 0.5 ? 'palha' : 'pedra';
      this.itens.push({ tipo, seco, x, y, e: (tipo === 'palmeira' ? 1.15 : grande ? 0.75 : 0.9) + rnd() * 0.35, seed: 1 + Math.floor(rnd() * 1e6), atraso: rnd() * 0.5, vivo: false, tV: -1e9 });
      k++;
    }
    // prêmios dos círculos concluídos: a árvore do bioma, capim, flores, ave e borboletas
    this.premios.forEach((p, i) => {
      const base = { x: p.x, y: p.y, seed: 50 + i * 31 + this.c * 7, atraso: 0, vivo: false, tV: -1e9, premio: true };
      if (p.tipo === 'arvore') this.itens.push({ ...base, tipo: this.bio.principal, seco: this.c === 3 ? 'caatinga' : 'morta', e: 1.2 });
      else if (p.tipo === 'capim') this.itens.push({ ...base, tipo: 'arbusto', seco: 'palha', e: 1.15 });
      else if (p.tipo === 'flores') this.itens.push({ ...base, tipo: 'flores', seco: 'palha', e: 1.2 });
      else if (p.tipo === 'passaro') { this.itens.push({ ...base, tipo: this.c === 3 ? 'tortuosa' : 'arbusto', seco: 'toco', e: 0.85 }); this.novaAve(p.x + 14, p.y + 2); this.novaAve(p.x - 30, p.y + 10); }
      else if (p.tipo === 'borboleta') { this.itens.push({ ...base, tipo: 'flores', seco: 'pedra', e: 1.1 }); this.itens.push({ ...base, y: p.y - 18, borboletas: 3, atraso: 0.8 }); }
    });
    // bichos de chão do bioma: mais bichos conforme a região volta; atravessam a área verde, param para pastar e seguem
    this.rnd = rnd;
    const n = this.premios.length, qtd = n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
    this.andarilhos = Array.from({ length: qtd }, (_, k) => {
      const entra = this.animar && k === qtd - 1, dir = rnd() < 0.5 ? 1 : -1;
      return { esp: this.bio.bicho, esc: k === 2 ? 0.75 : k ? 0.88 : 1, x: entra ? (dir > 0 ? this.xa - 50 : this.xb + 50) : this.xa + 30 + rnd() * (this.xb - this.xa - 60), y: 0, yRel: 0.25 + rnd() * 0.6,
        dir, alvo: null, pausa: entra ? 2.6 : rnd() * 2, pastar: 0, andar: 0, fase: rnd() * 10, entra };
    });
    this.aves = this.aves || [];
    this.revoadas = [];
    this.proxRevoada = 1.2 + rnd() * 2.5;
    this.cv = this.canvas.getContext('2d');
    this.dimensionar();
    // na primeira pintura, o que já está vivo aparece pronto (sem crescer de novo)
    this.atualizarVivos(0, true);
  }
  novaAve(x, y) {
    (this.aves = this.aves || []).push({ esp: this.bio.ave, x, y, de: null, para: null, t0: 0, dur: 0, dir: 1, prox: 3 + Math.random() * 6, chegando: this.animar });
  }
  // faixa verde onde os bichos podem andar (entre a frente e o fim do capítulo)
  faixaViva() { const topo = Math.max(16, this.frente(this.W / 2) + 26), fundo = this.H - 10; return fundo > topo + 8 ? [topo, fundo] : null; }
  medirLargura() {   // limites da tela em coordenadas da trilha (a trilha tem 350 px; a tela pode ser mais larga)
    const cw = this.canvas.clientWidth;
    this.xa = cw ? Math.min(-12, -this.ox) : -12; this.xb = cw ? Math.max(this.W + 12, cw - this.ox) : this.W + 12;
  }
  dimensionar() {
    const dpr = DPR(), cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    this.cw = cw; this.ch = ch; this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr); this.dpr = dpr;
  }
  frente(x) { return this.yCur + Math.sin(x * 0.045 + this.c) * 12 + Math.sin(x * 0.11 + this.c * 2) * 6; }
  atualizarVivos(seg, inicio) {
    this.itens.forEach((it) => {
      const v = it.y > this.frente(it.x) - (it.premio ? 4 : 0);
      if (v && !it.vivo) { it.vivo = true; it.tV = inicio ? -1e9 : seg + it.atraso; }
      else if (!v && it.vivo) { it.vivo = false; it.tV = -1e9; }
    });
  }
  pintar(agora) {
    if (this.canvas.clientWidth !== this.cw || this.canvas.clientHeight !== this.ch) this.dimensionar();
    if (this.trilho) { this.ox = this.trilho.offsetLeft; this.oy = this.trilho.offsetTop; this.medirLargura(); }   // o caminho acompanha os círculos mesmo se o layout mudar
    if (!this.cw) return true;
    const ctx = this.cv, seg = (agora - this.t0) / 1000, r = this.reduzido;
    if (this.animar && !r) { const k = clamp((seg - 0.35) / 2.6); this.yCur = this.yAnt + (this.yF - this.yAnt) * vaiVolta(k); }
    else this.yCur = this.yF;
    this.atualizarVivos(seg, false);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cw, this.ch);
    ctx.translate(this.ox, this.oy);
    const x0 = -this.ox - 4, x1 = this.cw - this.ox + 4, y0 = -this.oy - 4, y1 = this.ch - this.oy + 4;
    // chão no visual anterior: terra cinza rachada que vira grama verde numa faixa suave; morros nas bordas
    const P = this.escuro ? PAL.escuro : PAL.claro, yc = this.yCur, M = 64, W0 = x1 - x0, H0 = y1 - y0;
    const gr = ctx.createLinearGradient(0, yc - M, 0, yc + M); gr.addColorStop(0, P.seco); gr.addColorStop(1, P.grama);
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, W0, H0);
    // texturas alinhadas à rolagem inteira (não a cada capítulo): rachaduras e grama continuam de um capítulo para o outro
    const yMundo = (this.canvas.parentElement?.offsetTop || 0) + this.oy;
    const alinhar = (pat, nome) => { const k = LADRILHO[nome][1]; try { pat.setTransform(new DOMMatrix([k, 0, 0, k, 0, -yMundo])); } catch {} return pat; };
    this.camada(ctx, (c) => { c.fillStyle = alinhar(c.createPattern(padrao('rachas', P), 'repeat'), 'rachas'); c.fillRect(x0, y0, W0, H0); }, true, x0, y0, W0, H0);
    this.camada(ctx, (c) => { c.fillStyle = alinhar(c.createPattern(padrao('grama', P), 'repeat'), 'grama'); c.fillRect(x0, y0, W0, H0); }, false, x0, y0, W0, H0);
    // estrada: rachada e cinza onde falta; verde onde a pessoa já passou
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.eSecaB; ctx.lineWidth = 30; ctx.stroke(this.caminho);
    ctx.strokeStyle = alinhar(ctx.createPattern(padrao('estrada', P), 'repeat'), 'estrada'); ctx.lineWidth = 24; ctx.stroke(this.caminho);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, yc, W0, y1 - yc + 10); ctx.clip();
    ctx.strokeStyle = P.eVivaB; ctx.lineWidth = 30; ctx.stroke(this.caminho);
    ctx.strokeStyle = P.eViva; ctx.lineWidth = 24; ctx.stroke(this.caminho);
    ctx.restore();
    // revoadas: sombra no chão primeiro
    this.voar(seg, ctx, true);
    // plantas e bichos de trás para a frente
    const dt = Math.max(0, Math.min(0.1, seg - (this.tUlt ?? seg))); this.tUlt = seg;
    this.moverFauna(seg, dt);
    const lista = this.itens.concat(this.andarilhos.filter((a) => a.vis).map((a) => ({ andarilho: a, y: a.y })), this.aves.filter((a) => !a.para && a.vis).map((a) => ({ pousada: a, y: a.y })))
      .sort((a, b) => a.y - b.y);
    for (const it of lista) {
      if (it.andarilho) { const a = it.andarilho; bicho(ctx, a.x, a.y, a.esp, this.reduzido ? 0 : seg + a.fase, a.dir, a.andar, a.pastar, a.esc); }
      else if (it.pousada) avePousada(ctx, it.pousada.x, it.pousada.y, it.pousada.esp, this.reduzido ? 0 : seg, 3, it.pousada.dir);
      else this.desenharItem(ctx, it, seg);
    }
    this.aves.filter((a) => a.para && a.vis).forEach((a) => {   // aves em voo por cima de tudo, com sombra no chão
      const k = clamp((seg - a.t0) / a.dur), e = vaiVolta(k), x = a.de[0] + (a.para[0] - a.de[0]) * e, yb = a.de[1] + (a.para[1] - a.de[1]) * e, alto = Math.sin(k * Math.PI) * a.altura;
      sombra(ctx, x + 10, yb + 4, 7, 2, 0.18 * (1 - Math.abs(0.5 - k)));
      ctx.save(); ctx.translate(x, yb - 10 - alto); ctx.scale(a.dir, 1); aveVoando(ctx, 0, 0, seg, 1.3, 1.15, a.esp); ctx.restore();
    });
    this.voar(seg, ctx, false);
    // ainda animando? (crescimento, frente andando ou bichos)
    return !r;
  }
  camada(ctx, desenha, deCima, x0, y0, W0, H0) {   // desenha numa camada que some suavemente na faixa da frente
    const o = this.off || (this.off = document.createElement('canvas'));
    if (o.width !== this.canvas.width || o.height !== this.canvas.height) { o.width = this.canvas.width; o.height = this.canvas.height; }
    const c = o.getContext('2d'), yc = this.yCur, M = 64;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, o.width, o.height);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.translate(this.ox, this.oy);
    desenha(c);
    c.globalCompositeOperation = 'destination-in';
    const g = c.createLinearGradient(0, yc - M, 0, yc + M);
    g.addColorStop(0, deCima ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)'); g.addColorStop(1, deCima ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
    c.fillStyle = g; c.fillRect(x0, y0, W0, H0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(o, 0, 0); ctx.restore();
  }
  moverFauna(seg, dt) {
    const fx = this.faixaViva(), rnd = this.rnd;
    for (const a of this.andarilhos) {
      a.vis = !!fx; if (!fx) continue;
      if (!a.y) a.y = fx[0] + (fx[1] - fx[0]) * a.yRel;
      a.y = Math.max(fx[0], Math.min(fx[1], a.y));
      if (this.reduzido) { a.andar = 0; a.pastar = 0; continue; }
      if (a.pausa > 0) {   // parado: abaixa a cabeça para pastar, depois escolhe outro destino
        a.pausa -= dt; a.andar = Math.max(0, a.andar - dt * 3); a.pastar = Math.min(1, a.pastar + dt * 1.5);
        if (a.pausa <= 0) {
          const sai = rnd() < 0.25;   // às vezes atravessa a tela inteira e volta pelo outro lado
          a.alvo = [sai ? (a.x < this.W / 2 ? this.xb + 60 : this.xa - 60) : this.xa + 20 + rnd() * (this.xb - this.xa - 40), fx[0] + rnd() * (fx[1] - fx[0])];
          a.vel = 13 + rnd() * 10;
        }
        continue;
      }
      if (!a.alvo) a.alvo = [a.entra ? (a.dir > 0 ? this.xa + 60 + rnd() * 120 : this.xb - 60 - rnd() * 120) : this.xa + 20 + rnd() * (this.xb - this.xa - 40), a.y], a.vel = 16;
      a.pastar = Math.max(0, a.pastar - dt * 2.5); a.andar = Math.min(1, a.andar + dt * 3);
      const dx = a.alvo[0] - a.x, dy = a.alvo[1] - a.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 2) a.dir = dx > 0 ? 1 : -1;
      if (d < 2) {
        if (a.x < this.xa - 40 || a.x > this.xb + 40) { a.x = a.x < this.W / 2 ? this.xb + 55 : this.xa - 55; a.alvo = [a.x < this.W / 2 ? this.xa + 40 + rnd() * 100 : this.xb - 40 - rnd() * 100, a.y]; continue; }
        a.alvo = null; a.pausa = 1.5 + rnd() * 3.5; continue;
      }
      const passo = Math.min(d, a.vel * dt); a.x += (dx / d) * passo; a.y += (dy / d) * passo;
    }
    // aves do bioma: pousam, esperam um pouco e voam para outro ponto (às vezes para fora e voltam)
    for (const a of this.aves) {
      a.vis = !!fx || !!a.para; if (!fx && !a.para) continue;
      if (this.reduzido) { a.para = null; continue; }
      if (a.chegando) { a.chegando = false; a.de = [a.x < this.W / 2 ? this.xa - 40 : this.xb + 40, a.y - 80]; a.para = [a.x, a.y]; a.t0 = seg + 1.6; a.dur = 2.2; a.altura = 30; a.dir = a.para[0] > a.de[0] ? 1 : -1; }
      if (a.para) { if (seg >= a.t0 + a.dur) { a.x = a.para[0]; a.y = a.para[1]; a.para = null; a.prox = seg + 4 + rnd() * 7; } else if (seg < a.t0) { a.vis = false; } continue; }
      if (seg > a.prox && fx) {
        const arvores = this.itens.filter((it) => it.tipo && it.vivo && it.y > fx[0] && ['folhosa', 'araucaria', 'ipe', 'tortuosa', 'palmeira', 'mandacaru', 'arbusto'].includes(it.tipo));
        const alvo = arvores.length && rnd() < 0.6 ? (() => { const it = arvores[Math.floor(rnd() * arvores.length)]; return [it.x + (rnd() - 0.5) * 20, it.y + 4]; })()
          : [this.xa + 20 + rnd() * (this.xb - this.xa - 40), fx[0] + rnd() * (fx[1] - fx[0])];
        a.de = [a.x, a.y]; a.para = alvo; a.t0 = seg; a.dur = 1.6 + Math.hypot(alvo[0] - a.x, alvo[1] - a.y) / 140; a.altura = 24 + rnd() * 30; a.dir = alvo[0] >= a.x ? 1 : -1;
      }
    }
  }
  crescimento(it, seg, dur = 2.2) { if (!it.vivo) return 0; if (it.tV < -1e8 || this.reduzido) return 1; return saida(clamp((seg - it.tV) / dur)); }
  desenharItem(ctx, it, seg) {
    const g = this.crescimento(it, seg, it.premio ? 2.6 : 2.2);
    const vento = this.reduzido ? 0 : Math.sin(seg * 0.9 + it.seed) * 0.018 + Math.sin(seg * 2.3 + it.seed * 2) * 0.006;
    if (it.tipo) {
      // o seco desbota enquanto o vivo cresce
      const aSeco = it.vivo ? 1 - clamp(g * 2.2) : 1;
      if (aSeco > 0.01 && it.seco) { ctx.globalAlpha = aSeco; SECOS[it.seco](ctx, it.x, it.y, it.e * 0.95, semente(it.seed)); ctx.globalAlpha = 1; }
      if (g > 0.001) {
        ctx.save(); ctx.translate(it.x, it.y); ctx.transform(1, 0, vento * (it.tipo === 'capim' || it.tipo === 'flores' ? 2 : 1), 1, 0, 0); ctx.translate(-it.x, -it.y);
        if (g >= 1 && it.tipo !== 'capim') this.sprite(ctx, it);
        else PLANTAS[it.tipo](ctx, it.x, it.y, it.e, g, semente(it.seed), this.bio, this.c, seg);
        ctx.restore();
      }
    } else if (it.ave && g > 0) {
      const chega = saida(clamp((seg - it.tV) / 1.6)), voo = it.tV < -1e8 || this.reduzido ? 1 : chega;
      if (voo < 1) { const px = it.x - 80 * (1 - voo), py = it.y - 60 * (1 - voo) * (1 - voo); ctx.save(); ctx.translate(px, py - 8); aveVoando(ctx, 0, 0, seg, it.seed, 0.9, it.ave); ctx.restore(); }
      else avePousada(ctx, it.x, it.y, it.ave, this.reduzido ? 0 : seg, it.seed, 1);
    } else if (it.borboletas && g > 0) {
      for (let k = 0; k < it.borboletas; k++) { const f = it.seed + k * 2.1, ts = this.reduzido ? k : seg;
        borboleta(ctx, it.x + Math.sin(ts * 0.9 + f) * 22 + Math.sin(ts * 2.1 + f) * 6, it.y + Math.cos(ts * 1.3 + f) * 10 - k * 4, ts, f, k === 1 ? ['#FFFFFF', '#6A6A6A'] : this.bio.borboleta, 1.5 * g); }
    } else if (it.bicho && g > 0) {
      const ts = this.reduzido ? 0 : seg, fase = ts * 0.12 + it.seed, pos = Math.sin(fase), vel = Math.cos(fase);
      const andar = clamp(Math.abs(vel) * 1.6 - 0.25), pastar = suave(clamp(1 - Math.abs(vel) * 2.2));
      const chegada = it.tV < -1e8 || this.reduzido ? 1 : saida(clamp((seg - it.tV) / 2.5));
      ctx.globalAlpha = chegada;
      bicho(ctx, it.x + pos * it.faixa + (1 - chegada) * -60, it.y, it.bicho, ts, vel >= 0 ? 1 : -1, chegada < 1 ? 1 : andar, chegada < 1 ? 0 : pastar, it.esc);
      ctx.globalAlpha = 1;
    }
  }
  sprite(ctx, it) {
    if (!it.img || it.imgEsc !== this.escuro) {
      const [w, h] = CAIXA[it.tipo], e = it.e, dpr = this.dpr, cw = Math.ceil(w * e + 8), ch = Math.ceil(h * e + 8);
      const c = document.createElement('canvas'); c.width = cw * dpr; c.height = ch * dpr;
      const x = c.getContext('2d'); x.scale(dpr, dpr);
      PLANTAS[it.tipo](x, cw / 2, ch - 6, e, 1, semente(it.seed), this.bio, this.c, 0);
      it.img = c; it.imgW = cw; it.imgH = ch; it.imgEsc = this.escuro;
    }
    ctx.drawImage(it.img, it.x - it.imgW / 2, it.y - it.imgH + 6, it.imgW, it.imgH);
  }
  voar(seg, ctx, sombras) {
    if (this.reduzido || this.yCur > this.H + 200) return;
    if (!sombras) {
      if (seg > this.proxRevoada) {
        const rnd = this.rnd, dir = rnd() < 0.5 ? 1 : -1, yMin = Math.max(30, this.frente(this.W / 2) + 20);
        if (yMin < this.H) this.revoadas.push({ t: seg, dir, y: yMin + rnd() * Math.max(10, this.H - yMin - 40), n: 2 + Math.floor(rnd() * 5), esc: 0.8 + rnd() * 0.5, v: 46 + rnd() * 24, esp: rnd() < 0.35 ? this.bio.ave : 'generica' });
        this.proxRevoada = seg + 4 + rnd() * 5;
      }
      this.revoadas = this.revoadas.filter((r) => seg - r.t < 16);
    }
    for (const r of this.revoadas) {
      const dt = seg - r.t, base = r.dir > 0 ? this.xa - 60 + dt * r.v : this.xb + 60 - dt * r.v;
      for (let k = 0; k < r.n; k++) {
        const bx = base - r.dir * k * 14 + Math.sin(k * 3.1) * 6, by = r.y - k * 7 + Math.sin(dt * 1.4 + k) * 4;
        if (sombras) { sombra(ctx, bx + 26, by + 54, 6 * r.esc, 2 * r.esc, 0.16); }
        else { ctx.save(); ctx.translate(bx, by); ctx.scale(r.dir, 1); aveVoando(ctx, 0, 0, seg, k * 1.7, r.esc, r.esp); ctx.restore(); }
      }
    }
  }
}

// ---------- motor: pinta só o que está na tela ----------
const cenas = new Set(); let raf = 0, ativo = () => true;
const visiveis = new IntersectionObserver((es) => es.forEach((e) => { const c = e.target.__cena; if (c) c.visivel = e.isIntersecting; }), { rootMargin: '120px' });
function laco(agora) {
  raf = 0; let continuar = false;
  for (const c of cenas) {
    if (!c.canvas.isConnected) { cenas.delete(c); visiveis.unobserve(c.canvas); continue; }
    if (!c.visivel || !ativo()) { continuar = true; continue; }
    if (c.pintar(agora)) continuar = true;
  }
  if (continuar && !document.hidden) raf = requestAnimationFrame(laco);
}
export function definirAtivo(fn) { ativo = fn; }
export function retomar() { if (!raf && cenas.size) raf = requestAnimationFrame(laco); }
document.addEventListener('visibilitychange', retomar);
export function montarCena(cfg) {
  const c = new CenaTrilha(cfg); c.visivel = true; cfg.canvas.__cena = c; cenas.add(c); visiveis.observe(cfg.canvas);
  c.pintar(performance.now()); retomar(); return c;
}
export function limparCenas() { for (const c of cenas) visiveis.unobserve(c.canvas); cenas.clear(); }

// ---------- destaque da tela de conclusão: o prêmio cresce sozinho num pedaço de grama ----------
export function destaque(canvas, { tipo, c, reduzido }) {
  const bio = BIOMAS[c], dpr = DPR(), W = canvas.clientWidth || 170, H = canvas.clientHeight || 150;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d'), t0 = performance.now();
  const plano = tipo === 'arvore' ? { planta: bio.principal, e: 1.35 } : tipo === 'capim' ? { planta: 'arbusto', e: 1.8 } : tipo === 'flores' ? { planta: 'flores', e: 2 }
    : tipo === 'passaro' ? { planta: 'arbusto', e: 1.3, ave: bio.ave } : { planta: 'flores', e: 1.8, borb: true };
  const quadro = (agora) => {
    if (!canvas.isConnected) return;
    const seg = (agora - t0) / 1000, g = reduzido ? 1 : saida(clamp((seg - 0.25) / 2.4));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H - 26;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, W * 0.42, 22, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = PAL.claro.grama; ctx.fillRect(0, 0, W, H); ctx.fillStyle = ctx.createPattern(padrao('grama', PAL.claro), 'repeat'); ctx.fillRect(0, 0, W, H);
    const v = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.45); v.addColorStop(0.6, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,30,10,.35)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const vento = reduzido ? 0 : Math.sin(seg * 0.9) * 0.02;
    ctx.save(); ctx.translate(cx, cy + 4); ctx.transform(1, 0, vento, 1, 0, 0); ctx.translate(-cx, -cy - 4);
    PLANTAS[plano.planta](ctx, cx, cy + 4, plano.e, g, semente(99), bio, c, seg);
    ctx.restore();
    if (plano.ave && g > 0.6) avePousada(ctx, cx + 30, cy + 8, plano.ave, reduzido ? 0 : seg, 3, -1);
    if (plano.borb) for (let k = 0; k < 3; k++) borboleta(ctx, cx + Math.sin(seg * 0.9 + k * 2) * 40, cy - 40 + Math.cos(seg * 1.3 + k) * 16, reduzido ? k : seg, k * 2.1, k === 1 ? ['#FFFFFF', '#6A6A6A'] : bio.borboleta, 1.6 * clamp(g * 1.5));
    if (!reduzido) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}
