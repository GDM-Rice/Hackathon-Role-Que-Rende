'use client';
import { useEffect, useRef } from 'react';
import { MARCACAO } from '@/prototipo/marcacao';
import { registrarEvento } from '@/lib/api';
import type { TipoEvento } from '@/lib/tipos';

/**
 * Fase 1 da migração: o protótipo inteiro roda dentro do Next como está.
 * A marcação vem pronta e o motor (prototipo/app.js) liga o comportamento no navegador.
 * Cada ação que importa para o backend chega em registrarEvento() (ver docs/API.md).
 */
export default function Prototipo({ demo = true }: { demo?: boolean }) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;
    // three.js e o motor só carregam no navegador
    import('@/prototipo/app.js').then(({ iniciar }) => {
      if (!ativo) return;
      iniciar({
        assets: '/terra/',
        aoEvento: (tipo: TipoEvento, dados: Record<string, unknown>) => { void registrarEvento(tipo, dados); },
      });
    });
    return () => { ativo = false; };
  }, []);

  return <div ref={raiz} className={demo ? undefined : 'sem-painel'} dangerouslySetInnerHTML={{ __html: MARCACAO }} />;
}
