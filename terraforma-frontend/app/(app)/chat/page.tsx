"use client";

// Lista de conversas. Rotas: GET /chats (paginado por cursor), POST /chats, DELETE /chats/:id

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";
import { api, type Chat, type ChatPage } from "@/lib/api";

export default function ConversasPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (depoisDe?: string | null) => {
    setErro(null);
    try {
      const qs = new URLSearchParams({ limit: "20" });
      if (depoisDe) qs.set("cursor", depoisDe);
      const page = await api<ChatPage>(`/chats?${qs.toString()}`);
      setChats((atual) => (depoisDe ? [...atual, ...page.itens] : page.itens));
      setCursor(page.proximoCursor);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar as conversas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function nova() {
    setCriando(true);
    setErro(null);
    try {
      const chat = await api<Chat>("/chats", { method: "POST", body: {} });
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conversa.");
      setCriando(false);
    }
  }

  async function apagar(id: string) {
    if (!window.confirm("Apagar esta conversa e todas as mensagens?")) return;
    try {
      await api(`/chats/${id}`, { method: "DELETE" });
      setChats((atual) => atual.filter((c) => c.id !== id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível apagar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversas</h1>
        <Button onClick={nova} loading={criando}>
          Nova conversa
        </Button>
      </div>

      {erro && <Alert>{erro}</Alert>}

      {carregando ? (
        <p className="py-10 text-center text-sm text-muted">Carregando...</p>
      ) : chats.length === 0 ? (
        <Card className="text-center text-sm text-muted">
          Nenhuma conversa ainda. Toque em “Nova conversa” quando quiser desabafar.
        </Card>
      ) : (
        <ul className="space-y-2">
          {chats.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-2xl border border-line bg-surface/80 pr-2">
              <Link href={`/chat/${c.id}`} className="min-w-0 flex-1 px-4 py-3.5">
                <p className="truncate font-medium">{c.titulo}</p>
                <p className="text-xs text-muted">
                  Atualizada em {new Date(c.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => apagar(c.id)}
                aria-label={`Apagar conversa ${c.titulo}`}
                className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-danger/10 hover:text-danger"
              >
                Apagar
              </button>
            </li>
          ))}
        </ul>
      )}

      {cursor && (
        <Button variant="ghost" className="w-full" onClick={() => void carregar(cursor)}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}
