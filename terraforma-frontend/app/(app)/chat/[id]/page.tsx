"use client";

// Uma conversa. Rotas: GET /chats/:id (mensagens em ordem cronológica + proximoCursor para as mais antigas),
// POST /chats/:id/messages (o cliente só envia role USER; o ASSISTANT é criado pelo servidor), DELETE /chats/:id.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Alert, Button } from "@/components/ui";
import { api, type ChatDetail, type Message } from "@/lib/api";

// Junta listas de mensagens sem duplicar (por id) e em ordem cronológica.
function mesclar(a: Message[], b: Message[]): Message[] {
  const mapa = new Map<string, Message>();
  [...a, ...b].forEach((m) => mapa.set(m.id, m));
  return [...mapa.values()].sort(
    (x, y) => x.createdAt.localeCompare(y.createdAt) || x.id.localeCompare(y.id),
  );
}

export default function ConversaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [mensagens, setMensagens] = useState<Message[]>([]);
  const [maisAntigas, setMaisAntigas] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const rolarRef = useRef(true);

  const carregar = useCallback(
    async (silencioso = false) => {
      try {
        const d = await api<ChatDetail>(`/chats/${id}?limit=50`);
        setTitulo(d.titulo);
        setMensagens((atual) => mesclar(atual, d.mensagens));
        // só a primeira carga define o cursor das mais antigas; o polling não o sobrescreve
        if (!silencioso) setMaisAntigas(d.proximoCursor);
      } catch (err) {
        if (!silencioso) setErro(err instanceof Error ? err.message : "Não foi possível abrir a conversa.");
      } finally {
        setCarregando(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void carregar();
    // Atualiza a cada 5s: respostas do ASSISTANT criadas pelo servidor aparecem sozinhas.
    const t = setInterval(() => void carregar(true), 5000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    if (rolarRef.current) fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function verAntigas() {
    if (!maisAntigas) return;
    rolarRef.current = false;
    try {
      const d = await api<ChatDetail>(`/chats/${id}?limit=50&cursor=${encodeURIComponent(maisAntigas)}`);
      setMensagens((atual) => mesclar(d.mensagens, atual));
      setMaisAntigas(d.proximoCursor);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar mais.");
    }
  }

  async function enviar(e?: FormEvent) {
    e?.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const msg = await api<Message>(`/chats/${id}/messages`, { method: "POST", body: { conteudo } });
      rolarRef.current = true;
      setMensagens((atual) => mesclar(atual, [msg]));
      setTexto("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  }

  async function apagar() {
    if (!window.confirm("Apagar esta conversa e todas as mensagens?")) return;
    try {
      await api(`/chats/${id}`, { method: "DELETE" });
      router.replace("/chat");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível apagar.");
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link href="/chat" className="text-sm text-muted hover:text-foreground">
          ← Conversas
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center font-semibold">{titulo || "Conversa"}</h1>
        <button type="button" onClick={apagar} className="text-xs text-muted hover:text-danger">
          Apagar
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface/60 p-4">
        {maisAntigas && (
          <Button variant="ghost" className="mx-auto" onClick={() => void verAntigas()}>
            Ver mensagens anteriores
          </Button>
        )}
        {carregando ? (
          <p className="py-10 text-center text-sm text-muted">Carregando...</p>
        ) : mensagens.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Escreva a primeira mensagem. Estamos aqui.</p>
        ) : (
          mensagens.map((m) => (
            <div key={m.id} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "USER" ? "bg-leaf text-[#04210f]" : "border border-line bg-surface-2"
                }`}
              >
                {m.conteudo}
              </div>
            </div>
          ))
        )}
        <div ref={fimRef} />
      </div>

      {erro && (
        <div className="mt-3">
          <Alert>{erro}</Alert>
        </div>
      )}

      <form onSubmit={enviar} className="mt-3 flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={aoTeclar}
          maxLength={4000}
          rows={2}
          placeholder="Escreva sua mensagem (Enter envia, Shift+Enter quebra linha)"
          aria-label="Mensagem"
          className="flex-1 resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted/60 focus:border-leaf focus:outline-none"
        />
        <Button type="submit" loading={enviando} disabled={!texto.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
