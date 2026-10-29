// Planeta 3D do Terraforma para o app React (Vite + React 19).
// Instalação: npm i three@0.169.0  ·  texturas em public/terra/
import { useEffect, useRef } from 'react';
import { criarGlobo, estadoDoPlaneta } from '../planeta/globo.js';

/**
 * Props
 *  dias, mares, rios {amazonas, saoFrancisco, parana}, tempestade  -> vêm do estado do app (store)
 *  daltonismo, movimentoReduzido, tema ('claro' | 'escuro')       -> vêm de Ajustes
 *  zoomBrasil   -> true no Mapa-Mundi (aproxima o Brasil)
 *  regiao       -> índice 0..4 para destacar (Sul, Sudeste, Centro-Oeste, Nordeste, Norte) ou -1
 *  respirar     -> true na Maré (o planeta respira 4 s / 6 s)
 *  aoTocarRegiao(indice) -> toque numa região do Brasil
 */
export default function GloboTerra({
  dias = 1, mares = 0, rios = {}, tempestade = false,
  daltonismo = false, movimentoReduzido, tema = 'claro',
  zoomBrasil = false, regiao = -1, respirar = false,
  aoTocarRegiao, className, style,
}) {
  const caixa = useRef(null);
  const globo = useRef(null);
  const cb = useRef(aoTocarRegiao);
  cb.current = aoTocarRegiao;
  const reduzido = movimentoReduzido ?? matchMedia('(prefers-reduced-motion: reduce)').matches;

  // posiciona a esfera dentro da caixa
  const lugar = () => {
    const r = caixa.current.getBoundingClientRect();
    return zoomBrasil
      ? { cx: r.width / 2, cy: r.height / 2, r: r.width * 1.02, opacidade: 1 }
      : { cx: r.width / 2, cy: r.height / 2, r: Math.min(r.width, r.height) / 2 - 8, opacidade: 1 };
  };

  // cria uma vez (o flag "vivo" cobre o duplo mount do StrictMode)
  useEffect(() => {
    let vivo = true;
    criarGlobo(caixa.current, {
      assets: '/terra/',
      estado: estadoDoPlaneta({ dias, mares, rios, tempestade }),
      movimentoReduzido: reduzido,
      aoTocarRegiao: (k) => cb.current?.(k),
    }).then((g) => {
      if (!vivo) { g.dispose(); return; }
      globo.current = g;
      g.irPara(lugar(), 0);
    });
    const ro = new ResizeObserver(() => globo.current?.irPara(lugar(), 0));
    ro.observe(caixa.current);
    return () => { vivo = false; ro.disconnect(); globo.current?.dispose(); globo.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    globo.current?.setEstado(estadoDoPlaneta({ dias, mares, rios, tempestade }));
  }, [dias, mares, rios.amazonas, rios.saoFrancisco, rios.parana, tempestade]);

  useEffect(() => {
    globo.current?.setOpcoes({ daltonismo, movimentoReduzido: reduzido, tema });
  }, [daltonismo, reduzido, tema]);

  useEffect(() => {
    const g = globo.current; if (!g) return;
    g.nuvens(zoomBrasil ? 0.2 : 1);
    if (zoomBrasil) g.focar({ lon: -53, lat: -15 }); else g.focar(g.centroBrasil, true);
    g.irPara(lugar(), 850);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomBrasil]);

  useEffect(() => { globo.current?.focarRegiao(regiao); }, [regiao]);
  useEffect(() => { globo.current?.respirar(respirar); }, [respirar]);

  return <div ref={caixa} className={className} style={{ position: 'relative', ...style }} />;
}
