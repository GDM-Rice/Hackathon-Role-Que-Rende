"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { api } from "@/lib/api";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    setEnviando(true);
    try {
      // POST /auth/forgot-password — o back responde igual exista ou não o e-mail
      const r = await api<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email },
        auth: false,
      });
      setMsg(r.message);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold">Recuperar senha</h1>
      <p className="mb-4 text-sm text-muted">Enviaremos um link para você criar uma nova senha.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        {erro && <Alert>{erro}</Alert>}
        {msg && <Alert tone="success">{msg}</Alert>}
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" loading={enviando} className="w-full">
          Enviar link
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-muted hover:text-foreground">
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}
