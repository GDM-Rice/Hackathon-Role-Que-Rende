"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Planet } from "@/components/Planet";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  diasDesde,
  ESTAGIOS,
  indiceEstagio,
  iniciarStreak,
  lerStreak,
  zerarStreak,
  type Streak,
} from "@/lib/streak";

export default function PlanetaPage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [agora, setAgora] = useState<number | null>(null);
  const [confirmandoRecaida, setConfirmandoRecaida] = useState(false);

  // Lê a contagem só no navegador (evita divergência entre servidor e cliente).
  useEffect(() => {
    if (!user) return;
    setStreak(lerStreak(user.id));
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 60_000); // vira o dia sozinho
    return () => clearInterval(t);
  }, [user]);

  if (!user || !streak || agora === null) {
    return <p className="py-10 text-center text-sm text-muted">Carregando...</p>;
  }

  const dias = diasDesde(streak.inicio, agora);
  const idx = indiceEstagio(dias);
  const estagio = ESTAGIOS[idx];
  const proximo = ESTAGIOS[idx + 1];
  const progresso = proximo ? (dias - estagio.min) / (proximo.min - estagio.min) : 1;
  const comecou = streak.inicio !== null;
  const melhor = Math.max(streak.melhor, dias);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="self-start text-sm text-muted">
        Olá, <span className="text-foreground">{user.username}</span>
      </p>

      <Planet estagio={idx} size={260} />

      <div className="text-center">
        <p className="text-6xl font-semibold tabular-nums text-leaf">{dias}</p>
        <p className="mt-1 text-sm text-muted">{dias === 1 ? "dia sem apostar" : "dias sem apostar"}</p>
        <h1 className="mt-4 text-xl font-semibold">{estagio.nome}</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{estagio.descricao}</p>
      </div>

      {comecou && proximo && (
        <div className="w-full max-w-sm">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{estagio.nome}</span>
            <span>
              {proximo.nome} em {proximo.min - dias} {proximo.min - dias === 1 ? "dia" : "dias"}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso * 100)}
          >
            <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${progresso * 100}%` }} />
          </div>
        </div>
      )}

      <Card className="w-full">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Seu recorde</span>
          <span className="font-semibold">
            {melhor} {melhor === 1 ? "dia" : "dias"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!comecou ? (
            <Button onClick={() => setStreak(iniciarStreak(user.id))}>Começar minha contagem hoje</Button>
          ) : confirmandoRecaida ? (
            <>
              <p className="w-full text-sm text-muted">
                Recair não apaga o que você já construiu: seu recorde fica guardado. Quer recomeçar?
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  setStreak(zerarStreak(user.id));
                  setConfirmandoRecaida(false);
                }}
              >
                Sim, recomeçar
              </Button>
              <Button variant="ghost" onClick={() => setConfirmandoRecaida(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmandoRecaida(true)}>
              Tive uma recaída
            </Button>
          )}
        </div>
      </Card>

      <Link
        href="/chat"
        className="w-full rounded-2xl border border-leaf/30 bg-leaf/10 px-5 py-4 text-center text-sm font-medium text-leaf hover:bg-leaf/15"
      >
        Preciso conversar agora
      </Link>
    </div>
  );
}
